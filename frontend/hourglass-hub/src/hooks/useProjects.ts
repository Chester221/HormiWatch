import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';
import { normalizeTask, taskHours } from '@/lib/dashboardUtils';

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
  project_leader_id?: string | null;
  technicians?: { id: string; name?: string; lastName?: string }[];
  tasks?: any[];
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      try {
        const responseProjects = await projectsApi.getAll();
        
        const projects = Array.isArray(responseProjects) 
          ? responseProjects 
          : responseProjects?.records || responseProjects?.data || [];
        
        if (!projects || projects.length === 0) {
          return [];
        }

        const responseTasks = await tasksApi.getAll();
        const rawTasks = Array.isArray(responseTasks) 
          ? responseTasks 
          : responseTasks?.records || responseTasks?.data || [];

        // ✅ NORMALIZAR al formato legacy (incluye project_id de la relación anidada)
        const tasks = rawTasks.map(normalizeTask);

        const tasksByProject: Record<string, any[]> = {};
        tasks.forEach((task: any) => {
          if (task.project_id) {
            if (!tasksByProject[task.project_id]) {
              tasksByProject[task.project_id] = [];
            }
            tasksByProject[task.project_id].push(task);
          }
        });

        return projects.map((project: any) => {
          // ✅ NORMALIZAR DATOS QUE SÍ EXISTEN
          const normalizedProject = {
            id: project.id,
            // ✅ title → name
            name: project.title || project.name || 'Proyecto sin nombre',
            description: project.description || null,
            // ✅ status del backend
            status: project.status || 'active',
            // ✅ poolHours → pool_hours
            pool_hours: project.poolHours || project.pool_hours || 0,
            // ✅ hourlyRate → hourly_rate
            hourly_rate: project.hourlyRate || project.hourly_rate || 0,
            // ✅ startDate → start_date
            start_date: project.startDate || project.start_date || null,
            // ✅ endDate → end_date
            end_date: project.endDate || project.end_date || null,
            created_at: project.createdAt || project.created_at,
            created_by: project.createdBy || project.created_by || null,
            // ✅ CLIENTE Y LÍDER - usar lo que haya, aunque sea null
            customer_id: project.customer_id || null,
            customer_name: project.customer_name || 'Sin cliente',
            client_id: project.client_id || project.customer_id || null,
            clients: project.clients ??
              (project.customer_id
                ? { name: project.customer_name || 'Sin cliente' }
                : null),
            lead_id: project.lead_id || project.project_leader_id || project.projectLeader?.id || null,
            project_leader_id: project.project_leader_id || project.projectLeader?.id || null,
            leader_email: project.leader_email || project.projectLeader?.email || 'Sin líder',
            // ✅ PROPAGAR LOS OBJETOS DEL BACKEND (líder y técnicos)
            projectLeader: project.projectLeader || null,
            technicians: project.technicians || [],
            tasks: [],
          };
        
          const projectTasks = tasksByProject[project.id] || [];
          
          const totalHours = projectTasks.reduce((total: number, task: any) =>
            total + taskHours(task), 0);
        
          return {
            ...normalizedProject,
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
      const project = await projectsApi.getById(projectId);
      
      if (!project) throw new Error('Proyecto no encontrado');

      if (project.created_by && project.created_by !== userId) {
        throw new Error('Solo el creador del proyecto puede eliminarlo');
      }

      const responseTasks = await tasksApi.getAll();
      const tasks = Array.isArray(responseTasks) 
        ? responseTasks 
        : responseTasks?.records || responseTasks?.data || [];
      const projectTasks = tasks.filter((t: any) => t.project_id === projectId);

      if (projectTasks.length > 0) {
        if (project.status !== 'Completed' && project.status !== 'Cancelled') {
          throw new Error(`No puedes eliminar "${project.name}" porque tiene ${projectTasks.length} tarea(s). Solo se pueden eliminar proyectos completados o cancelados.`);
        }
      }

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