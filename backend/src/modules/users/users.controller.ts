import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserPageOptionsDto } from './dto/user-page-options.dto';
import { PageDto } from '../../common/pagination/pagination.dto';
import { RolesGuard } from '../auth/guard/authorization.guard';
import { IActiveUser } from '../auth/interface/payload.interface';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('profilePicture'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const savedUser = await this.usersService.create(
      createUserDto,
      profilePicture,
    );
    return plainToInstance(UserResponseDto, savedUser);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiOkResponse({ type: PageDto })
  async findAll(
    @Query() pageOptionsDto: UserPageOptionsDto,
  ): Promise<PageDto<UserResponseDto>> {
    return this.usersService.findAll(pageOptionsDto);
  }

  @Get('managers')
  @ApiOperation({ summary: 'Get list of available managers' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findManagers(): Promise<UserResponseDto[]> {
    const managers = await this.usersService.findManagers();
    return plainToInstance(UserResponseDto, managers);
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Get list of available technicians' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findTechnicians(): Promise<UserResponseDto[]> {
    const technicians = await this.usersService.findTechnicians();
    return plainToInstance(UserResponseDto, technicians);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('profilePicture'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: IActiveUser },
    @UploadedFile() profilePicture?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const requesterRole = (req.user?.role || '').toLowerCase();
    const isSelf = String(id) === String(req.user?.userId);

    // ✅ AUTOSERVICIO: cualquier rol (incl. Técnico/Líder) puede editar SU PROPIA
    // preferencia de apariencia, perfil, avatar, etc. — pero no su rol/estado
    if (isSelf) {
      if (
        updateUserDto.role ||
        updateUserDto.roleId ||
        updateUserDto.isActive !== undefined
      ) {
        throw new ForbiddenException(
          'No autorizado para cambiar tu propio rol o estado',
        );
      }
      return this.usersService.update(id, updateUserDto, profilePicture);
    }

    // Modificación de OTROS usuarios: solo Admin/Manager
    if (requesterRole !== 'admin' && requesterRole !== 'manager') {
      throw new ForbiddenException('No autorizado para modificar este usuario');
    }

    // Solo Admin puede asignar rol Administrador o cambiar isActive
    if (requesterRole !== 'admin') {
      // 🔒 Un Manager/Líder NO puede modificar a un Administrador existente
      const targetUser = await this.usersService.findOne(id);
      const targetRoleLower =
        typeof targetUser?.role === 'string'
          ? (targetUser.role as string).toLowerCase()
          : String(targetUser?.role?.name || '').toLowerCase();
      if (targetRoleLower === 'admin') {
        throw new ForbiddenException(
          'No autorizado para modificar a un Administrador',
        );
      }

      if (updateUserDto.role) {
        const newRole = updateUserDto.role.toLowerCase();
        if (newRole !== 'manager' && newRole !== 'technician') {
          throw new ForbiddenException('No autorizado para asignar el rol Administrador');
        }
      }
      if (updateUserDto.isActive !== undefined) {
        throw new ForbiddenException('No autorizado para cambiar el estado del miembro');
      }
    }
    return this.usersService.update(id, updateUserDto, profilePicture);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a user' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}