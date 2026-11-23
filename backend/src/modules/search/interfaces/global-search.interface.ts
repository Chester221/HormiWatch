/** Resultado normalizado de búsqueda. El backend devuelve datos, nunca rutas:
 *  la navegación es responsabilidad del frontend. */
export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

export interface GlobalSearchResult {
  projects: SearchItem[];
  tasks: SearchItem[];
  customers: SearchItem[];
  users: SearchItem[];
  services: SearchItem[];
}
