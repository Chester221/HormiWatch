import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { MailService } from 'src/mails/mails.service';
import { DiscordService } from '../services/discord.service';
import { NotificationSettingsService } from '../services/notification-settings.service';
import { NotificationLevel } from '../enums/notification-level.enum';
import { NotificationCategory } from '../enums/notification-category.enum';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectRepository(Notification) private nRepo: Repository<Notification>,
    @InjectRepository(User) private uRepo: Repository<User>,
    private readonly settings: NotificationSettingsService,
    private mail: MailService,
    private discord: DiscordService,
  ) {}

  @Cron('0 8 * * *', {
    timeZone: process.env.APP_TIMEZONE || 'America/Caracas',
  })
  async dailyDigest() {
    const s = await this.settings.get();
    if (!s.digestEnabled) return;

    // Notificaciones no críticas pendientes de incluir en el resumen
    const pending = await this.nRepo.find({
      where: {
        digestSent: false,
        level: Not(NotificationLevel.CRITICAL),
      },
    });
    if (!pending.length) return;

    // ── 1. Discorde: agrupar por categoría y publicar una sola vez ──
    if (s.channels?.discord === true) {
      const byCategory = new Map<NotificationCategory, Notification[]>();
      const seen = new Set<string>();
      for (const n of pending) {
        const key = `${n.category}|${n.title}|${n.message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!byCategory.has(n.category)) byCategory.set(n.category, []);
        byCategory.get(n.category)!.push(n);
      }
      for (const [category, items] of byCategory) {
        const channel = this.discordChannelFor(category);
        const content = items
          .map((n) => `• **${n.title}** — ${n.message}`)
          .join('\n');
        await this.discord.sendToChannel(s.discord || {}, channel, {
          content: `📋 **Resumen diario**\n${content}`,
        });
      }
    }

    // ── 2. Email: agrupar por usuario y enviar el resumen ──
    if (s.channels?.email !== false) {
      const byUser = new Map<string, Notification[]>();
      for (const n of pending) {
        if (!byUser.has(n.userId)) byUser.set(n.userId, []);
        byUser.get(n.userId)!.push(n);
      }

      for (const [userId, items] of byUser) {
        const u = await this.uRepo.findOne({
          where: { id: userId, isActive: true },
          relations: ['profile'],
        });
        if (!u?.email) continue;

        try {
          await this.mail.sendMail({
            to: u.email,
            subject: '[HormiWatch] Resumen diario de notificaciones',
            template: 'digest-daily',
            context: {
              name: u.profile?.name || u.email,
              count: items.length,
              items: items.map((n) => ({
                title: n.title,
                message: n.message,
                category: n.category,
                level: n.level,
              })),
              year: new Date().getFullYear(),
            },
          });
        } catch (e: any) {
          this.logger.warn(`Digest email falló para ${u.email}: ${e?.message}`);
        }
      }
    }

    // ── 3. Marcar como enviadas para no repetir ──
    const ids = pending.map((n) => n.id);
    if (ids.length) {
      await this.nRepo.update({ id: In(ids) }, { digestSent: true });
    }
    this.logger.log(`Resumen diario procesado: ${ids.length} notificaciones`);
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
      default:
        return 'alertas';
    }
  }
}
