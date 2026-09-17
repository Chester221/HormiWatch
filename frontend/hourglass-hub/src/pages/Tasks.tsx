import { useState, useMemo, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ClipboardList as TasksIcon, Plus, Loader2,
  CheckCircle2, Clock as ClockIcon, Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useCreateTasks, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useServices } from "@/hooks/useServices";
import { useHolidays } from "@/hooks/useHolidays";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { calculateTaskBreakdown } from "@/lib/hoursCalculator";
import { buildTaskSegments } from "@/lib/buildTaskSegments";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDeleteModal } from "@/components/tasks/TaskDeleteModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { motion } from "framer-motion";

const HORMI_BLUE = "#0DA2E7";

// Normaliza el estado a formato API (PENDING / IN_PROGRESS / COMPLETED)
const normStatus = (status?: string | null): string =>
  String(status || "").toUpperCase().replace(/[^A-Z]/g, "") || "PENDING";

const isCompletedStatus = (status?: string | null) => normStatus(status) === "COMPLETED";
const isInProgressStatus = (status?: string | null) => normStatus(status) === "INPROGRESS";

// Mapea el parámetro de URL (?status=...) a los valores del filtro
const STATUS_PARAM_MAP: Record<string, string> = {
  completed: "COMPLETED",
  "in-progress": "IN_PROGRESS",
  progress: "IN_PROGRESS",
  pending: "PENDING",
  cancelled: "CANCELLED",
  deleted: "CANCELLED",
};

// Campos de tarea usados para lectura defensiva (API camelCase / legacy snake_case)
interface TaskLike {
  startDateTime?: string;
  start_time?: string;
  endDateTime?: string;
  end_time?: string;
  createdAt?: string;
  created_at?: string;
  normal_hours?: number;
  overtime_hours?: number;
  durationInHours?: number;
  duration_in_minutes?: number;
  project_id?: string;
  project?: { id?: string };
  projects?: { id?: string };
  status?: string;
  description?: string;
}

export default function Tasks() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = STATUS_PARAM_MAP[String(searchParams.get("status") || "").toLowerCase()] || "all";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [projectFilter, setProjectFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  const { data: allTasks = [], isLoading, isError, error, refetch } = useTasks();
  const { data: allProjects = [] } = useProjects();
  const { data: services = [] } = useServices();
  const { holidays } = useHolidays();

  // Sincronizar filtro si cambia el parámetro de URL con la página ya montada
  useEffect(() => {
    const param = String(searchParams.get("status") || "").toLowerCase();
    setStatusFilter(STATUS_PARAM_MAP[param] || "all");
  }, [searchParams]);

  // Abrir el detalle de una tarea desde la búsqueda global (?task=id)
  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId) return;
    const target = allTasks.find((t: any) => String(t.id) === taskId);
    if (target) {
      setSelectedTask(target);
      setDetailOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, allTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const createTasksMutation = useCreateTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const isManager = profile?.role === "Manager" || profile?.role === "Leader" || profile?.role === "Admin";

  const tasks = useMemo(() => {
    if (isManager) return allTasks;
    return allTasks.filter((task: any) => task.technician_id === user?.id);
  }, [allTasks, isManager, user?.id]);

  const projectMap = useMemo(() => {
    const map: Record<string, any> = {};
    (allProjects || []).forEach((p: any) => { map[p.id] = p; });
    return map;
  }, [allProjects]);

  const memberProjects = useMemo(() => {
    if (isManager) return allProjects;
    return allProjects.filter(
      (p) =>
        p.technicians?.some((m) => m.id === user?.id) ||
        p.project_leader_id === user?.id
    );
  }, [allProjects, isManager, user?.id]);

  const { data: teamMembers = [] } = useTeamMembers();
  const techMap = useMemo(() => {
    const map: Record<string, any> = {};
    (teamMembers as { id: string }[]).forEach((m) => { map[m.id] = m; });
    return map;
  }, [teamMembers]);

  const holidayDates = useMemo(() => {
    return ((
      Array.isArray(holidays.data) ? holidays.data : (holidays.data as any)?.records || []
    ) as any[]).filter((h: { is_working_day?: boolean }) => !h.is_working_day)
      .map((h: { date: string }) => h.date.split("T")[0]);
  }, [holidays.data]);

  // Defensivos: soportan la API real (camelCase) y el modelo legacy (snake_case)
  const getTaskStartRaw = useCallback((t: TaskLike) => t?.startDateTime || t?.start_time || t?.createdAt || t?.created_at || null, []);
  const getTaskEndRaw = useCallback((t: TaskLike) => t?.endDateTime || t?.end_time || null, []);
  const getTaskCreatedRaw = useCallback((t: TaskLike) => t?.createdAt || t?.created_at || null, []);
  const getTaskProjectId = useCallback((t: TaskLike) => t?.project_id || t?.project?.id || t?.projects?.id || null, []);

  const getTaskHours = useCallback((t: TaskLike): number => {
    const normal = Number(t?.normal_hours || 0);
    const overtime = Number(t?.overtime_hours || 0);
    if (normal + overtime > 0) return normal + overtime;
    if (t?.durationInHours) return t.durationInHours;
    if (t?.duration_in_minutes) return t.duration_in_minutes / 60;
    const start = getTaskStartRaw(t);
    const end = getTaskEndRaw(t);
    if (start && end) {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      if (e > s) return (e - s) / 3_600_000;
    }
    return 0;
  }, [getTaskStartRaw, getTaskEndRaw]);

  // Factor aplicado SOLO VISUAL (la lógica de cálculo vive en hoursCalculator)
  const getFactor = useCallback((t: TaskLike) => {
    const start = getTaskStartRaw(t);
    if (!start) return { multiplier: 1, label: "×1", title: "Factor ×1", tone: "neutral" };
    const d = new Date(start);
    const dow = d.getDay();
    const dateStr = format(d, "yyyy-MM-dd");
    const isHoliday = holidayDates.includes(dateStr);
    const overtime = Number(t?.overtime_hours || 0);
    const hour = d.getHours();
    const endRaw = getTaskEndRaw(t);
    const endHour = endRaw ? new Date(endRaw).getHours() : -1;
    const isNight = hour >= 19 || endHour >= 0 && endHour <= 6;
    if (dow === 0) return { multiplier: 2, label: "×2", title: "Domingo (factor ×2)", tone: "red" };
    if (isHoliday) return { multiplier: 2, label: "×2", title: "Feriado (factor ×2)", tone: "red" };
    if (dow === 6) return { multiplier: 1.5, label: "×1.5", title: "Sábado (factor ×1.5)", tone: "amber" };
    if (overtime > 0 || isNight) return { multiplier: 1.5, label: "×1.5", title: "Horario nocturno (factor ×1.5)", tone: "amber" };
    return { multiplier: 1, label: "×1", title: "Horario regular (factor ×1)", tone: "neutral" };
  }, [holidayDates, getTaskStartRaw, getTaskEndRaw]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (statusFilter !== "all") {
      const wanted = normStatus(statusFilter);
      list = list.filter((t: any) => normStatus(t.status) === wanted);
    }
    if (projectFilter !== "all") {
      list = list.filter((t: any) => getTaskProjectId(t) === projectFilter);
    }
    return list.sort((a: any, b: any) => {
      const aDate = getTaskStartRaw(a) || getTaskCreatedRaw(a) || 0;
      const bDate = getTaskStartRaw(b) || getTaskCreatedRaw(b) || 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [tasks, statusFilter, projectFilter, getTaskProjectId, getTaskStartRaw, getTaskCreatedRaw]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter((t: any) => isCompletedStatus(t.status)).length,
      inProgress: tasks.filter((t: any) => isInProgressStatus(t.status)).length,
      pending: tasks.filter((t: any) => !isCompletedStatus(t.status) && !isInProgressStatus(t.status)).length,
    };
  }, [tasks]);

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
    const hourlyRate = Number(selectedService?.hourlyRate ?? (selectedService?.default_hourly_rate || 0));
    const holidaysList = (holidays.data || []).filter((h: any) => !h.is_working_day).map((h: any) => h.date);
    const breakdown = calculateTaskBreakdown(start_time, end_time, hourlyRate, holidaysList);

    const segments = buildTaskSegments(breakdown.days, data.startTime, data.endTime);
    const tasksToCreate = segments.map((segment, index) => ({
      projectId: data.projectId,
      serviceId: data.serviceId,
      technicianId: user.id,
      startDateTime: segment.startDateTime,
      endDateTime: segment.endDateTime,
      title: data.title || "",
      description: data.description,
      status: data.status === "Completed" ? "COMPLETED" : "PENDING",
      priority: "MEDIUM",
    }));

    createTasksMutation.mutate(tasksToCreate, {
      onSuccess: () => {
        toast.success("Tarea registrada correctamente");
        setCreateModalOpen(false);
        refetch();
      },
      onError: (error: any) => {
        toast.error(`Error al crear tarea: ${error.message}`);
      },
    });
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setDeleteOpen(true);
  };

  const confirmDeleteTask = async (task: any) => {
    if (!task?.id) return;
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      setDeleteOpen(false);
      setTaskToDelete(null);
      setDetailOpen(false);
      toast.success("Tarea eliminada correctamente");
      refetch();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleUpdateTask = async (updatedData: { title?: string; description?: string; status?: string }) => {
    if (!selectedTask) return;
    const payload: { title?: string; description?: string; status?: string } = {};
    if (updatedData.title !== undefined) payload.title = updatedData.title;
    if (updatedData.description !== undefined) payload.description = updatedData.description;
    if (updatedData.status) {
      const norm = normStatus(updatedData.status);
      const statusMap: Record<string, string> = {
        COMPLETED: "COMPLETED",
        INPROGRESS: "IN_PROGRESS",
        PENDING: "PENDING",
        CANCELLED: "CANCELLED",
      };
      payload.status = statusMap[norm] || "PENDING";
    }
    await updateTaskMutation.mutateAsync({ id: selectedTask.id, data: payload });
    setEditOpen(false);
    refetch();
  };

  const openEdit = (task: TaskLike) => {
    setSelectedTask(task);
    setDetailOpen(false);
    setEditOpen(true);
  };

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (projectFilter !== "all" ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/20">
                <TasksIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Tareas
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {stats.total} tareas
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Gestiona y registra las tareas de tu equipo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
              >
                <Plus className="h-4 w-4" /> Nueva Tarea
              </Button>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: TasksIcon, label: "Total Tareas", value: stats.total, color: "text-[#0DA2E7]", bg: "bg-[#0DA2E7]/10" },
            { icon: CheckCircle2, label: "Completadas", value: stats.completed, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { icon: Activity, label: "En Progreso", value: stats.inProgress, color: "text-blue-600", bg: "bg-blue-500/10" },
            { icon: ClockIcon, label: "Pendientes", value: stats.pending, color: "text-amber-600", bg: "bg-amber-500/10" },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-border/30 bg-card/80 p-5 shadow-sm hover:shadow-md hover:border-[#0DA2E7]/20 transition-all duration-300"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.04] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1.5">{metric.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.bg} transition-transform duration-300 group-hover:scale-105`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <TaskFilters
              projects={(allProjects || []).map((p: any) => ({ id: p.id, name: p.name || p.title || "Sin nombre" }))}
              projectFilter={projectFilter}
              onProjectChange={setProjectFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              resultCount={filteredTasks.length}
              activeCount={activeFilterCount}
              onClear={() => { setStatusFilter("all"); setProjectFilter("all"); }}
            />
            <div className="h-6 w-px bg-border/50" />
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5">
              {filteredTasks.length} tarea{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#0DA2E7]" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-600">
              Error al cargar las tareas: {(error as any)?.message || 'Error desconocido'}
            </p>
            <Button
              onClick={() => refetch()}
              className="mt-3 gap-2 text-white bg-[#0DA2E7] hover:bg-[#0B8BC7]"
            >
              <Loader2 className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks.map((t: any) => ({
              ...t,
              title: t.title || t.description || "Sin título",
              projectName: projectMap[getTaskProjectId(t) ?? ""]?.name || t.projects?.name || "Sin proyecto",
              technicianName: techMap[t.technician_id]?.full_name || techMap[t.technician?.id]?.full_name || t.technician?.full_name || "Sin técnico",
              date: getTaskStartRaw(t) ? new Date(getTaskStartRaw(t)) : undefined,
              startTime: getTaskStartRaw(t) ? format(new Date(getTaskStartRaw(t)), "HH:mm") : undefined,
              endTime: getTaskEndRaw(t) ? format(new Date(getTaskEndRaw(t)), "HH:mm") : undefined,
              hours: getTaskHours(t),
              factor: getFactor(t),
              canEdit: true,
              canDelete: true,
            }))}
            onTaskClick={(task: any) => {
              setSelectedTask(task);
              setDetailOpen(true);
            }}
            onEditTask={(task: any) => openEdit(task)}
            onDeleteTask={(task: any) => handleDeleteTask(task)}
          />
        )}
      </div>

      {/* MODALS */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projects={memberProjects}
        services={services}
        onSuccess={handleCreateTask}
      />
      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditTask={() => selectedTask && openEdit(selectedTask)}
        onDeleteTask={() => selectedTask && handleDeleteTask(selectedTask)}
        getProjectName={(id: string) => projectMap[id]?.name}
        getClientName={(id: string) => projectMap[id]?.clients?.name || projectMap[id]?.customer_name}
        getServiceName={(id: string) => services.find((s: { id: string }) => s.id === id)?.name}
        getCreatorName={(id: string) => techMap[id]?.full_name}
        getCreatorRole={(id: string) => techMap[id]?.role}
        getTechInitials={(id: string) => {
          const name = techMap[id]?.full_name || "";
          return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        }}
      />
      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={handleUpdateTask}
        />
      )}
      <TaskDeleteModal
        task={taskToDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDeleteTask}
      />
    </DashboardLayout>
  );
}
