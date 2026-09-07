import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Loader2, 
  UserCog, 
  Mail, 
  Phone, 
  User, 
  Save, 
  X, 
  Sparkles,
  Users,
  Shield,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
  onSubmit: (data: any) => void;
}

// ✅ Función para obtener nombre completo
const getFullName = (member: any) => {
  if (member?.full_name) return member.full_name;
  if (member?.profile?.name) {
    return `${member.profile.name} ${member.profile.lastName || ''}`.trim();
  }
  return 'Sin nombre';
};

// ✅ Función para obtener el nombre del rol
const getRoleName = (role: any) => {
  if (typeof role === 'string') return role;
  if (role?.name) return role.name;
  return 'Sin rol';
};

// ✅ Función para obtener iniciales
const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
};

// ✅ Icono según rol
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Admin': return Shield;
    case 'Manager': return Briefcase;
    default: return Users;
  }
};

export function TeamMemberFormModal({ open, onOpenChange, member, onSubmit }: TeamMemberFormModalProps) {
  const { profile } = useAuth();
  const userRole = typeof profile?.role === 'string' ? profile?.role : profile?.role?.name || 'Technician';
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager';

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member && open) {
      setFormData({
        name: member.full_name || member.name || "",
        email: member.email || "",
        phone: member.phone || "",
      });
    }
  }, [member, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!formData.email.trim()) newErrors.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido";
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
        phone: formData.phone || null,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const roleName = getRoleName(member?.role);
  const RoleIcon = getRoleIcon(roleName);
  const fullName = getFullName(member);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header con icono grande */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/30"
            >
              {member?.id ? (
                <UserCog className="h-7 w-7 text-white" strokeWidth={1.8} />
              ) : (
                <Sparkles className="h-7 w-7 text-white" strokeWidth={1.8} />
              )}
            </motion.div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {member?.id ? 'Editar Miembro' : 'Agregar Miembro'}
                {member?.id && (
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-2 py-0 bg-[#0DA2E7]/10 text-[#0DA2E7] border-[#0DA2E7]/20 font-medium"
                  >
                    ID: {member.id.slice(0, 6)}
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 font-light flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#0DA2E7]" />
                {member?.id 
                  ? `Actualizando información de ${fullName}` 
                  : 'Completa los datos del nuevo miembro'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-[#0DA2E7]/5 to-transparent border border-[#0DA2E7]/10">
            <Avatar className="h-16 w-16 ring-2 ring-[#0DA2E7]/20 shadow-md">
              <AvatarImage src={member?.avatar_url || ""} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-[#0DA2E7]/20 to-[#0B8BC7]/10 text-[#0DA2E7]">
                {getInitials(formData.name || member?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {fullName}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-2.5 py-0.5 bg-[#0DA2E7]/10 text-[#0DA2E7] border-[#0DA2E7]/20 font-medium flex items-center gap-1"
                >
                  <RoleIcon className="h-3 w-3" />
                  {roleName}
                </Badge>
                {member?.is_active !== false ? (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Activo
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5 text-[#0DA2E7]" strokeWidth={1.8} />
                Nombre completo
                <span className="text-red-400 text-[10px] ml-1">*</span>
              </Label>
              <Input
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`h-11 text-sm bg-background border-border/60 rounded-xl focus:border-[#0DA2E7]/50 focus:ring-2 focus:ring-[#0DA2E7]/10 transition-all ${
                  errors.name ? 'border-red-400 focus:ring-red-100' : ''
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="h-3 w-3" /> {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Mail className="h-3.5 w-3.5 text-[#0DA2E7]" strokeWidth={1.8} />
                Correo electrónico
                <span className="text-red-400 text-[10px] ml-1">*</span>
              </Label>
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`h-11 text-sm bg-background border-border/60 rounded-xl focus:border-[#0DA2E7]/50 focus:ring-2 focus:ring-[#0DA2E7]/10 transition-all ${
                  errors.email ? 'border-red-400 focus:ring-red-100' : ''
                }`}
                disabled={!!member?.id}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="h-3 w-3" /> {errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Phone className="h-3.5 w-3.5 text-[#0DA2E7]" strokeWidth={1.8} />
                Teléfono
                <span className="text-muted-foreground/50 text-[10px] ml-1 font-light">(Opcional)</span>
              </Label>
              <Input
                placeholder="+58 412-1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 text-sm bg-background border-border/60 rounded-xl focus:border-[#0DA2E7]/50 focus:ring-2 focus:ring-[#0DA2E7]/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-3 gap-2 border-t border-border/30 bg-muted/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 text-sm font-medium rounded-xl hover:bg-muted/50 hover:border-[#0DA2E7]/30 transition-all flex-1 border-border/50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canEdit}
            className="h-11 px-6 gap-2 text-white text-sm font-medium rounded-xl flex-1 transition-all bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] hover:shadow-lg hover:shadow-[#0DA2E7]/30 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.8} />
            )}
            {member?.id ? 'Guardar Cambios' : 'Crear Miembro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}