import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Temporal } from 'temporal-polyfill';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { TaskStatus } from 'src/modules/tasks/enums/task-status.enum';
import { Holiday } from 'src/modules/tasks/entities/holiday.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/auth/enums/roles.enum';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationSettingsService } from './notification-settings.service';
import {
  DigestInactiveTechnicianRow,
  DigestStaleTaskRow,
} from '../interfaces/daily-digest.interface';
import {
  countBusinessDays,
  subtractBusinessDays,
} from '../utils/business-days.util';

/** Claves de evento (para el toggle por evento) */
export const STALE_TASKS_EVENT_KEY = 'tasks.stale';
export const INACTIVE_TECHNICIANS_EVENT_KEY = 'users.inactiveTechnician';

/** Prefijos de dedupe: las notificaciones con estos prefijos ya aparecen en
 *  las tablas del reporte, por eso se excluyen de la lista personal. */
export const REPORT_EVENT_KEY_PREFIXES = ['stale:', 'inactive:'];

@Injectable()
export class StaleDetectionService {
  private readonly logger = new Logger(StaleDetectionService.name);

  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    private readonly emitter: NotificationEmitterService,
    private readonly settings: NotificationSettingsService,
  ) {}

  private get timeZone(): string {
    return process.env.APP_TIMEZONE || 'America/Caracas';
  }

  private today(): Temporal.PlainDate {
    return Temporal.Now.plainDateISO(this.timeZone);
  }

  private startOfDay(date: Temporal.PlainDate): Temporal.Instant {
    return date
      .toZonedDateTime({
        timeZone: this.timeZone,
        plainTime: { hour: 0, minute: 0, second: 0 },
      })
      .toInstant();
  }

  /** Feriados y dias no laborables (Holiday.isWorkingDay = false) en formato yyyy-mm-dd */
  private async loadNonWorkingDays(): Promise<Set<string>> {
    const holidays = await this.holidayRepo.find({
      where: { isWorkingDay: false },
    });
    return new Set(
      holidays.map((h) =>
        h.date instanceof Date
          ? h.date.toISOString().split('T')[0]
          : String(h.date).slice(0, 10),
      ),
    );
  }

  /**
   * Tareas que ya Deverian haber avanzado pero llevan `staleDays` sin cambios
   * (sin movimientos) y todavia no estan completadas ni canceladas.
   */
  async findStaleTasks(staleDays: number): Promise<DigestStaleTaskRow[]> {
    const today = this.today();
    const cutoffDate = today.subtract({ days: Math.max(1, staleDays) });
    const cutoffInstant = this.startOfDay(cutoffDate);
    const nowInstant = Temporal.Now.instant();

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.technician', 'technician')
      .leftJoinAndSelect('technician.profile', 'technicianProfile')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.status NOT IN (:...statuses)', {
        statuses: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      })
      .andWhere('task.updated_at < :cutoff', {
        cutoff: new Date(cutoffInstant.epochMilliseconds),
      })
      .orderBy('task.updated_at', 'ASC')
      .getMany();

    return tasks
      .filter(
        (t) =>
          !t.startDateTime ||
          Temporal.Instant.compare(t.startDateTime, nowInstant) < 0,
      )
      .map((t) => {
        const lastUpdate = t.updatedAt
          ? Temporal.Instant.from(t.updatedAt.toISOString())
              .toZonedDateTimeISO(this.timeZone)
              .toPlainDate()
          : cutoffDate;
        return {
          id: t.id,
          title: t.title || 'Tarea sin titulo',
          technicianName: t.technician?.profile?.name || null,
          projectTitle: t.project?.title || null,
          daysIdle: Math.max(0, today.since(lastUpdate).days),
          lastUpdate: lastUpdate.toString(),
        };
      });
  }

  /**
   * Tecnicos activos que no registran horas (tareas completadas) desde hace
   * `inactivityDays` dias habiles (sin contar fines de semana ni feriados).
   */
  async findInactiveTechnicians(
    inactivityDays: number,
  ): Promise<DigestInactiveTechnicianRow[]> {
    const days = Math.max(1, inactivityDays);
    const today = this.today();
    const nonWorkingDays = await this.loadNonWorkingDays();
    const cutoffDate = subtractBusinessDays(today, days, nonWorkingDays);
    const cutoffInstant = this.startOfDay(cutoffDate);

    const technicians = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('user.role', 'role')
      .where('user.is_active = true')
      .andWhere('LOWER(role.name) IN (:...roles)', {
        roles: [Role.technician.toLowerCase(), Role.employee.toLowerCase()],
      })
      .getMany();

    if (!technicians.length) return [];

    const activity = await this.taskRepo
      .createQueryBuilder('task')
      .select('task.technician_id', 'technicianId')
      .where('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.technician_id IS NOT NULL')
      .andWhere('task.updated_at >= :since', {
        since: new Date(cutoffInstant.epochMilliseconds),
      })
      .andWhere('task.deleted_at IS NULL')
      .groupBy('task.technician_id')
      .getRawMany<{ technicianId: string }>();

    const activeTechnicianIds = new Set(
      activity.map((a) => a.technicianId).filter(Boolean),
    );

    return technicians
      .filter((t) => !activeTechnicianIds.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.profile?.name || t.email,
        email: t.email,
        daysIdle: countBusinessDays(cutoffDate, today, nonWorkingDays),
      }));
  }

  /**
   * Detecta y notifica a los administradores. Devuelve lo detectado para
   * reutilizarlo en el reporte del resumen diario.
   */
  async detectAndNotify(): Promise<{
    staleTasks: DigestStaleTaskRow[];
    inactiveTechnicians: DigestInactiveTechnicianRow[];
  }> {
    const s = await this.settings.get();
    const t = s.thresholds;

    const staleTasks = await this.findStaleTasks(t.taskStaleDays);
    const inactiveTechnicians = await this.findInactiveTechnicians(
      t.inactivityDays,
    );

    const today = this.today().toString();

    if (staleTasks.length) {
      this.emitter.toAdmins(
        STALE_TASKS_EVENT_KEY,
        NotificationCategory.TASKS,
        NotificationLevel.WARNING,
        `${staleTasks.length} tarea(s) estancada(s)`,
        staleTasks
          .map(
            (task) =>
              `${task.title} (${task.technicianName || 'sin tecnico'}) - ${task.daysIdle} dia(s) sin cambios`,
          )
          .join(' | '),
        { tasks: staleTasks, staleDays: t.taskStaleDays },
        `stale:tasks:${today}`,
      );
    }

    if (inactiveTechnicians.length) {
      this.emitter.toAdmins(
        INACTIVE_TECHNICIANS_EVENT_KEY,
        NotificationCategory.USERS,
        NotificationLevel.WARNING,
        `${inactiveTechnicians.length} tecnico(s) sin registrar horas`,
        inactiveTechnicians
          .map(
            (tech) =>
              `${tech.name} - ${tech.daysIdle} dia(s) habil(es) sin actividad`,
          )
          .join(' | '),
        {
          technicians: inactiveTechnicians,
          inactivityDays: t.inactivityDays,
        },
        `inactive:technicians:${today}`,
      );
    }

    if (staleTasks.length || inactiveTechnicians.length) {
      this.logger.log(
        `Deteccion: ${staleTasks.length} tarea(s) estancada(s), ${inactiveTechnicians.length} tecnico(s) inactivo(s)`,
      );
    }

    return { staleTasks, inactiveTechnicians };
  }
}
