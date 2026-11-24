import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
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

  /** Solo lo activa el buscador global: amplía `q` a relaciones (líder, cliente). */
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  matchRelations?: boolean;

  /** Solo lo activa el buscador global: ordena por coincidencia de prefijo. */
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  rankByPrefix?: boolean;
}
