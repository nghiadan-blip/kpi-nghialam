/**
 * Constants & Configuration for Project Management Lifecycle Module
 * Based on Law on Public Investment & Decree 335 / Local Assignment regulations
 */

export const INVESTMENT_GROUPS = ['A', 'B', 'C', 'Chưa phân loại'] as const;
export type InvestmentGroup = typeof INVESTMENT_GROUPS[number];

export const BIDDING_METHODS = [
  'Đấu thầu rộng rãi',
  'Đấu thầu hạn chế',
  'Chỉ định thầu',
  'Chỉ định thầu rút gọn',
  'Chào hàng cạnh tranh',
  'Mua sắm trực tiếp',
  'Tự thực hiện',
  'Khác'
] as const;

export const ACCEPTANCE_STATUSES = [
  { value: 'chua_nghiem_thu', label: 'Chưa nghiệm thu' },
  { value: 'nghiem_thu_tung_phan', label: 'Nghiệm thu từng phần' },
  { value: 'nghiem_thu_hoan_thanh', label: 'Nghiệm thu hoàn thành' },
  { value: 'khong_dat', label: 'Không đạt yêu cầu' }
] as const;

export const SETTLEMENT_STATUSES = [
  { value: 'chua_quyet_toan', label: 'Chưa quyết toán' },
  { value: 'dang_quyet_toan', label: 'Đang lập hồ sơ quyết toán' },
  { value: 'da_quyet_toan', label: 'Đã phê duyệt quyết toán' },
  { value: 'quyet_toan_xong', label: 'Quyết toán xong' }
] as const;

export const MILESTONE_TYPES = [
  { value: 'approval', label: 'Phê duyệt chủ trương/dự án' },
  { value: 'bidding', label: 'Lựa chọn nhà thầu / Đấu thầu' },
  { value: 'contract', label: 'Ký kết hợp đồng thi công' },
  { value: 'construction_start', label: 'Khởi công xây dựng' },
  { value: 'foundation', label: 'Hoàn thành phần móng' },
  { value: 'structure', label: 'Hoàn thành phần thân/kết cấu' },
  { value: 'completion', label: 'Hoàn thành xây lắp' },
  { value: 'acceptance', label: 'Nghiệm thu công trình' },
  { value: 'settlement', label: 'Quyết toán dự án hoàn thành' },
  { value: 'handover', label: 'Bàn giao đưa vào sử dụng' },
  { value: 'other', label: 'Mốc tiến độ khác' }
] as const;

export const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Chưa thực hiện' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'delayed', label: 'Chậm tiến độ' },
  { value: 'cancelled', label: 'Hủy bỏ' }
] as const;

/**
 * RBAC Permission Checker functions
 */
export function canReadProjectsList(user: any): boolean {
  if (!user) return false;
  // Leadership and Admin see all
  if (['LEADERSHIP', 'ADMIN'].includes(user.role)) return true;
  // Department Head & Employees of Dept 3 (Địa chính - Xây dựng)
  if (user.department_id === 3) return true;
  // Employees of other departments who are assigned as project_manager
  return true; // We filter query by assignment for general employees
}

export function canReadProjectDetail(user: any, project: any): boolean {
  if (!user) return false;
  if (['LEADERSHIP', 'ADMIN'].includes(user.role)) return true;
  if (user.department_id === 3) return true;
  if (project && project.project_manager_id === user.id) return true;
  return false;
}

export function canCreateProject(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3) return true;
  return false;
}

export function canUpdateProject(user: any, project: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3 && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}

export function canDeleteProject(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP' || user.role === 'ADMIN') return true;
  return false;
}

export function canUpdateApprovalAndContract(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canUpdateAcceptanceAndSettlement(user: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  return false;
}

export function canManageMilestones(user: any, project: any): boolean {
  if (!user) return false;
  if (user.role === 'LEADERSHIP') return true;
  if (user.role === 'DEPARTMENT_HEAD' && user.department_id === 3) return true;
  if (user.role === 'EMPLOYEE' && user.department_id === 3 && (project.project_manager_id === user.id || project.created_by === user.id)) return true;
  return false;
}
