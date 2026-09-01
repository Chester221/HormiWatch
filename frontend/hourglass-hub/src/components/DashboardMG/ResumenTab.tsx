import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2, AlertTriangle, Award, TrendingUp, TrendingDown,
  Clock, CheckSquare, FolderKanban, ArrowRight,
  ChevronLeft, ChevronRight, Maximize2, Activity,
  CheckCircle, Clock as ClockIcon, ListTodo, CalendarDays, Users,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

interface ResumenTabProps {
  hoursByClient: { name: string; hours: number; color: string; projectCount: number }[];
  projectStatus: any[];
  technicianPerformance: any[];
  monthTasks: any[];
  metrics: {
    tareas: { completed: number; pending: number; count: number };
  };
  technicians: any[];
  tasks: any[];
  onViewTechnician: (tech: any) => void;
  onViewAllTechnicians: () => void;
  onViewClient: (client: any) => void;
  onViewAllClients: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTaskStatusBadge = (status: string) => {
  switch (status) {
    case "Completed": return { label: "Completada", icon: CheckCircle, className: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    case "InProgress": return { label: "En Progreso", icon: Activity, className: "bg-blue-50 text-blue-600 border-blue-200" };
    case "Pending": return { label: "Pendiente", icon: ClockIcon, className: "bg-amber-50 text-amber-600 border-amber-200" };
    default: return { label: status, icon: ClockIcon, className: "bg-muted text-muted-foreground border-border" };
  }
};

// ---------------------------------------------------------------------------
// Modal de Actividad del Mes (SOLO TAREAS, agrupadas por fecha, con color)
// ---------------------------------------------------------------------------

const AllTasksModal = ({ open, onOpenChange, tasks }: { open: boolean; onOpenChange: (open: boolean) => void; tasks: any[] }) => {
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};
    tasks.forEach((task: any) => {
      const date = new Date(task.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey = "";
      if (date.toDateString() === today.toDateString()) {
        groupKey = "HOY";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "AYER";
      } else {
        groupKey = format(date, "dd 'de' MMMM", { locale: es }).toUpperCase();
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });
    return groups;
  }, [tasks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="p-2.5 rounded-xl bg-blue-50"
              >
                <Activity className="h-5 w-5 text-blue-500" />
              </motion.div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Actividad del Mes
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {tasks.length} {tasks.length === 1 ? "tarea registrada" : "tareas registradas"} · {format(new Date(), "MMMM yyyy")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </motion.div>

        <div className="flex-1 overflow-y-auto pr-2 mt-5">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Sin tareas este mes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Las tareas registradas aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([date, items]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">{date}</h4>
                    <div className="flex-1 h-px bg-blue-500/20" />
                  </div>
                  <div className="space-y-2">
                    {items.map((task: any, idx: number) => {
                      const tBadge = getTaskStatusBadge(task.status);
                      const TIcon = tBadge.icon;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                        >
                          <div className={`p-1.5 rounded-md ${tBadge.className.split(" ")[0]}`}>
                            <TIcon className={`h-4 w-4 ${tBadge.className.split(" ")[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.description || "Sin descripción"}
                              </p>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tBadge.className}`}>
                                {tBadge.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" />{task.projectName}</span>
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{task.clientName}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: es })}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{task.hours.toFixed(1)}h</Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ResumenTab({ 
  hoursByClient, 
  projectStatus, 
  technicianPerformance,
  monthTasks,
  metrics,
  technicians = [],
  tasks = [],
  onViewTechnician,
  onViewAllTechnicians,
  onViewClient,
  onViewAllClients,
}: ResumenTabProps) {
  const totalClientHours = hoursByClient.reduce((sum, c) => sum + c.hours, 0) || 1;
  const maxClientHours = hoursByClient[0]?.hours || 1;
  const delayedProjects = projectStatus.filter(p => p.isDelayed);
  const topTechnicians = technicianPerformance.slice(0, 5);
  const recentMonthTasks = monthTasks.slice(0, 8);

  const [clientPage, setClientPage] = useState(0);
  const clientsPerPage = 3;
  const totalClientPages = Math.ceil(hoursByClient.length / clientsPerPage);
  const visibleClients = hoursByClient.slice(clientPage * clientsPerPage, (clientPage + 1) * clientsPerPage);
  const nextClientPage = () => setClientPage((prev) => (prev + 1) % totalClientPages);
  const prevClientPage = () => setClientPage((prev) => (prev - 1 + totalClientPages) % totalClientPages);
  const [isExpandHovered, setIsExpandHovered] = useState(false);
  const [isAmpliarHovered, setIsAmpliarHovered] = useState(false);
  const [allTasksModalOpen, setAllTasksModalOpen] = useState(false);

  const [equipoModalOpen, setEquipoModalOpen] = useState(false);
  const [equipoModalData, setEquipoModalData] = useState<{ title: string; icon: string; members: any[] }>({ title: "", icon: "", members: [] });

  const completionRate = metrics.tareas.count > 0 
    ? Math.round((metrics.tareas.completed / metrics.tareas.count) * 100) 
    : 0;

  const tecnicosActivos = technicians.filter((t: any) => 
    monthTasks.some((task: any) => task.technician_id === t.id)
  );
  const tecnicosInactivos = technicians.filter((t: any) => 
    !monthTasks.some((task: any) => task.technician_id === t.id)
  );
  const tecnicosSinProyecto = technicians.filter((t: any) => {
    const techProjects = projectStatus.filter((p: any) => 
      tasks.some((task: any) => task.technician_id === t.id && task.project_id === p.id)
    );
    return techProjects.length === 0;
  });
  const tecnicosDisponibles = technicians.filter((t: any) => {
    const techHours = monthTasks
      .filter((task: any) => task.technician_id === t.id)
      .reduce((sum: number, task: any) => sum + task.hours, 0);
    return techHours > 0 && techHours < 10;
  });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* ================================================================ */}
      {/* COLUMNA IZQUIERDA (60%) */}
      {/* ================================================================ */}
      <div className="lg:col-span-2 space-y-5">
        {/* Clientes con carrusel */}
        <div className="rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />Horas por Cliente
            </h3>
            <div className="flex items-center gap-1">
              {totalClientPages > 1 && (
                <div className="flex items-center gap-0.5 mr-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={prevClientPage}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs text-muted-foreground min-w-[36px] text-center tabular-nums">{clientPage + 1}/{totalClientPages}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={nextClientPage}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onHoverStart={() => setIsExpandHovered(true)} onHoverEnd={() => setIsExpandHovered(false)}>
                <Button variant="ghost" size="sm" onClick={onViewAllClients} className="gap-1.5 text-xs h-7 group">
                  <motion.span animate={{ rotate: isExpandHovered ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}><Maximize2 className="h-3.5 w-3.5" /></motion.span>
                  <span className="group-hover:underline">Ver todos</span>
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={clientPage} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid gap-3 sm:grid-cols-3">
                {visibleClients.map((client, idx) => (
                  <motion.div key={client.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.2 }} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Card className="hover:shadow-md transition-shadow duration-300 border-border overflow-hidden cursor-pointer bg-card" onClick={() => onViewClient(client)}>
                      <div className="h-1 bg-primary transition-all duration-300" />
                      <CardContent className="p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background bg-primary" whileHover={{ scale: 1.5 }} transition={{ type: "spring", stiffness: 400 }} />
                          <span className="text-xs font-medium text-foreground truncate">{client.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                          <motion.span className="text-2xl font-bold text-foreground tracking-tight" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>{client.hours.toFixed(1)}</motion.span>
                          <span className="text-xs text-muted-foreground">h</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(client.hours / maxClientHours) * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">{Math.round((client.hours / totalClientHours) * 100)}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tareas: Resumen + Recientes */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Resumen de Tareas */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />Resumen de Tareas
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <p className="text-2xl font-bold text-foreground">{metrics.tareas.completed}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Completadas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <p className="text-2xl font-bold text-foreground">{metrics.tareas.pending}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pendientes</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progreso total</span>
                <span className="font-semibold text-foreground">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">{metrics.tareas.count} tareas totales</p>
          </div>

          {/* Tareas del Mes */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />Tareas del Mes
              </h3>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onHoverStart={() => setIsAmpliarHovered(true)} onHoverEnd={() => setIsAmpliarHovered(false)}>
                <Button variant="ghost" size="sm" onClick={() => setAllTasksModalOpen(true)} className="gap-1.5 text-xs h-7 group">
                  <motion.span animate={{ rotate: isAmpliarHovered ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}><Maximize2 className="h-3.5 w-3.5" /></motion.span>
                  <span className="group-hover:underline">Ampliar</span>
                </Button>
              </motion.div>
            </div>
            {recentMonthTasks.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin tareas este mes</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {recentMonthTasks.map((task: any, idx: number) => (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04, duration: 0.2 }} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/20">
                    <div className="p-1 rounded-md bg-muted">
                      {task.status === "Completed" ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <ClockIcon className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{task.description || "Sin descripción"}</p>
                      <p className="text-[10px] text-muted-foreground">{task.projectName} · {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: es })}</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground flex-shrink-0">{task.hours.toFixed(1)}h</span>
                  </motion.div>
                ))}
                {monthTasks.length > 8 && <p className="text-[10px] text-muted-foreground text-center py-1">+{monthTasks.length - 8} tareas más</p>}
              </div>
            )}
          </div>
        </div>

        {/* Técnicos Destacados */}
        {topTechnicians.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" />Técnicos Destacados</h3>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="space-y-1">
                  {topTechnicians.map((tech: any, idx: number) => {
                    const efficiency = tech.tasks > 0 ? (tech.completedTasks / tech.tasks) * 100 : 0;
                    const trendColor = tech.trend > 0 ? "text-emerald-500" : tech.trend < 0 ? "text-destructive" : "text-muted-foreground";
                    const TrendIcon = tech.trend > 0 ? TrendingUp : tech.trend < 0 ? TrendingDown : null;
                    return (
                      <div key={tech.id} onClick={() => onViewTechnician(tech)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 shadow-sm">{idx + 1}</div>
                        <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">{tech.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{tech.name}</p><p className="text-[11px] text-muted-foreground">{tech.projectCount} {tech.projectCount === 1 ? "proyecto" : "proyectos"}</p></div>
                        <div className="text-right flex-shrink-0"><p className="text-sm font-semibold text-foreground">{tech.hours.toFixed(1)}h</p><p className="text-[11px] text-muted-foreground">{tech.completedTasks}/{tech.tasks} tareas</p></div>
                        <div className="text-right flex-shrink-0 w-16">
                          <div className="flex items-center justify-end gap-1">{TrendIcon && <TrendIcon className={`h-3 w-3 ${trendColor}`} />}<span className={`text-xs font-semibold ${trendColor}`}>{tech.trend > 0 ? "+" : ""}{tech.trend}%</span></div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${efficiency}%` }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado del Equipo */}
        {technicians.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Estado del Equipo</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setEquipoModalData({ title: "✅ Activos", icon: "✅", members: tecnicosActivos }); setEquipoModalOpen(true); }}>
                <p className="text-2xl font-bold text-foreground">{tecnicosActivos.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">✅ Activos</p><p className="text-[9px] text-muted-foreground">con tareas este mes</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setEquipoModalData({ title: "💤 Inactivos", icon: "💤", members: tecnicosInactivos }); setEquipoModalOpen(true); }}>
                <p className="text-2xl font-bold text-foreground">{tecnicosInactivos.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">💤 Inactivos</p><p className="text-[9px] text-muted-foreground">sin tareas este mes</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setEquipoModalData({ title: "🚫 Sin Proyecto", icon: "🚫", members: tecnicosSinProyecto }); setEquipoModalOpen(true); }}>
                <p className="text-2xl font-bold text-foreground">{tecnicosSinProyecto.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">🚫 Sin Proyecto</p><p className="text-[9px] text-muted-foreground">no asignados</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setEquipoModalData({ title: "🟢 Disponibles", icon: "🟢", members: tecnicosDisponibles }); setEquipoModalOpen(true); }}>
                <p className="text-2xl font-bold text-foreground">{tecnicosDisponibles.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">🟢 Disponibles</p><p className="text-[9px] text-muted-foreground">&lt; 10h este mes</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* COLUMNA DERECHA (40%): Proyectos en Riesgo */}
      {/* ================================================================ */}
      <div className="space-y-5">
        {delayedProjects.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Proyectos en Riesgo<Badge variant="destructive" className="text-[10px] px-1.5 h-5">{delayedProjects.length}</Badge></h3>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {delayedProjects.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{project.name}</p><p className="text-xs text-muted-foreground mt-0.5">{project.client}</p></div><Badge variant="destructive" className="text-[10px] flex-shrink-0 ml-2">+{project.daysDelayed}d</Badge></div>
                      <div className="flex items-center gap-2"><Progress value={project.progress} className="h-1.5 flex-1" /><span className="text-[11px] font-medium text-muted-foreground">{project.progress}%</span></div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{project.completed}/{project.total}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.hours.toFixed(1)}h</span><span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" />{project.teamSize} téc.</span></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {delayedProjects.length === 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" />Proyectos en Riesgo</h3>
            <Card className="border-border"><CardContent className="p-6 text-center"><div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mx-auto mb-3"><CheckSquare className="h-5 w-5 text-muted-foreground" /></div><p className="text-sm font-medium text-foreground">Todo en orden</p><p className="text-xs text-muted-foreground mt-0.5">No hay proyectos atrasados</p></CardContent></Card>
          </div>
        )}
      </div>

      {/* VACÍO TOTAL */}
      {hoursByClient.length === 0 && technicianPerformance.length === 0 && (
        <div className="lg:col-span-3 flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-3" /><p className="text-sm font-medium text-foreground">Sin datos disponibles</p><p className="text-xs text-muted-foreground mt-0.5">Registra tareas y proyectos para ver métricas aquí</p>
        </div>
      )}

      {/* Modal de Actividad del Mes */}
      <AllTasksModal open={allTasksModalOpen} onOpenChange={setAllTasksModalOpen} tasks={monthTasks} />

      {/* Modal de Estado del Equipo */}
      <Dialog open={equipoModalOpen} onOpenChange={setEquipoModalOpen}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">{equipoModalData.icon} {equipoModalData.title}</DialogTitle>
              <DialogDescription className="text-xs">{equipoModalData.members.length} {equipoModalData.members.length === 1 ? "técnico" : "técnicos"}</DialogDescription>
            </DialogHeader>
          </motion.div>
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            {equipoModalData.members.length === 0 ? (
              <div className="text-center py-8"><Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No hay técnicos en esta categoría</p></div>
            ) : (
              <div className="space-y-2">
                {equipoModalData.members.map((member: any, idx: number) => (
                  <motion.div key={member.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setEquipoModalOpen(false); onViewTechnician(member); }}>
                    <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">{(member.full_name || member.name || "T").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{member.full_name || member.name || "Técnico sin nombre"}</p><p className="text-[11px] text-muted-foreground">{member.email || ""}</p></div>
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}