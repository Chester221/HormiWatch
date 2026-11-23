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
 * Búsqueda incremental:
 *  - `/search` (ILIKE %término%) es la ÚNICA fuente mientras haya resultados.
 *  - `/search/candidates` se pide una sola vez (caché de 5 min) y solo cuando
 *    `/search` no devolvió nada. Fuse actúa como fallback para typos/acentos.
 *  - Nunca se mezclan resultados exactos con fuzzy: evita ruido entre categorías.
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

  const exact = useMemo(() => normalize(exactQuery.data), [exactQuery.data]);

  const hasExactResults = CATEGORIES.some(
    (category) => exact[category].length > 0,
  );

  // `isPlaceholderData` indica que `data` aún pertenece al término anterior.
  // Sin esta guardia, un resultado viejo impediría o dispararía el fallback.
  const exactSettled =
    shouldFetch &&
    !exactQuery.isFetching &&
    !exactQuery.isPlaceholderData &&
    !exactQuery.isError;
  const needsFallback = exactSettled && !hasExactResults;

  const candidatesQuery = useQuery({
    queryKey: ['global-search-candidates'],
    queryFn: ({ signal }) => searchApi.candidates(signal),
    enabled: needsFallback,
    staleTime: CANDIDATE_TTL_MS,
    retry: false,
  });

  const fallbackIndexes = useMemo(() => {
    if (!needsFallback || !candidatesQuery.data) return null;
    const catalog = normalize(candidatesQuery.data);
    const result = {} as Record<Category, Fuse<GlobalSearchItem> | null>;
    CATEGORIES.forEach((category) => {
      const items = catalog[category];
      result[category] = items.length ? new Fuse(items, FUSE_OPTIONS) : null;
    });
    return result;
  }, [needsFallback, candidatesQuery.data]);

  const data = useMemo(() => {
    if (!shouldFetch) return EMPTY_RESULT;

    // Hay coincidencias parciales reales: se muestran tal cual, sin Fuse.
    if (!fallbackIndexes) return exact;

    const needle = stripAccents(debouncedTerm);
    const result = { ...EMPTY_RESULT };
    CATEGORIES.forEach((category) => {
      result[category] = (fallbackIndexes[category]?.search(needle) ?? [])
        .slice(0, RESULT_LIMIT)
        .map(({ item }) => item);
    });
    return result;
  }, [shouldFetch, exact, fallbackIndexes, debouncedTerm]);

  // Mantiene el estado "Buscando…" desde que /search termina con 0 resultados
  // hasta que el catálogo llega, para no mostrar un "No hay resultados" falso.
  const fallbackPending =
    needsFallback && !candidatesQuery.isError && !candidatesQuery.data;

  return {
    data,
    isFetching:
      shouldFetch &&
      (exactQuery.isFetching ||
        exactQuery.isPlaceholderData ||
        (needsFallback &&
          (candidatesQuery.isFetching || fallbackPending))),
    isError: shouldFetch && exactQuery.isError,
    term: debouncedTerm,
    hasMinLength,
  };
}
