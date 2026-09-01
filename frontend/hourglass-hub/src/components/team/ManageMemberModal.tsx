import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { 
  Users, Shield, Loader2, UserCog, Search, X, Check, EyeOff, 
  Crown, Briefcase, Wrench, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

interface ManageMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { 
    value: "Admin", 
    label: "Administrador", 
    description: "Acceso total al sistema", 
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Crown 
  },
  { 
    value: "Manager", 
    label: "Manager", 
    description: "Gestión de proyectos y equipos", 
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Briefcase 
  },
  { 
    value: "Technician", 
    label: "Técnico", 
    description: "Registro de horas y tareas", 
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Wrench 
  },
];

export function ManageMemberModal({ open, onOpenChange, onSuccess }: ManageMemberModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const { profile } = useAuth();

  const currentUserRole = profile?.role || 'Technician';
  const isAdmin = currentUserRole === 'Admin';
  
  // 🔥 CORREGIDO: Admin o Manager pueden gestionar roles
  const canManageRoles = currentUserRole === 'Admin' || currentUserRole === 'Manager';

  // 🔥 Cargar usuarios (con filtro para ocultar Admins si no es Admin)
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, is_active')
        .order('full_name', { ascending: true });

      // 🔥 Si NO es Admin, excluir Admins de la lista
      if (!isAdmin) {
        query = query.neq('role', 'Admin');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
      setShowUserList(true);
    } catch (error: any) {
      toast.error(`Error al cargar usuarios: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUser(null);
      setNewRole("");
      setSearchQuery("");
    }
  }, [open]);

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'Technician');
    setShowUserList(false);
    setSearchQuery("");
    toast.success(`Seleccionado: ${user.full_name || user.email}`);
  };

  // 🔥 CORREGIDO: Admin o Manager pueden cambiar roles
  const handleUpdateRole = async () => {
    if (!selectedUser) { 
      toast.error('Selecciona un usuario'); 
      return; 
    }
    
    // 🔥 Admin o Manager pueden cambiar roles
    if (!canManageRoles) { 
      toast.error('No tienes permisos para cambiar roles'); 
      return; 
    }
    
    // 🔥 Si es Manager, no puede asignar Admin
    if (currentUserRole === 'Manager' && newRole === 'Admin') {
      toast.error('Un Manager no puede asignar el rol de Administrador');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`✅ Rol actualizado para ${selectedUser.full_name || selectedUser.email}`);
      setSelectedUser(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentActive })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Usuario ${!currentActive ? 'activado' : 'desactivado'}`);
      loadUsers();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const getRoleBadge = (roleValue: string) => {
    const config = ROLE_OPTIONS.find(r => r.value === roleValue);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={`gap-1 ${config.color} text-[10px] px-2 py-0`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const resetForm = () => { 
    setSelectedUser(null); 
    setShowUserList(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) resetForm(); onOpenChange(newOpen); }}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0DA2E7]/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 relative">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/30">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Gestionar Rol</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Administra los roles de los miembros del equipo
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Usuario seleccionado */}
          {selectedUser ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#0DA2E7]/5 border border-[#0DA2E7]/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-[#0DA2E7]/30">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] text-white text-sm font-medium">
                      {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedUser.full_name || "Usuario sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">Rol actual:</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500"
                  onClick={() => { setSelectedUser(null); setNewRole(""); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Buscador de usuarios */
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (!showUserList && users.length > 0) setShowUserList(true); }}
                  className="pl-9 h-10 text-sm bg-background border-border rounded-lg focus:ring-[#0DA2E7] focus:border-[#0DA2E7]"
                />
              </div>

              {/* Lista de usuarios */}
              <AnimatePresence>
                {showUserList && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <div className="p-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {filteredUsers.length} usuarios encontrados
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full hover:bg-muted/50"
                        onClick={() => setShowUserList(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-6 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0DA2E7]" />
                          <p className="text-xs text-muted-foreground mt-2">Cargando usuarios...</p>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-6 text-center">
                          <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No se encontraron usuarios</p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectUser(user)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0 group"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback className="text-xs bg-muted">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-[#0DA2E7] transition-colors">
                                {user.full_name || "Usuario sin nombre"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getRoleBadge(user.role)}
                              {!user.is_active && (
                                <Badge className="bg-red-50 text-red-600 border-red-200 text-[9px] px-1.5 py-0">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showUserList && users.length === 0 && !isLoading && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={loadUsers} 
                  className="w-full gap-2 h-10 rounded-lg text-sm"
                >
                  <Users className="h-4 w-4" />
                  Cargar usuarios
                </Button>
              )}
            </div>
          )}

          {/* Selector de rol (cuando hay usuario seleccionado) */}
          {selectedUser && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2"
            >
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#0DA2E7]" />
                  Nuevo rol
                </Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-background border-border h-10 rounded-lg text-sm focus:ring-[#0DA2E7] focus:border-[#0DA2E7]">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ROLE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-2 text-sm">
                              <Icon className="h-3.5 w-3.5" style={{ color: HORMI_BLUE }} />
                              {option.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground pl-5">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado del usuario (Activo/Inactivo) */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                <span className="text-sm text-foreground">Estado de la cuenta</span>
                <button
                  onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedUser.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  {selectedUser.is_active ? <><Check className="h-3.5 w-3.5" /> Activo</> : <><EyeOff className="h-3.5 w-3.5" /> Inactivo</>}
                </button>
              </div>

              {/* Advertencia de cambio de rol */}
              {selectedUser.role !== newRole && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-700">
                    Cambiar el rol afectará los permisos del usuario en toda la aplicación.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 pt-0 gap-2 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-lg h-10 px-4 text-sm flex-1"
          >
            Cancelar
          </Button>
          {selectedUser && (
            <Button 
              onClick={handleUpdateRole} 
              disabled={isLoading || selectedUser.role === newRole} 
              className="rounded-lg h-10 px-4 gap-2 text-white text-sm flex-1 disabled:opacity-50"
              style={{ backgroundColor: HORMI_BLUE }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Actualizar Rol
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}