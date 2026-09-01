import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceCategoryDto {
  @ApiProperty({
    example: 'Development',
    description: 'Name of the service category',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Software development services',
    description: 'Description of the service category',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
