import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ManageMemberModal } from "@/components/team/ManageMemberModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Search, Mail, Phone, Shield, Wrench, UserCog, Loader2, AlertTriangle,
  FolderKanban, Users, Crown, User as UserIcon, Filter, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Table, Grid3x3, MoreVertical, Pencil, Trash2,
  TrendingUp,
} from "lucide-react";
import { TeamMemberFormModal } from "@/components/team/TeamMemberFormModal";
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember, TeamMember } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = "#0DA2E7";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [manageMemberOpen, setManageMemberOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("teamViewMode");
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });
  const itemsPerPage = 8;
  
  const { data: teamMembers = [], isLoading, refetch } = useTeamMembers();
  const { data: projects = [] } = useProjects();
  const updateMemberMutation = useUpdateTeamMember();
  const deleteMemberMutation = useDeleteTeamMember();
  const { profile } = useAuth();
  const canViewTeam = profile?.role === 'Admin' || profile?.role === 'Manager';
  const isAdmin = profile?.role === 'Admin';
  const isManager = profile?.role === 'Manager';

  const [formModal, setFormModal] = useState<{ open: boolean; member: any }>({ open: false, member: null });
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean; member: TeamMember | null; selectedProjects: string[]; projectRoles: Record<string, string>;
  }>({ open: false, member: null, selectedProjects: [], projectRoles: {} });

  const fetchProjectMembers = async () => {
    const { data } = await supabase.from('project_members').select('*, profiles(*), projects(id, name)');
    setProjectMembers(data || []);
  };

  useEffect(() => { fetchProjectMembers(); }, []);

  // 🔥 FILTRO: Excluir Admins de la lista regular (solo Managers y Técnicos)
  const regularMembers = teamMembers.filter(m => m.role !== 'Admin');
  const visibleMembers = isAdmin ? teamMembers : regularMembers;

  const filteredMembers = visibleMembers.filter(m => {
    const matchesSearch = !searchQuery || 
      (m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && m.is_active !== false) ||
      (statusFilter === "suspended" && m.is_active === false);
    const matchesProject = projectFilter === "all" || 
      projectMembers.some(pm => pm.project_id === projectFilter && pm.user_id === m.id);
    return matchesSearch && matchesRole && matchesStatus && matchesProject;
  });

  const roleOrder: Record<string, number> = { Admin: 0, Manager: 1, Technician: 2 };
  const sortedMembers = [...filteredMembers].sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMembers = sortedMembers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);

  const getProjectMembers = (projectId: string) => projectMembers.filter(pm => pm.project_id === projectId);
  const getProjectLeader = (projectId: string) => projectMembers.find(pm => pm.project_id === projectId && pm.role_in_project === 'leader');

  // 🔥 ESTADÍSTICAS: Leaders = Managers + Admins
  const stats = {
    total: regularMembers.length, // Solo Managers + Técnicos
    active: regularMembers.filter(m => m.is_active !== false).length,
    leaders: teamMembers.filter(m => m.role === 'Admin' || m.role === 'Manager').length,
    technicians: teamMembers.filter(m => m.role === 'Technician').length,
    suspended: regularMembers.filter(m => m.is_active === false).length,
  };

  const handleEdit = (m: any) => setFormModal({ open: true, member: { ...m, name: m.full_name || m.name || "", avatar: m.avatar_url || m.avatar } });
  
  const handleAssign = (m: TeamMember) => {
    const currentAssignments = projectMembers.filter(pm => pm.user_id === m.id);
    setAssignDialog({
      open: true, member: m,
      selectedProjects: currentAssignments.map(pm => pm.project_id),
      projectRoles: Object.fromEntries(currentAssignments.map(pm => [pm.project_id, pm.role_in_project || 'member'])),
    });
  };

  const handleDelete = async (member: TeamMember) => {
    if (!member) return;
    if (!confirm(`¿Eliminar a "${member.full_name || member.email}" del equipo?`)) return;
    try {
      await deleteMemberMutation.mutateAsync(member.id);
      toast.success(`"${member.full_name || member.email}" eliminado del equipo`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setAssignDialog(prev => {
      const isSelected = prev.selectedProjects.includes(projectId);
      const newSelected = isSelected ? prev.selectedProjects.filter(id => id !== projectId) : [...prev.selectedProjects, projectId];
      const newRoles = { ...prev.projectRoles };
      
      if (!isSelected && !newRoles[projectId]) {
        const memberRole = prev.member?.role;
        const canBeLeader = memberRole === 'Manager' || memberRole === 'Admin';
        
        if (canBeLeader) {
          const existingLeader = getProjectLeader(projectId);
          if (existingLeader && existingLeader.user_id !== prev.member?.id) {
            newRoles[projectId] = 'member';
          } else {
            newRoles[projectId] = 'leader';
          }
        } else {
          newRoles[projectId] = 'member';
        }
      }
      
      if (isSelected) {
        delete newRoles[projectId];
      }
      
      return { ...prev, selectedProjects: newSelected, projectRoles: newRoles };
    });
  };

  const toggleProjectRole = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentRole = assignDialog.projectRoles[projectId] || 'member';
    const memberRole = assignDialog.member?.role;
    
    if (currentRole !== 'leader' && memberRole !== 'Manager' && memberRole !== 'Admin') {
      toast.error('Solo los Managers pueden ser líderes de proyecto');
      return;
    }
    
    if (currentRole !== 'leader') {
      const existingLeader = getProjectLeader(projectId);
      if (existingLeader && existingLeader.user_id !== assignDialog.member?.id) {
        toast.error(`Este proyecto ya tiene un líder: ${existingLeader.profiles?.full_name || 'Otro miembro'}`);
        return;
      }
    }
    setAssignDialog(prev => ({ ...prev, projectRoles: { ...prev.projectRoles, [projectId]: currentRole === 'leader' ? 'member' : 'leader' } }));
  };

  const confirmAssign = async () => {
    if (!assignDialog.member) return;
    for (const projectId of assignDialog.selectedProjects) {
      if (assignDialog.projectRoles[projectId] === 'leader') {
        const existingLeader = getProjectLeader(projectId);
        if (existingLeader && existingLeader.user_id !== assignDialog.member.id) {
          toast.error(`El proyecto ya tiene un líder asignado.`); return;
        }
      }
    }
    try {
      await supabase.from('project_members').delete().eq('user_id', assignDialog.member.id);
      if (assignDialog.selectedProjects.length > 0) {
        await supabase.from('project_members').insert(
          assignDialog.selectedProjects.map(projectId => ({
            project_id: projectId, user_id: assignDialog.member!.id,
            role_in_project: assignDialog.projectRoles[projectId] || 'member',
          }))
        );
      }
      toast.success("✅ Proyectos actualizados");
      setAssignDialog({ open: false, member: null, selectedProjects: [], projectRoles: {} });
      await fetchProjectMembers();
    } catch (e: any) { toast.error(`❌ Error: ${e.message}`); }
  };

  const handleFormSubmit = (data: any) => {
    if (data.id) {
      updateMemberMutation.mutate({
        id: data.id,
        data: {
          full_name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          cedula: data.cedula,
          avatar_url: data.avatar || undefined,
        }
      });
    }
    setFormModal({ open: false, member: null });
  };

  if (!canViewTeam) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2">No tienes permisos para ver el equipo</p>
        </div>
      </DashboardLayout>
    );
  }

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
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Equipo
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {stats.total} miembros
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  <span className="font-medium text-emerald-600">{stats.active}</span> activos · 
                  <span className="text-muted-foreground/60">{stats.suspended} suspendidos</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 🔥 BOTÓN GESTIONAR ROL - CORREGIDO */}
              {(isAdmin || isManager) && (
                <Button 
                  onClick={() => setManageMemberOpen(true)} 
                  className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
                >
                  <UserCog className="h-4 w-4" /> Gestionar Rol
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
            { icon: Users, label: "Total Miembros", value: stats.total, sub: `${stats.active} activos` },
            { icon: CheckCircle, label: "Activos", value: stats.active, sub: `${Math.round((stats.active / stats.total) * 100)}% del equipo` },
            { icon: Crown, label: "Leaders", value: stats.leaders, sub: `${stats.leaders} líderes` },
            { icon: TrendingUp, label: "Técnicos", value: stats.technicians, sub: `${stats.technicians} en el equipo` },
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
                  <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-105">
                  <metric.icon className="h-5 w-5 text-[#0DA2E7]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 3. BARRA DE FILTROS - ESTILO SERVICES */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />

          <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-card/50 p-1 shadow-sm backdrop-blur-sm">
            {/* Dropdown de filtros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative h-8 w-8 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {(roleFilter !== "all" || statusFilter !== "all" || projectFilter !== "all") && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#0DA2E7] ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card border-border shadow-xl rounded-xl p-3">
                <div className="space-y-4">
                  {/* Filtro por Rol */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Rol
                    </label>
                    <Select
                      value={roleFilter}
                      onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/50 w-full">
                        <SelectValue placeholder="Todos los roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Technician">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Estado */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Estado
                    </label>
                    <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5">
                      <button
                        onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 ${
                          statusFilter === "all" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => { setStatusFilter("active"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                          statusFilter === "active" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === "active" ? "bg-white" : "bg-emerald-500"}`} />
                        Activos
                      </button>
                      <button
                        onClick={() => { setStatusFilter("suspended"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                          statusFilter === "suspended" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === "suspended" ? "bg-white" : "bg-rose-400"}`} />
                        Suspendidos
                      </button>
                    </div>
                  </div>

                  {/* Filtro por Proyecto */}
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Proyecto
                    </label>
                    <Select
                      value={projectFilter}
                      onValueChange={(v) => { setProjectFilter(v); setCurrentPage(1); }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/50 w-full">
                        <SelectValue placeholder="Todos los proyectos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los proyectos</SelectItem>
                        {projects.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(roleFilter !== "all" || statusFilter !== "all" || projectFilter !== "all") && (
                    <div className="pt-1 border-t border-border/30">
                      <button
                        onClick={() => { setRoleFilter("all"); setStatusFilter("all"); setProjectFilter("all"); setCurrentPage(1); }}
                        className="text-[10px] text-muted-foreground hover:text-[#0DA2E7] transition-colors w-full text-center"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-border/50" />
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5">
              {filteredMembers.length}
            </span>
            <div className="h-6 w-px bg-border/50" />

            {/* Botón de vista Grid/Table */}
            <button
              onClick={() => {
                const newMode = viewMode === "grid" ? "table" : "grid";
                setViewMode(newMode);
                localStorage.setItem("teamViewMode", newMode);
              }}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#0DA2E7]/10 transition-all duration-200"
              title={viewMode === "grid" ? "Vista de tabla" : "Vista de cuadrícula"}
            >
              <motion.div
                key={viewMode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {viewMode === "grid" ? (
                  <Grid3x3 className="h-4 w-4" />
                ) : (
                  <Table className="h-4 w-4" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 4. LISTA DE MIEMBROS CON TRANSICIÓN */}
        {/* ═══════════════════════════════════════ */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card/50 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="mt-4 pt-3 border-t border-border/20 flex justify-between">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-7 w-7 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : currentMembers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20"
          >
            <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium text-foreground">No hay miembros</p>
            <p className="text-sm text-muted-foreground mt-1">Ajusta los filtros o agrega un nuevo miembro</p>
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
              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence>
                    {currentMembers.map((member, idx) => (
                      <MemberCard 
                        key={member.id} 
                        member={member} 
                        idx={idx} 
                        onEdit={handleEdit} 
                        onAssign={handleAssign}
                        onDelete={handleDelete}
                        isAdmin={isAdmin}
                        projectMembers={projectMembers}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/20 border-b border-border/30">
                        <tr>
                          <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Miembro</th>
                          <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Rol</th>
                          <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                          <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Proyectos</th>
                          <th className="text-right p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMembers.map((member) => (
                          <TableRow 
                            key={member.id} 
                            member={member} 
                            onEdit={handleEdit} 
                            onAssign={handleAssign}
                            onDelete={handleDelete}
                            isAdmin={isAdmin}
                            projectMembers={projectMembers}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">Pág. {currentPage} de {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 5. MODALES */}
      {/* ═══════════════════════════════════════ */}
      <ManageMemberModal 
        open={manageMemberOpen} 
        onOpenChange={setManageMemberOpen} 
        onSuccess={() => refetch()} 
      />
      
      {formModal.open && <TeamMemberFormModal open={formModal.open} onOpenChange={(o) => setFormModal({ open: o, member: o ? formModal.member : null })} member={formModal.member} onSubmit={handleFormSubmit} />}

      {/* Assign Projects Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(o) => setAssignDialog({ open: o, member: o ? assignDialog.member : null, selectedProjects: [], projectRoles: {} })}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="relative p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0DA2E7]/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 relative">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/30">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Gestionar Proyectos</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Asignar o remover a <strong className="text-foreground">{assignDialog.member?.full_name || assignDialog.member?.email}</strong> de proyectos
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="text-center py-12"><FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" /><p className="text-sm text-muted-foreground">No hay proyectos</p></div>
            ) : (
              projects.map((project: any) => {
                const isSelected = assignDialog.selectedProjects.includes(project.id);
                const role = assignDialog.projectRoles[project.id] || 'member';
                const currentLeader = getProjectLeader(project.id);
                const isLeader = role === 'leader';
                const hasOtherLeader = currentLeader && currentLeader.user_id !== assignDialog.member?.id;
                const isCurrentlyAssigned = projectMembers.some(pm => pm.project_id === project.id && pm.user_id === assignDialog.member?.id);
                const canBeLeader = assignDialog.member?.role === 'Manager' || assignDialog.member?.role === 'Admin';

                return (
                  <motion.div key={project.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected ? isLeader ? 'border-amber-400/60 bg-amber-50/50' : 'border-[#0DA2E7]/40 bg-[#0DA2E7]/5' : isCurrentlyAssigned ? 'border-border/50 bg-muted/10' : 'border-border/50 bg-muted/5 hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={() => { toggleProjectSelection(project.id); }} 
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 cursor-pointer transition-all ${
                          isSelected ? isLeader ? 'bg-amber-500 border-amber-500' : 'bg-[#0DA2E7] border-[#0DA2E7]' : 'border-muted-foreground/30 hover:border-[#0DA2E7]/40'
                        }`}>
                        {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{project.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {hasOtherLeader && <span className="text-[10px] text-amber-600 flex items-center gap-1"><Crown className="h-2.5 w-2.5" />Líder: {currentLeader.profiles?.full_name || 'Asignado'}</span>}
                          {isCurrentlyAssigned && !isSelected && <span className="text-[10px] text-red-500">Será removido al guardar</span>}
                          <span className="text-[10px] text-muted-foreground">{getProjectMembers(project.id).length} miembros</span>
                        </div>
                      </div>
                      {isSelected && canBeLeader && (
                        <Button size="sm" variant={isLeader ? 'default' : 'outline'} className={`h-7 text-[10px] px-2.5 gap-1 transition-all ${isLeader ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : 'border-border hover:border-[#0DA2E7]/30'}`} onClick={(e) => { toggleProjectRole(project.id, e); }}>
                          {isLeader ? <><Crown className="h-3 w-3" /> Líder</> : <><UserIcon className="h-3 w-3" /> Miembro</>}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="p-5 pt-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{assignDialog.selectedProjects.length === 0 ? 'Sin proyectos seleccionados' : `${assignDialog.selectedProjects.length} proyecto(s) seleccionado(s)`}</p>
              {assignDialog.selectedProjects.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setAssignDialog(prev => ({ ...prev, selectedProjects: [], projectRoles: {} }))}>Limpiar</Button>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAssignDialog({ open: false, member: null, selectedProjects: [], projectRoles: {} })} className="flex-1 rounded-lg">Cancelar</Button>
              <Button onClick={confirmAssign} className="flex-1 text-white rounded-lg" style={{ backgroundColor: HORMI_BLUE }}>
                <FolderKanban className="h-4 w-4 mr-1.5" />
                {assignDialog.selectedProjects.length > 0 ? 'Guardar Cambios' : 'Quitar de todos'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ═══════════════ MEMBER CARD MEJORADA ═══════════════
function MemberCard({ member, idx, onEdit, onAssign, onDelete, isAdmin, projectMembers }: any) {
  const roleConfig = {
    Admin: { icon: Crown, color: "bg-amber-50 text-amber-700 border-amber-200" },
    Manager: { icon: Shield, color: "bg-blue-50 text-blue-700 border-blue-200" },
    Technician: { icon: Wrench, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  const config = roleConfig[member?.role] || roleConfig.Technician;
  const RoleIcon = config.icon;
  const isActive = member?.is_active !== false;

  const projectCount = projectMembers.filter((pm: any) => pm.user_id === member.id).length;
  const isLeader = projectMembers.some((pm: any) => pm.user_id === member.id && pm.role_in_project === 'leader');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ delay: idx * 0.03, duration: 0.2 }}
      whileHover={{ y: -3 }}
      className="group relative rounded-xl border border-border/30 bg-card p-4 shadow-sm hover:shadow-md hover:border-[#0DA2E7]/30 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11 ring-2 ring-border group-hover:ring-[#0DA2E7]/40 transition-all duration-300">
            <AvatarImage src={member?.avatar_url || ""} />
            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-muted to-muted/50">
              {(member?.full_name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          {isActive ? (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-card" />
          ) : (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-400 ring-2 ring-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-[#0DA2E7] transition-colors truncate">
              {member?.full_name || "Sin nombre"}
            </h3>
            {isLeader && (
              <Badge className="bg-amber-50 text-amber-700 text-[8px] px-1.5 py-0 border-amber-200 flex-shrink-0">
                <Crown className="h-2.5 w-2.5 mr-0.5" /> Líder
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 font-medium ${config.color}`}>
              <RoleIcon className="h-2.5 w-2.5" />
              {member?.role}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[8px] px-1.5 py-0 h-4 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                  : "bg-rose-500/10 text-rose-600 border-rose-200"
              }`}
            >
              {isActive ? "Activo" : "Suspendido"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1 mt-2 min-h-[40px]">
        {member?.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
            <Mail className="h-3 w-3 shrink-0 text-[#0DA2E7]/50" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
        {member?.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
            <Phone className="h-3 w-3 shrink-0 text-[#0DA2E7]/50" />
            <span>{member.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/20">
        <div className="flex items-center gap-1">
          <FolderKanban className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground">
            {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-card border-border shadow-lg rounded-lg p-1">
            <DropdownMenuItem
              className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-md px-2 py-1.5 transition-all duration-200"
              onClick={() => onEdit(member)}
            >
              <Pencil className="h-3 w-3" /> Editar
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-2 py-1.5 transition-all duration-200"
                onClick={() => onAssign(member)}
              >
                <FolderKanban className="h-3 w-3" /> Proyectos
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 rounded-md px-2 py-1.5 transition-all duration-200"
                onClick={() => onDelete(member)}
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

// ═══════════════ TABLE ROW MEJORADO ═══════════════
function TableRow({ member, onEdit, onAssign, onDelete, isAdmin, projectMembers }: any) {
  const isActive = member?.is_active !== false;
  const projectCount = projectMembers.filter((pm: any) => pm.user_id === member.id).length;
  const isLeader = projectMembers.some((pm: any) => pm.user_id === member.id && pm.role_in_project === 'leader');

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-border/20 hover:bg-muted/5 transition-colors group"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted">
              {member.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{member.full_name}</span>
            {isLeader && (
              <Badge className="bg-amber-50 text-amber-700 text-[8px] px-1.5 py-0 border-amber-200">
                <Crown className="h-2.5 w-2.5 mr-0.5" /> Líder
              </Badge>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline" className="text-[10px] px-2 py-0 bg-muted/30">
          {member.role}
        </Badge>
      </td>
      <td className="p-4 text-muted-foreground text-xs">{member.email}</td>
      <td className="p-4 text-center">
        <Badge
          variant="outline"
          className={`text-[9px] px-2 py-0 ${
            isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
              : "bg-rose-500/10 text-rose-600 border-rose-200"
          }`}
        >
          {isActive ? "Activo" : "Suspendido"}
        </Badge>
      </td>
      <td className="p-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-muted-foreground hover:text-[#0DA2E7] gap-1.5"
          onClick={() => onAssign(member)}
        >
          <FolderKanban className="h-3 w-3" />
          <span className="font-medium">{projectCount}</span>
        </Button>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            onClick={() => onEdit(member)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600"
                onClick={() => onAssign(member)}
              >
                <FolderKanban className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
                onClick={() => onDelete(member)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}