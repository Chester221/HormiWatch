import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Mail,
  Briefcase,
  Clock,
  CheckSquare,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface TechnicianDetailsProps {
  tech: any;
  tasks: any[];
  projects: any[];
  clients: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianDetails({
  tech,
  tasks,
  projects,
  clients,
  open,
  onOpenChange,
}: TechnicianDetailsProps) {
  const navigate = useNavigate();

  if (!tech) return null;

  // ============================================
  // CÁLCULOS DEL TÉCNICO
  // ============================================

  const techTasks = tasks.filter((t: any) => t.technician_id === tech.id);
  const completedTasks = techTasks.filter((t: any) => t.status === "Completed");
  const pendingTasks = techTasks.filter((t: any) => t.status === "Pending");
  const inProgressTasks = techTasks.filter((t: any) => t.status === "InProgress");

  const totalHours = techTasks.reduce((acc, t) => {
    const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
    return acc + h;
  }, 0);

  const efficiency = techTasks.length > 0
    ? Math.round((completedTasks.length / techTasks.length) * 100)
    : 0;

  // Proyectos activos
  const activeProjects = projects.filter((p: any) => {
    const projectTasks = techTasks.filter((t: any) => t.project_id === p.id);
    return projectTasks.length > 0 && p.status !== "Completed";
  });

  // Tareas recientes (últimas 5)
  const recentTasks = techTasks
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Tendencia vs mes anterior
  const now = new Date();
  const oneMonthAgo = subMonths(now, 1);
  const twoMonthsAgo = subMonths(now, 2);

  const currentMonthTasks = techTasks.filter((t: any) =>
    new Date(t.created_at) >= oneMonthAgo
  );
  const previousMonthTasks = techTasks.filter((t: any) =>
    new Date(t.created_at) >= twoMonthsAgo && new Date(t.created_at) < oneMonthAgo
  );

  const currentHours = currentMonthTasks.reduce((acc, t) => {
    const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
    return acc + h;
  }, 0);

  const previousHours = previousMonthTasks.reduce((acc, t) => {
    const h = t.duration_in_minutes ? t.duration_in_minutes / 60 : 0;
    return acc + h;
  }, 0);

  let trend = 0;
  if (previousHours > 0) {
    trend = Math.round(((currentHours - previousHours) / previousHours) * 100);
  } else if (currentHours > 0) {
    trend = 100;
  }

  const isPositive = trend >= 0;

  // Iniciales
  const initials = (tech.full_name || "T")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ============================================
  // RENDER
  // ============================================

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fondo oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 sm:inset-[10%] z-50 overflow-hidden rounded-2xl bg-white dark:bg-card shadow-2xl border border-border/40 flex flex-col"
          >
            {/* ═══ CONTENIDO ═══ */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16 ring-2 ring-[#0DA2E7]/20">
                  <AvatarFallback className="text-xl bg-[#0DA2E7]/10 text-[#0DA2E7] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {tech.full_name || "Técnico"}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none">
                      {tech.role || "Technician"}
                    </Badge>
                    {tech.email && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {tech.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ ESTADÍSTICAS ═══ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard
                  icon={Clock}
                  label="Horas Totales"
                  value={`${totalHours.toFixed(1)}h`}
                />
                <StatCard
                  icon={CheckSquare}
                  label="Tareas Completadas"
                  value={`${completedTasks.length}/${techTasks.length}`}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Eficiencia"
                  value={`${efficiency}%`}
                  color={efficiency >= 70 ? "text-emerald-500" : efficiency >= 50 ? "text-amber-500" : "text-red-500"}
                />
                <StatCard
                  icon={FolderKanban}
                  label="Proyectos"
                  value={activeProjects.length}
                />
              </div>

              {/* ═══ TENDENCIA ═══ */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20 mb-6">
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? "+" : ""}{trend}%
                </div>
                <span className="text-sm text-muted-foreground">
                  vs mes anterior ({previousHours.toFixed(1)}h → {currentHours.toFixed(1)}h)
                </span>
              </div>

              <Separator className="my-4" />

              {/* ═══ PROYECTOS ACTIVOS ═══ */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <FolderKanban className="h-4 w-4 text-[#0DA2E7]" />
                  Proyectos Activos
                </h3>
                {activeProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin proyectos activos</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeProjects.map((project: any) => (
                      <Badge
                        key={project.id}
                        variant="outline"
                        className="px-3 py-1 text-xs border-border/40 bg-muted/5"
                      >
                        {project.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ TAREAS RECIENTES ═══ */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-[#0DA2E7]" />
                  Tareas Recientes
                </h3>
                {recentTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin tareas recientes</p>
                ) : (
                  <div className="space-y-2">
                    {recentTasks.map((task: any) => {
                      const project = projects.find((p: any) => p.id === task.project_id);
                      const statusColors = {
                        Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
                        InProgress: "bg-blue-50 text-blue-600 border-blue-200",
                        Pending: "bg-amber-50 text-amber-600 border-amber-200",
                        Cancelled: "bg-red-50 text-red-600 border-red-200",
                      };
                      const statusClass = statusColors[task.status] || statusColors.Pending;

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/20 hover:bg-muted/5 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {task.description || "Sin descripción"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{project?.name || "Sin proyecto"}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.duration_in_minutes ? (task.duration_in_minutes / 60).toFixed(1) : 0}h
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${statusClass}`}>
                            {task.status || "Pending"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="flex-shrink-0 border-t border-border/40 p-4 bg-muted/5">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/team");
                }}
              >
                <Users className="h-4 w-4" />
                Ver perfil completo en el equipo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// STAT CARD (subcomponente)
// ============================================

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
}

function StatCard({ icon: Icon, label, value, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="p-3 rounded-xl bg-muted/5 border border-border/20 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}