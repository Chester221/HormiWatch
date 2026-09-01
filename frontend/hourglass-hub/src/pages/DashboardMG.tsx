import { useState, useMemo } from "react";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCardMG } from "@/components/DashboardMG/MetricCardMG";
import { ProjectsAtRisk } from "@/components/DashboardMG/ProjectsAtRisk";
import { TopTechnicians } from "@/components/DashboardMG/TopTechnicians";
import { HoursByClient } from "@/components/DashboardMG/HoursByClient";
import { TaskStatus } from "@/components/DashboardMG/TaskStatus";
import { ServicesUsage } from "@/components/DashboardMG/ServicesUsage";
import { HoursEvolutionChart } from "@/components/DashboardMG/HoursEvolutionChart";
import { HoursByDayChart } from "@/components/DashboardMG/HoursByDayChart";
import { QuickMetrics } from "@/components/DashboardMG/QuickMetrics";
import { TechnicianDetails } from "@/components/DashboardMG/TechnicianDetails";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, FolderKanban, Loader2, AlertTriangle, RefreshCw, Shield,
  Building2, CheckSquare, TrendingUp, Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useClientsWithContacts } from "@/hooks/useClientes";
import { useServices } from "@/hooks/useServices";
import { useTechnicians } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { motion } from "framer-motion";

import TechnicianDetailsModal from "@/components/DashboardMG/TechnicianDetailsModal";
import ClientDetailsModal from "@/components/clients/ClientDetailsModal";
import AllClientsModal from "@/components/clients/AllClientsModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { ManageMemberModal } from "@/components/team/ManageMemberModal";
import { CreateServiceModal } from "@/components/services/CreateServiceModal";

// ============================================
// HELPERS
// ============================================

const getWeekRanges = () => {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = subDays(currentWeekStart, 7);
  const lastWeekEnd = subDays(currentWeekEnd, 7);
  return { currentWeekStart, currentWeekEnd, lastWeekStart, lastWeekEnd };
};

const calculateHours = (task: any) => {
  if (task.duration_in_minutes) return task.duration_in_minutes / 60;
  if (task.normal_hours) return task.normal_hours + (task.overtime_hours || 0);
  return 0;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const DashboardMG = () => {
  const { user, profile } = useAuth();
  const userRole = profile?.role;
  const isManager = userRole === "Manager" || userRole === "Admin";

  // Hooks
  const { data: tasks = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks();
  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useProjects();
  const { data: clients = [] } = useClientsWithContacts();
  const { data: services = [] } = useServices();
  const { data: technicians = [] } = useTechnicians();

  // Estados de modales
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [allClientsModalOpen, setAllClientsModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [manageMemberModalOpen, setManageMemberModalOpen] = useState(false);
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);

  // Handlers
  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };
  const handleViewTechnician = (tech: any) => {
    setSelectedTechnician(tech);
    setTechModalOpen(true);
  };
  const handleViewAllClients = () => setAllClientsModalOpen(true);
  const handleRefresh = () => {
    refetchTasks();
    refetchProjects();
    toast.info("Actualizando datos...");
  };

  // ============================================
  // MÉTRICAS PRINCIPALES
  // ============================================

  const metrics = useMemo(() => {
    const { currentWeekStart, currentWeekEnd, lastWeekStart, lastWeekEnd } = getWeekRanges();

    const currentWeekTasks = tasks.filter((t: any) =>
      isWithinInterval(new Date(t.start_time || t.created_at), { start: currentWeekStart, end: currentWeekEnd })
    );
    const lastWeekTasks = tasks.filter((t: any) =>
      isWithinInterval(new Date(t.start_time || t.created_at), { start: lastWeekStart, end: lastWeekEnd })
    );

    const totalHours = tasks.reduce((acc, t) => acc + calculateHours(t), 0);
    const currentWeekHours = currentWeekTasks.reduce((acc, t) => acc + calculateHours(t), 0);
    const lastWeekHours = lastWeekTasks.reduce((acc, t) => acc + calculateHours(t), 0);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "Completed").length;
    const pendingTasks = tasks.filter((t: any) => t.status === "Pending").length;

    const activeProjects = projects.filter((p: any) => p.status !== "Completed" && p.status !== "Cancelled").length;
    const completedProjects = projects.filter((p: any) => p.status === "Completed").length;

    const clientsWithTasks = new Set();
    tasks.forEach((t: any) => {
      const p = projects.find((pr: any) => pr.id === t.project_id);
      if (p?.client_id) clientsWithTasks.add(p.client_id);
    });

    const activeTechs = new Set(currentWeekTasks.map((t: any) => t.technician_id).filter(Boolean));

    const hoursTrend = lastWeekHours === 0 ? (currentWeekHours > 0 ? 100 : 0) : Math.round(((currentWeekHours - lastWeekHours) / lastWeekHours) * 100);
    const tasksTrend = lastWeekTasks.length === 0 ? (currentWeekTasks.length > 0 ? 100 : 0) : Math.round(((currentWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100);

    return {
      horas: {
        total: totalHours,
        weekly: currentWeekHours,
        trend: { value: Math.abs(hoursTrend), positive: hoursTrend >= 0 },
      },
      proyectos: {
        total: projects.length,
        activos: activeProjects,
        completados: completedProjects,
      },
      clientes: {
        atendidos: clientsWithTasks.size,
        total: clients.length,
      },
      tareas: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        trend: { value: Math.abs(tasksTrend), positive: tasksTrend >= 0 },
      },
      equipo: {
        activos: activeTechs.size,
        total: technicians.length,
      },
    };
  }, [tasks, projects, clients, technicians]);

  // ============================================
  // DATOS PARA GRÁFICO DE HORAS POR DÍA
  // ============================================

  const hoursByDayData = useMemo(() => {
    const { currentWeekStart } = getWeekRanges();
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return days.map((day, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + index);
      const dayTasks = tasks.filter((t: any) =>
        new Date(t.start_time || t.created_at).toDateString() === date.toDateString()
      );
      const total = dayTasks.reduce((acc, t) => acc + calculateHours(t), 0);
      return { day, hours: Math.round(total * 10) / 10 };
    });
  }, [tasks]);

  // ============================================
  // ESTADOS PARA COMPONENTES HIJOS
  // ============================================

  const userName = profile?.full_name || user?.email?.split("@")[0] || "Manager";
  const isLoading = isLoadingTasks || isLoadingProjects;

  // ============================================
  // RENDER
  // ============================================

  if (!isManager) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 mb-4"
          >
            <Shield className="h-10 w-10 text-amber-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Este apartado es exclusivo para usuarios con rol de Manager.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-xl animate-pulse" />
            <div className="h-64 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ═══════ HEADER SIMPLE ═══════ */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
            Dashboard
          </span>
          <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
            Manager
          </Badge>
        </h1>
      </div>

      {/* ═══════ KPI CARDS (5) ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MetricCardMG
          title="Horas Totales"
          value={`${metrics.horas.total.toFixed(1)}h`}
          subtitle={`${metrics.horas.weekly.toFixed(1)}h esta semana`}
          icon={Clock}
          trend={metrics.horas.trend}
          delay={100}
        />
        <MetricCardMG
          title="Proyectos"
          value={metrics.proyectos.total}
          subtitle={`${metrics.proyectos.activos} activos · ${metrics.proyectos.completados} completados`}
          icon={FolderKanban}
          delay={150}
        />
        <MetricCardMG
          title="Clientes"
          value={metrics.clientes.atendidos}
          subtitle={`de ${metrics.clientes.total} clientes`}
          icon={Building2}
          delay={200}
        />
        <MetricCardMG
          title="Tareas"
          value={metrics.tareas.completed}
          subtitle={`${metrics.tareas.pending} pendientes`}
          icon={CheckSquare}
          trend={metrics.tareas.trend}
          delay={250}
        />
        <MetricCardMG
          title="Equipo"
          value={metrics.equipo.activos}
          subtitle={`${metrics.equipo.total} técnicos totales`}
          icon={Users}
          delay={300}
        />
      </div>

      {/* ═══════ GRÁFICOS + TÉCNICOS DESTACADOS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <HoursEvolutionChart tasks={tasks} />
        </div>
        <div className="lg:col-span-1">
          <TopTechnicians technicians={technicians} tasks={tasks} />
        </div>
      </div>

      {/* ═══════ QUICK METRICS ═══════ */}
      <div className="mb-6">
        <QuickMetrics
          tasks={tasks}
          projects={projects}
          technicians={technicians}
        />
      </div>

      {/* ═══════ SERVICIOS MÁS USADOS + HORAS POR CLIENTE (1/3) + HORAS POR DÍA (2/3) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 space-y-6">
          <ServicesUsage tasks={tasks} services={services} projects={projects} />
          <HoursByClient tasks={tasks} projects={projects} clients={clients} />
        </div>
        <div className="lg:col-span-2">
          <HoursByDayChart tasks={tasks} />
        </div>
      </div>

      {/* ═══════ PROYECTOS EN RIESGO + ESTADO DE TAREAS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsAtRisk projects={projects} tasks={tasks} />
        <TaskStatus tasks={tasks} />
      </div>

      {/* ═══════ MODALES ═══════ */}
      <TechnicianDetails
        tech={selectedTechnician}
        tasks={tasks}
        projects={projects}
        clients={clients}
        open={techModalOpen}
        onOpenChange={setTechModalOpen}
      />
      <ClientDetailsModal
        client={selectedClient}
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        clients={clients}
        projects={projects}
        tasks={tasks}
      />
      <AllClientsModal
        open={allClientsModalOpen}
        onOpenChange={setAllClientsModalOpen}
        clients={[]}
        onViewClient={handleViewClient}
        totalClientHours={1}
        maxClientHours={1}
      />
      <CreateTaskModal
        open={createTaskModalOpen}
        onOpenChange={setCreateTaskModalOpen}
        projects={projects}
        services={services}
        onSuccess={() => setCreateTaskModalOpen(false)}
      />
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onSuccess={() => {
          setCreateProjectModalOpen(false);
          refetchProjects();
        }}
      />
      <ManageMemberModal
        open={manageMemberModalOpen}
        onOpenChange={setManageMemberModalOpen}
        onSuccess={() => setManageMemberModalOpen(false)}
      />
      <CreateServiceModal
        open={createServiceModalOpen}
        onOpenChange={setCreateServiceModalOpen}
        onSuccess={() => setCreateServiceModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default DashboardMG;
