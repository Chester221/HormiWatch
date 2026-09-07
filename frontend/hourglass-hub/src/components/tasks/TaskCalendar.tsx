import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle, Sun, Moon, CalendarX, Calendar, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

export interface Task {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  project?: string;
  serviceType: string;
  completed: boolean;
  status?: string; 
  hours: number;
}

interface TaskCalendarProps {
  tasks: Task[];
  view: "week" | "month";
  onTaskClick?: (task: Task) => void;
}

export function TaskCalendar({ tasks, view, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayTasksModal, setDayTasksModal] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState(0); // -1: izquierda, 1: derecha

  const navigatePrev = () => {
    setDirection(-1);
    setCurrentDate(view === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setDirection(1);
    setCurrentDate(view === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const getDaysToDisplay = () => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const monthStart = startOfWeek(start, { weekStartsOn: 1 });
      const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  };

  const days = getDaysToDisplay();
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(new Date(task.date), day));
  };

  // 🔥 Colores por estado de la tarea (para el calendario)
  const getTaskStatusColor = (task: Task) => {
    const t = task as any;
    if (t.isHoliday || t.is_holiday) return "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20";
    if (t.completed) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20";
    if (t.status === 'In Progress') return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20";
  };

  // 🔥 Icono por estado de la tarea
  const getTaskStatusIcon = (task: Task) => {
    const t = task as any;
    if (t.isHoliday || t.is_holiday) return <CalendarX className="h-3 w-3 shrink-0" />;
    if (t.completed) return <CheckCircle2 className="h-3 w-3 shrink-0" />;
    if (t.status === 'In Progress') return <Clock className="h-3 w-3 shrink-0" />;
    return <Circle className="h-3 w-3 shrink-0" />;
  };

  // 🔥 Badge de estado para el día (resumido)
  const getDayBadge = (day: Date) => {
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length === 0) return null;
    
    const completed = dayTasks.filter(t => t.completed).length;
    const inProgress = dayTasks.filter(t => (t as any).status === 'In Progress').length;
    const pending = dayTasks.length - completed - inProgress;
    
    if (completed > 0 && inProgress > 0 && pending > 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[8px] px-1.5 py-0">
          {completed}✓ {inProgress}🔄 {pending}○
        </Badge>
      );
    }
    if (completed > 0 && inProgress > 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[8px] px-1.5 py-0">
          {completed}✓ {inProgress}🔄
        </Badge>
      );
    }
    if (completed > 0 && pending > 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[8px] px-1.5 py-0">
          {completed}✓ {pending}○
        </Badge>
      );
    }
    if (completed > 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[8px] px-1.5 py-0">
          {completed} ✓
        </Badge>
      );
    }
    if (inProgress > 0) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[8px] px-1.5 py-0">
          {inProgress} 🔄
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[8px] px-1.5 py-0">
        {pending} ○
      </Badge>
    );
  };

  // 🔥 Funciones para estados (modal)
  const getStatusLabel = (task: Task) => {
    const t = task as any;
    if (t.completed) return "Completada";
    if (t.status === 'In Progress') return "En progreso";
    return "Pendiente";
  };

  const getStatusColor = (task: Task) => {
    const t = task as any;
    if (t.completed) return "text-emerald-600";
    if (t.status === 'In Progress') return "text-blue-500";
    return "text-amber-500";
  };

  const getStatusIcon = (task: Task) => {
    const t = task as any;
    if (t.completed) return "✅";
    if (t.status === 'In Progress') return "🔄";
    return "⏳";
  };

  // 🔥 Abrir modal con todas las tareas del día
  const handleShowAllTasks = (day: Date, dayTasks: Task[]) => {
    setSelectedDay(day);
    setDayTasksModal(dayTasks);
    setIsModalOpen(true);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed && (t as any).status !== 'In Progress').length;
  const inProgressTasks = tasks.filter(t => (t as any).status === 'In Progress').length;

  // 🔥 Límite de tareas a mostrar según la vista
  const maxTasksToShow = view === "week" ? 3 : 2;

  // 🔥 Animación de entrada para el calendario
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <TooltipProvider>
      <motion.div 
        className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm"
        key={currentDate.toString()}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Header del calendario */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-[#0DA2E7]/5 via-transparent to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0DA2E7]/10">
                <Calendar className="h-4 w-4 text-[#0DA2E7]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground capitalize">
                  {view === "month" 
                    ? format(currentDate, "MMMM yyyy", { locale: es })
                    : `${format(days[0], "d MMM", { locale: es })} - ${format(days[6], "d MMM yyyy", { locale: es })}`
                  }
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {completedTasks} completadas
                  </span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {inProgressTasks} en progreso
                  </span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {pendingTasks} pendientes
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigatePrev} 
                className="h-8 w-8 rounded-lg border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())} 
                className="h-8 px-3 text-xs rounded-lg border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7] transition-all"
              >
                Hoy
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigateNext} 
                className="h-8 w-8 rounded-lg border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7] transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 px-4 pt-3">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={cn(
          "grid grid-cols-7 gap-1 p-4 pt-0",
          view === "week" ? "auto-rows-[180px]" : "auto-rows-[100px]"
        )}>
          {days.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayBadge = getDayBadge(day);
            const visibleTasks = dayTasks.slice(0, maxTasksToShow);
            const hiddenCount = dayTasks.length - maxTasksToShow;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  "rounded-xl border p-2 transition-all duration-200",
                  isToday 
                    ? "border-[#0DA2E7]/40 bg-[#0DA2E7]/5 shadow-sm shadow-[#0DA2E7]/5" 
                    : "border-border/30 hover:border-[#0DA2E7]/20 hover:bg-muted/5",
                  !isCurrentMonth && view === "month" && "opacity-30"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday ? "text-[#0DA2E7]" : "text-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayBadge}
                </div>
                
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: view === "week" ? "140px" : "50px" }}>
                  <AnimatePresence>
                    {visibleTasks.map((task, idx) => (
                      <motion.button
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => onTaskClick?.(task)}
                        className={cn(
                          "w-full text-left text-[10px] p-1.5 rounded-lg transition-all duration-200 truncate border",
                          getTaskStatusColor(task),
                          "hover:shadow-sm flex items-center gap-1"
                        )}
                      >
                        {getTaskStatusIcon(task)}
                        <span className="truncate font-medium">{task.title || task.serviceType}</span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  
                  {/* 🔥 BOTÓN "VER TODAS" CON TOOLTIP Y MODAL */}
                  {hiddenCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleShowAllTasks(day, dayTasks)}
                          className="w-full text-[9px] text-muted-foreground text-center py-0.5 bg-muted/10 rounded-lg hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          <Eye className="h-2.5 w-2.5" />
                          +{hiddenCount} más
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-2 bg-card border-border shadow-xl rounded-xl">
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-muted-foreground">
                            {dayTasks.length} tareas el {format(day, "d MMM", { locale: es })}
                          </p>
                          <div className="max-h-32 overflow-y-auto">
                            {dayTasks.slice(maxTasksToShow).map((task) => (
                              <div key={task.id} className="flex items-center gap-1.5 text-xs py-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                                <span className="truncate">{task.title || task.serviceType}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[9px] text-muted-foreground text-center pt-1 border-t border-border/50">
                            Haz clic para ver todas
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="p-4 pt-0 border-t border-border/50 mt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Completada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">En progreso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-[10px] text-muted-foreground">Mixta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Feriado</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Sparkles className="h-3 w-3 text-[#0DA2E7]" />
              <span className="text-[9px] text-muted-foreground">{totalTasks} tareas</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🔥 MODAL MEJORADO "VER TODAS LAS TAREAS DEL DÍA" */}
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="sm:max-w-lg bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
    {/* HEADER MEJORADO */}
    <div className="relative p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
      <div className="flex items-center gap-3 relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/25">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Tareas del {selectedDay && format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {dayTasksModal.length} tareas
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-emerald-600">
              {dayTasksModal.filter(t => t.completed).length} completadas
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-blue-500">
              {dayTasksModal.filter(t => (t as any).status === 'In Progress').length} en progreso
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-amber-500">
              {dayTasksModal.filter(t => !t.completed && (t as any).status !== 'In Progress').length} pendientes
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* LISTA DE TAREAS CORREGIDA */}
    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
      {dayTasksModal.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 text-muted-foreground/20 mb-2" />
          <p className="text-sm">No hay tareas en este día</p>
        </div>
      ) : (
        dayTasksModal.map((task, idx) => {
          const isCompleted = task.completed;
          const isInProgress = (task as any).status === 'In Progress';
          const isPending = !isCompleted && !isInProgress;
          
          return (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => {
                setIsModalOpen(false);
                onTaskClick?.(task);
              }}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 group",
                isCompleted 
                  ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" 
                  : isInProgress
                    ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
                    : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
              )}
            >
              {/* Icono de estado */}
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                isCompleted 
                  ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" 
                  : isInProgress
                    ? "bg-blue-500/10 group-hover:bg-blue-500/20"
                    : "bg-amber-500/10 group-hover:bg-amber-500/20"
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : isInProgress ? (
                  <Clock className="h-4 w-4 text-blue-500" />
                ) : (
                  <Circle className="h-4 w-4 text-amber-500" />
                )}
              </div>

              {/* Info de la tarea */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isCompleted ? "text-muted-foreground line-through" : "text-foreground group-hover:text-[#0DA2E7]"
                )}>
                  {task.title || task.serviceType}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.startTime} - {task.endTime}
                  </span>
                  {task.project && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="truncate">{task.project}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Horas y Estado */}
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-sm font-bold",
                  isCompleted ? "text-emerald-600" : isInProgress ? "text-blue-500" : "text-amber-500"
                )}>
                  {task.hours.toFixed(1)}h
                </p>
                <p className={cn(
                  "text-[10px] font-medium",
                  isCompleted ? "text-emerald-600" : isInProgress ? "text-blue-500" : "text-amber-500"
                )}>
                  {isCompleted ? "✅ Completada" : isInProgress ? "🔄 En progreso" : "⏳ Pendiente"}
                </p>
              </div>

              {/* Indicador de hover */}
              <div className="shrink-0 text-muted-foreground/30 group-hover:text-[#0DA2E7] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.button>
          );
        })
      )}
    </div>

    {/* FOOTER MEJORADO */}
    <DialogFooter className="p-4 pt-0 gap-2 border-t border-border/50">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">Completadas</span>
        </div>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-[10px] text-muted-foreground">En progreso</span>
        </div>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-muted-foreground">Pendientes</span>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={() => setIsModalOpen(false)} 
        className="rounded-lg px-6 hover:bg-muted/50 transition-all"
      >
        Cerrar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </TooltipProvider>
  );
}