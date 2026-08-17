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
  contractor_selection_status?: string | null;
  contractor_selection_date?: string | Date | null;
  contract_no?: string | null;
  contract_value: number;
  contractor_name?: string | null;
  contract_signed_date?: string | Date | null;
  contract_start_date?: string | Date | null;
  contract_end_date?: string | Date | null;
  project_type?: string | null;
  location?: string | null;
  scale?: string | null;
  objective?: string | null;
  investor_name?: string | null;
  management_unit?: string | null;
  beneficiary_unit?: string | null;
  warranty_end_date?: string | Date | null;
  lifecycle_status: 'PREPARATION' | 'INVESTMENT_APPROVED' | 'PROCUREMENT' | 'CONTRACT_SIGNED' | 'CONSTRUCTION' | 'PARTIAL_ACCEPTANCE' | 'COMPLETION_ACCEPTANCE' | 'HANDOVER' | 'SETTLEMENT' | 'WARRANTY' | 'CLOSED' | 'ARCHIVED' | 'CANCELLED_DRAFT' | string;
  data_review_flag?: string | null;
  planned_start_date?: string | Date | null;
  actual_start_date?: string | Date | null;
  start_date?: string | Date | null;
  planned_end_date?: string | Date | null;
  actual_end_date?: string | Date | null;
  planned_progress_percent?: number | null;
  delay_days?: number | null;
  delay_reason?: string | null;
  recovery_deadline?: string | Date | null;
  acceptance_status: 'chua_nghiem_thu' | 'nghiem_thu_tung_phan' | 'nghiem_thu_hoan_thanh' | 'khong_dat' | string;
  acceptance_date?: string | Date | null;
  settlement_status: 'chua_quyet_toan' | 'dang_quyet_toan' | 'da_quyet_toan' | 'quyet_toan_xong' | string;
  settlement_value: number;
  settlement_date?: string | Date | null;
  handover_date?: string | Date | null;
  project_manager_id?: number | null;
  responsible_user_id?: number | null;
  supervisor_unit?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  version: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectObstacle {
  id: number;
  project_id: number;
  obstacle_type: 'LAND_CLEARANCE' | 'LEGAL_PROCEDURE' | 'WEATHER' | 'CONTRACTOR' | 'FUNDING' | 'DESIGN' | 'OTHER' | string;
  title: string;
  content?: string | null;
  root_cause?: string | null;
  resolution_measure?: string | null;
  responsible_user_id?: number | null;
  deadline?: string | Date | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | string;
  evidence_url?: string | null;
  created_by?: number | null;
  resolved_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectPaymentDisbursement {
  id: number;
  project_id: number;
  voucher_no: string;
  payment_date: string | Date;
  amount: number;
  funding_source: string;
  payment_type: 'ADVANCE' | 'VOLUME_PAYMENT' | 'SETTLEMENT' | 'OTHER' | string;
  completed_volume_amount?: number;
  treasury_control_status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  voucher_url?: string | null;
  justification_note?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectWorkflowStep {
  id: number;
  project_id: number;
  step_number: number;
  step_code: string;
  step_name: string;
  authority_body: string;
  signatory_type: 'COLLECTIVE' | 'INDIVIDUAL' | 'AUTHORIZED' | string;
  signatory_title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'COMPLETED' | string;
  checklist_data?: string | null;
  decision_number?: string | null;
  decision_date?: string | Date | null;
  started_date?: string | Date | null;
  completed_date?: string | Date | null;
  evidence_url?: string | null;
  notes?: string | null;
  is_blocked: boolean;
  block_reason?: string | null;
  legal_review_required: boolean;
  reviewed_by?: number | null;
  approved_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  workflow_step_id?: number | null;
  document_code?: string | null;
  document_name: string;
  document_type: string;
  issuing_authority?: string | null;
  issuing_date?: string | Date | null;
  file_url: string;
  file_size?: number;
  file_type?: string;
  version: number;
  is_mandatory: boolean;
  verification_status: 'pending' | 'verified' | 'rejected' | 'LEGAL_REVIEW_REQUIRED' | string;
  uploaded_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectFundingPlan {
  id: number;
  project_id: number;
  budget_year: number;
  funding_source: string;
  planned_amount: number;
  allocated_amount: number;
  adjusted_amount: number;
  cancelled_amount: number;
  decision_ref?: string | null;
  note?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectProcurementPackage {
  id: number;
  project_id: number;
  package_code: string;
  package_name: string;
  procurement_plan_ref?: string | null;
  bidding_method: string;
  package_estimate_value: number;
  winning_bid_value: number;
  contractor_name?: string | null;
  selection_date?: string | Date | null;
  status: 'planned' | 'bidding' | 'selected' | 'contracted' | 'cancelled' | string;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectContract {
  id: number;
  project_id: number;
  package_id?: number | null;
  contract_no: string;
  contract_name: string;
  contractor_name: string;
  signed_date?: string | Date | null;
  contract_value: number;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  performance_guarantee_value: number;
  performance_guarantee_expiry?: string | Date | null;
  advance_amount: number;
  status: 'draft' | 'active' | 'completed' | 'liquidated' | 'terminated' | string;
  note?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectAcceptanceRecord {
  id: number;
  project_id: number;
  acceptance_type: 'stage' | 'partial' | 'completion' | 'internal' | string;
  acceptance_date: string | Date;
  acceptance_value: number;
  conclusion: 'pass' | 'conditional_pass' | 'fail' | string;
  remediation_deadline?: string | Date | null;
  remediation_result?: string | null;
  signatories_list?: string | null;
  minutes_number?: string | null;
  evidence_url?: string | null;
  note?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectSettlementRecord {
  id: number;
  project_id: number;
  submission_date?: string | Date | null;
  appraising_body?: string | null;
  proposed_value: number;
  approved_value: number;
  difference_value: number;
  decision_number?: string | null;
  decision_date?: string | Date | null;
  asset_handover_status: string;
  bank_account_settled: boolean;
  note?: string | null;
  created_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProjectWorkItem {
  id: number;
  project_id: number;
  parent_id?: number | null;
  item_code: string;
  item_name: string;
  responsible_unit?: string | null;
  planned_start_date?: string | Date | null;
  planned_end_date?: string | Date | null;
  actual_start_date?: string | Date | null;
  actual_end_date?: string | Date | null;
  progress_percent: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | string;
  obstacle_note?: string | null;
  created_by?: number | null;
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
    project_workflow_steps: ProjectWorkflowStep;
    project_documents: ProjectDocument;
    project_funding_plans: ProjectFundingPlan;
    project_procurement_packages: ProjectProcurementPackage;
    project_contracts: ProjectContract;
    project_acceptance_records: ProjectAcceptanceRecord;
    project_settlement_records: ProjectSettlementRecord;
    project_work_items: ProjectWorkItem;
  }
}
