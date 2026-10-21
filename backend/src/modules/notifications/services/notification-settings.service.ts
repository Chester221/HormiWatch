import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSetting } from '../entities/notification-setting.entity';
import {
  DEFAULT_CHANNELS,
  DEFAULT_THRESHOLDS,
} from '../interfaces/notification-settings.interface';

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
        channels: DEFAULT_CHANNELS,
        thresholds: DEFAULT_THRESHOLDS,
        eventToggles: {},
        discord: {},
        digestHour: 8,
        digestEnabled: true,
      });
      s = await this.repo.save(s);
    }
    // Mezcla los defaults con lo guardado para que las claves nuevas o
    // ausentes (y los valores viejos como taskStaleDays) no queden obsoletas.
    s.thresholds = { ...DEFAULT_THRESHOLDS, ...(s.thresholds || {}) };
    s.channels = { ...DEFAULT_CHANNELS, ...(s.channels || {}) };
    return s;
  }

  async update(dto: any): Promise<NotificationSetting> {
    const s = await this.get();
    Object.assign(s, dto);
    return this.repo.save(s);
  }
}
