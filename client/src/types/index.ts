export type UserRole = 'ADMIN' | 'LEADERSHIP' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  username: string;
  password_hash?: string;
  fullname: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole | string;
  position: string;
  department_id?: number | null;
  department_name?: string | null;
  status: UserStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  parent_id?: number | null;
  parent_name?: string | null;
  user_count?: number;
  created_at?: string;
}

export interface ProductCatalog {
  id: number;
  code: string;
  name: string;
  category: 'PART_A' | 'PART_B_GROUP_I' | 'PART_B_GROUP_II' | string;
  coefficient: number;
  baseline_score: number;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  created_at?: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  assigned_to: number;
  assigned_by: number;
  product_catalog_id?: number | null;
  deadline: string;
  weight: number;
  status: TaskStatus | string;
  evidence?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_REVIEWED' | 'APPROVED';

export interface Evaluation {
  id: number;
  employee_id: number;
  month: string;
  status: EvaluationStatus | string;
  self_score: number;
  manager_score: number;
  final_score: number;
  manager_id?: number | null;
  approver_id?: number | null;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationDetail {
  id: number;
  evaluation_id: number;
  task_id?: number | null;
  product_catalog_id: number;
  quantity: number;
  self_points: number;
  manager_points: number;
  final_points: number;
  remarks?: string | null;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  details?: string | null;
  ip_address?: string | null;
  created_at?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  version: string;
}
