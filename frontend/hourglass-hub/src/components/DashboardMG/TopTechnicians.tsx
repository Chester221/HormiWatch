import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  CalendarDays,
  Lightbulb,
  FolderKanban,
  Medal,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { taskDate, taskHours } from "@/lib/dashboardUtils";
import type { Task } from "@/hooks/useTasks";
import type { TeamMember } from "@/hooks/useTeamMembers";

interface TopTechniciansProps {
  technicians: TeamMember[];
  tasks: Task[];
}

interface TechEntry extends TeamMember {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  efficiency: number;
  projects: number;
  initials: string;
  trend: number;
}

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#d97706"];

const efficiencyColor = (efficiency: number) =>
  efficiency >= 80 ? "#10b981" : efficiency >= 50 ? "#f59e0b" : "#ef4444";

export function TopTechnicians({ technicians, tasks }: TopTechniciansProps) {
  const navigate = useNavigate();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const techData: TechEntry[] = technicians
    .map((tech) => {
      const techTasks = tasks.filter((t) => {
        const taskDateValue = taskDate(t);
        return t.technician_id === tech.id && taskDateValue !== null && taskDateValue >= thirtyDaysAgo;
      });

      const totalTasks = techTasks.length;
      const completedTasks = techTasks.filter((t) => t.status === "Completed").length;
      const totalHours = techTasks.reduce((acc, t) => acc + taskHours(t), 0);

      const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const projects = new Set(techTasks.map((t) => t.project_id)).size;

      const initials = (tech.full_name || "T")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousTasks = tasks.filter((t) => {
        const taskDateValue = taskDate(t);
        return t.technician_id === tech.id && taskDateValue !== null && taskDateValue >= sixtyDaysAgo && taskDateValue < thirtyDaysAgo;
      });

      const prevHours = previousTasks.reduce((acc, t) => acc + taskHours(t), 0);

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
      <div className="h-full rounded-xl border border-border/40 bg-white p-6 shadow-sm dark:bg-card">
        <div className="flex h-full flex-col items-center justify-center py-6 text-center">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm shadow-amber-500/30">
            <Users className="h-7 w-7 text-white" />
          </div>
          <p className="text-base font-semibold text-foreground">Sin técnicos activos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay técnicos con tareas en los últimos 30 días
          </p>
          <Badge variant="outline" className="mt-3 gap-1.5 border-border/40 text-xs">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            Asigna tareas para ver estadísticas
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      {/* Blob decorativo */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400 opacity-[0.06] blur-2xl" />

      {/* HEADER */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2 shadow-sm shadow-amber-500/30">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Técnicos Destacados
            </h3>
            <p className="text-xs text-muted-foreground">
              Top {techData.length} técnicos · Últimos 30 días
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-border/40 text-xs">
          <CalendarDays className="mr-1 h-3 w-3" />
          30 días
        </Badge>
      </div>

      {/* LISTA DE TÉCNICOS */}
      <div className="relative flex flex-1 flex-col gap-2.5">
        {techData.map((tech, idx) => {
          const isTop3 = idx < 3;
          const effColor = efficiencyColor(tech.efficiency);

          return (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/team?member=${tech.id}`)}
              className="group relative flex items-center gap-3 rounded-xl border border-border/30 p-3 transition-all duration-200 hover:border-[#0DA2E7]/40 hover:bg-muted/10 cursor-pointer"
            >
              {/* Ranking */}
              <div className="flex w-8 flex-shrink-0 items-center justify-center">
                {isTop3 ? (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: `${MEDAL_COLORS[idx]}1a` }}
                  >
                    <Medal
                      className="h-4 w-4"
                      style={{ color: MEDAL_COLORS[idx], fill: `${MEDAL_COLORS[idx]}22` }}
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground tabular-nums">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-border transition-all group-hover:ring-[#0DA2E7]/40">
                <AvatarImage
                  src={tech.avatar_url || tech.profile?.avatar_url || ""}
                  alt={tech.full_name || "Técnico"}
                />
                <AvatarFallback className="bg-[#0DA2E7]/10 text-[11px] font-semibold text-[#0DA2E7]">
                  {tech.initials}
                </AvatarFallback>
              </Avatar>

              {/* Nombre + métricas */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {tech.full_name || "Técnico"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    <span className="tabular-nums">{tech.completedTasks}/{tech.totalTasks} tareas</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    <span className="tabular-nums">{tech.projects} proy.</span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tech.efficiency}%` }}
                      transition={{ delay: 0.2 + idx * 0.05, duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: effColor }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: effColor }}
                  >
                    {tech.efficiency}%
                  </span>
                </div>
              </div>

              {/* Horas */}
              <div className="flex flex-shrink-0 flex-col items-end">
                <span className="text-lg font-bold leading-none text-foreground tabular-nums">
                  {tech.totalHours.toFixed(1)}h
                </span>
                <div className="mt-1 flex items-center gap-0.5">
                  {tech.trend !== 0 &&
                    (tech.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ))}
                  {tech.trend !== 0 && (
                    <span
                      className={`text-[10px] font-medium tabular-nums ${
                        tech.trend > 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {tech.trend > 0 ? "+" : ""}{tech.trend}%
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}