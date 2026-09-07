import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HolidayResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Date of the holiday' })
  @Expose()
  date: string;

  @ApiProperty({ description: 'Name of the holiday' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Description of the holiday' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Is a working day' })
  @Expose()
  isWorkingDay: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @Expose()
  updatedAt: Date;
}
