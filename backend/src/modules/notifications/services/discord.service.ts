import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DiscordWebhooks } from '../interfaces/notification-settings.interface';
import {
  DiscordChannelKey,
  DiscordEmbed,
  DiscordEmbedBuilder,
} from './discord-embed.builder';
import { NotificationEvent } from '../events/notification.event';

export interface DiscordMessage {
  webhook?: string;
  embeds?: DiscordEmbed[];
  content?: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly embeds: DiscordEmbedBuilder) {}

  async sendToChannel(
    webhooks: DiscordWebhooks,
    key: DiscordChannelKey,
    message: DiscordMessage,
  ): Promise<boolean> {
    const url = webhooks[key];
    if (!url) return false;
    try {
      await axios.post(url, {
        content: message.content,
        embeds: message.embeds,
      });
      return true;
    } catch (e) {
      const response = axios.isAxiosError(e) ? e.response : undefined;
      const status = response?.status ?? 'n/a';
      const statusText = response?.statusText || '';
      const detail = response?.data
        ? ` - respuesta: ${JSON.stringify(response.data).slice(0, 300)}`
        : '';
      this.logger.error(
        `Discord webhook fallo (${key}): HTTP ${status}${
          statusText ? ` ${statusText}` : ''
        } - ${e instanceof Error ? e.message : String(e)}${detail}`,
        e instanceof Error ? e.stack : undefined,
      );
      return false;
    }
  }

  /** Construye el embed del canal y lo envía al webhook configurado */
  async sendEvent(
    webhooks: DiscordWebhooks,
    key: DiscordChannelKey,
    event: NotificationEvent,
  ): Promise<boolean> {
    try {
      const message = await this.embeds.build(event, key);
      return await this.sendToChannel(webhooks, key, message);
    } catch (e) {
      this.logger.error(
        `No se pudo construir el embed de Discord (canal "${key}", evento "${
          event.key
        }"): ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      return false;
    }
  }
}
