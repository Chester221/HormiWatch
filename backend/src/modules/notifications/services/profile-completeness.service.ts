import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';
import { Temporal } from 'temporal-polyfill';
import { Profile } from 'src/modules/users/entities/profile.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import { NotificationsService } from './notifications.service';

/** Campos que el usuario debe completar en "Mi Perfil". */
export const PROFILE_REQUIRED_FIELDS = [
  'idCard',
  'deparment',
  'company',
  'position',
  'whatsappPhone',
] as const;

export const PROFILE_INCOMPLETE_EVENT_PREFIX = 'profile.incomplete';
export const PROFILE_INCOMPLETE_TITLE = 'Perfil incompleto';
export const PROFILE_INCOMPLETE_MESSAGE =
  'Completa tu perfil para continuar. Ve a Mi Perfil y rellena tus datos de identificación.';

@Injectable()
export class ProfileCompletenessService {
  private readonly logger = new Logger(ProfileCompletenessService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notifications: NotificationsService,
  ) {}

  private get timeZone(): string {
    return process.env.APP_TIMEZONE || 'America/Caracas';
  }

  /** Todos los campos obligatorios deben tener texto no vacío. */
  isComplete(profile: Partial<Profile> | null | undefined): boolean {
    if (!profile) return false;
    return PROFILE_REQUIRED_FIELDS.every((field) => {
      const value = profile[field];
      return typeof value === 'string' && value.trim().length > 0;
    });
  }

  /** Clave mensual en la zona horaria de la app: YYYY-MM. */
  periodKey(date: Temporal.PlainDate = Temporal.Now.plainDateISO(this.timeZone)): string {
    return `${date.year}-${String(date.month).padStart(2, '0')}`;
  }

  private eventKey(): string {
    return `${PROFILE_INCOMPLETE_EVENT_PREFIX}:${this.periodKey()}`;
  }

  /**
   * Notifica a un usuario puntual si su perfil sigue incompleto.
   * El índice único (user_id, event_key) evita duplicados del mismo mes;
   * createInApp() ya absorbe el error 23505 y devuelve null.
   */
  async notifyIfIncomplete(userId: string): Promise<boolean> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId, deleteAt: IsNull() },
    });
    if (!profile || this.isComplete(profile)) return false;

    const created = await this.notifications.createInApp({
      userId,
      category: NotificationCategory.USERS,
      level: NotificationLevel.WARNING,
      title: PROFILE_INCOMPLETE_TITLE,
      message: PROFILE_INCOMPLETE_MESSAGE,
      data: { route: '/profile', reason: 'incomplete_profile' },
      eventKey: this.eventKey(),
      digestSent: true,
    });
    return !!created;
  }

  /**
   * Chequeo masivo usado por el cron. Solo usuarios activos y no borrados.
   * Se reevalúa cada perfil dentro de notifyIfIncomplete para evitar carreras.
   */
  async notifyAllIncomplete(): Promise<number> {
    const missingClause = PROFILE_REQUIRED_FIELDS.map(
      (field) => `(p.${field} IS NULL OR TRIM(p.${field}) = '')`,
    ).join(' OR ');

    const rows = await this.profileRepo
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .select('p.id', 'id')
      .where('u.isActive = :active', { active: true })
      .andWhere('u.deletedAt IS NULL')
      .andWhere('p.deleteAt IS NULL')
      .andWhere(`(${missingClause})`)
      .getRawMany<{ id: string }>();

    let notified = 0;
    for (const row of rows) {
      if (await this.notifyIfIncomplete(row.id)) notified++;
    }

    this.logger.log(
      `Perfil incompleto: ${rows.length} usuario(s) evaluado(s), ${notified} notificación(es) creada(s)`,
    );
    return notified;
  }

  /**
   * Cuando el usuario completa su perfil, se marca como leída la alerta
   * pendiente para que la campanita no muestre un aviso ya resuelto.
   */
  async markCompleteIfNeeded(userId: string): Promise<boolean> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId, deleteAt: IsNull() },
    });
    if (!profile || !this.isComplete(profile)) return false;

    await this.notificationRepo.update(
      {
        userId,
        eventKey: Like(`${PROFILE_INCOMPLETE_EVENT_PREFIX}:%`),
        readAt: IsNull(),
      },
      { readAt: () => 'CURRENT_TIMESTAMP' },
    );
    return true;
  }
}
