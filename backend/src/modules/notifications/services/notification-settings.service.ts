import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSetting } from '../entities/notification-setting.entity';
import {
  DEFAULT_CHANNELS,
  DEFAULT_THRESHOLDS,
} from '../interfaces/notification-settings.interface';

const DEFAULT_DAILY_SUMMARY = {
  enabled: true,
  startHour: 8,
  endHour: 17,
  include: {
    created: true,
    deleted: true,
    expired: true,
    expiring: true,
    inactive: true,
    started: true,
    paused: true,
    completed: true,
    updated: true,
  },
};

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationSetting)
    private readonly repo: Repository<NotificationSetting>,
  ) {}

  async get(): Promise<NotificationSetting> {
    let s = await this.repo.findOne({ where: {} });
    if (!s) {
      s = this.repo.create({
        channels: { ...DEFAULT_CHANNELS },
        thresholds: { ...DEFAULT_THRESHOLDS },
        eventToggles: {},
        discord: {},
        discordWebhookUrl: null,
        digestHour: 8,
        digestEnabled: true,
        dailySummary: {
          ...DEFAULT_DAILY_SUMMARY,
          include: { ...DEFAULT_DAILY_SUMMARY.include },
        },
      });
      s = await this.repo.save(s);
    }

    // Mezcla los defaults con lo guardado para que las claves nuevas o
    // ausentes (y los valores viejos como taskStaleDays) no queden obsoletas.
    s.thresholds = { ...DEFAULT_THRESHOLDS, ...(s.thresholds || {}) };
    s.channels = { ...DEFAULT_CHANNELS, ...(s.channels || {}) };
    s.dailySummary = {
      ...DEFAULT_DAILY_SUMMARY,
      ...(s.dailySummary || {}),
      include: {
        ...DEFAULT_DAILY_SUMMARY.include,
        ...((s.dailySummary as any)?.include || {}),
      },
    };
    if (s.discordWebhookUrl === undefined) {
      s.discordWebhookUrl = null;
    }

    // dailySummary.enabled es la fuente de verdad; digestEnabled se mantiene
    // como espejo por compatibilidad con el scheduler y clientes antiguos.
    s.digestEnabled = s.dailySummary.enabled !== false;

    return s;
  }

  async update(dto: any): Promise<NotificationSetting> {
    const s = await this.get();

    for (const key of Object.keys(dto || {})) {
      (s as any)[key] = this.merge((s as any)[key], dto[key]);
    }

    if (dto?.dailySummary && typeof dto.dailySummary.enabled === 'boolean') {
      s.digestEnabled = dto.dailySummary.enabled;
    } else if (typeof dto?.digestEnabled === 'boolean') {
      s.dailySummary = {
        ...(s.dailySummary || {}),
        enabled: dto.digestEnabled,
      };
    }
    s.digestEnabled = s.dailySummary.enabled !== false;

    return this.repo.save(s);
  }

  /** Fusión recursiva de objetos; un valor explícito (incluido null) gana. */
  private merge<T>(base: T, patch: any): T {
    if (patch === undefined) return base;
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      return patch as T;
    }
    if (base === null || typeof base !== 'object' || Array.isArray(base)) {
      return patch as T;
    }

    const result: Record<string, any> = { ...(base as Record<string, any>) };
    for (const [key, value] of Object.entries(patch as Record<string, any>)) {
      result[key] = this.merge(result[key], value);
    }
    return result as T;
  }
}
