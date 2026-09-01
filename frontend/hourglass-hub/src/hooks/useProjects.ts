import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client_id?: string;
  clients?: { name: string; logo_url?: string } | null;
  pool_hours?: number;
  hours_consumed?: number;
  end_date?: string;
  start_date?: string;
  hourly_rate?: number;
  created_at: string;
  created_by?: string;
  tasks?: any[];
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      try {
        // 🔥 OBTENER PROYECTOS CON CLIENTES
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            clients:client_id (
              id,
              name,
              logo_url
            )
          `)
          .order('created_at', { ascending: false });
        
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          return [];
        }
        
        if (!projects || projects.length === 0) {
          return [];
        }

        // 🔥 OBTENER TAREAS POR SEPARADO
        const projectIds = projects.map(p => p.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('project_id', projectIds);

        // 🔥 AGRUPAR TAREAS POR PROYECTO
        const tasksByProject: Record<string, any[]> = {};
        (tasksData || []).forEach((task: any) => {
          if (!tasksByProject[task.project_id]) {
            tasksByProject[task.project_id] = [];
          }
          tasksByProject[task.project_id].push(task);
        });

        // 🔥 MAPEAR PROYECTOS CON SUS TAREAS
        return projects.map((project: any) => {
          const tasks = tasksByProject[project.id] || [];
          
          // Calcular horas consumidas
          const totalHours = tasks.reduce((total: number, task: any) => {
            if (task.duration_in_minutes) {
              return total + (task.duration_in_minutes / 60);
            }
            if (task.start_time && task.end_time) {
              const hours = Math.abs(
                new Date(task.end_time).getTime() - new Date(task.start_time).getTime()
              ) / 3600000;
              return total + hours;
            }
            if (task.hours) {
              return total + task.hours;
            }
            return total;
          }, 0);

          return {
            ...project,
            clients: project.clients || null,
            hours_consumed: totalHours,
            tasks: tasks,
          };
        });
      } catch (err) {
        console.error('Error in useProjects:', err);
        return [];
      }
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProject: { 
      name: string; 
      description?: string; 
      status?: string; 
      client_id?: string;
      pool_hours?: number;
      hourly_rate?: number;
      start_date?: string;
      end_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
          ...newProject, 
          status: newProject.status || 'In Progress',
          pool_hours: newProject.pool_hours || 0,
          hourly_rate: newProject.hourly_rate || 0,
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['projects'] }); 
      toast.success('Proyecto creado correctamente'); 
    },
    onError: (error: any) => { toast.error(`Error al crear proyecto: ${error.message}`); },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const { data: updated, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto actualizado correctamente');
    },
    onError: (error: any) => { toast.error(`Error al actualizar proyecto: ${error.message}`); },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('status, created_by, name')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw new Error('Proyecto no encontrado');

      if (project.created_by && project.created_by !== userId) {
        throw new Error('Solo el creador del proyecto puede eliminarlo');
      }

      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (totalTasks && totalTasks > 0) {
        if (project.status !== 'Completed' && project.status !== 'Cancelled') {
          throw new Error(`No puedes eliminar "${project.name}" porque tiene ${totalTasks} tarea(s). Solo se pueden eliminar proyectos completados o cancelados.`);
        }
      }

      await supabase.from('project_members').delete().eq('project_id', projectId);
      await supabase.from('tasks').delete().eq('project_id', projectId);
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw new Error('Error al eliminar el proyecto');

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Proyecto eliminado correctamente');
    },
    onError: (error: Error) => { toast.error(error.message); },
  });
};