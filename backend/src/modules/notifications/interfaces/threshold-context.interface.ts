import { NotificationCategory } from '../enums/notification-category.enum';

export interface ContractThresholdContext {
  projectId: string;
  projectTitle: string;
  customerName: string;
  poolHours: number;
  hoursConsumed: number;
  hoursContracted: number;
  hoursRemaining: number;
  percent: number;
  endDate: string | null;
}
