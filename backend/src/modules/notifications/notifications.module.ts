import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationSetting } from './entities/notification-setting.entity';
import { NotificationSettingsService } from './services/notification-settings.service';
import { NotificationEmitterService } from './services/notification-emitter.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationRecipientsResolver } from './services/recipients.resolver.service';
import { ContractThresholdsService } from './services/contract-thresholds.service';
import { StaleDetectionService } from './services/stale-detection.service';
import { DailyDigestService } from './services/daily-digest.service';
import { DiscordService } from './services/discord.service';
import { DiscordEmbedBuilder } from './services/discord-embed.builder';
import { WhatsAppService } from './services/whatsapp.service';
import { MockWhatsAppProvider } from './providers/mock-whatsapp.provider';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface';
import { NotificationsScheduler } from './scheduler/notifications.scheduler';
import { User } from '../users/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Holiday } from '../tasks/entities/holiday.entity';
import { MailsModule } from 'src/mails/mails.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationSetting,
      User,
      Role,
      Project,
      Task,
      Holiday,
    ]),
    MailsModule,
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationSettingsService,
    NotificationEmitterService,
    NotificationDispatcherService,
    NotificationRecipientsResolver,
    ContractThresholdsService,
    StaleDetectionService,
    DailyDigestService,
    DiscordService,
    DiscordEmbedBuilder,
    WhatsAppService,
    {
      provide: WHATSAPP_PROVIDER,
      useClass:
        process.env.WHATSAPP_PROVIDER === 'meta'
          ? MetaWhatsAppProvider
          : MockWhatsAppProvider,
    },
    NotificationsScheduler,
  ],
  exports: [
    NotificationsService,
    NotificationSettingsService,
    NotificationEmitterService,
    NotificationDispatcherService,
    ContractThresholdsService,
  ],
})
export class NotificationsModule {}
