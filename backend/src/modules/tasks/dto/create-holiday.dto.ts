import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'Name of the holiday',
    example: 'Independence Day',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Date of the holiday (YYYY-MM-DD)',
    example: '2025-07-05',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Description of the holiday' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Indicates if it is a working day',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isWorkingDay?: boolean;
}
