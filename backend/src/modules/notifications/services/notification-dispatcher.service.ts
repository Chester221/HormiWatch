import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationEvent, NOTIFICATION_DISPATCH_EVENT } from '../events/notification.event';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationRecipientsResolver } from './recipients.resolver.service';
import { DiscordService } from './discord.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { MailService } from 'src/mails/mails.service';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
    private readonly settings: NotificationSettingsService,
    private readonly resolver: NotificationRecipientsResolver,
    private readonly discord: DiscordService,
    private readonly whatsapp: WhatsAppService,
    private readonly mail: MailService,
    private readonly emitter: EventEmitter2,
  ) {}

  @OnEvent(NOTIFICATION_DISPATCH_EVENT)
  async dispatch(event: NotificationEvent) {
    const s = await this.settings.get();
    if (s.eventToggles?.[event.key] === false) return;

    const userIds = await this.resolver.resolve(event.audiences);
    if (!userIds.length) return;

    const users = await this.userRepo.find({
      where: { id: In(userIds), isActive: true },
      relations: ['profile'],
    });

    for (const u of users) {
      const dedupe = event.dedupeKey || event.key;
      const inApp = s.channels?.inApp !== false;
      if (inApp) {
        await this.notifications.createInApp({
          userId: u.id,
          category: event.category,
          level: event.level,
          title: event.title,
          message: event.message,
          data: event.data,
          eventKey: dedupe,
          digestSent: !event.isCritical,
        });
      }

      // Email inmediato solo para críticos (el resto va en el resumen 8AM)
      const email = s.channels?.email === true && u.email;
      if (email && event.isCritical) {
        await this.mail.sendMail({
          to: u.email,
          subject: `[HormiWatch] ${event.title}`,
          template: 'notification-alert',
          context: {
            name: u.profile?.name || u.email,
            title: event.title,
            message: event.message,
            details: event.data || {},
            year: new Date().getFullYear(),
          },
        });
      }

      // WhatsApp inmediato solo para críticos y si el usuario tiene número
      const waEnabled = s.channels?.whatsapp === true;
      const phone = u.profile?.whatsappPhone;
      if (waEnabled && event.isCritical && phone) {
        await this.whatsapp
          .sendCriticalAlert(phone, event.title, event.message)
          .catch(() => undefined);
      }
    }

    // Discord: enviar todos los eventos en tiempo real cuando está habilitado
    if (s.channels?.discord === true) {
      const channel = this.discordChannelFor(event.category);
      const prefix = event.isCritical ? '🚨 ' : '';
      await this.discord.sendToChannel(s.discord || {}, channel, {
        content: `${prefix}**${event.title}**\n${event.message}`,
      });
    }
  }

  private discordChannelFor(
    category: NotificationCategory,
  ): 'alertas' | 'usuarios' | 'contratos' | 'proyectos' | 'tareas' {
    switch (category) {
      case NotificationCategory.CONTRACTS:
        return 'contratos';
      case NotificationCategory.PROJECTS:
        return 'proyectos';
      case NotificationCategory.TASKS:
        return 'tareas';
      case NotificationCategory.USERS:
        return 'usuarios';
      case NotificationCategory.SYSTEM:
      case NotificationCategory.CUSTOMERS:
      default:
        return 'alertas';
    }
  }
}
