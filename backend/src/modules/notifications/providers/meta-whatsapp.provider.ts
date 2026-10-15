import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IWhatsAppProvider, WhatsAppMessageParams } from '../providers/whatsapp-provider.interface';

@Injectable()
export class MetaWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(MetaWhatsAppProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, template?: string, params?: WhatsAppMessageParams): Promise<boolean> {
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!token || !phoneId) return false;
    try {
      // Minimal placeholder: text message. Real template handling fuera de alcance por ahora
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: template || JSON.stringify(params || {}) },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return true;
    } catch (e) {
      this.logger.warn('Meta WhatsApp send failed');
      return false;
    }
  }
}
