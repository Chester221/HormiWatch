import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  managers: number;
  technicians: number;
  leaders: number;
  other: number;
  generatedAt: string;
}

/**
 * KPIs del módulo de usuarios. El backend calcula los conteos en la BD
 * con un único aggregate; aquí solo se cachean y se refrescan tras mutaciones.
 */
export const useUserStats = () =>
  useQuery<UserStats>({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.getStats() as Promise<UserStats>,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
