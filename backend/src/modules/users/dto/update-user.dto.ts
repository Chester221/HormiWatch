import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsObject,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User password (min 6 characters)' })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User ID card' })
  @IsOptional()
  @IsString()
  idCard?: string;

  @ApiPropertyOptional({ description: 'User position' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'User department' })
  @IsOptional()
  @IsString()
  deparment?: string;

  @ApiPropertyOptional({ description: 'Role ID' })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  // 🔥 AGREGADO: role como string (para cambiar rol directamente)
  @ApiPropertyOptional({ description: 'User role (Admin, Manager, Technician)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'User active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  profilePicture?: string | null;

  // 🔥 AGREGADO: preferences para el frontend
  @ApiPropertyOptional({ description: 'User preferences (UI settings)' })
  @IsOptional()
  @IsObject()
  preferences?: {
    tasks_view?: 'list' | 'calendar';
    projects_view?: 'grid' | 'table';
    tasks_filters?: {
      project?: string;
      status?: string;
    };
    dark_mode?: boolean;
  };

  // ✅ También permitir avatar_url y full_name si el frontend los envía
  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ description: 'Full name (concatenated)' })
  @IsOptional()
  @IsString()
  full_name?: string;
}