import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IWhatsAppProvider } from '../providers/whatsapp-provider.interface';
import { WHATSAPP_PROVIDER } from '../providers/whatsapp-provider.interface';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @Inject(WHATSAPP_PROVIDER)
    private readonly provider: IWhatsAppProvider,
    private readonly config: ConfigService,
  ) {}

  async sendCriticalAlert(to: string, title: string, message: string) {
    return this.provider.send(to, 'critical_alert', { title, message });
  }
}
