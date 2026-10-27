import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsObject()
  channels?: {
    inApp?: boolean;
    email?: boolean;
    discord?: boolean;
    whatsapp?: boolean;
  };

  @IsOptional()
  @IsObject()
  thresholds?: {
    yellow?: number;
    orange?: number;
    red?: number;
    expiringDays?: number;
    inactivityDays?: number;
    taskStaleDays?: number;
  };

  @IsOptional()
  @IsObject()
  eventToggles?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  discord?: {
    alertas?: string;
    usuarios?: string;
    contratos?: string;
    proyectos?: string;
    tareas?: string;
  };

  @IsOptional()
  @IsString()
  discordWebhookUrl?: string | null;

  @IsOptional()
  @IsNumber()
  digestHour?: number;

  @IsOptional()
  @IsBoolean()
  digestEnabled?: boolean;

  @IsOptional()
  @IsObject()
  dailySummary?: {
    enabled?: boolean;
    startHour?: number;
    endHour?: number;
    include?: Record<string, boolean>;
  };

  @IsOptional()
  @IsBoolean()
  notifyProjectStarted?: boolean;
}
