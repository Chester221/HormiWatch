import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token temporal recibido por correo' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      'Nueva contraseña. Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.',
    example: 'NewP@ssw0rd1',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    },
  )
  newPassword: string;
}
