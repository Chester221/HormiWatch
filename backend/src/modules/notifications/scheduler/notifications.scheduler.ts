import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { MailService } from 'src/mails/mails.service';
import { NotificationSettingsService } from '../services/notification-settings.service';
import { NotificationLevel } from '../enums/notification-level.enum';
import {
  REPORT_EVENT_KEY_PREFIXES,
  StaleDetectionService,
} from '../services/stale-detection.service';
import { DailyDigestService } from '../services/daily-digest.service';
import {
  DailyDigestReport,
  DailyDigestReportFlags,
  DigestInactiveTechnicianRow,
  DigestStaleTaskRow,
} from '../interfaces/daily-digest.interface';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectRepository(Notification) private nRepo: Repository<Notification>,
    @InjectRepository(User) private uRepo: Repository<User>,
    private readonly settings: NotificationSettingsService,
    private readonly staleDetection: StaleDetectionService,
    private readonly digest: DailyDigestService,
    private mail: MailService,
  ) {}

  /**
   * Resumen diario (8:00 AM, hora de la app):
   * - Detecta tareas estancadas y tecnicos sin registrar horas (in-app + Discord).
   * - Envia por email a los administradores el reporte con 4 tablas mas su
   *   lista personal de pendientes.
   * - Envia por email a los demas usuarios su lista personal de pendientes.
   */
  @Cron('0 8 * * *', {
    timeZone: process.env.APP_TIMEZONE || 'America/Caracas',
  })
  async dailyDigest() {
    const s = await this.settings.get();
    if (!s.digestEnabled) return;

    // El resumen diario se entrega por correo. Mientras el canal de email
    // este deshabilitado ("Muy pronto") no se envia nada; la hora y los
    // umbrales quedan guardados y aplican al habilitarse el correo.
    if (s.channels?.email !== true) {
      this.logger.log(
        'Resumen diario omitido: el canal de correo esta deshabilitado',
      );
      return;
    }

    // ── 1. Deteccion diaria: tareas estancadas y tecnicos inactivos ──
    let detection: {
      staleTasks: DigestStaleTaskRow[];
      inactiveTechnicians: DigestInactiveTechnicianRow[];
    } = { staleTasks: [], inactiveTechnicians: [] };
    try {
      detection = await this.staleDetection.detectAndNotify();
    } catch (e) {
      this.logger.warn(
        `Deteccion de tareas/tecnicos fallo: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // ── 2. Notificaciones no criticas pendientes de incluir en el resumen ──
    const pending = await this.nRepo.find({
      where: {
        digestSent: false,
        level: Not(NotificationLevel.CRITICAL),
      },
      order: { createdAt: 'DESC' },
    });

    const personal = new Map<string, Notification[]>();
    for (const n of pending) {
      // Las que ya aparecen en las tablas del reporte no se repiten en la
      // lista personal del administrador.
      if (
        n.eventKey &&
        REPORT_EVENT_KEY_PREFIXES.some((p) => n.eventKey!.startsWith(p))
      ) {
        continue;
      }
      if (!personal.has(n.userId)) personal.set(n.userId, []);
      personal.get(n.userId)!.push(n);
    }

    // ── 3. Reporte (solo administradores) ──
    const admins = await this.digest.getAdmins();
    let report: DailyDigestReport | null = null;
    let flags: DailyDigestReportFlags | null = null;
    if (admins.length) {
      report = await this.digest.buildReport(s.thresholds, detection);
      flags = this.digest.buildFlags(report);
    }

    // ── 4. Destinatarios: administradores + usuarios con pendientes ──
    const recipients = new Map<
      string,
      { email: string; name: string; isAdmin: boolean }
    >();
    for (const a of admins) {
      recipients.set(a.id, { email: a.email, name: a.name, isAdmin: true });
    }
    for (const userId of personal.keys()) {
      if (recipients.has(userId)) continue;
      const u = await this.uRepo.findOne({
        where: { id: userId, isActive: true },
        relations: ['profile'],
      });
      if (!u?.email) continue;
      recipients.set(userId, {
        email: u.email,
        name: u.profile?.name || u.email,
        isAdmin: false,
      });
    }

    // ── 5. Email: reporte completo para admins, lista personal para el resto ──
    const sentIds: string[] = [];
    for (const [userId, r] of recipients) {
      const items = personal.get(userId) ?? [];
      if (!items.length && !(r.isAdmin && flags && !flags.isEmpty)) continue;

      try {
        await this.mail.sendMail({
          to: r.email,
          subject: r.isAdmin
            ? '[HormiWatch] Resumen diario de la plataforma'
            : '[HormiWatch] Resumen diario de notificaciones',
          template: 'digest-daily',
          context: {
            name: r.name,
            count: items.length,
            items: items.map((n) => ({
              title: n.title,
              message: n.message,
              category: n.category,
              level: n.level,
            })),
            isAdmin: r.isAdmin,
            report: r.isAdmin ? report : null,
            flags: r.isAdmin ? flags : null,
            thresholds: s.thresholds,
            date: report?.generatedAt || '',
            year: new Date().getFullYear(),
          },
        });
        sentIds.push(...items.map((i) => i.id));
      } catch (e) {
        this.logger.warn(
          `Digest email fallo para ${r.email}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // ── 6. Marcar como enviadas para no repetir ──
    if (sentIds.length) {
      await this.nRepo.update({ id: In(sentIds) }, { digestSent: true });
    }
    this.logger.log(
      `Resumen diario procesado: ${sentIds.length} notificaciones, ${recipients.size} destinatario(s)`,
    );
  }
}
