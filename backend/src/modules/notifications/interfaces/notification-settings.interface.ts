export interface NotificationChannels {
  inApp: boolean;
  email: boolean;
  discord: boolean;
  whatsapp: boolean;
}

export interface NotificationThresholds {
  /** % de consumo amarillo */
  yellow: number;
  /** % de consumo naranja */
  orange: number;
  /** % de consumo rojo (crítico) */
  red: number;
  /** Días antes del vencimiento para alertar */
  expiringDays: number;
  /** Días hábiles sin registrar horas para considerar un técnico inactivo (no cuenta fines de semana ni feriados) */
  inactivityDays: number;
  /** Días naturales sin cambios para considerar tareas estancadas y proyectos inactivos */
  taskStaleDays: number;
}

export interface DiscordWebhooks {
  alertas?: string;
  usuarios?: string;
  contratos?: string;
  proyectos?: string;
  tareas?: string;
}

export interface NotificationEventToggles {
  [event: string]: boolean;
}

export interface UserNotificationPreferences {
  inApp?: boolean;
  email?: boolean;
}

export const DEFAULT_CHANNELS: NotificationChannels = {
  inApp: true,
  email: true,
  discord: true,
  whatsapp: false,
};

export const DEFAULT_THRESHOLDS: NotificationThresholds = {
  yellow: 80,
  orange: 95,
  red: 100,
  expiringDays: 15,
  inactivityDays: 3,
  taskStaleDays: 3,
};
