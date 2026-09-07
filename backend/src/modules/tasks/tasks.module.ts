import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Holiday } from './entities/holiday.entity';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HolidaysController } from './controllers/holidays.controller';
import { HolidaysService } from './services/holidays.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, Holiday]),
    HttpModule,
    UsersModule,
    ServicesModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [TasksController, HolidaysController],
  providers: [TasksService, HolidaysService],
  exports: [TasksService, HolidaysService],
})
export class TasksModule {}
