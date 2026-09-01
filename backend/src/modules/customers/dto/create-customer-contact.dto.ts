import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Name of the contact' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '1712345678',
    description: 'ID card number of the contact',
    required: false,
  })
  @IsString()
  @IsOptional()
  id_card?: string;

  @ApiProperty({
    example: 'Gerente de Compras',
    description: 'Position of the contact in the company',
    required: false,
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    example: '0991234567',
    description: 'Phone number of the contact',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'juan.perez@constructora.xyz',
    description: 'Email of the contact',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
