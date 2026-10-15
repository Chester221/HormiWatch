import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../../common/hashing/hashing.service';
import { User } from '../users/entities/user.entity';
import { IJwtPayload } from './interface/payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { NotificationEmitterService } from '../notifications/services/notification-emitter.service';
import { NotificationCategory } from '../notifications/enums/notification-category.enum';
import { NotificationLevel } from '../notifications/enums/notification-level.enum';
import { NotificationEvent } from '../notifications/events/notification.event';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notifications: NotificationEmitterService,
  ) {}

  // ✅ REGISTRO PÚBLICO: crea la cuenta (rol Technician) sin requerir sesión.
  async register(dto: RegisterDto) {
    return this.usersService.registerPublic(
      dto.email,
      dto.password,
      dto.name,
    );
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await Promise.all([
      this.usersService.updateLastConnection(user.id),
      this.usersService.setCurrentRefreshToken(user.id, refreshToken),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        is_active: user.isActive,
        name: user.profile?.name,
        lastName: user.profile?.lastName,
        avatar_url: user.profile?.avatar_url || user.profile?.profilePicture,
        created_at: user.createdAt,
      },
    };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Sesión cerrada correctamente' };
  }

  async deleteAccount(userId: string, force = false): Promise<void> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // ✅ ELIMINACIÓN FORZADA: el usuario decide borrar su cuenta aunque tenga
    // tareas o proyectos asignados. Sus datos NO se pierden: las tareas quedan
    // sin técnico asignado y los proyectos sin líder. Todo en una sola transacción.
    if (force) {
      await this.usersService.forceRemove(userId);
      return;
    }

    try {
      const [{ count: assignedTasks }] = (await this.dataSource.query(
        'SELECT COUNT(*) AS count FROM tasks WHERE technician_id = $1',
        [userId],
      )) as Array<{ count: number }>;
      const [{ count: assignedProjects }] = (await this.dataSource.query(
        'SELECT COUNT(*) AS count FROM projects WHERE project_leader_id = $1',
        [userId],
      )) as Array<{ count: number }>;

      if (Number(assignedTasks) > 0 || Number(assignedProjects) > 0) {
        throw new ConflictException(
          'No se puede eliminar tu cuenta porque tienes tareas o proyectos asignados.',
        );
      }

      await this.usersService.remove(userId);
    } catch (error: any) {
      if (error?.status === 409) {
        throw error;
      }
      if (error?.code === '23503') {
        throw new ConflictException(
          'No se puede eliminar tu cuenta porque tiene registros asociados en el sistema.',
        );
      }
      throw error;
    }
  }

  async getSession(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      is_active: user.isActive,
      profile: user.profile ? {
        first_name: user.profile.name,
        last_name: user.profile.lastName,
        avatar_url: user.profile.avatar_url,
        phone: user.profile.phone,
        position: user.profile.position,
        whatsappPhone: user.profile.whatsappPhone,
      } : null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken);
      const validUser = await this.usersService.getUserIfRefreshTokenMatches(
        payload.sub,
        refreshToken,
      );

      if (!validUser) {
        throw new UnauthorizedException('Token de refresco inválido');
      }

      const newPayload = { sub: validUser.id, role: validUser.role.name };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      await Promise.all([
        this.usersService.updateLastConnection(validUser.id),
        this.usersService.setCurrentRefreshToken(validUser.id, newRefreshToken),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }
  }

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findOneByEmailForAuth(email);
    if (!user) {
      throw new UnauthorizedException('La cuenta no existe');
    }
    // 🚫 Usuarios desactivados no pueden iniciar sesión
    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Tu cuenta está desactivada. Contacta al administrador.',
      );
    }
    const passwordMatches = await this.hashingService.compare(
      pass,
      user.password,
    );
    if (!passwordMatches) {
      // Notificación multicanal: intento de login fallido (crítico de seguridad)
      const hourBucket = new Date().toISOString().slice(0, 13);
      this.notifications.toAdmins(
        'auth.login.failed',
        NotificationCategory.SYSTEM,
        NotificationLevel.CRITICAL,
        'Intento de login fallido',
        `Se registró un intento de inicio de sesión fallido para ${user.email}.`,
        { email: user.email, userId: user.id },
        `auth.login.failed:${user.id}:${hourBucket}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user as User;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await this.hashingService.hash(dto.newPassword);
    await this.usersService.updatePassword(userId, hashedPassword);

    // Notificación multicanal: contraseña cambiada (in-app al usuario)
    this.notifications.emit(
      new NotificationEvent(
        'auth.password.changed',
        NotificationCategory.USERS,
        NotificationLevel.INFO,
        'Contraseña actualizada',
        'Tu contraseña fue actualizada correctamente. Si no fuiste tú, contacta al administrador.',
        { type: 'users', userIds: [userId] },
        { userId },
        null,
      ),
    );

    return { message: 'Contraseña actualizada correctamente' };
  }
}