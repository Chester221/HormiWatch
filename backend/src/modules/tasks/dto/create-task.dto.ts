import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TaskExecutionType } from '../enums/task-execution-type.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'ID of the technician assigned to the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  technicianId: string;

  @ApiPropertyOptional({
    description: 'ID of the project associated with the task',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'ID of the service associated with the task',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Start date and time of the task (ISO 8601 string)',
    example: '2023-10-27T10:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  startDateTime: string;

  @ApiProperty({
    description: 'End date and time of the task (ISO 8601 string)',
    example: '2023-10-27T12:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  endDateTime: string;

  @ApiProperty({
    description: 'Priority of the task',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM, // Assuming MEDIUM exists, or user can fix example
  })
  @IsEnum(TaskPriority)
  @IsNotEmpty()
  priority: TaskPriority;

  @ApiPropertyOptional({
    description: 'Execution type of the task',
    enum: TaskExecutionType,
    example: TaskExecutionType.DAILY,
  })
  @IsEnum(TaskExecutionType)
  @IsOptional()
  executionType?: TaskExecutionType;

  @ApiPropertyOptional({
    description: 'Description of the task',
    example: 'Fix server rack wiring in the main data center.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the task',
    enum: TaskStatus,
    default: TaskStatus.PENDING, // Assuming PENDING exists
    example: TaskStatus.PENDING,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
