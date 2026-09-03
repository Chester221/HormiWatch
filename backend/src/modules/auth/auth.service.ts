import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../../common/hashing/hashing.service';
import { User } from '../users/entities/user.entity';
import { IJwtPayload } from './interface/payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
  ) {}

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
        name: user.profile?.name,
        lastName: user.profile?.lastName,
      },
    };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  // ============================================
  // 🟢 NUEVO MÉTODO - getSession()
  // ============================================
  async getSession(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      is_active: user.is_active,
      profile: user.profile ? {
        first_name: user.profile.name,
        last_name: user.profile.lastName,
        avatar_url: user.profile.avatarUrl,
        phone: user.profile.phone,
        position: user.profile.position,
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
        throw new UnauthorizedException('Invalid Refresh Token');
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
      throw new UnauthorizedException('Invalid or expired Refresh Token');
    }
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmailForAuth(email);
    if (user && (await this.hashingService.compare(pass, user.password))) {
      return user as User;
    }
    return null;
  }
}