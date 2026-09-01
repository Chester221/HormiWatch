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
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isWithinInterval,
  getYear,
  getMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface HoursEvolutionChartProps {
  tasks: any[];
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const calculateHours = (task: any) => {
  if (task.duration_in_minutes) return task.duration_in_minutes / 60;
  if (task.normal_hours) return task.normal_hours + (task.overtime_hours || 0);
  return 0;
};

export function HoursEvolutionChart({ tasks }: HoursEvolutionChartProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Años desde 2026 en adelante
  const availableYears = useMemo(() => {
    const years = [];
    const startYear = 2026;
    for (let y = startYear; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Datos del año seleccionado
  const chartData = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    const months = eachMonthOfInterval({ start, end });

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthIndex = monthDate.getMonth();

      const monthTasks = tasks.filter((t: any) =>
        t.status === "Completed" &&
        isWithinInterval(new Date(t.start_time || t.created_at), { start: monthStart, end: monthEnd })
      );

      const hours = monthTasks.reduce((acc, t) => acc + calculateHours(t), 0);
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

  const domainMax = maxHours > 0 ? Math.ceil(maxHours * 1.25 / 10) * 10 : 50;

  const handleYearChange = (value: string) => setSelectedYear(parseInt(value));
  const goToPreviousYear = () => setSelectedYear(prev => Math.max(2026, prev - 1));
  const goToNextYear = () => setSelectedYear(prev => Math.min(currentYear + 1, prev + 1));
  const goToCurrentYear = () => setSelectedYear(currentYear);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-xl shadow-lg p-4 min-w-[160px]">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.fullLabel}
          </p>
          <p className="text-2xl font-bold text-[#0DA2E7] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.hours.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {data.count} tareas completadas
          </p>
          {data.isCurrentMonth && (
            <p className="text-[10px] text-amber-500 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ● Mes en curso
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 border-border/40 bg-white dark:bg-card shadow-sm hover:shadow-lg transition-all duration-300">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0DA2E7]/10">
            <TrendingUp className="h-5 w-5 text-[#0DA2E7]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Evolución de Horas Completadas
            </h3>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Distribución mensual de horas trabajadas
            </p>
          </div>
        </div>

        {/* Selector de año con navegación */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-md rounded-r-none border-border/40 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-colors"
              onClick={goToPreviousYear}
              title="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={String(selectedYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px] h-8 text-sm font-medium border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors rounded-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
              className="h-8 w-8 rounded-r-md rounded-l-none border-border/40 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-colors"
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
                ? "bg-[#0DA2E7] text-white hover:bg-[#0B8BC7] shadow-sm shadow-[#0DA2E7]/20"
                : "hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            }`}
            onClick={goToCurrentYear}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Actual
          </Button>
        </div>
      </div>

      {/* ═══════ ESTADÍSTICAS CENTRADAS ═══════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`stats-${selectedYear}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center gap-8 text-sm text-muted-foreground mb-4 bg-muted/5 rounded-lg px-6 py-2.5 border border-border/20 flex-wrap"
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
            <span className="font-bold text-foreground text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {maxHours.toFixed(1)}h
            </span>
            <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Máximo</span>
          </span>
          <span className="h-5 w-px bg-border/30" />
          <span className="flex items-center gap-2">
            <span className="font-bold text-[#0DA2E7] text-lg flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="h-2.5 w-2.5 rounded-full bg-[#0DA2E7]" />
              {maxMonth || "—"}
              {maxMonth && (
                <span className="text-xs text-muted-foreground font-normal ml-0.5">
                  ({maxMonthHours.toFixed(1)}h)
                </span>
              )}
            </span>
            <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pico</span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ═══════ GRÁFICO ═══════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${selectedYear}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="h-[280px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0DA2E7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0DA2E7" stopOpacity={0.02} />
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
                interval={0}
                padding={{ left: 20, right: 20 }}
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
                width={45}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
              />

              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />

              {avgHours > 0 && (
                <ReferenceLine
                  y={avgHours}
                  stroke="#94a3b8"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Promedio ${avgHours.toFixed(0)}h`,
                    position: "right",
                    fill: "#94a3b8",
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="hours"
                stroke="#0DA2E7"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isCurrent = payload.isCurrentMonth;
                  const isMax = payload.hours === maxHours && maxHours > 0;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 8 : isMax ? 7 : 5}
                      fill={isCurrent ? "#f59e0b" : isMax ? "#0DA2E7" : "#0DA2E7"}
                      stroke="white"
                      strokeWidth={2.5}
                      style={{
                        filter: isCurrent
                          ? "drop-shadow(0 0 14px rgba(245, 158, 11, 0.5))"
                          : isMax
                          ? "drop-shadow(0 0 12px rgba(13, 162, 231, 0.5))"
                          : "drop-shadow(0 0 8px rgba(13, 162, 231, 0.3))",
                      }}
                    />
                  );
                }}
                activeDot={{
                  r: 8,
                  fill: "#0DA2E7",
                  strokeWidth: 2,
                  stroke: "white",
                  style: { filter: "drop-shadow(0 0 16px rgba(13, 162, 231, 0.5))" },
                }}
                fill="url(#colorEvolution)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* ═══════ FOOTER ═══════ */}
      <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="h-3 w-3 rounded-full bg-[#0DA2E7]" />
            Horas completadas
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            Mes en curso
          </span>
          {maxMonth && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="h-2 w-2 rounded-full bg-[#0DA2E7]" />
              Pico: {maxMonth} ({maxMonthHours.toFixed(1)}h)
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {chartData.length} meses · <span className="text-foreground font-bold">{totalHours.toFixed(1)}h</span> totales
        </span>
      </div>
    </Card>
  );
}