import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class HolidayQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Holiday ID' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
