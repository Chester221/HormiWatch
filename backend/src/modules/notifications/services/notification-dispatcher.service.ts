import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  NotificationEvent,
  NOTIFICATION_DISPATCH_EVENT,
} from '../events/notification.event';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationRecipientsResolver } from './recipients.resolver.service';
import { DiscordService } from './discord.service';
import { DiscordChannelKey } from './discord-embed.builder';
import type { DiscordWebhooks } from '../interfaces/notification-settings.interface';
import { WhatsAppService } from './whatsapp.service';
import { NotificationCategory } from '../enums/notification-category.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { MailService } from 'src/mails/mails.service';

const DISCORD_CHANNEL_KEYS: DiscordChannelKey[] = [
  'alertas',
  'usuarios',
  'contratos',
  'proyectos',
  'tareas',
];

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

    // Las alertas de sistema (errores 500, fallas de integracion) son solo
    // para administradores y no deben llegar a la campanita/panel in-app.
    const isSystem = event.category === NotificationCategory.SYSTEM;

    // Discord: enviar todos los eventos en tiempo real cuando esta habilitado.
    // Se envia antes de resolver usuarios para que las alertas de sistema
    // lleguen aunque no haya administradores configurados.
    if (s.channels?.discord === true) {
      const channel = this.discordChannelFor(event.category);
      const webhooks = this.resolveDiscordWebhooks(
        s.discord || {},
        s.discordWebhookUrl,
      );
      if (webhooks[channel]) {
        await this.discord.sendEvent(webhooks, channel, event);
      } else {
        this.logger.warn(
          `Discord webhook no configurado para el canal "${channel}" (evento "${event.key}")`,
        );
      }
    }

    const resolvedUserIds = await this.resolver.resolve(event.audiences);
    const excluded = new Set(event.excludeUserIds || []);
    const userIds = resolvedUserIds.filter((id) => !excluded.has(id));
    if (!userIds.length) return;

    const users = await this.userRepo.find({
      where: { id: In(userIds), isActive: true },
      relations: ['profile'],
    });

    for (const u of users) {
      const dedupe = event.dedupeKey || event.key;
      const inApp = s.channels?.inApp !== false && !isSystem;
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

      // Email inmediato para criticos (el resto va en el resumen 8AM).
      // Las alertas de sistema se envian siempre por email.
      const email = s.channels?.email === true && u.email;
      if (email && (event.isCritical || isSystem)) {
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

      // WhatsApp inmediato solo para criticos, si el usuario tiene numero.
      // Las alertas de sistema se excluyen (solo Discord + email).
      const waEnabled = s.channels?.whatsapp === true;
      const phone = u.profile?.whatsappPhone;
      if (waEnabled && event.isCritical && phone && !isSystem) {
        await this.whatsapp
          .sendCriticalAlert(phone, event.title, event.message)
          .catch(() => undefined);
      }
    }
  }

  private resolveDiscordWebhooks(
    configured: DiscordWebhooks,
    singleWebhook?: string | null,
  ): DiscordWebhooks {
    const result: DiscordWebhooks = { ...configured };
    const fallback = (singleWebhook || '').trim();

    for (const key of DISCORD_CHANNEL_KEYS) {
      const candidates = [configured[key], configured.alertas, fallback];
      const url = candidates.find(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      );
      if (url) result[key] = url.trim();
    }

    return result;
  }

  private discordChannelFor(category: NotificationCategory): DiscordChannelKey {
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
