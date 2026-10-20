import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { ContractThresholdContext } from '../interfaces/threshold-context.interface';
import { Temporal } from 'temporal-polyfill';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationEvent, NOTIFICATION_DISPATCH_EVENT } from '../events/notification.event';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';

@Injectable()
export class ContractThresholdsService {
  private readonly logger = new Logger(ContractThresholdsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly emitter: NotificationEmitterService,
    private readonly settings: NotificationSettingsService,
  ) {}

  /**
   * Evalúa umbrales de consumo (80/95/100) y vencimiento (15 días) de un
   * proyecto/contrato y emite las alertas que correspondan (con dedupe).
   */
  async checkAndNotify(projectId: string): Promise<void> {
    const ctx = await this.evaluate(projectId);
    if (!ctx) return;
    const s = await this.settings.get();
    const t = s.thresholds;

    const levels: Array<{ pct: number; level: NotificationLevel; color: string }> = [
      { pct: t.yellow, level: NotificationLevel.WARNING, color: 'amarillo' },
      { pct: t.orange, level: NotificationLevel.WARNING, color: 'naranja' },
      { pct: t.red, level: NotificationLevel.CRITICAL, color: 'rojo' },
    ];

    for (const item of levels) {
      if (ctx.percent >= item.pct) {
        const title =
          item.level === NotificationLevel.CRITICAL
            ? `Alerta: Contrato agotado (${ctx.percent}%)`
            : `Alerta: Contrato al ${item.pct}%`;
        this.emitter.emit(
          new NotificationEvent(
            `contract.threshold.${item.pct}`,
            NotificationCategory.CONTRACTS,
            item.level,
            title,
            `El proyecto "${ctx.projectTitle}" del cliente "${ctx.customerName}" ha alcanzado el ${ctx.percent}% de consumo (${ctx.hoursConsumed.toFixed(1)}h de ${ctx.hoursContracted.toFixed(1)}h).${(ctx as any).customerPhone ? ` Contacto: ${(ctx as any).customerPhone}${(ctx as any).customerEmail ? ` / ${(ctx as any).customerEmail}` : ''}` : (ctx as any).customerEmail ? ` Contacto: ${(ctx as any).customerEmail}` : ''}`,
            [{ type: 'project', projectId, includeLeader: true, includeAdmins: true }],
            {
              projectId,
              projectTitle: ctx.projectTitle,
              customerName: ctx.customerName,
              customerPhone: (ctx as any).customerPhone,
              customerEmail: (ctx as any).customerEmail,
              hoursContracted: ctx.hoursContracted,
              hoursConsumed: ctx.hoursConsumed,
              hoursRemaining: ctx.hoursRemaining,
              endDate: ctx.endDate,
              percent: ctx.percent,
            },
            `contract:${projectId}:pct:${item.pct}`,
          ),
        );
      }
    }

    if (ctx.endDate && this.getExpirationWarning(ctx.endDate, t.expiringDays)) {
        this.emitter.emit(
          new NotificationEvent(
            'contract.expiring',
            NotificationCategory.CONTRACTS,
            NotificationLevel.WARNING,
            'Alerta: Contrato por vencer',
            `El proyecto "${ctx.projectTitle}" vence el ${ctx.endDate}.${(ctx as any).customerPhone ? ` Contacto: ${(ctx as any).customerPhone}${(ctx as any).customerEmail ? ` / ${(ctx as any).customerEmail}` : ''}` : (ctx as any).customerEmail ? ` Contacto: ${(ctx as any).customerEmail}` : ''}`,
            [{ type: 'project', projectId, includeLeader: true, includeAdmins: true }],
            { projectId, endDate: ctx.endDate, customerPhone: (ctx as any).customerPhone, customerEmail: (ctx as any).customerEmail },
            `contract:${projectId}:expiring:${ctx.endDate}`,
          ),
        );
    }
  }

  async evaluate(projectId: string): Promise<ContractThresholdContext | null> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['tasks', 'customerContact', 'customerContact.customer'],
    });
    if (!project) return null;

    const allTasks = project.tasks || [];
    const consumed = allTasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.durationInHours || 0), 0);

    const pool = Number(project.poolHours || 0);
    const contracted = pool + consumed;
    if (contracted <= 0) return null;
    const percent = Math.round((consumed / contracted) * 100);

    const context: ContractThresholdContext = {
      projectId: project.id,
      projectTitle: project.title,
      customerName: project.customerContact?.customer?.name || project.customerContact?.name || 'Sin cliente',
      customerPhone: project.customerContact?.phone || null,
      customerEmail: project.customerContact?.email || null,
      poolHours: pool,
      hoursConsumed: consumed,
      hoursContracted: contracted,
      hoursRemaining: pool,
      percent,
      endDate: project.endDate?.toString() || null,
    } as any;

    project.hoursConsumed = consumed;
    await this.projectRepo.save(project).catch(() => undefined);

    return context;
  }

  getExpirationWarning(endDateStr: string | null, days: number): boolean {
    if (!endDateStr) return false;
    try {
      const end = Temporal.PlainDate.from(endDateStr);
      const now = Temporal.Now.plainDateISO();
      const diff = now.until(end).days;
      return diff <= days && diff >= 0;
    } catch {
      return false;
    }
  }
}
