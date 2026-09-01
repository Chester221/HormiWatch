import { Exclude, Expose } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ServiceTypeResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the service type',
  })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Hourly', description: 'Name of the service type' })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Hourly rate service',
    description: 'Description of the service type',
  })
  @Expose()
  description: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Creation date',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Last update date',
  })
  @Expose()
  updatedAt: Date;
}
