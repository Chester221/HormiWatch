import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard, ProjectListRow } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Clock,
  Loader2, Trash2, Archive, AlertTriangle,
  FolderKanban, CheckCircle, TrendingUp, ChevronLeft, ChevronRight,
  LayoutGrid, LayoutList,
  FileSpreadsheet
} from "lucide-react";
import { ProjectDetailModal } from "@/components/projects/ProjectDetailModal";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectExportDialog } from "@/components/projects/ProjectExportDialog";
import ProjectFilters from "@/components/projects/ProjectFilters";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClientes";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

// 🔥 FUNCIONES AUXILIARES
const formatProgress = (value: number): string => {
  if (value >= 10) return Math.round(value).toString();
  if (value === 0) return '0';
  return value.toFixed(1);
};

const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// 🔥 NORMALIZA PARA COMPARAR ESTADOS (enum backend y legado)
const normStatusKey = (status?: string | null): string =>
  String(status ?? "").toUpperCase().replace(/[^A-Z]/g, "");

const matchesProjectStatus = (p: {
  statusRaw?: string | null;
  status?: string | null;
  isClosed?: boolean;
}, filter: string): boolean => {
  if (filter === "all") return true;
  const want = normStatusKey(filter);
  const raw = normStatusKey(p?.statusRaw);
  const derived = normStatusKey(p?.status);
  switch (want) {
    case "COMPLETED": return raw === "COMPLETED" || derived === "COMPLETED";
    case "CANCELLED": return raw === "CANCELLED";
    case "INPROGRESS": return raw === "INPROGRESS" || derived === "INPROGRESS";
    case "NOTSTARTED": return raw === "PENDING" || derived === "NOTSTARTED";
    case "ONHOLD": return raw === "ONHOLD" || raw === "ON-HOLD" || raw === "INACTIVE";
    case "ACTIVE": return !p?.isClosed && raw !== "CANCELLED";
    case "INACTIVE": return !!p?.isClosed;
    default: return !!raw && raw === want;
  }
};

const statusConfig: Record<string, { label: string; class: string; color: string }> = {
  active: { label: "Activo", class: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#10b981" },
  completed: { label: "Cerrado", class: "bg-gray-100 text-gray-600 border-gray-300", color: "#6b7280" },
  "on-hold": { label: "En Pausa", class: "bg-amber-50 text-amber-700 border-amber-200", color: "#f59e0b" },
  "In Progress": { label: "En Progreso", class: "bg-sky-50 text-sky-700 border-sky-200", color: HORMI_BLUE },
  "Not Started": { label: "Sin Empezar", class: "bg-slate-50 text-slate-700 border-slate-200", color: "#6b7280" },
  "Cancelled": { label: "Cancelado", class: "bg-red-50 text-red-700 border-red-200", color: "#ef4444" },
  inactive: { label: "Inactivo", class: "bg-amber-50 text-amber-700 border-amber-200", color: "#f59e0b" },
  default: { label: "Activo", class: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#10b981" }
};

export default function Projects() {
  const FILTERS_STORAGE_KEY = 'hormiwatch_project_filters';

  const { profile, updatePreferences } = useAuth();

  const saveFilters = (filters: any) => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const loadFilters = () => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dateRange?.from) parsed.dateRange.from = new Date(parsed.dateRange.from);
        if (parsed.dateRange?.to) parsed.dateRange.to = new Date(parsed.dateRange.to);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
    return null;
  };

  const savedFilters = loadFilters();

  // Estados
  const [statusFilter, setStatusFilter] = useState(savedFilters?.statusFilter || "all");
  const [clientFilter, setClientFilter] = useState<string>(savedFilters?.clientFilter || "all");

  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const deleteProjectMutation = useDeleteProject();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  const userRole = authProfile?.role;
  const isAdmin = userRole === 'Admin';
  const isManager = userRole === 'Manager';
  const canEdit = isManager;
  const canCreate = isManager;

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({ open: false, projectId: '', projectName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Carrusel
  const [carouselPage, setCarouselPage] = useState(0);
  const projectsPerCarousel = 6;

  // Vista
  type ViewMode = 'grid' | 'list';
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (profile?.preferences?.projects_view === "grid" || profile?.preferences?.projects_view === "list") {
      return profile.preferences.projects_view as ViewMode;
    }
    const saved = localStorage.getItem("projectsViewMode");
    return (saved === "grid" || saved === "list") ? saved as ViewMode : "grid";
  });

  const { data: rawProjects = [], isLoading: loading, refetch } = useProjects();
  const { data: clients = [] } = useClients("");

  // Guardar filtros en localStorage (fallback)
  useEffect(() => {
    const filters = {
      statusFilter,
      clientFilter,
    };
    saveFilters(filters);
  }, [statusFilter, clientFilter]);

  useEffect(() => {
    const pv = profile?.preferences?.projects_view;
    if (pv === "grid" || pv === "list") {
      setViewMode(pv);
    }
  }, [profile]);

  useEffect(() => {
    refetch();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  // ✅ CORREGIDO: loadProjectMembers con verificación de array
  const loadProjectMembers = async () => {
    try {
      const response = await usersApi.getAll();
      const members = Array.isArray(response) ? response : response?.records || response?.data || [];
      const formattedMembers = members.map((m: any) => ({
        id: m.id,
        user_id: m.id,
        profile: {
          id: m.id,
          full_name: m.full_name || m.name || 'Sin nombre',
          avatar_url: m.avatar_url || null,
          role: m.role || 'Technician'
        }
      }));
      setProjectMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading project members:', error);
      setProjectMembers([]);
    }
  };

  useEffect(() => {
    loadProjectMembers();
  }, [rawProjects]);

  const toggleViewMode = async () => {
    const next: ViewMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(next);
    setCarouselPage(0);

    try {
      await updatePreferences({ projects_view: next });
    } catch (error) {
      console.error('Error guardando preferencia de vista:', error);
    }

    localStorage.setItem("projectsViewMode", next);
  };

  // ✅ FUNCIONES CORREGIDAS - Usan los datos del proyecto directamente
  const getProjectLeader = (item: any) => {
    // Primero intentar con los datos del backend (projectLeader)
    if (item.projectLeader) {
      const pl = item.projectLeader;
      const fullName = [pl.name, pl.lastName].filter(Boolean).join(' ').trim() || pl.email || 'Sin líder';
      return {
        name: fullName,
        avatar: pl.profilePicture || pl.avatar_url || '',
        id: pl.id || item.project_leader_id || null,
      };
    }
    // Fallback: usar leader_email si existe
    if (item.leader_email) {
      return {
        name: item.leader_name || item.leader_email,
        avatar: '',
        id: item.project_leader_id || null
      };
    }
    return null;
  };

  const getProjectTeam = (item: any) => {
    // Si el proyecto tiene técnicos en la respuesta del backend
    if (item.technicians && Array.isArray(item.technicians)) {
      return item.technicians.map((tech: any) => ({
        name: [tech.name, tech.lastName].filter(Boolean).join(' ').trim() || tech.email || 'Técnico',
        avatar: tech.profilePicture || tech.avatar_url || '',
        id: tech.id,
        role: tech.role || 'technician'
      }));
    }
    return [];
  };

  const allMembers = useMemo(() => {
    const memberMap = new Map();
    projectMembers.forEach(pm => {
      if (pm.profile?.id && !memberMap.has(pm.profile.id)) {
        memberMap.set(pm.profile.id, {
          id: pm.profile.id,
          name: pm.profile.full_name || 'Sin nombre',
          avatar: pm.profile.avatar_url || '',
          role: pm.profile.role
        });
      }
    });
    return Array.from(memberMap.values());
  }, [projectMembers]);

  // ✅ CORREGIDO: Mapeo de proyectos con datos del backend
  const projects = rawProjects.map((item: any) => {
    const leader = getProjectLeader(item);
    const team = getProjectTeam(item);
    const projectTasks = item.tasks || [];
    
    const completedHours = projectTasks
      .filter((t: any) => t.status === 'Completed' || t.status === 'completed')
      .reduce((total: number, task: any) => {
        if (task.duration_in_minutes) {
          return total + (task.duration_in_minutes / 60);
        }
        if (task.start_time && task.end_time) {
          const hours = Math.abs(
            new Date(task.end_time).getTime() - new Date(task.start_time).getTime()
          ) / 3600000;
          return total + hours;
        }
        if (task.hours) {
          return total + task.hours;
        }
        return total;
      }, 0);
    
    const hoursConsumed = projectTasks.reduce((total: number, task: any) => {
      if (task.duration_in_minutes) {
        return total + (task.duration_in_minutes / 60);
      }
      if (task.start_time && task.end_time) {
        const hours = Math.abs(
          new Date(task.end_time).getTime() - new Date(task.start_time).getTime()
        ) / 3600000;
        return total + hours;
      }
      if (task.hours) {
        return total + task.hours;
      }
      return total;
    }, 0);
    
    const calculateTotalHours = (startDate?: string, endDate?: string): number => {
      if (!startDate || !endDate) return 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffHours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.round(diffHours);
    };
  
    const totalHoursFromDates = calculateTotalHours(item.startDate || item.start_date, item.endDate || item.end_date);
    const hoursPool = item.poolHours || item.pool_hours || totalHoursFromDates || 0;
    
    const progress = hoursPool > 0 
      ? Math.min(((completedHours / hoursPool) * 100), 100) 
      : 0;
    
    const isClosed = item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'completed' || progress >= 100;
    const isDelayed = new Date(item.endDate || item.end_date || new Date()) < new Date() && progress < 100 && !isClosed;
    
    let status = item.status || "active";
    if (isClosed) status = "completed";
    else if (completedHours > 0 && progress < 100) status = "In Progress";
    else if (completedHours === 0 && !isClosed) status = "Not Started";
    
    // ✅ NORMALIZAR CLIENTE - usar customer_name si existe
    const clientName = item.customer_name || item.clients?.name || "Sin cliente";
    const clientId = item.customer_id || item.client_id || null;
    
    return {
      id: item.id,
      name: item.title || item.name || 'Proyecto sin nombre',
      client: clientName,
      clientId: clientId,
      status: status,
      statusRaw: item.status || null,
      hoursPool: hoursPool,
      hoursConsumed: hoursConsumed,
      completedHours: completedHours,
      progress: progress,
      totalTasks: projectTasks.length,
      completedTasksCount: projectTasks.filter((t: any) => t.status === 'Completed' || t.status === 'completed').length,
      endDate: item.endDate || item.end_date || new Date().toISOString(),
      startDate: item.startDate || item.start_date,
      rate: item.hourlyRate || item.hourly_rate || 0,
      isClosed: isClosed,
      isDelayed: isDelayed,
      isInactive: item.status === 'INACTIVE' || item.status === 'inactive',
      teamLead: leader || { name: "Sin líder", avatar: "", id: null },
      team: team,
      tasks: projectTasks,
    };
  });

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(p => {
      const matchesStatus = matchesProjectStatus(p, statusFilter);
      const matchesClient = clientFilter === "all" || p.clientId === clientFilter;

      if (isAdmin || isManager) {
        return matchesStatus && matchesClient;
      }
      if (userRole === 'Technician') {
        const isAssigned = p.team.some(m => m.id === user?.id) || p.teamLead.id === user?.id;
        return matchesStatus && matchesClient && isAssigned;
      }
      return matchesStatus && matchesClient;
    });

    return filtered;
  }, [projects, statusFilter, clientFilter, isAdmin, isManager, userRole, user?.id]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (clientFilter !== "all") count++;
    return count;
  }, [statusFilter, clientFilter]);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setClientFilter("all");
  };

  const totalCarouselPages = Math.ceil(filteredProjects.length / projectsPerCarousel);
  const carouselProjects = filteredProjects.slice(carouselPage * projectsPerCarousel, (carouselPage + 1) * projectsPerCarousel);
  const nextCarousel = () => setCarouselPage(p => (p + 1) % Math.max(totalCarouselPages, 1));
  const prevCarousel = () => setCarouselPage(p => (p - 1 + Math.max(totalCarouselPages, 1)) % Math.max(totalCarouselPages, 1));

  const stats = {
    total: projects.length,
    active: projects.filter(p => !p.isClosed && !p.isInactive).length,
    completed: projects.filter(p => p.isClosed).length,
    delayed: projects.filter(p => p.isDelayed).length,
    inactive: projects.filter(p => p.isInactive).length,
  };

  const inProgressProjects = projects.filter(p => p.status === "In Progress" && !p.isClosed).length;

  const handleProjectClick = (p: any) => { 
    setSelectedProject(p); 
    setDetailModalOpen(true); 
  };

  // Abrir el detalle de un proyecto desde la búsqueda global (?project=id)
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId) return;
    const target = projects.find((p: any) => String(p.id) === projectId);
    if (target) {
      setSelectedProject(target);
      setDetailModalOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, projects]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleCreateProject = () => { 
    if (!canCreate) return; 
    setEditingProject(null); 
    setFormModalOpen(true);
  };
  
  const handleEditProject = (p: any, e?: React.MouseEvent) => { 
    if (!canEdit || p.isClosed) return; 
    if (e) e.stopPropagation(); 
    setEditingProject(p); 
    setFormModalOpen(true);
  };
  
  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => { 
    if (!canEdit) return; 
    e.stopPropagation(); 
    setDeleteDialog({ open: true, projectId: id, projectName: name }); 
  };
  
  const handleMemberClick = (memberId: string, e: React.MouseEvent) => { 
    e.stopPropagation(); 
    navigate(`/team?member=${memberId}`); 
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProjectMutation.mutateAsync({ projectId: deleteDialog.projectId, userId: user?.id || '' });
      toast.success(`"${deleteDialog.projectName}" eliminado`);
      setDeleteDialog({ open: false, projectId: '', projectName: '' });
      refetch();
      loadProjectMembers();
    } catch (error: any) { 
      toast.error(`Error: ${error.message}`); 
    }
    setIsDeleting(false);
  };

  const getStatusColor = (status: string) => statusConfig[status]?.color || HORMI_BLUE;

  // 🔥 Manejar cierre del modal de formulario
  const handleFormModalClose = (open: boolean) => {
    setFormModalOpen(open);
    if (!open) {
      setEditingProject(null);
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/20">
                  <FolderKanban className="h-7 w-7 text-white" />
                </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Proyectos
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {formatNumber(stats.total)} proyectos
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Gestiona los proyectos de tus clientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(true)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Exportar
              </Button>
              {canCreate && (
                <Button
                  onClick={handleCreateProject}
                  className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
                >
                  <Plus className="h-4 w-4" /> Nuevo Proyecto
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { 
              icon: FolderKanban, 
              label: "Total Proyectos", 
              value: formatNumber(stats.total), 
              sub: `${formatNumber(stats.active)} activos · ${formatNumber(stats.completed)} cerrados` 
            },
            { 
              icon: TrendingUp, 
              label: "Activos", 
              value: formatNumber(stats.active), 
              sub: `${Math.round((stats.active / stats.total) * 100) || 0}% del total` 
            },
            { 
              icon: Clock, 
              label: "En Progreso", 
              value: formatNumber(inProgressProjects), 
              sub: "en ejecución" 
            },
            { 
              icon: CheckCircle, 
              label: "Cerrados", 
              value: formatNumber(stats.completed), 
              sub: `${formatNumber(stats.total - stats.completed)} pendientes` 
            },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1.5">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110">
                  <metric.icon className="h-5 w-5 text-[#0DA2E7]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>

        {/* ═══════════ BARRA DE HERRAMIENTAS ═══════════ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ProjectFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              clients={clients}
              clientFilter={clientFilter}
              onClientChange={setClientFilter}
              resultCount={filteredProjects.length}
              activeCount={activeFilterCount}
              onClear={clearAllFilters}
            />

            <div className="h-6 w-px bg-border/50" />
            <span className="whitespace-nowrap px-1.5 text-xs text-muted-foreground">
              {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Vista: botón único que alterna entre grid y lista */}
          <Button
            variant="outline"
            onClick={toggleViewMode}
            className="h-9 shrink-0 gap-2 rounded-lg border-border/60 bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-all hover:border-[#0DA2E7]/40 hover:text-[#0DA2E7]"
            title={viewMode === "grid" ? "Cambiar a vista lista" : "Cambiar a vista cuadrícula"}
          >
            {viewMode === "grid" ? (
              <LayoutList className="h-3.5 w-3.5 text-[#0DA2E7]" />
            ) : (
              <LayoutGrid className="h-3.5 w-3.5 text-[#0DA2E7]" />
            )}
            {viewMode === "grid" ? "Vista Lista" : "Vista Grid"}
          </Button>
        </div>

        {/* ═══════════ LISTADO ═══════════ */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: HORMI_BLUE }} /></div>
        ) : filteredProjects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-xl border border-border bg-card">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron proyectos</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Prueba ajustar los filtros</p>
          </motion.div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Mostrando {formatNumber(filteredProjects.length)} {filteredProjects.length === 1 ? 'proyecto' : 'proyectos'}
            </p>
            <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, idx) => {
                  const statusColor = getStatusColor(project.status);
                  const statusInfo = statusConfig[project.status] || statusConfig.default;
                  const clientData = clients.find((c: any) => c.name === project.client);
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      layout
                      transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25, ease: "easeOut" }}
                    >
                      <ProjectListRow
                        project={project}
                        statusColor={statusColor}
                        statusInfo={statusInfo}
                        clientData={clientData}
                        canEdit={canEdit}
                        handleProjectClick={handleProjectClick}
                        handleEditProject={handleEditProject}
                        handleDeleteClick={handleDeleteClick}
                        handleMemberClick={handleMemberClick}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {carouselPage * projectsPerCarousel + 1}-{Math.min((carouselPage + 1) * projectsPerCarousel, filteredProjects.length)} de {formatNumber(filteredProjects.length)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevCarousel} disabled={totalCarouselPages <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-xs text-muted-foreground min-w-[40px] text-center">{carouselPage + 1}/{Math.max(totalCarouselPages, 1)}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextCarousel} disabled={totalCarouselPages <= 1}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={carouselPage} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  transition={{ duration: 0.25, ease: "easeInOut" }} 
                  className="grid gap-4 rounded-xl bg-muted/30 p-5 transition-all duration-200 border border-border/40 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {carouselProjects.map((project, idx) => {
                    const statusColor = getStatusColor(project.status);
                    const statusInfo = statusConfig[project.status] || statusConfig.default;
                    const clientData = clients.find((c: any) => c.name === project.client);
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          transition: { delay: idx * 0.04, duration: 0.35, ease: "easeOut" }
                        }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        layout
                        transition={{ 
                          layout: { duration: 0.35, ease: "easeInOut" }
                        }}
                      >
                        <ProjectCard
                          key={project.id}
                          project={project}
                          idx={idx}
                          statusColor={statusColor}
                          statusInfo={statusInfo}
                          clientData={clientData}
                          canEdit={canEdit}
                          handleProjectClick={handleProjectClick}
                          handleEditProject={handleEditProject}
                          handleDeleteClick={handleDeleteClick}
                          handleMemberClick={handleMemberClick}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {totalCarouselPages > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: totalCarouselPages }).map((_, i) => (
                  <button key={i} onClick={() => setCarouselPage(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselPage ? 'w-6' : 'w-1.5 bg-muted-foreground/30'}`}
                    style={i === carouselPage ? { backgroundColor: HORMI_BLUE } : {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diálogo Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
          {(() => {
            const deletingProject = projects.find(p => p.id === deleteDialog.projectId);
            return (
              <>
                <DialogHeader>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-3">
                    <Trash2 className="h-7 w-7 text-red-500" />
                  </div>
                  <DialogTitle className="text-center text-lg font-bold text-foreground">Eliminar Proyecto</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-center px-2">
                  <p className="text-sm text-muted-foreground">
                    ¿Seguro que deseas eliminar <strong className="text-red-500">{deleteDialog.projectName}</strong>?
                  </p>
                  <div className="rounded-xl bg-muted/40 border border-border/40 p-3 text-left space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Archive className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      La eliminación es <strong>lógica</strong>: el proyecto se archivará y dejará de aparecer en la lista.
                    </p>
                    {deletingProject && deletingProject.totalTasks > 0 && (
                      <p className="text-xs text-amber-600 flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        Tiene {deletingProject.totalTasks} tarea(s){deletingProject.isClosed
                          ? ", pero al estar cerrado/cancelado podrá eliminarse."
                          : ": solo podrá eliminarse si el proyecto está cerrado o cancelado."}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialog({ open: false, projectId: '', projectName: '' })}
                    className="rounded-lg border-border/60 hover:bg-muted/50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                    Eliminar
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Exportación */}
      <ProjectExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        projects={filteredProjects}
      />

      <ProjectDetailModal project={selectedProject} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
      
      <ProjectFormModal 
        open={formModalOpen} 
        onOpenChange={handleFormModalClose} 
        project={editingProject}
        onSubmit={() => {
          refetch();
        }}
      />
    </DashboardLayout>
  );
}