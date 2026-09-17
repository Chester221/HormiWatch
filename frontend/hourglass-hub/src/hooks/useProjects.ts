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

const PROJECTS_KEY = ['projects'] as const;

// ✅ NORMALIZACIÓN ÚNICA: usada por el fetch y por los updates optimistas.
const normalizeProject = (project: any, tasksByProject: Record<string, any[]> = {}): Project => {
  const normalizedProject: any = {
    id: project.id,
    name: project.title || project.name || 'Proyecto sin nombre',
    description: project.description || null,
    status: project.status || 'active',
    pool_hours: project.poolHours || project.pool_hours || 0,
    hourly_rate: project.hourlyRate || project.hourly_rate || 0,
    start_date: project.startDate || project.start_date || null,
    end_date: project.endDate || project.end_date || null,
    created_at: project.createdAt || project.created_at,
    created_by: project.createdBy || project.created_by || null,
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
    projectLeader: project.projectLeader || null,
    technicians: project.technicians || [],
    tasks: [],
  };

  const projectTasks = tasksByProject[project.id] || [];
  const totalHours = projectTasks.reduce((total: number, task: any) => total + taskHours(task), 0);

  return {
    ...normalizedProject,
    hours_consumed: totalHours,
    tasks: projectTasks,
  };
};

const restorePrevious = (queryClient: ReturnType<typeof useQueryClient>, previous: [unknown, unknown][]) => {
  if (!previous) return;
  for (const [key, data] of previous) {
    queryClient.setQueryData(key as any, data);
  }
};

export const useProjects = () => {
  return useQuery({
    queryKey: PROJECTS_KEY,
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

        return projects.map((project: any) => normalizeProject(project, tasksByProject));
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
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: PROJECTS_KEY });
      const tempId = `temp-project-${Date.now()}`;

      // ✅ UPDATE OPTIMISTA: el proyecto aparece al instante
      const optimistic = normalizeProject({
        id: tempId,
        title: newProject.name,
        description: newProject.description,
        status: newProject.status || 'IN_PROGRESS',
        poolHours: newProject.pool_hours || 0,
        hourlyRate: newProject.hourly_rate || 0,
        start_date: newProject.start_date,
        end_date: newProject.end_date,
        created_at: new Date().toISOString(),
        created_by: (newProject as any).created_by,
        project_leader_id: (newProject as any).project_leader_id,
        customer_id: newProject.client_id,
        customer_name: (newProject as any).customer_name,
        clients: newProject.client_id
          ? { name: (newProject as any).customer_name || 'Sin cliente' }
          : null,
      });

      queryClient.setQueriesData({ queryKey: PROJECTS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return [optimistic, ...old];
      });

      return { previous, tempId };
    },
    onSuccess: (created: any, _vars, context) => {
      if (context?.tempId) {
        const real = normalizeProject({ ...(created || {}), title: created?.title || created?.name });
        queryClient.setQueriesData({ queryKey: PROJECTS_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: any) =>
            p.id === context.tempId ? { ...real, id: created?.id } : p,
          );
        });
      }
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Proyecto creado correctamente'); 
    },
    onError: (error: any, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
      toast.error(`Error al crear proyecto: ${error.message}`);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const updated = await projectsApi.update(id, data);
      return updated;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: PROJECTS_KEY });

      // ✅ UPDATE OPTIMISTA: los campos editados cambian al instante
      queryClient.setQueriesData({ queryKey: PROJECTS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: any) => {
          if (String(p.id) !== String(id)) return p;
          const patch: any = {};
          if (data.title !== undefined) patch.name = data.title;
          if (data.name !== undefined) patch.name = data.name;
          if (data.status !== undefined) patch.status = data.status;
          if (data.pool_hours !== undefined || (data as any).poolHours !== undefined) {
            patch.pool_hours = (data as any).poolHours ?? data.pool_hours;
          }
          if (data.hourly_rate !== undefined || (data as any).hourlyRate !== undefined) {
            patch.hourly_rate = (data as any).hourlyRate ?? data.hourly_rate;
          }
          if (data.start_date !== undefined || (data as any).startDate !== undefined) {
            patch.start_date = (data as any).startDate ?? data.start_date;
          }
          if (data.end_date !== undefined || (data as any).endDate !== undefined) {
            patch.end_date = (data as any).endDate ?? data.end_date;
          }
          if (data.description !== undefined) patch.description = data.description;
          return { ...p, ...patch };
        });
      });

      return { previous };
    },
    onSuccess: (updated) => {
      if (updated) {
        const real = normalizeProject(updated);
        queryClient.setQueriesData({ queryKey: PROJECTS_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: any) => (String(p.id) === String(real.id) ? { ...p, ...real } : p));
        });
      }
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      toast.success('Proyecto actualizado correctamente');
    },
    onError: (error: any, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
      toast.error(`Error al actualizar proyecto: ${error.message}`);
    },
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
    onMutate: async ({ projectId }) => {
      await queryClient.cancelQueries({ queryKey: PROJECTS_KEY });
      const previous = queryClient.getQueriesData({ queryKey: PROJECTS_KEY });

      // ✅ DELETE OPTIMISTA: desaparece al instante
      queryClient.setQueriesData({ queryKey: PROJECTS_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((p: any) => String(p.id) !== String(projectId));
      });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Proyecto eliminado correctamente');
    },
    onError: (error: Error, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
      toast.error(error.message);
    },
  });
};