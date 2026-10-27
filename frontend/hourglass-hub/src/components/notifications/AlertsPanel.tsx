import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useNotifications,
  useMarkNotificationRead,
  useGlobalNotificationSettings,
  type AppNotification,
} from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { categoryLabels, formatRelative } from './NotificationsBell';

const levelConfig: Record<string, { icon: any; className: string }> = {
  CRITICAL: {
    icon: AlertTriangle,
    className: 'text-red-600 bg-red-500/10',
  },
  WARNING: {
    icon: AlertTriangle,
    className: 'text-amber-600 bg-amber-500/10',
  },
  INFO: {
    icon: Info,
    className: 'text-sky-600 bg-sky-500/10',
  },
};

function getNotificationRoute(n: AppNotification): string | null {
  const data = (n.data || {}) as Record<string, any>;
  const taskId = data.taskId || data.task_id;
  const projectId = data.projectId || data.project_id;
  const clientId = data.clientId || data.client_id || data.customerId || data.customer_id;
  const userId = data.userId || data.user_id || data.memberId || data.member_id || data.technicianId || data.technician_id;
  const serviceId = data.serviceId || data.service_id;
  const contractId = data.contractId || data.contract_id;

  if (n.category === 'tasks' && taskId) return `/tasks?task=${taskId}`;
  if (n.category === 'projects' && projectId) return `/projects?project=${projectId}`;
  if (n.category === 'contracts') {
    if (contractId && clientId) return `/clients?client=${clientId}&contract=${contractId}`;
    if (clientId) return `/clients?client=${clientId}`;
    if (contractId) return `/clients?contract=${contractId}`;
  }
  if ((n.category === 'customers' || n.category === 'clients') && clientId) {
    return `/clients?client=${clientId}`;
  }
  if (n.category === 'users' && userId) return `/team?member=${userId}`;
  if (n.category === 'system' && serviceId) return `/services?service=${serviceId}`;
  if (taskId && !String(n.category || '').includes('project')) return `/tasks?task=${taskId}`;
  if (projectId) return `/projects?project=${projectId}`;
  if (userId) return `/team?member=${userId}`;
  if (clientId) return `/clients?client=${clientId}`;
  if (serviceId) return `/services?service=${serviceId}`;
  return null;
}

/**
 * Panel de alertas recientes para los dashboards (Admin, Manager, Technician).
 * Muestra las últimas notificaciones con color por nivel y permite marcar
 * como leídas. Se actualiza con el polling del hook useNotifications.
 */
export function AlertsPanel({ limit = 5 }: { limit?: number }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: globalSettings } = useGlobalNotificationSettings();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const personalInApp = profile?.preferences?.notifications?.inApp ?? true;
  const globalInApp = globalSettings?.channels?.inApp ?? true;
  if (globalInApp === false || personalInApp === false) {
    return null;
  }

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.readAt) {
      markRead.mutate(n.id);
    }
    const route = getNotificationRoute(n);
    if (route) {
      navigate(route);
    }
  };

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
              onClick={() => handleNotificationClick(n)}
              className={`flex w-full items-start gap-3 rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:bg-muted/40 cursor-pointer ${
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
