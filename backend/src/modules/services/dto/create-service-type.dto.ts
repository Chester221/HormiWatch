import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceTypeDto {
  @ApiProperty({ example: 'Hourly', description: 'Name of the service type' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Hourly rate service',
    description: 'Description of the service type',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
