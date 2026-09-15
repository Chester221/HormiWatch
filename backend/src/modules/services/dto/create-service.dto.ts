import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Website Development',
    description: 'Name of the service',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    example: 'Complete website creation service',
    description: 'Description of the service',
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the service category',
  })
  @IsUUID('4', { message: 'La categoría es inválida' })
  @IsNotEmpty({ message: 'Selecciona una categoría' })
  categoryId: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Hourly rate for the service',
  })
  @IsNumber({}, { message: 'La tarifa debe ser un número' })
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({
    example: 'Code',
    description: 'Icon identifier of the service',
  })
  @IsString({ message: 'El icono debe ser texto' })
  @IsOptional()
  @MaxLength(50, { message: 'El icono no puede superar 50 caracteres' })
  icon?: string;

  @ApiPropertyOptional({
    example: '#0DA2E7',
    description: 'Accent color (hex) used for the service icon',
  })
  @IsString({ message: 'El color debe ser texto' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe ser un hexadecimal válido como #0DA2E7',
  })
  color?: string;
}
