import { motion } from "framer-motion";
import { Award, TrendingUp, TrendingDown, Users, Clock, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopTechniciansProps {
  technicians: any[];
  tasks: any[];
  onViewTechnician?: (tech: any) => void;  // ← NUEVA PROP
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function TopTechnicians({ technicians, tasks, onViewTechnician }: TopTechniciansProps) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const techData = technicians
    .map((tech: any) => {
      const techTasks = tasks.filter((t: any) => {
        const taskDate = new Date(t.start_time || t.created_at);
        return t.technician_id === tech.id && taskDate >= thirtyDaysAgo;
      });

      const totalTasks = techTasks.length;
      const completedTasks = techTasks.filter((t: any) => t.status === "Completed").length;
      const totalHours = techTasks.reduce((acc, t) => {
        const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
        return acc + h;
      }, 0);

      const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const projects = new Set(techTasks.map((t: any) => t.project_id)).size;

      const initials = (tech.full_name || "T")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousTasks = tasks.filter((t: any) => {
        const taskDate = new Date(t.start_time || t.created_at);
        return t.technician_id === tech.id && taskDate >= sixtyDaysAgo && taskDate < thirtyDaysAgo;
      });

      const prevHours = previousTasks.reduce((acc, t) => {
        const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
        return acc + h;
      }, 0);

      let trend = 0;
      if (prevHours > 0) {
        trend = Math.round(((totalHours - prevHours) / prevHours) * 100);
      } else if (totalHours > 0) {
        trend = 100;
      }

      return {
        ...tech,
        totalTasks,
        completedTasks,
        totalHours,
        efficiency,
        projects,
        initials,
        trend,
      };
    })
    .filter((t) => t.totalTasks > 0)
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 5);

  if (techData.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-6 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Sin técnicos activos</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay técnicos con tareas en los últimos 30 días
          </p>
          <Badge variant="outline" className="mt-3 text-[10px] border-border/40">
            💡 Asigna tareas para ver estadísticas
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0DA2E7]/10">
            <Award className="h-4 w-4 text-[#0DA2E7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Técnicos Destacados
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Top {techData.length} técnicos · Últimos 30 días
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-border/40">
          <Clock className="h-3 w-3 mr-1" />
          30 días
        </Badge>
      </div>

      {/* LISTA DE TÉCNICOS */}
      <div className="space-y-2.5">
        {techData.map((tech: any, idx: number) => {
          const isTop3 = idx < 3;
          const medal = isTop3 ? MEDALS[idx] : `${idx + 1}`;

          return (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onViewTechnician?.(tech)}  // ← ABRE EL MODAL
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/10 transition-all duration-200 cursor-pointer group"
            >
              {/* Ranking */}
              <div className="flex items-center justify-center w-7 h-7 text-sm font-bold flex-shrink-0">
                {medal}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-border group-hover:ring-[#0DA2E7]/30 transition-all">
                <AvatarFallback className="text-[10px] bg-[#0DA2E7]/10 text-[#0DA2E7] font-semibold">
                  {tech.initials}
                </AvatarFallback>
              </Avatar>

              {/* Nombre */}
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {tech.full_name || "Técnico"}
              </span>

              {/* Métricas */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {tech.completedTasks}/{tech.totalTasks}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {tech.projects}
                </span>
              </div>

              {/* Horas + Eficiencia */}
              <div className="text-right flex-shrink-0 min-w-[70px]">
                <span className="text-sm font-bold text-foreground">
                  {tech.totalHours.toFixed(1)}h
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ml-2 px-1.5 py-0 ${
                    tech.efficiency >= 80
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : tech.efficiency >= 50
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {tech.efficiency}%
                </Badge>
              </div>

              {/* Tendencia */}
              <div className="flex items-center gap-1 flex-shrink-0 min-w-[50px]">
                {tech.trend !== 0 && (
                  <>
                    {tech.trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] font-medium ${
                        tech.trend > 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {tech.trend > 0 ? "+" : ""}{tech.trend}%
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}