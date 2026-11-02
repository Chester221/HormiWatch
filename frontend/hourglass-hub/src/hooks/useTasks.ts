import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api';
import { toast } from 'sonner';
import { normalizeTask, humanStatus } from '@/lib/dashboardUtils';
import { fetchAllPages } from '@/lib/pagination';
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
  const fetchTasks = async (signal?: AbortSignal): Promise<Task[]> => {
    const params: Record<string, string | number> = {
      order: 'DESC',
      take: 100,
    };

    if (projectId && projectId !== 'all') {
      params.projectId = projectId;
    }

    if (technicianId) {
      params.technicianId = technicianId;
    }

    const response = await fetchAllPages<Record<string, unknown>>(
      (page, pageSignal) => tasksApi.getAll({ ...params, page }, pageSignal),
      { take: 100, signal },
    );
    let tasks = response.map(normalizeTask);

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
    queryFn: ({ signal }) => fetchTasks(signal),
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
      // El backend devuelve TaskResponseDto[] por cada creación, así que
      // Promise.all produce arrays anidados. Aplanamos SIEMPRE para que
      // onSuccess reciba una lista plana de DTOs.
      return (results as unknown[]).flat(Infinity);
    },
    onMutate: async (newTasks) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: TASKS_KEY });

      // ✅ UPDATE OPTIMISTA: la tarea aparece AL INSTANTE con EXACTAMENTE los
      // datos del formulario (título, descripción, proyecto, técnico, horas...).
      // No dependemos de la respuesta del backend para pintar la tarjeta.
      const nowIso = new Date().toISOString();
      const optimistic = newTasks.map((t, i) => {
        const tempId = `temp-task-${Date.now()}-${i}`;
        const task = normalizeTask({
          id: tempId,
          _tempId: tempId,
          status: t.status || 'PENDING',
          priority: t.priority || 'MEDIUM',
          title: t.title,
          description: t.description,
          startDateTime: t.startDateTime,
          endDateTime: t.endDateTime,
          createdAt: nowIso,
          created_at: nowIso,
          project: t.projectId ? { id: t.projectId } : undefined,
          project_id: t.projectId,
          projectName: t.projectName,
          service: t.serviceId ? { id: t.serviceId } : undefined,
          service_id: t.serviceId,
          technician: t.technicianId ? { id: t.technicianId } : undefined,
          technician_id: t.technicianId,
          technicianName: t.technicianName,
          appliedHourlyRate: t.appliedHourlyRate,
          hours: t.hours,
        });
        return { ...task, _tempId: tempId };
      });

      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return sortTasksDesc([...optimistic, ...old]);
      });

      return {
        previous,
        tempIds: optimistic.map((o) => o.id),
        temps: optimistic,
      };
    },
    onSuccess: (results, _vars, context) => {
      const tempIds = context?.tempIds ?? [];
      const temps = context?.temps ?? [];

      // El backend puede devolver array de DTOs, array de arrays o un objeto.
      // Aplanamos SIEMPRE para que normalizeTask reciba UNA tarea, no un array.
      const flattened = (
        Array.isArray(results) ? results.flat(Infinity) : [results]
      ).filter(Boolean) as Record<string, unknown>[];
      const normalized = flattened.map((r) => normalizeTask(r));

      // ✅ Reemplazar temporales por reales. NADA de invalidate/refetch:
      // la tarea real ya quedó en caché y NO debe "recargarse" la lista.
      queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        let list = old.slice();

        normalized.forEach((item, i) => {
          // Solo reemplazamos si el backend devolvió una tarea real con id.
          if (!item || item.id === undefined || item.id === null || item.id === '') return;

          const tempId = tempIds[i];

          if (!tempId) {
            list = [item, ...list];
            return;
          }

          let replaced = false;
          list = list.map((t) => {
            if (String(t.id) !== String(tempId)) return t;
            replaced = true;

            // La respuesta real solo pisa los campos que trae con valor.
            // Nunca borramos título/proyecto/técnico con null o undefined.
            const merged: Record<string, unknown> = { ...t };
            Object.entries(item).forEach(([key, value]) => {
              if (value !== undefined && value !== null) merged[key] = value;
            });
            merged.id = item.id;
            return merged;
          });

          if (!replaced) {
            // El temporal ya no está (p.ej. un refetch lo quitó). Insertamos
            // la tarea real solo si tiene datos válidos, nunca un objeto vacío.
            list = [{ ...(temps[i] || {}), ...item, id: item.id }, ...list];
          }
        });

        return sortTasksDesc(list);
      });
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
      // ✅ Reemplazar con la respuesta real (normalizada). Sin invalidate:
      // el cambio (p.ej. a Cancelada) debe verse al instante, sin "recargar".
      if (updated) {
        const real = normalizeTask(updated);
        queryClient.setQueriesData({ queryKey: TASKS_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t) => (String(t.id) === String(real.id) ? real : t));
        });
      }
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
      // ✅ Sin refetch global: la tarea ya se quitó del caché en onMutate.
      // Un invalidate aquí provocaría parpadeos y volvería a pedir la lista.
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