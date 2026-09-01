import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Plus, Search, Calendar as CalendarIcon, Clock, X,
  Pencil, Loader2, Trash2, Crown, Users,
  FolderKanban, CheckCircle, TrendingUp, Building2, ChevronLeft, ChevronRight, Filter,
  LayoutGrid, LayoutList, Lock,
  ArrowUp, ArrowDown, FileSpreadsheet
} from "lucide-react";
import { ProjectDetailModal } from "@/components/projects/ProjectDetailModal";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectExportDialog } from "@/components/projects/ProjectExportDialog";
import { cn } from "@/lib/utils";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClientes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

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
  const [searchQuery, setSearchQuery] = useState(savedFilters?.searchQuery || "");
  const [statusFilter, setStatusFilter] = useState(savedFilters?.statusFilter || "all");
  const [clientFilter, setClientFilter] = useState<string>(savedFilters?.clientFilter || "all");
  const [memberFilter, setMemberFilter] = useState<string>(savedFilters?.memberFilter || "all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(
    savedFilters?.dateRange || {}
  );
  const [progressRange, setProgressRange] = useState<[number, number]>(
    savedFilters?.progressRange || [0, 100]
  );

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

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // ORDENAMIENTO
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Carrusel
  const [carouselPage, setCarouselPage] = useState(0);
  const projectsPerCarousel = 6;

  // Vista
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(() => {
    if (profile?.preferences?.projects_view) {
      return profile.preferences.projects_view;
    }
    const saved = localStorage.getItem("projectsViewMode");
    return (saved === "grid" || saved === "compact") ? saved : "grid";
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: rawProjects = [], isLoading: loading, refetch } = useProjects();
  const { data: clients = [] } = useClients("");

  // Guardar filtros en localStorage (fallback)
  useEffect(() => {
    const filters = {
      searchQuery,
      statusFilter,
      clientFilter,
      memberFilter,
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString(),
      },
      progressRange,
    };
    saveFilters(filters);
  }, [searchQuery, statusFilter, clientFilter, memberFilter, dateRange, progressRange]);

  useEffect(() => {
    if (profile?.preferences?.projects_view) {
      setViewMode(profile.preferences.projects_view);
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

  const loadProjectMembers = async () => {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, profiles(id, full_name, avatar_url, role)');
    if (!error) setProjectMembers(data || []);
  };

  useEffect(() => {
    loadProjectMembers();
  }, [rawProjects]);

  const toggleViewMode = async () => {
    setIsTransitioning(true);
    const newMode = viewMode === 'grid' ? 'compact' : 'grid';
    setViewMode(newMode);
    
    try {
      await updatePreferences({ projects_view: newMode });
    } catch (error) {
      console.error('Error guardando preferencia de vista:', error);
    }
    
    localStorage.setItem("projectsViewMode", newMode);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const getProjectLeader = (projectId: string) => {
    const leader = projectMembers.find(pm => pm.project_id === projectId && pm.role_in_project === 'leader');
    if (leader?.profiles) return { name: leader.profiles.full_name || 'Sin nombre', avatar: leader.profiles.avatar_url || '', id: leader.profiles.id };
    return null;
  };

  const getProjectTeam = (projectId: string) => {
    return projectMembers.filter(pm => pm.project_id === projectId && pm.role_in_project !== 'leader')
      .map(pm => ({ name: pm.profiles?.full_name || 'Sin nombre', avatar: pm.profiles?.avatar_url || '', id: pm.profiles?.id, role: pm.role_in_project }));
  };

  const allMembers = useMemo(() => {
    const memberMap = new Map();
    projectMembers.forEach(pm => {
      if (pm.profiles?.id && !memberMap.has(pm.profiles.id)) {
        memberMap.set(pm.profiles.id, {
          id: pm.profiles.id,
          name: pm.profiles.full_name || 'Sin nombre',
          avatar: pm.profiles.avatar_url || '',
          role: pm.profiles.role
        });
      }
    });
    return Array.from(memberMap.values());
  }, [projectMembers]);

  const projects = rawProjects.map((item: any) => {
    const leader = getProjectLeader(item.id);
    const team = getProjectTeam(item.id);
    const projectTasks = item.tasks || [];
    
    const completedHours = projectTasks
      .filter((t: any) => t.status === 'Completed')
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
  
    const totalHoursFromDates = calculateTotalHours(item.start_date, item.end_date);
    const hoursPool = item.pool_hours && item.pool_hours > 0 
      ? item.pool_hours 
      : totalHoursFromDates || 0;
    
    const progress = hoursPool > 0 
      ? Math.min(((completedHours / hoursPool) * 100), 100) 
      : 0;
    
    const isClosed = item.status === 'completed' || progress >= 100;
    const isDelayed = new Date(item.end_date || new Date()) < new Date() && progress < 100 && !isClosed;
    
    let status = item.status || "active";
    if (isClosed) status = "completed";
    else if (completedHours > 0 && progress < 100) status = "In Progress";
    else if (completedHours === 0 && !isClosed) status = "Not Started";
    
    return {
      id: item.id,
      name: item.name,
      client: item.clients?.name || "Sin cliente",
      clientId: item.client_id,
      status: status,
      hoursPool: hoursPool,
      hoursConsumed: hoursConsumed,
      completedHours: completedHours,
      progress: progress,
      totalTasks: projectTasks.length,
      completedTasksCount: projectTasks.filter((t: any) => t.status === 'Completed').length,
      endDate: item.end_date || new Date().toISOString(),
      startDate: item.start_date,
      rate: item.hourly_rate || 0,
      isClosed: isClosed,
      isDelayed: isDelayed,
      isInactive: item.status === 'inactive',
      teamLead: leader || { name: "Sin líder", avatar: "", id: undefined },
      team: team,
      tasks: projectTasks,
    };
  });

  const sortProjects = (projectsList: any[]) => {
    return [...projectsList].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "endDate":
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "hours":
          comparison = a.hoursConsumed - b.hoursConsumed;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.client.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesClient = clientFilter === "all" || p.clientId === clientFilter;
      const matchesMember = memberFilter === "all" || 
        p.team.some(m => m.id === memberFilter) || 
        p.teamLead.id === memberFilter;
      const matchesDate = !dateRange.from || !dateRange.to || 
        (new Date(p.endDate) >= dateRange.from && new Date(p.endDate) <= dateRange.to);
      const matchesProgress = p.progress >= progressRange[0] && p.progress <= progressRange[1];
      
      if (isAdmin || isManager) {
        return matchesSearch && matchesStatus && matchesClient && matchesMember && matchesDate && matchesProgress;
      }
      if (userRole === 'Technician') {
        const isAssigned = p.team.some(m => m.id === user?.id) || p.teamLead.id === user?.id;
        return matchesSearch && matchesStatus && matchesClient && matchesMember && matchesDate && matchesProgress && isAssigned;
      }
      return matchesSearch && matchesStatus && matchesClient && matchesMember && matchesDate && matchesProgress;
    });
    
    return sortProjects(filtered);
  }, [projects, searchQuery, statusFilter, clientFilter, memberFilter, dateRange, progressRange, sortBy, sortOrder, isAdmin, isManager, userRole, user?.id]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (clientFilter !== "all") count++;
    if (memberFilter !== "all") count++;
    if (dateRange.from || dateRange.to) count++;
    if (progressRange[0] > 0 || progressRange[1] < 100) count++;
    return count;
  }, [statusFilter, clientFilter, memberFilter, dateRange, progressRange]);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setClientFilter("all");
    setMemberFilter("all");
    setDateRange({});
    setProgressRange([0, 100]);
    setSearchQuery("");
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
      // ✅ Resetear el estado de edición al cerrar
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

        {/* ═══════════ BARRA DE HERRAMIENTAS - SIN BUSCADOR ═══════════ */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-1">
            {/* Filtros - 3 puntos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-muted/50 rounded-md text-muted-foreground relative"
                >
                  <span className="text-xl font-bold leading-none tracking-wider">⋯</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#0DA2E7] text-white text-[9px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2.5 bg-card border-border shadow-xl rounded-xl max-h-[80vh] overflow-y-auto">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Estado</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-6 text-[10px] mt-0.5 border-border/60 px-2">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Todos</SelectItem>
                          <SelectItem value="In Progress" className="text-xs">En Progreso</SelectItem>
                          <SelectItem value="active" className="text-xs">Activos</SelectItem>
                          <SelectItem value="completed" className="text-xs">Cerrados</SelectItem>
                          <SelectItem value="inactive" className="text-xs">Inactivos</SelectItem>
                          <SelectItem value="on-hold" className="text-xs">En Pausa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Cliente</Label>
                      <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger className="h-6 text-[10px] mt-0.5 border-border/60 px-2">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Todos</SelectItem>
                          {clients.map((c: any) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Miembro</Label>
                    <Select value={memberFilter} onValueChange={setMemberFilter}>
                      <SelectTrigger className="h-6 text-[10px] mt-0.5 border-border/60 px-2">
                        <SelectValue placeholder="Todos los miembros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos</SelectItem>
                        {allMembers.map((m: any) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={m.avatar} />
                                <AvatarFallback className="text-[6px]">{m.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <span>{m.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Fecha de fin</Label>
                    <div className="flex gap-1 mt-0.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(
                            "h-6 text-[9px] flex-1 px-1.5 border-border/60",
                            dateRange.from && "border-[#0DA2E7]/50"
                          )}>
                            <CalendarIcon className="h-2.5 w-2.5 mr-0.5" />
                            {dateRange.from ? format(dateRange.from, "dd/MM/yy") : "Desde"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 bg-card border-border shadow-xl rounded-xl w-auto">
                          <Calendar 
                            mode="single" 
                            selected={dateRange.from} 
                            onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))} 
                            locale={es}
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(
                            "h-6 text-[9px] flex-1 px-1.5 border-border/60",
                            dateRange.to && "border-[#0DA2E7]/50"
                          )}>
                            <CalendarIcon className="h-2.5 w-2.5 mr-0.5" />
                            {dateRange.to ? format(dateRange.to, "dd/MM/yy") : "Hasta"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 bg-card border-border shadow-xl rounded-xl w-auto">
                          <Calendar 
                            mode="single" 
                            selected={dateRange.to} 
                            onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))} 
                            locale={es}
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex justify-between">
                      <span>Progreso</span>
                      <span className="font-normal text-[#0DA2E7] text-[9px]">{Math.round(progressRange[0])}% - {Math.round(progressRange[1])}%</span>
                    </Label>
                    <Slider
                      value={progressRange}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setProgressRange(value as [number, number])}
                      className="mt-0.5"
                    />
                  </div>

                  <div className="pt-1 border-t border-border/30">
                    <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Ordenar por</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        className="h-5 w-5 p-0 hover:bg-[#0DA2E7]/10"
                        title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
                      >
                        {sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-6 text-[10px] mt-0.5 border-border/60 px-2">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name" className="text-xs">Nombre</SelectItem>
                        <SelectItem value="endDate" className="text-xs">Fecha fin</SelectItem>
                        <SelectItem value="progress" className="text-xs">Progreso</SelectItem>
                        <SelectItem value="hours" className="text-xs">Horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-1.5 pt-1.5 border-t border-border/30">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-[9px] h-6 hover:bg-muted/50 px-1"
                      onClick={clearAllFilters}
                    >
                      Limpiar
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 text-[9px] h-6 text-white px-1"
                      style={{ background: HORMI_GRADIENT }}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Contador */}
            <div className="flex items-center justify-center min-w-[32px] h-8 px-2">
              <span className="text-xs text-muted-foreground font-medium">
                {formatNumber(filteredProjects.length)}
              </span>
            </div>

            {/* Vista */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleViewMode}
              className="h-8 w-8 p-0 hover:bg-muted/50 rounded-md text-muted-foreground"
              title={viewMode === 'grid' ? 'Vista compacta' : 'Vista grid'}
            >
              {viewMode === 'grid' ? (
                <LayoutList className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* ═══════════ CARRUSEL ═══════════ */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" style={{ color: HORMI_BLUE }} /></div>
        ) : filteredProjects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-xl border border-border bg-card">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron proyectos</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Prueba ajustar los filtros de búsqueda</p>
          </motion.div>
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
                  className={cn(
                    "grid gap-4 transition-all duration-200 p-5 rounded-xl bg-muted/30 border border-border/40",
                    viewMode === 'grid' ? "md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  )}
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
                          compact={viewMode === 'compact'}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Eliminar Proyecto</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-muted-foreground">¿Eliminar <strong className="text-red-500">"{deleteDialog.projectName}"</strong>?</p></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, projectId: '', projectName: '' })}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 DIÁLOGO DE EXPORTACIÓN */}
      <ProjectExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        projects={filteredProjects}
      />

      <ProjectDetailModal project={selectedProject} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
      
      {/* 🔥 MODAL DE FORMULARIO - CON HANDLER DE CIERRE CORREGIDO */}
      <ProjectFormModal 
        open={formModalOpen} 
        onOpenChange={handleFormModalClose} 
        project={editingProject} 
      />
    </DashboardLayout>
  );
}