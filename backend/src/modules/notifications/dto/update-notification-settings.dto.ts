export class UpdateNotificationSettingsDto {
  channels?: {
    inApp?: boolean;
    email?: boolean;
    discord?: boolean;
    whatsapp?: boolean;
  };
  thresholds?: {
    yellow?: number;
    orange?: number;
    red?: number;
    expiringDays?: number;
    inactivityDays?: number;
    taskStaleDays?: number;
  };
  eventToggles?: Record<string, boolean>;
  discord?: {
    alertas?: string;
    usuarios?: string;
    contratos?: string;
    proyectos?: string;
    tareas?: string;
  };
  digestHour?: number;
  digestEnabled?: boolean;
}
