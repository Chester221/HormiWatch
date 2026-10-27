import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '@/lib/api';

export interface AppNotification {
  id: string;
  userId: string;
  category: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  eventKey?: string | null;
  readAt?: string | null;
  digestSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  channels?: { inApp?: boolean; email?: boolean; discord?: boolean; whatsapp?: boolean };
  thresholds?: {
    yellow?: number;
    orange?: number;
    red?: number;
    expiringDays?: number;
    inactivityDays?: number;
    taskStaleDays?: number;
  };
  eventToggles?: Record<string, boolean>;
  discord?: Record<string, string>;
  digestHour?: number;
  digestEnabled?: boolean;
}

const NOTIFICATIONS_KEY = ['notifications'] as const;
const COUNT_KEY = ['notifications', 'unread-count'] as const;
const SETTINGS_KEY = ['notifications', 'settings'] as const;
const POLL_MS = 20_000;

const toArray = (res: any): AppNotification[] => {
  if (Array.isArray(res)) return res;
  if (res?.records && Array.isArray(res.records)) return res.records;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
};

/** Listado de notificaciones propias con polling (20 s). */
export const useNotifications = () => {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => toArray(await notificationsApi.getMine()),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
};

/** Contador de no leídas para el badge de la campana. */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: COUNT_KEY,
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return typeof res?.count === 'number' ? res.count : 0;
    },
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => notificationsApi.markRead(id),
    onSuccess: (_d, id) => {
      qc.setQueryData(NOTIFICATIONS_KEY, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: AppNotification) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        );
      });
      qc.invalidateQueries({ queryKey: COUNT_KEY });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => notificationsApi.markAllRead(),
    onSuccess: () => {
      const now = new Date().toISOString();
      qc.setQueryData(NOTIFICATIONS_KEY, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: AppNotification) =>
          n.readAt ? n : { ...n, readAt: now },
        );
      });
      qc.setQueryData(COUNT_KEY, 0);
    },
  });
};

/** Configuración global de notificaciones (lectura para cualquier usuario autenticado). */
export const useGlobalNotificationSettings = (enabled = true) => {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => (await notificationsApi.getSettings()) as NotificationSettings,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
};

/** @deprecated Usar useGlobalNotificationSettings */
export const useNotificationSettings = (enabled = true) => {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => (await notificationsApi.getSettings()) as NotificationSettings,
    enabled,
    staleTime: 60_000,
  });
};

export const useUpdateNotificationSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) =>
      (await notificationsApi.updateSettings(data)) as NotificationSettings,
    onSuccess: (updated) => {
      qc.setQueryData(SETTINGS_KEY, updated);
      toast.success('Configuración de notificaciones guardada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

// IDs ya toasteados a nivel de sesión (evita duplicados entre re-mounts).
const toastedIds = new Set<string>();

/**
 * Muestra un toast (persistente) por cada notificación CRÍTICA nueva.
 * Se usa en los dashboards (especialmente el del técnico) para alertas
 * de tareas/contratos que requieren atención inmediata.
 */
export const useCriticalNotificationToasts = (items?: AppNotification[]) => {
  const lastIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!items || items.length === 0) return;
    const current = new Set(items.map((n) => n.id));
    for (const n of items) {
      if (n.level !== 'CRITICAL') continue;
      if (toastedIds.has(n.id)) continue;
      // Solo toastear los que llegaron nuevos respecto a la carga anterior
      if (lastIds.current.size > 0 && !lastIds.current.has(n.id)) {
        toastedIds.add(n.id);
        toast.error(n.title, {
          description: n.message,
          duration: Infinity,
        });
      } else if (lastIds.current.size === 0) {
        // Primera carga: registrar como vistas sin toastear el histórico
        toastedIds.add(n.id);
      }
    }
    lastIds.current = current;
  }, [items]);
};
