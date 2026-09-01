import { motion } from "framer-motion";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  FolderKanban, 
  Calendar,
  Pencil,
  Trash2,
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

const getStatusInfo = (status: string) => {
  // ✅ CORREGIDO: Ahora reconoce "In Progress" (con espacio)
  switch (status) {
    case "Completed":
      return { 
        label: "Completada", 
        icon: CheckCircle, 
        color: "text-emerald-500", 
        bg: "bg-emerald-50", 
        border: "border-emerald-200",
        dotColor: "bg-emerald-500"
      };
    case "In Progress":  // ✅ CORREGIDO: Con espacio
      return { 
        label: "En Progreso", 
        icon: Activity, 
        color: "text-blue-500", 
        bg: "bg-blue-50", 
        border: "border-blue-200",
        dotColor: "bg-blue-500"
      };
    case "Pending":
      return { 
        label: "Pendiente", 
        icon: AlertCircle, 
        color: "text-amber-500", 
        bg: "bg-amber-50", 
        border: "border-amber-200",
        dotColor: "bg-amber-500"
      };
    default:
      return { 
        label: status || "Desconocido", 
        icon: AlertCircle, 
        color: "text-gray-500", 
        bg: "bg-gray-50", 
        border: "border-gray-200",
        dotColor: "bg-gray-400"
      };
  }
};

export function TaskList({ tasks, onEditTask, onDeleteTask, onTaskClick }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/20 mb-3" />
        <p className="text-base font-medium text-muted-foreground">No hay tareas que mostrar</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Ajusta los filtros para ver más resultados</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-white shadow-sm overflow-hidden">
      <div className="divide-y divide-border/30">
        {tasks.map((task, idx) => {
          const statusInfo = getStatusInfo(task.status || "Pending");
          const StatusIcon = statusInfo.icon;
          const hours = task.hours || 0;
          const date = task.date ? new Date(task.date) : null;
          const isEven = idx % 2 === 0;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onTaskClick?.(task)}
              className={`group flex items-center gap-4 px-5 py-4 transition-all duration-200 cursor-pointer ${
                isEven ? 'bg-white/50' : 'bg-muted/5'
              } hover:bg-muted/10 hover:shadow-sm`}
            >
              {/* Icono de estado */}
              <div className="relative flex-shrink-0">
                <div className={`p-2.5 rounded-xl ${statusInfo.bg} border-2 ${statusInfo.border} transition-all duration-200 group-hover:scale-105`}>
                  <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                </div>
                <div className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${statusInfo.dotColor} ring-2 ring-white shadow-sm`} />
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate tracking-tight">
                    {task.title || "Sin descripción"}
                  </span>
                  <Badge className={`text-[11px] px-2.5 py-0.5 ${statusInfo.bg} ${statusInfo.color} border-none font-semibold tracking-wide rounded-full`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground/80">{task.project || "Sin proyecto"}</span>
                  </span>
                  {date && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span className="flex items-center gap-1.5 text-muted-foreground/80">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground/80">{format(date, "dd/MM/yyyy", { locale: es })}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Horas */}
              <div className="text-right flex-shrink-0 w-[110px]">
                <span className="text-[17px] font-bold text-foreground tracking-tight block">
                  {hours.toFixed(1)}<span className="text-sm font-medium text-muted-foreground ml-0.5">h</span>
                </span>
                <p className="text-[11px] font-medium text-muted-foreground/60 block">
                  {task.startTime || "??"} <span className="text-muted-foreground/30">—</span> {task.endTime || "??"}
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}