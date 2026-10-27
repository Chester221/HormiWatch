import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bell, Loader2, Save, Server, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGlobalNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/useNotifications";
import { motion } from "framer-motion";

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
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-3.5 dark:bg-muted/[0.06]${disabled ? " opacity-60" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
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
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
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

export default function ServerSettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const role = typeof profile?.role === "string" ? profile.role : ((profile?.role as any)?.name || "");
  const isAdmin = role === "Admin";

  const { data: settings, isLoading } = useGlobalNotificationSettings(isAdmin);
  const updateSettings = useUpdateNotificationSettings();
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (settings && !draft) {
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
        discordWebhookUrl: (settings as any).discordWebhookUrl || "",
        digestHour: settings.digestHour ?? 8,
        digestEnabled: settings.digestEnabled ?? true,
        dailySummary: {
          enabled: true,
          startHour: 8,
          endHour: 17,
          include: {
            created: true,
            deleted: true,
            expired: true,
            expiring: true,
            inactive: true,
            started: true,
            paused: true,
            completed: true,
            updated: true,
          },
          ...((settings as any).dailySummary || {}),
          include: {
            created: true,
            deleted: true,
            expired: true,
            expiring: true,
            inactive: true,
            started: true,
            paused: true,
            completed: true,
            updated: true,
            ...(((settings as any).dailySummary || {}).include || {}),
          },
        },
        notifyProjectStarted: (settings as any).notifyProjectStarted ?? true,
      });
    }
  }, [settings, draft]);

  const setChannel = (k: string, v: boolean) => setDraft((d: any) => ({ ...d, channels: { ...d.channels, [k]: v } }));
  const setThreshold = (k: string, v: number | "") => setDraft((d: any) => ({ ...d, thresholds: { ...d.thresholds, [k]: v } }));
  const setWebhook = (k: string, v: string) => setDraft((d: any) => ({ ...d, discord: { ...d.discord, [k]: v } }));
  const setInclude = (k: string, v: boolean) =>
    setDraft((d: any) => ({
      ...d,
      dailySummary: { ...(d.dailySummary || {}), include: { ...(d.dailySummary?.include || {}), [k]: v } },
    }));

  const save = () => {
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
      discordWebhookUrl: draft.discordWebhookUrl || null,
      digestHour: Number(draft.digestHour) || 8,
      digestEnabled: !!draft.digestEnabled,
      dailySummary: {
        enabled: !!draft.dailySummary?.enabled,
        startHour: Number(draft.dailySummary?.startHour) || 8,
        endHour: Number(draft.dailySummary?.endHour) || 17,
        include: draft.dailySummary?.include || {},
      },
      notifyProjectStarted: !!draft.notifyProjectStarted,
    });
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-md shadow-red-500/20">
            <Server className="h-6 w-6 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración del Servidor</h1>
          </div>
        </motion.div>

        <Card className="rounded-2xl border-red-200/70 bg-red-50/60 shadow-sm dark:border-red-900/40 dark:bg-red-950/10">
          <div className="flex items-start gap-3 px-6 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Advertencia: Todo lo que se configure aquí afectará a TODO el sistema de HormiWatch.
            </p>
          </div>
        </Card>

        {isLoading || !draft ? (
          <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración...
            </div>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Webhook className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-foreground">Webhook de Discord</h2>
                  <p className="text-xs text-muted-foreground">Un solo webhook para el canal #notificaciones</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={draft.discordWebhookUrl || ""}
                    onChange={(e) => setDraft((d: any) => ({ ...d, discordWebhookUrl: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Webhooks por categoría (compatibilidad)</p>
                  {WEBHOOKS.map((w) => (
                    <div key={w.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[180px_1fr]">
                      <Label className="text-xs font-medium text-foreground">{w.label}</Label>
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
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Bell className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-foreground">Canales habilitados</h2>
                  <p className="text-xs text-muted-foreground">Configuración global de canales de notificación</p>
                </div>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ToggleRow label="In-app" description="Panel y campana" checked={!!draft.channels.inApp} onChange={(v) => setChannel("inApp", v)} />
                <ToggleRow label="Email" description="Alertas y resumen diario" checked={!!draft.channels.email} onChange={(v) => setChannel("email", v)} />
                <ToggleRow label="Discord" description="Webhooks" checked={!!draft.channels.discord} onChange={(v) => setChannel("discord", v)} />
                <ToggleRow label="WhatsApp" description="Solo alertas críticas" checked={!!draft.channels.whatsapp} onChange={(v) => setChannel("whatsapp", v)} />
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-foreground">Umbrales</h2>
                  <p className="text-xs text-muted-foreground">Umbrales para alertas del sistema</p>
                </div>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ThresholdInput label="Consumo amarillo" suffix="%" value={draft.thresholds.yellow} onChange={(v) => setThreshold("yellow", v)} />
                <ThresholdInput label="Consumo naranja" suffix="%" value={draft.thresholds.orange} onChange={(v) => setThreshold("orange", v)} />
                <ThresholdInput label="Consumo rojo (crítico)" suffix="%" value={draft.thresholds.red} onChange={(v) => setThreshold("red", v)} />
                <ThresholdInput label="Contrato por vencer" suffix="d" value={draft.thresholds.expiringDays} onChange={(v) => setThreshold("expiringDays", v)} />
                <ThresholdInput label="Proyectos inactivos" suffix="d" value={draft.thresholds.inactivityDays} onChange={(v) => setThreshold("inactivityDays", v)} />
                <ThresholdInput label="Tareas inactivas/estancadas" suffix="d" value={draft.thresholds.taskStaleDays} onChange={(v) => setThreshold("taskStaleDays", v)} />
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Bell className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-foreground">Resumen diario</h2>
                  <p className="text-xs text-muted-foreground">Incluye todo lo ocurrido en el día. Solo se envía si el correo está habilitado.</p>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <ToggleRow label="Habilitar resumen diario" description="Enviar resumen por correo" checked={!!draft.dailySummary?.enabled} onChange={(v) => setDraft((d: any) => ({ ...d, dailySummary: { ...(d.dailySummary || {}), enabled: v } }))} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Hora inicio</Label>
                    <Input type="number" min={0} max={23} value={draft.dailySummary?.startHour ?? 8} onChange={(e) => setDraft((d: any) => ({ ...d, dailySummary: { ...(d.dailySummary || {}), startHour: e.target.value === "" ? "" : Number(e.target.value) } }))} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Hora fin</Label>
                    <Input type="number" min={0} max={23} value={draft.dailySummary?.endHour ?? 17} onChange={(e) => setDraft((d: any) => ({ ...d, dailySummary: { ...(d.dailySummary || {}), endHour: e.target.value === "" ? "" : Number(e.target.value) } }))} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Incluir en el resumen</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { key: "created", label: "Creados" },
                      { key: "started", label: "Iniciados" },
                      { key: "paused", label: "Pausados" },
                      { key: "completed", label: "Completados" },
                      { key: "updated", label: "Actualizados" },
                      { key: "deleted", label: "Eliminados" },
                      { key: "expiring", label: "Por vencer" },
                      { key: "expired", label: "Vencidos" },
                      { key: "inactive", label: "Inactivos" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs">
                        <input type="checkbox" checked={!!draft.dailySummary?.include?.[item.key]} onChange={(e) => setInclude(item.key, e.target.checked)} />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 px-6 pb-4 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Server className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-foreground">Eventos de proyectos</h2>
                  <p className="text-xs text-muted-foreground">Notificaciones por cambio de estado</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <ToggleRow label="Proyectos iniciados" description="Notificar cuando un proyecto pasa de PENDING a IN_PROGRESS" checked={!!draft.notifyProjectStarted} onChange={(v) => setDraft((d: any) => ({ ...d, notifyProjectStarted: v }))} />
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={save} disabled={updateSettings.isPending} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar configuración del servidor
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
