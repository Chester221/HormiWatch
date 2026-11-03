import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Building2,
  Check,
  CheckCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  Inbox,
  Server,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useGlobalNotificationSettings,
  type AppNotification,
} from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type ReadFilter = 'all' | 'unread';
type DateFilter = 'all' | 'today' | '7d' | '30d';

const levelStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  info: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
};

const levelDotStyles: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

const categoryLabels: Record<string, string> = {
  contracts: 'Contratos',
  projects: 'Proyectos',
  tasks: 'Tareas',
  users: 'Usuarios',
  system: 'Sistema',
  customers: 'Clientes',
};

const categoryIcons: Record<string, LucideIcon> = {
  contracts: FileText,
  projects: FolderOpen,
  tasks: ClipboardList,
  users: Users,
  system: Server,
  customers: Building2,
};

interface EmptyCopyInput {
  readFilter: ReadFilter;
  categoryFilter: string;
  dateFilter: DateFilter;
}

function getEmptyCopy({
  readFilter,
  categoryFilter,
  dateFilter,
}: EmptyCopyInput): { title: string; description: string } {
  const category =
    categoryFilter !== 'all'
      ? categoryLabels[categoryFilter] || categoryFilter
      : null;
  const dateLabel =
    dateFilter === 'today'
      ? 'de hoy'
      : dateFilter === '7d'
        ? 'de los últimos 7 días'
        : dateFilter === '30d'
          ? 'de los últimos 30 días'
          : null;

  if (readFilter === 'all' && !category && !dateLabel) {
    return {
      title: 'Sin notificaciones',
      description: 'Te avisaremos cuando haya novedades.',
    };
  }

  let title = 'Sin notificaciones';
  if (readFilter === 'unread') title += ' sin leer';
  if (category) title += ` sobre ${category}`;
  if (dateLabel) title += ` ${dateLabel}`;

  return {
    title,
    description: 'Prueba a cambiar los filtros.',
  };
}

function normalizeLevel(level?: string | null): 'critical' | 'warning' | 'info' {
  const normalized = String(level || 'info').toLowerCase();
  if (normalized === 'critical' || normalized === 'warning') return normalized;
  return 'info';
}

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

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: globalSettings } = useGlobalNotificationSettings();
  const { data: notifications = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const personalInApp = profile?.preferences?.notifications?.inApp ?? true;
  const globalInApp = globalSettings?.channels?.inApp ?? true;

  const filtered = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return notifications.filter((n) => {
      if (readFilter === 'unread' && n.readAt) return false;
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;

      if (dateFilter !== 'all') {
        if (!n.createdAt) return false;
        const created = new Date(n.createdAt).getTime();
        if (Number.isNaN(created)) return false;
        if (dateFilter === 'today' && created < startOfToday.getTime()) return false;
        if (dateFilter === '7d' && now - created > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '30d' && now - created > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [notifications, readFilter, categoryFilter, dateFilter]);

  if (globalInApp === false || personalInApp === false) {
    return null;
  }

  const hasActiveFilters =
    readFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all';
  const emptyCopy = getEmptyCopy({ readFilter, categoryFilter, dateFilter });

  const clearFilters = () => {
    setReadFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.readAt) {
      markRead.mutate(n.id);
    }
    const route = getNotificationRoute(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
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

      <PopoverContent
        align="end"
        className="w-[min(92vw,26rem)] overflow-hidden p-0"
      >
        <div className="flex max-h-[min(78vh,34rem)] flex-col">
          {/* ═══════ HEADER ═══════ */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                <Bell className="h-4 w-4 text-[#0DA2E7]" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-foreground">
                  Notificaciones
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAll}
              disabled={unread === 0 || markAllRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Marcar todas</span>
            </Button>
          </div>

          {/* ═══════ FILTROS ═══════ */}
          <div className="shrink-0 space-y-2 border-b border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {([
                { value: 'all', label: 'Todas' },
                { value: 'unread', label: 'Sin leer' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReadFilter(option.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all',
                    readFilter === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                  {option.value === 'unread' && unread > 0 && (
                    <span className="rounded-full bg-[#0DA2E7] px-1.5 text-[10px] font-semibold leading-4 text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value as DateFilter)}
              >
                <SelectTrigger className="h-8 w-[7.5rem] shrink-0 text-xs">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ═══════ LISTA ═══════ */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              {hasActiveFilters ? (
                <Inbox className="h-8 w-8 text-muted-foreground opacity-40" />
              ) : (
                <BellOff className="h-8 w-8 text-muted-foreground opacity-40" />
              )}
              <p className="text-sm font-medium text-foreground">
                {emptyCopy.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {emptyCopy.description}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea
              type="auto"
              className="min-h-0 max-h-[min(55dvh,22rem)] flex-1 [&_[data-orientation=vertical]>div]:bg-muted-foreground/40 [&_[data-orientation=vertical]>div:hover]:bg-muted-foreground/60 [&_[data-radix-scroll-area-viewport]]:max-h-[min(55dvh,22rem)] [&_[data-radix-scroll-area-viewport]]:overscroll-contain"
            >
              <div className="divide-y divide-border">
                {filtered.map((n: AppNotification) => {
                  const level = normalizeLevel(n.level);
                  const CategoryIcon = categoryIcons[n.category] || Inbox;
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
                        !n.readAt && 'bg-[#0DA2E7]/[0.04]',
                      )}
                      onClick={() => handleNotificationClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(n);
                        }
                      }}
                    >
                      {!n.readAt && (
                        <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-[#0DA2E7]" />
                      )}

                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                          levelStyles[level],
                        )}
                      >
                        <CategoryIcon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'truncate text-sm text-foreground',
                              !n.readAt ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.readAt && (
                            <span
                              className={cn(
                                'h-1.5 w-1.5 shrink-0 rounded-full',
                                levelDotStyles[level],
                              )}
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px] font-medium',
                              levelStyles[level],
                            )}
                          >
                            {categoryLabels[n.category] || n.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/70">
                            {formatRelative(n.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        {!n.readAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-[#0DA2E7]"
                            aria-label="Marcar como leída"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead.mutate(n.id);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar notificación"
                          disabled={deleteNotification.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate(n.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* ═══════ FOOTER ═══════ */}
          {filtered.length > 0 && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-2 text-[11px] text-muted-foreground">
              Mostrando {filtered.length} de {notifications.length}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const normalized = normalizeLevel(level);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        levelStyles[normalized],
      )}
    >
      {level}
    </span>
  );
}

export { categoryLabels, formatRelative, Inbox };
