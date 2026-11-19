import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** Normaliza un teléfono antes de validar su longitud: E.164 sin espacios,
 *  guiones ni paréntesis (ej. "+58 412-1234567" → "+584121234567"). */
const normalizePhone = (value: unknown): unknown =>
  typeof value === 'string' ? value.replace(/[\s\-()]/g, '') : value;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 24)
  @Transform(normalizePhone)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  position?: string;

  /** Aceptado por compatibilidad con el front; no existe como columna en
   *  CustomerContact y es descartado por el servicio antes de persistir. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;
}

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

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
