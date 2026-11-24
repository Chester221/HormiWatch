import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PageOptionsDto } from 'src/common/pagination/pagination-options.dto';

export class FindAllCustomersQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search term for name, RIF, city, or country',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Include soft-deleted customers',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Include customer contacts',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeContacts?: boolean = true;

  /** Solo lo activa el buscador global: ordena por coincidencia de prefijo. */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  rankByPrefix?: boolean;
}
