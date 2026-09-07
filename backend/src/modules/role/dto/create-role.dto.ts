import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'The name of the role', example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A brief description of the role',
    example: 'Administrator with full access',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
