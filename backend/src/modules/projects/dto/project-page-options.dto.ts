import { PageOptionsDto } from 'src/common/pagination/pagination-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';

export class ProjectPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  readonly status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter by leader ID',
  })
  @IsOptional()
  @IsUUID()
  readonly leaderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by technician ID',
  })
  @IsOptional()
  @IsUUID()
  readonly technicianId?: string;

  @ApiPropertyOptional({
    description: 'Search query (title)',
  })
  @IsOptional()
  @IsString()
  declare readonly q?: string;
}
