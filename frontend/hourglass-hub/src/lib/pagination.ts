export type PageResponse<T> = {
  records?: T[];
  data?: T[];
  meta?: {
    hasNextPage?: boolean;
    page?: number;
    pageCount?: number;
  };
};

export type FetchAllPagesOptions = {
  take?: number;
  signal?: AbortSignal;
};

const createAbortError = () => {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
};

export const fetchAllPages = async <T>(
  fetchPage: (page: number, signal?: AbortSignal) => Promise<T[] | PageResponse<T>>,
  { take = 100, signal }: FetchAllPagesOptions = {},
): Promise<T[]> => {
  const all: T[] = [];
  let page = 1;

  while (true) {
    if (signal?.aborted) throw createAbortError();

    const response = await fetchPage(page, signal);

    if (Array.isArray(response)) {
      all.push(...response);
      break;
    }

    const records = response?.records ?? response?.data ?? [];
    all.push(...records);

    if (records.length === 0) break;

    const meta = response?.meta;
    const hasNextPage =
      typeof meta?.hasNextPage === 'boolean'
        ? meta.hasNextPage
        : typeof meta?.page === 'number' && typeof meta?.pageCount === 'number'
          ? meta.page < meta.pageCount
          : records.length >= take;

    if (!hasNextPage) break;

    page += 1;
  }

  return all;
};
