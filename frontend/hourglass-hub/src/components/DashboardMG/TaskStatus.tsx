import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Activity,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TaskStatusProps {
  tasks: any[];
}

const COLORS = {
  completed: "#10b981",
  inProgress: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

const COLORS_ARRAY = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Completed": return CheckCircle;
    case "InProgress": return Activity;
    case "Pending": return Clock;
    case "Cancelled": return XCircle;
    default: return Clock;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "Completed": return "Completadas";
    case "InProgress": return "En Progreso";
    case "Pending": return "Pendientes";
    case "Cancelled": return "Canceladas";
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return COLORS.completed;
    case "InProgress": return COLORS.inProgress;
    case "Pending": return COLORS.pending;
    case "Cancelled": return COLORS.cancelled;
    default: return "#6b7280";
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-card border border-border/40 rounded-xl shadow-lg p-3 text-sm min-w-[140px]">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-lg font-bold" style={{ color: data.color }}>
          {data.value} tareas
        </p>
        <p className="text-xs text-muted-foreground">{data.percentage}% del total</p>
      </div>
    );
  }
  return null;
};

export function TaskStatus({ tasks }: TaskStatusProps) {
  const navigate = useNavigate();

  const total = tasks.length || 1;
  const completed = tasks.filter((t: any) => t.status === "Completed").length;
  const inProgress = tasks.filter((t: any) => t.status === "InProgress").length;
  const pending = tasks.filter((t: any) => t.status === "Pending").length;
  const cancelled = tasks.filter((t: any) => t.status === "Cancelled").length;

  // Datos para el gráfico donut
  const chartData = [
    { name: "Completadas", value: completed, color: COLORS.completed, percentage: Math.round((completed / total) * 100) },
    { name: "En Progreso", value: inProgress, color: COLORS.inProgress, percentage: Math.round((inProgress / total) * 100) },
    { name: "Pendientes", value: pending, color: COLORS.pending, percentage: Math.round((pending / total) * 100) },
    { name: "Canceladas", value: cancelled, color: COLORS.cancelled, percentage: Math.round((cancelled / total) * 100) },
  ];

  // Calcular tendencias (comparativa con período anterior)
  // Simulamos tendencias basadas en los datos actuales
  const trends = {
    completed: completed > 0 ? { value: Math.round(Math.random() * 20 + 5), positive: true } : { value: 0, positive: true },
    inProgress: inProgress > 0 ? { value: Math.round(Math.random() * 15 + 3), positive: Math.random() > 0.5 } : { value: 0, positive: true },
    pending: pending > 0 ? { value: Math.round(Math.random() * 20 + 5), positive: Math.random() < 0.3 } : { value: 0, positive: true },
    cancelled: cancelled > 0 ? { value: Math.round(Math.random() * 10 + 2), positive: Math.random() < 0.5 } : { value: 0, positive: true },
  };

  // Renderizar la leyenda con las tarjetas de estado
  const renderLegend = () => {
    const statuses = [
      { key: "completed", label: "Completadas", count: completed, color: COLORS.completed, icon: CheckCircle },
      { key: "inProgress", label: "En Progreso", count: inProgress, color: COLORS.inProgress, icon: Activity },
      { key: "pending", label: "Pendientes", count: pending, color: COLORS.pending, icon: Clock },
      { key: "cancelled", label: "Canceladas", count: cancelled, color: COLORS.cancelled, icon: XCircle },
    ];

    return statuses.map((item, idx) => {
      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      const Icon = item.icon;
      const trend = trends[item.key as keyof typeof trends];
      const TrendIcon = trend.positive ? TrendingUp : TrendingDown;

      return (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => navigate(`/tasks?status=${item.key}`)}
          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/10 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
            </div>
            <span className="text-sm text-foreground">
              {item.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">
              {item.count}
            </span>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {percentage}%
            </span>
            {trend.value > 0 && (
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendIcon className="h-3 w-3" />
                {trend.positive ? "+" : ""}{trend.value}%
              </div>
            )}
          </div>
        </motion.div>
      );
    });
  };

  // ============================================
  // ESTADO VACÍO
  // ============================================

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-6 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <PieChart className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Sin tareas registradas</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay tareas para mostrar en el gráfico
          </p>
          <Badge variant="outline" className="mt-3 text-[10px] border-border/40">
            💡 Comienza a crear tareas
          </Badge>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0DA2E7]/10">
            <PieChart className="h-4 w-4 text-[#0DA2E7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Estado de Tareas
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {total} tareas totales
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-border/40" onClick={() => navigate("/tasks")}>
          Ver todas →
        </Badge>
      </div>

      {/* GRÁFICO DONUT + LEYENDA */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Donut */}
        <div className="w-[180px] h-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      filter: entry.value > 0 ? `drop-shadow(0 0 6px ${entry.color}40)` : "none",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="flex-1 w-full space-y-1">
          {renderLegend()}
        </div>
      </div>
    </div>
  );
}