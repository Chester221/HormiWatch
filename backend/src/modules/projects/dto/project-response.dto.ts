import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectUserResponseDto } from './project-user-response.dto';
import { TransformPlainDate } from 'src/common/transform/dto-temporal.transformer';

export class ProjectResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  hourlyRate: number;

  @ApiProperty({ enum: ProjectStatus, enumName: 'ProjectStatus' })
  @Expose()
  status: ProjectStatus;

  @ApiProperty()
  @Expose()
  poolHours: number;

  @ApiProperty()
  @Expose()
  poolHoursWorked: number;

  @ApiProperty()
  @Expose()
  @Type(() => String)
  @TransformPlainDate()
  startDate: string;

  @ApiProperty()
  @Expose()
  @Type(() => String)
  @TransformPlainDate()
  endDate: string;

  @ApiProperty({ type: () => ProjectUserResponseDto })
  @Expose()
  @Type(() => ProjectUserResponseDto)
  projectLeader: ProjectUserResponseDto;

  @ApiProperty({ type: () => [ProjectUserResponseDto] })
  @Expose()
  @Type(() => ProjectUserResponseDto)
  technicians: ProjectUserResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
