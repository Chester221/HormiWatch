import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from './entities/service-category.entity';
import { ServicePlatform } from './entities/service-platform.entity';
import { ServiceType } from './entities/service-type.entity';
import { Service } from './entities/service.entity';
import { ServiceCategoryController } from './controllers/service-category.controller';
import { ServicePlatformController } from './controllers/service-platform.controller';
import { ServiceTypeController } from './controllers/service-type.controller';
import { ServiceCategoryService } from './services/service-category.service';
import { ServicePlatformService } from './services/service-platform.service';
import { ServiceTypeService } from './services/service-type.service';
import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceCategory,
      ServicePlatform,
      ServiceType,
      Service,
    ]),
  ],
  controllers: [
    ServiceCategoryController,
    ServicePlatformController,
    ServiceTypeController,
    ServicesController,
  ],
  providers: [
    ServicesService,
    ServiceCategoryService,
    ServicePlatformService,
    ServiceTypeService,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
