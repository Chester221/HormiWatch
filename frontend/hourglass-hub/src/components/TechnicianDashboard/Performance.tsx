import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Target,
  CalendarDays,
  Timer,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { taskDate, taskHours } from "@/lib/dashboardUtils";
import { startOfMonth, subMonths, isWithinInterval, endOfMonth } from "date-fns";

interface PerformanceProps {
  tasks: any[];
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  delay,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  sub?: string;
  trend?: { value: number; positive: boolean };
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium ${
              trend.positive ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.positive ? "+" : ""}{trend.value}% vs mes anterior
            </div>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
          <Icon className="h-5 w-5 text-[#0DA2E7]" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

export function Performance({ tasks }: PerformanceProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const inPeriod = (t: any, start: Date, end: Date) => {
      const d = taskDate(t);
      return d ? isWithinInterval(d, { start, end }) : false;
    };

    const completed = tasks.filter((t: any) => t.status === "Completed");

    const thisMonthCompleted = completed.filter((t: any) => inPeriod(t, monthStart, monthEnd)).length;
    const lastMonthCompleted = completed.filter((t: any) => inPeriod(t, lastMonthStart, lastMonthEnd)).length;

    const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    const activeDays = new Set(
      tasks
        .filter((t: any) => inPeriod(t, monthStart, monthEnd))
        .map((t: any) => {
          const d = taskDate(t);
          return d ? d.toDateString() : null;
        })
        .filter(Boolean),
    ).size;

    const completedHours = completed.reduce((acc, t) => acc + taskHours(t), 0);
    const avgPerTask = completed.length > 0 ? completedHours / completed.length : 0;

    const completedTrend =
      lastMonthCompleted > 0
        ? Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)
        : thisMonthCompleted > 0
        ? 100
        : 0;

    return {
      thisMonthCompleted,
      completedTrend,
      completionRate,
      activeDays,
      avgPerTask,
    };
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <KpiCard
        icon={CheckCircle2}
        label="Completadas este mes"
        value={String(stats.thisMonthCompleted)}
        trend={{ value: stats.completedTrend, positive: stats.completedTrend >= 0 }}
        delay={0}
      />
      <KpiCard
        icon={Target}
        label="Tasa de completitud"
        value={`${stats.completionRate}%`}
        sub={`${tasks.length} tareas en total`}
        delay={0.05}
      />
      <KpiCard
        icon={CalendarDays}
        label="Días activos este mes"
        value={String(stats.activeDays)}
        sub={`${stats.thisMonthCompleted} tareas completadas`}
        delay={0.1}
      />
      <KpiCard
        icon={Timer}
        label="Promedio por tarea"
        value={`${stats.avgPerTask.toFixed(1)}h`}
        sub="Horas por tarea completada"
        delay={0.15}
      />
    </div>
  );
}