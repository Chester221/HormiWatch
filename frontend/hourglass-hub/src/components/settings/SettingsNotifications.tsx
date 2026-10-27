import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-3.5 dark:bg-muted/[0.06]${disabled ? " opacity-60" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {badge && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {badge}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Sección de notificaciones de Settings:
 *  - Personales (todos los roles): canales in-app / correo + nota de WhatsApp.
 *  Configuración global movida al módulo "Configuración del Servidor".
 */
export function SettingsNotifications() {
  const { profile, updatePreferences } = useAuth();
  const prefs: any = (profile?.preferences as any) || {};
  const notifPrefs = prefs.notifications || {};
  const role =
    typeof profile?.role === "string"
      ? profile.role
      : ((profile?.role as any)?.name || "");
  const isAdmin = role === "Admin";
  const isManager = role === "Manager";

  // ---- Canales personales ----
  const [inApp, setInApp] = useState<boolean>(notifPrefs.inApp ?? true);
  const [email, setEmail] = useState<boolean>(notifPrefs.email ?? true);
  useEffect(() => {
    setInApp(notifPrefs.inApp ?? true);
    setEmail(notifPrefs.email ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const savePersonal = async () => {
    try {
      await updatePreferences({ notifications: { inApp, email } });
      toast.success("Preferencias de notificaciones guardadas");
    } catch (e: any) {
      toast.error(`Error: ${e?.message || "No se pudo guardar"}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════ CANALES PERSONALES ═══════ */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
          Tus canales
        </p>
        <ToggleRow
          label="Notificaciones en la app"
          description="Muestra avisos en la campana y los paneles"
          checked={inApp}
          onChange={setInApp}
        />
        <ToggleRow
          label="Notificaciones por correo"
          description="Recibe alertas y el resumen diario en tu email"
          checked={email}
          onChange={setEmail}
        />
        {(isManager || isAdmin) && (
          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 dark:bg-muted/[0.06]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Las alertas críticas se envían al número registrado en tu
                perfil. Asegúrate de tenerlo actualizado.
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={savePersonal}>
            <Save className="h-3.5 w-3.5" />
            Guardar preferencias
          </Button>
        </div>
      </div>
    </div>
  );
}
