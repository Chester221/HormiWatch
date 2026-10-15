import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/useNotifications";

const WEBHOOKS: { key: string; label: string }[] = [
  { key: "alertas", label: "Alertas generales" },
  { key: "usuarios", label: "Usuarios" },
  { key: "contratos", label: "Contratos" },
  { key: "proyectos", label: "Proyectos" },
  { key: "tareas", label: "Tareas" },
];

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-3.5 dark:bg-muted/[0.06]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ThresholdInput({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number | "";
  suffix?: string;
  onChange: (v: number | "") => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="h-9 pr-10 text-sm"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Sección de notificaciones de Settings:
 *  - Personales (todos los roles): canales in-app / correo + nota de WhatsApp.
 *  - Globales (solo Admin): canales, digest 8 AM, umbrales y webhooks Discord.
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

  // ---- Configuración global (solo admin) ----
  const { data: settings, isLoading } = useNotificationSettings(isAdmin);
  const updateSettings = useUpdateNotificationSettings();
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setDraft({
        channels: {
          inApp: true,
          email: true,
          discord: true,
          whatsapp: false,
          ...(settings.channels || {}),
        },
        thresholds: {
          yellow: 80,
          orange: 95,
          red: 100,
          expiringDays: 15,
          inactivityDays: 3,
          taskStaleDays: 5,
          ...(settings.thresholds || {}),
        },
        discord: {
          alertas: "",
          usuarios: "",
          contratos: "",
          proyectos: "",
          tareas: "",
          ...(settings.discord || {}),
        },
        digestHour: settings.digestHour ?? 8,
        digestEnabled: settings.digestEnabled ?? true,
      });
    }
  }, [settings]);

  const setChannel = (k: string, v: boolean) =>
    setDraft((d: any) => ({ ...d, channels: { ...d.channels, [k]: v } }));
  const setThreshold = (k: string, v: number | "") =>
    setDraft((d: any) => ({ ...d, thresholds: { ...d.thresholds, [k]: v } }));
  const setWebhook = (k: string, v: string) =>
    setDraft((d: any) => ({ ...d, discord: { ...d.discord, [k]: v } }));

  const saveGlobal = () => {
    if (!draft) return;
    updateSettings.mutate({
      channels: draft.channels,
      thresholds: {
        yellow: Number(draft.thresholds.yellow) || 0,
        orange: Number(draft.thresholds.orange) || 0,
        red: Number(draft.thresholds.red) || 0,
        expiringDays: Number(draft.thresholds.expiringDays) || 0,
        inactivityDays: Number(draft.thresholds.inactivityDays) || 0,
        taskStaleDays: Number(draft.thresholds.taskStaleDays) || 0,
      },
      discord: draft.discord,
      digestHour: Number(draft.digestHour) || 8,
      digestEnabled: !!draft.digestEnabled,
    });
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

      {/* ═══════ CONFIGURACIÓN GLOBAL (ADMIN) ═══════ */}
      {isAdmin && (
        <div className="space-y-5 border-t border-border/50 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Configuración global (administradores)
          </p>

          {isLoading || !draft ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración...
            </div>
          ) : (
            <>
              {/* Canales globales */}
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Canales habilitados
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ToggleRow
                    label="En la app"
                    description="Panel y campana"
                    checked={!!draft.channels.inApp}
                    onChange={(v) => setChannel("inApp", v)}
                  />
                  <ToggleRow
                    label="Correo"
                    description="Alertas y resumen"
                    checked={!!draft.channels.email}
                    onChange={(v) => setChannel("email", v)}
                  />
                  <ToggleRow
                    label="Discord"
                    description="Webhooks por categoría"
                    checked={!!draft.channels.discord}
                    onChange={(v) => setChannel("discord", v)}
                  />
                  <ToggleRow
                    label="WhatsApp"
                    description="Solo alertas críticas"
                    checked={!!draft.channels.whatsapp}
                    onChange={(v) => setChannel("whatsapp", v)}
                  />
                </div>
              </div>

              {/* Resumen diario */}
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Resumen diario
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ToggleRow
                    label="Resumen 8:00 AM"
                    description="Agrupa avisos del día"
                    checked={!!draft.digestEnabled}
                    onChange={(v) =>
                      setDraft((d: any) => ({ ...d, digestEnabled: v }))
                    }
                  />
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium text-foreground">
                      Hora del resumen
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={draft.digestHour}
                      onChange={(e) =>
                        setDraft((d: any) => ({
                          ...d,
                          digestHour: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      className="h-9 w-24 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Umbrales */}
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Umbrales de alerta
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ThresholdInput
                    label="Consumo amarillo"
                    suffix="%"
                    value={draft.thresholds.yellow}
                    onChange={(v) => setThreshold("yellow", v)}
                  />
                  <ThresholdInput
                    label="Consumo naranja"
                    suffix="%"
                    value={draft.thresholds.orange}
                    onChange={(v) => setThreshold("orange", v)}
                  />
                  <ThresholdInput
                    label="Consumo rojo (crítico)"
                    suffix="%"
                    value={draft.thresholds.red}
                    onChange={(v) => setThreshold("red", v)}
                  />
                  <ThresholdInput
                    label="Contrato por vencer"
                    suffix="d"
                    value={draft.thresholds.expiringDays}
                    onChange={(v) => setThreshold("expiringDays", v)}
                  />
                  <ThresholdInput
                    label="Inactividad"
                    suffix="d"
                    value={draft.thresholds.inactivityDays}
                    onChange={(v) => setThreshold("inactivityDays", v)}
                  />
                  <ThresholdInput
                    label="Tarea estancada"
                    suffix="d"
                    value={draft.thresholds.taskStaleDays}
                    onChange={(v) => setThreshold("taskStaleDays", v)}
                  />
                </div>
              </div>

              {/* Webhooks Discord */}
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Webhooks de Discord
                </p>
                <div className="space-y-2">
                  {WEBHOOKS.map((w) => (
                    <div
                      key={w.key}
                      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[180px_1fr]"
                    >
                      <Label className="text-xs font-medium text-foreground">
                        {w.label}
                      </Label>
                      <Input
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={draft.discord[w.key] || ""}
                        onChange={(e) => setWebhook(w.key, e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-border/50 pt-4">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={saveGlobal}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Guardar configuración
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
