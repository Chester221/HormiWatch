import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Sparkles,
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

interface HoursByDayChartProps {
  tasks: any[];
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const calculateHours = (task: any) => {
  if (task.duration_in_minutes) return task.duration_in_minutes / 60;
  if (task.normal_hours) return task.normal_hours + (task.overtime_hours || 0);
  return 0;
};

export function HoursByDayChart({ tasks }: HoursByDayChartProps) {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(today, { weekStartsOn: 1 })
  );

  const data = useMemo(() => {
    const weekStart = currentWeekStart;
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dayTasks = tasks.filter((t: any) =>
        t.status === "Completed" &&
        isWithinInterval(new Date(t.start_time || t.created_at), {
          start: new Date(day.setHours(0, 0, 0, 0)),
          end: new Date(day.setHours(23, 59, 59, 999)),
        })
      );

      const hours = dayTasks.reduce((acc, t) => acc + calculateHours(t), 0);
      const count = dayTasks.length;
      const isCurrentDay = isToday(day);

      return {
        label: DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1],
        hours: Math.round(hours * 10) / 10,
        count,
        date: day,
        isCurrentDay,
        fullDate: format(day, "dd/MM", { locale: es }),
      };
    });
  }, [tasks, currentWeekStart]);

  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = data.length > 0 ? totalHours / data.length : 0;
  const maxHours = data.length > 0 ? Math.max(...data.map(d => d.hours)) : 0;
  const maxDay = data.find(d => d.hours === maxHours)?.label || "";
  const domainMax = maxHours > 0 ? Math.ceil(maxHours * 1.3 / 10) * 10 : 10;

  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
  const dateRange = `${format(weekStart, "dd/MM", { locale: es })} - ${format(weekEnd, "dd/MM/yyyy", { locale: es })}`;

  const goToPreviousWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isCurrentWeek = () => {
    const today = new Date();
    const currentWeek = startOfWeek(today, { weekStartsOn: 1 });
    return currentWeek.toDateString() === currentWeekStart.toDateString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-xl shadow-lg p-3 min-w-[140px]">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.label}
          </p>
          <p className="text-2xl font-bold text-[#0DA2E7] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.hours.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.count} tareas completadas
          </p>
          <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.fullDate}
          </p>
          {data.isCurrentDay && (
            <p className="text-[10px] text-amber-500 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ● Hoy
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getBarColor = (isCurrentDay: boolean, hours: number) => {
    if (isCurrentDay) return "#f59e0b";
    if (hours === 0) return "#e2e8f0";
    return "#0DA2E7";
  };

  return (
    <Card className="p-4 border-border/40 bg-white dark:bg-card shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-[#0DA2E7]/10">
          <Calendar className="h-5 w-5 text-[#0DA2E7]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Horas por Día
          </h3>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Semana {weekNumber} · {dateRange}
          </p>
        </div>
      </div>

      {/* ═══════ CONTROLES + GRÁFICO ═══════ */}
      <div className="relative flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border/40 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] hover:border-[#0DA2E7]/30 transition-all flex-shrink-0"
          onClick={goToPreviousWeek}
          title="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`chart-${currentWeekStart.toISOString()}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-[260px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0DA2E7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0DA2E7" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="barGradientToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#f0f0f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 12,
                      fill: "#64748b",
                      fontWeight: 500,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    padding={{ left: 10, right: 10 }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 12,
                      fill: "#64748b",
                      fontWeight: 500,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    domain={[0, domainMax]}
                    width={35}
                  />

                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />

                  <Bar
                    dataKey="hours"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.isCurrentDay, entry.hours)}
                        style={{
                          filter: entry.isCurrentDay
                            ? "drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))"
                            : entry.hours > 0
                            ? "drop-shadow(0 0 8px rgba(13, 162, 231, 0.2))"
                            : "none",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center mt-2">
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-3 text-xs border-border/40 transition-colors ${
                isCurrentWeek()
                  ? "bg-[#0DA2E7] text-white hover:bg-[#0B8BC7] shadow-sm shadow-[#0DA2E7]/20"
                  : "hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
              }`}
              onClick={goToCurrentWeek}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Semana actual
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border/40 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] hover:border-[#0DA2E7]/30 transition-all flex-shrink-0"
          onClick={goToNextWeek}
          title="Semana siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* ═══════ ESTADÍSTICAS CENTRADAS ═══════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`stats-${currentWeekStart.toISOString()}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground mt-3 bg-muted/5 rounded-lg px-4 py-1.5 border border-border/20"
        >
          <span className="flex items-center gap-2">
            <span className="font-bold text-foreground text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {totalHours.toFixed(1)}h
            </span>
            <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Total</span>
          </span>
          <span className="h-5 w-px bg-border/30" />
          <span className="flex items-center gap-2">
            <span className="font-bold text-foreground text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {avgHours.toFixed(1)}h
            </span>
            <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Promedio</span>
          </span>
          <span className="h-5 w-px bg-border/30" />
          <span className="flex items-center gap-2">
            <span className="font-bold text-[#0DA2E7] text-lg flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Sparkles className="h-4 w-4" />
              {maxDay || "—"}
            </span>
            <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pico</span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ═══════ FOOTER CENTRADO ═══════ */}
      <div className="mt-2 pt-1.5 border-t border-border/20 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="h-3 w-3 rounded-full bg-[#0DA2E7]" />
          Horas completadas
        </span>
        <span className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
          Hoy
        </span>
        <span className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="h-3 w-3 rounded-full bg-gray-200" />
          Sin actividad
        </span>
        <span className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {data.filter((d) => d.hours > 0).length} días con actividad
        </span>
      </div>
    </Card>
  );
}