import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Users,
  FolderKanban,
  Building2,
  Crown,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  DollarSign,
  Sparkles,
  User,
  Briefcase,
  FileSpreadsheet,
} from "lucide-react";
import { useProjectExport } from "@/hooks/useProjectExport";

const HORMI_BLUE = "#0DA2E7";
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

interface ProjectDetailModalProps {
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 🔥 Función para formatear progreso con 1 decimal si es menor a 10%
const formatProgress = (value: number): string => {
  if (value >= 10) return Math.round(value).toString();
  if (value < 1 && value > 0) return value.toFixed(1);
  if (value === 0) return '0';
  return value.toFixed(1);
};

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const { exportProjectReport } = useProjectExport();

  if (!project) return null;

  const statusInfo = {
    active: { label: "Activo", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    completed: { label: "Cerrado", class: "bg-gray-100 text-gray-600 border-gray-300" },
    "on-hold": { label: "En Pausa", class: "bg-amber-50 text-amber-700 border-amber-200" },
    "In Progress": { label: "En Progreso", class: "bg-blue-50 text-blue-700 border-blue-200" },
    default: { label: "Activo", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  const getStatusInfo = (status: string) => {
    return statusInfo[status] || statusInfo.default;
  };

  const status = getStatusInfo(project.status);

  // Calcular horas totales desde inicio hasta fin
  const calculateTotalHours = () => {
    if (!project.startDate || !project.endDate) return 0;
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(diffHours);
  };

  const totalProjectHours = calculateTotalHours() || project.hoursPool || 0;
  const consumedHours = project.hoursConsumed || 0;
  const progress = project.progress || 0;
  const hourlyRate = project.rate || project.hourly_rate || 0;
  const budget = hourlyRate * totalProjectHours;

  // 🔥 Función para formatear números con separador de miles
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[98vw] max-h-[92vh] overflow-hidden flex flex-col bg-card border-border p-0 rounded-2xl shadow-2xl">
        {/* HEADER */}
        <div className="relative p-6 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border flex-shrink-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          
          <div className="flex items-start justify-between relative">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/25">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3 flex-wrap">
                  {project.name}
                  <Badge className={`text-[10px] px-2 py-0 font-medium shrink-0 ${status.class}`}>
                    {status.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{project.client || "Sin cliente"}</span>
                  </span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {new Date(project.endDate || project.end_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* 🔥 BOTONES DE ACCIÓN EN EL HEADER */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Exportar Reporte */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all gap-1.5"
                onClick={() => exportProjectReport(project)}
                title="Exportar reporte del proyecto"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Exportar</span>
              </Button>

              {/* Cerrar */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted/50 shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* TABS - VERSIÓN MANUAL (FUNCIONAL) */}
        {/* ═══════════════════════════════════════ */}
        <div className="px-6 pt-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={cn(
                "flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer",
                "hover:bg-muted/50 hover:text-foreground",
                "flex items-center justify-center gap-1.5",
                activeTab === 'info'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" />
              Tareas
              {project.totalTasks > 0 && (
                <Badge className="ml-1.5 bg-[#0DA2E7]/10 text-[#0DA2E7] text-[9px] px-1.5 py-0 border-none">
                  {project.totalTasks}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Users className="h-3.5 w-3.5 inline mr-1.5" />
              Equipo
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* CONTENT - RENDERIZADO CONDICIONAL */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "info" && (
                <ProjectInfoTab 
                  project={project} 
                  totalProjectHours={totalProjectHours} 
                  budget={budget}
                  formatNumber={formatNumber}
                />
              )}
              {activeTab === "tasks" && <ProjectTasksTab project={project} />}
              {activeTab === "team" && <ProjectTeamTab project={project} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: INFORMACIÓN
// ═══════════════════════════════════════════════════════
function ProjectInfoTab({ project, totalProjectHours, budget, formatNumber }: any) {
  const progress = project.progress || 0;
  const consumedHours = project.hoursConsumed || 0;
  const hourlyRate = project.rate || project.hourly_rate || 0;

  // 🔥 Formatear progreso con 1 decimal si es menor a 10%
  const formatProgress = (value: number): string => {
    if (value >= 10) return Math.round(value).toString();
    if (value < 1 && value > 0) return value.toFixed(1);
    if (value === 0) return '0';
    return value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progreso del proyecto</span>
          <span className="text-lg font-bold text-[#0DA2E7]">{formatProgress(progress)}%</span>
        </div>
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7]"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/50 mt-1">
          <span>0%</span>
          <span>{formatProgress(progress)}% completado</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Horas */}
        <div className="rounded-xl border border-border/50 bg-muted/5 p-4 text-center hover:border-[#0DA2E7]/20 transition-colors">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-[#0DA2E7]" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{consumedHours.toFixed(0)}h</p>
          <p className="text-sm text-muted-foreground">de {formatNumber(totalProjectHours || project.hoursPool || 0)}h</p>
          <p className="text-xs text-muted-foreground/50 mt-1">{formatProgress(progress)}% completado</p>
        </div>

        {/* Miembros */}
        <div className="rounded-xl border border-border/50 bg-muted/5 p-4 text-center hover:border-[#0DA2E7]/20 transition-colors">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-5 w-5 text-[#0DA2E7]" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Miembros</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{(project.team?.length || 0) + (project.teamLead?.id ? 1 : 0)}</p>
          <p className="text-sm text-muted-foreground">técnicos: {project.team?.length || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Líder: {project.teamLead?.name || "Sin asignar"}</p>
        </div>

        {/* Tarifa */}
        <div className="rounded-xl border border-border/50 bg-muted/5 p-4 text-center hover:border-[#0DA2E7]/20 transition-colors">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-[#0DA2E7]" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarifa</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${hourlyRate}</p>
          <p className="text-sm text-muted-foreground">por hora</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Presupuesto: ${formatNumber(Math.round(budget))}</p>
        </div>

        {/* Línea de tiempo */}
        <div className="rounded-xl border border-border/50 bg-muted/5 p-4 text-center hover:border-[#0DA2E7]/20 transition-colors">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-[#0DA2E7]" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Línea de tiempo</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {project.startDate ? new Date(project.startDate).toLocaleDateString("es-ES", { month: "short", day: "numeric" }) : "..."}
            <span className="text-muted-foreground mx-1">→</span>
            {project.endDate ? new Date(project.endDate).toLocaleDateString("es-ES", { month: "short", day: "numeric" }) : "..."}
          </p>
          <p className="text-sm text-muted-foreground">{formatNumber(totalProjectHours)}h totales</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {project.startDate ? new Date(project.startDate).toLocaleDateString("es-ES", { month: "long", day: "numeric", year: "numeric" }) : "..."}
          </p>
        </div>
      </div>

      {/* Descripción */}
      {project.description && (
        <div className="rounded-xl border border-border/50 p-4 bg-muted/5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: TAREAS
// ═══════════════════════════════════════════════════════
function ProjectTasksTab({ project }: { project: any }) {

  const tasks = project.tasks || [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0DA2E7]/5">
          <CheckCircle className="h-8 w-8 text-[#0DA2E7]/30" />
        </div>
        <p className="text-sm font-medium text-foreground mt-4">No hay tareas</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {project?.tasks !== undefined 
            ? `Tareas encontradas: ${project.tasks.length}` 
            : 'No se cargaron las tareas'}
        </p>
      </div>
    );
  }

  const completed = tasks.filter((t: any) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t: any) => t.status === 'In Progress').length;
  const pending = tasks.length - completed - inProgress;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {completed} completadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {inProgress} en progreso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {pending} pendientes
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task: any, idx: number) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-[#0DA2E7]/20 hover:bg-muted/5 transition-all duration-200 group"
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
              task.status === 'Completed' ? "bg-emerald-500/10" :
              task.status === 'In Progress' ? "bg-blue-500/10" :
              "bg-amber-500/10"
            )}>
              {task.status === 'Completed' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : task.status === 'In Progress' ? (
                <Clock className="h-4 w-4 text-blue-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">
                {task.description || task.title || "Tarea sin descripción"}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {task.start_time && (
                  <span>{new Date(task.start_time).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}</span>
                )}
                {task.duration_in_minutes && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {Math.round(task.duration_in_minutes / 60)}h
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[8px] px-1.5 py-0 shrink-0",
                task.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                task.status === 'In Progress' ? "bg-blue-50 text-blue-600 border-blue-200" :
                "bg-amber-50 text-amber-600 border-amber-200"
              )}
            >
              {task.status === 'Completed' ? "Completada" :
               task.status === 'In Progress' ? "En progreso" : "Pendiente"}
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB: EQUIPO
// ═══════════════════════════════════════════════════════
function ProjectTeamTab({ project }: { project: any }) {
  const leader = project.teamLead;
  const team = project.team || [];

  if (!leader?.id && team.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0DA2E7]/5">
          <Users className="h-8 w-8 text-[#0DA2E7]/30" />
        </div>
        <p className="text-sm font-medium text-foreground mt-4">No hay miembros</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Asigna miembros desde la página de equipo</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {leader?.id && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            Líder del proyecto
          </h4>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200/30 bg-gradient-to-r from-amber-50/20 to-transparent">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-amber-400/30">
                <AvatarImage src={leader.avatar} />
                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-sm">
                  {leader.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{leader.name}</p>
              <p className="text-xs text-muted-foreground">Líder del proyecto</p>
            </div>
          </div>
        </div>
      )}

      {team.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Miembros del equipo ({team.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {team.map((member: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/40 hover:border-[#0DA2E7]/20 hover:bg-muted/5 transition-all duration-200 group"
              >
                <Avatar className="h-8 w-8 ring-1 ring-border group-hover:ring-[#0DA2E7]/30 transition-all">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-muted/50 text-muted-foreground text-[9px] font-medium">
                    {member.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-[#0DA2E7] transition-colors">
                    {member.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 truncate">{member.role || "Miembro"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}