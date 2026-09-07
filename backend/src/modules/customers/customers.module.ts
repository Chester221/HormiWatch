import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { CustomerContactService } from './services/customer_contact.service';
import { CustomerContactController } from './controllers/customer_contact.controller';
import { Customer } from './entities/customer.entity';
import { CustomerContact } from './entities/customer_contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, CustomerContact])],
  controllers: [CustomersController, CustomerContactController],
  providers: [CustomersService, CustomerContactService],
  exports: [CustomersService, CustomerContactService], // Exporta el servicio si otros módulos lo necesitan
})
export class CustomersModule {}
