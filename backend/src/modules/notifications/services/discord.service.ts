import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import { NotificationChannels, DiscordWebhooks } from '../interfaces/notification-settings.interface';

export interface DiscordMessage {
  webhook?: string;
  embeds?: any[];
  content?: string;
}

@Injectable()
export class DiscordService {
  async sendToChannel(webhooks: DiscordWebhooks, key: keyof DiscordWebhooks, message: DiscordMessage) {
    const url = webhooks[key];
    if (!url) return;
    try {
      await axios.post(url, {
        content: message.content,
        embeds: message.embeds,
      });
    } catch (e) {
      // ignore
    }
  }
}
