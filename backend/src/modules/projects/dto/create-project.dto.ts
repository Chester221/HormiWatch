import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsAfterDate } from '../../../common/validators/is-after-date.validator';
import { ProjectStatus } from '../enums/project-status.enum';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Project Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Hourly Rate', default: 0 })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @ApiProperty({
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    default: ProjectStatus.PENDING,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ description: 'Pool Hours', default: 0 })
  @IsNumber()
  @IsOptional()
  poolHours?: number;

  @ApiProperty({ description: 'Start Date (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End Date (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  @IsAfterDate('startDate', { message: 'endDate must be after startDate' })
  endDate: string;

  @ApiProperty({ description: 'Project Leader User ID' })
  @IsUUID()
  @IsNotEmpty()
  projectLeaderId: string;

  @ApiProperty({ description: 'Array of Technician User IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  technicianIds: string[];

  @ApiProperty({ description: 'Customer Contact ID' })
  @IsUUID()
  @IsNotEmpty()
  customerContactId: string;
}
