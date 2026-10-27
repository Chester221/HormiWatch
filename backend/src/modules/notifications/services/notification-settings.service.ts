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
    console.log('[NOTIF][SVC] NotificationSettingsService.get() called');
    let s = await this.repo.findOne({ where: {} });
    if (!s) {
      console.log('[NOTIF][SVC] No settings found, creating defaults');
      s = this.repo.create({
        channels: DEFAULT_CHANNELS,
        thresholds: DEFAULT_THRESHOLDS,
        eventToggles: {},
        discord: {},
        discordWebhookUrl: null,
        digestHour: 8,
        digestEnabled: true,
        dailySummary: DEFAULT_DAILY_SUMMARY,
        notifyProjectStarted: true,
      });
      s = await this.repo.save(s);
    } else {
      console.log('[NOTIF][SVC] Settings found');
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
    if (typeof s.notifyProjectStarted !== 'boolean') {
      s.notifyProjectStarted = true;
    }
    if (s.discordWebhookUrl === undefined) {
      s.discordWebhookUrl = null;
    }
    console.log('[NOTIF][SVC] Returning settings');
    return s;
  }

  async update(dto: any): Promise<NotificationSetting> {
    const s = await this.get();
    if (dto?.dailySummary) {
      dto.dailySummary = {
        ...(s.dailySummary || {}),
        ...dto.dailySummary,
        include: {
          ...((s.dailySummary as any)?.include || {}),
          ...(dto.dailySummary.include || {}),
        },
      };
    }
    Object.assign(s, dto);
    return this.repo.save(s);
  }
}
