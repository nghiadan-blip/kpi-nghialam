import axios from 'axios';
import { 
  User, 
  Department, 
  Task, 
  TaskStats, 
  ProductCatalog, 
  Evaluation, 
  JobPosition, 
  QuotaStats, 
  EvaluationAppeal, 
  HealthCheckResponse,
  BudgetRevenueItem,
  BudgetExpenditureItem,
  PublicInvestmentProject,
  LandCertificateCase,
  KH965Progress,
  OfficeRequest
} from '../types';

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
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      localStorage.removeItem('cbcc_token');
      localStorage.removeItem('cbcc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fetchHealthCheck = async () => {
  const res = await api.get<HealthCheckResponse>('/health');
  return res.data;
};

// --- Auth APIs ---
export const authApi = {
  login: async (usernameOrData: any, passwordArg?: string) => {
    const payload = typeof usernameOrData === 'object' ? usernameOrData : { username: usernameOrData, password: passwordArg };
    const res = await api.post<{ message: string; user: User; token: string }>('/auth/login', payload);
    return res.data;
  },
  register: async (data: {
    fullname: string;
    email?: string;
    phone?: string;
    requested_department?: string;
    requested_position?: string;
    password: string;
    username?: string;
  }) => {
    const res = await api.post<{ message: string; status: string; user_id?: number }>('/auth/register', data);
    return res.data;
  },
  googleAuth: async (data: {
    email: string;
    fullname?: string;
    google_id?: string;
    avatar_url?: string;
    requested_department?: string;
    requested_position?: string;
  }) => {
    const res = await api.post<{
      message: string;
      status: string;
      token?: string;
      user?: User;
    }>('/auth/google', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get<{ user: User }>('/auth/profile');
    return res.data;
  },
  changePassword: async (currentPasswordOrData: any, newPasswordArg?: string) => {
    const payload = typeof currentPasswordOrData === 'object' ? currentPasswordOrData : {
      currentPassword: currentPasswordOrData,
      newPassword: newPasswordArg,
      old_password: currentPasswordOrData,
      new_password: newPasswordArg,
    };
    const res = await api.post<{ message: string }>('/auth/change-password', payload);
    return res.data;
  },
  logout: async () => {
    const res = await api.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};

// --- Users APIs ---
export const usersApi = {
  getUsers: async (params?: { department_id?: number; role?: string; status?: string; search?: string }) => {
    const res = await api.get<{ users: User[] }>('/users', { params });
    return res.data;
  },
  getPendingApprovals: async () => {
    const res = await api.get<{ pending_users: User[]; count: number }>('/users/pending/list');
    return res.data;
  },
  approveMembership: async (
    id: number,
    data: {
      role: string;
      department_id?: number | null;
      position: string;
      position_code?: string;
      is_disciplined?: boolean;
      discipline_details?: string;
    }
  ) => {
    const res = await api.post<{ message: string; user: User }>(`/users/${id}/approve`, data);
    return res.data;
  },
  rejectMembership: async (id: number, data: { rejection_reason?: string }) => {
    const res = await api.post<{ message: string }>(`/users/${id}/reject`, data);
    return res.data;
  },
  importUsersExcel: async (users: any[]) => {
    const res = await api.post<{ message: string; created_count: number; updated_count: number }>(
      '/users/import-excel',
      { users }
    );
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
  updateTaskStatus: async (
    id: number,
    status: string,
    evidence?: string,
    extra?: {
      actual_completed_quantity?: number;
      actual_completed_date?: string;
      delay_count?: number;
      rework_count?: number;
    }
  ) => {
    const res = await api.patch<{ message: string }>(`/tasks/${id}/status`, {
      status,
      evidence,
      ...extra,
    });
    return res.data;
  },
  deleteTask: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/tasks/${id}`);
    return res.data;
  },
};

// --- Product Catalog APIs (Decree 335) ---
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
  importCatalogExcel: async (items: any[]) => {
    const res = await api.post<{ message: string; created_count: number; updated_count: number }>(
      '/catalog/import-excel',
      { items }
    );
    return res.data;
  },
  importOfficialQD: async () => {
    const res = await api.post<{ message: string; created_count: number; updated_count: number; total: number }>(
      '/catalog/import-official-qd'
    );
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

// --- Evaluations APIs ---
export const evaluationsApi = {
  getEvaluations: async (params?: {
    month?: string;
    employee_id?: number;
    department_id?: number;
    step?: string;
    classification?: string;
    status?: string;
  }) => {
    const res = await api.get<{ evaluations: Evaluation[] }>('/evaluations', { params });
    return res.data;
  },
  getEvaluationById: async (id: number) => {
    const res = await api.get<{ evaluation: Evaluation }>(`/evaluations/${id}`);
    return res.data;
  },
  saveDraft: async (data: {
    month: string;
    criteria_politics_self?: number;
    criteria_expertise_self?: number;
    criteria_innovation_self?: number;
    leadership_unit_result?: number;
    leadership_execution?: number;
    leadership_solidarity?: number;
    collective_comments?: string;
    party_cell_comments?: string;
    special_case?: string;
    items: Array<{
      product_catalog_id?: number | null;
      task_id?: number | null;
      quantity: number;
      remarks?: string;
    }>;
    remarks?: string;
  }) => {
    const res = await api.post<{ message: string; evaluation_id: number; self_score: number; evaluation?: Evaluation }>('/evaluations/draft', data);
    return res.data;
  },
  submitSelfEvaluation: async (idOrData: any) => {
    if (typeof idOrData === 'number') {
      const res = await api.post<{ message: string }>(`/evaluations/${idOrData}/submit`);
      return res.data;
    }
    const draftRes = await api.post<{ message: string; evaluation_id: number }>('/evaluations/draft', idOrData);
    if (draftRes.data.evaluation_id) {
      await api.post(`/evaluations/${draftRes.data.evaluation_id}/submit`);
    }
    return draftRes.data;
  },
  submitManagerReview: async (
    id: number,
    data: {
      items?: any[];
      manager_score?: number;
      remarks?: string;
    }
  ) => {
    const res = await api.post<{ message: string; manager_score: number }>(
      `/evaluations/${id}/review`,
      data
    );
    return res.data;
  },
  reviewByManager: async (id: number, data: any) => {
    return evaluationsApi.submitManagerReview(id, data);
  },
  submitLeadershipApproval: async (
    id: number,
    data: {
      items?: any[];
      final_score?: number;
      final_classification?: string;
      remarks?: string;
    }
  ) => {
    const res = await api.post<{ message: string; evaluation: Evaluation }>(
      `/evaluations/${id}/approve`,
      data
    );
    return res.data;
  },
  approveByLeadership: async (id: number, data: any) => {
    return evaluationsApi.submitLeadershipApproval(id, data);
  },
  getQuotaStats: async (month: string) => {
    const res = await api.get<QuotaStats>('/evaluations/quota-stats', { params: { month } });
    return res.data;
  },
  submitAppeal: async (id: number, data: { reason: string; evidence_url?: string }) => {
    const res = await api.post<{ message: string; appeal_id: number; deadline_at: string }>(
      `/evaluations/${id}/appeal`,
      data
    );
    return res.data;
  },
  getAppeals: async () => {
    const res = await api.get<{ appeals: EvaluationAppeal[] }>('/evaluations/appeals');
    return res.data;
  },
  resolveAppeal: async (
    appealId: number,
    data: { status: 'ACCEPTED' | 'REJECTED'; response_text: string; adjusted_score?: number }
  ) => {
    const res = await api.post<{ message: string }>(`/evaluations/appeals/${appealId}/resolve`, data);
    return res.data;
  },
  deleteEvaluation: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/evaluations/${id}`);
    return res.data;
  },
  sendEvaluationEmail: async (id: number) => {
    const res = await api.post<{ message: string; success: boolean }>(`/evaluations/${id}/send-email`);
    return res.data;
  },
  batchSendEvaluationEmails: async (month: string) => {
    const res = await api.post<{ message: string; result: any }>('/evaluations/batch-send-emails', { month });
    return res.data;
  },
};

// --- Job Positions APIs (33 Official Positions) ---
export const jobPositionsApi = {
  getJobPositions: async (group_type?: string) => {
    const res = await api.get<{
      job_positions: JobPosition[];
      total_positions: number;
      total_allocated_quota: number;
      total_assigned: number;
    }>('/job-positions', { params: { group_type } });
    return res.data;
  },
  getJobPositionByCode: async (code: string) => {
    const res = await api.get<{ position: JobPosition & { assigned_users: User[] } }>(
      `/job-positions/${code}`
    );
    return res.data;
  },
};

// --- Dashboard & Reports APIs ---
export const reportsApi = {
  getDashboardKPIs: async (month?: string) => {
    const res = await api.get<{
      month: string;
      summary?: {
        totalUsers: number;
        totalDepartments: number;
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        pendingTasks: number;
        overdueTasks: number;
        taskCompletionRate: number;
        totalEvaluations: number;
        approvedEvaluationsCount: number;
        evalCompletionRate: number;
      };
      taskStats: TaskStats;
      classifications: { countA: number; countB: number; countC: number; countD: number; totalApproved: number };
      departmentProgress: Array<{
        id: number;
        name: string;
        total: number;
        completed: number;
        rate: number;
      }>;
      urgentTasks: Task[];
      topEmployees?: any[];
    }>('/reports/dashboard', { params: { month } });
    return res.data;
  },
  getDashboardStats: async (month?: string) => {
    return reportsApi.getDashboardKPIs(month);
  },
  downloadExcel: (month?: string, department_id?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (department_id) params.append('department_id', String(department_id));
    window.open(`/api/reports/monthly-excel?${params.toString()}`, '_blank');
  },
};

// --- DeepSeek AI APIs ---
export const aiApi = {
  generateEvaluationRemark: async (data: any) => {
    const res = await api.post<{ remark: string; source: string }>('/ai/evaluate-remark', data);
    return res.data;
  },
  suggestTaskDetails: async (data: {
    title: string;
    assignee_name?: string;
    position?: string;
    department_name?: string;
  }) => {
    const res = await api.post<{ description: string; source: string }>('/ai/suggest-task', data);
    return res.data;
  },
  matchCatalogItems: async (data: {
    query?: string;
    position?: string;
    department?: string;
    limit?: number;
  }) => {
    const res = await api.post<{
      matches: Array<{
        item: ProductCatalog;
        confidence: number;
        match_reason: string;
      }>;
      source: string;
    }>('/ai/match-catalog', data);
    return res.data;
  },
  chatWithAI: async (data: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  }) => {
    const res = await api.post<{ reply: string; source: string }>('/ai/chat', data);
    return res.data;
  },
};

// --- Municipal Budget APIs ---
export const budgetApi = {
  getBudgets: async (year?: number, category?: string, status?: string) => {
    const res = await api.get<{
      revenues: BudgetRevenueItem[];
      expenditures: BudgetExpenditureItem[];
      stats: any;
    }>('/budget', { params: { year, category, status } });
    return res.data;
  },
  createRevenue: async (data: any) => {
    const res = await api.post<{ message: string; id: number }>('/budget/revenue', data);
    return res.data;
  },
  updateRevenue: async (id: number, data: any) => {
    const res = await api.put<{ message: string }>('/budget/revenue/' + id, data);
    return res.data;
  },
  deleteRevenue: async (id: number) => {
    const res = await api.delete<{ message: string }>('/budget/revenue/' + id);
    return res.data;
  },
  createExpenditure: async (data: any) => {
    const res = await api.post<{ message: string; id: number }>('/budget/expenditure', data);
    return res.data;
  },
  updateExpenditure: async (id: number, data: any) => {
    const res = await api.put<{ message: string }>('/budget/expenditure/' + id, data);
    return res.data;
  },
  deleteExpenditure: async (id: number) => {
    const res = await api.delete<{ message: string }>('/budget/expenditure/' + id);
    return res.data;
  },
  exportExcel: (year?: number) => {
    window.open(`/api/budget/export?year=${year || new Date().getFullYear()}`, '_blank');
  }
};

// --- Public Investment APIs ---
export const publicInvestmentApi = {
  getProjects: async (status?: string, obstacle_type?: string, search?: string) => {
    const res = await api.get<{ projects: PublicInvestmentProject[] }>('/public-investment', { params: { status, obstacle_type, search } });
    return res.data;
  },
  createProject: async (data: any) => {
    const res = await api.post<{ message: string; id: number }>('/public-investment', data);
    return res.data;
  },
  updateProject: async (id: number, data: any) => {
    const res = await api.put<{ message: string }>('/public-investment/' + id, data);
    return res.data;
  },
  deleteProject: async (id: number) => {
    const res = await api.delete<{ message: string }>('/public-investment/' + id);
    return res.data;
  },
  exportExcel: () => {
    window.open('/api/public-investment/export', '_blank');
  }
};

// --- Land Certificate & KH965 APIs ---
export const landCertificateApi = {
  getCases: async (case_group?: string, status?: string, village?: string, search?: string) => {
    const res = await api.get<{ cases: LandCertificateCase[] }>('/land-certificates/cases', { params: { case_group, status, village, search } });
    return res.data;
  },
  createCase: async (data: any) => {
    const res = await api.post<{ message: string; id: number }>('/land-certificates/cases', data);
    return res.data;
  },
  updateCase: async (id: number, data: any) => {
    const res = await api.put<{ message: string }>('/land-certificates/cases/' + id, data);
    return res.data;
  },
  deleteCase: async (id: number) => {
    const res = await api.delete<{ message: string }>('/land-certificates/cases/' + id);
    return res.data;
  },
  getKH965Progress: async () => {
    const res = await api.get<{ progress: KH965Progress[] }>('/land-certificates/kh965');
    return res.data;
  },
  updateKH965Progress: async (data: any) => {
    const res = await api.post<{ message: string }>('/land-certificates/kh965', data);
    return res.data;
  },
  exportExcel: () => {
    window.open('/api/land-certificates/export', '_blank');
  }
};

// --- Office and Logistics APIs ---
export const officeApi = {
  getRequests: async (request_type?: string, status?: string) => {
    const res = await api.get<{ requests: OfficeRequest[] }>('/office', { params: { request_type, status } });
    return res.data;
  },
  createRequest: async (data: any) => {
    const res = await api.post<{ message: string; id: number }>('/office', data);
    return res.data;
  },
  updateRequest: async (id: number, data: any) => {
    const res = await api.put<{ message: string }>('/office/' + id, data);
    return res.data;
  },
  deleteRequest: async (id: number) => {
    const res = await api.delete<{ message: string }>('/office/' + id);
    return res.data;
  },
  exportExcel: () => {
    window.open('/api/office/export', '_blank');
  }
};

// --- Commune Chairman Executive Dashboard APIs ---
export const executiveDashboardApi = {
  getDashboard: async () => {
    const res = await api.get<{
      summary: string;
      metrics: any;
    }>('/executive-dashboard');
    return res.data;
  }
};
