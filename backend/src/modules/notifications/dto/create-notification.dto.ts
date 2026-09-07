import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'Enable email notifications',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  emailActive?: boolean;

  @ApiPropertyOptional({
    description: 'Enable WhatsApp notifications',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  whatsappActive?: boolean;
}
