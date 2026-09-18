import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  FolderKanban,
  Clock,
  DollarSign,
  FileText,
  Pencil,
  Trash2,
  CheckCircle,
  Activity,
  AlertCircle,
  Wrench,
  Timer,
  Briefcase,
  Hash,
  Tag,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskDetailModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getProjectName?: (id: string) => string;
  getClientName?: (id: string) => string;
  getServiceName?: (id: string) => string;
  getTechInitials?: (id: string) => string;
  getCreatorName?: (id: string) => string;
  getCreatorRole?: (id: string) => string;
  onEditTask?: () => void;
  onDeleteTask?: () => void;
}

const norm = (status: string) => String(status || "").toUpperCase().replace(/[^A-Z]/g, "");

const getStatusInfo = (status: string) => {
  switch (norm(status)) {
    case "COMPLETED":
      return { label: "Completada", icon: CheckCircle, color: "#10b981", bg: "#10b98110", border: "#10b98130" };
    case "INPROGRESS":
      return { label: "En Progreso", icon: Activity, color: "#0DA2E7", bg: "#0DA2E710", border: "#0DA2E730" };
    case "PENDING":
      return { label: "Pendiente", icon: AlertCircle, color: "#f59e0b", bg: "#f59e0b10", border: "#f59e0b30" };
    case "CANCELLED":
      return { label: "Cancelada", icon: AlertCircle, color: "#ef4444", bg: "#ef444410", border: "#ef444430" };
    default:
      return { label: "Desconocido", icon: AlertCircle, color: "#6b7280", bg: "#6b728010", border: "#6b728030" };
  }
};

const HORMI_BLUE = '#0DA2E7';

const ROLE_LABELS: Record<string, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Technician: "Técnico",
  Leader: "Líder",
};

const getRoleLabel = (role?: string) => (role ? ROLE_LABELS[role] || role : "");

const Label = ({ icon, children, right = false }: { icon: React.ReactNode; children: React.ReactNode; right?: boolean }) => (
  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${right ? "justify-end" : ""}`}>
    <span className="text-[#0DA2E7]">{icon}</span>
    {children}
  </div>
);

const Value = ({ right = false, className = "", children }: { right?: boolean; className?: string; children: React.ReactNode }) => (
  <div className={`mt-2 text-sm font-medium text-foreground ${right ? "text-right" : ""} ${className}`}>{children}</div>
);

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  getProjectName = () => "Sin proyecto",
  getClientName = () => "Sin cliente",
  getServiceName = () => "Sin servicio",
  getTechInitials = () => "??",
  getCreatorName = () => "",
  getCreatorRole = () => "",
  onEditTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  if (!task) return null;

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;

  const startRaw = task.startDateTime || task.start_time;
  const endRaw = task.endDateTime || task.end_time;
  const createdRaw = task.createdAt || task.created_at;
  const completedRaw = task.completedAt || task.completed_at;
  const creatorId = task.createdBy || task.created_by || (typeof task.creator === "string" ? task.creator : "");
  const projectId = task.project_id || task.projectId || task.project?.id;
  const serviceId = task.service_id || task.serviceId || task.service?.id;

  const durationFromRange = (() => {
    if (!startRaw || !endRaw) return 0;
    const s = new Date(startRaw as string).getTime();
    const e = new Date(endRaw as string).getTime();
    return e > s ? (e - s) / 3_600_000 : 0;
  })();

  const normalHours = Number(task.normal_hours || 0);
  const overtimeHours = Number(task.overtime_hours || 0);
  const hours = (normalHours + overtimeHours) ||
    Number(task.durationInHours || 0) ||
    (task.duration_in_minutes ? task.duration_in_minutes / 60 : 0) ||
    durationFromRange ||
    0;

  const rate = Number(task.applied_hourly_rate || task.appliedHourlyRate || 0);
  const rawBreakdown = task.factor_breakdown || task.factorBreakdown;
  const breakdown =
    Array.isArray(rawBreakdown) && rawBreakdown.length > 0
      ? (rawBreakdown as { factor: number; label: string; hours: number }[])
      : null;
  const factorRows = breakdown
    ? breakdown.map((b) => ({
        ...b,
        amount:
          Math.round(rate * Number(b.factor) * Number(b.hours || 0) * 100) /
          100,
      }))
    : [];
  const hasBreakdown = factorRows.length > 0;
  const factorTotal = factorRows.reduce((sum, r) => sum + r.amount, 0);
  const normalPay = Math.round(rate * normalHours * 1 * 100) / 100;
  const overtimePay = Math.round(rate * overtimeHours * 1.5 * 100) / 100;
  const totalPay = task.total_pay != null
    ? Number(task.total_pay).toFixed(2)
    : (hasBreakdown
        ? factorTotal
        : normalHours > 0 || overtimeHours > 0
          ? (normalPay + overtimePay)
          : rate * hours
      ).toFixed(2);

  const factorDot = (f: number) =>
    f >= 2 ? "#ef4444" : f >= 1.5 ? "#f59e0b" : "#0DA2E7";

  const startDate = startRaw ? new Date(startRaw as string) : null;
  const endDate = endRaw ? new Date(endRaw as string) : null;
  const createdAtDate = createdRaw ? new Date(createdRaw as string) : null;
  const completedDate = completedRaw ? new Date(completedRaw as string) : null;

  const factorInfo = (() => {
    if (hasBreakdown) {
      const maxFactor = Math.max(...factorRows.map((r) => r.factor));
      if (maxFactor >= 2)
        return { label: "×2", title: "Domingo / Feriado (factor ×2)", tone: "red" };
      if (maxFactor >= 1.5)
        return { label: "×1.5", title: "Nocturno / Sábado (factor ×1.5)", tone: "amber" };
      return { label: "×1", title: "Horario regular (factor ×1)", tone: "neutral" };
    }
    const passed = (task as { factor?: { label: string; title: string; tone: string } }).factor;
    if (passed && typeof passed === "object" && passed.tone) return passed;
    if (!startDate) return { label: "×1", title: "Factor ×1", tone: "neutral" };
    const dow = startDate.getDay();
    const hour = startDate.getHours();
    const endHour = endDate ? endDate.getHours() : -1;
    const isNight = hour >= 19 || (endHour >= 0 && endHour <= 6);
    if (dow === 0) return { label: "×2", title: "Domingo (factor ×2)", tone: "red" };
    if (dow === 6) return { label: "×1.5", title: "Sábado (factor ×1.5)", tone: "amber" };
    if (overtimeHours > 0 || isNight) return { label: "×1.5", title: "Horario nocturno (factor ×1.5)", tone: "amber" };
    return { label: "×1", title: "Horario regular (factor ×1)", tone: "neutral" };
  })();
  const factorCls = factorInfo.tone === "red"
    ? "bg-red-50 text-red-500 border-red-200"
    : factorInfo.tone === "amber"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-muted text-muted-foreground/70 border-border/50";

  const isLocked = norm(task.status) === "COMPLETED" || norm(task.status) === "CANCELLED";
  const canEdit = task.canEdit !== false && !isLocked;
  const canDelete = task.canDelete !== false;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-4 sm:inset-[10%] lg:inset-[12%] z-50 overflow-hidden rounded-2xl bg-card shadow-2xl border border-border/30 flex flex-col max-w-2xl mx-auto"
          >
            {/* HEADER */}
            <div className="relative flex-shrink-0 overflow-hidden border-b border-border/40 bg-gradient-to-br from-[#0DA2E7]/15 via-[#0DA2E7]/6 to-transparent px-6 pt-5 pb-4">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#0DA2E7]/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-8 right-16 h-16 w-16 rounded-full bg-[#0DA2E7]/10 blur-xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] text-white shadow-lg shadow-[#0DA2E7]/25">
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold leading-snug text-foreground">
                      {task.title || task.description || "Sin título"}
                    </h2>
                    <span
                      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-muted/40"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* CREADO POR */}
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-[#0DA2E7]/20">
                  <AvatarFallback className="bg-[#0DA2E7]/10 text-xs font-medium text-[#0DA2E7]">
                    {getTechInitials(creatorId)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getCreatorName(creatorId) || "Creador desconocido"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {getRoleLabel(getCreatorRole(creatorId)) || "–"}
                  </p>
                </div>
              </div>

              {/* IDENTIFICACIÓN */}
              <div className="mt-4 border-t border-border/50 pt-5">
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div>
                    <Label icon={<FolderKanban className="h-3 w-3" />}>Proyecto</Label>
                    <Value>{getProjectName(projectId)}</Value>
                  </div>
                  <div>
                    <Label icon={<Briefcase className="h-3 w-3" />}>Servicio</Label>
                    <Value>{getServiceName(serviceId)}</Value>
                  </div>
                  <div>
                    <Label icon={<Building2 className="h-3 w-3" />}>Cliente</Label>
                    <Value>{getClientName(projectId)}</Value>
                  </div>
                  <div>
                    <Label icon={<CalendarClock className="h-3 w-3" />}>Fecha de creación de la tarea</Label>
                    <Value>
                      {createdAtDate ? format(createdAtDate, "dd MMM yyyy", { locale: es }) : "Sin fecha"}
                    </Value>
                  </div>
                  {norm(task.status) === "COMPLETED" && (
                    <div>
                      <Label icon={<CheckCircle className="h-3 w-3" />}>Fecha de culminación</Label>
                      <Value>{completedDate ? format(completedDate, "dd MMM yyyy", { locale: es }) : "—"}</Value>
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="mt-6 border-t border-border/50 pt-5">
                <Label icon={<FileText className="h-3 w-3" />}>Descripción / Notas</Label>
                {task.description ? (
                  <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{task.description}</p>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground/50">
                    <Wrench className="h-3.5 w-3.5" />
                    Sin descripción registrada
                  </div>
                )}
              </div>

              {/* HORARIO Y HORAS */}
              <div className="mt-6 border-t border-border/50 pt-5">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <Label icon={<Clock className="h-3 w-3" />}>Horario</Label>
                    <Value>
                      {startDate && endDate
                        ? `${format(startDate, "HH:mm", { locale: es })} – ${format(endDate, "HH:mm", { locale: es })}`
                        : "Sin horario"}
                    </Value>
                  </div>
                  <div className="text-right">
                    <Label icon={<Timer className="h-3 w-3" />} right>Horas</Label>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <span className="text-lg font-bold tracking-tight text-foreground">{hours.toFixed(1)}h</span>
                      <Badge
                        className={`${factorCls} rounded-full border px-2 py-0 text-[10px] font-semibold`}
                        title={factorInfo.title}
                      >
                        {factorInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {(hasBreakdown || normalHours > 0 || overtimeHours > 0) && (
                  <div className="mt-5 space-y-3 border-t border-border/40 pt-4">
                    <Label icon={<Hash className="h-3 w-3" />}>
                      {hasBreakdown ? "Desglose por factores" : "Desglose de horas"}
                    </Label>
                    {hasBreakdown ? (
                      factorRows.map((row, i) => (
                        <div
                          key={`${row.label}-${i}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: factorDot(row.factor) }}
                            />
                            {row.label} · factor ×{row.factor}
                          </span>
                          <span className="font-medium text-foreground">
                            {Number(row.hours).toFixed(1)}h
                            <span className="ml-2 font-normal text-muted-foreground">
                              ${Number(row.amount || 0).toFixed(2)}
                            </span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        {normalHours > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                              Diurnas · factor ×1
                            </span>
                            <span className="font-medium text-foreground">
                              {normalHours.toFixed(1)}h<span className="ml-2 font-normal text-muted-foreground">${normalPay.toFixed(2)}</span>
                            </span>
                          </div>
                        )}
                        {overtimeHours > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Nocturnas / extra · factor ×1.5
                            </span>
                            <span className="font-medium text-foreground">
                              {overtimeHours.toFixed(1)}h<span className="ml-2 font-normal text-muted-foreground">${overtimePay.toFixed(2)}</span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* TARIFA Y TOTAL */}
              <div className="mt-6 border-t border-border/50 pt-5">
                <div className="grid grid-cols-2 gap-8 rounded-xl border border-[#0DA2E7]/15 bg-[#0DA2E7]/5 p-4">
                  <div>
                    <Label icon={<DollarSign className="h-3 w-3" />}>Tarifa por hora</Label>
                    <Value>${rate.toFixed(2)}/h</Value>
                  </div>
                  <div className="text-right">
                    <Label icon={<Tag className="h-3 w-3" />} right>Total</Label>
                    <div className="mt-2 text-lg font-bold text-[#0DA2E7]">${totalPay}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-border/30 bg-muted/5 px-6 py-3">
              <div className="flex items-center gap-2">
                {onEditTask && canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditTask}
                    className="h-8 rounded-lg border-border/60 px-3 text-xs hover:border-[#0DA2E7]/40 hover:bg-[#0DA2E7]/5 hover:text-[#0DA2E7] transition-all"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                {onDeleteTask && canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeleteTask}
                    className="h-8 rounded-lg border-border/60 px-3 text-xs hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 rounded-lg bg-[#0DA2E7] px-5 text-xs font-medium text-white transition-colors hover:bg-[#0B8BC7]"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}