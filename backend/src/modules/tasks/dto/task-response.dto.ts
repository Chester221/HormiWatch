import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskExecutionType } from '../enums/task-execution-type.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ServiceResponseDto } from '../../services/dto/service-response.dto';
import { ProjectResponseDto } from '../../projects/dto/project-response.dto';

@Exclude()
export class TaskResponseDto {
  @ApiProperty({ description: 'The unique identifier of the task' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Start date and time of the task (ISO 8601 string)',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  startDateTime: string;

  @ApiProperty({
    description: 'End date and time of the task (ISO 8601 string)',
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  endDateTime: string;

  @ApiProperty({ description: 'Status of the task', enum: TaskStatus })
  @Expose()
  status: TaskStatus;

  @ApiPropertyOptional({
    description: 'Execution type of the task',
    enum: TaskExecutionType,
  })
  @Expose()
  executionType: TaskExecutionType;

  @ApiProperty({ description: 'Priority of the task', enum: TaskPriority })
  @Expose()
  priority: TaskPriority;

  @ApiPropertyOptional({ description: 'Description of the task' })
  @Expose()
  description: string;

  @ApiPropertyOptional({ description: 'Applied hourly rate' })
  @Expose()
  appliedHourlyRate: number;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;
}
