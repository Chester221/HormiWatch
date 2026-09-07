import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckSquare,
  Users,
  Calendar,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectsAtRiskProps {
  projects: any[];
  tasks: any[];
  technicians?: any[];
}

export function ProjectsAtRisk({ projects, tasks, technicians = [] }: ProjectsAtRiskProps) {
  const navigate = useNavigate();

  // ============================================
  // CÁLCULO DE PROYECTOS EN RIESGO
  // ============================================

  const atRisk = projects
    .filter((p: any) => {
      if (!p.end_date || p.status === "Completed" || p.status === "Cancelled") return false;
      const endDate = new Date(p.end_date);
      const today = new Date();
      const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
      const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      return endDate < today && progress < 100;
    })
    .map((p: any) => {
      const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
      const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
      const total = projectTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const hours = projectTasks.reduce((acc, t) => {
        const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
        return acc + h;
      }, 0);
      const endDate = new Date(p.end_date);
      const today = new Date();
      const days = Math.max(0, Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
      const lead = technicians.find((t: any) => t.id === p.lead_id);

      return {
        ...p,
        completed,
        total,
        progress,
        hours,
        days,
        clientName: p.clients?.name || "Sin cliente",
        leadName: lead?.full_name || "Sin responsable",
      };
    })
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  // ============================================
  // GRAVEDAD
  // ============================================

  const getSeverity = (days: number) => {
    if (days > 5) return { label: "Crítico", color: "#ef4444", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800/40", text: "text-red-600 dark:text-red-400", icon: AlertCircle };
    if (days >= 2) return { label: "Urgente", color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800/40", text: "text-orange-600 dark:text-orange-400", icon: AlertTriangle };
    return { label: "Aviso", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle };
  };

  // ============================================
  // ESTADO VACÍO MEJORADO
  // ============================================

  if (atRisk.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-foreground">Proyectos en Riesgo</h3>
          <Badge variant="outline" className="text-[10px] ml-auto border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40">
            0
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-4"
          >
            <CheckSquare className="h-8 w-8 text-emerald-500" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-foreground"
          >
            Todo en orden
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mt-1"
          >
            No hay proyectos atrasados
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-none px-3 py-1.5 text-xs font-medium">
              ✅ Todos los proyectos a tiempo
            </Badge>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-semibold text-foreground">Proyectos en Riesgo</h3>
        <Badge variant="destructive" className="text-[10px] ml-auto">
          {atRisk.length}
        </Badge>
      </div>

      {/* LISTA DE PROYECTOS */}
      <div className="space-y-3">
        {atRisk.map((project: any, idx: number) => {
          const severity = getSeverity(project.days);
          const SeverityIcon = severity.icon;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => navigate(`/projects/${project.id}`)}
              className={`p-3 rounded-lg border ${severity.border} ${severity.bg} transition-all hover:shadow-md cursor-pointer group`}
            >
              {/* FILA SUPERIOR */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityIcon className={`h-3.5 w-3.5 ${severity.text} flex-shrink-0`} />
                    <p className="text-sm font-medium text-foreground truncate">
                      {project.name}
                    </p>
                    <Badge
                      className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${severity.bg} ${severity.text} border-none`}
                    >
                      {severity.label} · +{project.days}d
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {project.clientName}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.leadName}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Vence: {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-[#0DA2E7] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 ml-2" />
              </div>

              {/* MÉTRICAS */}
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {project.completed}/{project.total} tareas
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {project.hours.toFixed(1)}h
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className={`font-medium ${severity.text}`}>
                  {project.progress}% completado
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}