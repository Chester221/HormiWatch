import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown, Briefcase, Wrench, Mail, Phone, Eye, Pencil, Trash2, ArrowRight, MoreVertical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════ HELPERS DEFENSIVOS ═══════════════

export interface TeamMemberLike {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  phone?: string | null;
  cedula?: string | null;
  role?: string | { name?: string };
  name?: string;
  profile?: {
    name?: string;
    lastName?: string;
    phone?: string;
    idCard?: string;
    profilePicture?: string;
    createdAt?: string;
  };
}

const getFullName = (m?: TeamMemberLike | null) =>
  m?.full_name || (m?.profile?.name ? `${m.profile.name} ${m.profile.lastName || ""}`.trim() : m?.name || "Sin nombre");

const getInitials = (m?: TeamMemberLike | null) =>
  getFullName(m).split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);

const getRoleName = (role: string | { name?: string } | null | undefined) =>
  typeof role === "string" ? role : role?.name || "Technician";

const getIsActive = (m?: TeamMemberLike | null) => m?.isActive !== false && m?.is_active !== false;

const getPhone = (m?: TeamMemberLike | null) => m?.phone || m?.profile?.phone || null;

const getAvatar = (m?: TeamMemberLike | null) =>
  m?.avatar_url || m?.profile?.profilePicture || null;

const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  Admin: { label: "Administrador", icon: Crown, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Manager: { label: "Manager", icon: Briefcase, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Technician: { label: "Técnico", icon: Wrench, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const getRoleConfig = (role: string | { name?: string } | null | undefined) => {
  const name = getRoleName(role);
  return ROLE_CONFIG[name] || ROLE_CONFIG.Technician;
};

// ═══════════════ TARJETA ═══════════════

interface TeamMemberCardProps {
  member: TeamMemberLike;
  idx: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (m: TeamMemberLike) => void;
  onDelete: (m: TeamMemberLike) => void;
  onOpenDetail: (m: TeamMemberLike) => void;
}

export function TeamMemberCard({
  member, idx, canEdit, canDelete, onEdit, onDelete, onOpenDetail,
}: TeamMemberCardProps) {
  const roleConfig = getRoleConfig(member?.role);
  const RoleIcon = roleConfig.icon;
  const isActive = getIsActive(member);
  const fullName = getFullName(member);
  const email = member?.email;
  const phone = getPhone(member);
  const avatar = getAvatar(member);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -4 }}
      onClick={() => onOpenDetail(member)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition-colors duration-300 hover:border-[#0DA2E7]/40 hover:shadow-[0_10px_30px_-15px_rgba(13,162,231,0.35)]"
    >
      {/* Línea superior de acento */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#0DA2E7]/0 to-transparent transition-colors duration-300 group-hover:via-[#0DA2E7]/70" />

      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-border transition-all duration-300 group-hover:ring-[#0DA2E7]/40">
            <AvatarImage src={avatar || ""} />
            <AvatarFallback className="bg-gradient-to-br from-[#0DA2E7]/15 to-[#0DA2E7]/5 text-sm font-bold text-[#0DA2E7]">
              {getInitials(member)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-[3px] ring-card",
              isActive ? "bg-emerald-400" : "bg-rose-400"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-[#0DA2E7]">
            {fullName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("gap-1 rounded-md px-2 py-0 text-[10px] font-semibold", roleConfig.badge)}>
              <RoleIcon className="h-2.5 w-2.5" />
              {roleConfig.label}
            </Badge>
            <span
              className={cn(
                "inline-flex h-4 items-center gap-1 rounded-md border px-1.5 text-[9px] font-semibold uppercase tracking-wide",
                isActive ? "border-emerald-200 bg-emerald-500/10 text-emerald-600" : "border-rose-200 bg-rose-500/10 text-rose-500"
              )}
            >
              {isActive ? "Activo" : "Suspendido"}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
            >
              <span className="sr-only">Acciones</span>
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/60 bg-card p-1 shadow-xl">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenDetail(member); }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <Eye className="h-3.5 w-3.5 text-[#0DA2E7]" /> Ver detalle
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(member); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(member); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-2">
        {email && (
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0DA2E7]/8">
              <Mail className="h-3 w-3 text-[#0DA2E7]" />
            </span>
            <span className="truncate font-medium">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0DA2E7]/8">
              <Phone className="h-3 w-3 text-[#0DA2E7]" />
            </span>
            <span className="truncate font-medium">{phone}</span>
          </div>
        )}
        {!email && !phone && (
          <p className="text-xs italic text-muted-foreground/40">Sin información de contacto</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/25 pt-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(member); }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0DA2E7] transition-all hover:gap-2"
        >
          <Eye className="h-3 w-3" />
          Ver detalle
          <ArrowRight className="h-3 w-3" />
        </button>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">
          {roleConfig.label}
        </span>
      </div>
    </motion.div>
  );
}