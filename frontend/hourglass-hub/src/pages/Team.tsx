import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ManageMemberModal } from "@/components/team/ManageMemberModal";
import { TeamMemberFormModal } from "@/components/team/TeamMemberFormModal";
import { MemberDetailModal } from "@/components/team/MemberDetailModal";
import { TeamMemberCard, type TeamMemberLike } from "@/components/team/TeamMemberCard";
import { TeamFilters, type TeamFilterOption } from "@/components/team/TeamFilters";
import { toast } from "sonner";
import {
  Users, Shield, Wrench, Briefcase, UserCog,
  Crown, CheckCircle, ChevronLeft, ChevronRight, Table, Grid3x3,
  Pencil, TrendingUp, Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTeamMembers, useUpdateTeamMember } from "@/hooks/useTeamMembers";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ═══════════════ HELPERS DEFENSIVOS (API camelCase / legacy snake_case) ═══════════════

type Member = TeamMemberLike;

const getFullName = (m?: Member | null) =>
  m?.full_name || (m?.profile?.name ? `${m.profile.name} ${m.profile.lastName || ""}`.trim() : m?.name || "Sin nombre");

const getInitials = (m?: Member | null) =>
  getFullName(m).split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);

const getRoleName = (role: string | { name?: string } | null | undefined) =>
  typeof role === "string" ? role : role?.name || "Technician";

const getIsActive = (m?: Member | null) => m?.isActive !== false && m?.is_active !== false;

const getAvatar = (m?: Member | null) =>
  m?.avatar_url || m?.profile?.profilePicture || null;

// ═══════════════ CONFIG ESTILOS COMÚN ═══════════════

const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; badge: string; dot: string }> = {
  Admin: { label: "Administrador", icon: Crown, badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Manager: { label: "Manager", icon: Briefcase, badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Technician: { label: "Técnico", icon: Wrench, badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const getRoleConfig = (role: string | { name?: string } | null | undefined) => {
  const name = getRoleName(role);
  return ROLE_CONFIG[name] || ROLE_CONFIG.Technician;
};

const ROLE_ORDER: Record<string, number> = { Admin: 0, Manager: 1, Technician: 2 };

// ═══════════════ TABLE ROW ═══════════════

function TableRow({
  member, onEdit, onOpenDetail, canEdit,
}: {
  member: Member;
  onEdit: (m: Member) => void;
  onOpenDetail: (m: Member) => void;
  canEdit: boolean;
}) {
  const roleConfig = getRoleConfig(member?.role);
  const RoleIcon = roleConfig.icon;
  const isActive = getIsActive(member);
  const avatar = getAvatar(member);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenDetail(member)}
      className="border-b border-border/20 transition-colors hover:bg-[#0DA2E7]/[0.04] cursor-pointer group"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarImage src={avatar || ""} />
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(member)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground text-sm">{getFullName(member)}</span>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="outline" className={`gap-1 text-[10px] px-2 py-0 font-medium ${roleConfig.badge}`}>
          <RoleIcon className="h-2.5 w-2.5" />
          {roleConfig.label}
        </Badge>
      </td>
      <td className="p-4 text-muted-foreground text-xs">{member.email}</td>
      <td className="p-4">
        <Badge
          variant="outline"
          className={`text-[9px] px-2 py-0 font-medium ${isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-rose-500/10 text-rose-600 border-rose-200"}`}
        >
          {isActive ? "Activo" : "Suspendido"}
        </Badge>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            onClick={(e) => { e.stopPropagation(); onOpenDetail(member); }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
              onClick={(e) => { e.stopPropagation(); onEdit(member); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ═══════════════ PÁGINA ═══════════════

export default function Team() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtros (se aplican automáticamente al seleccionar)
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modales
  const [manageMemberOpen, setManageMemberOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Datos
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("teamViewMode");
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });
  const itemsPerPage = 12;

  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const updateMember = useUpdateTeamMember();
  const { profile } = useAuth();
  const canViewTeam = profile?.role === 'Admin' || profile?.role === 'Manager';
  const isAdmin = profile?.role === 'Admin';
  const isManager = profile?.role === 'Manager';

  // ✅ Excluir Admins de la lista regular (solo Managers y Técnicos)
  const regularMembers = teamMembers.filter(m => getRoleName(m.role) !== 'Admin');
  const visibleMembers = isAdmin ? teamMembers : regularMembers;

  // ✅ Filtros (rol + estado)
  const filteredMembers = visibleMembers.filter(m => {
    const roleName = getRoleName(m.role);
    const matchesRole = roleFilter === "all" || roleName === roleFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && getIsActive(m)) ||
      (statusFilter === "suspended" && !getIsActive(m));
    return matchesRole && matchesStatus;
  });

  // ✅ Orden: por rol y luego alfabético
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const diff = (ROLE_ORDER[getRoleName(a.role)] ?? 99) - (ROLE_ORDER[getRoleName(b.role)] ?? 99);
    return diff || getFullName(a).localeCompare(getFullName(b));
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMembers = sortedMembers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / itemsPerPage));

  // ✅ Leer ?member= de la URL y abrir el modal del miembro automáticamente
  useEffect(() => {
    const memberId = searchParams.get("member");
    if (!memberId || isLoading) return;
    const target = teamMembers.find((m) => m.id === memberId);
    if (target) {
      setDetailMember(target);
      setDetailOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, isLoading, teamMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Estadísticas
  const stats = {
    total: regularMembers.length,
    active: regularMembers.filter(m => getIsActive(m)).length,
    leaders: teamMembers.filter(m => {
      const roleName = getRoleName(m.role);
      return roleName === 'Admin' || roleName === 'Manager';
    }).length,
    technicians: teamMembers.filter(m => getRoleName(m.role) === 'Technician').length,
    suspended: regularMembers.filter(m => !getIsActive(m)).length,
  };

  const activeFilterCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  // Opciones de rol visibles según el usuario actual
  const roleOptions: TeamFilterOption[] = [
    { value: "all", label: "Todos los roles", icon: Users, color: "text-muted-foreground" },
    { value: "Manager", label: "Manager", icon: Briefcase, color: "text-blue-500" },
    { value: "Technician", label: "Técnico", icon: Wrench, color: "text-emerald-500" },
    ...(isAdmin ? [{ value: "Admin", label: "Administrador", icon: Crown, color: "text-amber-500" }] : []),
  ];

  // ✅ Permisos: editar = Admin/Manager · agregar/desactivar/eliminar = Admin
  const canManageMembersEdit = isAdmin || isManager;

  // ═══════════ HANDLERS ═══════════

  const handleOpenDetail = (m: Member) => {
    setDetailMember(m);
    setDetailOpen(true);
  };

  const handleEditRequest = (m: Member) => {
    setEditMember(m);
    setDetailOpen(false);
    setEditOpen(true);
  };

  const handleEditSubmit = async (data: { id?: string; name?: string; email?: string; phone?: string | null }) => {
    if (!data?.id) return;
    // ✅ UPDATE OPTIMISTA: se refleja al instante, sin esperar el refetch
    await updateMember.mutateAsync({
      id: data.id,
      data: { name: data.name, email: data.email, phone: data.phone || null },
    });
    setEditOpen(false);
  };

  const handleToggleActive = async (m: Member) => {
    if (!m?.id) return;
    const next = !getIsActive(m);
    try {
      await updateMember.mutateAsync({ id: m.id, data: { isActive: next, is_active: next } });
      if (detailMember?.id === m.id) {
        setDetailMember({ ...detailMember, isActive: next, is_active: next });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Error: ${message}`);
    }
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
        {/* HEADER */}
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
        <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed">
          Aquí podrás gestionar los roles de los usuarios y miembros del equipo.
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {canManageMembersEdit && (
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

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Miembros", value: stats.total, sub: `${stats.active} activos` },
            { icon: CheckCircle, label: "Activos", value: stats.active, sub: `${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% del equipo` },
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

        {/* FILTROS + MODO VISTA */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <TeamFilters
              roleOptions={roleOptions}
              roleFilter={roleFilter}
              onRoleChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
              statusFilter={statusFilter}
              onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              resultCount={filteredMembers.length}
              activeCount={activeFilterCount}
              onClear={() => { setRoleFilter("all"); setStatusFilter("all"); setCurrentPage(1); }}
            />

            <div className="h-6 w-px bg-border/50" />
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5">
              {filteredMembers.length} miembro{filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Toggle Cuadrícula / Lista con píldora animada */}
          <div className="relative flex items-center gap-0.5 self-start rounded-xl border border-border/30 bg-muted/30 p-1">
            {[
              { id: "grid" as const, label: "Cuadrícula", icon: Grid3x3 },
              { id: "table" as const, label: "Lista", icon: Table },
            ].map((opt) => {
              const active = viewMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newMode = active ? viewMode : opt.id;
                    setViewMode(newMode);
                    localStorage.setItem("teamViewMode", newMode);
                  }}
                  className={cn(
                    "relative flex h-8 items-center rounded-lg px-3.5 text-xs font-medium transition-colors",
                    active ? "text-[#0DA2E7]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="team-view-pill"
                      className="absolute inset-0 rounded-lg border border-border/50 bg-card shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTA DE MIEMBROS */}
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
            <p className="text-sm text-muted-foreground mt-1">Ajusta los filtros para ver más resultados</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewMode}
              layout
              initial={{ opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -8 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {currentMembers.map((member, idx) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        idx={idx}
                        canEdit={canManageMembersEdit}
                        onEdit={handleEditRequest}
                        onOpenDetail={handleOpenDetail}
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
                          <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                          <th className="text-right p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMembers.map((member) => (
                          <TableRow
                            key={member.id}
                            member={member}
                            onEdit={handleEditRequest}
                            onOpenDetail={handleOpenDetail}
                            canEdit={canManageMembersEdit}
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

      {/* ═══════════ MODALES ═══════════ */}

      {/* Gestionar rol */}
      <ManageMemberModal
        open={manageMemberOpen}
        onOpenChange={setManageMemberOpen}
        onSuccess={() => {}}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      {/* Editar miembro */}
      <TeamMemberFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        member={editMember}
        onSubmit={handleEditSubmit}
      />

      {/* Detalle del miembro */}
      <MemberDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        member={detailMember}
        isAdmin={isAdmin}
        isManager={isManager}
        onEdit={handleEditRequest}
        onToggleActive={handleToggleActive}
      />

    </DashboardLayout>
  );
}