import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Clipboard,
  CalendarClock,
  User,
  FolderKanban,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskListProps {
  tasks: any[];
  onEditTask?: (task: any) => void;
  onDeleteTask?: (task: any) => void;
  onTaskClick?: (task: any) => void;
}

interface StatusInfo {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const STATUS_COLORS: Record<string, StatusInfo> = {
  COMPLETED: {
    label: "Completada",
    icon: CheckCircle,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.10)",
  },
  INPROGRESS: {
    label: "En Progreso",
    icon: Activity,
    color: "#0DA2E7",
    bg: "rgba(13, 162, 231, 0.10)",
  },
  PENDING: {
    label: "Pendiente",
    icon: AlertCircle,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
  },
  CANCELLED: {
    label: "Cancelada",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.10)",
  },
};

const getStatusInfo = (status: string): StatusInfo => {
  const norm = String(status || "").toUpperCase().replace(/[^A-Z]/g, "");
  return (
    STATUS_COLORS[norm] || {
      label: status || "Desconocido",
      icon: Clipboard,
      color: "#6b7280",
      bg: "rgba(107, 114, 128, 0.10)",
    }
  );
};

export function TaskList({ tasks, onEditTask, onDeleteTask, onTaskClick }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clipboard className="h-12 w-12 text-muted-foreground/20 mb-3" />
        <p className="text-base font-medium text-muted-foreground">No hay tareas que mostrar</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Ajusta los filtros para ver más resultados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, idx) => {
        const statusInfo = getStatusInfo(task.status || "PENDING");
        const StatusIcon = statusInfo.icon;
        const hours = task.hours || 0;
        const date = task.date ? new Date(task.date) : null;
        const f = task.factor || { label: "×1", title: "Factor ×1", tone: "neutral" };
        const factorTone = f.tone === "red"
          ? "bg-red-50 text-red-500"
          : f.tone === "amber"
            ? "bg-amber-50 text-amber-600"
            : "bg-muted text-muted-foreground/70";

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onTaskClick?.(task)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 cursor-pointer hover:border-[#0DA2E7]/30 hover:shadow-md"
          >
            <span
              className="absolute left-0 top-0 h-full w-1 opacity-70 transition-opacity"
              style={{ backgroundColor: statusInfo.color }}
            />

            <div className="flex items-center gap-4 pl-1">
              {/* Icono de estado */}
              <div className="relative flex-shrink-0">
                <div
                  className="p-2.5 rounded-xl border transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: statusInfo.bg, borderColor: `${statusInfo.color}33` }}
                >
                  <StatusIcon className="h-4 w-4" style={{ color: statusInfo.color }} />
                </div>
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card shadow-sm"
                  style={{ backgroundColor: statusInfo.color }}
                />
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Clipboard className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                  <span className="text-sm font-bold text-foreground truncate tracking-tight">
                    {task.title || "Sin título"}
                  </span>
                  <Badge
                    className="text-[10px] px-2 py-0.5 border-none font-semibold tracking-wide rounded-full"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </Badge>
                  <Badge className={`text-[10px] px-2 py-0.5 ${factorTone} border-none font-semibold tracking-wide rounded-full`} title={f.title}>
                    {f.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <FolderKanban className="h-3.5 w-3.5 text-[#0DA2E7]/60" />
                    <span className="font-medium text-foreground/80 truncate max-w-[180px]">{task.projectName || "Sin proyecto"}</span>
                  </span>
                  {(date || task.startTime) && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span className="flex items-center gap-1.5 text-muted-foreground/80">
                        <CalendarClock className="h-3.5 w-3.5 text-[#0DA2E7]/60" />
                        <span className="font-medium text-foreground/80">
                          {date ? format(date, "dd MMM", { locale: es }) : ""}
                          {task.startTime ? ` · ${task.startTime}` : ""}
                        </span>
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <User className="h-3.5 w-3.5 text-[#0DA2E7]/60" />
                    <span className="font-medium text-foreground/80 truncate max-w-[140px]">{task.technicianName || "Sin técnico"}</span>
                  </span>
                </div>
              </div>

              {/* Horas */}
              <div className="text-right flex-shrink-0 w-[86px]">
                <span className="flex items-center gap-1.5 text-lg font-bold text-foreground tracking-tight">
                  <Clock className="h-4 w-4 text-muted-foreground/50" />
                  {hours.toFixed(1)}<span className="text-xs font-medium text-muted-foreground ml-0.5">h</span>
                </span>
                <p className="text-[11px] font-medium text-muted-foreground/60 block">
                  {task.startTime || "--:--"} <span className="text-muted-foreground/30">—</span> {task.endTime || "--:--"}
                </p>
              </div>

              {/* Acciones */}
              {(onEditTask || onDeleteTask) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
                  {onEditTask && task.canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteTask && task.canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}