import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { useUpdateTeamMember } from "@/hooks/useTeamMembers";
import { Users, Shield, Search } from "lucide-react";

interface ManageMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
  isManager?: boolean;
}

const ROLE_OPTIONS = [
  { value: "Admin", label: "Administrador" },
  { value: "Manager", label: "Manager" },
  { value: "Technician", label: "Técnico" },
];

const getFullName = (user: any) => {
  if (user?.full_name) return user.full_name;
  if (user?.profile?.name) {
    return `${user.profile.name} ${user.profile.lastName || ''}`.trim();
  }
  return user?.email?.split('@')[0] || 'Usuario';
};

const getRoleName = (role: any) => {
  if (typeof role === 'string') return role;
  if (role?.name) return role.name;
  return 'Technician';
};

export function ManageMemberModal({ open, onOpenChange, onSuccess, isAdmin, isManager }: ManageMemberModalProps) {
  const updateMember = useUpdateTeamMember();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

  // ✅ visibleRoleOptions calculado dentro del componente con isManager
  const visibleRoleOptions = isManager
    ? ROLE_OPTIONS.filter((o) => o.value !== 'Admin')
    : ROLE_OPTIONS;

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getAll();
      let data = Array.isArray(response) ? response : response?.records || [];
      // Manager solo ve miembros no-Admin
      if (isManager) {
        data = data.filter((u: any) => getRoleName(u.role) !== 'Admin');
      }
      data.sort((a: any, b: any) => getFullName(a).localeCompare(getFullName(b)));
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          getFullName(user).toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUser(null);
      setNewRole("");
      setSearchQuery("");
    }
  }, [open]);

  const selectUser = (user: any) => {
    const roleName = getRoleName(user.role);
    setSelectedUser(user);
    setNewRole(roleName);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) {
      toast.error('Selecciona un usuario');
      return;
    }
    if (!newRole) {
      toast.error('Selecciona un rol');
      return;
    }
    // Manager no puede asignar Administrador
    if (isManager && newRole === 'Admin') {
      toast.error('No tienes permisos para asignar Administrador');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ UPDATE OPTIMISTA de rol: se refleja al instante en la lista
      await updateMember.mutateAsync({ id: selectedUser.id, data: { role: newRole } });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (isManager) {
      toast.error('No tienes permisos para cambiar el estado');
      return;
    }
    try {
      await usersApi.update(userId, { isActive: !currentActive });
      toast.success(`Usuario ${!currentActive ? 'activado' : 'desactivado'}`);
      loadUsers();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const getRoleBadge = (roleValue: string) => {
    const config = ROLE_OPTIONS.find(r => r.value === roleValue);
    if (!config) return null;
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20">
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border p-0 rounded-2xl shadow-2xl">
        {/* HEADER */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-2xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Gestionar Rol
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Cambia el rol o estado de los miembros del equipo
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              <Users className="h-3 w-3 mr-1" />
              {users.length} miembros
            </Badge>
          </DialogHeader>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm bg-background border-border focus:border-primary/50"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No se encontraron usuarios</div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                {filteredUsers.length} USUARIOS ENCONTRADOS
              </p>
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left border ${
                    selectedUser?.id === user.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-border hover:bg-muted/30'
                  }`}
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                    <AvatarImage src={user.profile?.profilePicture} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {getFullName(user).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getFullName(user)}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getRoleBadge(getRoleName(user.role))}
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="mt-3 p-3 rounded-xl border border-primary/15 bg-primary/5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Nuevo rol</label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="h-9 text-sm bg-background border-border">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleRoleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  {isManager ? (
                    <div className="flex h-9 w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground border-border text-xs font-medium cursor-not-allowed">
                      {selectedUser.isActive ? "✅ Activo" : "⛔ Inactivo"}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleActive(selectedUser.id, selectedUser.isActive)}
                      className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                        selectedUser.isActive
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      {selectedUser.isActive ? "✅ Activo" : "⛔ Inactivo"}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Usuario: <span className="font-medium">{getFullName(selectedUser)}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-3 border-t border-border gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-9 text-sm"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateRole}
            disabled={!selectedUser || !newRole || isLoading || getRoleName(selectedUser.role) === newRole}
            className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Actualizar Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}