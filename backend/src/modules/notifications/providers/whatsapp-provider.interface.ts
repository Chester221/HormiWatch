export interface WhatsAppMessageParams {
  [key: string]: string | number;
}

export interface IWhatsAppProvider {
  send(to: string, template?: string, params?: WhatsAppMessageParams): Promise<boolean>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
