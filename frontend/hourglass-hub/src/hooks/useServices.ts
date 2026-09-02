import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { toast } from 'sonner';

export interface Service {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  default_hourly_rate: number;
  is_active: boolean;
  categories?: { name: string };
}

// Obtener servicios
export const useServices = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['services', searchQuery],
    queryFn: async () => {
      try {
        let services = await servicesApi.getAll();
        
        // Filtrar solo activos
        services = services.filter((s: any) => s.is_active !== false);
        
        // Ordenar por nombre
        services.sort((a: any, b: any) => a.name.localeCompare(b.name));

        if (searchQuery) {
          const search = searchQuery.toLowerCase();
          services = services.filter((s: any) =>
            s.name.toLowerCase().includes(search) ||
            (s.description && s.description.toLowerCase().includes(search))
          );
        }
        return services;
      } catch {
        return [];
      }
    },
  });
};

// Obtener categorías
export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      try {
        // Si la API tiene endpoint para categorías, usarlo
        // Si no, obtener servicios y extraer categorías únicas
        const services = await servicesApi.getAll();
        const categories = services
          .map((s: any) => s.category)
          .filter((c: any) => c)
          .reduce((acc: any[], cat: any) => {
            if (!acc.find(c => c.id === cat.id)) {
              acc.push(cat);
            }
            return acc;
          }, []);
        return categories.sort((a: any, b: any) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },
  });
};

// Crear servicio
export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newService: any) => {
      const service = await servicesApi.create({
        ...newService,
        is_active: true
      });
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

// Actualizar servicio
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updated = await servicesApi.update(id, data);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
};

// Eliminar servicio
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await servicesApi.delete(id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el servicio');
    },
  });
};

// Crear categoría de servicio
export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory: { name: string; description?: string | null }) => {
      // Si la API tiene endpoint para categorías, usarlo
      // Si no, crear el servicio con la categoría y extraerla
      throw new Error('Crear categorías no está implementado en la API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
      toast.success('Categoría creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear la categoría: ' + error.message);
    },
  });
};

// Eliminar categoría de servicio
export const useDeleteServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Si la API tiene endpoint para eliminar categorías
      throw new Error('Eliminar categorías no está implementado en la API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar la categoría: ' + error.message);
    },
  });
};