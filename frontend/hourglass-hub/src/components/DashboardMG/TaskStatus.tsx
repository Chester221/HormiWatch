import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Activity,
  Clock,
  XCircle,
  PieChart,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Task } from "@/hooks/useTasks";

interface TaskStatusProps {
  tasks: Task[];
}

interface StatusMeta {
  key: string;
  status: Task["status"];
  label: string;
  color: string;
  icon: LucideIcon;
  query: string;
}

const STATUS_META: StatusMeta[] = [
  { key: "completed", status: "Completed", label: "Completadas", color: "#10b981", icon: CheckCircle, query: "completed" },
  { key: "inProgress", status: "InProgress", label: "En Progreso", color: "#0DA2E7", icon: Activity, query: "in-progress" },
  { key: "pending", status: "Pending", label: "Pendientes", color: "#f59e0b", icon: Clock, query: "pending" },
  { key: "cancelled", status: "Cancelled", label: "Eliminadas", color: "#ef4444", icon: XCircle, query: "cancelled" },
];

interface ChartDatum {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface SegmentProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}

const ActiveSector = (props: SegmentProps) => (
  <Sector
    cx={props.cx}
    cy={props.cy}
    innerRadius={props.innerRadius}
    outerRadius={(props.outerRadius ?? 0) + 9}
    startAngle={props.startAngle}
    endAngle={props.endAngle}
    cornerRadius={7}
    fill={props.fill}
    style={{ stroke: "rgba(255,255,255,0.8)", strokeWidth: 1.5, filter: "drop-shadow(0 0 10px rgba(13,162,231,0.45))" }}
  />
);

function StatusRow({
  label,
  icon: Icon,
  color,
  count,
  percentage,
  onClick,
  delay,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  count: number;
  percentage: number;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-border/40 hover:bg-muted/10"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="ml-11 mt-2 h-1.5 overflow-hidden rounded-full bg-muted/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.15, duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: "inset 0 0 0 1px rgba(17,24,39,0.5)" }}
        />
      </div>
    </motion.div>
  );
}

export function TaskStatus({ tasks }: TaskStatusProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const total = tasks.length;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const meta of STATUS_META) map[meta.status] = 0;
    for (const t of tasks) {
      if (t.status && map[t.status] !== undefined) map[t.status] += 1;
    }
    return map;
  }, [tasks]);

  const chartData: ChartDatum[] = STATUS_META.map((meta) => ({
    name: meta.label,
    value: counts[meta.status] ?? 0,
    color: meta.color,
    percentage: total > 0 ? Math.round(((counts[meta.status] ?? 0) / total) * 100) : 0,
  }));

  const completionRate = total > 0 ? Math.round(((counts.Completed ?? 0) / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm dark:bg-card">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm shadow-[#0DA2E7]/30">
            <PieChart className="h-7 w-7 text-white" />
          </div>
          <p className="text-base font-semibold text-foreground">Sin tareas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay tareas para mostrar en el gráfico
          </p>
          <Badge variant="outline" className="mt-3 gap-1.5 border-border/40 text-xs">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            Comienza a crear tareas
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      {/* Blob decorativo */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0DA2E7] opacity-[0.06] blur-2xl" />

      {/* HEADER */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] rounded-xl p-2 shadow-sm shadow-[#0DA2E7]/30">
            <PieChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Estado de Tareas
            </h3>
            <p className="text-xs text-muted-foreground">
              {total} tareas · {completionRate}% completadas
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer border-border/40 text-xs transition-colors hover:bg-muted/50"
          onClick={() => navigate("/tasks")}
        >
          Ver todas
          <ArrowRight className="ml-1 h-3 w-3" />
        </Badge>
      </div>

      {/* DONUT + LEYENDA */}
      <div className="relative flex flex-col items-center gap-4 sm:flex-row">
        {/* Donut */}
        <div className="relative h-[200px] w-[200px] flex-shrink-0">
          {/* Anillos decorativos tipo espiral */}
          <div
            className="absolute -inset-3 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, rgba(13,162,231,0.10), rgba(13,162,231,0.02), rgba(13,162,231,0.10))",
              filter: "blur(6px)",
            }}
          />
          <div className="absolute inset-0 rounded-full border border-dashed border-[#0DA2E7]/25">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-dotted border-[#0DA2E7]/20"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={2.5}
                cornerRadius={6}
                dataKey="value"
                activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                activeShape={ActiveSector}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="transparent"
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground tabular-nums">{total}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              tareas
            </span>
            {completionRate > 0 && (
              <span className="mt-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 tabular-nums">
                {completionRate}% ok
              </span>
            )}
          </div>
        </div>

        {/* Leyenda */}
        <div className="w-full flex-1 space-y-1">
          {STATUS_META.map((meta, idx) => (
            <StatusRow
              key={meta.key}
              label={meta.label}
              icon={meta.icon}
              color={meta.color}
              count={counts[meta.status] ?? 0}
              percentage={total > 0 ? Math.round(((counts[meta.status] ?? 0) / total) * 100) : 0}
              delay={idx * 0.05}
              onClick={() => navigate(`/tasks?status=${meta.query}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload?: ChartDatum }>;
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div
      className="min-w-[140px] rounded-xl border border-border/60 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm dark:bg-card/95"
      style={{ boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(17,24,39,0.12)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color, boxShadow: "inset 0 0 0 1px rgba(17,24,39,0.6)" }} />
        <p className="text-xs font-medium text-foreground">{data.name}</p>
      </div>
      <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums">
        {data.value}
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
          tareas
        </span>
      </p>
      <div className="mt-1.5 border-t border-border/40 pt-1.5">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {data.percentage}% del total
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-full rounded-full"
            style={{ width: `${data.percentage}%`, backgroundColor: data.color, boxShadow: "inset 0 0 0 1px rgba(17,24,39,0.4)" }}
          />
        </div>
      </div>
    </div>
  );
};
