import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StorageModule } from './modules/storage/storage.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configurations from './config';
import { AuditModule } from './modules/audit/audit.module';
import { RoleModule } from './modules/role/role.module';
import { ServicesModule } from './modules/services/services.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MailsModule } from './mails/mails.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 1000,
      max: 30,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: {
          rejectUnauthorized: false,
        },
        logging: true,
      }),
    }),
    MailsModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    ReportsModule,
    TasksModule,
    CustomersModule,
    MetricsModule,
    StorageModule,
    NotificationsModule,
    AuditModule,
    RoleModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}