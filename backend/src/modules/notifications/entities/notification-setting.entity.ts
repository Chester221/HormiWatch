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

export interface DailySummaryConfig {
  enabled?: boolean;
  startHour?: number;
  endHour?: number;
  include?: Record<string, boolean>;
}

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

  /** Webhook único de Discord para canal #notificaciones */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'discord_webhook_url' })
  discordWebhookUrl: string | null;

  @Column({ type: 'integer', name: 'digest_hour', default: 8 })
  digestHour: number;

  @Column({ type: 'boolean', name: 'digest_enabled', default: true })
  digestEnabled: boolean;

  @Column({
    type: 'jsonb',
    nullable: false,
    name: 'daily_summary',
    default: () =>
      `'{"enabled": true, "startHour": 8, "endHour": 17, "include": {"created": true, "deleted": true, "expired": true, "expiring": true, "inactive": true, "started": true, "paused": true, "completed": true, "updated": true}}'`,
  })
  dailySummary: DailySummaryConfig;

  @Column({ type: 'boolean', name: 'notify_project_started', default: true })
  notifyProjectStarted: boolean;
}
