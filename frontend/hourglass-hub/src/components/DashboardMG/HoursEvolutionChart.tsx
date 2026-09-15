import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  Maximize2,
  Trophy,
  CalendarX2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { taskDate, taskHours } from "@/lib/dashboardUtils";
import type { Task } from "@/hooks/useTasks";

interface HoursEvolutionChartProps {
  tasks: Task[];
}

interface TooltipData {
  label: string;
  month: number;
  year: number;
  hours: number;
  count: number;
  isCurrentMonth: boolean;
  fullLabel: string;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: TooltipData;
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-muted/5 px-3 py-2">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-base font-bold leading-tight text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function HoursEvolutionChart({ tasks }: HoursEvolutionChartProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
    const years = [];
    const startYear = 2026;
    for (let y = startYear; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const chartData = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    const months = eachMonthOfInterval({ start, end });

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthIndex = monthDate.getMonth();

      const monthTasks = tasks.filter((t) => {
        if (t.status !== "Completed") return false;
        const date = taskDate(t);
        return date ? isWithinInterval(date, { start: monthStart, end: monthEnd }) : false;
      });

      const hours = monthTasks.reduce((acc, t) => acc + taskHours(t), 0);
      const count = monthTasks.length;

      const isCurrentMonth =
        monthIndex === currentMonth && selectedYear === currentYear;

      return {
        label: MONTHS[monthIndex],
        month: monthIndex,
        year: selectedYear,
        hours: Math.round(hours * 10) / 10,
        count,
        isCurrentMonth,
        fullLabel: `${MONTHS[monthIndex]} ${selectedYear}`,
      };
    });
  }, [tasks, selectedYear, currentMonth, currentYear]);

  const totalHours = chartData.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = chartData.length > 0 ? totalHours / chartData.length : 0;
  const maxHours = chartData.length > 0 ? Math.max(...chartData.map(d => d.hours)) : 0;
  const maxMonthData = chartData.find(d => d.hours === maxHours);
  const maxMonth = maxMonthData?.label || "";
  const maxMonthHours = maxMonthData?.hours || 0;

  const prevYear = selectedYear - 1;
  const prevYearHours = useMemo(() => {
    const start = new Date(prevYear, 0, 1);
    const end = new Date(prevYear, 11, 31);
    return tasks
      .filter((t) => {
        if (t.status !== "Completed") return false;
        const date = taskDate(t);
        return date ? isWithinInterval(date, { start, end }) : false;
      })
      .reduce((acc, t) => acc + taskHours(t), 0);
  }, [tasks, prevYear]);

  const trend = useMemo(() => {
    if (totalHours <= 0 || prevYearHours <= 0) return null;
    const pct = ((totalHours - prevYearHours) / prevYearHours) * 100;
    return { pct, up: pct >= 0 };
  }, [totalHours, prevYearHours]);

  const activeMonths = chartData.filter(d => d.hours > 0).length;
  const domainMax = maxHours > 0 ? Math.ceil(maxHours * 1.25 / 10) * 10 : 50;

  const handleYearChange = (value: string) => setSelectedYear(parseInt(value));
  const goToPreviousYear = () => setSelectedYear(prev => Math.max(2026, prev - 1));
  const goToNextYear = () => setSelectedYear(prev => Math.min(currentYear + 1, prev + 1));
  const goToCurrentYear = () => setSelectedYear(currentYear);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload?: TooltipData }>;
  }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const diff = avgHours > 0 ? data.hours - avgHours : 0;
    const pctOfTotal = totalHours > 0 ? (data.hours / totalHours) * 100 : 0;

    return (
      <div className="min-w-[180px] rounded-xl border border-border/50 bg-white/95 shadow-xl backdrop-blur-sm dark:bg-card/95 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground">{data.fullLabel}</p>
          {data.isCurrentMonth && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
              Actual
            </span>
          )}
        </div>
        <p className="mt-1 text-2xl font-bold text-[#0DA2E7] tabular-nums">
          {data.hours.toFixed(1)}h
        </p>
        <p className="text-xs text-muted-foreground">{data.count} tareas completadas</p>
        <div className="mt-2 flex flex-col gap-1 border-t border-border/40 pt-2 text-[10px] font-medium">
          <span className="text-muted-foreground">{pctOfTotal.toFixed(1)}% del total del año</span>
          {avgHours > 0 && (
            diff >= 0 ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                +{diff.toFixed(1)}h vs promedio
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <TrendingDown className="h-3 w-3" />
                {diff.toFixed(1)}h vs promedio
              </span>
            )
          )}
        </div>
      </div>
    );
  };

  const stats = [
    {
      id: "total",
      icon: Clock,
      label: "Total",
      value: `${totalHours.toFixed(1)}h`,
      accent: "#0DA2E7",
    },
    {
      id: "average",
      icon: BarChart3,
      label: "Promedio",
      value: `${avgHours.toFixed(1)}h`,
      accent: "#64748b",
    },
    {
      id: "max",
      icon: Maximize2,
      label: "Máximo",
      value: `${maxHours.toFixed(1)}h`,
      accent: "#38bdf8",
    },
    {
      id: "peak",
      icon: Trophy,
      label: `Pico · ${maxMonth || "—"}`,
      value: `${maxMonthHours.toFixed(1)}h`,
      accent: "#f59e0b",
    },
  ];

  return (
    <Card className="relative p-5 border-border/40 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#0DA2E7] opacity-[0.04] blur-2xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] p-2 rounded-xl shadow-sm shadow-[#0DA2E7]/30">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Evolución de Horas Completadas
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribución mensual de horas trabajadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-md rounded-r-none border-border/40 transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
              onClick={goToPreviousYear}
              title="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={String(selectedYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[100px] rounded-none border-border/40 bg-muted/10 text-sm font-medium transition-colors hover:bg-muted/20">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-md rounded-l-none border-border/40 transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
              onClick={goToNextYear}
              title="Año siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-3 text-xs border-border/40 transition-colors ${
              selectedYear === currentYear
                ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20 hover:bg-[#0B8BC7]"
                : "hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            }`}
            onClick={goToCurrentYear}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Actual
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
          >
            <StatChip
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              accent={stat.accent}
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${selectedYear}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="h-[280px] w-full"
        >
          {totalHours > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0DA2E7" stopOpacity={0.32} />
                    <stop offset="60%" stopColor="#0DA2E7" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0DA2E7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lineEvolution" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0B8BC7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#94a3b8"
                  strokeOpacity={0.14}
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                    fontWeight: 600,
                  }}
                  axisLine={{ stroke: "#cbd5e1", opacity: 0.6 }}
                  tickLine={false}
                  interval={0}
                  padding={{ left: 20, right: 20 }}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, domainMax]}
                  width={45}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                  }
                />

                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 20 }}
                  cursor={{ stroke: "#94a3b8", strokeOpacity: 0.3, strokeDasharray: "4 4" }}
                />

                {selectedYear === currentYear && (
                  <ReferenceLine
                    x={MONTHS[currentMonth]}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.35}
                    strokeWidth={1.5}
                  />
                )}

                {avgHours > 0 && (
                  <ReferenceLine
                    y={avgHours}
                    stroke="#94a3b8"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                    label={{
                      value: `Promedio ${avgHours.toFixed(1)}h`,
                      position: "right",
                      fill: "#94a3b8",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="none"
                  fill="url(#colorEvolution)"
                  fillOpacity={1}
                  animationDuration={700}
                  animationEasing="ease-out"
                />

                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="url(#lineEvolution)"
                  strokeWidth={3}
                  animationDuration={700}
                  animationEasing="ease-out"
                  dot={(props: DotProps) => {
                    const { cx, cy, index, payload } = props;
                    const isCurrent = payload?.isCurrentMonth;
                    const isMax = (payload?.hours ?? 0) === maxHours && maxHours > 0;
                    const fill = isCurrent ? "#f59e0b" : "#0DA2E7";
                    const haloR = isCurrent ? 22 : isMax ? 20 : 0;
                    return (
                      <g key={`dot-${index}-${payload?.month}-${payload?.year}`}>
                        {haloR > 0 && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={haloR}
                            fill="none"
                            stroke={fill}
                            strokeWidth={2}
                            opacity={0.15}
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isCurrent ? 7 : isMax ? 6 : 4}
                          fill={fill}
                          stroke="white"
                          strokeWidth={2.5}
                          style={{
                            filter: isCurrent
                              ? "drop-shadow(0 0 10px rgba(245, 158, 11, 0.55))"
                              : isMax
                              ? "drop-shadow(0 0 10px rgba(13, 162, 231, 0.45))"
                              : "none",
                          }}
                        />
                      </g>
                    );
                  }}
                  activeDot={{
                    r: 8,
                    fill: "#0DA2E7",
                    strokeWidth: 2,
                    stroke: "white",
                    style: { filter: "drop-shadow(0 0 14px rgba(13, 162, 231, 0.5))" },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7]/10">
                <CalendarX2 className="h-7 w-7 text-[#0DA2E7]" />
              </div>
              <p className="text-sm font-semibold text-foreground">Sin horas registradas</p>
              <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                No hay tareas completadas en {selectedYear}. Cambia de año para ver otras métricas.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/20 pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-[#0DA2E7]" />
            Horas completadas
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            Mes en curso
          </span>
          {maxMonth && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[#0DA2E7]" />
              Pico: {maxMonth} ({maxMonthHours.toFixed(1)}h)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {trend && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                trend.up
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {trend.up ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.up ? "+" : ""}{Math.abs(trend.pct).toFixed(0)}% vs {prevYear}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {activeMonths} de 12 meses ·{" "}
            <span className="font-bold text-foreground tabular-nums">{totalHours.toFixed(1)}h</span>{" "}
            totales
          </span>
        </div>
      </div>
    </Card>
  );
}