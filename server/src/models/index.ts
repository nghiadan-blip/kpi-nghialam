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
  assigned_quantity?: number | null;
  converted_assigned_quantity?: number | null;
  actual_completed_quantity?: number | null;
  actual_completed_date?: string | Date | null;
  delay_count?: number | null;
  rework_count?: number | null;
  related_land_case_id?: number | null;
  related_project_id?: number | null;
  related_revenue_id?: number | null;
  related_expenditure_id?: number | null;
  related_office_request_id?: number | null;
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
  old_value?: string | null;
  new_value?: string | null;
  reason?: string | null;
  created_at?: string | Date;
}


export interface BudgetRevenueItem {
  id: number;
  year: number;
  category: string;
  source_name: string;
  payer_or_unit?: string | null;
  planned_amount: number;
  collected_amount: number;
  remaining_amount: number;
  due_date?: string | Date | null;
  responsible_department_id?: number | null;
  responsible_user_id?: number | null;
  status: 'planned' | 'partial' | 'completed' | 'overdue' | 'cancelled' | string;
  note?: string | null;
  evidence_ref?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface BudgetExpenditureItem {
  id: number;
  year: number;
  category: string;
  expense_name: string;
  funding_source: string;
  estimated_amount: number;
  approved_amount: number;
  paid_amount: number;
  remaining_amount: number;
  request_user_id?: number | null;
  approve_user_id?: number | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected' | 'missing_document' | string;
  document_status: 'full' | 'missing_evidence' | 'pending_invoice' | string;
  payment_date?: string | Date | null;
  note?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface PublicInvestmentProject {
  id: number;
  project_code: string;
  project_name: string;
  investor_name: string;
  funding_source: string;
  planned_capital: number;
  allocated_capital: number;
  disbursed_amount: number;
  disbursement_rate: number;
  contractor?: string | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  actual_progress_percent: number;
  acceptance_value: number;
  payment_document_status?: string | null;
  obstacle_type: 'gpmb' | 'procedure' | 'payment_document' | 'contractor' | 'weather' | 'funding' | 'none' | 'other' | string;
  obstacle_note?: string | null;
  responsible_user_id?: number | null;
  status: 'preparing' | 'executing' | 'delayed' | 'completed' | 'settled' | string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface LandCertificateCase {
  id: number;
  case_code: string;
  citizen_name: string;
  village: string;
  land_plot_ref: string;
  case_group: 'Xanh' | 'Vàng' | 'Đỏ' | string;
  legal_basis_group: 'article_137' | 'article_138' | 'article_139' | 'article_140' | 'other' | string;
  current_step: string;
  status: 'received' | 'checking' | 'public_notice' | 'financial_obligation' | 'submitted' | 'issued' | 'returned' | 'delayed' | 'paused' | string;
  deadline?: string | Date | null;
  responsible_user_id?: number | null;
  responsible_department_id?: number | null;
  delay_reason?: string | null;
  evidence_ref?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface KH965Progress {
  id: number;
  village: string;
  total_plots: number;
  reviewed_plots: number;
  classified_plots: number;
  eligible_cases: number;
  need_supplement_cases: number;
  complex_cases: number;
  green_count: number;
  yellow_count: number;
  red_count: number;
  responsible_user_id?: number | null;
  report_date?: string | Date | null;
  note?: string | null;
}

export interface OfficeRequest {
  id: number;
  request_type: 'guest_reception' | 'travel_paper' | 'business_trip' | 'vehicle' | 'meeting_room' | 'stationery' | 'equipment' | 'conference_logistics' | 'other' | string;
  title: string;
  description?: string | null;
  request_user_id: number;
  responsible_user_id?: number | null;
  approve_user_id?: number | null;
  start_time?: string | Date | null;
  end_time?: string | Date | null;
  estimated_cost: number;
  approved_cost: number;
  funding_source?: string | null;
  document_ref?: string | null;
  settlement_status: 'pending' | 'submitting' | 'completed' | string;
  status: 'draft' | 'submitted' | 'approved' | 'in_progress' | 'completed' | 'settled' | 'rejected' | string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Project {
  id: number;
  investment_project_id?: number | null;
  project_code: string;
  project_name: string;
  investment_group: 'A' | 'B' | 'C' | 'Chưa phân loại' | string;
  approval_decision_no?: string | null;
  approval_date?: string | Date | null;
  approving_authority?: string | null;
  design_approval_no?: string | null;
  bidding_method?: string | null;
  contractor_selection_date?: string | Date | null;
  contract_no?: string | null;
  contract_value: number;
  start_date?: string | Date | null;
  planned_end_date?: string | Date | null;
  actual_end_date?: string | Date | null;
  acceptance_status: 'chua_nghiem_thu' | 'nghiem_thu_tung_phan' | 'nghiem_thu_hoan_thanh' | 'khong_dat' | string;
  acceptance_date?: string | Date | null;
  settlement_status: 'chua_quyet_toan' | 'dang_quyet_toan' | 'da_quyet_toan' | 'quyet_toan_xong' | string;
  settlement_value: number;
  settlement_date?: string | Date | null;
  handover_date?: string | Date | null;
  project_manager_id?: number | null;
  supervisor_unit?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  version: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  milestone_name: string;
  milestone_type: 'approval' | 'bidding' | 'contract' | 'construction_start' | 'foundation' | 'structure' | 'completion' | 'acceptance' | 'settlement' | 'handover' | 'other' | string;
  planned_date: string | Date;
  actual_date?: string | Date | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | string;
  note?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
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
    budget_revenue_items: BudgetRevenueItem;
    budget_expenditure_items: BudgetExpenditureItem;
    public_investment_projects: PublicInvestmentProject;
    land_certificate_cases: LandCertificateCase;
    kh965_progress: KH965Progress;
    office_requests: OfficeRequest;
    projects: Project;
    project_milestones: ProjectMilestone;
  }
}
