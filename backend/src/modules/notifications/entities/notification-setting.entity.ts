import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity } from 'typeorm';
import type {
  DiscordWebhooks,
  NotificationChannels,
  NotificationEventToggles,
  NotificationThresholds,
} from '../interfaces/notification-settings.interface';
import {
  DEFAULT_CHANNELS,
  DEFAULT_THRESHOLDS,
} from '../interfaces/notification-settings.interface';

@Entity({ name: 'notification_settings' })
export class NotificationSetting extends BaseUuidEntity {
  @Column({ type: 'jsonb', nullable: false, default: () => `'${JSON.stringify(DEFAULT_CHANNELS)}'` })
  channels: NotificationChannels;

  @Column({ type: 'jsonb', nullable: false, default: () => `'${JSON.stringify(DEFAULT_THRESHOLDS)}'` })
  thresholds: NotificationThresholds;

  /** Toggles por evento, ej: { 'task.created': false } */
  @Column({ type: 'jsonb', name: 'event_toggles', nullable: false, default: () => `'{}'` })
  eventToggles: NotificationEventToggles;

  /** Webhooks de Discord por canal: { alertas, usuarios, contratos, proyectos, tareas } */
  @Column({ type: 'jsonb', nullable: false, default: () => `'{}'` })
  discord: DiscordWebhooks;

  @Column({ type: 'integer', name: 'digest_hour', default: 8 })
  digestHour: number;

  @Column({ type: 'boolean', name: 'digest_enabled', default: true })
  digestEnabled: boolean;
}
