import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, Filter, Loader2, FileText, FolderKanban, AlertTriangle, Trash2, 
  ChevronLeft, ChevronRight, TrendingUp, CheckCircle, 
  Clock, Calendar, List 
} from "lucide-react";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskCalendar, type Task } from "@/components/tasks/TaskCalendar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useServices } from "@/hooks/useServices";
import { useTasks, useCreateTasks, useDeleteTask, useUpdateTask } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useHolidays } from "@/hooks/useHolidays";
import { calculateTaskBreakdown } from "@/lib/hoursCalculator";
import { useClientsWithContacts } from "@/hooks/useClientes";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const HORMI_BLUE = "#0DA2E7";
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

const Tasks = () => {
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  
  // 🔥 CAMBIO: Cargar vista desde el perfil del usuario
  const { user, profile, updatePreferences } = useAuth();
  const [viewMode, setViewMode] = useState<"calendar" | "list">(() => {
    // Primero intentar cargar desde el perfil del usuario
    if (profile?.preferences?.tasks_view) {
      return profile.preferences.tasks_view;
    }
    // Fallback a localStorage
    const saved = localStorage.getItem("tasksViewMode");
    return (saved === "calendar" || saved === "list") ? saved : "list";
  });
  
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justification, setJustification] = useState("");
  const [justificationError, setJustificationError] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  
  const { data: clients = [] } = useClientsWithContacts();
  const userRole = profile?.role;
  
  const isAdmin = userRole === 'Admin';
  const isManager = userRole === 'Manager';
  const isTechnician = userRole === 'Technician';
  
  const canCreateTask = isManager || isTechnician;
  const canEditTask = isManager || isTechnician;
  const canDeleteTask = isManager || isTechnician;
  const canExport = isManager;

  const { data: projectsList, isLoading: isLoadingProjects } = useProjects();
  const { data: servicesList = [] } = useServices();
  const { holidays } = useHolidays();
  const { data: tasksData, isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks();

  const createTasksMutation = useCreateTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const queryClient = useQueryClient();

  // ============================================
  // FUNCIONES AUXILIARES PARA EL MODAL DE DETALLE
  // ============================================

  const getTechName = (techId: string) => {
    if (!techId) return "Sin técnico";
    try {
      const task = tasksData?.find((t: any) => t.technician_id === techId);
      if (task?.technician?.full_name) {
        return task.technician.full_name;
      }
      return "Técnico";
    } catch {
      return "Sin técnico";
    }
  };

  const getTechInitials = (techId: string) => {
    if (!techId) return "??";
    try {
      const name = getTechName(techId);
      if (name === "Sin técnico" || name === "Técnico") return "??";
      return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    } catch {
      return "??";
    }
  };

  const getProjectName = (projectId: string) => {
    if (!projectId) return "Sin proyecto";
    try {
      const project = projectsList?.find((p: any) => p.id === projectId);
      return project?.name || "Sin proyecto";
    } catch {
      return "Sin proyecto";
    }
  };

  const getClientName = (projectId: string) => {
    if (!projectId) return "Sin cliente";
    try {
      const project = projectsList?.find((p: any) => p.id === projectId);
      if (!project) return "Sin cliente";
      const client = clients.find((c: any) => c.id === project.client_id);
      return client?.name || "Sin cliente";
    } catch {
      return "Sin cliente";
    }
  };

  const getServiceName = (serviceId: string) => {
    if (!serviceId) return "Sin servicio";
    try {
      const service = servicesList?.find((s: any) => s.id === serviceId);
      return service?.name || "Sin servicio";
    } catch {
      return "Sin servicio";
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskDetailModalOpen(true);
  };

  // 🔥 NUEVO: Función para cambiar la vista y guardarla en el perfil
  const handleViewChange = async (newMode: "calendar" | "list") => {
    setViewMode(newMode);
    try {
      await updatePreferences({ tasks_view: newMode });
    } catch (error) {
      console.error("Error guardando preferencia de vista:", error);
    }
    // Guardar en localStorage como fallback
    localStorage.setItem("tasksViewMode", newMode);
  };

  // 🔥 NUEVO: Función para guardar filtros en el perfil
  const handleFilterChange = async (key: string, value: string) => {
    const currentFilters = profile?.preferences?.tasks_filters || {};
    const updatedFilters = { ...currentFilters, [key]: value };
    
    if (key === "project") {
      setProjectFilter(value);
    } else if (key === "status") {
      setStatusFilter(value);
    }
    
    try {
      await updatePreferences({ tasks_filters: updatedFilters });
    } catch (error) {
      console.error("Error guardando filtros:", error);
    }
  };

  // 🔥 Cargar filtros desde el perfil al iniciar
  useEffect(() => {
    if (profile?.preferences?.tasks_filters) {
      const filters = profile.preferences.tasks_filters;
      if (filters.project) setProjectFilter(filters.project);
      if (filters.status) setStatusFilter(filters.status);
    }
  }, [profile]);

  const handleCreateTask = async (data: any) => {
    if (!canCreateTask) {
      toast.error("No tienes permisos para crear tareas");
      return;
    }
    if (!user) return toast.error("Debes iniciar sesión para crear una tarea.");
    if (!data.projectId) return toast.error("Selecciona un proyecto");
    if (!data.serviceId) return toast.error("Selecciona un servicio");

    const selectedStatus = data.status || "Pending";

    const dateStr = format(data.date, "yyyy-MM-dd");
    const startHour = parseInt(data.startTime.split(':')[0]);
    const endHour = parseInt(data.endTime.split(':')[0]);
    const isNextDay = endHour < startHour || (endHour === startHour && data.endTime <= data.startTime);
    
    const start_time = `${dateStr}T${data.startTime}:00`;
    let end_time: string;
    if (isNextDay) { 
      const nextDay = new Date(data.date); 
      nextDay.setDate(nextDay.getDate() + 1); 
      const nextDateStr = format(nextDay, "yyyy-MM-dd");
      end_time = `${nextDateStr}T${data.endTime}:00`;
    } else { 
      end_time = `${dateStr}T${data.endTime}:00`;
    }
    
    const selectedService = servicesList?.find(s => s.id === data.serviceId);
    const hourlyRate = selectedService?.default_hourly_rate || 0;
    const holidaysList = (holidays.data || []).filter(h => !h.is_working_day).map(h => h.date);
    const breakdown = calculateTaskBreakdown(start_time, end_time, hourlyRate, holidaysList);
    
    const tasksToCreate = breakdown.days.map((day: any) => ({
      project_id: data.projectId, 
      service_id: data.serviceId, 
      technician_id: user.id,
      created_by: user.id,
      start_time: `${day.date}T${data.startTime}:00`, 
      end_time: `${day.date}T${data.endTime}:00`,
      description: data.description, 
      status: selectedStatus,
      priority: 'Medium', 
      applied_hourly_rate: hourlyRate,
      normal_hours: day.normalHours, 
      overtime_hours: day.overtimeHours,
      normal_pay: day.normalPay, 
      overtime_pay: day.overtimePay, 
      total_pay: day.totalPay,
    }));
    
    createTasksMutation.mutate(tasksToCreate, { 
      onSuccess: () => { 
        const statusLabels: Record<string, string> = {
          "Pending": "pendiente",
          "In Progress": "en progreso",
          "Completed": "completada"
        };
        toast.success(`Tarea ${statusLabels[selectedStatus] || "registrada"} exitosamente`); 
        setCreateTaskModalOpen(false); 
        refetchTasks(); 
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }, 
      onError: (error: any) => toast.error(` Error: ${error.message}`) 
    });
  };

  const handleDeleteTask = (task: any) => { 
    if (!canDeleteTask) {
      toast.error("No tienes permisos para eliminar tareas");
      return;
    }
    setTaskToDelete(task); 
    setJustification("");
    setJustificationError("");
    setDeleteDialogOpen(true); 
  };
  
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    if (isManager && !justification.trim()) {
      setJustificationError("Debes proporcionar una justificación para eliminar esta tarea");
      return;
    }
    
    setIsDeleting(true);
    
    deleteTaskMutation.mutate(taskToDelete.id, { 
      onSuccess: () => { 
        toast.success("Tarea eliminada correctamente"); 
        setDeleteDialogOpen(false); 
        setTaskToDelete(null); 
        setJustification("");
        refetchTasks(); 
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
      onError: (error: any) => toast.error(` Error: ${error.message || 'No tienes permisos'}`) 
    });
    setIsDeleting(false);
  };

  const handleUpdateTask = (updatedData: any) => {
    if (!canEditTask) {
      toast.error("No tienes permisos para editar tareas");
      return;
    }
    if (!taskToEdit) return;
    
    if (taskToEdit.completed) {
      toast.warning("No puedes editar una tarea completada");
      return;
    }
    
    updateTaskMutation.mutate({ id: taskToEdit.id, data: updatedData }, { 
      onSuccess: () => { 
        toast.success("Tarea actualizada"); 
        setEditModalOpen(false); 
        setTaskToEdit(null); 
        refetchTasks();
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }, 
      onError: (error: any) => toast.error(`Error: ${error.message}`) 
    });
  };

  const handleEditTask = (task: Task) => {
    if (!canEditTask) {
      toast.error("No tienes permisos para editar tareas");
      return;
    }
    
    if (task.completed) {
      toast.warning("No puedes editar una tarea que ya está completada");
      return;
    }
    
    const original = tasksData?.find(t => String(t.id) === task.id);
    if (original) { 
      setTaskToEdit(original); 
      setEditModalOpen(true); 
    } else { 
      setTaskToEdit(task); 
      setEditModalOpen(true); 
    }
  };

  const tasks: Task[] = (tasksData || []).map(t => {
    const tx = t as any;
    const hours = tx.duration_in_minutes 
      ? (tx.duration_in_minutes / 60) 
      : (t.start_time && t.end_time 
          ? Math.abs(new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / 3600000 
          : 0);
    
    return { 
      id: String(t.id), 
      title: t.description || t.title || "Tarea sin descripción", 
      date: t.start_time?.split('T')[0] || '', 
      startTime: t.start_time?.split('T')[1]?.substring(0,5) || '', 
      endTime: t.end_time?.split('T')[1]?.substring(0,5) || '', 
      project: t.projects?.name || "General", 
      project_id: t.project_id,
      serviceType: t.services?.name || "General", 
      completed: t.status === 'Completed',
      status: t.status || 'Pending',
      hours: hours,
      normal_hours: tx.normal_hours || 0, 
      overtime_hours: tx.overtime_hours || 0, 
      normal_pay: tx.normal_pay || 0, 
      overtime_pay: tx.overtime_pay || 0, 
      total_pay: tx.total_pay || 0, 
      isHoliday: tx.is_holiday || false,
      technician_id: t.technician_id,
      created_by: t.created_by,
    };
  });

  const filteredTasks = tasks.filter(t => {
    if (isAdmin || isManager) {
      const matchesProject = projectFilter === "all" || (t as any).project_id === projectFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "completed" && t.completed) ||
        (statusFilter === "pending" && !t.completed && (t as any).status !== 'In Progress') ||
        (statusFilter === "in_progress" && (t as any).status === 'In Progress');
      return matchesProject && matchesStatus;
    }
    
    if (isTechnician) {
      if (t.technician_id !== user?.id) return false;
      const matchesProject = projectFilter === "all" || (t as any).project_id === projectFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "completed" && t.completed) ||
        (statusFilter === "pending" && !t.completed) ||
        (statusFilter === "in_progress" && (t as any).status === 'In Progress');
      return matchesProject && matchesStatus;
    }
    
    return false;
  });

  const canDeleteSpecificTask = (task: any) => {
    if (isAdmin) return false;
    if (isManager) return true;
    if (isTechnician) return task.technician_id === user?.id;
    return false;
  };

  const canEditSpecificTask = (task: any) => {
    if (isAdmin) return false;
    if (task.completed) return false;
    if (isManager) return true;
    if (isTechnician) return task.technician_id === user?.id;
    return false;
  };

  const completedHours = filteredTasks
    .filter(t => t.completed)
    .reduce((acc, t) => acc + t.hours, 0);

  const totalHours = filteredTasks.reduce((acc, t) => acc + t.hours, 0);
  const completedTasksCount = filteredTasks.filter(t => t.completed).length;
  const pendingTasksCount = filteredTasks.filter(t => !t.completed).length;
  const inProgressTasksCount = filteredTasks.filter(t => (t as any).status === 'In Progress').length;

  const stats = {
    total: filteredTasks.length,
    hours: totalHours,
    completed: completedTasksCount,
    pending: pendingTasksCount,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [projectFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages;
  const hasPrevious = currentPage > 1;

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  // Funciones de exportación
  const FILA_INICIO = 16;
  const FILA_FIN = 44;
  const TAREAS_POR_PAGINA = FILA_FIN - FILA_INICIO + 1;

  const exportExcel = async (
    tasksToExport: Task[],
    projectName?: string,
    paginaActual?: number,
    totalPaginas?: number,
    nombreZip?: string
  ): Promise<{ blob: Blob; nombre: string } | void> => {
    const ExcelJS = await import('exceljs');
    const response = await fetch('https://ldjuetrvmvmrudtzypyr.supabase.co/storage/v1/object/public/logos/Plantilla.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.getWorksheet(1);
    sheet.name = 'Bytes Creativos';

    const setVal = (ref: string, val: any) => { 
      const cell = sheet.getCell(ref); 
      cell.value = val; 
      if (cell.font?.bold) cell.font = { ...cell.font, bold: false }; 
      cell.alignment = { ...cell.alignment, vertical: 'middle', horizontal: 'left' }; 
    };
    
    const userName = profile?.full_name || user?.email?.split('@')[0] || 'N/A';
    const firstTask = tasksToExport[0];
    const projData = projectsList?.find((p: any) => p.name === (firstTask.project || 'General'));
    const clientId = projData?.client_id;
    const clientData = clientId ? clients.find((c: any) => c.id === clientId) || {} : {};
    const contactData = (clientData as any)?.contacts?.[0] || {};

    const pagActual = paginaActual || 1;
    const pagTotal = totalPaginas || 1;

    setVal('L1', 'HMW-' + format(new Date(), 'yyyyMMdd-HHmmss'));
    setVal('L2', format(new Date(), 'dd/MM/yyyy'));
    setVal('L3', `${pagActual} de ${pagTotal}`);
    setVal('C6', clientData.name || projectName || firstTask.project || 'General');
    setVal('I6', contactData.name || userName);
    setVal('C7', clientData.ruc || clientData.code || 'N/A');
    setVal('I7', contactData.position || 'N/A');
    setVal('C8', clientData.department || 'N/A');
    setVal('I8', contactData.phone || 'N/A');
    setVal('D10', clientData.channel || 'Digital');
    setVal('J10', firstTask.serviceType || 'N/A');
    setVal('D11', userName);

    tasksToExport.forEach((task, i) => {
      const t = task as any; 
      const row = FILA_INICIO + i; 
      if (row > FILA_FIN) return;
      
      const fecha = task.date;
      const diaNumero = new Date(fecha + 'T12:00:00').getDay();
      
      const tipo = t.isHoliday ? 'DF' 
        : diaNumero === 0 ? 'DF' 
        : diaNumero === 6 ? 'EH' 
        : t.overtime_hours > 0 ? 'EH' 
        : 'HO';
      
      const factor = tipo === 'DF' ? 2 : tipo === 'EH' ? 1.5 : 1;
      const hDef = ((t.normal_hours * factor + t.overtime_hours * factor) || 0).toFixed(1);
      
      setVal(`B${row}`, t.description || task.title || '');
      setVal(`D${row}`, task.date);
      setVal(`E${row}`, task.startTime);
      setVal(`F${row}`, task.endTime);
      setVal(`G${row}`, tipo);
      setVal(`H${row}`, task.hours.toFixed(1));
      setVal(`I${row}`, hDef);
      setVal(`J${row}`, task.completed ? 'C' : '');
      setVal(`K${row}`, !task.completed ? 'P' : '');
      setVal(`L${row}`, t.notes || '');

      ['D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
        const cell = sheet.getCell(`${col}${row}`);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      sheet.getCell(`G${row}`).font = { name: 'Calibri', size: 12 };
    });

    const totHrs = tasksToExport.reduce((a, t) => a + t.hours, 0);
    sheet.getCell('I45').value = totHrs.toFixed(1);
    setVal('C47', tasksToExport[0]?.notes || 'Ninguna');

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (nombreZip && totalPaginas && totalPaginas > 1) {
      return { blob, nombre: `${nombreZip}_p${pagActual}.xlsx` };
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url;

    let nombreArchivo = '';
    if (projectName) {
      nombreArchivo = `TAREAS_${projectName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim().replace(/\s+/g, '_').toUpperCase()}`;
    } else {
      nombreArchivo = `TAREAS_TODAS_${format(new Date(), 'yyyyMMdd')}`;
    }

    a.download = `${nombreArchivo}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(' Excel exportado correctamente');
  };

  const exportarPorLotes = async (tasksToExport: Task[], projectName?: string) => {
    const totalPaginas = Math.ceil(tasksToExport.length / TAREAS_POR_PAGINA);
    if (totalPaginas === 0) { 
      toast.error('No hay tareas para exportar'); 
      return; 
    }

    let nombreBase = '';
    if (projectName) {
      nombreBase = `TAREAS_${projectName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim().replace(/\s+/g, '_').toUpperCase()}`;
    } else {
      nombreBase = `TAREAS_TODAS_${format(new Date(), 'yyyyMMdd')}`;
    }

    if (totalPaginas === 1) { 
      await exportExcel(tasksToExport, projectName, 1, 1); 
      return; 
    }

    toast.info(`Generando ZIP con ${totalPaginas} archivos...`);
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      const inicio = (pagina - 1) * TAREAS_POR_PAGINA;
      const fin = inicio + TAREAS_POR_PAGINA;
      const lote = tasksToExport.slice(inicio, fin);
      const resultado = await exportExcel(lote, projectName, pagina, totalPaginas, nombreBase);
      if (resultado) zip.file(resultado.nombre, resultado.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `${nombreBase}.zip`; 
    a.click();
    URL.revokeObjectURL(url);
    toast.success(` ZIP descargado con ${totalPaginas} archivos`);
  };

  const handleExportByProjectExcel = (projectId: string, projectName: string) => {
    if (!canExport) {
      toast.error("No tienes permisos para exportar tareas");
      return;
    }
    const projectTasks = tasks.filter((t: any) => t.project_id === projectId);
    if (projectTasks.length === 0) { 
      toast.error(`No hay tareas de "${projectName}"`); 
      return; 
    }
    exportarPorLotes(projectTasks, projectName);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* 1. HEADER - ESTILO SERVICES */}
        {/* ═══════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/20">
                <Clock className="h-7 w-7 text-white" />
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
                  Gestiona y registra tus horas de trabajo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canCreateTask && (
                <Button
                  onClick={() => setCreateTaskModalOpen(true)}
                  className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
                >
                  <Plus className="h-4 w-4" /> Nueva Tarea
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 2. KPI CARDS - ESTILO SERVICES */}
        {/* ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Total Tareas", value: stats.total, sub: `${stats.pending} pendientes` },
            { icon: TrendingUp, label: "Horas Completadas", value: `${completedHours.toFixed(1)}h`, sub: `${stats.completed} tareas completadas` },
            { icon: CheckCircle, label: "Completadas", value: stats.completed, sub: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% del total` },
            { icon: AlertTriangle, label: "Pendientes", value: stats.pending, sub: `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% del total` },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/15 bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 hover:border-[#0DA2E7]/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.04] transition-transform duration-500 group-hover:scale-150"
                style={{ backgroundColor: "#0DA2E7" }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{metric.sub}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-all duration-300 group-hover:bg-[#0DA2E7]/20 group-hover:scale-110">
                  <metric.icon className="h-5 w-5 text-[#0DA2E7]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 3. BARRA DE HERRAMIENTAS - ESTILO SERVICES */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />

          <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-card/50 p-1 shadow-sm backdrop-blur-sm">
            {/* Dropdown de filtros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
                    title="Filtros"
                  >
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {(projectFilter !== "all" || statusFilter !== "all") && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#0DA2E7] ring-2 ring-background" />
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                sideOffset={5}
                className="w-64 bg-card border-border shadow-xl rounded-xl p-3"
              >
                <div className="space-y-4">
                  {/* Filtro por Proyecto */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Proyecto
                    </label>
                    <Select
                      value={projectFilter}
                      onValueChange={(v) => { 
                        setProjectFilter(v);
                        handleFilterChange('project', v);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/50 w-full">
                        <SelectValue placeholder="Todos los proyectos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los proyectos</SelectItem>
                        {projectsList?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Estado */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Estado
                    </label>
                    <div className="flex flex-col gap-1">
                      {[
                        { value: "all", label: "Todos" },
                        { value: "pending", label: "Pendientes", dot: "bg-amber-500" },
                        { value: "in_progress", label: "En progreso", dot: "bg-blue-500" },
                        { value: "completed", label: "Completadas", dot: "bg-emerald-500" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { 
                            setStatusFilter(option.value);
                            handleFilterChange('status', option.value);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                            statusFilter === option.value 
                              ? "bg-[#0DA2E7]/10 text-[#0DA2E7] font-medium" 
                              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {option.dot && <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(projectFilter !== "all" || statusFilter !== "all") && (
                    <div className="pt-1 border-t border-border/30">
                      <button
                        onClick={() => { 
                          setProjectFilter("all");
                          setStatusFilter("all");
                          handleFilterChange('project', 'all');
                          handleFilterChange('status', 'all');
                        }}
                        className="text-[10px] text-muted-foreground hover:text-[#0DA2E7] transition-colors w-full text-center"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separador */}
            <div className="h-6 w-px bg-border/50" />

            {/* Contador */}
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5">
              {filteredTasks.length}
            </span>

            {/* Separador */}
            <div className="h-6 w-px bg-border/50" />

            {/* 🔥 BOTÓN DE VISTA - Ahora guarda en el perfil */}
            <button
              onClick={() => {
                const newMode = viewMode === "list" ? "calendar" : "list";
                handleViewChange(newMode);
              }}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#0DA2E7]/10 transition-all duration-200"
              title={viewMode === "list" ? "Vista de calendario" : "Vista de lista"}
            >
              <motion.div
                key={viewMode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {viewMode === "list" ? (
                  <Calendar className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 4. LISTA DE TAREAS */}
        {/* ═══════════════════════════════════════ */}
        {isLoadingTasks ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: HORMI_BLUE }} />
            <p className="text-sm text-muted-foreground mt-3">Cargando tareas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20"
          >
            <Clock className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium text-foreground">No hay tareas</p>
            <p className="text-sm text-muted-foreground mt-1">Ajusta los filtros o crea una nueva tarea</p>
            {canCreateTask && (
              <Button 
                variant="outline" 
                className="mt-4 border-[#0DA2E7]/20 text-[#0DA2E7] hover:bg-[#0DA2E7]/5"
                onClick={() => setCreateTaskModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {viewMode === "calendar" ? (
                <TaskCalendar 
                  tasks={filteredTasks} 
                  view={calendarView} 
                  onTaskClick={canEditTask ? handleEditTask : undefined}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                    <div className="p-3 border-b border-border/30 bg-muted/10 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Mostrando {filteredTasks.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length)} de {filteredTasks.length} tareas
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={!hasPrevious}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                          {currentPage}/{totalPages || 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={!hasMore}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <TaskList 
                      tasks={displayedTasks.map(task => ({
                        ...task,
                        canEdit: canEditSpecificTask(task),
                        canDelete: canDeleteSpecificTask(task),
                      }))}
                      onEditTask={canEditTask ? handleEditTask : undefined}
                      onDeleteTask={canDeleteTask ? handleDeleteTask : undefined}
                      onTaskClick={handleTaskClick}
                    />
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7]"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={!hasPrevious}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          className={cn(
                            "h-8 w-8 text-xs rounded-lg transition-all",
                            currentPage === page
                              ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20 hover:bg-[#0B8BC7]"
                              : "border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7]"
                          )}
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border/50 hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7]"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={!hasMore}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 5. MODALES */}
      {/* ═══════════════════════════════════════ */}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative p-5 bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent border-b border-border">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
            <div className="flex items-center gap-3 relative">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 ring-4 ring-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Eliminar Tarea</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {taskToDelete && (
              <div className="p-4 rounded-xl bg-muted/10 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                    <Clock className="h-4 w-4 text-[#0DA2E7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {taskToDelete.title || "Tarea sin título"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{taskToDelete.startTime} - {taskToDelete.endTime}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="truncate">{taskToDelete.project || "Sin proyecto"}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                    {taskToDelete.completed ? "Completada" : (taskToDelete.status === 'In Progress' ? "En progreso" : "Pendiente")}
                  </Badge>
                </div>
              </div>
            )}
            
            <p className="text-sm text-foreground">
              ¿Estás seguro de que deseas eliminar esta tarea permanentemente?
            </p>
            
            {isManager && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="text-red-500">*</span>
                  Justificación
                </Label>
                <Textarea
                  value={justification}
                  onChange={(e) => {
                    setJustification(e.target.value);
                    setJustificationError("");
                  }}
                  placeholder="Explica el motivo por el cual estás eliminando esta tarea..."
                  className="min-h-[80px] text-sm bg-background border-border rounded-lg resize-none focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all"
                />
                {justificationError && <p className="text-xs text-red-500">{justificationError}</p>}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-muted-foreground/50" />
                  Esta justificación quedará registrada en el historial del sistema
                </p>
              </div>
            )}
            
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">
                Se eliminarán todos los datos de la tarea. No podrás recuperarlos.
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 pt-0 gap-2 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 h-10 rounded-xl hover:bg-muted/50 transition-all"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTask}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-xl font-medium gap-1.5 shadow-sm hover:shadow-md transition-all"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modales de tareas */}
      {canEditTask && (
        <TaskEditModal 
          task={taskToEdit} 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen} 
          onSuccess={handleUpdateTask} 
        />
      )}
      
      {canCreateTask && (
        <CreateTaskModal
          open={createTaskModalOpen}
          onOpenChange={(open) => setCreateTaskModalOpen(open)}
          projects={projectsList || []}
          services={servicesList}
          onSuccess={handleCreateTask}
        />
      )}

      {/* 🔥 MODAL DE DETALLE DE TAREA */}
      <TaskDetailModal
        task={selectedTask}
        open={taskDetailModalOpen}
        onOpenChange={setTaskDetailModalOpen}
        getTechName={getTechName}
        getTechInitials={getTechInitials}
        getProjectName={getProjectName}
        getClientName={getClientName}
        getServiceName={getServiceName}
      />
    </DashboardLayout>
  );
};

export default Tasks;