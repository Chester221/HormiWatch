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
  @Transform(
    ({ value }: { value: { toString(): string } | null | undefined }) =>
      value?.toString(),
  )
  startDateTime: string;

  @ApiProperty({
    description: 'End date and time of the task (ISO 8601 string)',
  })
  @Expose()
  @Transform(
    ({ value }: { value: { toString(): string } | null | undefined }) =>
      value?.toString(),
  )
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

  @ApiPropertyOptional({ description: 'Short title of the task' })
  @Expose()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the task' })
  @Expose()
  description: string;

  @ApiPropertyOptional({
    description: 'Date when the task was marked as completed',
  })
  @Expose()
  @Transform(({ value }) => (value ? String(value) : null))
  completedAt: string;

  @ApiPropertyOptional({
    description: 'ID of the user that created the task',
  })
  @Expose()
  createdBy: string;

  @ApiPropertyOptional({ description: 'Applied hourly rate' })
  @Expose()
  appliedHourlyRate: number;

  @ApiPropertyOptional({
    description:
      'Factor breakdown (x1, x1.5, x2) computed per time range of the task',
  })
  @Expose()
  factorBreakdown: { factor: number; label: string; hours: number }[] | null;

  @ApiPropertyOptional({
    description: 'ID of the project associated with the task',
    nullable: true,
  })
  @Expose()
  projectId: string | null;

  @ApiPropertyOptional({
    description: 'ID of the service associated with the task',
    nullable: true,
  })
  @Expose()
  serviceId: string | null;

  @ApiPropertyOptional({
    description: 'ID of the technician assigned to the task',
    nullable: true,
  })
  @Expose()
  technicianId: string | null;

  @ApiPropertyOptional({
    type: () => ProjectResponseDto,
    description: 'Project associated with the task',
    nullable: true,
  })
  @Expose()
  @Type(() => ProjectResponseDto)
  project: ProjectResponseDto | null;

  @ApiPropertyOptional({
    type: () => ServiceResponseDto,
    description: 'Service associated with the task',
    nullable: true,
  })
  @Expose()
  @Type(() => ServiceResponseDto)
  service: ServiceResponseDto | null;

  @ApiPropertyOptional({
    type: () => UserResponseDto,
    description: 'Technician assigned to the task',
    nullable: true,
  })
  @Expose()
  @Type(() => UserResponseDto)
  technician: UserResponseDto | null;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;
}
