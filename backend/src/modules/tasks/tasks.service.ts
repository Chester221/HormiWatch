import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

  private async calculateRateMultiplier(
    date: Temporal.ZonedDateTime,
  ): Promise<number> {
    const dayOfWeek = date.dayOfWeek; // 1 = Monday, 7 = Sunday

    // Check if it is a holiday
    // Temporal.ZonedDateTime to YYYY-MM-DD string
    const dateStr = date.toPlainDate().toString();
    const holiday = await this.holidayRepository.findOne({
      where: { date: new Date(dateStr) },
    });
    if (holiday) {
      return 1.5; // Holiday rate
    }

    // Saturday (6) and Sunday (7)
    if (dayOfWeek === 6 || dayOfWeek === 7) {
      return 1.5;
    }

    return 1.0;
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

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto[]> {
    const {
      technicianId,
      projectId,
      serviceId,
      startDateTime: startIso,
      endDateTime: endIso,
    } = createTaskDto;

    // 1. Validations
    this.validateId(technicianId);
    if (projectId) this.validateId(projectId);
    this.validateId(serviceId);

    const technician = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: technicianId }, relations: ['profile'] });
    if (!technician) throw new NotFoundException('Technician not found');

    const service = await this.dataSource
      .getRepository(Service)
      .findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    let project: Project | null = null;
    if (projectId) {
      project = await this.projectRepository.findOneBy({ id: projectId });
      if (!project) throw new NotFoundException('Project not found');
      if (project.status === ProjectStatus.COMPLETED) {
        throw new BadRequestException(
          'Cannot add tasks to a completed project',
        );
      }
    }

    const startInstant = Temporal.Instant.from(startIso);
    const endInstant = Temporal.Instant.from(endIso);
    const now = Temporal.Now.instant();

    if (Temporal.Instant.compare(startInstant, endInstant) >= 0) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (Temporal.Instant.compare(startInstant, now) > 0) {
      throw new BadRequestException('Cannot create tasks in the future');
    }

    // 2. Split Logic (Overnight)
    const timeZone = Temporal.Now.zonedDateTimeISO().timeZoneId;
    const startZoned = startInstant.toZonedDateTimeISO(timeZone);
    const endZoned = endInstant.toZonedDateTimeISO(timeZone);

    const tasksToCreate: { start: Temporal.Instant; end: Temporal.Instant }[] =
      [];

    if (!startZoned.startOfDay().equals(endZoned.startOfDay())) {
      const midnightNextDay = startZoned.add({ days: 1 }).startOfDay();
      tasksToCreate.push({
        start: startInstant,
        end: midnightNextDay.toInstant(),
      });
      tasksToCreate.push({
        start: midnightNextDay.toInstant(),
        end: endInstant,
      });
    } else {
      tasksToCreate.push({ start: startInstant, end: endInstant });
    }

    // 3. Execution
    const createdTasks: Task[] = [];
    await this.dataSource.transaction(async (manager) => {
      for (const segment of tasksToCreate) {
        // Overlap Check (Segment specific)
        await this.checkForOverlaps(technicianId, segment.start, segment.end);

        // Rate Calculation
        const segmentZoned = segment.start.toZonedDateTimeISO(timeZone);
        const multiplier = await this.calculateRateMultiplier(segmentZoned);
        const baseRate = project ? project.hourlyRate : 0;
        const finalRate = Number(baseRate) * multiplier;

        // Create Task
        const taskEntity = this.taskRepository.create({
          ...createTaskDto,
          startDateTime: segment.start,
          endDateTime: segment.end,
          technician: { id: technicianId },
          project: projectId ? { id: projectId } : undefined,
          service: { id: serviceId },
          appliedHourlyRate: finalRate,
        });

        const savedTask = await manager.save(Task, taskEntity);
        savedTask.technician = technician;
        if (project) {
          savedTask.project = project;
        }
        savedTask.service = service;
        createdTasks.push(savedTask);

        // Update Project Pool Hours (Unconditional Reservation)
        if (project) {
          const durationHours = segment.start
            .until(segment.end)
            .total({ unit: 'hours' });
          const currentPool = Number(project.poolHours || 0);
          const newPool = currentPool - durationHours;
          project.poolHours = newPool;
          await manager.save(Project, project);
        }
      }
    });

    const transformedTasks = createdTasks.map((task) => ({
      ...task,
      startDateTime: task.startDateTime.toString(),
      endDateTime: task.endDateTime.toString(),
    }));

    return plainToInstance(TaskResponseDto, transformedTasks);
  }

  getTaskStatuses(): string[] {
    return Object.values(TaskStatus);
  }

  async findAll(filterDto: FilterTaskDto): Promise<PageDto<Task>> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    queryBuilder
      .leftJoinAndSelect('task.technician', 'technician')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.service', 'service');

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
      queryBuilder.andWhere('task.description LIKE :q', {
        q: `%${filterDto.q}%`,
      });
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

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    this.validateId(id);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'technician', 'service'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
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

    // 4. Update Project Pool if changed
    if (Math.abs(diff) > 0 && task.project) {
      const currentPool = Number(task.project.poolHours || 0);
      task.project.poolHours = currentPool - diff;
      await this.projectRepository.save(task.project);
    }

    // Merge changes
    const updatedTask = this.taskRepository.merge(task, {
      ...updateTaskDto,
      startDateTime: newStart,
      endDateTime: newEnd,
    });

    return await this.taskRepository.save(updatedTask);
  }

  async remove(id: string): Promise<void> {
    this.validateId(id);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
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
