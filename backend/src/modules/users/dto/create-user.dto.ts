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
    description: 'The phone number of the user',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  /*
  @Matches(/^\+\d{1,3}\d{10}$/, {
    message:
      'phone number format: +[country code][local number], without spaces or special characters',
  })
  */
  @IsMobilePhone(undefined, { strictMode: true })
  phone?: string;

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
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('all')
  roleId: string;
}
