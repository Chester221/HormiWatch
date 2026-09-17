import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { Temporal } from 'temporal-polyfill';
import { Holiday } from './entities/holiday.entity';
import { PageDto } from '../../common/pagination/pagination.dto';
import { PageMeta } from 'src/common/pagination/metadata';
import { Project } from '../projects/entities/project.entity';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services/services.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isUUID } from 'class-validator';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { TaskResponseDto } from './dto/task-response.dto';
import { plainToInstance } from 'class-transformer';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { TaskStatus } from './enums/task-status.enum';
import { IActiveUser } from '../auth/interface/payload.interface';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private validateId(id: string): void {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }

  private isTechnician(user?: IActiveUser): user is IActiveUser {
    return !!user && String(user.role).toLowerCase() === 'technician';
  }

  private async buildFactorBreakdown(
    start: Temporal.Instant,
    end: Temporal.Instant,
    timeZone: string,
  ): Promise<{ factor: number; label: string; hours: number }[]> {
    // Fechas locales únicas del rango para consultar feriados una sola vez
    const dateStrs = new Set<string>();
    let cursor = start.toZonedDateTimeISO(timeZone);
    while (Temporal.Instant.compare(cursor.toInstant(), end) < 0) {
      dateStrs.add(cursor.toPlainDate().toString());
      cursor = cursor.add({ minutes: 1 });
    }

    const holidays = await this.holidayRepository.find({
      where: { date: In([...dateStrs].map((d) => new Date(d))) },
    });
    const holidaySet = new Set<string>();
    for (const h of holidays) {
      const raw = h.date as unknown as Date | string;
      if (raw instanceof Date) {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, '0');
        const day = String(raw.getDate()).padStart(2, '0');
        holidaySet.add(`${y}-${m}-${day}`);
      } else {
        holidaySet.add(String(raw).slice(0, 10));
      }
    }

    const buckets = new Map<
      string,
      { factor: number; label: string; minutes: number }
    >();

    const addMinute = (factor: number, label: string) => {
      const key = `${factor}|${label}`;
      const existing = buckets.get(key);
      if (existing) existing.minutes += 1;
      else buckets.set(key, { factor, label, minutes: 1 });
    };

    let m = start;
    while (Temporal.Instant.compare(m, end) < 0) {
      const z = m.toZonedDateTimeISO(timeZone);
      const dateStr = z.toPlainDate().toString();
      const dayOfWeek = z.dayOfWeek; // 1 = Lunes, 7 = Domingo
      const hour = z.hour;

      // Domingo ×2 (siempre, incluso si es feriado)
      if (dayOfWeek === 7) addMinute(2, 'Domingo');
      // Feriado (lunes a sábado) ×2
      else if (holidaySet.has(dateStr)) addMinute(2, 'Feriado');
      // Sábado (no feriado) ×1.5
      else if (dayOfWeek === 6) addMinute(1.5, 'Sábado');
      // Lunes a Viernes diurno (6:00–18:59) ×1
      else if (hour >= 6 && hour < 19) addMinute(1, 'Diurno (L–V)');
      // Lunes a Viernes nocturno (19:00–05:59) ×1.5
      else addMinute(1.5, 'Nocturno (L–V)');

      m = m.add({ minutes: 1 });
    }

    return [...buckets.values()]
      .filter((b) => b.minutes > 0)
      .map((b) => ({
        factor: b.factor,
        label: b.label,
        hours: Math.round((b.minutes / 60) * 100) / 100,
      }));
  }

  private async checkForOverlaps(
    technicianId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<void> {
    // Check for any task by this technician that overlaps with [start, end]
    // (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
    const overlap = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.technician.id = :technicianId', { technicianId })
      .andWhere('task.startDateTime < :end', { end: end.toString() })
      .andWhere('task.endDateTime > :start', { start: start.toString() })
      .getOne();

    if (overlap) {
      throw new ConflictException(
        `Task overlaps with an existing task for technician ${technicianId} (${overlap.startDateTime.toString()} - ${overlap.endDateTime.toString()})`,
      );
    }
  }

  async create(
    createTaskDto: CreateTaskDto,
    creator: IActiveUser,
  ): Promise<TaskResponseDto[]> {
    const {
      technicianId,
      projectId,
      serviceId,
      startDateTime: startIso,
      endDateTime: endIso,
    } = createTaskDto;

    const isTechnicianRole = this.isTechnician(creator);

    // 1. Validations
    const effectiveTechnicianId = isTechnicianRole
      ? creator.userId
      : technicianId;
    this.validateId(effectiveTechnicianId);
    if (projectId) this.validateId(projectId);
    this.validateId(serviceId);

    // Only technicians can be the task owner, and only for their own tasks
    const technician = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: effectiveTechnicianId }, relations: ['profile'] });
    if (!technician) throw new NotFoundException('Technician not found');

    if (isTechnicianRole && technicianId !== creator.userId) {
      throw new ForbiddenException(
        'A technician can only create tasks for themselves',
      );
    }

    const service = await this.dataSource
      .getRepository(Service)
      .findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    let project: Project | null = null;
    if (projectId) {
      project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['technicians'],
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.status === ProjectStatus.COMPLETED) {
        throw new BadRequestException(
          'Cannot add tasks to a completed project',
        );
      }
      if (isTechnicianRole) {
        const isMember =
          project.technicians?.some((t) => t.id === creator.userId) ||
          project.projectLeader?.id === creator.userId;
        if (!isMember) {
          throw new ForbiddenException(
            'You can only create tasks in projects you are assigned to',
          );
        }
      }
    }

    const startInstant = Temporal.Instant.from(startIso);
    const endInstant = Temporal.Instant.from(endIso);
    const now = Temporal.Now.instant();

    if (Temporal.Instant.compare(startInstant, endInstant) >= 0) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (Temporal.Instant.compare(startInstant, now.add({ milliseconds: 5 * 60 * 1000 })) > 0) {
      throw new BadRequestException('No se pueden crear tareas en el futuro');
    }

    // 2. Cálculo de factores (UNA sola tarea por registro)
    // Zona horaria de los usuarios (Venezuela por defecto). Configurable con APP_TIMEZONE.
    const timeZone = process.env.APP_TIMEZONE || 'America/Caracas';
    const baseRate = Number(project ? project.hourlyRate : 0);
    const factorBreakdown = await this.buildFactorBreakdown(
      startInstant,
      endInstant,
      timeZone,
    );

    // 3. Ejecución
    let savedTask: Task;
    await this.dataSource.transaction(async (manager) => {
      // Overlap Check (rango completo)
      await this.checkForOverlaps(effectiveTechnicianId, startInstant, endInstant);

      const askedCompleted = createTaskDto.status === TaskStatus.COMPLETED;
      const taskEntity = this.taskRepository.create({
        ...createTaskDto,
        startDateTime: startInstant,
        endDateTime: endInstant,
        technician: { id: effectiveTechnicianId },
        project: projectId ? { id: projectId } : undefined,
        service: { id: serviceId },
        createdBy: creator.userId,
        completedAt: askedCompleted ? Temporal.Now.instant() : undefined,
        appliedHourlyRate: baseRate,
        factorBreakdown,
      });

      savedTask = await manager.save(Task, taskEntity);
      savedTask.technician = technician;
      if (project) {
        savedTask.project = project;
      }
      savedTask.service = service;

      // Update Project Pool Hours (Unconditional Reservation)
      if (project) {
        const durationHours = startInstant
          .until(endInstant)
          .total({ unit: 'hours' });
        const currentPool = Number(project.poolHours || 0);
        const newPool = currentPool - durationHours;
        project.poolHours = newPool;
        await manager.save(Project, project);
      }
    });

    const transformedTask = {
      ...savedTask!,
      startDateTime: savedTask!.startDateTime.toString(),
      endDateTime: savedTask!.endDateTime.toString(),
      completedAt: savedTask!.completedAt
        ? savedTask!.completedAt.toString()
        : null,
    };

    return plainToInstance(TaskResponseDto, [transformedTask]);
  }

  getTaskStatuses(): string[] {
    return Object.values(TaskStatus);
  }

  async findAll(
    filterDto: FilterTaskDto,
    user?: IActiveUser,
  ): Promise<PageDto<Task>> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    queryBuilder
      .leftJoinAndSelect('task.technician', 'technician')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.service', 'service');

    if (this.isTechnician(user)) {
      queryBuilder.andWhere('task.technician.id = :userId', {
        userId: user.userId,
      });
    }

    if (filterDto.projectId) {
      this.validateId(filterDto.projectId);
      queryBuilder.andWhere('task.project.id = :projectId', {
        projectId: filterDto.projectId,
      });
    }

    if (filterDto.technicianId) {
      this.validateId(filterDto.technicianId);
      queryBuilder.andWhere('task.technician.id = :technicianId', {
        technicianId: filterDto.technicianId,
      });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filterDto.status,
      });
    }

    if (filterDto.startDateTime) {
      queryBuilder.andWhere('task.startDateTime >= :startDateTime', {
        startDateTime: filterDto.startDateTime,
      });
    }

    if (filterDto.endDateTime) {
      queryBuilder.andWhere('task.endDateTime <= :endDateTime', {
        endDateTime: filterDto.endDateTime,
      });
    }

    if (filterDto.q) {
      queryBuilder.andWhere(
        '(task.description LIKE :q OR task.title LIKE :q)',
        { q: `%${filterDto.q}%` },
      );
    }

    queryBuilder
      .orderBy('task.createdAt', filterDto.order)
      .skip(filterDto.skip)
      .take(filterDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMeta(filterDto, itemCount);

    return new PageDto(entities, pageMetaDto);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user?: IActiveUser,
  ): Promise<Task> {
    this.validateId(id);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'technician', 'service'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (this.isTechnician(user) && task.technician?.id !== user.userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // 1. Calculate Old Duration
    const oldStart = Temporal.Instant.from(task.startDateTime.toString());
    const oldEnd = Temporal.Instant.from(task.endDateTime.toString());
    const oldDuration = oldStart.until(oldEnd).total({ unit: 'hours' });

    // 2. Prepare New Dates
    const newStart = updateTaskDto.startDateTime
      ? Temporal.Instant.from(updateTaskDto.startDateTime)
      : oldStart;
    const newEnd = updateTaskDto.endDateTime
      ? Temporal.Instant.from(updateTaskDto.endDateTime)
      : oldEnd;

    // 3. Calculate New Duration & Diff
    const newDuration = newStart.until(newEnd).total({ unit: 'hours' });
    const diff = newDuration - oldDuration;

    // 4. Track completion date when status changes
    const oldStatus = task.status;
    const newStatus = updateTaskDto.status;
    if (newStatus) {
      const targetStatus = newStatus as unknown as TaskStatus;
      if (
        targetStatus === TaskStatus.COMPLETED &&
        oldStatus !== TaskStatus.COMPLETED
      ) {
        task.completedAt = Temporal.Now.instant();
      } else if (
        targetStatus !== TaskStatus.COMPLETED &&
        oldStatus === TaskStatus.COMPLETED
      ) {
        task.completedAt = null as unknown as Temporal.Instant;
      }
    }

    // 5. Update Project Pool if changed
    if (Math.abs(diff) > 0 && task.project) {
      const currentPool = Number(task.project.poolHours || 0);
      task.project.poolHours = currentPool - diff;
      await this.projectRepository.save(task.project);
    }

    // 6. Recalculate factor breakdown for the new span
    if (task.project) {
      const timeZone = process.env.APP_TIMEZONE || 'America/Caracas';
      task.factorBreakdown = await this.buildFactorBreakdown(
        newStart,
        newEnd,
        timeZone,
      );
    }

    // Merge changes
    const updatedTask = this.taskRepository.merge(task, {
      ...updateTaskDto,
      startDateTime: newStart,
      endDateTime: newEnd,
    });

    return await this.taskRepository.save(updatedTask);
  }

  async remove(id: string, user?: IActiveUser): Promise<void> {
    this.validateId(id);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'technician'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (this.isTechnician(user) && task.technician?.id !== user.userId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    // Restore Pool Hours (Always, as we reserved them on Create)
    if (task.project) {
      const start = Temporal.Instant.from(task.startDateTime.toString());
      const end = Temporal.Instant.from(task.endDateTime.toString());
      const duration = start.until(end).total({ unit: 'hours' });

      const currentPool = Number(task.project.poolHours || 0);
      task.project.poolHours = currentPool + duration;
      await this.projectRepository.save(task.project);
    }

    await this.taskRepository.softRemove(task);
  }

  async findOne(id: string): Promise<Task> {
    this.validateId(id);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['technician', 'project', 'service'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }
}
