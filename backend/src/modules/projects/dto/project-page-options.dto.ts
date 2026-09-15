import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { ProjectStatus } from '../enums/project-status.enum';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';

export class ProjectPageOptionsDto extends PageOptionsDto {
  @ApiProperty({ required: false, enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;
}