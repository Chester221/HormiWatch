import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Constructora XYZ',
    description: 'Name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Ecuador',
    description: 'Country of the customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: 'Quito',
    description: 'City of the customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'Av. Amazonas N25-123',
    description: 'Address of the customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;
}
