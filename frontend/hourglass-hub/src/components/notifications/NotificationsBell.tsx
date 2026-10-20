import { useState } from 'react';
import { Bell, BellOff, Check, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from '@/hooks/useNotifications';

const levelStyles: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
  WARNING: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  INFO: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
};

const categoryLabels: Record<string, string> = {
  contracts: 'Contratos',
  projects: 'Proyectos',
  tasks: 'Tareas',
  users: 'Usuarios',
  system: 'Sistema',
  customers: 'Clientes',
};

function formatRelative(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadList = notifications.filter((n) => !n.readAt);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground"
          aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notificaciones</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={handleMarkAll}
            disabled={unread === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Sin notificaciones</p>
            <p className="text-xs text-muted-foreground">
              Te avisaremos cuando haya novedades.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {notifications.slice(0, 30).map((n: AppNotification) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !n.readAt ? 'bg-muted/30' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.level === 'CRITICAL'
                        ? 'bg-red-500'
                        : n.level === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px] font-medium"
                      >
                        {categoryLabels[n.category] || n.category}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground"
                      aria-label="Marcar como leída"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
        levelStyles[level] || levelStyles.INFO
      }`}
    >
      {level}
    </span>
  );
}

export { categoryLabels, formatRelative, Inbox };
