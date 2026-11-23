import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchApi } from '@/lib/api';
import { useDebounce } from './useDebounce';

export type GlobalSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type GlobalSearchResult = {
  projects: GlobalSearchItem[];
  tasks: GlobalSearchItem[];
  customers: GlobalSearchItem[];
  users: GlobalSearchItem[];
  services: GlobalSearchItem[];
};

const EMPTY_RESULT: GlobalSearchResult = {
  projects: [],
  tasks: [],
  customers: [],
  users: [],
  services: [],
};

const CATEGORIES: (keyof GlobalSearchResult)[] = [
  'projects',
  'tasks',
  'customers',
  'users',
  'services',
];

const normalize = (raw: any): GlobalSearchResult => {
  const result = { ...EMPTY_RESULT };
  CATEGORIES.forEach((category) => {
    result[category] = Array.isArray(raw?.[category]) ? raw[category] : [];
  });
  return result;
};

/**
 * Búsqueda global con debounce. Solo pide al backend cuando el popover está
 * abierto y hay al menos 2 caracteres; el AbortSignal cancela la petición
 * anterior si el usuario sigue tecleando.
 */
export function useGlobalSearch(query: string, enabled: boolean) {
  const term = query.trim();
  const debouncedTerm = useDebounce(term, 250);
  const shouldFetch = enabled && debouncedTerm.length >= 2;

  const queryResult = useQuery({
    queryKey: ['global-search', debouncedTerm],
    queryFn: ({ signal }) => searchApi.global(debouncedTerm, signal),
    enabled: shouldFetch,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  });

  return {
    data: normalize(queryResult.data),
    isFetching: shouldFetch && queryResult.isFetching,
    isError: shouldFetch && queryResult.isError,
    term: debouncedTerm,
    hasMinLength: term.length >= 2,
  };
}
