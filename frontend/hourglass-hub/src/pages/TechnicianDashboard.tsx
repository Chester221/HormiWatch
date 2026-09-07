import { useState, useMemo } from "react";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, FolderKanban, TrendingUp, Loader2, AlertTriangle, RefreshCw, Shield, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useCreateTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { AddUserModal } from "@/components/team/AddUserModal";
import { ManageMemberModal } from "@/components/team/ManageMemberModal";
import { CreateServiceModal } from "@/components/services/CreateServiceModal";
import { useServices } from "@/hooks/useServices";
import { useHolidays } from "@/hooks/useHolidays";
import { calculateTaskBreakdown } from "@/lib/hoursCalculator";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const HORMI_BLUE = "#0DA2E7";

const getWeekRanges = () => {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subDays(currentWeekStart, 7);
  const lastWeekEnd = subDays(currentWeekEnd, 7);
  return { currentWeekStart, currentWeekEnd, lastWeekStart, lastWeekEnd };
};

const TechnicianDashboard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const userRole = profile?.role;
  const isManager = userRole === "Manager";
  const isAdmin = userRole === "Admin";
  const isTechnician = userRole === "Technician";

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 mb-4">
            <Shield className="h-10 w-10 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Redirigiendo...</h2>
          <p className="text-base text-muted-foreground text-center max-w-md">
            Los Administradores deben usar el panel de control.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { data: allTasks = [], isLoading: isLoadingTasks, error: tasksError, refetch: refetchTasks } = useTasks();
  const { data: allProjects = [], isLoading: isLoadingProjects, error: projectsError, refetch: refetchProjects } = useProjects();
  const { data: services = [] } = useServices();
  const { holidays } = useHolidays();
  const createTasksMutation = useCreateTasks();

  const tasks = useMemo(() => {
    if (isManager) {
      return allTasks;
    }
    return allTasks.filter((task: any) => task.technician_id === user?.id);
  }, [allTasks, isManager, user?.id]);

  const projects = useMemo(() => {
    if (isManager) {
      return allProjects;
    }
    return allProjects.filter((project: any) => {
      return project.members?.some((m: any) => m.id === user?.id) || 
             project.technician_id === user?.id ||
             project.project_leader_id === user?.id;
    });
  }, [allProjects, isManager, user?.id]);

  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [manageMemberModalOpen, setManageMemberModalOpen] = useState(false);
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);

  const handleCreateTask = async (data: any) => {
    if (!user) return toast.error("Debes iniciar sesión");
    if (!data.projectId) return toast.error("Selecciona un proyecto");
    if (!data.serviceId) return toast.error("Selecciona un servicio");

    const dateStr = format(data.date, "yyyy-MM-dd");
    const start_time = new Date(`${dateStr}T${data.startTime}:00`).toISOString();
    let end_time: string;
    if (data.endTime <= data.startTime) {
      const nextDay = new Date(data.date);
      nextDay.setDate(nextDay.getDate() + 1);
      end_time = new Date(`${format(nextDay, "yyyy-MM-dd")}T${data.endTime}:00`).toISOString();
    } else {
      end_time = new Date(`${dateStr}T${data.endTime}:00`).toISOString();
    }

    const selectedService = services?.find((s: any) => s.id === data.serviceId);
    const hourlyRate = selectedService?.default_hourly_rate || 0;
    const holidaysList = (holidays.data || []).filter((h: any) => !h.is_working_day).map((h: any) => h.date);
    const breakdown = calculateTaskBreakdown(start_time, end_time, hourlyRate, holidaysList);

    const tasksToCreate = breakdown.days.map((day: any) => ({
      project_id: data.projectId,
      service_id: data.serviceId,
      technician_id: user.id,
      start_time: `${day.date}T${data.startTime}:00`,
      end_time: `${day.date}T${data.endTime}:00`,
      description: data.motivo ? `[${data.motivo}] ${data.description || ''}` : data.description,
      status: data.completed ? "Completed" : "Pending",
      priority: "Medium",
      applied_hourly_rate: hourlyRate,
      normal_hours: day.normalHours,
      overtime_hours: day.overtimeHours,
      normal_pay: day.normalPay,
      overtime_pay: day.overtimePay,
      total_pay: day.totalPay,
    }));

    createTasksMutation.mutate(tasksToCreate, {
      onSuccess: () => {
        toast.success("Tarea registrada correctamente");
        setCreateTaskModalOpen(false);
        refetchTasks();
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      onError: (error: any) => {
        toast.error(`Error al crear tarea: ${error.message}`);
      },
    });
  };

  const metrics = useMemo(() => {
    const { currentWeekStart, currentWeekEnd, lastWeekStart, lastWeekEnd } = getWeekRanges();
    
    const currentWeekTasks = tasks.filter((task: any) => {
      const taskDate = new Date(task.start_time || task.created_at);
      return isWithinInterval(taskDate, { start: currentWeekStart, end: currentWeekEnd });
    });
    
    const lastWeekTasks = tasks.filter((task: any) => {
      const taskDate = new Date(task.start_time || task.created_at);
      return isWithinInterval(taskDate, { start: lastWeekStart, end: lastWeekEnd });
    });
    
    const currentWeekHours = currentWeekTasks.reduce((acc: number, task: any) => {
      if (task.duration_in_minutes) return acc + (task.duration_in_minutes / 60);
      if (task.start_time && task.end_time) {
        return acc + Math.abs(new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 3600000;
      }
      return acc + ((task.normal_hours || 0) + (task.overtime_hours || 0));
    }, 0);
    
    const lastWeekHours = lastWeekTasks.reduce((acc: number, task: any) => {
      if (task.duration_in_minutes) return acc + (task.duration_in_minutes / 60);
      if (task.start_time && task.end_time) {
        return acc + Math.abs(new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 3600000;
      }
      return acc + ((task.normal_hours || 0) + (task.overtime_hours || 0));
    }, 0);
    
    const tareasCount = tasks.length;
    const tareasCompletadas = tasks.filter((t: any) => t.status === "Completed").length;
    const tareasPendientes = tasks.filter((t: any) => t.status === "Pending").length;
    const horasTotal = tasks.reduce((acc: number, task: any) => {
      if (task.duration_in_minutes) return acc + (task.duration_in_minutes / 60);
      if (task.start_time && task.end_time) {
        return acc + Math.abs(new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 3600000;
      }
      return acc + ((task.normal_hours || 0) + (task.overtime_hours || 0));
    }, 0);
    const completionRate = tareasCount > 0 ? Math.round((tareasCompletadas / tareasCount) * 100) : 0;
    
    const tareasTrendValue = lastWeekTasks.length === 0 ? 0 : Math.round(((currentWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100);
    const horasTrendValue = lastWeekHours === 0 ? 0 : Math.round(((currentWeekHours - lastWeekHours) / lastWeekHours) * 100);
    
    return {
      tareas: {
        count: tareasCount,
        completed: tareasCompletadas,
        pending: tareasPendientes,
        trend: { value: Math.abs(tareasTrendValue), positive: tareasTrendValue >= 0 }
      },
      horas: {
        total: horasTotal,
        trend: { value: Math.abs(horasTrendValue), positive: horasTrendValue >= 0 }
      },
      proyectos: { count: projects.length, trend: { value: 0, positive: true } },
      completitud: {
        rate: completionRate,
        completed: tareasCompletadas,
        total: tareasCount,
        trend: { value: 0, positive: true }
      }
    };
  }, [tasks, projects]);

  const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const isLoading = isLoadingTasks || isLoadingProjects;
  const hasError = tasksError || projectsError;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ═══════════ HEADER PREMIUM ═══════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/20">
                <LayoutDashboard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Dashboard
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {isTechnician ? "Técnico" : "Manager"}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  {isLoading ? "Cargando..." : `Bienvenido, ${userName}`}
                  {!isLoading && (
                    <span className="text-xs text-muted-foreground/60">
                      · {(() => {
                        const pendingCount = metrics.tareas.pending;
                        if (pendingCount === 0) return "Todas las tareas completadas ✅";
                        if (pendingCount === 1) return "1 tarea pendiente";
                        return `${pendingCount} tareas pendientes`;
                      })()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ KPI CARDS ═══════════ */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-[#0DA2E7]" />
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-48 text-center rounded-xl border border-border/50 bg-card p-8">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <p className="text-base font-medium text-foreground mb-1">Error al cargar los datos</p>
            <p className="text-sm text-muted-foreground mb-4">No se pudo conectar con el servidor</p>
            <Button variant="outline" size="sm" onClick={() => { refetchTasks(); refetchProjects(); }} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { 
                  icon: CheckSquare, 
                  label: isManager ? "Tareas Registradas" : "Mis Tareas", 
                  value: metrics.tareas.count,
                  sub: `${metrics.tareas.completed} completadas · ${metrics.tareas.pending} pendientes`,
                  delay: 0.05
                },
                { 
                  icon: Clock, 
                  label: isManager ? "Horas Registradas" : "Mis Horas", 
                  value: `${metrics.horas.total.toFixed(1)}h`,
                  sub: "Tiempo total invertido",
                  delay: 0.1
                },
                { 
                  icon: FolderKanban, 
                  label: isManager ? "Proyectos" : "Mis Proyectos", 
                  value: metrics.proyectos.count,
                  sub: isManager ? "Total registrados" : "Proyectos asignados",
                  delay: 0.15
                },
                { 
                  icon: TrendingUp, 
                  label: "Completitud", 
                  value: `${metrics.completitud.rate}%`,
                  sub: `${metrics.completitud.completed} de ${metrics.completitud.total} tareas`,
                  delay: 0.2
                },
              ].map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: metric.delay }}
                  className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1.5">
                        {metric.value}
                      </p>
                      {metric.sub && (
                        <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                      )}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110">
                      <metric.icon className="h-5 w-5 text-[#0DA2E7]" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              ))}
            </div>

            {/* ═══════════ ACTIVITY FEED (ocupa todo el ancho) ═══════════ */}
            <div className="w-full">
              <ActivityFeed />
            </div>
          </>
        )}
      </div>

      <CreateTaskModal
        open={createTaskModalOpen}
        onOpenChange={(open) => setCreateTaskModalOpen(open)}
        projects={allProjects}
        services={services}
        onSuccess={(data) => handleCreateTask(data)}
      />
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={(open) => setCreateTaskModalOpen(open)}
        onSuccess={() => { refetchProjects(); setCreateProjectModalOpen(false); }}
      />
      <AddUserModal
        open={addUserModalOpen}
        onOpenChange={setAddUserModalOpen}
        onSuccess={() => { setAddUserModalOpen(false); }}
      />
      <ManageMemberModal
        open={manageMemberModalOpen}
        onOpenChange={setManageMemberModalOpen}
        onSuccess={() => { setManageMemberModalOpen(false); queryClient.invalidateQueries({ queryKey: ["team_members"] }); }}
      />
      <CreateServiceModal
        open={createServiceModalOpen}
        onOpenChange={(open) => setCreateServiceModalOpen(open)}
        onSuccess={() => { setCreateServiceModalOpen(false); }}
      />
    </DashboardLayout>
  );
};

export default TechnicianDashboard;