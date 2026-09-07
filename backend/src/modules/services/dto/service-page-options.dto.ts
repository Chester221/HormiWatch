import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ServiceOrderBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CATEGORY = 'category',
  PLATFORM = 'platform',
  TYPE = 'type',
  TASKS = 'tasks',
}

export class ServicePageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: ServiceOrderBy,
    default: ServiceOrderBy.CREATED_AT,
    description: 'Field to order by',
    example: ServiceOrderBy.CREATED_AT,
  })
  @IsEnum(ServiceOrderBy)
  @IsOptional()
  readonly by: ServiceOrderBy = ServiceOrderBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Filter by one or more category IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  readonly categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by one or more platform IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  readonly platformIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by one or more type IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  readonly typeIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by one or more task IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174003'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  readonly taskIds?: string[];
}
