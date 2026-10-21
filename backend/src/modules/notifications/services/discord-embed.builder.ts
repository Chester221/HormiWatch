import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Temporal } from 'temporal-polyfill';
import { NotificationEvent } from '../events/notification.event';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/entities/user.entity';

export type DiscordChannelKey =
  | 'alertas'
  | 'usuarios'
  | 'contratos'
  | 'proyectos'
  | 'tareas';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: DiscordEmbedField[];
  footer: { text: string; icon_url: string };
  timestamp: string;
}

/** Colores de los embeds por canal */
const COLORS: Record<DiscordChannelKey, number> = {
  alertas: 16711680,
  contratos: 16776960,
  usuarios: 3447003,
  proyectos: 10181046,
  tareas: 5763719,
};

const FOOTER = {
  text: 'HormiWatch - Sistema de gestión de proyectos',
  icon_url: 'https://hormi-watch.vercel.app/favicon.ico',
};

const EMPTY = '—';

type Dict = Record<string, unknown>;

/**
 * Etiquetas legibles del tipo de evento. El texto se usa dentro de frases
 * ("el proyecto X ha sido [TIPO_EVENTO]"), por eso van en minúscula.
 */
const EVENT_TYPES: Record<string, string> = {
  'system.error': 'Error interno del sistema',
  'auth.login.failed': 'Intento de login fallido',
  'customer.created': 'Cliente creado',
  'customer.deleted': 'Cliente eliminado',
  'contract.expiring': 'Contrato por vencer',
  'project.created': 'creado',
  'project.deleted': 'eliminado',
  'contract.closed': 'cerrado',
  'contract.paused': 'pausado',
  'contract.renewed': 'renovado',
  'task.created': 'creada',
  'task.completed': 'completada',
  'task.cancelled': 'cancelada',
  'task.deleted': 'eliminada',
  'user.created': 'creado',
  'user.deleted': 'eliminado',
  'user.activated': 'activado',
  'user.deactivated': 'desactivado',
  'user.role.changed': 'actualizado',
  'auth.password.changed': 'contraseña actualizada',
  'tasks.stale': 'tareas estancadas',
  'users.inactiveTechnician': 'técnicos sin registrar horas',
};

interface ResolvedContext {
  data: Dict;
  project: Project | null;
  task: Task | null;
  user: User | null;
}

@Injectable()
export class DiscordEmbedBuilder {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private get timeZone(): string {
    return process.env.APP_TIMEZONE || 'America/Caracas';
  }

  async build(
    event: NotificationEvent,
    channel: DiscordChannelKey,
  ): Promise<{ content: string; embeds: DiscordEmbed[] }> {
    const ctx = await this.resolveContext(event);

    switch (channel) {
      case 'contratos':
        return this.contractMessage(event, ctx);
      case 'usuarios':
        return this.userMessage(event, ctx);
      case 'proyectos':
        return this.projectMessage(event, ctx);
      case 'tareas':
        return this.taskMessage(event, ctx);
      case 'alertas':
      default:
        return this.alertMessage(event, ctx);
    }
  }

  // ── Helpers de lectura de datos ───────────────────────────────────────────
  private text(value: unknown): string | undefined {
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }

  private num(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private list(value: unknown): Dict[] {
    if (!Array.isArray(value)) return [];
    return (value as unknown[]).filter(
      (item): item is Dict => typeof item === 'object' && item !== null,
    );
  }

  // ── Contexto ──────────────────────────────────────────────────────────────
  private async resolveContext(
    event: NotificationEvent,
  ): Promise<ResolvedContext> {
    const data = (event.data || {}) as Dict;

    const projectId = this.text(data.projectId);
    const taskId = this.text(data.taskId);
    const userId = this.text(data.userId);

    const [project, task, user] = await Promise.all([
      projectId
        ? this.projectRepo.findOne({
            where: { id: projectId },
            relations: ['customerContact', 'customerContact.customer'],
          })
        : Promise.resolve(null),
      taskId
        ? this.taskRepo.findOne({
            where: { id: taskId },
            relations: ['project', 'technician', 'technician.profile'],
          })
        : Promise.resolve(null),
      userId
        ? this.userRepo.findOne({
            where: { id: userId },
            relations: ['profile', 'role'],
          })
        : Promise.resolve(null),
    ]);

    return { data, project, task, user };
  }

  private eventType(event: NotificationEvent): string {
    const key = event.key;
    if (EVENT_TYPES[key]) return EVENT_TYPES[key];
    const threshold = key.match(/^contract\.threshold\.(\d+)$/);
    if (threshold) return `Umbral de consumo alcanzado (${threshold[1]}%)`;
    return event.title || key;
  }

  private nowLabel(): string {
    const dt = Temporal.Now.plainDateTimeISO(this.timeZone);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(dt.day)}/${pad(dt.month)}/${dt.year} ${pad(dt.hour)}:${pad(dt.minute)}`;
  }

  private value(raw: unknown, max = 1000): string {
    const text = this.text(raw) || '';
    if (!text) return EMPTY;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  private embed(
    title: string,
    description: string,
    color: number,
    fields: DiscordEmbedField[],
  ): DiscordEmbed {
    return {
      title: this.value(title, 256),
      description: this.value(description, 4096),
      color,
      fields,
      footer: FOOTER,
      timestamp: new Date().toISOString(),
    };
  }

  // ── #alertas ──────────────────────────────────────────────────────────────
  private alertMessage(
    event: NotificationEvent,
    ctx: ResolvedContext,
  ): { content: string; embeds: DiscordEmbed[] } {
    const { data } = ctx;
    const isSystemError = event.key === 'system.error';
    const isSecurity = event.key === 'auth.login.failed';

    const title = isSystemError
      ? '🔴 Error Crítico del Sistema'
      : isSecurity
        ? '🔴 Alerta de Seguridad'
        : '🔴 Evento del Sistema';

    const description = isSystemError
      ? 'Se ha detectado un fallo técnico que requiere revisión inmediata. Los usuarios pueden estar experimentando problemas.'
      : isSecurity
        ? 'Se ha detectado un intento de acceso no autorizado que requiere revisión de seguridad.'
        : 'Se ha producido un evento en el sistema que requiere atención.';

    const path = this.text(data.path);
    const method = this.text(data.method);
    const location = path
      ? `${method || ''} ${path}`.trim()
      : isSecurity
        ? 'Autenticación (login)'
        : 'Sistema';

    const detail =
      this.text(data.error) ||
      this.text(data.description) ||
      event.message ||
      'Sin detalle adicional';

    return {
      content: '🚨 **ATENCIÓN REQUERIDA**',
      embeds: [
        this.embed(title, description, COLORS.alertas, [
          {
            name: '📌 Tipo de evento',
            value: this.value(this.eventType(event)),
            inline: true,
          },
          { name: '📍 Ubicación', value: this.value(location), inline: true },
          {
            name: '⏱️ Fecha y hora',
            value: this.value(this.nowLabel()),
            inline: true,
          },
          {
            name: '📄 Descripción del error',
            value: this.value(detail),
            inline: false,
          },
        ]),
      ],
    };
  }

  // ── #contratos ────────────────────────────────────────────────────────────
  private contractMessage(
    event: NotificationEvent,
    ctx: ResolvedContext,
  ): { content: string; embeds: DiscordEmbed[] } {
    const { data } = ctx;
    const projectTitle =
      this.text(data.projectTitle) || ctx.project?.title || EMPTY;
    const customerName =
      this.text(data.customerName) ||
      ctx.project?.customerContact?.customer?.name ||
      ctx.project?.customerContact?.name ||
      EMPTY;
    const customerEmail =
      this.text(data.customerEmail) ||
      ctx.project?.customerContact?.email ||
      EMPTY;
    const customerPhone =
      this.text(data.customerPhone) ||
      ctx.project?.customerContact?.phone ||
      EMPTY;
    const hoursConsumed =
      this.num(data.hoursConsumed) ?? ctx.project?.hoursConsumed;
    const hoursContracted =
      this.num(data.hoursContracted) ?? ctx.project?.poolHours;
    const hoursRemaining =
      this.num(data.hoursRemaining) ?? ctx.project?.poolHours;
    const computedPercent =
      hoursContracted && hoursConsumed !== undefined
        ? Math.round((hoursConsumed / hoursContracted) * 100)
        : null;
    const percent = this.num(data.percent) ?? computedPercent;
    const percentText = percent !== null ? `${percent}%` : EMPTY;
    const endDate = this.text(data.endDate) || ctx.project?.endDate?.toString();

    return {
      content: '⚠️ **Actualización de contrato**',
      embeds: [
        this.embed(
          `📋 Contrato al ${percentText}`,
          `El proyecto **${projectTitle}** del cliente **${customerName}** ha alcanzado el **${percentText}** de consumo.`,
          COLORS.contratos,
          [
            {
              name: '📅 Vencimiento',
              value: this.value(endDate),
              inline: true,
            },
            {
              name: '📊 Horas',
              value: `**${this.value(hoursConsumed)}h** de ${this.value(hoursContracted)}h`,
              inline: true,
            },
            {
              name: '⏳ Restantes',
              value: `**${this.value(hoursRemaining)}h**`,
              inline: true,
            },
            {
              name: '👤 Contacto del cliente',
              value: this.value(customerName),
              inline: false,
            },
            {
              name: '📧 Email',
              value: this.value(customerEmail),
              inline: true,
            },
            {
              name: '📞 Teléfono',
              value: this.value(customerPhone),
              inline: true,
            },
            {
              name: '🚨 Acción sugerida',
              value:
                'Contactar al cliente para evaluar una renovación del contrato.',
              inline: false,
            },
          ],
        ),
      ],
    };
  }

  // ── #usuarios ─────────────────────────────────────────────────────────────
  private userMessage(
    event: NotificationEvent,
    ctx: ResolvedContext,
  ): { content: string; embeds: DiscordEmbed[] } {
    const { data, user } = ctx;

    // Evento agregado: técnicos sin registrar horas
    if (Array.isArray(data.technicians)) {
      const technicians = this.list(data.technicians);
      return {
        content: '👤 **Actualización de usuario**',
        embeds: [
          this.embed(
            '👤 Técnicos sin registrar horas',
            `**${technicians.length}** técnico(s) sin registrar horas por más de **${this.value(data.inactivityDays)}** día(s) hábil(es).`,
            COLORS.usuarios,
            technicians.slice(0, 10).map((tech) => ({
              name: `👤 ${this.value(tech.name, 250)}`,
              value: `Correo: ${this.value(tech.email)}\nDías hábiles sin actividad: ${this.value(tech.daysIdle)}`,
              inline: false,
            })),
          ),
        ],
      };
    }

    const type = this.eventType(event);
    const email = this.text(data.email) || user?.email || EMPTY;
    const name = this.text(data.name) || user?.profile?.name || EMPTY;
    const role =
      this.text(data.newRole) ||
      this.text(data.role) ||
      user?.role?.name ||
      EMPTY;
    const actor = this.text(data.actorName) || 'Sistema';

    return {
      content: '👤 **Actualización de usuario**',
      embeds: [
        this.embed(
          `Usuario ${type}`,
          `El usuario **${email}** ha sido ${type} en el sistema.`,
          COLORS.usuarios,
          [
            { name: '👤 Nombre', value: this.value(name), inline: true },
            { name: '🔑 Rol', value: this.value(role), inline: true },
            {
              name: '👤 Acción realizada por',
              value: this.value(actor),
              inline: true,
            },
            {
              name: '📅 Fecha',
              value: this.value(this.nowLabel()),
              inline: true,
            },
            {
              name: '📄 Motivo',
              value: this.value(event.message),
              inline: false,
            },
          ],
        ),
      ],
    };
  }

  // ── #proyectos ────────────────────────────────────────────────────────────
  private projectMessage(
    event: NotificationEvent,
    ctx: ResolvedContext,
  ): { content: string; embeds: DiscordEmbed[] } {
    const { data, project } = ctx;
    const type = this.eventType(event);
    const title = this.text(data.title) || project?.title || EMPTY;
    const customerName =
      project?.customerContact?.customer?.name ||
      project?.customerContact?.name ||
      this.text(data.customerName) ||
      EMPTY;
    const status = this.text(data.newStatus) || project?.status || EMPTY;
    const actor = this.text(data.actorName) || 'Sistema';

    return {
      content: '📁 **Actualización de proyecto**',
      embeds: [
        this.embed(
          `Proyecto ${type}`,
          `El proyecto **${title}** del cliente **${customerName}** ha sido ${type}.`,
          COLORS.proyectos,
          [
            { name: '📁 Nombre', value: this.value(title), inline: true },
            {
              name: '👤 Cliente',
              value: this.value(customerName),
              inline: true,
            },
            { name: '📊 Estado', value: this.value(status), inline: true },
            {
              name: '📅 Fecha',
              value: this.value(this.nowLabel()),
              inline: true,
            },
            {
              name: '👤 Acción realizada por',
              value: this.value(actor),
              inline: true,
            },
          ],
        ),
      ],
    };
  }

  // ── #tareas ───────────────────────────────────────────────────────────────
  private taskMessage(
    event: NotificationEvent,
    ctx: ResolvedContext,
  ): { content: string; embeds: DiscordEmbed[] } {
    const { data, task } = ctx;

    // Evento agregado: tareas estancadas
    if (Array.isArray(data.tasks)) {
      const tasks = this.list(data.tasks);
      return {
        content: '📋 **Actualización de tarea**',
        embeds: [
          this.embed(
            '📋 Tareas estancadas',
            `**${tasks.length}** tarea(s) sin movimiento durante más de **${this.value(data.staleDays)}** día(s).`,
            COLORS.tareas,
            tasks.slice(0, 10).map((item) => ({
              name: `📋 ${this.value(item.title, 250)}`,
              value: `Técnico: ${this.value(item.technicianName)}\nProyecto: ${this.value(item.projectTitle)}\nDías sin cambios: ${this.value(item.daysIdle)}`,
              inline: false,
            })),
          ),
        ],
      };
    }

    const type = this.eventType(event);
    const title = this.text(data.title) || task?.title || EMPTY;
    const projectTitle =
      task?.project?.title || this.text(data.projectTitle) || EMPTY;
    const technician =
      task?.technician?.profile?.name ||
      this.text(data.technicianName) ||
      EMPTY;
    const hours = task?.durationInHours ?? this.num(data.hours);
    const status = task?.status || this.text(data.status) || EMPTY;

    return {
      content: '📋 **Actualización de tarea**',
      embeds: [
        this.embed(
          `Tarea ${type}`,
          `La tarea **${title}** ha sido ${type}.`,
          COLORS.tareas,
          [
            { name: '📋 Título', value: this.value(title), inline: true },
            {
              name: '📁 Proyecto',
              value: this.value(projectTitle),
              inline: true,
            },
            {
              name: '👤 Técnico asignado',
              value: this.value(technician),
              inline: true,
            },
            {
              name: '⏱️ Horas',
              value: `${this.value(hours)}h`,
              inline: true,
            },
            { name: '📊 Estado', value: this.value(status), inline: true },
            {
              name: '📅 Fecha',
              value: this.value(this.nowLabel()),
              inline: true,
            },
          ],
        ),
      ],
    };
  }
}
