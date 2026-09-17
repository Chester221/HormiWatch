import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api';
import { toast } from 'sonner';
import { normalizeTask, humanStatus } from '@/lib/dashboardUtils';
import type { Tables, InsertTables } from '@/types/supabase'

export type Task = Tables<'tasks'> & {
  projects?: { name: string } | null
  services?: { name: string } | null
  technician?: { full_name: string; avatar_url: string | null } | null
}

export type CreateTaskData = InsertTables<'tasks'>

const TASKS_KEY = ['tasks'] as const;

const sortTasksDesc = (list: any[]): any[] =>
  list.slice().sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const useTasks = (projectId?: string | 'all', technicianId?: string) => {
  const fetchTasks = async (): Promise<Task[]> => {
    const response = await tasksApi.getAll();
    // ✅ CORREGIDO: Verificar si response es array u objeto { records | data }
    let tasks = Array.isArray(response) ? response : response?.records || response?.data || [];

    // ✅ NORMALIZAR al formato legacy que consume todo el frontend
    // (project_id/technician_id/service_id, created_at, horas, estados)
    tasks = tasks.map(normalizeTask);

    if (projectId && projectId !== 'all') {
      tasks = tasks.filter((t: any) => t.project_id === projectId);
    }

    if (technicianId) {
      tasks = tasks.filter((t: any) => t.technician_id === technicianId);
    }

    // Ordenar por created_at descendente
    tasks.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return tasks as Task[];
  }

  return useQuery({
    queryKey: ['tasks', projectId, technicianId],
    queryFn: fetchTasks,
    // ✅ CACHÉ: 30s de staleTime → navegar entre páginas es instantáneo (muestra
    // la caché al instante y refresca en segundo plano solo si está vieja).
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export const useCreateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTasks: any[]) => {
      if (newTasks.length === 0) throw new Error('No hay tareas para crear');
      const results = await Promise.all(
        newTasks.map(task => tasksApi.create(task))
      );
      return results;
    },
    onMutate: async (newTasks) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: TASKS_KEY });

      // ✅ UPDATE OPTIMISTA: la tarea aparece AL INSTANTE en todas las listas
      const nowIso = new Date().toISOString();
      const optimistic = newTasks.map((t, i) => {
        const tempId = `temp-task-${Date.now()}-${i}`;
        return {
          ...normalizeTask({
            id: tempId,
            _tempId: tempId,
            status: t.status || 'PENDING',
            priority: t.priority || 'MEDIUM',
            title: t.title,
            description: t.description,
            startDateTime: t.startDateTime,
            endDateTime: t.endDateTime,
            created_at: nowIso,
            project: t.projectId ? { id: t.projectId } : undefined,
            project_id: t.projectId,
            service: t.serviceId ? { id: t.serviceId } : undefined,
            service_id: t.serviceId,
            technician_id: t.technicianId,
            appliedHourlyRate: t.appliedHourlyRate,
          }),
          _tempId: tempId,
        };
      });

      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return sortTasksDesc([...optimistic, ...old]);
      });

      return { previous, tempIds: optimistic.map((o) => o.id) };
    },
    onSuccess: (results, _vars, context) => {
      const tempIds = context?.tempIds ?? [];
      const realList = (Array.isArray(results) ? results : [results])
        .map((r) => normalizeTask(r));

      // ✅ Reemplazar temporales por reales + refresco en segundo plano
      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        let list = old.slice();
        realList.forEach((item, i) => {
          const tempId = tempIds[i];
          if (tempId) {
            list = list.map((t) => (t.id === tempId ? item : t));
          } else {
            list = [item, ...list];
          }
        });
        return sortTasksDesc(list);
      });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success('Tareas creadas correctamente');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(`Error: ${error.message}`);
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: any) => {
      const task = await tasksApi.create(newTask);
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success('Tarea creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<CreateTaskData> }) => {
      const updated = await tasksApi.update(id.toString(), data);
      return updated;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: TASKS_KEY });

      // ✅ UPDATE OPTIMISTA: cambiar título/descripción/estado al instante
      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => {
          if (String(t.id) !== String(id)) return t;
          const patch: any = {};
          if (data.title !== undefined) patch.title = data.title;
          if (data.description !== undefined) patch.description = data.description;
          if (data.status !== undefined) patch.status = humanStatus(data.status);
          return { ...t, ...patch };
        });
      });

      return { previous };
    },
    onSuccess: (updated) => {
      // ✅ Reemplazar con la respuesta real (normalizada) + refresco en segundo plano
      if (updated) {
        const real = normalizeTask(updated);
        queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t) => (String(t.id) === String(real.id) ? real : t));
        });
      }
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success('Tarea actualizada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(`Error: ${error.message}`);
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      await tasksApi.delete(taskId);
      return true;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: TASKS_KEY });

      // ✅ DELETE OPTIMISTA: desaparece al instante de todas las listas
      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((t: any) => String(t.id) !== String(taskId));
      });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success('Tarea eliminada');
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(`Error: ${error.message}`);
    },
  })
}