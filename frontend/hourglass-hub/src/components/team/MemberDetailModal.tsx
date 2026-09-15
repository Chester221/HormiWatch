import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Mail, Phone, CreditCard, Calendar, Pencil, Trash2,
  Crown, Briefcase, Wrench, Shield, CheckCircle2, Ban,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MemberLike {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  phone?: string | null;
  cedula?: string | null;
  createdAt?: string;
  created_at?: string;
  role?: string | { name?: string };
  profile?: {
    name?: string;
    lastName?: string;
    phone?: string;
    idCard?: string;
    profilePicture?: string;
    avatar_url?: string;
    createdAt?: string;
  };
  name?: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  Admin: { label: "Administrador", icon: Crown, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Manager: { label: "Manager", icon: Briefcase, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Technician: { label: "Técnico", icon: Wrench, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const getFullName = (m?: MemberLike | null) =>
  m?.full_name || (m?.profile?.name ? `${m.profile.name} ${m.profile.lastName || ""}`.trim() : m?.name || "Sin nombre");

const getInitials = (m?: MemberLike | null) =>
  getFullName(m).split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);

const getRoleName = (role: string | { name?: string } | null | undefined) =>
  typeof role === "string" ? role : role?.name || "Technician";

const getRoleConfig = (role: string | { name?: string } | null | undefined) => {
  const name = getRoleName(role);
  return ROLE_CONFIG[name] || ROLE_CONFIG.Technician;
};

const getIsActive = (m?: MemberLike | null) => m?.isActive !== false && m?.is_active !== false;

const getPhone = (m?: MemberLike | null) => m?.phone || m?.profile?.phone || null;

const getCedula = (m?: MemberLike | null) => m?.cedula || m?.profile?.idCard || null;

const getAvatar = (m?: MemberLike | null) =>
  m?.avatar_url || m?.profile?.profilePicture || m?.profile?.avatar_url || null;

const getCreatedAt = (m?: MemberLike | null) => m?.createdAt || m?.created_at || m?.profile?.createdAt || null;

interface MemberDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberLike | null;
  isAdmin: boolean;
  isManager: boolean;
  onEdit?: (m: MemberLike) => void;
  onDelete?: (m: MemberLike) => void;
  onToggleActive?: (m: MemberLike) => void;
}

export function MemberDetailModal({
  open, onOpenChange, member, isAdmin, isManager, onEdit, onDelete, onToggleActive,
}: MemberDetailModalProps) {
  if (!member) return null;

  const roleName = getRoleName(member.role);
  const roleConfig = getRoleConfig(member.role);
  const RoleIcon = roleConfig.icon;
  const fullName = getFullName(member);
  const isActive = getIsActive(member);
  const phone = getPhone(member);
  const cedula = getCedula(member);
  const createdAt = getCreatedAt(member);
  const avatar = getAvatar(member);
  const canManage = isAdmin || isManager;

  const rows = [
    { icon: Mail, label: "Email", value: member.email || "—" },
    { icon: Phone, label: "Teléfono", value: phone || "—" },
    { icon: CreditCard, label: "Cédula", value: cedula ? `V-${cedula}` : "—" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b border-border/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative"
            >
              <Avatar className="h-20 w-20 ring-2 ring-primary/30 shadow-lg">
                <AvatarImage src={avatar || ""} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/70 text-white">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-background ${isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
            </motion.div>
            <div>
              <DialogDescription className="sr-only">Detalle del miembro del equipo</DialogDescription>
              <h2 className="text-lg font-bold text-foreground tracking-tight">{fullName}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className={`gap-1 text-[11px] px-2.5 py-0.5 font-medium ${roleConfig.badge}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleConfig.label}
                </Badge>
                <Badge variant="outline" className={`gap-1 text-[11px] px-2.5 py-0.5 font-medium ${isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-rose-500/10 text-rose-600 border-rose-200"}`}>
                  {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                  {isActive ? "Activo" : "Suspendido"}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="Cerrar"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 border border-border/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 border border-border/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Rol</p>
                <p className="text-sm font-medium text-foreground truncate">{roleConfig.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 border border-border/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Miembro desde</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {createdAt ? ((): string => {
                    const d = new Date(createdAt);
                    return isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy", { locale: es });
                  })() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 pt-0 gap-2 border-t border-border/40">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg h-10 px-3 text-sm flex-1 text-muted-foreground hover:text-foreground">
            Cerrar
          </Button>
          {isAdmin && onToggleActive && (
            <Button
              variant="outline"
              onClick={() => onToggleActive(member)}
              className={`rounded-lg h-10 px-3 text-sm flex-1 border-border/60 ${isActive ? "hover:border-amber-300 hover:text-amber-600" : "hover:border-emerald-300 hover:text-emerald-600"}`}
            >
              {isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {isActive ? "Desactivar" : "Activar"}
            </Button>
          )}
          {canManage && onEdit && (
            <Button
              onClick={() => onEdit(member)}
              className="rounded-lg h-10 px-3 gap-2 bg-primary text-white text-sm flex-1 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
        </DialogFooter>

        {isAdmin && onDelete && (
          <div className="px-5 pb-5 -mt-1">
            <Button
              variant="ghost"
              onClick={() => onDelete(member)}
              className="w-full rounded-lg h-10 gap-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar miembro
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}