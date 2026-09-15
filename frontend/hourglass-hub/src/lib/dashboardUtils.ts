/**
 * Utilidades compartidas del Dashboard del Manager.
 * Centralizan el parseo de fechas y el cálculo de horas trabajadas
 * para que todos los componentes usen la misma lógica a prueba de errores.
 */

type AnyRecord = Record<string, unknown>;

export const toFinite = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
};

export const safeParseDate = (value: unknown): Date | null => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const taskDate = (task: AnyRecord | null | undefined): Date | null =>
  safeParseDate(task?.start_time) ??
  safeParseDate(task?.startDateTime) ??
  safeParseDate(task?.created_at) ??
  safeParseDate(task?.createdAt);

/**
 * Horas trabajadas de una tarea.
 * Prioriza los totales persistidos (normal + extra), luego la duración
 * en minutos y finalmente el rango start/end. Nunca devuelve NaN.
 */
export const taskHours = (task: AnyRecord | null | undefined): number => {
  if (!task) return 0;
  const normal = toFinite(task.normal_hours);
  const overtime = toFinite(task.overtime_hours);
  if (normal + overtime > 0) return normal + overtime;
  const duration = toFinite(task.duration_in_minutes);
  if (duration > 0) return duration / 60;
  const start = safeParseDate(task.start_time) ?? safeParseDate(task.startDateTime);
  const end = safeParseDate(task.end_time) ?? safeParseDate(task.endDateTime);
  if (start && end && end.getTime() > start.getTime()) {
    return (end.getTime() - start.getTime()) / 3_600_000;
  }
  return 0;
};

const HUMAN_STATUS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "InProgress",
  INPROGRESS: "InProgress",
  "IN PROGRESS": "InProgress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
};

const humanStatus = (status: unknown): string => {
  const key = String(status ?? "").toUpperCase().trim();
  if (HUMAN_STATUS[key]) return HUMAN_STATUS[key];
  if (!key) return "Pending";
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
};

type RawTask = Record<string, unknown> & {
  project?: {
    id?: unknown;
    title?: unknown;
    name?: unknown;
    clientId?: unknown;
    customerId?: unknown;
    client_id?: unknown;
    customer_id?: unknown;
  } | null;
  projects?: { id?: unknown; name?: unknown } | null;
  service?: { id?: unknown } | null;
  services?: { id?: unknown } | null;
  technician?: { id?: unknown; full_name?: unknown; profile?: { full_name?: unknown } } | null;
  startDateTime?: unknown;
  start_time?: unknown;
  endDateTime?: unknown;
  end_time?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  project_id?: unknown;
  projectId?: unknown;
  service_id?: unknown;
  serviceId?: unknown;
  technician_id?: unknown;
  technicianId?: unknown;
  client_id?: unknown;
  clientId?: unknown;
  status?: unknown;
  hours?: unknown;
  normal_hours?: unknown;
  overtime_hours?: unknown;
  duration_in_minutes?: unknown;
  projectName?: unknown;
  technicianName?: unknown;
};

/**
 * Normaliza una tarea del backend (camelCase, sin columnas FK, estados en
 * mayúscula) al formato "legacy" que consume todo el frontend (snake_case,
 * project_id/service_id/technician_id, horas, estado con mayúscula inicial).
 * Extiende el objeto original y conserva las relaciones anidadas.
 */
export const normalizeTask = (task: RawTask | null | undefined): AnyRecord => {
  if (!task) return (task ?? undefined) as AnyRecord;

  const project = task.project ?? task.projects;
  const projectId = project?.id ?? task.project_id ?? task.projectId ?? null;
  const serviceId = task.service?.id ?? task.services?.id ?? task.service_id ?? task.serviceId ?? null;
  const technicianId = task.technician?.id ?? task.technician_id ?? task.technicianId ?? null;
  const clientId =
    project?.clientId ??
    project?.customerId ??
    project?.client_id ??
    project?.customer_id ??
    task.client_id ??
    task.clientId ??
    null;

  const startRaw = task.startDateTime ?? task.start_time ?? task.createdAt ?? task.created_at ?? null;
  const endRaw = task.endDateTime ?? task.end_time ?? null;
  const createdRaw = task.createdAt ?? task.created_at ?? null;
  const updatedRaw = task.updatedAt ?? task.updated_at ?? null;

  const startDate = safeParseDate(startRaw);
  const endDate = safeParseDate(endRaw);
  const computedHours =
    startDate && endDate && endDate.getTime() > startDate.getTime()
      ? (endDate.getTime() - startDate.getTime()) / 3_600_000
      : 0;
  const hours = toFinite(task.hours, computedHours);

  return {
    ...task,
    status: task.status != null ? humanStatus(task.status) : task.status,
    project_id: projectId,
    service_id: serviceId,
    technician_id: technicianId,
    client_id: clientId,
    projectName: task.projectName ?? project?.title ?? project?.name ?? null,
    technicianName: task.technicianName ?? task.technician?.full_name ?? task.technician?.profile?.full_name ?? null,
    start_time: startRaw,
    end_time: endRaw,
    created_at: createdRaw,
    updated_at: updatedRaw,
    hours,
    normal_hours: toFinite(task.normal_hours, hours),
    overtime_hours: toFinite(task.overtime_hours),
    duration_in_minutes: toFinite(task.duration_in_minutes, hours * 60),
  };
};

export const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Estado de un proyecto → etiqueta legible + clases del badge.
 * Mismo lenguaje visual que la página de Proyectos.
 */
export const projectStatusInfo = (status: unknown): { label: string; cls: string } => {
  switch (String(status ?? '').toUpperCase()) {
    case 'PENDING':
    case 'NOT STARTED':
      return { label: 'Sin empezar', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return { label: 'En progreso', cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    case 'COMPLETED':
      return { label: 'Completado', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    case 'CANCELLED':
      return { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-200' };
    case 'ON_HOLD':
    case 'ON-HOLD':
    case 'INACTIVE':
      return { label: 'En pausa', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    default:
      return { label: 'Activo', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  }
};

/**
 * Formatea "YYYY-MM-DD" (TemporalPlainDate del backend) o ISO sin
 * corrimiento de zona horaria. Devuelve null si no es parseable.
 */
export const formatProjectDate = (value: unknown): string | null => {
  if (value == null || value === '') return null;
  const str = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};