import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { 
  UserPlus, Mail, Shield, Loader2, UserCheck,
  UserCog, Search, Users, X, Crown, Briefcase, Wrench
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const HORMI_BLUE = '#0DA2E7';

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMemberModal({ open, onOpenChange, onSuccess }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Technician');
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { profile } = useAuth();

  const currentUserRole = profile?.role || 'Technician';
  const isAdmin = currentUserRole === 'Admin';
  const isManager = currentUserRole === 'Manager';

  const getRoleOptions = () => {
    if (isAdmin) {
      return [
        { value: "Admin", label: "Administrador", description: "Acceso total al sistema", icon: Crown, color: "#f59e0b" },
        { value: "Manager", label: "Manager", description: "Gestión de proyectos y equipos", icon: Briefcase, color: "#3b82f6" },
        { value: "Technician", label: "Técnico", description: "Registro de horas y tareas", icon: Wrench, color: HORMI_BLUE },
      ];
    }
    if (isManager) {
      return [
        { value: "Manager", label: "Manager", description: "Gestión de proyectos y equipos", icon: Briefcase, color: "#3b82f6" },
        { value: "Technician", label: "Técnico", description: "Registro de horas y tareas", icon: Wrench, color: HORMI_BLUE },
      ];
    }
    return [];
  };

  const roleOptions = getRoleOptions();

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, role, avatar_url').order('full_name', { ascending: true });
    if (error) { toast.error('Error al cargar usuarios'); }
    else { setUserList(data || []); setShowUserList(true); }
    setIsLoadingUsers(false);
  };

  const selectUser = (user: any) => {
    setFoundUser(user);
    setEmail(user.email);
    setShowUserList(false);
    toast.success(`Usuario seleccionado: ${user.full_name || user.email}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) { toast.error('Debes seleccionar un usuario'); return; }
    setIsLoading(true);
    if (isManager && role === 'Admin') { toast.error('No tienes permisos para asignar Administrador'); setIsLoading(false); return; }
    if (isManager && foundUser.role === 'Admin') { toast.error('No puedes modificar un Administrador'); setIsLoading(false); return; }

    const { error: updateError } = await supabase.from('profiles').update({ role: role }).eq('id', foundUser.id);
    if (updateError) { toast.error(`Error: ${updateError.message}`); setIsLoading(false); return; }

    const roleLabel = roleOptions.find(opt => opt.value === role)?.label || role;
    toast.success(`${foundUser.full_name || foundUser.email} ahora tiene rol de ${roleLabel}`);
    setEmail(''); setRole('Technician'); setFoundUser(null);
    setIsLoading(false); onOpenChange(false); onSuccess();
  };

  const resetForm = () => {
    setEmail(''); setRole('Technician'); setFoundUser(null); setShowUserList(false);
  };

  const getRoleColor = (roleValue: string) => {
    switch (roleValue) {
      case 'Admin': return 'text-amber-600 bg-amber-50';
      case 'Manager': return 'text-blue-600 bg-blue-50';
      case 'Technician': return 'text-sky-600 bg-sky-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getRoleLabel = (roleValue: string) => {
    const option = roleOptions.find(opt => opt.value === roleValue);
    return option?.label || roleValue;
  };

  const getRoleIcon = (roleValue: string) => {
    switch (roleValue) {
      case 'Admin': return <Crown className="h-3 w-3" />;
      case 'Manager': return <Briefcase className="h-3 w-3" />;
      case 'Technician': return <Wrench className="h-3 w-3" />;
      default: return <UserCheck className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) resetForm(); onOpenChange(newOpen); }}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header con gradiente #0DA2E7 */}
        <div className="relative p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0DA2E7]/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 relative">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/30">
  <UserPlus className="h-5 w-5 text-white" />
</div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Gestionar Miembro</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Asigna o actualiza el rol de un miembro del equipo
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Selección de Usuario */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Seleccionar Usuario <span className="text-red-500">*</span>
            </Label>
            
            {!foundUser ? (
              <Button type="button" variant="outline" onClick={loadUsers} className="w-full gap-2 h-10 rounded-lg text-sm" disabled={isLoadingUsers}>
                {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isLoadingUsers ? 'Cargando...' : 'Buscar Usuarios'}
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-[#0DA2E7]/5 border border-[#0DA2E7]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {foundUser.avatar_url ? (
                      <img src={foundUser.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#0DA2E7] flex items-center justify-center text-white text-sm font-medium">
                        {(foundUser.full_name || foundUser.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{foundUser.full_name || "Usuario sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                      {foundUser.role && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${getRoleColor(foundUser.role)}`}>
                          {getRoleIcon(foundUser.role)} Rol actual: {getRoleLabel(foundUser.role)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setFoundUser(null); setEmail(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Usuarios */}
          {showUserList && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium">Usuarios disponibles</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowUserList(false)}><X className="h-3 w-3" /></Button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {userList.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No hay usuarios registrados</div>
                ) : (
                  userList.map((user) => (
                    <button key={user.id} type="button" onClick={() => selectUser(user)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#0DA2E7] flex items-center justify-center text-white text-xs font-medium">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || "Usuario sin nombre"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {user.role && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}{getRoleLabel(user.role)}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selección de Rol */}
          {foundUser && (
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Nuevo Rol
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-muted/30 border-border h-10 rounded-lg text-sm"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 text-sm">{option.icon && <option.icon className="h-3.5 w-3.5" style={{ color: option.color }} />}{option.label}</span>
                        <span className="text-[10px] text-muted-foreground pl-5">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {isAdmin ? "Como Administrador, puedes asignar cualquier rol" : isManager ? "Como Manager, puedes asignar Manager o Técnico." : "No tienes permisos para asignar roles"}
              </p>
            </div>
          )}

          {/* Info del cambio */}
          {foundUser && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2">
                <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Se actualizará el rol de <strong>{foundUser.full_name || foundUser.email}</strong>
                  {foundUser.role && (
                    <span> de <span className={getRoleColor(foundUser.role)}>{getRoleLabel(foundUser.role)}</span> a <span className={getRoleColor(role)}>{roleOptions.find(r => r.value === role)?.label || role}</span></span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg h-10 px-4 text-sm">Cancelar</Button>
            <Button type="submit" disabled={isLoading || !foundUser} className="rounded-lg h-10 px-4 gap-2 text-white text-sm" style={{ backgroundColor: HORMI_BLUE }}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {isLoading ? "Actualizando..." : "Actualizar Rol"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}