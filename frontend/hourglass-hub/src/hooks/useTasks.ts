import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api';
import { toast } from 'sonner';
import { normalizeTask } from '@/lib/dashboardUtils';
import type { Tables, InsertTables } from '@/types/supabase'

export type Task = Tables<'tasks'> & {
  projects?: { name: string } | null
  services?: { name: string } | null
  technician?: { full_name: string; avatar_url: string | null } | null
}

export type CreateTaskData = InsertTables<'tasks'>

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
    // 🛡️ ANTICACHÉ: staleTime 0 → refetch SIEMPRE al montar la página,
    // aunque TopBar/Dashboard ya hayan cargado la key hace <30s.
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: any) => {
      const task = await tasksApi.create(newTask);
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tareas creadas correctamente');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea actualizada');
    },
    onError: (error: Error) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  })
}