// src/lib/api.ts
// ============================================================
// 1. CONFIGURACIÓN BASE
// ============================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================
// 2. CLIENTE HTTP CON MANEJO DE ERRORES Y TOKEN
// ============================================================
const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
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
    `${API_URL}/api/reports/${id}/pdf${type === 'grafico' ? '-grafico' : ''}`,
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

    return fetch(`${API_URL}/api/storage/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    `${API_URL}/api/storage/${filePath}`,
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