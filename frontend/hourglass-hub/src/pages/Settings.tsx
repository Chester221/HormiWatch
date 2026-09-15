import { useState, useEffect, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Fingerprint,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  Admin: "Administrador",
  Manager: "Líder",
  Leader: "Líder",
  Technician: "Técnico",
};

const ROLE_BADGE: Record<string, string> = {
  Admin: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800/40",
  Manager: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800/40",
  Leader: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800/40",
  Technician: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40",
};

const roleName = (role: any): string => {
  return typeof role === "string" ? role : role?.name || "Technician";
};

// ✅ Sección de configuración: encabezado consistente + cuerpo alineado
function Section({
  icon: Icon,
  iconClass,
  title,
  description,
  children,
  className,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </Card>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 dark:bg-muted/[0.06]">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        <Icon className="h-3 w-3 text-[#0DA2E7]" />
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function Settings() {
  const { user, profile, updatePreferences, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const themeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile) {
      const savedDark = profile.dark_mode ?? false;
      setDarkMode(savedDark);
      if (savedDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (themeTimeoutRef.current !== null) window.clearTimeout(themeTimeoutRef.current);
    };
  }, []);

  // 🔥 Cambio INSTANTÁNEO: aplica al momento y guarda en segundo plano
  const handleDarkModeToggle = async (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setSavingTheme(true);
    if (themeTimeoutRef.current !== null) window.clearTimeout(themeTimeoutRef.current);
    themeTimeoutRef.current = window.setTimeout(() => setSavingTheme(false), 1200);
    try {
      await updatePreferences({ dark_mode: checked });
    } catch {
      setDarkMode(!checked);
      if (!checked) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      toast.error("No se pudo guardar la preferencia");
    }
  };

  // 🔥 Información individual del usuario
  const info = useMemo(() => {
    const fullName = profile?.full_name?.trim() || user?.name || "No configurado";
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const role = roleName(profile?.role);
    const createdAt = user?.created_at || user?.createdAt || profile?.created_at;
    return {
      fullName,
      initials: initials || "US",
      role,
      roleLabel: ROLE_LABEL[role] || role,
      roleBadge: ROLE_BADGE[role] || ROLE_BADGE.Technician,
      createdAt,
    };
  }, [profile, user]);

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      toast.success("Tu cuenta de HormiWatch fue eliminada");
      setDeleteOpen(false);
      setTimeout(async () => {
        await signOut();
        navigate("/auth", { replace: true });
      }, 400);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar la cuenta");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25 },
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* ═══════════ HEADER ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-4"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-md shadow-[#0DA2E7]/20">
            <SettingsIcon className="h-6 w-6 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi Configuración</h1>
            <p className="text-sm text-muted-foreground">
              Preferencias y ajustes individuales de tu cuenta
            </p>
          </div>
        </motion.div>

        {/* ═══════════ APARIENCIA ═══════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.03 }}>
          <Section
            icon={Palette}
            iconClass="bg-[#0DA2E7]/10 text-[#0DA2E7]"
            title="Apariencia"
            description="Cómo se ve la aplicación solo para tu cuenta"
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 dark:bg-muted/[0.06]">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
                    darkMode
                      ? "bg-[#0DA2E7]/10 text-[#0DA2E7] ring-[#0DA2E7]/25"
                      : "bg-amber-50 text-amber-500 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/30"
                  )}
                >
                  {darkMode ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {darkMode ? "Modo oscuro" : "Modo claro"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {darkMode ? "Reduce la fatiga visual con poca luz" : "Vista clara y luminosa"}
                  </p>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
                className="shrink-0 data-[state=checked]:bg-[#0DA2E7]"
              />
            </div>
            <p className="mt-2 flex h-4 items-center text-[11px] text-muted-foreground/70">
              {savingTheme && (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-[#0DA2E7]" /> Guardando en tu perfil...
                </span>
              )}
            </p>
          </Section>
        </motion.div>

        {/* ═══════════ INFORMACIÓN DE LA CUENTA ═══════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.06 }}>
          <Section
            icon={User}
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
            title="Información de la Cuenta"
            description="Detalles de tu cuenta de HormiWatch"
          >
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 dark:bg-muted/[0.06]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] text-sm font-bold text-white shadow-sm">
                {info.initials}
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{info.fullName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Fingerprint className="h-3 w-3 text-[#0DA2E7]" />
                    {info.roleLabel}
                  </p>
                </div>
                <Badge className={cn("shrink-0 rounded-full border px-2 py-0 text-[10px] font-medium", info.roleBadge)}>
                  {info.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field icon={Mail} label="Email" value={user?.email || "—"} />
              <Field icon={Shield} label="Rol" value={info.roleLabel} />
              <Field icon={User} label="Nombre" value={info.fullName} />
              <Field
                icon={Calendar}
                label="Miembro desde"
                value={
                  info.createdAt
                    ? new Date(info.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"
                }
              />
            </div>
          </Section>
        </motion.div>

        {/* ═══════════ NOTIFICACIONES ═══════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.09 }}>
          <Section
            icon={Bell}
            iconClass="bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
            title="Notificaciones"
            description="Controla qué avisos recibes"
          >
            <div className="py-2 text-center">
              <p className="text-sm text-muted-foreground">
                La configuración de notificaciones estará disponible pronto
              </p>
            </div>
          </Section>
        </motion.div>

        {/* ═══════════ SESIÓN ═══════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
          <Section
            icon={KeyRound}
            iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
            title="Sesión"
            description="Administra el acceso a tu cuenta"
          >
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 dark:bg-muted/[0.06]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/20">
                  <LogOut className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Cerrar sesión</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Termina tu sesión en este dispositivo
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 rounded-lg"
                onClick={async () => {
                  await signOut();
                  navigate("/auth", { replace: true });
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </Button>
            </div>
          </Section>
        </motion.div>

        {/* ═══════════ ZONA DE PELIGRO ═══════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl border-red-200/70 bg-card shadow-sm dark:border-red-900/40">
            <div className="flex items-center gap-3 border-b border-red-100/80 px-6 pb-4 pt-5 dark:border-red-950/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-tight text-foreground">Zona de Peligro</h2>
                <p className="text-xs text-muted-foreground">Acciones irreversibles</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200/60 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/10">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20">
                    <Trash2 className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Elimina permanentemente tu cuenta y todos sus datos
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 rounded-lg border-red-300/70 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ═══════════ DIÁLOGO DE CONFIRMACIÓN ═══════════ */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent hideCloseButton className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Eliminar cuenta</DialogTitle>
            <DialogDescription>Confirmación de eliminación de cuenta</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 px-6 pb-5 pt-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-inset ring-red-200/60 dark:bg-red-950/30 dark:ring-red-800/40">
              <Trash2 className="h-6 w-6 text-red-500" />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight text-foreground">Eliminar tu cuenta</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Esta acción es permanente e irreversible
              </p>
            </div>
          </div>

          <div className="px-6 pb-5">
            <p className="text-sm leading-relaxed text-foreground">
              ¿Estás seguro que deseas eliminar tu cuenta de HormiWatch?
            </p>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200/50 bg-amber-50/70 px-3.5 py-3 dark:border-amber-800/30 dark:bg-amber-950/10">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                Se eliminarán permanentemente tu cuenta y toda la información asociada. No podrás recuperarla.
              </p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/20 px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg px-3 text-xs font-medium"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={deleting}
              onClick={handleDeleteConfirmed}
              className="h-9 gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Sí, eliminar mi cuenta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}