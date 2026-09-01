import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServicePlatformDto {
  @ApiProperty({ example: 'Web', description: 'Name of the service platform' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Web platform',
    description: 'Description of the service platform',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
