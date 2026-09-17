// src/lib/api.ts
// ============================================================
// 1. CONFIGURACIÓN BASE
// ============================================================
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// ============================================================
// 2. CLIENTE HTTP CON MANEJO DE ERRORES, TOKEN Y REFRESH
// ============================================================
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

export const requestRefresh = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.accessToken) {
      accessToken = data.accessToken;
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
};

const apiClient = async (endpoint: string, options: RequestInit = {}, retry = true): Promise<any> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  // ✅ Auto-refresh en 401 y reintento una vez
  if (response.status === 401 && retry) {
    const newToken = await requestRefresh();
    if (newToken) {
      return apiClient(endpoint, options, false);
    }
    // Fallback legacy: intentar con token de localStorage
    const legacy = localStorage.getItem('token');
    if (legacy) {
      accessToken = legacy;
      return apiClient(endpoint, options, false);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = Array.isArray(error.message)
      ? error.message.join('. ')
      : error.message || `Error del servidor (${response.status})`;
    const err = new Error(msg) as any;
    err.status = response.status;
    err.statusCode = response.status;
    err.statusText = response.statusText;
    throw err;
  }

  const text = await response.text();
  // ✅ 204 No Content o 200 sin cuerpo (ej. DELETE de tarea): nada que parsear.
  if (!text) {
    return null;
  }

  const json = JSON.parse(text);

  // ✅ SOPORTA { records, meta } Preserva meta para que el cliente pueda paginar
  if (json && typeof json === 'object' && 'meta' in json) {
    return { records: json.records ?? [], meta: json.meta };
  }

  // ✅ AHORA SOPORTA { records: [] } Y { data: [] }
  return json?.records ?? json?.data ?? json;
};

// ============================================================
// 3. ENDPOINTS AGRUPADOS POR RECURSO
// ============================================================

// ---------- AUTH ----------
export const authApi = {
  login: (email: string, password: string) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: any) =>
    apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () =>
    apiClient('/auth/logout', { method: 'POST' }),

  refresh: () =>
    apiClient('/auth/refresh', { method: 'POST' }),

  // ✅ NUEVO: cambiar la contraseña del usuario autenticado
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // ✅ NUEVO: session para obtener sesión actual
  session: () =>
    apiClient('/auth/session', { method: 'GET' }),

  // ✅ NUEVO: eliminar la propia cuenta (cualquier rol)
  deleteAccount: () =>
    apiClient('/auth/account', { method: 'DELETE' }),
};

// ---------- USERS ----------
export const usersApi = {
  getAll: (params?: any) =>
    apiClient(`/users${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/users/${id}`),

  create: (data: any) =>
    apiClient('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/users/${id}`, { method: 'DELETE' }),

  getManagers: () =>
    apiClient('/users/managers'),

  getTechnicians: () =>
    apiClient('/users/technicians'),
};

// ---------- ROLES ----------
export const rolesApi = {
  getAll: () => apiClient('/role'),
};

// ---------- PROJECTS ----------
export const projectsApi = {
  getAll: (params?: any) =>
    apiClient(`/projects${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/projects/${id}`),

  create: (data: any) =>
    apiClient('/projects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/projects/${id}`, { method: 'DELETE' }),

  restore: (id: string) =>
    apiClient(`/projects/${id}/restore`, { method: 'PATCH' }),
};

// ---------- TASKS ----------
export const tasksApi = {
  getAll: (params?: any) =>
    apiClient(`/tasks${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/tasks/${id}`),

  create: (data: any) =>
    apiClient('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/tasks/${id}`, { method: 'DELETE' }),

  getStatuses: () =>
    apiClient('/tasks/statuses'),
};

// ---------- CUSTOMERS ----------
export const customersApi = {
  getAll: (params?: any) =>
    apiClient(`/customers${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/customers/${id}`),

  create: (data: any) =>
    apiClient('/customers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/customers/${id}`, { method: 'DELETE' }),

  getDashboard: () =>
    apiClient('/customers/dashboard'),

  // Contacts
  getContacts: (customerId: string) =>
    apiClient(`/customers/${customerId}/contacts`),

  createContact: (customerId: string, data: any) =>
    apiClient(`/customers/${customerId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContact: (customerId: string, contactId: string, data: any) =>
    apiClient(`/customers/${customerId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteContact: (customerId: string, contactId: string) =>
    apiClient(`/customers/${customerId}/contacts/${contactId}`, {
      method: 'DELETE',
    }),
};

// ---------- SERVICES ----------
export const servicesApi = {
  getAll: (params?: any) =>
    apiClient(`/services${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/services/${id}`),

  create: (data: any) =>
    apiClient('/services', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/services/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () =>
    apiClient('/services/categories'),

  createCategory: (data: any) =>
    apiClient('/services/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: any) =>
    apiClient(`/services/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCategory: (id: string) =>
    apiClient(`/services/categories/${id}`, { method: 'DELETE' }),

  // Platforms
  getPlatforms: () =>
    apiClient('/services/platforms'),

  createPlatform: (data: any) =>
    apiClient('/services/platforms', { method: 'POST', body: JSON.stringify(data) }),

  updatePlatform: (id: string, data: any) =>
    apiClient(`/services/platforms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deletePlatform: (id: string) =>
    apiClient(`/services/platforms/${id}`, { method: 'DELETE' }),

  // Types
  getTypes: () =>
    apiClient('/services/types'),

  createType: (data: any) =>
    apiClient('/services/types', { method: 'POST', body: JSON.stringify(data) }),

  updateType: (id: string, data: any) =>
    apiClient(`/services/types/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteType: (id: string) =>
    apiClient(`/services/types/${id}`, { method: 'DELETE' }),
};

// ---------- ROLE ----------
export const roleApi = {
  getAll: () =>
    apiClient('/role'),

  getById: (id: string) =>
    apiClient(`/role/${id}`),

  create: (data: any) =>
    apiClient('/role', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/role/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/role/${id}`, { method: 'DELETE' }),
};

// ---------- HOLIDAYS ----------
export const holidaysApi = {
  getAll: (params?: any) =>
    apiClient(`/holidays${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/holidays/${id}`),

  create: (data: any) =>
    apiClient('/holidays', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/holidays/${id}`, { method: 'DELETE' }),

  sync: (year: number) =>
    apiClient('/holidays/sync', { method: 'POST', body: JSON.stringify({ year }) }),
};

// ---------- REPORTS ----------
export const reportsApi = {
  getPdf: (id: string, type: 'usuarios' | 'grafico' = 'usuarios') =>
    `${API_URL}/reports/${id}/pdf${type === 'grafico' ? '-grafico' : ''}`,
};

// ---------- METRICS ----------
export const metricsApi = {
  getCompletedProjects: (userId: string) =>
    apiClient(`/metrics/completed-projects/${userId}`),

  getRecentProjects: () =>
    apiClient('/metrics/recent-projects'),

  getProjectMetrics: (projectId: string) =>
    apiClient(`/metrics/project/${projectId}`),

  getRecentProjectsByUser: (userId: string) =>
    apiClient(`/metrics/recent-projects-by-user/${userId}`),

  getRegisteredTasks: (userId: string) =>
    apiClient(`/metrics/registered-tasks/${userId}`),

  getTotalTaskTime: (userId: string) =>
    apiClient(`/metrics/total-task-time/${userId}`),

  getTasksByTechnicianProject: (projectId: string) =>
    apiClient(`/metrics/tasks-by-technician-project/${projectId}`),
};

// ---------- STORAGE ----------
export const storageApi = {
  upload: (file: File, path?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (path) formData.append('path', path);

    return fetch(`${API_URL}/storage/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken || localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  delete: (filePath: string) =>
    apiClient('/storage/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path: filePath }),
    }),

  getUrl: (filePath: string) =>
    `${API_URL}/storage/${filePath}`,
};

// ---------- AUDIT ----------
export const auditApi = {
  getAll: (params?: any) =>
    apiClient(`/audit${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/audit/${id}`),

  create: (data: any) =>
    apiClient('/audit', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/audit/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/audit/${id}`, { method: 'DELETE' }),
};

// ---------- NOTIFICATIONS ----------
export const notificationsApi = {
  getAll: (params?: any) =>
    apiClient(`/notifications${params ? `?${new URLSearchParams(params)}` : ''}`),

  getById: (id: string) =>
    apiClient(`/notifications/${id}`),

  create: (data: any) =>
    apiClient('/notifications', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiClient(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient(`/notifications/${id}`, { method: 'DELETE' }),
};

// ============================================================
// 4. EXPORTACIÓN PREDETERMINADA
// ============================================================
export default {
  auth: authApi,
  users: usersApi,
  projects: projectsApi,
  tasks: tasksApi,
  customers: customersApi,
  services: servicesApi,
  role: roleApi,
  holidays: holidaysApi,
  reports: reportsApi,
  metrics: metricsApi,
  storage: storageApi,
  audit: auditApi,
  notifications: notificationsApi,
};