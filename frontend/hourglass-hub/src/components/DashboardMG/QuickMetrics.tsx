import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Target,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface QuickMetricsProps {
  tasks: any[];
  projects: any[];
  technicians: any[];
}

export function QuickMetrics({ tasks, projects, technicians }: QuickMetricsProps) {
  // ============================================
  // CÁLCULOS
  // ============================================

  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t: any) => t.status === "Completed").length;
  const efficiency = Math.round((completedTasks / totalTasks) * 100);

  const totalHours = tasks.reduce((acc, t) => {
    const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
    return acc + h;
  }, 0);
  const avgTime = totalTasks > 0 ? totalHours / totalTasks : 0;

  const delayedProjects = projects.filter((p: any) => {
    if (!p.end_date) return false;
    const endDate = new Date(p.end_date);
    const today = new Date();
    const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
    const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
    return endDate < today && progress < 100;
  });
  const projectsOnTime = Math.round(((projects.length - delayedProjects.length) / (projects.length || 1)) * 100);

  const activeTechs = new Set(tasks.map((t: any) => t.technician_id).filter(Boolean));
  const tasksPerTech = activeTechs.size > 0 ? Math.round(totalTasks / activeTechs.size) : 0;

  // ============================================
  // DATOS
  // ============================================

  const metrics = [
    {
      id: "efficiency",
      icon: Target,
      label: "Eficiencia del equipo",
      value: `${efficiency}%`,
      color: "#10b981",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      trend: efficiency >= 70 ? { value: 12, positive: true } : { value: 5, positive: false },
    },
    {
      id: "avgTime",
      icon: Clock,
      label: "Tiempo promedio por tarea",
      value: `${avgTime.toFixed(1)}h`,
      color: "#3b82f6",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      trend: avgTime > 0 ? { value: 8, positive: true } : undefined,
    },
    {
      id: "projectsOnTime",
      icon: CheckCircle,
      label: "Proyectos a tiempo",
      value: `${projectsOnTime}%`,
      color: "#8b5cf6",
      bg: "bg-purple-50 dark:bg-purple-950/20",
      trend: projectsOnTime >= 80 ? { value: 15, positive: true } : { value: 10, positive: false },
    },
    {
      id: "tasksPerTech",
      icon: Users,
      label: "Tareas por técnico",
      value: `${tasksPerTech}`,
      color: "#f59e0b",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      trend: tasksPerTech > 5 ? { value: 20, positive: true } : { value: 5, positive: false },
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend?.positive ? TrendingUp : TrendingDown;

        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative overflow-hidden rounded-xl border border-border/40 bg-white dark:bg-card p-4 shadow-sm hover:shadow-lg hover:border-[#0DA2E7]/30 transition-all duration-300"
          >
            {/* Círculo decorativo de fondo */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.04] transition-transform duration-500 group-hover:scale-150" />

            <div className="relative flex items-start justify-between">
              {/* Lado izquierdo: valor + etiqueta */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {metric.label}
                </p>
                {metric.trend && (
                  <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${
                    metric.trend.positive ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {metric.trend.positive ? "+" : ""}{metric.trend.value}%
                  </div>
                )}
              </div>

              {/* Lado derecho: icono con fondo */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
                <Icon className="h-5 w-5 text-[#0DA2E7]" />
              </div>
            </div>

            {/* Línea decorativa inferior animada */}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7]" />
          </motion.div>
        );
      })}
    </div>
  );
}