import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  Length,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** RIF: J-12345678-9 o G-12345678-9. */
const normalizeRif = (value: unknown): unknown =>
  typeof value === 'string' ? value.toUpperCase().trim() : value;

/** Personas naturales: se guarda tal como lo escribió el usuario, solo trim. */
const trimPhone = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const RIF_PATTERN = /^[JG]-\d{8}-\d$/;
export const COUNTRY_CODES = ['+58', '+54', '+1', '+57', '+56'] as const;

class CreateContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @Length(1, 60)
  name: string;

  @ApiPropertyOptional({ description: 'Apellido (columna NOT NULL, default "")' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  @Transform(({ value }) => value ?? '')
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 15)
  idCard?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Length(0, 100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono en formato internacional libre (ej. +54 11 1234-5678)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 24)
  @Transform(({ value }) => trimPhone(value))
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  position?: string;

  /** Departamento del contacto (columna real en customers_contacts). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  department?: string;
}

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'J-12345678-9', description: 'RIF (Jurídico o Gobierno)' })
  @Transform(({ value }) => normalizeRif(value))
  @Matches(RIF_PATTERN, {
    message: 'El RIF debe tener el formato J-12345678-9 o G-12345678-9',
  })
  rif: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Compatibilidad: se inyecta como fallback en el primer contacto',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Compatibilidad: se inyecta como fallback en el primer contacto',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Prefijo del teléfono de empresa, con signo + (ej. +58)',
    example: '+58',
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES)
  phone_country?: string;

  @ApiPropertyOptional({ example: '212' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,4}$/, { message: 'El área debe tener entre 1 y 4 dígitos' })
  phone_area?: string;

  @ApiPropertyOptional({ example: '2384510' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6,10}$/, {
    message: 'El número debe tener entre 6 y 10 dígitos',
  })
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  management?: string;

  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}
