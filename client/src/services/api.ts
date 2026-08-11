import axios from 'axios';
import { User, Department, Task, TaskStats, ProductCatalog, HealthCheckResponse } from '../types';

export type { HealthCheckResponse };

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cbcc_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('cbcc_token');
      localStorage.removeItem('cbcc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth APIs ---
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post<{ message: string; token: string; user: User }>('/auth/login', { username, password });
    return res.data;
  },
  logout: async () => {
    const res = await api.post<{ message: string }>('/auth/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

// --- Users APIs ---
export const usersApi = {
  getUsers: async (params?: { department_id?: number; role?: string; status?: string; search?: string }) => {
    const res = await api.get<{ users: User[] }>('/users', { params });
    return res.data;
  },
  getUserById: async (id: number) => {
    const res = await api.get<{ user: User }>(`/users/${id}`);
    return res.data;
  },
  createUser: async (data: Partial<User> & { password: string }) => {
    const res = await api.post<{ message: string; user: User }>('/users', data);
    return res.data;
  },
  updateUser: async (id: number, data: Partial<User>) => {
    const res = await api.put<{ message: string; user: User }>(`/users/${id}`, data);
    return res.data;
  },
  resetPassword: async (id: number, newPassword: string) => {
    const res = await api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },
  deleteUser: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/users/${id}`);
    return res.data;
  },
};

// --- Departments APIs ---
export const departmentsApi = {
  getDepartments: async () => {
    const res = await api.get<{ departments: Department[] }>('/departments');
    return res.data;
  },
  createDepartment: async (data: { name: string; parent_id?: number | null }) => {
    const res = await api.post<{ message: string; department: Department }>('/departments', data);
    return res.data;
  },
  updateDepartment: async (id: number, data: { name: string; parent_id?: number | null }) => {
    const res = await api.put<{ message: string; department: Department }>(`/departments/${id}`, data);
    return res.data;
  },
  deleteDepartment: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/departments/${id}`);
    return res.data;
  },
};

// --- Tasks APIs ---
export const tasksApi = {
  getTasks: async (params?: {
    status?: string;
    assigned_to?: number;
    assigned_by?: number;
    department_id?: number;
    search?: string;
    overdue_only?: boolean;
  }) => {
    const res = await api.get<{ tasks: Task[] }>('/tasks', { params });
    return res.data;
  },
  getTaskStats: async () => {
    const res = await api.get<{ stats: TaskStats }>('/tasks/stats');
    return res.data;
  },
  getTaskById: async (id: number) => {
    const res = await api.get<{ task: Task }>(`/tasks/${id}`);
    return res.data;
  },
  createTask: async (data: {
    title: string;
    description?: string;
    assigned_to: number;
    product_catalog_id?: number | null;
    deadline: string;
    weight?: number;
    status?: string;
  }) => {
    const res = await api.post<{ message: string; task: Task }>('/tasks', data);
    return res.data;
  },
  updateTask: async (id: number, data: Partial<Task>) => {
    const res = await api.put<{ message: string; task: Task }>(`/tasks/${id}`, data);
    return res.data;
  },
  updateTaskStatus: async (id: number, status: string, evidence?: string) => {
    const res = await api.patch<{ message: string }>(`/tasks/${id}/status`, { status, evidence });
    return res.data;
  },
  deleteTask: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/tasks/${id}`);
    return res.data;
  },
};

// --- Catalog APIs ---
export const catalogApi = {
  getCatalog: async (params?: { category?: string; status?: string }) => {
    const res = await api.get<{ catalog: ProductCatalog[] }>('/catalog', { params });
    return res.data;
  },
  getCatalogById: async (id: number) => {
    const res = await api.get<{ item: ProductCatalog }>(`/catalog/${id}`);
    return res.data;
  },
  createCatalogItem: async (data: Partial<ProductCatalog>) => {
    const res = await api.post<{ message: string; item: ProductCatalog }>('/catalog', data);
    return res.data;
  },
  updateCatalogItem: async (id: number, data: Partial<ProductCatalog>) => {
    const res = await api.put<{ message: string; item: ProductCatalog }>(`/catalog/${id}`, data);
    return res.data;
  },
  deleteCatalogItem: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/catalog/${id}`);
    return res.data;
  },
};

export const fetchHealthCheck = async (): Promise<HealthCheckResponse> => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};
