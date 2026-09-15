import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Pencil, Mail, Phone, User, Save, X, Lock,
  Crown, Briefcase, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface MemberLike {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  role?: string | { name?: string };
  profile?: {
    name?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
  };
}

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberLike | null;
  onSubmit: (data: { id?: string; name?: string; email?: string; phone?: string | null }) => void;
}

// ✅ Funciones para normalizar datos del miembro
const getFullName = (member: MemberLike | null | undefined) => {
  if (member?.full_name) return member.full_name;
  if (member?.profile?.name) {
    return `${member.profile.name} ${member.profile.lastName || ''}`.trim();
  }
  return member?.name || 'Sin nombre';
};

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
};

const getRoleName = (role: string | { name?: string } | null | undefined) => {
  if (typeof role === 'string') return role;
  if (role?.name) return role.name;
  return 'Technician';
};

const ROLE_BADGE: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  Admin: { label: "Administrador", icon: Crown, badge: "border-amber-200 bg-amber-50 text-amber-700" },
  Manager: { label: "Manager", icon: Briefcase, badge: "border-blue-200 bg-blue-50 text-blue-700" },
  Technician: { label: "Técnico", icon: Wrench, badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
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
        name: getFullName(member),
        email: member.email || "",
        phone: member.phone || member?.profile?.phone || "",
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const roleName = getRoleName(member?.role);
  const roleInfo = ROLE_BADGE[roleName] || ROLE_BADGE.Technician;
  const RoleIcon = roleInfo.icon;
  const isActive = member?.isActive !== false && member?.is_active !== false;
  const avatar = member?.avatar_url || member?.profile?.profilePicture || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.35, type: "spring" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-4 ring-primary/10"
            >
              <Pencil className="h-5 w-5 text-primary" strokeWidth={2} />
            </motion.div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground">
                {member?.id ? 'Editar Miembro' : 'Agregar Miembro'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {member?.id
                  ? `Modificando el perfil de: ${getFullName(member)}`
                  : "Completa los datos del nuevo miembro del equipo"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Resumen del miembro */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {getInitials(formData.name || member?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{getFullName(member)}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge variant="outline" className={`gap-1 px-1.5 py-0 text-[9px] font-semibold ${roleInfo.badge}`}>
                  <RoleIcon className="h-2.5 w-2.5" /> {roleInfo.label}
                </Badge>
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${isActive ? "text-emerald-600" : "text-rose-500"}`}>
                  {isActive ? "Activo" : "Suspendido"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="px-5 py-4 space-y-4">
          {/* Nombre */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                <User className="h-3 w-3 text-primary" strokeWidth={2} />
              </span>
              Nombre completo
              <span className="text-red-400 text-[10px] ml-1">*</span>
            </Label>
            <Input
              placeholder="Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`h-11 text-sm bg-background border-border/60 rounded-xl focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 transition-all ${
                errors.name ? 'border-red-400 focus-visible:ring-red-100' : ''
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="h-3 w-3" /> {errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                <Mail className="h-3 w-3 text-primary" strokeWidth={2} />
              </span>
              Correo electrónico
              <span className="text-red-400 text-[10px] ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!member?.id}
                className={`h-11 text-sm bg-background border-border/60 rounded-xl pr-10 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 transition-all ${
                  errors.email ? 'border-red-400 focus-visible:ring-red-100' : ''
                } ${member?.id ? 'opacity-60' : ''}`}
              />
              {member?.id && (
                <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              )}
            </div>
            {member?.id && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> El email no es editable
              </p>
            )}
            {errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="h-3 w-3" /> {errors.email}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                <Phone className="h-3 w-3 text-primary" strokeWidth={2} />
              </span>
              Teléfono
              <span className="text-muted-foreground/50 text-[10px] ml-1 font-light">(Opcional)</span>
            </Label>
            <Input
              placeholder="+58 412-1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-11 text-sm bg-background border-border/60 rounded-xl focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-4 gap-2 border-t border-border/40 bg-muted/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 flex-1 text-sm font-medium rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canEdit}
            className="h-11 flex-1 gap-2 bg-primary text-white text-sm font-medium rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:shadow-none transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" strokeWidth={2} />
            )}
            {member?.id ? 'Guardar Cambios' : 'Crear Miembro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}