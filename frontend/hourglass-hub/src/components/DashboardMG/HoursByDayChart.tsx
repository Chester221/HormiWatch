import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarCheck2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isWithinInterval,
  isToday,
  getWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { taskDate, taskHours } from "@/lib/dashboardUtils";
import type { Task } from "@/hooks/useTasks";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface HoursByDayChartProps {
  tasks: Task[];
}

export function HoursByDayChart({ tasks }: HoursByDayChartProps) {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(today, { weekStartsOn: 1 }),
  );

  const data = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

    return days.map((day) => {
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);

      const dayTasks = tasks.filter((t) => {
        if (t.status !== "Completed") return false;
        const date = taskDate(t);
        return date ? isWithinInterval(date, { start, end }) : false;
      });

      const hours = dayTasks.reduce((acc, t) => acc + taskHours(t), 0);
      const count = dayTasks.length;

      return {
        label: DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1],
        hours: Math.round(hours * 10) / 10,
        count,
        date: day,
        isCurrentDay: isToday(day),
        fullDate: format(day, "dd/MM", { locale: es }),
      };
    });
  }, [tasks, currentWeekStart]);

  const totalHours = useMemo(() => data.reduce((a, d) => a + d.hours, 0), [data]);
  const avgHours = data.length > 0 ? totalHours / data.length : 0;
  const maxHours = data.length > 0 ? Math.max(...data.map((d) => d.hours)) : 0;
  const maxDay = data.find((d) => d.hours === maxHours);
  const domainMax = maxHours > 0 ? Math.ceil((maxHours * 1.3) / 10) * 10 : 10;
  const activeDays = data.filter((d) => d.hours > 0).length;

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });
  const dateRange = `${format(currentWeekStart, "dd/MM", { locale: es })} – ${format(weekEnd, "dd/MM", { locale: es })}`;
  const isCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }).toDateString() === currentWeekStart.toDateString();

  const goToPreviousWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload?: (typeof data)[number] }>;
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    return (
      <div
        className="min-w-[150px] rounded-xl border border-border/60 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm dark:bg-card/95"
        style={{ boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(17,24,39,0.12)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: d.isCurrentDay ? "#f59e0b" : "#0DA2E7", boxShadow: "inset 0 0 0 1px rgba(17,24,39,0.6)" }}
          />
          <span className="text-xs font-medium text-foreground">{d.label}</span>
          {d.isCurrentDay && (
            <span className="ml-auto rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-600">
              Hoy
            </span>
          )}
        </div>
        <p className="mt-1.5 text-lg font-bold text-foreground tabular-nums">
          {d.hours}h
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          {d.count} {d.count === 1 ? "tarea" : "tareas"} completadas
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/70 tabular-nums">
          {d.fullDate}
        </p>
      </div>
    );
  };

  const getBarFill = (isCurrentDay: boolean, hours: number) => {
    if (isCurrentDay) return "#f59e0b";
    if (hours <= 0) return "#94a3b8";
    return "#0DA2E7";
  };

  interface BarLabelProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    value?: number | string;
    index?: number;
  }

  const renderBarLabel = (props: BarLabelProps) => {
    const { x = 0, y = 0, width = 0, value, index = 0 } = props;
    const height = props.height ?? 0;
    if (Number(value) <= 0 || !height || height < 10) return <g key={`vl-${index}`} />;
    return (
      <text
        key={`vl-${index}`}
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#64748b"
        className="tabular-nums"
      >
        {Number(value).toFixed(1)}
      </text>
    );
  };

  return (
    <Card className="relative overflow-hidden border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0DA2E7] opacity-[0.05] blur-2xl" />

      {/* HEADER */}
      <div className="relative mb-4 flex items-center gap-3">
        <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] rounded-xl p-2 shadow-sm shadow-[#0DA2E7]/30">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Horas por Día
          </h3>
          <p className="text-xs text-muted-foreground">
            Semana {weekNumber} · {dateRange}
          </p>
        </div>
        {!isCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-border/40 px-3 text-xs hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            onClick={goToCurrentWeek}
          >
            <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
            Actual
          </Button>
        )}
      </div>

      {/* NAV + GRÁFICO */}
      <div className="relative flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0 rounded-full border-border/40 transition-all hover:border-[#0DA2E7]/30 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
          onClick={goToPreviousWeek}
          title="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWeekStart.toISOString()}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-[260px] w-full"
            >
              {activeDays === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7]/10">
                    <Calendar className="h-7 w-7 text-[#0DA2E7]" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Sin actividad esta semana
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Navega a otra semana para ver horas
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <defs>
                      <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0DA2E7" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0DA2E7" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="barGradientAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#94a3b8"
                      strokeOpacity={0.15}
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                      axisLine={{ stroke: "#94a3b8", opacity: 0.4 }}
                      tickLine={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, domainMax]}
                      width={35}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ outline: "none" }}
                      cursor={{ fill: "rgba(13,162,231,0.06)" }}
                    />
                    <Bar
                      dataKey="hours"
                      radius={[7, 7, 2, 2]}
                      barSize={38}
                      stroke="transparent"
                      strokeWidth={0}
                      animationDuration={600}
                      animationEasing="ease-out"
                      label={renderBarLabel}
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#${entry.isCurrentDay ? "barGradientAmber" : "barGradientBlue"})`}
                          fillOpacity={entry.hours <= 0 ? 0.3 : 1}
                          style={{
                            filter: entry.isCurrentDay
                              ? "drop-shadow(0 0 10px rgba(245,158,11,0.4))"
                              : entry.hours > 0
                              ? "drop-shadow(0 0 6px rgba(13,162,231,0.25))"
                              : "none",
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0 rounded-full border-border/40 transition-all hover:border-[#0DA2E7]/30 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
          onClick={goToNextWeek}
          title="Semana siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* KPIs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWeekStart.toISOString()}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="relative mt-3 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <KpiChip
            value={`${totalHours.toFixed(1)}h`}
            label="Total"
          />
          <KpiChip
            value={`${avgHours.toFixed(1)}h`}
            label="Promedio"
          />
          {maxDay && (
            <KpiChip
              value={`${maxHours}h`}
              label={maxDay.label}
              accent
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* FOOTER */}
      <div className="relative mt-3 flex items-center justify-center gap-4 border-t border-border/20 pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#0DA2E7]" />
          Completadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
          Sin actividad
        </span>
      </div>
    </Card>
  );
}

function KpiChip({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${
        accent
          ? "border-[#0DA2E7]/20 bg-[#0DA2E7]/10 text-foreground"
          : "border-border/30 bg-muted/30 text-foreground"
      }`}
    >
      <span className={`font-bold tabular-nums ${accent ? "text-[#0DA2E7]" : ""}`}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
