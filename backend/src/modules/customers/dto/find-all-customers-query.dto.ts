import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageOptionsDto } from 'src/common/pagination/pagination-options.dto';

export class FindAllCustomersQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Search term for name, city, or country' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted customers', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Include customer contacts', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeContacts?: boolean = true;
}