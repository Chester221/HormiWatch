import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  ArrowRight,
  Building2,
  Hourglass,
  CalendarDays,
  ClipboardList,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { taskHours, safeParseDate, projectStatusInfo } from "@/lib/dashboardUtils";

interface MyProjectsProps {
  projects: any[];
  tasks: any[];
}

export function MyProjects({ projects, tasks }: MyProjectsProps) {
  const navigate = useNavigate();

  const data = useMemo(() => {
    return projects
      .map((p: any) => {
        const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
        const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
        const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
        const hours = projectTasks.reduce((acc, t) => acc + taskHours(t), 0);
        const pool = Number(p.pool_hours) || 0;
        const consumedPct = pool > 0 ? Math.min(100, Math.round((hours / pool) * 100)) : progress;
        const endDate = safeParseDate(p.end_date);
        const status = projectStatusInfo(p.status);
        return {
          ...p,
          completed,
          totalTasks: projectTasks.length,
          progress,
          hours,
          pool,
          consumedPct,
          endLabel: endDate ? endDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : null,
          clientName: p.clients?.name || p.customer_name || "Sin cliente",
          statusInfo: status,
        };
      })
      .sort((a, b) => {
        if (a.status === "COMPLETED" || a.status === "CANCELLED") return 1;
        if (b.status === "COMPLETED" || b.status === "CANCELLED") return -1;
        return b.progress - a.progress;
      })
      .slice(0, 5);
  }, [projects, tasks]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0DA2E7] opacity-[0.06] blur-2xl" />

      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] rounded-xl p-2 shadow-sm shadow-[#0DA2E7]/30">
            <FolderKanban className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Mis Proyectos
            </h3>
            <p className="text-xs text-muted-foreground">
              {data.length} proyectos asignados
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer border-border/40 text-xs transition-colors hover:bg-muted/50"
          onClick={() => navigate("/projects")}
        >
          Ver todos
          <ArrowRight className="ml-1 h-3 w-3" />
        </Badge>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm shadow-[#0DA2E7]/30">
            <Lightbulb className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sin proyectos asignados</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Los proyectos asignados aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-2.5">
          {data.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/projects?project=${project.id}`)}
              className="group flex items-center gap-3 rounded-xl border border-border/30 p-3 transition-all duration-200 hover:border-[#0DA2E7]/40 hover:bg-muted/10 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {project.name}
                  </p>
                  <Badge className={`whitespace-nowrap border px-2 py-0 text-[10px] font-medium ${project.statusInfo.cls}`}>
                    {project.statusInfo.label}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {project.clientName}
                  </span>
                  {project.endLabel && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Vence: {project.endLabel}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.consumedPct}%` }}
                      transition={{ delay: 0.2 + idx * 0.05, duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          project.consumedPct >= 90
                            ? "#ef4444"
                            : project.consumedPct >= 60
                            ? "#f59e0b"
                            : "#0DA2E7",
                        boxShadow: "inset 0 0 0 1px rgba(17,24,39,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    {project.consumedPct}%
                  </span>
                </div>
              </div>

              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground tabular-nums">
                  <Hourglass className="h-3 w-3 text-[#0DA2E7]" />
                  {project.hours.toFixed(1)}h
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ClipboardList className="h-3 w-3" />
                  {project.completed}/{project.totalTasks} tareas
                </span>
              </div>

              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#0DA2E7]" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}