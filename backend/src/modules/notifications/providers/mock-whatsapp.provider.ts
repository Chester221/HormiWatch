import { Injectable, Logger } from '@nestjs/common';
import { IWhatsAppProvider, WhatsAppMessageParams } from '../providers/whatsapp-provider.interface';

@Injectable()
export class MockWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  async send(to: string, template?: string, params?: WhatsAppMessageParams): Promise<boolean> {
    this.logger.log(`[MOCK WHATSAPP] to=${to} template=${template} params=${JSON.stringify(params)}`);
    return true;
  }
}
