import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Fuse, { type IFuseOptions } from 'fuse.js';

import { searchApi } from '@/lib/api';
import { useDebounce } from './useDebounce';

const SEARCH_DEBOUNCE_MS = 150;
const RESULT_LIMIT = 5;
const CANDIDATE_TTL_MS = 5 * 60_000;

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

type Category = keyof GlobalSearchResult;

const EMPTY_RESULT: GlobalSearchResult = {
  projects: [],
  tasks: [],
  customers: [],
  users: [],
  services: [],
};

const CATEGORIES: Category[] = [
  'projects',
  'tasks',
  'customers',
  'users',
  'services',
];

/** Fuse no maneja acentos por sí solo: "andres" debe encontrar "Andrés". */
const stripAccents = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const FUSE_OPTIONS: IFuseOptions<GlobalSearchItem> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.35,
  keys: [
    { name: 'title', weight: 0.7, getFn: (item) => stripAccents(item.title) },
    { name: 'subtitle', weight: 0.2, getFn: (item) => stripAccents(item.subtitle) },
    { name: 'meta', weight: 0.1, getFn: (item) => stripAccents(item.meta) },
  ],
};

const normalize = (raw: any): GlobalSearchResult => {
  const result = { ...EMPTY_RESULT };
  CATEGORIES.forEach((category) => {
    result[category] = Array.isArray(raw?.[category]) ? raw[category] : [];
  });
  return result;
};

/**
 * Búsqueda global híbrida:
 *  - `/search` aporta coincidencias exactas del backend (prioritarias).
 *  - `/search/candidates` se pide una vez y se cachea; Fuse lo rankea en local
 *    para tolerar typos y acentos ("proyt" -> "Proyecto").
 */
export function useGlobalSearch(query: string, enabled: boolean) {
  const term = query.trim();
  const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const hasMinLength = term.length >= 2;
  const shouldFetch = enabled && debouncedTerm.length >= 2;

  const exactQuery = useQuery({
    queryKey: ['global-search', debouncedTerm],
    queryFn: ({ signal }) => searchApi.global(debouncedTerm, signal),
    enabled: shouldFetch,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const candidatesQuery = useQuery({
    queryKey: ['global-search-candidates'],
    queryFn: ({ signal }) => searchApi.candidates(signal),
    enabled: enabled && hasMinLength,
    staleTime: CANDIDATE_TTL_MS,
    retry: false,
  });

  const exact = useMemo(() => normalize(exactQuery.data), [exactQuery.data]);
  const candidates = useMemo(
    () => normalize(candidatesQuery.data),
    [candidatesQuery.data],
  );

  const indexes = useMemo(() => {
    const result = {} as Record<Category, Fuse<GlobalSearchItem> | null>;
    CATEGORIES.forEach((category) => {
      const items = candidates[category];
      result[category] = items.length ? new Fuse(items, FUSE_OPTIONS) : null;
    });
    return result;
  }, [candidates]);

  const data = useMemo(() => {
    const result = { ...EMPTY_RESULT };
    const needle = stripAccents(debouncedTerm);

    CATEGORIES.forEach((category) => {
      const exactItems = exact[category];
      const seen = new Set(exactItems.map((item) => item.id));
      const merged = [...exactItems];
      const index = indexes[category];

      if (index && needle.length >= 2 && merged.length < RESULT_LIMIT) {
        index.search(needle).forEach(({ item }) => {
          if (seen.has(item.id)) return;
          seen.add(item.id);
          merged.push(item);
        });
      }

      result[category] = merged.slice(0, RESULT_LIMIT);
    });

    return result;
  }, [exact, indexes, debouncedTerm]);

  return {
    data,
    isFetching:
      shouldFetch && (exactQuery.isFetching || candidatesQuery.isFetching),
    isError: shouldFetch && exactQuery.isError,
    term: debouncedTerm,
    hasMinLength,
  };
}
