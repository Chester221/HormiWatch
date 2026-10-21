import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Temporal } from 'temporal-polyfill';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/auth/enums/roles.enum';
import { NotificationThresholds } from '../interfaces/notification-settings.interface';
import {
  DailyDigestReport,
  DailyDigestReportFlags,
  DigestContractRow,
  DigestInactiveTechnicianRow,
  DigestStaleTaskRow,
  DigestThresholdLevel,
  DigestUserRow,
} from '../interfaces/daily-digest.interface';
import { ContractThresholdsService } from './contract-thresholds.service';
import { StaleDetectionService } from './stale-detection.service';

export interface DigestRecipient {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class DailyDigestService {
  private readonly logger = new Logger(DailyDigestService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly contractThresholds: ContractThresholdsService,
    private readonly staleDetection: StaleDetectionService,
  ) {}

  private get timeZone(): string {
    return process.env.APP_TIMEZONE || 'America/Caracas';
  }

  /** Administradores activos (reciben el reporte completo) */
  async getAdmins(): Promise<DigestRecipient[]> {
    const admins = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('user.role', 'role')
      .where('user.is_active = true')
      .andWhere('LOWER(role.name) = :admin', {
        admin: Role.admin.toLowerCase(),
      })
      .getMany();

    return admins
      .filter((a) => !!a.email)
      .map((a) => ({
        id: a.id,
        email: a.email,
        name: a.profile?.name || a.email,
      }));
  }

  /**
   * Construye el reporte del dia con las 4 tablas:
   * contratos por vencer, contratos por umbral, usuarios nuevos y
   * tareas estancadas (+ tecnicos inactivos).
   */
  async buildReport(
    thresholds: NotificationThresholds,
    detection?: {
      staleTasks: DigestStaleTaskRow[];
      inactiveTechnicians: DigestInactiveTechnicianRow[];
    },
  ): Promise<DailyDigestReport> {
    const today = Temporal.Now.plainDateISO(this.timeZone);
    const contexts = await this.contractThresholds.listActiveContexts();

    const expiringContracts: DigestContractRow[] = [];
    const thresholdContracts: DigestContractRow[] = [];

    for (const ctx of contexts) {
      const daysLeft = ctx.endDate
        ? today.until(Temporal.PlainDate.from(ctx.endDate)).days
        : null;
      const level = this.levelFor(ctx.percent, thresholds);

      const row: DigestContractRow = {
        projectId: ctx.projectId,
        projectTitle: ctx.projectTitle,
        customerName: ctx.customerName,
        customerPhone: ctx.customerPhone ?? null,
        customerEmail: ctx.customerEmail ?? null,
        endDate: ctx.endDate,
        daysLeft,
        percent: ctx.percent,
        hoursConsumed: Number(ctx.hoursConsumed.toFixed(1)),
        hoursContracted: Number(ctx.hoursContracted.toFixed(1)),
        level: level.level,
        levelLabel: level.label,
        levelColor: level.color,
      };

      if (
        daysLeft !== null &&
        daysLeft >= 0 &&
        daysLeft <= thresholds.expiringDays
      ) {
        expiringContracts.push(row);
      }
      if (level.level) {
        thresholdContracts.push(row);
      }
    }

    expiringContracts.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    thresholdContracts.sort((a, b) => b.percent - a.percent);

    const newUsers = await this.findNewUsers();

    const detected = detection ?? {
      staleTasks: await this.staleDetection.findStaleTasks(
        thresholds.taskStaleDays,
      ),
      inactiveTechnicians: await this.staleDetection.findInactiveTechnicians(
        thresholds.inactivityDays,
      ),
    };

    return {
      expiringContracts,
      thresholdContracts,
      newUsers,
      staleTasks: detected.staleTasks,
      inactiveTechnicians: detected.inactiveTechnicians,
      generatedAt: today.toString(),
    };
  }

  /** Usuarios creados en las ultimas 24 horas */
  private async findNewUsers(): Promise<DigestUserRow[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await this.userRepo.find({
      where: { createdAt: MoreThan(since) },
      relations: ['role', 'profile'],
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.profile?.name || u.email,
      email: u.email,
      role: u.role?.name || 'sin rol',
      createdAt: u.createdAt ? u.createdAt.toISOString() : '',
    }));
  }

  private levelFor(
    percent: number,
    t: NotificationThresholds,
  ): {
    level: DigestThresholdLevel | null;
    label: string | null;
    color: string | null;
  } {
    if (percent >= t.red) {
      return { level: 'red', label: `Rojo (${t.red}%)`, color: '#dc2626' };
    }
    if (percent >= t.orange) {
      return {
        level: 'orange',
        label: `Naranja (${t.orange}%)`,
        color: '#f97316',
      };
    }
    if (percent >= t.yellow) {
      return {
        level: 'yellow',
        label: `Amarillo (${t.yellow}%)`,
        color: '#d9a404',
      };
    }
    return { level: null, label: null, color: null };
  }

  /** Banderas para el template (evita condiciones complejas en Handlebars) */
  buildFlags(report: DailyDigestReport): DailyDigestReportFlags {
    const hasExpiring = report.expiringContracts.length > 0;
    const hasThresholds = report.thresholdContracts.length > 0;
    const hasNewUsers = report.newUsers.length > 0;
    const hasStaleTasks = report.staleTasks.length > 0;
    const hasInactiveTechnicians = report.inactiveTechnicians.length > 0;

    return {
      hasExpiring,
      hasThresholds,
      hasNewUsers,
      hasStaleTasks,
      hasInactiveTechnicians,
      isEmpty:
        !hasExpiring &&
        !hasThresholds &&
        !hasNewUsers &&
        !hasStaleTasks &&
        !hasInactiveTechnicians,
    };
  }
}
