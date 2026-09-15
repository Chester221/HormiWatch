import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { toast } from 'sonner';

export interface ServiceCategoryRef {
  id?: string;
  name: string;
  description?: string | null;
}

export interface ServicePlatformRef {
  id?: string;
  name: string;
  description?: string | null;
}

export interface ServiceTypeRef {
  id?: string;
  name: string;
  description?: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category_id?: string;
  platformId?: string;
  typeId?: string;
  default_hourly_rate?: number;
  hourlyRate?: number | null;
  is_active?: boolean;
  icon?: string | null;
  color?: string | null;
  createdBy?: {
    id?: string;
    email?: string;
    name?: string | null;
  } | null;
  categories?: ServiceCategoryRef;
  category?: ServiceCategoryRef | null;
  platform?: ServicePlatformRef | null;
  type?: ServiceTypeRef | null;
  created_at?: string;
  created_at_iso?: string;
  createdAt?: string;
}

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  description?: string | null;
}

export type ServiceInput = {
  name: string;
  description?: string | null;
  categoryId: string;
  hourlyRate?: number | null;
  icon?: string | null;
  color?: string | null;
};

interface ServicesResponse {
  data?: Service[] | ServiceCategoryRecord[];
}

export const useServices = (searchQuery?: string, includeInactive: boolean = false) => {
  // Clave única: todos los consumidores comparten la MISMA consulta (una sola petición HTTP)
  const query = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getAll();
        const services = (Array.isArray(response)
          ? (response as Service[])
          : (response as ServicesResponse)?.data || []) as Service[];
        return services.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Filtros client-side por invocación (buscar/activos) sin duplicar peticiones
  const data = useMemo(() => {
    const all = query.data ?? [];
    const active = includeInactive ? all : all.filter((s) => s.is_active !== false);
    if (!searchQuery) return active;
    const search = searchQuery.toLowerCase();
    return active.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search)),
    );
  }, [query.data, searchQuery, includeInactive]);

  return { ...query, data };
};

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getCategories();
        const categories = (Array.isArray(response)
          ? (response as ServiceCategoryRecord[])
          : (response as ServicesResponse)?.data || []) as ServiceCategoryRecord[];
        return categories.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });
};

export const useServicePlatforms = () => {
  return useQuery({
    queryKey: ['service_platforms'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getPlatforms();
        const platforms = (Array.isArray(response)
          ? (response as ServicePlatformRef[])
          : (response as ServicesResponse)?.data || []) as ServicePlatformRef[];
        return platforms.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },
  });
};

export const useServiceTypes = () => {
  return useQuery({
    queryKey: ['service_types'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getTypes();
        const types = (Array.isArray(response)
          ? (response as ServiceTypeRef[])
          : (response as ServicesResponse)?.data || []) as ServiceTypeRef[];
        return types.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newService: ServiceInput) => {
      const service = await servicesApi.create({ ...newService });
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

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceInput> }) => {
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

export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory: { name: string; description?: string | null }) => {
      return servicesApi.createCategory({
        name: newCategory.name,
        description: newCategory.description ?? null,
      });
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

export const useDeleteServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return servicesApi.deleteCategory(id);
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