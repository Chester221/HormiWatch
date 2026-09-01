import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';

export class MetricFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Start date for the search range (ISO 8601)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsISO8601()
  @IsOptional()
  searchStartDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the search range (ISO 8601)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsISO8601()
  @IsOptional()
  searchEndDate?: string;
}
