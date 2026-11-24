import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Teléfono en formato internacional libre (ej. +54 11 1234-5678 o 0414-1234567)',
    example: '+58 412-1234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(24)
  @Matches(/^[+()\d\s-]+$/, {
    message:
      'El teléfono solo puede contener dígitos, +, paréntesis, espacios y guiones',
  })
  phone?: string;

  @ApiProperty({
    description: 'WhatsApp phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @IsMobilePhone(undefined, { strictMode: true })
  whatsappPhone?: string;

  @ApiProperty({
    description: 'WhatsApp phone number (alias)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsapp_phone?: string;

  @ApiProperty({
    description: 'The ID card number or identifier',
    example: '123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(15)
  idCard?: string;

  @ApiProperty({
    description: 'The department the user belongs to',
    example: 'Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  deparment?: string;

  @ApiProperty({
    description: 'The position or job title of the user',
    example: 'Software Engineer',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  position?: string;

  @ApiProperty({
    description: 'Company the user belongs to (Bytes Creativos, Gal Secure, ...)',
    example: 'Bytes Creativos',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @ApiProperty({
    description:
      'The password of the user. Must be at least 6 characters long, contain 1 lowercase, 1 uppercase, 1 number, and 1 symbol.',
    example: 'StrongP@ssw0rd!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is not strong enough, need a least 6 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol',
    },
  )
  password: string;

  @ApiProperty({
    description: 'The UUID of the role assigned to the user',
    example: 'e069156e-3467-4229-875f-25c275988220',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUUID('all')
  roleId?: string;

  @ApiProperty({
    description: 'Role name (alternative to roleId)',
    example: 'Technician',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleName?: string;
}
