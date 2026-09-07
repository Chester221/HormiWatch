import { Exclude, Expose } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ServicePlatformResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the service platform',
  })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Web', description: 'Name of the service platform' })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Web platform',
    description: 'Description of the service platform',
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
