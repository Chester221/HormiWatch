import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerContact } from '../customers/entities/customer_contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, Customer, CustomerContact]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
