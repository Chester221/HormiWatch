import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { ProjectStatus } from 'src/modules/projects/enums/project-status.enum';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { TaskStatus } from 'src/modules/tasks/enums/task-status.enum';
import { ContractThresholdContext } from '../interfaces/threshold-context.interface';
import { Temporal } from 'temporal-polyfill';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationEvent } from '../events/notification.event';
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

  private get timeZone(): string {
    return process.env.APP_TIMEZONE || 'America/Caracas';
  }

  /**
   * Evalúa umbrales de consumo (80/95/100) y vencimiento (15 días) de un
   * proyecto/contrato y emite las alertas que correspondan (con dedupe).
   */
  async checkAndNotify(projectId: string): Promise<void> {
    const ctx = await this.evaluate(projectId);
    if (!ctx) return;
    const s = await this.settings.get();
    const t = s.thresholds;

    const levels: Array<{
      pct: number;
      level: NotificationLevel;
      color: string;
    }> = [
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
            `El proyecto "${ctx.projectTitle}" del cliente "${ctx.customerName}" ha alcanzado el ${ctx.percent}% de consumo (${ctx.hoursConsumed.toFixed(1)}h de ${ctx.hoursContracted.toFixed(1)}h).${this.contactSuffix(ctx)}`,
            [
              {
                type: 'project',
                projectId,
                includeLeader: true,
                includeAdmins: true,
              },
            ],
            {
              projectId,
              projectTitle: ctx.projectTitle,
              customerName: ctx.customerName,
              customerPhone: ctx.customerPhone,
              customerEmail: ctx.customerEmail,
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
          `El proyecto "${ctx.projectTitle}" vence el ${ctx.endDate}.${this.contactSuffix(ctx)}`,
          [
            {
              type: 'project',
              projectId,
              includeLeader: true,
              includeAdmins: true,
            },
          ],
          {
            projectId,
            endDate: ctx.endDate,
            customerPhone: ctx.customerPhone,
            customerEmail: ctx.customerEmail,
          },
          `contract:${projectId}:expiring:${ctx.endDate}`,
        ),
      );
    }
  }

  /** Texto de contacto del cliente (telefono / correo) para los mensajes */
  private contactSuffix(ctx: ContractThresholdContext): string {
    const phone = ctx.customerPhone || null;
    const email = ctx.customerEmail || null;
    if (phone && email) return ` Contacto: ${phone} / ${email}`;
    if (phone) return ` Contacto: ${phone}`;
    if (email) return ` Contacto: ${email}`;
    return '';
  }

  async evaluate(projectId: string): Promise<ContractThresholdContext | null> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['tasks', 'customerContact', 'customerContact.customer'],
    });
    if (!project) return null;

    const context = this.buildContext(project);
    if (!context) return null;

    project.hoursConsumed = context.hoursConsumed;
    await this.projectRepo.save(project).catch(() => undefined);

    return context;
  }

  /**
   * Contextos de consumo de todos los contratos/proyectos activos
   * (sin completar ni cancelados). No escribe en la base de datos.
   */
  async listActiveContexts(): Promise<ContractThresholdContext[]> {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.tasks', 'task')
      .leftJoinAndSelect('project.customerContact', 'customerContact')
      .leftJoinAndSelect('customerContact.customer', 'customer')
      .where(
        '(project.status IS NULL OR project.status NOT IN (:...statuses))',
        { statuses: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] },
      )
      .getMany();

    return projects
      .map((project) => this.buildContext(project))
      .filter((ctx): ctx is ContractThresholdContext => ctx !== null);
  }

  /** Calcula el consumo de un proyecto ya cargado con sus tareas */
  private buildContext(project: Project): ContractThresholdContext | null {
    const allTasks = project.tasks || [];
    const consumed = allTasks
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.durationInHours || 0), 0);

    const pool = Number(project.poolHours || 0);
    const contracted = pool + consumed;
    if (contracted <= 0) return null;
    const percent = Math.round((consumed / contracted) * 100);

    return {
      projectId: project.id,
      projectTitle: project.title,
      customerName:
        project.customerContact?.customer?.name ||
        project.customerContact?.name ||
        'Sin cliente',
      customerPhone: project.customerContact?.phone || null,
      customerEmail: project.customerContact?.email || null,
      poolHours: pool,
      hoursConsumed: consumed,
      hoursContracted: contracted,
      hoursRemaining: pool,
      percent,
      endDate: project.endDate?.toString() || null,
    };
  }

  getExpirationWarning(endDateStr: string | null, days: number): boolean {
    if (!endDateStr) return false;
    try {
      const end = Temporal.PlainDate.from(endDateStr);
      const now = Temporal.Now.plainDateISO(this.timeZone);
      const diff = now.until(end).days;
      return diff <= days && diff >= 0;
    } catch {
      return false;
    }
  }
}
