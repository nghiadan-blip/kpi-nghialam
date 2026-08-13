export type UserRole = 'ADMIN' | 'LEADERSHIP' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

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
  auth_provider?: string | null;
  google_id?: string | null;
  avatar_url?: string | null;
  requested_department?: string | null;
  requested_position?: string | null;
  rejection_reason?: string | null;
  position_code?: string | null;
  is_disciplined?: boolean | number | null;
  discipline_details?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  // Computed fields used in client UI
  department_name?: string | null;
  official_position_name?: string | null;
  civil_service_rank?: string | null;
  allocated_quota?: number;
}

export interface Department {
  id: number;
  name: string;
  parent_id?: number | null;
  parent_name?: string | null;
  user_count?: number;
  created_at?: string;
}

export interface JobPosition {
  id: number;
  code: string;
  name: string;
  group_type: 'NHOM_I_LANH_DAO' | 'NHOM_II_CHUYEN_MON' | 'NHOM_III_PHUC_VU' | string;
  civil_service_rank?: string | null;
  allocated_quota: number;
  allocated_ratio_percent: number;
  current_assigned: number;
  is_vacant: boolean;
  is_over_quota: boolean;
  fill_rate_percent: number;
  description?: string | null;
  created_at?: string;
}

export interface ProductCatalog {
  id: number;
  code: string;
  name: string;
  category: 'PART_A' | 'PART_B_GROUP_I' | 'PART_B_GROUP_II' | string;
  complexity_group?: 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | string;
  applicable_position_codes?: string | null;
  output_product?: string | null;
  frequency?: string | null;
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
  deadline: string | Date;
  weight: number;
  status: TaskStatus | string;
  evidence?: string | null;
  assigned_quantity?: number | null;
  converted_assigned_quantity?: number | null;
  actual_completed_quantity?: number | null;
  actual_completed_date?: string | Date | null;
  delay_count?: number | null;
  rework_count?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;

  // Joined/Computed fields used in client UI
  assignee_name?: string;
  assignee_position?: string;
  assignee_department_id?: number | null;
  assignee_department_name?: string;
  assigner_name?: string;
  creator_name?: string;
  creator_position?: string;
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
export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_REVIEWED' | 'APPROVED';

export interface MonthlyEvaluation {
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

  criteria_politics_self?: number | null;
  criteria_politics_mgr?: number | null;
  criteria_politics_final?: number | null;
  criteria_expertise_self?: number | null;
  criteria_expertise_mgr?: number | null;
  criteria_expertise_final?: number | null;
  criteria_innovation_self?: number | null;
  criteria_innovation_mgr?: number | null;
  criteria_innovation_final?: number | null;
  general_score_self?: number | null;
  general_score_mgr?: number | null;
  general_score_final?: number | null;
  task_score_self?: number | null;
  task_score_mgr?: number | null;
  task_score_final?: number | null;

  leadership_unit_result?: number | null;
  leadership_execution?: number | null;
  leadership_solidarity?: number | null;
  collective_comments?: string | null;
  party_cell_comments?: string | null;
  special_case?: string | null;
  is_disciplined?: boolean | number | null;
  discipline_details?: string | null;
  is_special_quota_case?: boolean | number | null;
  special_quota_justification?: string | null;

  created_at?: string | Date;
  updated_at?: string | Date;

  // Joined/Computed fields used in client UI
  step?: EvaluationStep | string;
  employee_name?: string;
  employee_position?: string;
  employee_position_code?: string;
  employee_is_disciplined?: boolean | number | null;
  department_name?: string;
  manager_name?: string;
  approver_name?: string;
  classification?: string | null;
  items?: EvaluationItem[];
  details?: EvaluationItem[];
  appeal?: EvaluationAppeal | null;
}

export type Evaluation = MonthlyEvaluation;

export interface EvaluationItem {
  id?: number;
  evaluation_id?: number;
  product_catalog_id?: number | null;
  task_id?: number | null;
  quantity: number;
  self_points?: number;
  manager_points?: number;
  final_points?: number;
  remarks?: string | null;
  catalog_code?: string;
  catalog_name?: string;
  catalog_category?: string;
  catalog_complexity_group?: string;
  catalog_coefficient?: number;
  catalog_baseline_score?: number;
  task_title?: string;
  task_evidence?: string | null;
}

export type EvaluationDetail = EvaluationItem;

export interface EvaluationAppeal {
  id: number;
  evaluation_id: number;
  employee_id: number;
  reason: string;
  evidence_url?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  response_text?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  created_at: string;
  deadline_at: string;
  days_remaining?: number;
  is_overdue?: boolean;
  evaluation_month?: string;
  evaluation_final_score?: number;
  employee_name?: string;
  employee_position?: string;
  department_name?: string;
  resolver_name?: string;
}

export interface QuotaStats {
  month: string;
  total_approved: number;
  count_a: number;
  count_b: number;
  count_c: number;
  count_d: number;
  total_eligible: number;
  type_a_ratio_percent: number;
  max_allowed_quota_a: number;
  is_exceeding_quota: boolean;
  special_case_limit_percent: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  version: string;
}

