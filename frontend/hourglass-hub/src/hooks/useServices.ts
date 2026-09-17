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

const SERVICES_KEY = ['services'];

// ✅ Normalización única usada por fetch y updates optimistas
const normalizeService = (svc: any): Service => ({
  id: svc.id,
  name: svc.name,
  description: svc.description ?? null,
  category_id: svc.category_id ?? svc.categoryId,
  categories: svc.categories ?? (svc.category ? { id: svc.category.id, name: svc.category.name } : undefined),
  category: svc.categories ?? (svc.category ? { id: svc.category.id, name: svc.category.name } : null),
  platformId: svc.platformId ?? svc.platform_id,
  typeId: svc.typeId ?? svc.type_id,
  hourlyRate: svc.hourlyRate ?? svc.hourly_rate ?? svc.default_hourly_rate ?? null,
  default_hourly_rate: svc.default_hourly_rate ?? svc.hourly_rate ?? svc.hourlyRate ?? null,
  is_active: svc.is_active !== false,
  icon: svc.icon ?? null,
  color: svc.color ?? null,
  createdAt: svc.createdAt ?? svc.created_at,
  created_at: svc.created_at ?? svc.createdAt,
});

const restorePrevious = (queryClient: ReturnType<typeof useQueryClient>, previous: [unknown, unknown][]) => {
  if (!previous) return;
  for (const [key, data] of previous) {
    queryClient.setQueryData(key as any, data);
  }
};

export const useServices = (searchQuery?: string, includeInactive: boolean = false) => {
  // Clave única: todos los consumidores comparten la MISMA consulta (una sola petición HTTP)
  const query = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getAll();
        const services = (Array.isArray(response)
          ? (response as Service[])
          : (response as any)?.records || (response as ServicesResponse)?.data || []) as Service[];
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
    onMutate: async (newService) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_KEY });
      const previous = queryClient.getQueriesData({ queryKey: SERVICES_KEY });

      // ✅ UPDATE OPTIMISTA: el servicio aparece al instante
      const categories: any[] = (queryClient.getQueryData(['service_categories']) as any[]) || [];
      const categoryName = categories.find((c) => c.id === newService.categoryId)?.name || 'Sin categoría';
      const optimistic = normalizeService({
        id: `temp-service-${Date.now()}`,
        name: newService.name,
        description: newService.description,
        categoryId: newService.categoryId,
        categories: { id: newService.categoryId, name: categoryName },
        hourlyRate: newService.hourlyRate,
        icon: newService.icon,
        color: newService.color,
        is_active: true,
        createdAt: new Date().toISOString(),
      });

      queryClient.setQueriesData({ queryKey: SERVICES_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return [...[optimistic], ...old].sort((a, b) => a.name.localeCompare(b.name));
      });

      return { previous, tempId: optimistic.id };
    },
    onSuccess: (created: any, _vars, context) => {
      if (context?.tempId) {
        const real = normalizeService({ ...(created || {}), id: created?.id });
        queryClient.setQueriesData({ queryKey: SERVICES_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old
            .map((s) => (s.id === context.tempId ? real : s))
            .sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Servicio creado correctamente');
    },
    onError: (error: Error, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_KEY });
      const previous = queryClient.getQueriesData({ queryKey: SERVICES_KEY });

      // ✅ UPDATE OPTIMISTA: los campos editados cambian al instante
      const categories: any[] = (queryClient.getQueryData(['service_categories']) as any[]) || [];
      const categoryName = categories.find((c) => c.id === data.categoryId)?.name;

      queryClient.setQueriesData({ queryKey: SERVICES_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((s: any) => {
          if (String(s.id) !== String(id)) return s;
          const patch: any = {};
          if (data.name !== undefined) patch.name = data.name;
          if (data.description !== undefined) patch.description = data.description;
          if (data.categoryId !== undefined) {
            patch.category_id = data.categoryId;
            patch.categories = { id: data.categoryId, name: categoryName || s.categories?.name || 'Sin categoría' };
            patch.category = patch.categories;
          }
          if (data.hourlyRate !== undefined) {
            patch.hourlyRate = data.hourlyRate;
            patch.default_hourly_rate = data.hourlyRate;
          }
          if (data.icon !== undefined) patch.icon = data.icon;
          if (data.color !== undefined) patch.color = data.color;
          return { ...s, ...patch };
        });
      });

      return { previous };
    },
    onSuccess: (updated: any) => {
      if (updated) {
        const real = normalizeService(updated);
        queryClient.setQueriesData({ queryKey: SERVICES_KEY }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((s) => (String(s.id) === String(real.id) ? { ...s, ...real } : s));
        });
      }
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Servicio actualizado correctamente');
    },
    onError: (error: Error, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_KEY });
      const previous = queryClient.getQueriesData({ queryKey: SERVICES_KEY });

      // ✅ DELETE OPTIMISTA: desaparece al instante
      queryClient.setQueriesData({ queryKey: SERVICES_KEY }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((s: any) => String(s.id) !== String(id));
      });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Servicio eliminado correctamente');
    },
    onError: (error: Error, _vars, context) => {
      restorePrevious(queryClient, context?.previous ?? []);
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