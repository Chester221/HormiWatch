import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { 
  Loader2, UserCog, Mail, Phone, Shield, Save, X,
  Crown, Briefcase, Wrench, User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HORMI_BLUE = '#0DA2E7';

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
  onSubmit: (data: any) => void;
}

// 🔥 Roles disponibles para Manager (excluye Admin)
const MANAGER_ROLES = [
  { value: "Manager", label: "Manager", icon: Briefcase },
  { value: "Technician", label: "Técnico", icon: Wrench },
];

// 🔥 Todos los roles (para Admin)
const ALL_ROLES = [
  { value: "Admin", label: "Administrador", icon: Crown },
  { value: "Manager", label: "Manager", icon: Briefcase },
  { value: "Technician", label: "Técnico", icon: Wrench },
];

export function TeamMemberFormModal({ open, onOpenChange, member, onSubmit }: TeamMemberFormModalProps) {
  const { profile } = useAuth();
  const userRole = profile?.role;

  // 🔥 Admin o Manager pueden cambiar roles
  const canChangeRole = userRole === 'Admin' || userRole === 'Manager';
  
  // 🔥 Si es Admin → todos los roles, si es Manager → solo Manager/Technician
  const availableRoles = userRole === 'Admin' ? ALL_ROLES : MANAGER_ROLES;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member && open) {
      setFormData({
        name: member.full_name || member.name || "",
        email: member.email || "",
        role: member.role || "Technician",
        phone: member.phone || "",
      });
    }
  }, [member, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!formData.email.trim()) newErrors.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido";
    if (!formData.role) newErrors.role = "Selecciona un rol";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        id: member?.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0DA2E7]/10">
              <UserCog className="h-4 w-4 text-[#0DA2E7]" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {member?.id ? 'Editar Miembro' : 'Agregar Miembro'}
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Avatar + Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-[#0DA2E7]/15">
              <AvatarImage src={member?.avatar_url || ""} />
              <AvatarFallback className="text-sm font-medium bg-[#0DA2E7]/10 text-[#0DA2E7]">
                {getInitials(formData.name || member?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {formData.name || "Sin nombre"}
              </p>
              {member?.role && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-[#0DA2E7]/5 border-[#0DA2E7]/20">
                  {member.role}
                </Badge>
              )}
            </div>
          </div>

          {/* Campos */}
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nombre completo</Label>
              <Input
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 h-9 text-sm bg-background border-border rounded-lg ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && <p className="text-[9px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 h-9 text-sm bg-background border-border rounded-lg ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  disabled={!!member?.id}
                />
                {errors.email && <p className="text-[9px] text-red-500 mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Teléfono</Label>
                <Input
                  placeholder="+58 412..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-9 text-sm bg-background border-border rounded-lg"
                />
              </div>
            </div>

            {/* 🔥 ROL - Admin o Manager pueden cambiar */}
            {canChangeRole ? (
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className={`mt-1 h-9 text-sm bg-background border-border rounded-lg ${
                    errors.role ? 'border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-[#0DA2E7]" />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-[9px] text-red-500 mt-0.5">{errors.role}</p>}
                {userRole === 'Manager' && (
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">No puedes asignar el rol de Administrador</p>
                )}
              </div>
            ) : (
              /* 🔥 Si es Técnico, mostrar el rol como texto */
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rol</Label>
                <div className="mt-1 h-9 flex items-center px-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground">
                  {formData.role || "Sin rol"}
                </div>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  No tienes permiso para cambiar roles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 pb-5 pt-3 gap-2 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-9 px-4 text-sm rounded-lg flex-1 hover:bg-muted/50 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-9 px-4 gap-2 text-white text-sm rounded-lg flex-1 transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7] shadow-sm hover:shadow-md"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {member?.id ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}