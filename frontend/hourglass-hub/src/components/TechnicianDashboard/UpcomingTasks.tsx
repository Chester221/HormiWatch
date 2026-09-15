import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ArrowRight,
  Inbox,
  Star,
  FolderKanban,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { taskDate, taskHours, safeParseDate } from "@/lib/dashboardUtils";
import { format, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Pending: { label: "Pendiente", cls: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40" },
  InProgress: { label: "En progreso", cls: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800/40" },
  Completed: { label: "Completada", cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40" },
};

const PRIORITY_STYLE: Record<string, { label: string; icon: typeof Zap; cls: string }> = {
  HIGH: { label: "Prioridad alta", icon: Zap, cls: "text-red-500" },
  MEDIUM: { label: "Prioridad media", icon: Zap, cls: "text-amber-500" },
  LOW: { label: "Prioridad baja", icon: Zap, cls: "text-muted-foreground" },
};

const formatDate = (value: unknown) => {
  const date = safeParseDate(value);
  if (!date) return null;
  if (isToday(date)) return "Hoy";
  if (isBefore(date, new Date())) return `Atrasada · ${format(date, "d MMM", { locale: es })}`;
  return format(date, "d MMM", { locale: es });
};

export function UpcomingTasks({ tasks }: { tasks: any[] }) {
  const navigate = useNavigate();

  const upcoming = useMemo(() => {
    return tasks
      .filter((t: any) => t.status === "Pending" || t.status === "InProgress")
      .map((t: any) => {
        const date = taskDate(t);
        return {
          ...t,
          _date: date?.getTime() ?? Number.MAX_SAFE_INTEGER,
          hours: taskHours(t),
          dateLabel: formatDate(date),
        };
      })
      .sort((a, b) => a._date - b._date)
      .slice(0, 6);
  }, [tasks]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0DA2E7] opacity-[0.06] blur-2xl" />

      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] rounded-xl p-2 shadow-sm shadow-[#0DA2E7]/30">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Mis Próximas Tareas
            </h3>
            <p className="text-xs text-muted-foreground">
              {upcoming.length} pendientes / en progreso
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer border-border/40 text-xs transition-colors hover:bg-muted/50"
          onClick={() => navigate("/tasks")}
        >
          Ver todas
          <ArrowRight className="ml-1 h-3 w-3" />
        </Badge>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7]/10">
            <Inbox className="h-7 w-7 text-[#0DA2E7]" />
          </div>
          <p className="text-sm font-semibold text-foreground">Todo al día</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No tienes tareas pendientes. ¡Buen trabajo!
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-2.5">
          {upcoming.map((task, idx) => {
            const badge = STATUS_BADGE[task.status] || STATUS_BADGE.Pending;
            const priority = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.MEDIUM;
            const PriorityIcon = priority.icon;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/tasks?task=${task.id}`)}
                className="group flex items-center gap-3 rounded-xl border border-border/30 p-3 transition-all duration-200 hover:border-[#0DA2E7]/40 hover:bg-muted/10 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {task.description || "Tarea sin descripción"}
                    </p>
                    <Badge className={`whitespace-nowrap border px-2 py-0 text-[10px] font-medium ${badge.cls}`}>
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {task.projectName || "Proyecto"}
                    </span>
                    {task.hours > 0 && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" />
                        {task.hours.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  {task.dateLabel && (
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        task.dateLabel.startsWith("Atrasada")
                          ? "text-red-500"
                          : task.dateLabel === "Hoy"
                          ? "text-[#0DA2E7]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {task.dateLabel}
                    </span>
                  )}
                  <span className={`flex items-center gap-0.5 text-[10px] ${priority.cls}`}>
                    <PriorityIcon className="h-3 w-3" />
                    {priority.label}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#0DA2E7]" />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}