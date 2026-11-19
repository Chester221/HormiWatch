import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  Matches,
  IsIn,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { COUNTRY_CODES, RIF_PATTERN } from './create-customer.dto';

const normalizeRif = (value: unknown): unknown =>
  typeof value === 'string' ? value.toUpperCase().trim() : value;

const trimPhone = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

class UpdateContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono en formato internacional libre',
  })
  @IsOptional()
  @IsString()
  @Length(0, 24)
  @Transform(({ value }) => trimPhone(value))
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'J-12345678-9' })
  @IsOptional()
  @Transform(({ value }) => normalizeRif(value))
  @Matches(RIF_PATTERN, {
    message: 'El RIF debe tener el formato J-12345678-9 o G-12345678-9',
  })
  rif?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Compatibility: fallback al primer contacto' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Compatibility: fallback al primer contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+58' })
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

  @ApiPropertyOptional({ type: [UpdateContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts?: UpdateContactDto[];
}
