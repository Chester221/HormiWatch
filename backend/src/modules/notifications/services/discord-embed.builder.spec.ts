import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscordEmbedBuilder } from './discord-embed.builder';
import { NotificationEvent } from '../events/notification.event';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/entities/user.entity';

function event(
  key: string,
  category: NotificationCategory,
  data?: Record<string, any>,
  level = NotificationLevel.WARNING,
) {
  return new NotificationEvent(
    key,
    category,
    level,
    'Titulo del evento',
    'Mensaje del evento',
    { type: 'roles', roles: ['admin'] },
    data,
    null,
  );
}

describe('DiscordEmbedBuilder', () => {
  let builder: DiscordEmbedBuilder;
  let projectRepo: { findOne: jest.Mock };
  let taskRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    projectRepo = { findOne: jest.fn().mockResolvedValue(null) };
    taskRepo = { findOne: jest.fn().mockResolvedValue(null) };
    userRepo = { findOne: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordEmbedBuilder,
        { provide: getRepositoryToken(Project), useValue: projectRepo },
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    builder = module.get<DiscordEmbedBuilder>(DiscordEmbedBuilder);
  });

  it('construye el embed de contratos con los datos del evento', async () => {
    const message = await builder.build(
      event('contract.threshold.80', NotificationCategory.CONTRACTS, {
        projectId: 'p1',
        projectTitle: 'Proyecto A',
        customerName: 'Cliente A',
        customerPhone: '0412-1234567',
        customerEmail: 'cliente@test.com',
        hoursConsumed: 80,
        hoursContracted: 100,
        hoursRemaining: 20,
        endDate: '2026-12-01',
        percent: 80,
      }),
      'contratos',
    );

    expect(message.content).toContain('Actualización de contrato');
    const embed = message.embeds[0];
    expect(embed.color).toBe(16776960);
    expect(embed.title).toBe('📋 Contrato al 80%');
    expect(embed.description).toContain('Proyecto A');
    expect(embed.description).toContain('Cliente A');

    const fields = Object.fromEntries(
      embed.fields.map((f) => [f.name, f.value]),
    );
    expect(fields['📅 Vencimiento']).toBe('2026-12-01');
    expect(fields['📊 Horas']).toContain('80');
    expect(fields['⏳ Restantes']).toContain('20');
    expect(fields['📧 Email']).toBe('cliente@test.com');
    expect(fields['📞 Teléfono']).toBe('0412-1234567');
  });

  it('construye la alerta de sistema sin dejar campos vacios', async () => {
    const message = await builder.build(
      event(
        'system.error',
        NotificationCategory.SYSTEM,
        {
          path: '/api/tasks',
          method: 'GET',
          status: 500,
          error: 'Fallo de conexion a la base de datos',
        },
        NotificationLevel.CRITICAL,
      ),
      'alertas',
    );

    expect(message.content).toBe('🚨 **ATENCIÓN REQUERIDA**');
    const embed = message.embeds[0];
    expect(embed.title).toBe('🔴 Error Crítico del Sistema');
    expect(embed.color).toBe(16711680);

    const fields = Object.fromEntries(
      embed.fields.map((f) => [f.name, f.value]),
    );
    expect(fields['📍 Ubicación']).toBe('GET /api/tasks');
    expect(fields['📄 Descripción del error']).toBe(
      'Fallo de conexion a la base de datos',
    );
    for (const f of embed.fields) {
      expect(f.value.trim().length).toBeGreaterThan(0);
    }
  });

  it('completa el embed de usuarios con la BD y usa "Sistema" como actor', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'juan@test.com',
      profile: { name: 'Juan Perez' },
      role: { name: 'Technician' },
    });

    const message = await builder.build(
      event('user.created', NotificationCategory.USERS, {
        userId: 'u1',
        email: 'juan@test.com',
      }),
      'usuarios',
    );

    const embed = message.embeds[0];
    expect(embed.title).toBe('Usuario creado');
    expect(embed.color).toBe(3447003);

    const fields = Object.fromEntries(
      embed.fields.map((f) => [f.name, f.value]),
    );
    expect(fields['👤 Nombre']).toBe('Juan Perez');
    expect(fields['🔑 Rol']).toBe('Technician');
    expect(fields['👤 Acción realizada por']).toBe('Sistema');
    expect(fields['📄 Motivo']).toBe('Mensaje del evento');
  });

  it('completa el embed de tareas con los datos de la tarea', async () => {
    taskRepo.findOne.mockResolvedValue({
      id: 't1',
      title: 'Revisar tablero',
      status: 'IN_PROGRESS',
      durationInHours: 2.5,
      project: { title: 'Proyecto B' },
      technician: { profile: { name: 'Pedro' } },
    });

    const message = await builder.build(
      event('task.created', NotificationCategory.TASKS, {
        taskId: 't1',
        projectId: 'p2',
      }),
      'tareas',
    );

    const embed = message.embeds[0];
    expect(embed.title).toBe('Tarea creada');
    expect(embed.color).toBe(5763719);

    const fields = Object.fromEntries(
      embed.fields.map((f) => [f.name, f.value]),
    );
    expect(fields['📋 Título']).toBe('Revisar tablero');
    expect(fields['📁 Proyecto']).toBe('Proyecto B');
    expect(fields['👤 Técnico asignado']).toBe('Pedro');
    expect(fields['⏱️ Horas']).toBe('2.5h');
    expect(fields['📊 Estado']).toBe('IN_PROGRESS');
  });

  it('lista las tareas estancadas en un solo embed', async () => {
    const message = await builder.build(
      event('tasks.stale', NotificationCategory.TASKS, {
        staleDays: 3,
        tasks: [
          {
            title: 'Tarea vieja',
            technicianName: 'Pedro',
            projectTitle: 'Proyecto B',
            daysIdle: 6,
          },
        ],
      }),
      'tareas',
    );

    const embed = message.embeds[0];
    expect(embed.title).toBe('📋 Tareas estancadas');
    expect(embed.description).toContain('3');
    expect(embed.fields).toHaveLength(1);
    expect(embed.fields[0].value).toContain('Días sin cambios: 6');
  });

  it('usa "—" cuando faltan datos en lugar de dejar campos vacios', async () => {
    const message = await builder.build(
      event('project.created', NotificationCategory.PROJECTS, {
        projectId: 'desconocido',
      }),
      'proyectos',
    );

    for (const f of message.embeds[0].fields) {
      expect(f.value.trim().length).toBeGreaterThan(0);
    }
  });

  it('construye el embed de proyectos con el cliente resuelto en BD', async () => {
    projectRepo.findOne.mockResolvedValue({
      id: 'p3',
      title: 'Proyecto C',
      status: 'IN_PROGRESS',
      customerContact: { customer: { name: 'Cliente C' } },
    });

    const message = await builder.build(
      event('project.created', NotificationCategory.PROJECTS, {
        projectId: 'p3',
        title: 'Proyecto C',
      }),
      'proyectos',
    );

    const embed = message.embeds[0];
    expect(embed.title).toBe('Proyecto creado');
    expect(embed.description).toContain('Cliente C');
    const fields = Object.fromEntries(
      embed.fields.map((f) => [f.name, f.value]),
    );
    expect(fields['👤 Cliente']).toBe('Cliente C');
    expect(fields['📊 Estado']).toBe('IN_PROGRESS');
  });
});
