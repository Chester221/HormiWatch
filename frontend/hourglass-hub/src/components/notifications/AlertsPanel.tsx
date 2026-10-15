import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotifications,
  useMarkNotificationRead,
  type AppNotification,
} from '@/hooks/useNotifications';
import { categoryLabels, formatRelative } from './NotificationsBell';

const levelConfig: Record<string, { icon: any; className: string; badge: string }> = {
  CRITICAL: {
    icon: AlertTriangle,
    className: 'text-red-600 bg-red-500/10',
    badge: 'bg-red-500/10 text-red-600 border-red-500/30',
  },
  WARNING: {
    icon: AlertTriangle,
    className: 'text-amber-600 bg-amber-500/10',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  INFO: {
    icon: Info,
    className: 'text-sky-600 bg-sky-500/10',
    badge: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  },
};

/**
 * Panel de alertas recientes para los dashboards (Admin, Manager, Technician).
 * Muestra las últimas notificaciones con color por nivel y permite marcar
 * como leídas. Se actualiza con el polling del hook useNotifications.
 */
export function AlertsPanel({ limit = 5 }: { limit?: number }) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const items: AppNotification[] = notifications
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bell className="h-4 w-4 text-primary" />
          Alertas recientes
        </CardTitle>
        <Badge variant="secondary" className="text-[10px]">
          {notifications.filter((n) => !n.readAt).length} sin leer
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        {isLoading && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Cargando alertas...
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-500 opacity-70" />
            <p className="text-xs font-medium text-foreground">Sin alertas</p>
            <p className="text-[11px] text-muted-foreground">
              Todo en orden por ahora.
            </p>
          </div>
        )}

        {items.map((n) => {
          const cfg = levelConfig[n.level] || levelConfig.INFO;
          const Icon = cfg.icon;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.readAt && markRead.mutate(n.id)}
              className={`flex w-full items-start gap-3 rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:bg-muted/40 ${
                !n.readAt ? 'bg-muted/20' : ''
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.className}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {n.title}
                  </p>
                  <Badge variant="outline" className="shrink-0 text-[9px]">
                    {categoryLabels[n.category] || n.category}
                  </Badge>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                  {n.message}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                  {formatRelative(n.createdAt)}
                </p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
