/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Temporal } from 'temporal-polyfill';
import { StaleDetectionService } from './stale-detection.service';
import { NotificationEmitterService } from './notification-emitter.service';
import { NotificationSettingsService } from './notification-settings.service';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { Holiday } from 'src/modules/tasks/entities/holiday.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { TaskStatus } from 'src/modules/tasks/enums/task-status.enum';
import {
  countBusinessDays,
  isBusinessDay,
  subtractBusinessDays,
} from '../utils/business-days.util';

function qbMock(result: any) {
  const qb: any = {
    leftJoinAndSelect: jest.fn(() => qb),
    leftJoin: jest.fn(() => qb),
    where: jest.fn(() => qb),
    andWhere: jest.fn(() => qb),
    orderBy: jest.fn(() => qb),
    select: jest.fn(() => qb),
    groupBy: jest.fn(() => qb),
    getMany: jest.fn(async () => result),
    getRawMany: jest.fn(async () => result),
  };
  return qb;
}

describe('business-days.util', () => {
  const wednesday = Temporal.PlainDate.from('2026-10-21');

  it('identifica fines de semana como dias no habiles', () => {
    expect(isBusinessDay(Temporal.PlainDate.from('2026-10-16'))).toBe(true);
    expect(isBusinessDay(Temporal.PlainDate.from('2026-10-17'))).toBe(false);
    expect(isBusinessDay(Temporal.PlainDate.from('2026-10-18'))).toBe(false);
  });

  it('descuenta dias habiles saltando fines de semana', () => {
    // miercoles 21/10 -> martes 20, lunes 19, (domingo 18), viernes 16
    expect(subtractBusinessDays(wednesday, 3).toString()).toBe('2026-10-16');
  });

  it('descuenta dias habiles saltando feriados', () => {
    const holidays = new Set(['2026-10-19']);
    expect(subtractBusinessDays(wednesday, 3, holidays).toString()).toBe(
      '2026-10-15',
    );
  });

  it('cuenta los dias habiles del intervalo (from, to]', () => {
    expect(
      countBusinessDays(Temporal.PlainDate.from('2026-10-16'), wednesday),
    ).toBe(3);
  });
});

describe('StaleDetectionService', () => {
  let service: StaleDetectionService;
  let taskRepo: any;
  let userRepo: any;
  let holidayRepo: any;
  let emitter: any;

  beforeEach(async () => {
    taskRepo = { createQueryBuilder: jest.fn() };
    userRepo = { createQueryBuilder: jest.fn() };
    holidayRepo = { find: jest.fn(async () => []) };
    emitter = { toAdmins: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleDetectionService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Holiday), useValue: holidayRepo },
        { provide: NotificationEmitterService, useValue: emitter },
        {
          provide: NotificationSettingsService,
          useValue: {
            get: async () => ({
              thresholds: {
                yellow: 80,
                orange: 95,
                red: 100,
                expiringDays: 15,
                inactivityDays: 3,
                taskStaleDays: 3,
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StaleDetectionService>(StaleDetectionService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('lista las tareas sin movimiento reciente', async () => {
    const updatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    taskRepo.createQueryBuilder.mockReturnValue(
      qbMock([
        {
          id: 'task-1',
          title: 'Mantenimiento de torre',
          status: TaskStatus.IN_PROGRESS,
          updatedAt,
          technician: { profile: { name: 'Tecnico Uno' } },
          project: { title: 'Proyecto A' },
        },
      ]),
    );

    const result = await service.findStaleTasks(3);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Mantenimiento de torre');
    expect(result[0].technicianName).toBe('Tecnico Uno');
    expect(result[0].projectTitle).toBe('Proyecto A');
    expect(result[0].daysIdle).toBeGreaterThanOrEqual(5);
  });

  it('excluye a los tecnicos que si registran horas', async () => {
    userRepo.createQueryBuilder.mockReturnValue(
      qbMock([
        {
          id: 'user-1',
          email: 'uno@test.com',
          profile: { name: 'Tecnico Uno' },
        },
        {
          id: 'user-2',
          email: 'dos@test.com',
          profile: { name: 'Tecnico Dos' },
        },
      ]),
    );
    taskRepo.createQueryBuilder.mockReturnValue(
      qbMock([{ technicianId: 'user-1' }]),
    );

    const result = await service.findInactiveTechnicians(3);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('user-2');
    expect(result[0].name).toBe('Tecnico Dos');
  });
});
