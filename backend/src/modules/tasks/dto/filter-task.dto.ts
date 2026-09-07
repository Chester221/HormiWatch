import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';
import { TaskStatus } from '../enums/task-status.enum';

export class FilterTaskDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by technician (user) ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'Filter by task status',
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filter tasks starting after this date (ISO 8601)',
  })
  @IsISO8601()
  @IsOptional()
  startDateTime?: string;

  @ApiPropertyOptional({
    description: 'Filter tasks ending before this date (ISO 8601)',
  })
  @IsISO8601()
  @IsOptional()
  endDateTime?: string;
}
