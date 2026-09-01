import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search, UserPlus, Pencil, Trash2, Shield, UserCheck, UserX,
  Loader2, Users, Mail, AlertTriangle, Settings2, Briefcase, Wrench,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Phone, User, Upload, Camera, X, CreditCard, MoreVertical, Filter,
  Table, Grid3x3
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AddUserModal } from "@/components/team/AddUserModal";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = "#0DA2E7";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("adminUsersViewMode");
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: any }>({ open: false, user: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCedula, setEditCedula] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (profile?.role !== "Admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="h-16 w-16 text-red-500/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Denegado</h2>
          <p className="text-base text-muted-foreground mt-2">Solo el Administrador puede acceder a esta sección.</p>
        </div>
      </DashboardLayout>
    );
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active !== false) ||
      (statusFilter === "inactive" && user.is_active === false);
    return matchesRole && matchesStatus;
  });

  const rolePriority: Record<string, number> = { Admin: 0, Manager: 1, Technician: 2 };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const priorityA = rolePriority[a.role] ?? 99;
    const priorityB = rolePriority[b.role] ?? 99;
    return priorityA - priorityB;
  });

  // ═══════ PAGINACIÓN (SOLO PARA GRID) ═══════
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedUsers = sortedUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // ═══════ LISTA COMPLETA (PARA SCROLL) ═══════
  const allUsers = sortedUsers;

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active !== false).length,
    admins: users.filter((u) => u.role === "Admin").length,
    managers: users.filter((u) => u.role === "Manager").length,
    technicians: users.filter((u) => u.role === "Technician").length,
  };

  const handleOpenEdit = (user: any) => {
    setEditFullName(user.full_name || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditCedula(user.cedula || "");
    setEditAvatar(user.avatar_url || null);
    setEditAvatarFile(null);
    setEditModal({ open: true, user });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 5MB");
        return;
      }
      setEditAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal.user) return;
    setIsSaving(true);

    let avatarUrl = editModal.user.avatar_url;

    if (editAvatarFile) {
      const fileExt = editAvatarFile.name.split(".").pop();
      const fileName = `${editModal.user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, editAvatarFile, { upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editFullName,
        email: editEmail,
        phone: editPhone || null,
        cedula: editCedula || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editModal.user.id);

    if (error) {
      toast.error("Error al guardar cambios");
    } else {
      toast.success("Usuario actualizado correctamente");
      setEditModal({ open: false, user: null });
      fetchUsers();
    }
    setIsSaving(false);
  };

  const handleToggleActive = async (user: any) => {
    const newStatus = !user.is_active;
    await supabase.from("profiles").update({ is_active: newStatus }).eq("id", user.id);
    toast.success(`Usuario ${newStatus ? "activado" : "desactivado"}`);
    fetchUsers();
    setSuspendDialog({ open: false, user: null });
  };

  const handleDeleteUser = async (user: any) => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        toast.error("No tienes sesión activa. Inicia sesión de nuevo.");
        return;
      }

      await supabase.from("project_members").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      const response = await fetch(`https://hormiwatch2-main-production.up.railway.app/api/v1/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error eliminando de auth.users:", errorData);
        toast.warning(`Usuario eliminado de la app, pero el email podría seguir registrado.`);
      } else {
        toast.success(`Usuario "${user.full_name || user.email}" eliminado completamente`);
      }

      fetchUsers();
      setDeleteDialog({ open: false, user: null });
    } catch (error: any) {
      console.error("Error en handleDeleteUser:", error);
      toast.error(error.message || "Error al eliminar usuario");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return { label: "Administrador", icon: Settings2, className: "bg-amber-50 text-amber-700 border-amber-200" };
      case "Manager":
        return { label: "Manager", icon: Briefcase, className: "bg-blue-50 text-blue-700 border-blue-200" };
      case "Technician":
        return { label: "Técnico", icon: Wrench, className: "bg-sky-50 text-sky-700 border-sky-200" };
      default:
        return { label: role, icon: Users, className: "bg-muted text-muted-foreground border-border" };
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ═══════════ HEADER ═══════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/20">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Control de Usuarios
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {stats.total} usuarios
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Gestiona los usuarios y sus roles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setAddUserOpen(true)}
                className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] hover:from-[#0B8BC7] hover:to-[#0DA2E7]"
              >
                <UserPlus className="h-4 w-4" /> Nuevo Usuario
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════ KPI CARDS ═══════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Usuarios", value: stats.total, sub: `${stats.active} activos` },
            { icon: CheckCircle, label: "Activos", value: stats.active, sub: `${stats.total - stats.active} inactivos` },
            { icon: Settings2, label: "Administradores", value: stats.admins, sub: "Acceso total" },
            { icon: Wrench, label: "Técnicos", value: stats.technicians, sub: "Miembros del equipo" },
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

        {/* ═══════════ BARRA DE HERRAMIENTAS ═══════════ */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-card/50 p-1 shadow-sm backdrop-blur-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-8 w-8 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {(statusFilter !== "all" || roleFilter !== "all") && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#0DA2E7] ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card border-border shadow-xl rounded-xl p-3">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Rol
                    </label>
                    <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/50 w-full">
                        <SelectValue placeholder="Todos los roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Technician">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                        onClick={() => { setStatusFilter("inactive"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                          statusFilter === "inactive"
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === "inactive" ? "bg-white" : "bg-red-400"}`} />
                        Inactivos
                      </button>
                    </div>
                  </div>

                  {(statusFilter !== "all" || roleFilter !== "all") && (
                    <div className="pt-1 border-t border-border/30">
                      <button
                        onClick={() => { setStatusFilter("all"); setRoleFilter("all"); setCurrentPage(1); }}
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
              {filteredUsers.length}
            </span>
            <div className="h-6 w-px bg-border/50" />

            <button
              onClick={() => {
                const newMode = viewMode === "grid" ? "table" : "grid";
                setViewMode(newMode);
                localStorage.setItem("adminUsersViewMode", newMode);
                // Resetear a página 1 al cambiar de vista
                setCurrentPage(1);
              }}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#0DA2E7]/10 transition-all duration-200"
            >
              <motion.div
                key={viewMode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {viewMode === "grid" ? (
                  <Table className="h-4 w-4" />
                ) : (
                  <Grid3x3 className="h-4 w-4" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* ═══════════ LISTA DE USUARIOS ═══════════ */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#0DA2E7]" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border/50 bg-card/50">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : viewMode === "grid" ? (
            <>
              {/* ═══ GRID CON PAGINACIÓN ═══ */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="wait">
                  {paginatedUsers.map((user, idx) => {
                    const badge = getRoleBadge(user.role);
                    const RoleIcon = badge.icon;
                    const isActive = user.is_active !== false;

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        whileHover={{ y: -3 }}
                        className="group relative rounded-xl border border-border/30 bg-card p-4 shadow-sm hover:shadow-md hover:border-[#0DA2E7]/30 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className={`h-11 w-11 ring-2 transition-all duration-300 ${
                              isActive ? "ring-border group-hover:ring-[#0DA2E7]/40" : "ring-red-200"
                            }`}>
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-sm font-semibold bg-[#0DA2E7]/10 text-[#0DA2E7]">
                                {getInitials(user.full_name || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card ${
                              isActive ? "bg-emerald-400" : "bg-red-400"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-[#0DA2E7] transition-colors truncate">
                              {user.full_name || "Sin nombre"}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1.5 py-0 h-4 ${badge.className}`}
                              >
                                <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
                                {badge.label}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.phone && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              <Phone className="h-2.5 w-2.5" />{user.phone}
                            </span>
                          )}
                          {user.cedula && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              <CreditCard className="h-2.5 w-2.5" />{user.cedula}
                            </span>
                          )}
                          {!user.phone && !user.cedula && (
                            <span className="text-[9px] text-muted-foreground/50 italic">Sin info adicional</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/20">
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${
                            isActive ? "text-emerald-600" : "text-red-500"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                            {isActive ? "Activo" : "Inactivo"}
                          </span>

                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-lg transition-all"
                              onClick={() => handleOpenEdit(user)}
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 rounded-lg transition-all ${
                                isActive
                                  ? "hover:bg-amber-100 hover:text-amber-600"
                                  : "hover:bg-emerald-100 hover:text-emerald-600"
                              }`}
                              onClick={() => setSuspendDialog({ open: true, user })}
                              title={isActive ? "Desactivar" : "Activar"}
                            >
                              {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all"
                              onClick={() => setDeleteDialog({ open: true, user })}
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ═══ PAGINACIÓN (SOLO PARA GRID) ═══ */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* ═══ LISTA CON SCROLL (TODOS LOS USUARIOS) ═══ */
            <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border/30 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Usuario</th>
                      <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Rol</th>
                      <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                      <th className="text-right p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => {
                      const badge = getRoleBadge(user.role);
                      const RoleIcon = badge.icon;
                      const isActive = user.is_active !== false;

                      return (
                        <tr key={user.id} className="border-b border-border/20 hover:bg-muted/5 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="text-xs font-semibold bg-[#0DA2E7]/10 text-[#0DA2E7]">
                                  {getInitials(user.full_name || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{user.full_name || "Sin nombre"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                          <td className="p-4 text-center">
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${badge.className}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-2 py-0 ${
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                  : "bg-red-500/10 text-red-600 border-red-200"
                              }`}
                            >
                              {isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-lg"
                                onClick={() => handleOpenEdit(user)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 rounded-lg ${
                                  isActive
                                    ? "hover:bg-amber-100 hover:text-amber-600"
                                    : "hover:bg-emerald-100 hover:text-emerald-600"
                                }`}
                                onClick={() => setSuspendDialog({ open: true, user })}
                              >
                                {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-500 rounded-lg"
                                onClick={() => setDeleteDialog({ open: true, user })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════ MODALES ═══════════ */}

      {/* Modal de Edición */}
      <Dialog open={editModal.open} onOpenChange={(open) => { if (!open) setEditModal({ open: false, user: null }); }}>
        <DialogContent className="max-w-lg bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
          {editModal.user && (
            <>
              <div className="relative p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/25">
                    <Pencil className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-foreground">Editar Usuario</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      {editModal.user.full_name || "Usuario"}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-16 w-16 ring-2 ring-border">
                      <AvatarImage src={editAvatar || editModal.user.avatar_url || ""} />
                      <AvatarFallback className="text-lg font-bold bg-[#0DA2E7]/10 text-[#0DA2E7]">
                        {getInitials(editFullName || editModal.user.full_name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0DA2E7] text-white cursor-pointer hover:bg-[#0B8BC7] transition-colors shadow-lg">
                      <Camera className="h-3.5 w-3.5" />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo
                    </Label>
                    <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} className="bg-muted/10 border-border/60 h-10 rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Rol <span className="text-xs text-muted-foreground">(solo lectura)</span>
                  </Label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/60">
                    {(() => {
                      const b = getRoleBadge(editModal.user.role);
                      const Icon = b.icon;
                      return (
                        <>
                          <div className="p-1.5 rounded-lg bg-muted/30">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{b.label}</span>
                            <p className="text-xs text-muted-foreground">
                              {editModal.user.role === "Admin" && "Acceso total al sistema"}
                              {editModal.user.role === "Manager" && "Gestión de proyectos y equipos"}
                              {editModal.user.role === "Technician" && "Registro de horas y tareas"}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico
                    </Label>
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="bg-muted/10 border-border/60 h-10 rounded-lg text-sm" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono
                    </Label>
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+58 412 413 4891" className="bg-muted/10 border-border/60 h-10 rounded-lg text-sm font-mono" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Cédula
                  </Label>
                  <Input value={editCedula} onChange={e => setEditCedula(e.target.value)} placeholder="V-12345678" className="bg-muted/10 border-border/60 h-10 rounded-lg text-sm" />
                </div>
              </div>

              <DialogFooter className="p-5 pt-0 gap-2">
                <Button variant="outline" onClick={() => setEditModal({ open: false, user: null })} className="rounded-lg h-10 px-4 text-sm border-border/60 flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving} className="rounded-lg h-10 px-4 gap-2 text-white text-sm flex-1 bg-[#0DA2E7] hover:bg-[#0B8BC7]">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Usuario */}
      <AddUserModal open={addUserOpen} onOpenChange={setAddUserOpen} onSuccess={fetchUsers} />

      {/* Diálogo Suspender/Activar */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, user: open ? suspendDialog.user : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{suspendDialog.user?.is_active !== false ? "Desactivar Usuario" : "Activar Usuario"}</DialogTitle>
            <DialogDescription className="text-sm">
              {suspendDialog.user?.is_active !== false
                ? "El usuario no podrá iniciar sesión ni interactuar con el sistema."
                : "El usuario recuperará el acceso al sistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de {suspendDialog.user?.is_active !== false ? "desactivar" : "activar"} a <strong className="text-foreground">{suspendDialog.user?.full_name || suspendDialog.user?.email}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, user: null })}>Cancelar</Button>
            <Button onClick={() => handleToggleActive(suspendDialog.user)} className={suspendDialog.user?.is_active !== false ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}>
              {suspendDialog.user?.is_active !== false ? <><UserX className="h-4 w-4 mr-1.5" /> Desactivar</> : <><UserCheck className="h-4 w-4 mr-1.5" /> Activar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: open ? deleteDialog.user : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Eliminar Usuario</DialogTitle>
            <DialogDescription className="text-sm">Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar permanentemente a <strong className="text-red-500">{deleteDialog.user?.full_name || deleteDialog.user?.email}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteUser(deleteDialog.user)}><Trash2 className="h-4 w-4 mr-1.5" /> Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}