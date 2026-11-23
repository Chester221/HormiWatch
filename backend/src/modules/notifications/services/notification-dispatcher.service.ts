import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
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
import type { DiscordDispatchResult } from '../interfaces/dispatch-result.interface';
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
  ) {}

  @OnEvent(NOTIFICATION_DISPATCH_EVENT)
  async dispatch(event: NotificationEvent): Promise<DiscordDispatchResult> {
    const result: DiscordDispatchResult = {
      ok: false,
      eventKey: event.key,
      category: event.category,
      discordSent: false,
    };

    try {
      const s = await this.settings.get();
      if (s.eventToggles?.[event.key] === false) {
        result.ok = true;
        result.skippedReason = 'eventToggles';
        return result;
      }

      const isSystem = event.category === NotificationCategory.SYSTEM;

      // Discord se envía antes de resolver usuarios para que las alertas del
      // sistema lleguen aunque no haya administradores configurados.
      if (s.channels?.discord === true) {
        const channel = this.discordChannelFor(event.category);
        result.channel = channel;
        const webhooks = this.resolveDiscordWebhooks(
          s.discord || {},
          s.discordWebhookUrl,
        );
        const url = webhooks[channel];

        if (url) {
          result.webhook = this.maskWebhook(url);
          result.discordSent = await this.discord.sendEvent(
            webhooks,
            channel,
            event,
          );
          this.logger.log(
            `Discord (evento "${event.key}") -> canal "${channel}" ${result.webhook}: ${
              result.discordSent ? 'enviado' : 'fallido'
            }`,
          );
        } else {
          this.logger.error(
            `Discord no enviado (evento "${event.key}"): webhook no configurado para el canal "${channel}"`,
          );
          result.skippedReason = 'webhookMissing';
        }
      } else {
        result.skippedReason = 'discordDisabled';
      }

      result.ok = true;

      // El endpoint de prueba solo quiere saber si Discord recibió el mensaje.
      if ((event.data as Record<string, unknown> | undefined)?.testOnly === true) {
        return result;
      }

      const resolvedUserIds = await this.resolver.resolve(event.audiences);
      const excluded = new Set(event.excludeUserIds || []);
      const userIds = resolvedUserIds.filter((id) => !excluded.has(id));
      if (!userIds.length) return result;

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

        // Email inmediato para críticos (el resto va en el resumen 8AM).
        // Las alertas de sistema se envían siempre por email.
        const email = s.channels?.email === true && u.email;
        if (email && (event.isCritical || isSystem)) {
          try {
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
          } catch (e) {
            this.logger.error(
              `Email fallido (evento "${event.key}", usuario ${u.id}): ${
                e instanceof Error ? e.message : String(e)
              }`,
              e instanceof Error ? e.stack : undefined,
            );
          }
        }

        // WhatsApp inmediato solo para críticos, si el usuario tiene número.
        // Las alertas de sistema se excluyen (solo Discord + email).
        const waEnabled = s.channels?.whatsapp === true;
        const phone = u.profile?.whatsappPhone;
        if (waEnabled && event.isCritical && phone && !isSystem) {
          try {
            await this.whatsapp.sendCriticalAlert(
              phone,
              event.title,
              event.message,
            );
          } catch (e) {
            this.logger.error(
              `WhatsApp fallido (evento "${event.key}", usuario ${u.id}): ${
                e instanceof Error ? e.message : String(e)
              }`,
              e instanceof Error ? e.stack : undefined,
            );
          }
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      result.ok = false;
      result.error = message;
      this.logger.error(
        `Error al despachar notificación (evento "${event.key}", category "${
          event.category
        }", channel "${result.channel ?? 'n/a'}"): ${message}`,
        e instanceof Error ? e.stack : undefined,
      );
    }

    return result;
  }

  /**
   * El webhook global (campo único de la UI) manda siempre. Los webhooks por
   * categoría solo se usan cuando no hay uno global configurado; en ese caso
   * se conserva el fallback histórico a "alertas".
   */
  private resolveDiscordWebhooks(
    configured: DiscordWebhooks,
    singleWebhook?: string | null,
  ): DiscordWebhooks {
    const result: DiscordWebhooks = { ...configured };
    const global = (singleWebhook || '').trim();
    const alertas = (configured.alertas || '').trim();

    for (const key of DISCORD_CHANNEL_KEYS) {
      const candidates = global
        ? [global]
        : [(configured[key] || '').trim(), alertas];
      const url = candidates.find(
        (value): value is string => typeof value === 'string' && value.length > 0,
      );
      if (url) result[key] = url;
      else delete result[key];
    }

    return result;
  }

  private maskWebhook(url: string): string {
    const cleaned = url.trim();
    return cleaned.length > 8 ? `***${cleaned.slice(-8)}` : '***';
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
