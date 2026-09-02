import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi, usersApi } from '@/lib/api';
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
        // Obtener proyectos desde la API
        const projects = await projectsApi.getAll();
        
        if (!projects || projects.length === 0) {
          return [];
        }

        // Obtener tareas para todos los proyectos
        const tasks = await tasksApi.getAll();
        const tasksByProject: Record<string, any[]> = {};
        (tasks || []).forEach((task: any) => {
          if (task.project_id && !tasksByProject[task.project_id]) {
            tasksByProject[task.project_id] = [];
          }
          if (task.project_id) {
            tasksByProject[task.project_id].push(task);
          }
        });

        // Mapear proyectos con sus tareas
        return projects.map((project: any) => {
          const projectTasks = tasksByProject[project.id] || [];
          
          const totalHours = projectTasks.reduce((total: number, task: any) => {
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
            hours_consumed: totalHours,
            tasks: projectTasks,
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
      const project = await projectsApi.create({
        ...newProject,
        status: newProject.status || 'In Progress',
        pool_hours: newProject.pool_hours || 0,
        hourly_rate: newProject.hourly_rate || 0,
      });
      return project;
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
      const updated = await projectsApi.update(id, data);
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
      // Obtener el proyecto para verificar permisos
      const project = await projectsApi.getById(projectId);
      
      if (!project) throw new Error('Proyecto no encontrado');

      if (project.created_by && project.created_by !== userId) {
        throw new Error('Solo el creador del proyecto puede eliminarlo');
      }

      // Obtener tareas del proyecto
      const tasks = await tasksApi.getAll();
      const projectTasks = tasks.filter((t: any) => t.project_id === projectId);

      if (projectTasks.length > 0) {
        if (project.status !== 'Completed' && project.status !== 'Cancelled') {
          throw new Error(`No puedes eliminar "${project.name}" porque tiene ${projectTasks.length} tarea(s). Solo se pueden eliminar proyectos completados o cancelados.`);
        }
      }

      // Eliminar el proyecto (la API debería manejar las dependencias)
      await projectsApi.delete(projectId);

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Proyecto eliminado correctamente');
    },
    onError: (error: Error) => { toast.error(error.message); },
  });
};