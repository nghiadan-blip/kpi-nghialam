export type UserRole = 'ADMIN' | 'LEADERSHIP' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

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
  auth_provider?: string | null;
  avatar_url?: string | null;
  requested_department?: string | null;
  requested_position?: string | null;
  rejection_reason?: string | null;
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

  // Joined fields
  assignee_name?: string;
  assignee_position?: string;
  assignee_department_id?: number | null;
  assignee_department_name?: string;
  assigner_name?: string;
  creator_name?: string;
  catalog_code?: string;
  catalog_name?: string;
  catalog_coefficient?: number;
  catalog_category?: string;
  is_overdue?: boolean;
  computed_status?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  completion_rate?: number;
}

export interface TaskHistory {
  id: number;
  task_id: number;
  changed_by: number;
  old_status?: string | null;
  new_status?: string | null;
  comment?: string | null;
  created_at: string;
  changer_name?: string;
}

export type EvaluationStep = 'STEP_1_SELF' | 'STEP_2_MANAGER' | 'STEP_3_LEADERSHIP_FINAL';
export type FinalClassification = 'TYPE_A' | 'TYPE_B' | 'TYPE_C' | 'TYPE_D';

export interface MonthlyEvaluation {
  id: number;
  employee_id: number;
  month: string; // YYYY-MM
  step: EvaluationStep | string;
  status?: string | null;
  remarks?: string | null;
  self_score?: number | null;
  self_remarks?: string | null;
  self_submitted_at?: string | null;
  manager_id?: number | null;
  manager_score?: number | null;
  manager_remarks?: string | null;
  manager_reviewed_at?: string | null;
  leadership_id?: number | null;
  final_score?: number | null;
  final_classification?: FinalClassification | string | null;
  leadership_remarks?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  employee_name?: string;
  employee_position?: string;
  department_name?: string;
  manager_name?: string;
  leadership_name?: string;
  items?: EvaluationItem[];
  details?: EvaluationItem[];
}

export type Evaluation = MonthlyEvaluation;

export interface EvaluationItem {
  id?: number;
  evaluation_id?: number;
  product_catalog_id?: number | null;
  task_id?: number | null;
  product_name: string;
  category: 'PART_A' | 'PART_B_GROUP_I' | 'PART_B_GROUP_II' | string;
  quantity: number;
  coefficient: number;
  baseline_score: number;
  total_score: number;
  self_points?: number;
  manager_points?: number;
  final_points?: number;
  remarks?: string | null;
  catalog_code?: string;
  catalog_name?: string;
  catalog_coefficient?: number;
  evidence_url?: string | null;
  notes?: string | null;
}

export type EvaluationDetail = EvaluationItem;

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  version: string;
}
