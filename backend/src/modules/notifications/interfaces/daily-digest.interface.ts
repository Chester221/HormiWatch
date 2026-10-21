export type DigestThresholdLevel = 'yellow' | 'orange' | 'red';

export interface DigestContractRow {
  projectId: string;
  projectTitle: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  endDate: string | null;
  daysLeft: number | null;
  percent: number;
  hoursConsumed: number;
  hoursContracted: number;
  level: DigestThresholdLevel | null;
  levelLabel: string | null;
  levelColor: string | null;
}

export interface DigestUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface DigestStaleTaskRow {
  id: string;
  title: string;
  technicianName: string | null;
  projectTitle: string | null;
  daysIdle: number;
  lastUpdate: string;
}

export interface DigestInactiveTechnicianRow {
  id: string;
  name: string;
  email: string;
  daysIdle: number;
}

export interface DailyDigestReport {
  expiringContracts: DigestContractRow[];
  thresholdContracts: DigestContractRow[];
  newUsers: DigestUserRow[];
  staleTasks: DigestStaleTaskRow[];
  inactiveTechnicians: DigestInactiveTechnicianRow[];
  generatedAt: string;
}

export interface DailyDigestReportFlags {
  hasExpiring: boolean;
  hasThresholds: boolean;
  hasNewUsers: boolean;
  hasStaleTasks: boolean;
  hasInactiveTechnicians: boolean;
  isEmpty: boolean;
}
