import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico de la cuenta',
    example: 'usuario@empresa.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
