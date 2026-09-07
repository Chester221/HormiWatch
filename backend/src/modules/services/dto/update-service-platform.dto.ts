import { PartialType } from '@nestjs/swagger';
import { CreateServicePlatformDto } from './create-service-platform.dto';

export class UpdateServicePlatformDto extends PartialType(
  CreateServicePlatformDto,
) {}
