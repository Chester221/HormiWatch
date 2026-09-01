import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';

export class HolidayPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by Holiday ID' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Filter by Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Search by holiday name' })
  @IsOptional()
  @IsString()
  search?: string;
}
