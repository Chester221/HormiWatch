import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { ProjectDetailModal } from "@/components/projects/ProjectDetailModal";
import {
  FolderKanban, Clock, Download, CheckSquare, Users,
  Building2, Activity, Maximize2, X, ChevronRight,
  CheckCircle, AlertTriangle, Calendar,
  ListTodo, Award, TrendingUp, TrendingDown,
  ChevronLeft, ArrowRight, User, Hash, Pencil,
  BarChart3, List, LayoutGrid,
} from "lucide-react";
import { CreditCard, MapPin, Mail, Phone, Briefcase } from "lucide-react";

// ---------------------------------------------------------------------------
// Constantes de color
// ---------------------------------------------------------------------------

const HORMI_BLUE = '#0DA2E7';
const HORMI_BLUE_BG = '#0DA2E715';
const HORMI_BLUE_HOVER = '#0DA2E720';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ActivityType = "resumen" | "tasks" | "projects" | "clients" | "team" | "exports";

interface ActivityFeedMGProps {
  tasks: any[];
  projects: any[];
  clients: any[];
  technicians: any[];
  hoursByClient: { name: string; hours: number; color: string; projectCount: number }[];
  projectStatus: any[];
  monthTasks: any[];
  metrics: any;
  technicianPerformance: any[];
  onViewClient: (client: any) => void;
  onViewTechnician: (tech: any) => void;
  onViewAllClients: () => void;
  onViewAllTechnicians: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTaskStatusBadge = (status: string) => {
  switch (status) {
    case "Completed": return { label: "Completada", icon: CheckCircle, className: "bg-emerald-50 text-emerald-600" };
    case "InProgress": return { label: "En Progreso", icon: Activity, className: "bg-blue-50 text-blue-600" };
    default: return { label: "Pendiente", icon: Clock, className: "bg-amber-50 text-amber-600" };
  }
};

// ---------------------------------------------------------------------------
// Modal de Detalle de Tarea
// ---------------------------------------------------------------------------

const TaskDetailModal = ({ task, open, onOpenChange, getTechName, getTechInitials, getProjectName, getClientName }: any) => {
  if (!task) return null;

  const badge = getTaskStatusBadge(task.status || "Pending");
  const StatusIcon = badge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <DialogHeader>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`p-3 rounded-xl ${badge.className.split(" ")[0]}`}
              >
                <StatusIcon className={`h-6 w-6 ${badge.className.split(" ")[1]}`} />
              </motion.div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Detalle de Tarea
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[11px] ${badge.className}`}>
                    {badge.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </motion.div>

        <div className="flex-1 overflow-y-auto pr-2 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Descripción</h3>
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <p className="text-sm text-foreground">{task.description || "Sin descripción"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />Información General
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Proyecto</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {getProjectName(task.project_id)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {getClientName(task.project_id)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Horas Registradas</p>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    {((task.normal_hours || 0) + (task.overtime_hours || 0)).toFixed(1)}h
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Fecha de Creación</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(task.created_at), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />Personas
              </h3>
              <div className="grid gap-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">
                      {getTechInitials(task.technician_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{getTechName(task.technician_id)}</p>
                    <p className="text-xs text-muted-foreground">Técnico Asignado</p>
                  </div>
                </div>

                {task.created_by && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">
                        {getTechInitials(task.created_by)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{getTechName(task.created_by)}</p>
                      <p className="text-xs text-muted-foreground">Creó la tarea</p>
                    </div>
                  </div>
                )}

                {task.updated_at && task.updated_at !== task.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Editada</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {task.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Notas</h3>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Vista RESUMEN
// ---------------------------------------------------------------------------

const ResumenView = ({ hoursByClient, projectStatus, technicianPerformance, monthTasks, metrics, technicians, tasks, onViewTechnician, onViewAllTechnicians, onViewClient, onViewAllClients }: any) => {
  const totalClientHours = hoursByClient.reduce((sum: number, c: any) => sum + c.hours, 0) || 1;
  const maxClientHours = hoursByClient[0]?.hours || 1;
  const delayedProjects = projectStatus.filter((p: any) => p.isDelayed);
  const topTechnicians = technicianPerformance.slice(0, 5);
  const recentMonthTasks = monthTasks.slice(0, 8);
  const [clientPage, setClientPage] = useState(0);
  const clientsPerPage = 4;
  const totalClientPages = Math.ceil(hoursByClient.length / clientsPerPage);
  const visibleClients = hoursByClient.slice(clientPage * clientsPerPage, (clientPage + 1) * clientsPerPage);
  const [isExpandHovered, setIsExpandHovered] = useState(false);
  const completionRate = metrics.tareas.count > 0 ? Math.round((metrics.tareas.completed / metrics.tareas.count) * 100) : 0;
  const [equipoModalOpen, setEquipoModalOpen] = useState(false);
  const [equipoModalData, setEquipoModalData] = useState<{ title: string; icon: string; members: any[] }>({ title: "", icon: "", members: [] });
  const [allTasksModalOpen, setAllTasksModalOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const tecnicosActivos = technicians.filter((t: any) => monthTasks.some((task: any) => task.technician_id === t.id));
  const tecnicosInactivos = technicians.filter((t: any) => !monthTasks.some((task: any) => task.technician_id === t.id));
  const tecnicosSinProyecto = technicians.filter((t: any) => !projectStatus.some((p: any) => tasks.some((task: any) => task.technician_id === t.id && task.project_id === p.id)));
  const tecnicosDisponibles = technicians.filter((t: any) => { const h = monthTasks.filter((task: any) => task.technician_id === t.id).reduce((s: number, task: any) => s + (task.hours || 0), 0); return h > 0 && h < 10; });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          
          {/* HORAS POR CLIENTE - MEJORADO CON ANIMACIONES */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: HORMI_BLUE }} />
                Horas por Cliente
              </h3>
              <div className="flex items-center gap-1">
                {totalClientPages > 1 && (
                  <div className="flex items-center gap-0.5 mr-1">
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setClientPage((p: number) => (p - 1 + totalClientPages) % totalClientPages)}><ChevronLeft className="h-4 w-4" /></Button>
                    </motion.div>
                    <span className="text-xs text-muted-foreground min-w-[36px] text-center tabular-nums">{clientPage + 1}/{totalClientPages}</span>
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setClientPage((p: number) => (p + 1) % totalClientPages)}><ChevronRight className="h-4 w-4" /></Button>
                    </motion.div>
                  </div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" onClick={onViewAllClients} className="gap-1.5 text-xs h-7 group">
                    <span className="group-hover:underline">Ver todos</span>
                    <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.span>
                  </Button>
                </motion.div>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={clientPage} 
                initial={{ opacity: 0, x: 60 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -60 }} 
                transition={{ duration: 0.4, ease: "easeInOut" }} 
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                {visibleClients.map((client: any, idx: number) => (
                  <motion.div 
                    key={client.name} 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    transition={{ delay: idx * 0.08, duration: 0.4, type: "spring", stiffness: 150 }}
                    whileHover={{ y: -6, scale: 1.04, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.97 }}
                    className="p-3.5 rounded-xl border border-border/50 bg-muted/5 hover:shadow-lg hover:border-[#0DA2E7]/30 transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => onViewClient(client)}
                  >
                    {/* Brillo al hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <div className="flex items-center gap-2 mb-3 relative">
                      <motion.div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: HORMI_BLUE }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: idx * 0.5 }}
                      />
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">{client.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2 relative">
                      <motion.span 
                        className="text-2xl font-bold text-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                      >
                        {client.hours.toFixed(1)}
                      </motion.span>
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                    <div className="space-y-1.5 relative">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: HORMI_BLUE }} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(client.hours / maxClientHours) * 100}%` }} 
                          transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">{Math.round((client.hours / totalClientHours) * 100)}% del total</span>
                        <span className="text-muted-foreground">{client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* TAREAS DEL MES + RESUMEN TAREAS */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* RESUMEN DE TAREAS */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                >
                  <ListTodo className="h-4 w-4" style={{ color: HORMI_BLUE }} />
                </motion.div>
                Resumen de Tareas
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center cursor-pointer"
                >
                  <motion.p 
                    className="text-2xl font-bold text-emerald-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {metrics.tareas.completed}
                  </motion.p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Completadas</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center cursor-pointer"
                >
                  <motion.p 
                    className="text-2xl font-bold text-amber-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {metrics.tareas.pending}
                  </motion.p>
                  <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Pendientes</p>
                </motion.div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progreso total</span>
                  <motion.span 
                    className="font-semibold text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {completionRate}%
                  </motion.span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">{metrics.tareas.count} tareas totales</p>
            </motion.div>

            {/* TAREAS DEL MES */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Activity className="h-4 w-4" style={{ color: HORMI_BLUE }} />
                  </motion.div>
                  Tareas del Mes
                </h3>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="sm" onClick={() => setAllTasksModalOpen(true)} className="gap-1.5 text-xs h-7 group">
                    <span className="group-hover:underline">Ampliar</span>
                    <motion.span 
                      animate={{ rotate: [0, 90, 90, 0] }} 
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </motion.span>
                  </Button>
                </motion.div>
              </div>
              {recentMonthTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  </motion.div>
                  <p className="text-xs text-muted-foreground">Sin tareas este mes</p>
                </motion.div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {recentMonthTasks.map((task: any, idx: number) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                      whileHover={{ x: 4, scale: 1.01, transition: { duration: 0.15 } }}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/5 border border-border/30 hover:border-[#0DA2E7]/30 hover:bg-muted/10 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <motion.div 
                        className="p-1.5 rounded-md bg-muted/50"
                        animate={{ scale: task.status === "Completed" ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.5, repeat: task.status === "Completed" ? Infinity : 0, repeatDelay: 2 }}
                      >
                        {task.status === "Completed" ? 
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : 
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                        }
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-[#0DA2E7] transition-colors">{task.description || "Sin descripción"}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{task.projectName}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(task.created_at), "dd/MM")}</span>
                        </div>
                      </div>
                      <motion.span 
                        className="text-xs font-semibold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 + 0.3 }}
                      >
                        {task.hours.toFixed(1)}h
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* TÉCNICOS DESTACADOS */}
          {topTechnicians.length > 0 && (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
  >
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <Award className="h-4 w-4" style={{ color: HORMI_BLUE }} />
      Técnicos Destacados
    </h3>
    <div className="space-y-1">
      {topTechnicians.map((tech: any, idx: number) => {
        const efficiency = tech.tasks > 0 ? (tech.completedTasks / tech.tasks) * 100 : 0;
        const trendColor = tech.trend > 0 ? "text-emerald-500" : tech.trend < 0 ? "text-destructive" : "text-muted-foreground";
        const TrendIcon = tech.trend > 0 ? TrendingUp : tech.trend < 0 ? TrendingDown : null;
        
        // 🔥 Obtener el nombre real del técnico
        const techData = technicians.find((t: any) => t.id === tech.id);
        const techName = techData?.full_name || techData?.name || tech.name || "Técnico";
        const techInitials = techName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        
        return (
          <motion.div 
            key={tech.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
            onClick={() => onViewTechnician(tech)} 
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
          >
            {/* Número de ranking */}
            <motion.div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm" 
              style={{ backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : HORMI_BLUE }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            >
              {idx + 1}
            </motion.div>
            
            {/* Avatar con iniciales */}
            <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-border">
              <AvatarFallback 
                className="text-[10px] font-semibold" 
                style={{ backgroundColor: HORMI_BLUE_BG, color: HORMI_BLUE }}
              >
                {techInitials}
              </AvatarFallback>
            </Avatar>
            
            {/* Nombre y proyectos */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{techName}</p>
              <p className="text-[11px] text-muted-foreground">
                {tech.projectCount} {tech.projectCount === 1 ? "proyecto" : "proyectos"} · {tech.tasks} {tech.tasks === 1 ? "tarea" : "tareas"}
              </p>
            </div>
            
            {/* Horas */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-foreground">{tech.hours.toFixed(1)}h</p>
              <p className="text-[11px] text-muted-foreground">{tech.completedTasks}/{tech.tasks} completadas</p>
            </div>
            
            {/* Eficiencia y tendencia */}
            <div className="text-right flex-shrink-0 w-20">
              <div className="flex items-center justify-end gap-1">
                {TrendIcon && <TrendIcon className={`h-3 w-3 ${trendColor}`} />}
                <motion.span 
                  className={`text-xs font-semibold ${trendColor}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.4 }}
                >
                  {tech.trend > 0 ? "+" : ""}{tech.trend}%
                </motion.span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <motion.div 
                  className="h-full rounded-full" 
                  style={{ 
                    backgroundColor: efficiency >= 80 ? '#10b981' : efficiency >= 50 ? '#f59e0b' : '#ef4444',
                    width: `${efficiency}%` 
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${efficiency}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
)}

          {/* ESTADO DEL EQUIPO */}
          {technicians.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Users className="h-4 w-4" style={{ color: HORMI_BLUE }} />
                </motion.div>
                Estado del Equipo
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Activos", count: tecnicosActivos.length, color: "#10b981", bg: "#10b98110", members: tecnicosActivos },
                  { label: "Inactivos", count: tecnicosInactivos.length, color: "#6b7280", bg: "#6b728010", members: tecnicosInactivos },
                  { label: "Sin Proyecto", count: tecnicosSinProyecto.length, color: "#f59e0b", bg: "#f59e0b10", members: tecnicosSinProyecto },
                  { label: "Disponibles", count: tecnicosDisponibles.length, color: HORMI_BLUE, bg: HORMI_BLUE_BG, members: tecnicosDisponibles },
                ].map((cat, idx) => (
                  <motion.div 
                    key={cat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.5, duration: 0.3, type: "spring" }}
                    whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl text-center cursor-pointer border border-border/50 hover:shadow-lg transition-all relative overflow-hidden"
                    style={{ backgroundColor: cat.bg }}
                    onMouseEnter={() => setHoveredCategory(cat.label)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => { 
                      setEquipoModalData({ title: cat.label, icon: "", members: cat.members }); 
                      setEquipoModalOpen(true); 
                    }}
                  >
                    {/* Efecto de onda al hover */}
                    <motion.div 
                      className="absolute inset-0 bg-white/20 rounded-xl"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: hoveredCategory === cat.label ? 1 : 0, opacity: hoveredCategory === cat.label ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.p 
                      className="text-2xl font-bold relative"
                      style={{ color: cat.color }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.15 + 0.6, type: "spring" }}
                    >
                      {cat.count}
                    </motion.p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 relative">{cat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* PROYECTOS EN RIESGO */}
        <div className="space-y-5">
          {delayedProjects.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </motion.div>
                Proyectos en Riesgo
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{delayedProjects.length}</Badge>
                </motion.div>
              </h3>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {delayedProjects.map((project: any, idx: number) => (
                      <motion.div 
                        key={project.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        className="space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] flex-shrink-0 ml-2">+{project.daysDelayed}d</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="h-1.5 flex-1" />
                          <span className="text-[11px] font-medium text-muted-foreground">{project.progress}%</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{project.completed}/{project.total}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.hours.toFixed(1)}h</span>
                          <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" />{project.teamSize} téc.</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </motion.div>
                Proyectos en Riesgo
              </h3>
              <Card className="border-border bg-card">
                <CardContent className="p-6 text-center">
                  <motion.div 
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </motion.div>
                  </motion.div>
                  <motion.p 
                    className="text-sm font-medium text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Todo en orden
                  </motion.p>
                  <motion.p 
                    className="text-xs text-muted-foreground mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    No hay proyectos atrasados
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* MODALES */}
      <Dialog open={equipoModalOpen} onOpenChange={setEquipoModalOpen}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col overflow-hidden">
          <DialogHeader><DialogTitle className="text-lg font-bold">{equipoModalData.title}</DialogTitle><DialogDescription className="text-xs">{equipoModalData.members.length} técnicos</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            {equipoModalData.members.length === 0 ? (
              <div className="text-center py-8"><Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No hay técnicos</p></div>
            ) : (
              <div className="space-y-2">
                {equipoModalData.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20 cursor-pointer hover:bg-muted/40" onClick={() => { setEquipoModalOpen(false); onViewTechnician(member); }}>
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">{(member.full_name || member.name || "T").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{member.full_name || member.name || "Técnico"}</p><p className="text-[11px] text-muted-foreground">{member.email || ""}</p></div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={allTasksModalOpen} onOpenChange={setAllTasksModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0"><DialogTitle className="text-lg font-bold">Tareas del Mes</DialogTitle><DialogDescription className="text-xs">{monthTasks.length} tareas · {format(new Date(), "MMMM yyyy")}</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {(() => { const groups: Record<string, any[]> = {}; monthTasks.forEach((task: any) => { const date = new Date(task.created_at); const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); let key = ""; if (date.toDateString() === today.toDateString()) key = "HOY"; else if (date.toDateString() === yesterday.toDateString()) key = "AYER"; else key = format(date, "dd 'de' MMMM", { locale: es }).toUpperCase(); if (!groups[key]) groups[key] = []; groups[key].push(task); }); return Object.entries(groups).map(([date, items]) => (<div key={date}><div className="flex items-center gap-2 mb-3"><CalendarDays className="h-3.5 w-3.5" style={{ color: HORMI_BLUE }} /><h4 className="text-xs font-bold uppercase" style={{ color: HORMI_BLUE }}>{date}</h4><div className="flex-1 h-px" style={{ backgroundColor: HORMI_BLUE + '30' }} /></div><div className="space-y-2">{items.map((task: any) => { const badge = getTaskStatusBadge(task.status); const Icon = badge.icon; return (<div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20"><div className={`p-1.5 rounded-md ${badge.className.split(" ")[0]}`}><Icon className={`h-4 w-4 ${badge.className.split(" ")[1]}`} /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{task.description || "Sin descripción"}</p><Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge></div><p className="text-[11px] text-muted-foreground">{task.projectName} · {task.clientName} · {format(new Date(task.created_at), "dd/MM/yyyy HH:mm")}</p></div><span className="text-xs font-semibold">{task.hours.toFixed(1)}h</span></div>); })}</div></div>)); })()}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Vista TAREAS
// ---------------------------------------------------------------------------

const TasksView = ({ metrics, monthTasks, onAmpliar, technicians, projects, clients }: any) => {
  const completionRate = metrics.tareas.count > 0 ? Math.round((metrics.tareas.completed / metrics.tareas.count) * 100) : 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const getTechName = (techId: string) => {
    const tech = technicians.find((t: any) => t.id === techId);
    return tech?.full_name || tech?.name || "Técnico";
  };
  const getTechInitials = (techId: string) => {
    const name = getTechName(techId);
    return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  };
  const getProjectName = (projId: string) => {
    const proj = projects.find((p: any) => p.id === projId);
    return proj?.name || "Sin proyecto";
  };
  const getClientName = (projId: string) => {
    const proj = projects.find((p: any) => p.id === projId);
    return proj?.clients?.name || clients.find((c: any) => c.id === proj?.client_id)?.name || "Sin cliente";
  };

  const filteredTasks = monthTasks.filter((task: any) => {
    const matchesSearch = !searchQuery || (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesProject = projectFilter === "all" || task.project_id === projectFilter;
    const matchesTech = techFilter === "all" || task.technician_id === techFilter;
    return matchesSearch && matchesStatus && matchesProject && matchesTech;
  });

  const pendingTasks = filteredTasks.filter((t: any) => t.status === "Pending" || !t.status);
  const inProgressTasks = filteredTasks.filter((t: any) => t.status === "InProgress");
  const completedTasks = filteredTasks.filter((t: any) => t.status === "Completed");

  const projectList = [...new Set(monthTasks.map((t: any) => t.project_id).filter(Boolean))];
  const techList = [...new Set(monthTasks.map((t: any) => t.technician_id).filter(Boolean))];

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  // Animaciones para iconos de columna
  const columnIconAnimation = (delay: number) => ({
    animate: { rotate: [0, 8, -8, 0], scale: [1, 1.1, 1.1, 1] },
    transition: { duration: 2, repeat: Infinity, repeatDelay: delay }
  });

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* MÉTRICAS SUPERIORES CON ANIMACIONES */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: filteredTasks.length, color: HORMI_BLUE, bg: HORMI_BLUE_BG, delay: 0.1 },
            { label: "Pendientes", value: pendingTasks.length, color: "#f59e0b", bg: "#f59e0b15", delay: 0.15 },
            { label: "En Progreso", value: inProgressTasks.length, color: "#3b82f6", bg: "#3b82f615", delay: 0.2 },
            { label: "Completadas", value: completedTasks.length, color: "#10b981", bg: "#10b98115", delay: 0.25 },
            { label: "Eficiencia", value: `${completionRate}%`, color: "#8b5cf6", bg: "#8b5cf615", delay: 0.3 },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: metric.delay, duration: 0.4, type: "spring" }}
              whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
              className="rounded-xl border border-border bg-card p-3 text-center hover:shadow-lg transition-all cursor-default relative overflow-hidden"
            >
              {/* Brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <motion.p 
                className="text-2xl font-bold tracking-tight"
                style={{ color: metric.color }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: metric.delay + 0.15, type: "spring" }}
              >
                {metric.value}
              </motion.p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* FILTROS CON ANIMACIONES */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar tarea..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 h-9 text-xs bg-background focus:border-[#0DA2E7]/30 transition-all duration-300" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pending">Pendientes</SelectItem>
              <SelectItem value="InProgress">En Progreso</SelectItem>
              <SelectItem value="Completed">Completadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Proyecto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {projectList.map((pid: string) => (<SelectItem key={pid} value={pid}>{getProjectName(pid)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {techList.map((tid: string) => (<SelectItem key={tid} value={tid}>{getTechName(tid)}</SelectItem>))}
            </SelectContent>
          </Select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" onClick={onAmpliar} className="gap-1.5 text-xs h-9 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all">
              <Maximize2 className="h-3.5 w-3.5" />
              Ampliar
            </Button>
          </motion.div>
        </motion.div>

        {/* COLUMNAS KANBAN CON ANIMACIONES */}
        <motion.div 
          layout 
          className="grid gap-4 sm:grid-cols-3" 
          style={{ height: "calc(100% - 140px)" }}
        >
          {/* PENDIENTES */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-amber-50/30">
              <div className="flex items-center gap-2">
                <motion.div {...columnIconAnimation(3)}>
                  <Clock className="h-4 w-4 text-amber-500" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">Pendientes</span>
              </div>
              <motion.span 
                className="text-xs text-muted-foreground bg-amber-100 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                {pendingTasks.length}
              </motion.span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[280px]">
              <AnimatePresence>
                {pendingTasks.map((task: any, idx: number) => (
                  <KanbanCard 
                    key={task.id} 
                    task={task} 
                    idx={idx} 
                    getTechName={getTechName} 
                    getTechInitials={getTechInitials} 
                    getProjectName={getProjectName} 
                    getClientName={getClientName} 
                    onClick={() => handleTaskClick(task)} 
                    accentColor="#f59e0b"
                  />
                ))}
              </AnimatePresence>
              {pendingTasks.length === 0 && <EmptyColumn icon={Clock} text="Sin tareas pendientes" color="#f59e0b" />}
            </div>
          </motion.div>

          {/* EN PROGRESO */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-blue-50/30">
              <div className="flex items-center gap-2">
                <motion.div {...columnIconAnimation(4)}>
                  <Activity className="h-4 w-4 text-blue-500" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">En Progreso</span>
              </div>
              <motion.span 
                className="text-xs text-muted-foreground bg-blue-100 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                {inProgressTasks.length}
              </motion.span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[280px]">
              <AnimatePresence>
                {inProgressTasks.map((task: any, idx: number) => (
                  <KanbanCard 
                    key={task.id} 
                    task={task} 
                    idx={idx} 
                    getTechName={getTechName} 
                    getTechInitials={getTechInitials} 
                    getProjectName={getProjectName} 
                    getClientName={getClientName} 
                    onClick={() => handleTaskClick(task)} 
                    accentColor="#3b82f6"
                  />
                ))}
              </AnimatePresence>
              {inProgressTasks.length === 0 && <EmptyColumn icon={Activity} text="Sin tareas en progreso" color="#3b82f6" />}
            </div>
          </motion.div>

          {/* COMPLETADAS */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-emerald-50/30">
              <div className="flex items-center gap-2">
                <motion.div {...columnIconAnimation(5)}>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">Completadas</span>
              </div>
              <motion.span 
                className="text-xs text-muted-foreground bg-emerald-100 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                {completedTasks.length}
              </motion.span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[280px]">
              <AnimatePresence>
                {completedTasks.map((task: any, idx: number) => (
                  <KanbanCard 
                    key={task.id} 
                    task={task} 
                    idx={idx} 
                    getTechName={getTechName} 
                    getTechInitials={getTechInitials} 
                    getProjectName={getProjectName} 
                    getClientName={getClientName} 
                    onClick={() => handleTaskClick(task)} 
                    accentColor="#10b981"
                  />
                ))}
              </AnimatePresence>
              {completedTasks.length === 0 && <EmptyColumn icon={CheckCircle} text="Sin tareas completadas" color="#10b981" />}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <TaskDetailModal task={selectedTask} open={taskModalOpen} onOpenChange={setTaskModalOpen} getTechName={getTechName} getTechInitials={getTechInitials} getProjectName={getProjectName} getClientName={getClientName} />
    </>
  );
};

// KANBAN CARD MEJORADA CON ANIMACIONES
const KanbanCard = ({ task, idx, getTechName, getTechInitials, getProjectName, getClientName, onClick, accentColor = "#0DA2E7" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, x: -20 }}
    transition={{ delay: idx * 0.03, duration: 0.25, type: "spring", stiffness: 200 }}
    whileHover={{ y: -2, scale: 1.02, transition: { duration: 0.15 } }}
    whileTap={{ scale: 0.98 }}
    className="p-3 rounded-lg bg-card shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
    style={{ border: `1px solid ${accentColor}15` }}
    onClick={onClick}
  >
    {/* Línea decorativa superior */}
    <div 
      className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ backgroundColor: accentColor }}
    />
    
    {/* Brillo al hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    
    <p className="text-xs font-medium text-foreground leading-relaxed line-clamp-2 mb-2.5 group-hover:text-[#0DA2E7] transition-colors">
      {task.description || "Sin descripción"}
    </p>
    <div className="space-y-1.5 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <FolderKanban className="h-3 w-3 flex-shrink-0" style={{ color: accentColor }} />
        <span className="truncate">{getProjectName(task.project_id)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Building2 className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{getClientName(task.project_id)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Avatar className="h-4 w-4 flex-shrink-0">
          <AvatarFallback className="text-[7px] bg-muted text-foreground font-medium">
            {getTechInitials(task.technician_id)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{getTechName(task.technician_id)}</span>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/50">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{((task.normal_hours || 0) + (task.overtime_hours || 0)).toFixed(1)}h</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <CalendarDays className="h-3 w-3" />
        <span>{format(new Date(task.created_at), "dd/MM")}</span>
      </div>
    </div>
  </motion.div>
);

// EMPTY COLUMN MEJORADA CON ANIMACIONES
const EmptyColumn = ({ icon: Icon, text, color }: { icon: any, text: string, color: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <motion.div 
      className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-2"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Icon className="h-6 w-6" style={{ color }} />
    </motion.div>
    <p className="text-xs text-muted-foreground">{text}</p>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Vista PROYECTOS
// ---------------------------------------------------------------------------

const ProjectsView = ({ projectStatus, tasks, technicians }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const clientList = [...new Set(projectStatus.map((p: any) => p.client).filter(Boolean))] as string[];

  const filteredProjects = projectStatus.filter((p: any) => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter || (statusFilter === "delayed" && p.isDelayed) || (statusFilter === "active" && !p.isDelayed && p.status !== "completed" && p.status !== "not_started");
    const matchesClient = clientFilter === "all" || p.client === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const getLastActivity = (projectId: string) => {
    const projectTasks = tasks.filter((t: any) => t.project_id === projectId);
    if (projectTasks.length === 0) return null;
    const lastTask = projectTasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return lastTask.created_at;
  };

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setProjectModalOpen(true);
  };

  // Contadores para métricas
  const activeCount = projectStatus.filter((p: any) => !p.isDelayed && p.status !== "completed" && p.status !== "not_started").length;
  const delayedCount = projectStatus.filter((p: any) => p.isDelayed).length;
  const completedCount = projectStatus.filter((p: any) => p.status === "completed").length;
  const notStartedCount = projectStatus.filter((p: any) => p.status === "not_started").length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* MÉTRICAS SUPERIORES CON ANIMACIONES */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: projectStatus.length, icon: FolderKanban, color: HORMI_BLUE, bg: HORMI_BLUE_BG, delay: 0.05 },
          { label: "Activos", value: activeCount, icon: Activity, color: "#10b981", bg: "#10b98115", delay: 0.1 },
          { label: "Atrasados", value: delayedCount, icon: AlertTriangle, color: "#ef4444", bg: "#ef444415", delay: 0.15 },
          { label: "Completados", value: completedCount, icon: CheckCircle, color: "#3b82f6", bg: "#3b82f615", delay: 0.2 },
          { label: "Sin Iniciar", value: notStartedCount, icon: Clock, color: "#6b7280", bg: "#6b728015", delay: 0.25 },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: metric.delay, duration: 0.4, type: "spring" }}
            whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
            className="rounded-xl border border-border bg-card p-3 text-center hover:shadow-lg transition-all cursor-default relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <metric.icon className="h-3.5 w-3.5" style={{ color: metric.color }} />
            </div>
            <motion.p 
              className="text-2xl font-bold tracking-tight"
              style={{ color: metric.color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: metric.delay + 0.1, type: "spring" }}
            >
              {metric.value}
            </motion.p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* FILTROS CON ANIMACIONES */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar proyecto..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-9 h-9 text-xs bg-background focus:border-[#0DA2E7]/30 transition-all duration-300" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="delayed">Atrasados</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="not_started">Sin Iniciar</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-9 w-[150px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clientList.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* LISTA DE PROYECTOS CON ANIMACIONES */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            </motion.div>
            <p className="text-sm text-muted-foreground">No se encontraron proyectos</p>
          </motion.div>
        ) : (
          filteredProjects.map((p: any, idx: number) => {
            const lastActivity = getLastActivity(p.id);
            const isNearDeadline = !p.isDelayed && p.daysRemaining > 0 && p.daysRemaining <= 7 && p.status !== "completed";
            const isCompleted = p.status === "completed";
            const isNotStarted = p.status === "not_started";
            const isActive = !p.isDelayed && !isCompleted && !isNotStarted;

            // Determinar color de acento según estado
            const accentColor = p.isDelayed ? '#ef4444' : isCompleted ? '#10b981' : isNotStarted ? '#6b7280' : HORMI_BLUE;
            const accentBg = p.isDelayed ? '#fef2f2' : isCompleted ? '#ecfdf5' : isNotStarted ? '#f9fafb' : HORMI_BLUE_BG;

            return (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.35, type: "spring", stiffness: 150 }}
                whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
                onClick={() => handleProjectClick(p)}
              >
                {/* Línea decorativa izquierda */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Brillo al hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <div className="flex items-start justify-between mb-3 relative">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: accentBg }}
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {p.isDelayed ? <AlertTriangle className="h-5 w-5 text-red-500" /> : 
                       isCompleted ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                       isNotStarted ? <Clock className="h-5 w-5 text-gray-500" /> : 
                       <FolderKanban className="h-5 w-5" style={{ color: HORMI_BLUE }} />}
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-[#0DA2E7] transition-colors">{p.name}</h4>
                        {p.isDelayed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.2, type: "spring" }}
                          >
                            <Badge variant="destructive" className="text-[10px]">+{p.daysDelayed}d</Badge>
                          </motion.div>
                        )}
                        {isNearDeadline && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.2, type: "spring" }}
                          >
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">Quedan {p.daysRemaining}d</Badge>
                          </motion.div>
                        )}
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.2, type: "spring" }}
                          >
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50">Completado</Badge>
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {p.client}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-2">
                      {Array.from({ length: Math.min(p.teamSize, 4) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 + i * 0.05 }}
                        >
                          <Avatar className="h-6 w-6 ring-2 ring-background">
                            <AvatarFallback className="text-[7px] bg-muted text-foreground font-medium">T{i + 1}</AvatarFallback>
                          </Avatar>
                        </motion.div>
                      ))}
                      {p.teamSize > 4 && (
                        <motion.div 
                          className="h-6 w-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 + 0.2 }}
                        >
                          <span className="text-[7px] text-muted-foreground">+{p.teamSize - 4}</span>
                        </motion.div>
                      )}
                    </div>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0DA2E7] transition-colors" />
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3 relative">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progreso</span>
                      <motion.span 
                        className="font-semibold"
                        style={{ color: accentColor }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 + 0.3 }}
                      >
                        {p.progress}%
                      </motion.span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 1, delay: idx * 0.05 + 0.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 + 0.25 }}
                  >
                    <p className="text-sm font-bold">{p.completed}/{p.total}</p>
                    <p className="text-[10px] text-muted-foreground">Tareas</p>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 + 0.3 }}
                  >
                    <p className="text-sm font-bold">{p.hours.toFixed(1)}h</p>
                    <p className="text-[10px] text-muted-foreground">Horas</p>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 + 0.35 }}
                  >
                    <p className="text-sm font-bold">{p.teamSize}</p>
                    <p className="text-[10px] text-muted-foreground">Miembros</p>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2 relative">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(p.startDate), "dd/MM/yy")} → {format(new Date(p.endDate), "dd/MM/yy")}
                    </span>
                    {lastActivity && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Última: {formatDistanceToNow(new Date(lastActivity), { addSuffix: true, locale: es })}
                      </span>
                    )}
                  </div>
                  <motion.span 
                    className="font-semibold"
                    style={{ color: p.isDelayed ? '#ef4444' : isNearDeadline ? '#f59e0b' : isCompleted ? '#10b981' : 'inherit' }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 + 0.4 }}
                  >
                    {p.isDelayed ? `+${p.daysDelayed}d de retraso` : isCompleted ? "Completado" : isNotStarted ? "Sin iniciar" : `${p.daysRemaining}d restantes`}
                  </motion.span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <ProjectDetailModal 
        project={selectedProject ? {
          id: selectedProject.id,
          name: selectedProject.name,
          client: selectedProject.client,
          status: selectedProject.status,
          progress: selectedProject.progress,
          hoursConsumed: selectedProject.hours || 0,
          hoursPool: selectedProject.hoursPool || selectedProject.total_hours || 100,
          endDate: selectedProject.endDate,
          startDate: selectedProject.startDate,
          rate: selectedProject.hourly_rate || 50,
          teamLead: { name: "Sin líder", avatar: "" },
          team: [],
        } : null}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Vista CLIENTES
// ---------------------------------------------------------------------------

const ClientsView = ({ hoursByClient, onViewClient, onViewAllClients, clients, projects, tasks }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("hours");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientPage, setClientPage] = useState(0);
  const clientsPerPage = 5;
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Enriquecer datos - INCLUYE TODOS LOS CLIENTES
  const enrichedClients = useMemo(() => {
    const hoursMap: Record<string, any> = {};
    hoursByClient.forEach((c: any) => {
      hoursMap[c.name] = c;
    });

    return clients.map((client: any) => {
      const clientHours = hoursMap[client.name] || { hours: 0, color: HORMI_BLUE, projectCount: 0 };
      
      const clientProjects = projects.filter((p: any) => {
        const projectClientName = p.clients?.name || p.client;
        return projectClientName === client.name;
      });
      const activeProjects = clientProjects.filter((p: any) => 
        p.status === "in_progress" || p.status === "active" || (!p.isDelayed && p.status !== "completed" && p.status !== "not_started")
      );
      const completedProjects = clientProjects.filter((p: any) => p.status === "completed");
      const delayedProjects = clientProjects.filter((p: any) => p.isDelayed);
      const clientTasks = tasks.filter((t: any) => clientProjects.some((p: any) => p.id === t.project_id));
      
      const lastTask = clientTasks.length > 0 
        ? clientTasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
        : null;
      
      const allCompleted = clientProjects.length > 0 && clientProjects.every((p: any) => p.status === "completed");
      const hasActiveWithProgress = activeProjects.some((p: any) => p.progress > 50);
      const paymentStatus = allCompleted ? "Al día" : 
                           hasActiveWithProgress ? "Parcial" : 
                           activeProjects.length > 0 ? "Pendiente" : 
                           clientProjects.length === 0 ? "Sin proyectos" : "Pendiente";
      
      return {
        name: client.name,
        hours: clientHours.hours || 0,
        color: clientHours.color || HORMI_BLUE,
        projectCount: clientProjects.length,
        logo: client.logo_url || null,
        ruc: client.ruc || null,
        address: client.address || null,
        department: client.department || null,
        is_active: client.is_active !== undefined ? client.is_active : true,
        contacts: client.contacts || [],
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        delayedProjects: delayedProjects.length,
        totalProjects: clientProjects.length,
        paymentStatus,
        lastActivity: lastTask?.created_at || null,
        lastActivityDesc: lastTask?.description || null,
        lastActivityProject: lastTask ? (projects.find((p: any) => p.id === lastTask.project_id)?.name || "Sin proyecto") : null,
        avgProjectProgress: clientProjects.length > 0 
          ? Math.round(clientProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / clientProjects.length)
          : 0,
      };
    });
  }, [hoursByClient, clients, projects, tasks]);

  const filteredClients = useMemo(() => {
    return enrichedClients.filter((c: any) => {
      const matchesSearch = !searchQuery || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.ruc && c.ruc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active) ||
        (statusFilter === "with_projects" && c.totalProjects > 0) ||
        (statusFilter === "no_projects" && c.totalProjects === 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [enrichedClients, searchQuery, statusFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a: any, b: any) => {
      if (sortBy === "hours") return b.hours - a.hours;
      if (sortBy === "projects") return b.totalProjects - a.totalProjects;
      if (sortBy === "activity") return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "progress") return b.avgProjectProgress - a.avgProjectProgress;
      return 0;
    });
  }, [filteredClients, sortBy]);

  const totalPages = Math.ceil(sortedClients.length / clientsPerPage);
  const visibleClients = sortedClients.slice(clientPage * clientsPerPage, (clientPage + 1) * clientsPerPage);

  const metrics = useMemo(() => {
    const totalHoras = enrichedClients.reduce((s: number, c: any) => s + c.hours, 0);
    const totalProyectos = enrichedClients.reduce((s: number, c: any) => s + c.totalProjects, 0);
    const promedioHoras = enrichedClients.length > 0 ? totalHoras / enrichedClients.length : 0;
    const clientesActivos = enrichedClients.filter((c: any) => c.is_active).length;
    const clientesConProyectos = enrichedClients.filter((c: any) => c.totalProjects > 0).length;
    
    return { totalHoras, totalProyectos, promedioHoras, clientesActivos, clientesConProyectos };
  }, [enrichedClients]);

  const maxHours = Math.max(...sortedClients.map((c: any) => c.hours), 1);

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };

  const handlePrevPage = () => {
    setSlideDirection('left');
    setClientPage((p) => (p - 1 + totalPages) % totalPages);
  };

  const handleNextPage = () => {
    setSlideDirection('right');
    setClientPage((p) => (p + 1) % totalPages);
  };

  const ClientAvatar = ({ client, size = 'md' }: { client: any, size?: 'sm' | 'md' | 'lg' }) => {
    const [imgError, setImgError] = useState(false);
    const sizeClasses = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-lg',
      lg: 'h-16 w-16 text-2xl'
    };
    
    return (
      <div className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden ring-2 ring-border bg-white group-hover:ring-[#0DA2E7]/30 transition-all duration-300`}>
        {client.logo && !imgError ? (
          <img src={client.logo} alt={client.name} className="h-full w-full object-contain p-1" onError={() => setImgError(true)} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0DA2E7]/10 to-[#0DA2E7]/5 flex items-center justify-center">
            <motion.span 
              className="font-bold" 
              style={{ color: HORMI_BLUE }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {client.name.charAt(0).toUpperCase()}
            </motion.span>
          </div>
        )}
      </div>
    );
  };

  // Animación para iconos de métricas
  const metricIconAnimation = (delay: number) => ({
    animate: { rotate: [0, 8, -8, 0], scale: [1, 1.1, 1.1, 1] },
    transition: { duration: 2, repeat: Infinity, repeatDelay: delay }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* MÉTRICAS SUPERIORES CON ANIMACIONES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { delay: 0.05, icon: Building2, bg: HORMI_BLUE_BG, color: HORMI_BLUE, label: "Total", value: enrichedClients.length, sub: "Clientes registrados" },
          { delay: 0.1, icon: Clock, bg: HORMI_BLUE_BG, color: HORMI_BLUE, label: "Horas", value: metrics.totalHoras.toFixed(0), sub: "Horas totales registradas" },
          { delay: 0.15, icon: FolderKanban, bg: '#10b98115', color: '#10b981', label: "Proyectos", value: metrics.totalProyectos, sub: `${metrics.clientesConProyectos} clientes con proyectos` },
          { delay: 0.2, icon: TrendingUp, bg: '#f59e0b15', color: '#f59e0b', label: "Promedio", value: `${metrics.promedioHoras.toFixed(0)}h`, sub: "Promedio horas/cliente" },
          { delay: 0.25, icon: Activity, bg: '#f43f5e15', color: '#f43f5e', label: "Activos", value: metrics.clientesActivos, sub: "Clientes activos ahora" },
        ].map((metric, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 30, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: metric.delay, duration: 0.4, type: "spring" }}
            whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: metric.bg }}>
  <metric.icon className="h-3.5 w-3.5" style={{ color: metric.color }} />
</div>
              <span className="text-[11px] text-muted-foreground">{metric.label}</span>
            </div>
            <motion.p 
              className="text-2xl font-bold tracking-tight text-foreground relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: metric.delay + 0.1 }}
            >
              {metric.value}
            </motion.p>
            <p className="text-[10px] text-muted-foreground mt-1 relative">{metric.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* GRÁFICO DE DISTRIBUCIÓN CON ANIMACIONES */}
      {sortedClients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.005 }}
          className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <BarChart3 className="h-3.5 w-3.5" style={{ color: HORMI_BLUE }} />
            </motion.div>
            Distribución de Horas - Top 5
          </h3>
          <div className="space-y-2">
            {sortedClients.slice(0, 5).map((client: any, idx: number) => {
              const percentage = metrics.totalHoras > 0 ? (client.hours / metrics.totalHoras) * 100 : 0;
              const colors = ['bg-[#0DA2E7]', 'bg-[#0DA2E7]/80', 'bg-[#0DA2E7]/60', 'bg-[#0DA2E7]/40', 'bg-[#0DA2E7]/20'];
              return (
                <motion.div 
                  key={client.name} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 + 0.3 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => handleClientClick(client)}
                >
                  <motion.span 
                    className="text-[10px] text-muted-foreground w-4"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.4, type: "spring" }}
                  >
                    {idx + 1}
                  </motion.span>
                  <span className="text-[10px] text-foreground w-28 truncate group-hover:text-[#0DA2E7] transition-colors">{client.name}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(percentage, 2)}%` }} 
                      transition={{ duration: 1, delay: idx * 0.1 + 0.5, ease: "easeOut" }} 
                      className={`h-full rounded-full ${colors[idx]}`} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground w-16 text-right tabular-nums">{client.hours.toFixed(0)}h</span>
                  <motion.span 
                    className="text-[10px] text-muted-foreground w-12 text-right tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 + 0.6 }}
                  >
                    {percentage.toFixed(1)}%
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* BUSCADOR + FILTROS CON ANIMACIONES */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-xl border border-border bg-card p-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, RIF o dirección..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setClientPage(0); }} 
              className="pl-9 h-9 text-xs bg-background focus:border-[#0DA2E7]/30 transition-all duration-300" 
            />
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="with_projects">Con proyectos</SelectItem>
                <SelectItem value="no_projects">Sin proyectos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[130px] text-xs hover:border-[#0DA2E7]/30 transition-all"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Más horas</SelectItem>
                <SelectItem value="projects">Más proyectos</SelectItem>
                <SelectItem value="activity">Más reciente</SelectItem>
                <SelectItem value="progress">Más progreso</SelectItem>
                <SelectItem value="name">Alfabético</SelectItem>
              </SelectContent>
            </Select>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="h-9 w-9 p-0" title={viewMode === 'grid' ? 'Vista Lista' : 'Vista Grid'}>
                <motion.div
                  key={viewMode}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </motion.div>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={onViewAllClients} className="gap-1.5 text-xs h-9 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all">
                <Maximize2 className="h-3.5 w-3.5" />Ver todos
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CARRUSEL DE CLIENTES CON ANIMACIONES */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <motion.h4 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Clientes {sortedClients.length > 0 && `(${sortedClients.length})`}
          </motion.h4>
          
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1"
          >
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" 
                onClick={handlePrevPage} 
                disabled={totalPages <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <span className="text-xs text-muted-foreground min-w-[45px] text-center tabular-nums font-medium">
              {totalPages > 0 ? `${clientPage + 1} / ${totalPages}` : '0 / 0'}
            </span>
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" 
                onClick={handleNextPage} 
                disabled={totalPages <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {visibleClients.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-16 rounded-xl border border-border bg-card"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground">No se encontraron clientes</p>
            <p className="text-xs text-muted-foreground mt-1">Ajusta los filtros o la búsqueda</p>
          </motion.div>
        ) : (
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={slideDirection}>
              {viewMode === 'grid' ? (
                <motion.div 
                  key={`grid-${clientPage}`} 
                  custom={slideDirection} 
                  initial={{ opacity: 0, x: slideDirection === 'right' ? 80 : -80 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: slideDirection === 'right' ? -80 : 80 }} 
                  transition={{ duration: 0.4, ease: "easeInOut" }} 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
                >
                  {visibleClients.map((client: any, idx: number) => (
                    <motion.div 
                      key={client.name} 
                      initial={{ opacity: 0, scale: 0.85, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      transition={{ delay: idx * 0.06, duration: 0.35, type: "spring", stiffness: 150 }} 
                      whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }} 
                      whileTap={{ scale: 0.97 }} 
                      className="p-4 rounded-xl border border-border/50 bg-card hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      onClick={() => handleClientClick(client)}
                    >
                      {/* Línea superior de color */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0DA2E7]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Brillo al hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      
                      <div className="flex items-start justify-between mb-3 relative">
                        <div className="relative">
                          <ClientAvatar client={client} size="md" />
                          {client.is_active && (
                            <motion.div 
                              className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-400 rounded-full ring-2 ring-card"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 + 0.2 }}
                        >
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${client.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {client.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </motion.div>
                      </div>
                      <div className="mb-3 relative">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">{client.name}</h3>
                        {client.ruc && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Hash className="h-3 w-3" />{client.ruc}
                          </p>
                        )}
                      </div>
                      <div className="mb-3 relative">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />Horas
                          </span>
                          <motion.span 
                            className="text-lg font-bold text-foreground"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.3, type: "spring" }}
                          >
                            {client.hours.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">h</span>
                          </motion.span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${maxHours > 0 ? Math.min((client.hours / maxHours) * 100, 100) : 0}%` }} 
                            transition={{ duration: 1, delay: idx * 0.1 + 0.4, ease: "easeOut" }} 
                            className="h-full rounded-full" 
                            style={{ backgroundColor: client.hours > 0 ? HORMI_BLUE : '#e5e7eb' }} 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50 relative">
                        <motion.span 
                          className="flex items-center gap-1.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 + 0.5 }}
                        >
                          <FolderKanban className="h-3 w-3" />{client.totalProjects} proy.
                        </motion.span>
                        <motion.span 
                          className="flex items-center gap-1.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 + 0.55 }}
                        >
                          <Activity className="h-3 w-3" />{client.activeProjects} activos
                        </motion.span>
                      </div>
                      <div className="mt-2 flex items-center justify-between relative">
                        <motion.span 
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            client.paymentStatus === "Al día" ? "text-emerald-600" : 
                            client.paymentStatus === "Parcial" ? "text-blue-600" : 
                            client.paymentStatus === "Pendiente" ? "text-amber-600" : 
                            "text-muted-foreground"
                          }`}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.6 }}
                        >
                          <CreditCard className="h-3 w-3" />{client.paymentStatus}
                        </motion.span>
                        {client.lastActivity && (
                          <motion.span 
                            className="text-[10px] text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 + 0.65 }}
                          >
                            {formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true, locale: es })}
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key={`list-${clientPage}`} 
                  custom={slideDirection} 
                  initial={{ opacity: 0, x: slideDirection === 'right' ? 80 : -80 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: slideDirection === 'right' ? -80 : 80 }} 
                  transition={{ duration: 0.4, ease: "easeInOut" }} 
                  className="space-y-2"
                >
                  {visibleClients.map((client: any, idx: number) => (
                    <motion.div 
                      key={client.name} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: idx * 0.04 }} 
                      whileHover={{ x: 4, scale: 1.005 }} 
                      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0DA2E7]/40 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <ClientAvatar client={client} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">{client.name}</h3>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${client.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{client.is_active ? "Activo" : "Inactivo"}</Badge>
                        </div>
                        {client.ruc && <p className="text-[10px] text-muted-foreground mt-0.5">{client.ruc}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{client.hours.toFixed(1)}h</p>
                        <p className="text-[10px] text-muted-foreground">{client.totalProjects} proyectos</p>
                      </div>
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Progreso</span>
                          <span>{maxHours > 0 ? Math.round((client.hours / maxHours) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${maxHours > 0 ? Math.min((client.hours / maxHours) * 100, 100) : 0}%` }} 
                            transition={{ duration: 1, delay: idx * 0.1 }} 
                            className="h-full rounded-full" 
                            style={{ backgroundColor: client.hours > 0 ? HORMI_BLUE : '#e5e7eb' }} 
                          />
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium flex items-center gap-1 ${
                        client.paymentStatus === "Al día" ? "text-emerald-600" : 
                        client.paymentStatus === "Parcial" ? "text-blue-600" : 
                        client.paymentStatus === "Pendiente" ? "text-amber-600" : 
                        "text-muted-foreground"
                      }`}>
                        <CreditCard className="h-3 w-3" />{client.paymentStatus}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* DOTS DE PAGINACIÓN CON ANIMACIONES */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 mt-4"
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <motion.button 
                key={i} 
                onClick={() => { setSlideDirection(i > clientPage ? 'right' : 'left'); setClientPage(i); }} 
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === clientPage ? '24px' : '6px',
                  backgroundColor: i === clientPage ? HORMI_BLUE : '#d1d5db',
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* MODAL DE DETALLE DEL CLIENTE - se mantiene igual */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        {/* ... (todo el contenido del modal que ya tienes) ... */}
      </Dialog>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Vista EQUIPO - ESTILO CONSISTENTE CON EL RESTO
// ---------------------------------------------------------------------------

const TeamView = ({ technicians, monthTasks, projectStatus, tasks, onViewTechnician }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("hours");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'categories'>('grid');
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [techPage, setTechPage] = useState(0);
  const techsPerPage = 6;
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const enrichedTechnicians = useMemo(() => {
    return technicians.map((tech: any) => {
      const techTasks = monthTasks.filter((t: any) => t.technician_id === tech.id);
      const completedTasks = techTasks.filter((t: any) => t.status === "Completed");
      const pendingTasks = techTasks.filter((t: any) => t.status === "Pending" || !t.status);
      const inProgressTasks = techTasks.filter((t: any) => t.status === "InProgress");
      
      const totalHours = techTasks.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
      const techProjects = [...new Set(techTasks.map((t: any) => t.project_id).filter(Boolean))];
      
      const lastActivity = techTasks.length > 0 
        ? techTasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
        : null;

      const efficiency = techTasks.length > 0 ? Math.round((completedTasks.length / techTasks.length) * 100) : 0;
      const isActive = monthTasks.some((task: any) => task.technician_id === tech.id);
      const hasProject = projectStatus.some((p: any) => tasks.some((task: any) => task.technician_id === tech.id && task.project_id === p.id));
      const workload = totalHours < 10 ? "Disponible" : totalHours < 30 ? "Ocupado" : "Sobrecargado";
      
      return {
        ...tech,
        fullName: tech.full_name || tech.name || "Técnico",
        initials: (tech.full_name || tech.name || "T").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        email: tech.email || "",
        totalTasks: techTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        totalHours,
        projectCount: techProjects.length,
        lastActivity: lastActivity?.created_at || null,
        lastActivityDesc: lastActivity?.description || null,
        efficiency,
        isActive,
        hasProject,
        workload,
      };
    });
  }, [technicians, monthTasks, projectStatus, tasks]);

  const filteredTechnicians = useMemo(() => {
    return enrichedTechnicians.filter((tech: any) => {
      const matchesSearch = !searchQuery || 
        tech.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tech.email && tech.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && tech.isActive) ||
        (statusFilter === "inactive" && !tech.isActive) ||
        (statusFilter === "sin_proyecto" && tech.isActive && !tech.hasProject) ||
        (statusFilter === "disponible" && tech.workload === "Disponible") ||
        (statusFilter === "sobrecargado" && tech.workload === "Sobrecargado");
      
      return matchesSearch && matchesStatus;
    });
  }, [enrichedTechnicians, searchQuery, statusFilter]);

  const sortedTechnicians = useMemo(() => {
    return [...filteredTechnicians].sort((a: any, b: any) => {
      if (sortBy === "hours") return b.totalHours - a.totalHours;
      if (sortBy === "tasks") return b.totalTasks - a.totalTasks;
      if (sortBy === "efficiency") return b.efficiency - a.efficiency;
      if (sortBy === "projects") return b.projectCount - a.projectCount;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
      return 0;
    });
  }, [filteredTechnicians, sortBy]);

  const metrics = useMemo(() => {
    const total = enrichedTechnicians.length;
    const activos = enrichedTechnicians.filter((t: any) => t.isActive).length;
    const inactivos = total - activos;
    const sinProyecto = enrichedTechnicians.filter((t: any) => t.isActive && !t.hasProject).length;
    const disponibles = enrichedTechnicians.filter((t: any) => t.workload === "Disponible").length;
    const sobrecargados = enrichedTechnicians.filter((t: any) => t.workload === "Sobrecargado").length;
    const totalHoras = enrichedTechnicians.reduce((s: number, t: any) => s + t.totalHours, 0);
    const eficienciaPromedio = total > 0 ? Math.round(enrichedTechnicians.reduce((s: number, t: any) => s + t.efficiency, 0) / total) : 0;
    
    return { total, activos, inactivos, sinProyecto, disponibles, sobrecargados, totalHoras, eficienciaPromedio };
  }, [enrichedTechnicians]);

  const totalPages = Math.ceil(sortedTechnicians.length / techsPerPage);
  const visibleTechnicians = sortedTechnicians.slice(techPage * techsPerPage, (techPage + 1) * techsPerPage);

  const handleTechClick = (tech: any) => {
    setSelectedTech(tech);
    setTechModalOpen(true);
  };

  const handlePrevPage = () => {
    setSlideDirection('left');
    setTechPage((p) => (p - 1 + totalPages) % totalPages);
  };

  const handleNextPage = () => {
    setSlideDirection('right');
    setTechPage((p) => (p + 1) % totalPages);
  };

  const categorias = [
    { label: "Activos", count: metrics.activos, color: "#10b981", bg: "#10b98115", icon: Activity, members: enrichedTechnicians.filter((t: any) => t.isActive) },
    { label: "Inactivos", count: metrics.inactivos, color: "#6b7280", bg: "#6b728015", icon: Clock, members: enrichedTechnicians.filter((t: any) => !t.isActive) },
    { label: "Sin Proyecto", count: metrics.sinProyecto, color: "#f59e0b", bg: "#f59e0b15", icon: AlertTriangle, members: enrichedTechnicians.filter((t: any) => t.isActive && !t.hasProject) },
    { label: "Disponibles", count: metrics.disponibles, color: HORMI_BLUE, bg: HORMI_BLUE_BG, icon: CheckCircle, members: enrichedTechnicians.filter((t: any) => t.workload === "Disponible") },
  ];

  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Métricas Superiores - Mismo estilo que ClientsView */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { delay: 0.05, icon: Users, bg: '#8b5cf615', color: '#8b5cf6', label: "Total", value: metrics.total, sub: `${metrics.activos} activos` },
          { delay: 0.1, icon: Clock, bg: HORMI_BLUE_BG, color: HORMI_BLUE, label: "Horas Totales", value: `${Math.round(metrics.totalHoras)}h`, sub: "horas registradas" },
          { delay: 0.15, icon: TrendingUp, bg: '#10b98115', color: '#10b981', label: "Eficiencia", value: `${metrics.eficienciaPromedio}%`, sub: "promedio del equipo" },
          { delay: 0.2, icon: CheckCircle, bg: '#f59e0b15', color: '#f59e0b', label: "Disponibles", value: metrics.disponibles, sub: `${metrics.sobrecargados} sobrecargados` },
        ].map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: metric.delay }} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: metric.bg }}>
                <metric.icon className="h-3.5 w-3.5" style={{ color: metric.color }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{metric.label}</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{metric.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{metric.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Buscador + Filtros - Mismo estilo */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar técnico por nombre o email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setTechPage(0); }} className="pl-9 h-9 text-xs bg-background" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="sin_proyecto">Sin Proyecto</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="sobrecargado">Sobrecargados</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Más horas</SelectItem>
                <SelectItem value="tasks">Más tareas</SelectItem>
                <SelectItem value="efficiency">Más eficiencia</SelectItem>
                <SelectItem value="projects">Más proyectos</SelectItem>
                <SelectItem value="name">Alfabético</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'categories' : 'grid')} className="h-9 w-9 p-0" title={viewMode === 'grid' ? 'Vista Categorías' : 'Vista Grid'}>
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {viewMode === 'grid' ? (
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Técnicos {sortedTechnicians.length > 0 && `(${sortedTechnicians.length})`}
            </h4>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" onClick={handlePrevPage} disabled={totalPages <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[45px] text-center tabular-nums font-medium">
                {totalPages > 0 ? `${techPage + 1} / ${totalPages}` : '0 / 0'}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" onClick={handleNextPage} disabled={totalPages <= 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {visibleTechnicians.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 rounded-xl border border-border bg-card">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No se encontraron técnicos</p>
            </motion.div>
          ) : (
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div key={techPage} custom={slideDirection} initial={{ opacity: 0, x: slideDirection === 'right' ? 100 : -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: slideDirection === 'right' ? -100 : 100 }} transition={{ duration: 0.35, ease: "easeInOut" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleTechnicians.map((tech: any, idx: number) => (
                    <motion.div key={tech.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-xl border border-border bg-card hover:shadow-xl transition-all duration-300 cursor-pointer group relative" onClick={() => handleTechClick(tech)}>
                      {/* Header con avatar y estado */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0DA2E7]/10 to-[#0DA2E7]/5 flex items-center justify-center ring-2 ring-border group-hover:ring-[#0DA2E7]/30 transition-all">
                              <span className="text-xs font-bold" style={{ color: HORMI_BLUE }}>{tech.initials}</span>
                            </div>
                            {tech.isActive && <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-400 rounded-full ring-2 ring-card" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">{tech.fullName}</h3>
                            <p className="text-[10px] text-muted-foreground">{tech.email || "Sin email"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tech.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {tech.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{tech.totalHours.toFixed(0)}h</p>
                          <p className="text-[9px] text-muted-foreground">Horas</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{tech.totalTasks}</p>
                          <p className="text-[9px] text-muted-foreground">Tareas</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-foreground">{tech.projectCount}</p>
                          <p className="text-[9px] text-muted-foreground">Proyectos</p>
                        </div>
                      </div>

                      {/* Barra de eficiencia */}
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Eficiencia</span>
                          <span className="font-semibold text-foreground">{tech.efficiency}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${tech.efficiency}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: tech.efficiency > 70 ? '#10b981' : tech.efficiency > 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </div>

                      {/* Carga de trabajo */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          tech.workload === "Disponible" ? "bg-emerald-50 text-emerald-600" :
                          tech.workload === "Ocupado" ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        }`}>
                          {tech.workload}
                        </span>
                        {tech.lastActivity && (
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(tech.lastActivity), { addSuffix: true, locale: es })}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => { setSlideDirection(i > techPage ? 'right' : 'left'); setTechPage(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${i === techPage ? 'w-6' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} style={i === techPage ? { backgroundColor: HORMI_BLUE } : {}} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Vista de Categorías */
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categorias.map((cat) => (
              <div key={cat.label} className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:shadow-md transition-all" onClick={() => setExpandedCat(expandedCat === cat.label ? null : cat.label)}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: cat.bg }}>
                    <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{cat.label}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{cat.count}</p>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {expandedCat && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{expandedCat} ({categorias.find(c => c.label === expandedCat)?.count})</h4>
                  {categorias.find(c => c.label === expandedCat)?.members.map((tech: any) => (
                    <div key={tech.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all" onClick={() => handleTechClick(tech)}>
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0DA2E7]/10 to-[#0DA2E7]/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold" style={{ color: HORMI_BLUE }}>{tech.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{tech.fullName}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{tech.totalHours.toFixed(0)}h</span>
                          <span>{tech.totalTasks} tareas</span>
                          <span>{tech.projectCount} proyectos</span>
                          <span>Efic: {tech.efficiency}%</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        tech.workload === "Disponible" ? "bg-emerald-50 text-emerald-600" :
                        tech.workload === "Ocupado" ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {tech.workload}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Detalle del Técnico */}
      <Dialog open={techModalOpen} onOpenChange={setTechModalOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 rounded-2xl border-0 shadow-2xl">
    {selectedTech && (
      <>
        {/* HEADER CON GRADIENTE */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden flex-shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0DA2E7] via-[#0DA2E7]/90 to-[#0B8BC7]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          
          <div className="relative p-6">
            <div className="flex items-start gap-5">
              {/* Avatar con animación */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl" />
                  {selectedTech.avatar_url ? (
                    <img 
                      src={selectedTech.avatar_url} 
                      alt={selectedTech.fullName}
                      className="relative h-16 w-16 rounded-2xl object-cover ring-4 ring-white/30"
                    />
                  ) : (
                    <div className="relative h-16 w-16 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {selectedTech.initials}
                      </span>
                    </div>
                  )}
                  {selectedTech.isActive && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-400 rounded-full ring-4 ring-white"
                    />
                  )}
                </div>
              </motion.div>

              <div className="flex-1 text-white">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <DialogTitle className="text-2xl font-bold text-white mb-1">
                    {selectedTech.fullName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                        selectedTech.isActive 
                          ? "bg-emerald-400/20 text-emerald-100 border border-emerald-400/30" 
                          : "bg-red-400/20 text-red-100 border border-red-400/30"
                      }`}
                    >
                      {selectedTech.isActive ? "● Activo" : "● Inactivo"}
                    </motion.span>
                    {selectedTech.email && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="text-sm text-white/70"
                      >
                        {selectedTech.email}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Métricas rápidas en el header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-4 gap-3 mt-5"
            >
              {[
                { icon: Clock, label: "Horas", value: `${selectedTech.totalHours.toFixed(1)}h` },
                { icon: CheckSquare, label: "Tareas", value: `${selectedTech.completedTasks}/${selectedTech.totalTasks}` },
                { icon: FolderKanban, label: "Proyectos", value: selectedTech.projectCount },
                { icon: TrendingUp, label: "Eficiencia", value: `${selectedTech.efficiency}%` },
              ].map((metric, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <metric.icon className="h-3.5 w-3.5 text-white/70" />
                    <span className="text-[10px] text-white/70">{metric.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 space-y-6">
            {/* Estado de Tareas con barras */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                </div>
                Estado de Tareas ({selectedTech.totalTasks})
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Completadas", count: selectedTech.completedTasks, color: "#10b981", bg: "bg-emerald-50" },
                  { label: "En Progreso", count: selectedTech.inProgressTasks, color: "#3b82f6", bg: "bg-blue-50" },
                  { label: "Pendientes", count: selectedTech.pendingTasks, color: "#f59e0b", bg: "bg-amber-50" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="font-bold" style={{ color: item.color }}>{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${selectedTech.totalTasks > 0 ? (item.count / selectedTech.totalTasks) * 100 : 0}%` }} 
                        transition={{ duration: 0.8, delay: i * 0.1 + 0.4 }} 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: item.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <Separator />

            {/* Rendimiento */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Eficiencia</h4>
                  </div>
                  <p className="text-4xl font-black text-gray-900">{selectedTech.efficiency}%</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedTech.completedTasks} de {selectedTech.totalTasks} tareas completadas
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-500 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Horas Totales</h4>
                  </div>
                  <p className="text-4xl font-black text-gray-900">{selectedTech.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedTech.projectCount} proyectos activos
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Última Actividad */}
            {selectedTech.lastActivity && (
              <>
                <Separator />
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-violet-50 rounded-lg">
                      <Activity className="h-4 w-4 text-violet-600" />
                    </div>
                    Última Actividad
                  </h3>
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDistanceToNow(new Date(selectedTech.lastActivity), { addSuffix: true, locale: es })}
                    </p>
                    {selectedTech.lastActivityDesc && (
                      <p className="text-sm text-gray-500 mt-1">{selectedTech.lastActivityDesc}</p>
                    )}
                  </div>
                </motion.section>
              </>
            )}
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Vista EXPORTACIONES - CON BOTONES DE DESCARGA GRANDES
// ---------------------------------------------------------------------------

const ExportsView = ({ tasks }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [exportPage, setExportPage] = useState(0);
  const exportsPerPage = 8;
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Tareas completadas (exportables)
  const exportableTasks = useMemo(() => {
    return tasks
      .filter((t: any) => t.status === "Completed")
      .map((t: any) => ({
        ...t,
        exportDate: t.updated_at || t.created_at,
        hours: (t.normal_hours || 0) + (t.overtime_hours || 0),
      }));
  }, [tasks]);

  // Filtrar por búsqueda
  const filteredTasks = useMemo(() => {
    return exportableTasks.filter((t: any) => {
      const matchesSearch = !searchQuery || 
        (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.projectName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.clientName || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [exportableTasks, searchQuery]);

  // Métricas
  const metrics = useMemo(() => {
    const totalExportables = exportableTasks.length;
    const totalHoras = exportableTasks.reduce((s: number, t: any) => s + t.hours, 0);
    const promedioHoras = totalExportables > 0 ? totalHoras / totalExportables : 0;
    const totalTareas = tasks.length;
    const porcentajeCompletado = totalTareas > 0 ? Math.round((totalExportables / totalTareas) * 100) : 0;
    
    return { totalExportables, totalHoras, promedioHoras, totalTareas, porcentajeCompletado };
  }, [exportableTasks, tasks]);

  // Paginación
  const totalPages = Math.ceil(filteredTasks.length / exportsPerPage);
  const visibleTasks = filteredTasks.slice(exportPage * exportsPerPage, (exportPage + 1) * exportsPerPage);

  const handlePrevPage = () => {
    setSlideDirection('left');
    setExportPage((p) => (p - 1 + totalPages) % totalPages);
  };

  const handleNextPage = () => {
    setSlideDirection('right');
    setExportPage((p) => (p + 1) % totalPages);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { delay: 0.05, icon: CheckCircle, bg: HORMI_BLUE_BG, color: HORMI_BLUE, label: "Exportables", value: metrics.totalExportables, sub: "tareas completadas" },
          { delay: 0.1, icon: Clock, bg: '#10b98115', color: '#10b981', label: "Horas Totales", value: `${metrics.totalHoras.toFixed(0)}h`, sub: "horas exportables" },
          { delay: 0.15, icon: TrendingUp, bg: '#f59e0b15', color: '#f59e0b', label: "Promedio", value: `${metrics.promedioHoras.toFixed(1)}h`, sub: "horas por tarea" },
          { delay: 0.2, icon: BarChart3, bg: '#8b5cf615', color: '#8b5cf6', label: "Completitud", value: `${metrics.porcentajeCompletado}%`, sub: `de ${metrics.totalTareas} tareas` },
        ].map((metric, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 30, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: metric.delay, duration: 0.4, type: "spring" }}
            whileHover={{ y: -4, scale: 1.03 }}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <div className="flex items-center gap-2 mb-2 relative">
              <motion.div 
                className="p-1.5 rounded-lg" 
                style={{ backgroundColor: metric.bg }}
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: i * 0.5 }}
              >
                <metric.icon className="h-3.5 w-3.5" style={{ color: metric.color }} />
              </motion.div>
              <span className="text-[11px] text-muted-foreground">{metric.label}</span>
            </div>
            <motion.p 
              className="text-2xl font-bold tracking-tight text-foreground relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: metric.delay + 0.1 }}
            >
              {metric.value}
            </motion.p>
            <p className="text-[10px] text-muted-foreground mt-1 relative">{metric.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* BOTONES GRANDES DE DESCARGA + BUSCADOR */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-3"
      >
        {/* Dos botones grandes */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#0DA2E7]/30 bg-[#0DA2E7]/5 p-5 cursor-pointer group hover:border-[#0DA2E7]/60 hover:bg-[#0DA2E7]/10 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#0DA2E7]/10 to-transparent rounded-bl-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#0DA2E7]/20 group-hover:bg-[#0DA2E7]/30 transition-all">
                <Download className="h-7 w-7" style={{ color: HORMI_BLUE }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Exportar Excel</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredTasks.length} tareas · {metrics.totalHoras.toFixed(1)}h · Formato .xlsx
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-red-300/40 bg-red-50/30 p-5 cursor-pointer group hover:border-red-400/60 hover:bg-red-50/50 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100/50 group-hover:bg-red-100 transition-all">
                <Download className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Exportar PDF</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredTasks.length} tareas · {metrics.totalHoras.toFixed(1)}h · Formato .pdf
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Buscador */}
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción, proyecto o cliente..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setExportPage(0); }}
              className="pl-9 h-9 text-xs bg-background focus:border-[#0DA2E7]/30 transition-all duration-300"
            />
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* LISTA DE TAREAS EXPORTABLES */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <motion.h4 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Tareas Exportables {filteredTasks.length > 0 && `(${filteredTasks.length})`}
          </motion.h4>
          
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1"
          >
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" 
                onClick={handlePrevPage} 
                disabled={totalPages <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <span className="text-xs text-muted-foreground min-w-[45px] text-center tabular-nums font-medium">
              {totalPages > 0 ? `${exportPage + 1} / ${totalPages}` : '0 / 0'}
            </span>
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-border hover:bg-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 transition-all duration-300" 
                onClick={handleNextPage} 
                disabled={totalPages <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {visibleTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-16 rounded-xl border border-border bg-card"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? "No se encontraron tareas" : "No hay tareas exportables"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Completa tareas para verlas aquí
            </p>
          </motion.div>
        ) : (
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div 
                key={exportPage} 
                custom={slideDirection} 
                initial={{ opacity: 0, x: slideDirection === 'right' ? 80 : -80 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: slideDirection === 'right' ? -80 : 80 }} 
                transition={{ duration: 0.4, ease: "easeInOut" }} 
                className="space-y-2"
              >
                {visibleTasks.map((task: any, idx: number) => (
                  <motion.div 
                    key={task.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    whileHover={{ x: 3 }}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0DA2E7]/30 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <motion.div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: HORMI_BLUE_BG }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: idx * 0.3 }}
                    >
                      <CheckCircle className="h-4 w-4" style={{ color: HORMI_BLUE }} />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">
                        {task.description || "Sin descripción"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                        {task.projectName && (
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {task.projectName}
                          </span>
                        )}
                        {task.clientName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {task.clientName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{task.hours.toFixed(1)}h</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.exportDate ? format(new Date(task.exportDate), "dd/MM/yy") : "Sin fecha"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        {/* DOTS DE PAGINACIÓN */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 mt-4"
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <motion.button 
                key={i} 
                onClick={() => { setSlideDirection(i > exportPage ? 'right' : 'left'); setExportPage(i); }} 
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === exportPage ? '24px' : '6px',
                  backgroundColor: i === exportPage ? HORMI_BLUE : '#d1d5db',
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ActivityFeedMG({
  tasks, projects, clients, technicians, hoursByClient,
  projectStatus, monthTasks, metrics, technicianPerformance,
  onViewClient, onViewTechnician, onViewAllClients, onViewAllTechnicians,
}: ActivityFeedMGProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>("resumen");
  const [tasksModalOpen, setTasksModalOpen] = useState(false);

  const typeButtons: { value: ActivityType; label: string; icon: any }[] = [
    { value: "resumen", label: "Resumen", icon: Activity },
    { value: "clients", label: "Clientes", icon: Building2 },
    { value: "projects", label: "Proyectos", icon: FolderKanban },
    { value: "tasks", label: "Tareas", icon: CheckSquare },
    { value: "team", label: "Equipo", icon: Users },
    { value: "exports", label: "Exportaciones", icon: Download },
  ];

  const renderContent = () => {
    switch (selectedType) {
      case "resumen": return <ResumenView hoursByClient={hoursByClient} projectStatus={projectStatus} technicianPerformance={technicianPerformance} monthTasks={monthTasks} metrics={metrics} technicians={technicians} tasks={tasks} onViewTechnician={onViewTechnician} onViewAllTechnicians={onViewAllTechnicians} onViewClient={onViewClient} onViewAllClients={onViewAllClients} />;
      case "tasks": return <TasksView metrics={metrics} monthTasks={monthTasks} onAmpliar={() => setTasksModalOpen(true)} technicians={technicians} projects={projects} clients={clients} />;
      case "projects": return <ProjectsView projectStatus={projectStatus} tasks={tasks} technicians={technicians} />;
      case "clients": return <ClientsView hoursByClient={hoursByClient} onViewClient={onViewClient} onViewAllClients={onViewAllClients} clients={clients} projects={projects} tasks={tasks} />;
      case "team": return <TeamView technicians={technicians} monthTasks={monthTasks} projectStatus={projectStatus} tasks={tasks} onViewTechnician={onViewTechnician} />;
      case "exports": return <ExportsView tasks={tasks} />;
      default: return null;
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col mb-6" style={{ minHeight: "500px" }}>
        <div className="p-4 border-b border-border shrink-0 bg-gradient-to-r from-card to-muted/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Centro de Actividad</h3></div>
            <button onClick={() => setIsModalOpen(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Maximize2 className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeButtons.map((btn) => (
              <button key={btn.value} onClick={() => setSelectedType(btn.value)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedType === btn.value ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}>
                <btn.icon className="h-3 w-3" />{btn.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={selectedType} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] bg-card border-border flex flex-col p-0 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /><h2 className="text-2xl font-bold text-foreground">Centro de Actividad</h2></div><button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button></div>
              <div className="flex items-center gap-1.5 flex-wrap mt-4">
                {typeButtons.map((btn) => (<button key={btn.value} onClick={() => setSelectedType(btn.value)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedType === btn.value ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}><btn.icon className="h-3 w-3" />{btn.label}</button>))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait"><motion.div key={selectedType} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div></AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tasksModalOpen} onOpenChange={setTasksModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0"><DialogTitle className="text-lg font-bold">Tareas del Mes</DialogTitle><DialogDescription className="text-xs">{monthTasks.length} tareas · {format(new Date(), "MMMM yyyy")}</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {(() => {
              const groups: Record<string, any[]> = {};
              monthTasks.forEach((task: any) => {
                const date = new Date(task.created_at);
                const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
                let key = "";
                if (date.toDateString() === today.toDateString()) key = "HOY";
                else if (date.toDateString() === yesterday.toDateString()) key = "AYER";
                else key = format(date, "dd 'de' MMMM", { locale: es }).toUpperCase();
                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
              });
              return Object.entries(groups).map(([date, items]) => (
                <div key={date}><div className="flex items-center gap-2 mb-3"><Calendar className="h-3.5 w-3.5" style={{ color: HORMI_BLUE }} /><h4 className="text-xs font-bold uppercase" style={{ color: HORMI_BLUE }}>{date}</h4><div className="flex-1 h-px" style={{ backgroundColor: HORMI_BLUE + '30' }} /></div>
                  <div className="space-y-2">{items.map((task: any) => { const badge = getTaskStatusBadge(task.status); const Icon = badge.icon; return (<div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20"><div className={`p-1.5 rounded-md ${badge.className.split(" ")[0]}`}><Icon className={`h-4 w-4 ${badge.className.split(" ")[1]}`} /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{task.description || "Sin descripción"}</p><Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge></div><p className="text-[11px] text-muted-foreground">{task.projectName} · {task.clientName}</p></div><span className="text-xs font-semibold">{task.hours.toFixed(1)}h</span></div>); })}</div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}