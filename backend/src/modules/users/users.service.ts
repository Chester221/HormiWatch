import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleService } from '../role/role.service';
import { Role } from '../auth/enums/roles.enum';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { StorageService } from '../storage/services/storage.service';
import { FileValidationService } from '../storage/services/storage-validations.service';
import { Express } from 'express';
import { HashingService } from '../../common/hashing/hashing.service';
import { v4 as uuidv4 } from 'uuid';
import { UserPageOptionsDto, UserOrderBy } from './dto/user-page-options.dto';
import { PageDto } from '../../common/pagination/pagination.dto';
import { PageMeta } from '../../common/pagination/metadata';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { Brackets } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WelcomeMailEvent } from 'src/mails/events/welcome-mail.event';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not configured. Please check SUPABASE_URL and SUPABASE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly roleService: RoleService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly storageService: StorageService,
    private readonly fileValidationService: FileValidationService,
    private readonly hashingService: HashingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findOneByEmailForAuth(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'profile'],
      select: ['id', 'email', 'isActive', 'password', 'role', 'profile'],
    });
    return user;
  }

  async findOneByIdForAuth(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'email', 'isActive', 'role'],
    });
    return user;
  }

  async updateLastConnection(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastConnection: new Date() });
  }

  async setCurrentRefreshToken(userId: string, refreshToken: string) {
    const currentHashedRefreshToken =
      await this.hashingService.hash(refreshToken);
    await this.userRepository.update(userId, {
      refreshToken: currentHashedRefreshToken,
    });
  }

  async getUserIfRefreshTokenMatches(
    userId: string,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'refreshToken', 'role'],
      relations: ['role'],
    });

    if (!user || !user.refreshToken) {
      return null;
    }

    const isRefreshTokenMatching = await this.hashingService.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
    return null;
  }

  async removeRefreshToken(userId: string) {
    return this.userRepository.update(userId, {
      refreshToken: null as unknown as string,
    });
  }

  async create(
    createUserDto: CreateUserDto,
    profilePicture?: Express.Multer.File,
  ) {
    const { roleId, ...userData } = createUserDto;
    let uploadedFileKey: string | null = null;
    let profilePictureUrl: string | undefined = undefined;

    this.logger.verbose('Starting user creation: Parallelizing tasks...');

    const rolePromise = this.roleService.findOne(roleId);
    const hashPromise = this.hashingService.hash(userData.password);

    let uploadPromise: Promise<{ url: string; key: string }> | null = null;

    if (profilePicture) {
      const destinationPath = 'profile-pictures';
      const allowedMimeTypes =
        this.fileValidationService.getMimeTypesByGroup('image');
      const maxFileSize = 5 * 1024 * 1024;

      uploadPromise = this.storageService.uploadFile(
        profilePicture,
        destinationPath,
        allowedMimeTypes,
        maxFileSize,
      );
    }

    const [roleResult, hashResult, uploadResult] = await Promise.allSettled([
      rolePromise,
      hashPromise,
      uploadPromise ? uploadPromise : Promise.resolve(null),
    ]);

    if (uploadResult.status === 'fulfilled' && uploadResult.value) {
      profilePictureUrl = uploadResult.value.url;
      uploadedFileKey = uploadResult.value.key;
    }

    try {
      if (roleResult.status === 'rejected') {
        throw roleResult.reason;
      }
      const role = roleResult.value;
      if (!role) {
        throw new Error(`Role with ID '${roleId}' not found`);
      }

      if (hashResult.status === 'rejected') {
        throw hashResult.reason;
      }
      const hashedPassword = hashResult.value;

      if (uploadPromise && uploadResult.status === 'rejected') {
        throw uploadResult.reason;
      }

      const sharedId = uuidv4();

      return await this.userRepository.manager.transaction(async (tx) => {
        const newUserData = {
          id: sharedId,
          email: userData.email,
          password: hashedPassword,
          role,
        };
        const newUser = this.userRepository.create(newUserData);
        const savedUser = await tx.save(User, newUser);

        const profileData = {
          id: sharedId,
          name: userData.name,
          lastName: userData.lastName,
          phone: userData.phone,
          idCard: userData.idCard,
          position: userData.position,
          deparment: userData.deparment,
          profilePicture: profilePictureUrl,
          user: { id: savedUser.id },
        };
        const newProfile = this.profileRepository.create(profileData);
        await tx.save(Profile, newProfile);

        savedUser.profile = newProfile;
        delete (savedUser.profile as Partial<Profile>).user;

        if (savedUser && savedUser.profile) {
          this.eventEmitter.emit(
            'user.welcome',
            new WelcomeMailEvent(
              savedUser.email,
              savedUser.profile.name,
              savedUser.profile.lastName,
              new Date().getFullYear().toString(),
            ),
          );
        }

        return savedUser;
      });
    } catch (error) {
      if (uploadedFileKey) {
        try {
          this.logger.warn(
            `User creation failed. Cleaning up file: ${uploadedFileKey}`,
          );
          await this.storageService.deleteFile(uploadedFileKey);
        } catch (deleteError) {
          this.logger.error(
            `Failed to delete file ${uploadedFileKey} during cleanup.`,
            deleteError,
          );
        }
      }

      this.logger.error('User creation failed', error);
      throw error;
    }
  }

  async findAll(
    pageOptionsDto: UserPageOptionsDto,
  ): Promise<PageDto<UserResponseDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.role', 'role');

    queryBuilder.select([
      'user.id',
      'user.email',
      'user.isActive',
      'user.lastConnection',
      'user.createdAt',
      'user.updatedAt',
      'profile.name',
      'profile.lastName',
      'profile.phone',
      'profile.idCard',
      'profile.position',
      'profile.deparment',
      'profile.profilePicture',
      'role.id',
      'role.name',
    ]);

    if (pageOptionsDto.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: pageOptionsDto.isActive,
      });
    }

    if (pageOptionsDto.roleName) {
      queryBuilder.andWhere('role.name = :roleName', {
        roleName: pageOptionsDto.roleName,
      });
    }

    if (pageOptionsDto.includeDeleted) {
      queryBuilder.withDeleted();
    }

    if (pageOptionsDto.q) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email ILIKE :q', { q: `%${pageOptionsDto.q}%` })
            .orWhere('profile.name ILIKE :q', { q: `%${pageOptionsDto.q}%` })
            .orWhere('profile.lastName ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            })
            .orWhere('profile.idCard ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            });
        }),
      );
    }

    let orderField = '';
    switch (pageOptionsDto.by) {
      case UserOrderBy.EMAIL:
        orderField = 'user.email';
        break;
      case UserOrderBy.NAME:
        orderField = 'profile.name';
        break;
      case UserOrderBy.LAST_NAME:
        orderField = 'profile.lastName';
        break;
      case UserOrderBy.ROLE:
        orderField = 'role.name';
        break;
      case UserOrderBy.UPDATED_AT:
        orderField = 'user.updatedAt';
        break;
      default:
        orderField = 'user.createdAt';
        break;
    }

    queryBuilder
      .orderBy(orderField, pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMeta(pageOptionsDto, itemCount);
    const dtos = plainToInstance(UserResponseDto, entities);

    return new PageDto(dtos, pageMetaDto);
  }

  async findAllList(): Promise<UserResponseDto[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.role', 'role')
      .select([
        'user.id',
        'user.email',
        'user.isActive',
        'profile.name',
        'profile.lastName',
        'role.name',
      ])
      .where('user.isActive = :active', { active: true });

    const entities = await queryBuilder.getMany();
    return plainToInstance(UserResponseDto, entities);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return plainToInstance(UserResponseDto, user);
  }

  async update(
    id: string,
    updateDto: UpdateUserDto,
    profilePicture?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const { roleId, password, ...userData } = updateDto;

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    let role = user.role;
    if (roleId) {
      const foundRole = await this.roleService.findOne(roleId);
      if (!foundRole) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }
      role = foundRole;
    }

    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await this.hashingService.hash(password);
    }

    let newProfilePictureUrl: string | null | undefined = undefined;
    let oldFileKey: string | null = null;
    let newFileKey: string | null = null;

    if (profilePicture) {
      const destinationPath = 'profile-pictures';
      const allowedMimeTypes =
        this.fileValidationService.getMimeTypesByGroup('image');
      const maxFileSize = 5 * 1024 * 1024;

      const uploadResult = await this.storageService.uploadFile(
        profilePicture,
        destinationPath,
        allowedMimeTypes,
        maxFileSize,
      );
      newProfilePictureUrl = uploadResult.url;
      newFileKey = uploadResult.key;

      if (user.profile.profilePicture) {
        oldFileKey = this.extractFileKey(user.profile.profilePicture);
      }
    } else if (updateDto.profilePicture === null) {
      newProfilePictureUrl = null;
      if (user.profile.profilePicture) {
        oldFileKey = this.extractFileKey(user.profile.profilePicture);
      }
    }

    try {
      await this.userRepository.manager.transaction(async (manager) => {
        user.email = userData.email ?? user.email;
        user.isActive = userData.isActive ?? user.isActive;
        user.password = hashedPassword;
        user.role = role;
        user.updatedAt = new Date();
        await manager.save(User, user);

        if (newProfilePictureUrl !== undefined) {
          user.profile.profilePicture =
            newProfilePictureUrl as unknown as string;
        }
        user.profile.name = userData.name ?? user.profile.name;
        user.profile.lastName = userData.lastName ?? user.profile.lastName;
        user.profile.phone = userData.phone ?? user.profile.phone;
        user.profile.idCard = userData.idCard ?? user.profile.idCard;
        user.profile.position = userData.position ?? user.profile.position;
        user.profile.deparment = userData.deparment ?? user.profile.deparment;

        await manager.save(Profile, user.profile);
      });
    } catch (error) {
      if (newFileKey) {
        try {
          await this.storageService.deleteFile(newFileKey);
        } catch (cleanupError) {
          this.logger.error(
            `Failed to cleanup file ${newFileKey} after failed update`,
            cleanupError,
          );
        }
      }
      throw error;
    }

    if (oldFileKey) {
      try {
        await this.storageService.deleteFile(oldFileKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old profile picture ${oldFileKey}`,
          error,
        );
      }
    }

    await this.cacheManager.del(`/users/${id}`);
    return plainToInstance(UserResponseDto, user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 1. Delete Profile Picture from Storage
    if (user.profile.profilePicture) {
      try {
        const fileKey = this.extractFileKey(user.profile.profilePicture);
        if (fileKey) {
          await this.storageService.deleteFile(fileKey);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete profile picture for user ${id}`,
          error,
        );
      }
    }

    // 2. 🔥 ELIMINAR DE auth.users (Supabase)
    try {
      const { error: supabaseError } = await supabase.auth.admin.deleteUser(id);
      if (supabaseError) {
        this.logger.error('Error eliminando de auth.users:', supabaseError);
      } else {
        this.logger.log(`Usuario ${id} eliminado de auth.users`);
      }
    } catch (error) {
      this.logger.error('Error al eliminar de auth.users:', error);
    }

    // 3. Eliminar de profiles y user (hard delete)
    await this.userRepository.manager.transaction(async (manager) => {
      await manager.delete(Profile, { id });
      await manager.delete(User, { id });
    });

    // 4. Invalidate Cache
    await this.cacheManager.del(`/users/${id}`);
  }

  async restore(id: string): Promise<UserResponseDto> {
    const restoreResult = await this.userRepository.restore({ id });
    if (restoreResult.affected === 0) {
      throw new NotFoundException(
        `User with ID ${id} not found or not deleted`,
      );
    }

    await this.profileRepository.restore({ id });
    await this.cacheManager.del(`/users/${id}`);
    return this.findOne(id);
  }

  async findManagers(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: { name: Role.manager } },
      relations: ['profile', 'role'],
    });
  }

  async findTechnicians(): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { role: { name: Role.technician } },
        { role: { name: Role.employee } },
      ],
      relations: ['profile', 'role'],
    });
  }

  private extractFileKey(url: string): string | null {
    try {
      const parts = url.split('/');
      const index = parts.findIndex((p) => p === 'profile-pictures');
      if (index !== -1) {
        return parts.slice(index).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }
}