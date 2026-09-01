import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, Plus, FolderKanban, Building2, CalendarDays,
  CheckCircle, Clock as ClockIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const getTaskStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return {
        label: "Completada",
        icon: CheckCircle,
        bg: "bg-emerald-50",
        iconColor: "text-emerald-500",
      };
    case "InProgress":
      return {
        label: "En Progreso",
        icon: Activity,
        bg: "bg-blue-50",
        iconColor: "text-blue-500",
      };
    case "Pending":
      return {
        label: "Pendiente",
        icon: ClockIcon,
        bg: "bg-amber-50",
        iconColor: "text-amber-500",
      };
    default:
      return {
        label: status,
        icon: ClockIcon,
        bg: "bg-slate-50",
        iconColor: "text-slate-500",
      };
  }
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface TareasTabProps {
  recentTasks: any[];
  onNewTask: () => void;
}

export default function TareasTab({ recentTasks, onNewTask }: TareasTabProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription className="text-xs">
              Últimas {recentTasks.length} tareas registradas en el sistema
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={onNewTask}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No hay tareas registradas</p>
            <p className="text-xs text-muted-foreground mb-4">
              Crea tu primera tarea para empezar a ver actividad
            </p>
            <Button
              size="sm"
              onClick={onNewTask}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[550px]">
            <div className="space-y-2">
              {recentTasks.map((task: any, idx: number) => {
                const statusBadge = getTaskStatusBadge(task.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-card"
                  >
                    <div className={`p-2 rounded-lg ${statusBadge.bg}`}>
                      <StatusIcon className={`h-4 w-4 ${statusBadge.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">
                          {task.description || "Sin descripción"}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${statusBadge.bg} ${statusBadge.iconColor} text-[10px] px-1.5 py-0 border-current/20`}
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" />
                          {task.projectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(task.created_at),
                            { addSuffix: true, locale: es }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        {task.hours.toFixed(1)}h
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        registradas
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}