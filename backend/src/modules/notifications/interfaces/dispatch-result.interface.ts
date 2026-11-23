import type { NotificationCategory } from '../enums/notification-category.enum';

/**
 * Resultado del despacho de un evento. Lo devuelve el dispatcher para que el
 * endpoint de prueba de Discord pueda informar qué pasó realmente con el envío.
 */
export interface DiscordDispatchResult {
  ok: boolean;
  eventKey: string;
  category: NotificationCategory;
  channel?: string;
  /** Webhook enmascarado (nunca se expone la URL completa). */
  webhook?: string;
  discordSent: boolean;
  skippedReason?: 'eventToggles' | 'discordDisabled' | 'webhookMissing';
  error?: string;
}
