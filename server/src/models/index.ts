import 'knex/types/tables';

export interface Department {
  id: number;
  name: string;
  parent_id?: number | null;
  created_at?: string | Date;
}

export type UserRole = 'ADMIN' | 'LEADERSHIP' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  fullname: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole | string;
  position: string;
  department_id?: number | null;
  status: UserStatus | string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export type ProductCatalogCategory = 'PART_A' | 'PART_B_GROUP_I' | 'PART_B_GROUP_II';
export type ProductCatalogStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductCatalog {
  id: number;
  code: string;
  name: string;
  category: ProductCatalogCategory | string;
  coefficient: number;
  baseline_score: number;
  description?: string | null;
  status: ProductCatalogStatus | string;
  created_at?: string | Date;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  assigned_to: number;
  assigned_by: number;
  product_catalog_id?: number | null;
  deadline: string | Date;
  weight: number;
  status: TaskStatus | string;
  evidence?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
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
  created_at?: string | Date;
  updated_at?: string | Date;
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
  created_at?: string | Date;
}

declare module 'knex/types/tables' {
  interface Tables {
    departments: Department;
    users: User;
    product_catalog: ProductCatalog;
    tasks: Task;
    evaluations: Evaluation;
    evaluation_details: EvaluationDetail;
    audit_logs: AuditLog;
  }
}
