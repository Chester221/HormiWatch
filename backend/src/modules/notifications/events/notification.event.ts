import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';

/**
 * Cómo se resuelven los destinatarios de una notificación.
 * - users:     lista explícita de ids
 * - roles:     todos los usuarios con esos roles (nombre de rol, ej: 'Admin')
 * - project:   líder + técnicos asignados del proyecto (si se solicitan)
 */
export type NotificationAudience =
  | { type: 'users'; userIds: string[] }
  | { type: 'roles'; roles: string[] }
  | {
      type: 'project';
      projectId: string;
      includeLeader?: boolean;
      includeTechnicians?: boolean;
      includeAdmins?: boolean;
    };

/**
 * Evento de notificación multicanal. Se emite con EventEmitter2
 * en 'notification.dispatch' y lo consume NotificationDispatcherService.
 */
export class NotificationEvent {
  constructor(
    /** Nombre del dominio, ej: 'contract.threshold.80' */
    public readonly key: string,
    public readonly category: NotificationCategory,
    public readonly level: NotificationLevel,
    public readonly title: string,
    public readonly message: string,
    public readonly audience: NotificationAudience | NotificationAudience[],
    public readonly data?: Record<string, any>,
    /** Clave de dedupe por usuario; null = siempre notificar */
    public readonly dedupeKey?: string | null,
  ) {}

  get audiences(): NotificationAudience[] {
    return Array.isArray(this.audience) ? this.audience : [this.audience];
  }

  get isCritical(): boolean {
    return this.level === NotificationLevel.CRITICAL;
  }
}

export const NOTIFICATION_DISPATCH_EVENT = 'notification.dispatch';
