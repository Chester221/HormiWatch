import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { taskDate, taskHours, safeParseDate } from "@/lib/dashboardUtils";

interface QuickMetricsProps {
  tasks: any[];
  projects: any[];
  technicians: any[];
}

const withinPeriod = (date: Date | null, start: Date, end?: Date) => {
  if (!date) return false;
  const d = date.getTime();
  if (end) return d >= start.getTime() && d < end.getTime();
  return d >= start.getTime();
};

export function QuickMetrics({ tasks, projects }: QuickMetricsProps) {
  const { efficiency, avgTime, projectsOnTime, tasksPerTech } = useMemo(() => {
    const totalTasks = tasks.length || 1;
    const completedTasks = tasks.filter((t: any) => t.status === "Completed").length;
    const efficiency = Math.round((completedTasks / totalTasks) * 100);

    const totalHours = tasks.reduce((acc, t) => acc + taskHours(t), 0);
    const avgTime = totalTasks > 0 ? totalHours / totalTasks : 0;

    const delayedProjects = projects.filter((p: any) => {
      if (!p.end_date) return false;
      const endDate = safeParseDate(p.end_date);
      if (!endDate) return false;
      const today = new Date();
      const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
      const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      return endDate < today && progress < 100;
    });
    const projectsOnTime = Math.round(((projects.length - delayedProjects.length) / (projects.length || 1)) * 100);

    const activeTechs = new Set(tasks.map((t: any) => t.technician_id).filter(Boolean));
    const tasksPerTech = activeTechs.size > 0 ? Math.round(totalTasks / activeTechs.size) : 0;

    return { efficiency, avgTime, projectsOnTime, tasksPerTech };
  }, [tasks, projects]);

  const realTrends = useMemo(() => {
    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(periodStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    const lastTasks = tasks.filter((t: any) => withinPeriod(taskDate(t), periodStart));
    const prevTasks = tasks.filter((t: any) => withinPeriod(taskDate(t), prevStart, periodStart));

    const rate = (list: any[]) => {
      if (list.length === 0) return 0;
      return (list.filter((t: any) => t.status === "Completed").length / list.length) * 100;
    };
    const lastRate = rate(lastTasks);
    const prevRate = rate(prevTasks);
    const efficiencyTrend =
      (prevRate > 0
        ? Math.round(((lastRate - prevRate) / prevRate) * 100)
        : lastRate > 0
        ? 100
        : 0);

    return {
      efficiency: Math.abs(efficiencyTrend) > 0
        ? { value: Math.abs(efficiencyTrend), positive: efficiencyTrend >= 0 }
        : undefined,
    };
  }, [tasks]);

  const metrics = [
    {
      id: "efficiency",
      icon: Target,
      label: "Eficiencia del equipo",
      value: `${efficiency}%`,
      color: "#10b981",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      trend: realTrends.efficiency,
    },
    {
      id: "avgTime",
      icon: Clock,
      label: "Tiempo promedio por tarea",
      value: `${avgTime.toFixed(1)}h`,
      color: "#3b82f6",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      id: "projectsOnTime",
      icon: CheckCircle,
      label: "Proyectos a tiempo",
      value: `${projectsOnTime}%`,
      color: "#8b5cf6",
      bg: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      id: "tasksPerTech",
      icon: Users,
      label: "Tareas por técnico",
      value: `${tasksPerTech}`,
      color: "#f59e0b",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      trend: realTrends.tasksPerTech,
    },
  ];

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
            <div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full transition-transform duration-500 group-hover:scale-150"
              style={{ backgroundColor: metric.color, opacity: 0.05 }}
            />

            <div className="relative flex items-start justify-between">
              {/* Lado izquierdo: valor + etiqueta */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
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

              {/* Lado derecho: icono con fondo del color de la métrica */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.bg} transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}
              >
                <Icon className="h-5 w-5" style={{ color: metric.color }} />
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