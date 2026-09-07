import { Exclude, Expose, Type } from 'class-transformer';
import { ServiceCategoryResponseDto } from './service-category-response.dto';
import { ServicePlatformResponseDto } from './service-platform-response.dto';
import { ServiceTypeResponseDto } from './service-type-response.dto';

import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ServiceResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the service',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'Website Development',
    description: 'Name of the service',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Complete website creation service',
    description: 'Description of the service',
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

  @ApiProperty({ type: () => ServiceCategoryResponseDto })
  @Expose()
  @Type(() => ServiceCategoryResponseDto)
  category: ServiceCategoryResponseDto;

  @ApiProperty({ type: () => ServicePlatformResponseDto })
  @Expose()
  @Type(() => ServicePlatformResponseDto)
  platform: ServicePlatformResponseDto;

  @ApiProperty({ type: () => ServiceTypeResponseDto })
  @Expose()
  @Type(() => ServiceTypeResponseDto)
  type: ServiceTypeResponseDto;

  @ApiProperty({
    example: [],
    description: 'List of tasks associated with the service',
  })
  @Expose()
  tasks: any[];
}
