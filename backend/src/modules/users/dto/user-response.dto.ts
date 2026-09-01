import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from './profile-response.dto';
import { RoleResponseDto } from 'src/modules/role/dto/role-response.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The email address of the user' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Indicates if the user account is active' })
  @Expose()
  isActive: boolean; // ✅ CAMBIADO de isActived a isActive

  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;

  @ApiProperty({ description: 'The date and time of the last connection' })
  @Expose()
  lastConnection: Date;

  @ApiProperty({
    type: () => RoleResponseDto,
    description: 'The role assigned to the user',
  })
  @Expose()
  @Type(() => RoleResponseDto)
  role: RoleResponseDto;

  @ApiProperty({
    type: () => ProfileResponseDto,
    description: 'The profile details of the user',
  })
  @Expose()
  @Type(() => ProfileResponseDto)
  profile: ProfileResponseDto;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}