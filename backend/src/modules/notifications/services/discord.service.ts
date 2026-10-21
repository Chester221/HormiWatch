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
  ) {
    const url = webhooks[key];
    if (!url) return;
    try {
      await axios.post(url, {
        content: message.content,
        embeds: message.embeds,
      });
    } catch (e) {
      this.logger.warn(
        `Discord webhook fallo (${key}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /** Construye el embed del canal y lo envia al webhook configurado */
  async sendEvent(
    webhooks: DiscordWebhooks,
    key: DiscordChannelKey,
    event: NotificationEvent,
  ): Promise<void> {
    try {
      const message = await this.embeds.build(event, key);
      await this.sendToChannel(webhooks, key, message);
    } catch (e) {
      this.logger.warn(
        `No se pudo construir el embed de Discord (${key}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
