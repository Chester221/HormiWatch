import { NotificationCategory } from '../enums/notification-category.enum';

export interface ContractThresholdContext {
  projectId: string;
  projectTitle: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  poolHours: number;
  hoursConsumed: number;
  hoursContracted: number;
  hoursRemaining: number;
  percent: number;
  endDate: string | null;
}
