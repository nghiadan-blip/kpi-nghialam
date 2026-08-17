import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import {
  canReadProjectsList,
  canReadProjectDetail,
  canCreateProject,
  canUpdateProject,
  canDeleteProject,
  canUpdateApprovalAndContract,
  canUpdateAcceptanceAndSettlement,
  canManageMilestones
} from '../constants/projectConstants';
import { checkPeriodLockForRecord, checkPeriodLockForDate } from './evaluationController';

/**
 * 1. GET /api/projects - Lấy danh sách dự án với phân quyền và liên kết đầu tư công
 */
export async function getProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canReadProjectsList(user)) {
      res.status(403).json({ message: 'Bạn không có quyền xem danh sách dự án.' });
      return;
    }

    const {
      search,
      investment_group,
      acceptance_status,
      settlement_status,
      project_manager_id,
      page = 1,
      limit = 50
    } = req.query;

    let query = db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .leftJoin('users as pm', 'pr.project_manager_id', 'pm.id')
      .leftJoin('users as creator', 'pr.created_by', 'creator.id')
      .select(
        'pr.*',
        'pm.fullname as project_manager_name',
        'pm.position as project_manager_position',
        'creator.fullname as creator_name',
        'inv.project_code as inv_project_code',
        'inv.project_name as inv_project_name',
        'inv.investor_name as inv_investor_name',
        'inv.funding_source as inv_funding_source',
        'inv.planned_capital as inv_planned_capital',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.status as inv_status',
        'inv.contractor as inv_contractor',
        'inv.obstacle_type as inv_obstacle_type',
        'inv.obstacle_note as inv_obstacle_note'
      );

    // If regular employee not in Dept 3 and not Leadership/Admin, scope to assigned projects
    if (!['LEADERSHIP', 'ADMIN'].includes(user.role) && user.department_id !== 3) {
      query = query.where((builder) => {
        builder.where('pr.project_manager_id', user.id).orWhere('pr.created_by', user.id);
      });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('pr.project_code', 'like', `%${search}%`)
          .orWhere('pr.project_name', 'like', `%${search}%`)
          .orWhere('pr.contract_no', 'like', `%${search}%`)
          .orWhere('inv.contractor', 'like', `%${search}%`);
      });
    }

    if (investment_group) {
      query = query.where('pr.investment_group', String(investment_group));
    }

    if (acceptance_status) {
      query = query.where('pr.acceptance_status', String(acceptance_status));
    }

    if (settlement_status) {
      query = query.where('pr.settlement_status', String(settlement_status));
    }

    if (project_manager_id) {
      query = query.where('pr.project_manager_id', Number(project_manager_id));
    }

    const projects = await query
      .orderBy('pr.created_at', 'desc')
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    const totalCountRes: any = await db('projects').count('id as total').first();
    const total = totalCountRes ? Number(totalCountRes.total || totalCountRes['count(*)'] || projects.length) : projects.length;

    res.status(200).json({
      projects,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err: any) {
    console.error('Lỗi lấy danh sách dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách dự án.' });
  }
}

/**
 * 2. GET /api/projects/:id - Chi tiết dự án kèm Milestones và Dữ liệu Đầu tư công liên kết
 */
export async function getProjectById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .leftJoin('users as pm', 'pr.project_manager_id', 'pm.id')
      .leftJoin('users as creator', 'pr.created_by', 'creator.id')
      .select(
        'pr.*',
        'pm.fullname as project_manager_name',
        'pm.position as project_manager_position',
        'creator.fullname as creator_name',
        'inv.project_code as inv_project_code',
        'inv.project_name as inv_project_name',
        'inv.investor_name as inv_investor_name',
        'inv.funding_source as inv_funding_source',
        'inv.planned_capital as inv_planned_capital',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.status as inv_status',
        'inv.contractor as inv_contractor',
        'inv.obstacle_type as inv_obstacle_type',
        'inv.obstacle_note as inv_obstacle_note'
      )
      .where('pr.id', Number(id))
      .first();

    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canReadProjectDetail(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền xem chi tiết dự án này.' });
      return;
    }

    // Fetch milestones
    const milestones = await db('project_milestones')
      .where('project_id', Number(id))
      .orderBy('planned_date', 'asc');

    res.status(200).json({ project, milestones });
  } catch (err: any) {
    console.error('Lỗi lấy chi tiết dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết dự án.' });
  }
}

/**
 * 3. POST /api/projects - Tạo dự án mới (Có hỗ trợ tạo kèm liên kết Đầu tư công qua Transaction)
 */
export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canCreateProject(user)) {
      res.status(403).json({ message: 'Bạn không có quyền tạo dự án mới.' });
      return;
    }

    const {
      project_code,
      project_name,
      investment_group = 'C',
      approval_decision_no,
      approval_date,
      approving_authority,
      design_approval_no,
      bidding_method,
      contractor_selection_date,
      contract_no,
      contract_value = 0,
      start_date,
      planned_end_date,
      actual_end_date,
      acceptance_status = 'chua_nghiem_thu',
      acceptance_date,
      settlement_status = 'chua_quyet_toan',
      settlement_value = 0,
      settlement_date,
      handover_date,
      project_manager_id,
      supervisor_unit,
      investment_project_id,
      create_new_investment,
      investment_payload
    } = req.body;

    // Validation
    if (!project_code || !project_code.trim()) {
      res.status(400).json({ message: 'Mã dự án là bắt buộc.' });
      return;
    }
    if (!project_name || !project_name.trim()) {
      res.status(400).json({ message: 'Tên công trình/dự án là bắt buộc.' });
      return;
    }
    if (Number(contract_value) < 0) {
      res.status(400).json({ message: 'Giá trị hợp đồng không được âm.' });
      return;
    }
    if (Number(settlement_value) < 0) {
      res.status(400).json({ message: 'Giá trị quyết toán không được âm.' });
      return;
    }
    if (start_date && planned_end_date && new Date(start_date) > new Date(planned_end_date)) {
      res.status(400).json({ message: 'Ngày kết thúc dự kiến phải sau ngày khởi công.' });
      return;
    }
    if (start_date && acceptance_date && new Date(acceptance_date) < new Date(start_date)) {
      res.status(400).json({ message: 'Ngày nghiệm thu không được trước ngày khởi công.' });
      return;
    }
    if (acceptance_date && settlement_date && new Date(settlement_date) < new Date(acceptance_date)) {
      res.status(400).json({ message: 'Ngày quyết toán không được trước ngày nghiệm thu.' });
      return;
    }
    if (acceptance_date && handover_date && new Date(handover_date) < new Date(acceptance_date)) {
      res.status(400).json({ message: 'Ngày bàn giao không được trước ngày nghiệm thu.' });
      return;
    }

    const code = project_code.trim().toUpperCase();

    // Check project_code uniqueness
    const existingCode = await db('projects').where('project_code', code).first();
    if (existingCode) {
      res.status(400).json({ message: `Mã dự án "${code}" đã tồn tại trên hệ thống.` });
      return;
    }

    let linkedInvestmentId: number | null = investment_project_id ? Number(investment_project_id) : null;

    // Transaction execution
    let newProjectId: number = 0;
    await db.transaction(async (trx) => {
      // If user chooses to create linked investment project simultaneously
      if (create_new_investment && investment_payload) {
        const invPayload = {
          project_code: code,
          project_name: project_name.trim(),
          investor_name: investment_payload.investor_name || 'UBND xã Nghĩa Lâm',
          funding_source: investment_payload.funding_source || 'Ngân sách tỉnh/huyện',
          planned_capital: Number(investment_payload.planned_capital) || 0,
          allocated_capital: Number(investment_payload.allocated_capital) || 0,
          disbursed_amount: Number(investment_payload.disbursed_amount) || 0,
          disbursement_rate: Number(investment_payload.allocated_capital) > 0
            ? Number(((Number(investment_payload.disbursed_amount || 0) / Number(investment_payload.allocated_capital)) * 100).toFixed(2))
            : 0,
          contractor: investment_payload.contractor ? investment_payload.contractor.trim() : null,
          start_date: start_date || null,
          end_date: planned_end_date || null,
          actual_progress_percent: Number(investment_payload.actual_progress_percent) || 0,
          acceptance_value: Number(settlement_value) || 0,
          responsible_user_id: project_manager_id ? Number(project_manager_id) : user.id,
          status: 'preparing'
        };

        const [createdInvId] = await trx('public_investment_projects').insert(invPayload);
        linkedInvestmentId = createdInvId;
      } else if (linkedInvestmentId) {
        // Verify linked investment exists & is not linked to another project
        const inv = await trx('public_investment_projects').where('id', linkedInvestmentId).first();
        if (!inv) {
          throw new Error('Không tìm thấy công trình đầu tư công để liên kết.');
        }
        const alreadyLinked = await trx('projects').where('investment_project_id', linkedInvestmentId).first();
        if (alreadyLinked) {
          throw new Error(`Công trình đầu tư công #${linkedInvestmentId} đã được liên kết với dự án "${alreadyLinked.project_code}".`);
        }
      }

      const projectInsert = {
        investment_project_id: linkedInvestmentId,
        project_code: code,
        project_name: project_name.trim(),
        investment_group,
        approval_decision_no: approval_decision_no ? approval_decision_no.trim() : null,
        approval_date: approval_date || null,
        approving_authority: approving_authority ? approving_authority.trim() : null,
        design_approval_no: design_approval_no ? design_approval_no.trim() : null,
        bidding_method: bidding_method || 'Chỉ định thầu',
        contractor_selection_date: contractor_selection_date || null,
        contract_no: contract_no ? contract_no.trim() : null,
        contract_value: Number(contract_value) || 0,
        start_date: start_date || null,
        planned_end_date: planned_end_date || null,
        actual_end_date: actual_end_date || null,
        acceptance_status,
        acceptance_date: acceptance_date || null,
        settlement_status,
        settlement_value: Number(settlement_value) || 0,
        settlement_date: settlement_date || null,
        handover_date: handover_date || null,
        project_manager_id: project_manager_id ? Number(project_manager_id) : null,
        supervisor_unit: supervisor_unit ? supervisor_unit.trim() : null,
        created_by: user.id,
        updated_by: user.id,
        version: 1
      };

      const [pId] = await trx('projects').insert(projectInsert);
      newProjectId = pId;

      // Seed default standard milestones for project lifecycle
      const defaultMilestones = [
        { project_id: newProjectId, milestone_name: 'Phê duyệt chủ trương & dự án đầu tư', milestone_type: 'approval', planned_date: approval_date || new Date().toISOString().split('T')[0], status: approval_date ? 'completed' : 'pending', created_by: user.id },
        { project_id: newProjectId, milestone_name: 'Lựa chọn nhà thầu & ký hợp đồng', milestone_type: 'contract', planned_date: contractor_selection_date || start_date || new Date().toISOString().split('T')[0], status: contract_no ? 'completed' : 'pending', created_by: user.id },
        { project_id: newProjectId, milestone_name: 'Khởi công xây dựng công trình', milestone_type: 'construction_start', planned_date: start_date || new Date().toISOString().split('T')[0], status: start_date ? 'completed' : 'pending', created_by: user.id },
        { project_id: newProjectId, milestone_name: 'Nghiệm thu hoàn thành công trình', milestone_type: 'acceptance', planned_date: planned_end_date || new Date().toISOString().split('T')[0], status: acceptance_status === 'nghiem_thu_hoan_thanh' ? 'completed' : 'pending', created_by: user.id },
        { project_id: newProjectId, milestone_name: 'Quyết toán và bàn giao sử dụng', milestone_type: 'handover', planned_date: planned_end_date || new Date().toISOString().split('T')[0], status: settlement_status === 'quyet_toan_xong' ? 'completed' : 'pending', created_by: user.id }
      ];

      await trx('project_milestones').insert(defaultMilestones);
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_PROJECT',
      `Tạo dự án mới #${newProjectId} [${code}]: "${project_name.trim()}" (Liên kết ĐTC #${linkedInvestmentId || 'None'})`,
      clientIp
    );

    res.status(201).json({
      message: 'Tạo dự án đầu tư công thành công!',
      id: newProjectId,
      investment_project_id: linkedInvestmentId
    });
  } catch (err: any) {
    console.error('Lỗi tạo dự án:', err);
    res.status(err.message?.includes('tồn tại') || err.message?.includes('liên kết') ? 400 : 500).json({
      message: err.message || 'Lỗi máy chủ khi tạo dự án.'
    });
  }
}

/**
 * 4. PUT /api/projects/:id - Cập nhật thông tin vòng đời dự án (Có kiểm soát RBAC & Optimistic locking)
 */
export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canUpdateProject(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa dự án này.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('projects', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      project_code,
      project_name,
      investment_group,
      approval_decision_no,
      approval_date,
      approving_authority,
      design_approval_no,
      bidding_method,
      contractor_selection_date,
      contract_no,
      contract_value,
      start_date,
      planned_end_date,
      actual_end_date,
      acceptance_status,
      acceptance_date,
      settlement_status,
      settlement_value,
      settlement_date,
      handover_date,
      project_manager_id,
      supervisor_unit,
      expected_version
    } = req.body;

    // Check optimistic lock version if provided
    if (expected_version !== undefined && project.version !== Number(expected_version)) {
      res.status(409).json({
        message: 'Dữ liệu dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang và thử lại.'
      });
      return;
    }

    // RBAC: Check sensitive authority fields
    const isEditingApprovalOrContract =
      approval_decision_no !== undefined ||
      approval_date !== undefined ||
      approving_authority !== undefined ||
      contract_no !== undefined ||
      contract_value !== undefined;

    if (isEditingApprovalOrContract && !canUpdateApprovalAndContract(user)) {
      res.status(403).json({ message: 'Bạn không có thẩm quyền sửa đổi quyết định phê duyệt hoặc hợp đồng dự án.' });
      return;
    }

    const isEditingAcceptanceOrSettlement =
      acceptance_status !== undefined ||
      acceptance_date !== undefined ||
      settlement_status !== undefined ||
      settlement_value !== undefined ||
      settlement_date !== undefined ||
      handover_date !== undefined;

    if (isEditingAcceptanceOrSettlement && !canUpdateAcceptanceAndSettlement(user)) {
      res.status(403).json({ message: 'Bạn không có thẩm quyền sửa đổi kết quả nghiệm thu hoặc quyết toán dự án.' });
      return;
    }

    // Code change restriction check
    if (project_code && project_code.trim().toUpperCase() !== project.project_code) {
      // Check if project has disbursements or settlements
      if (project.investment_project_id) {
        const inv = await db('public_investment_projects').where('id', project.investment_project_id).first();
        if (inv && inv.disbursed_amount > 0) {
          res.status(400).json({ message: 'Không thể thay đổi mã dự án khi đã có số liệu giải ngân.' });
          return;
        }
      }
      if (project.acceptance_status === 'nghiem_thu_hoan_thanh' || project.settlement_status === 'da_quyet_toan') {
        res.status(400).json({ message: 'Không thể thay đổi mã dự án khi đã nghiệm thu hoặc quyết toán hoàn thành.' });
        return;
      }

      const existingCode = await db('projects')
        .where('project_code', project_code.trim().toUpperCase())
        .whereNot('id', Number(id))
        .first();
      if (existingCode) {
        res.status(400).json({ message: `Mã dự án "${project_code}" đã tồn tại.` });
        return;
      }
    }

    // Validation for numbers and dates
    if (contract_value !== undefined && Number(contract_value) < 0) {
      res.status(400).json({ message: 'Giá trị hợp đồng không được âm.' });
      return;
    }
    if (settlement_value !== undefined && Number(settlement_value) < 0) {
      res.status(400).json({ message: 'Giá trị quyết toán không được âm.' });
      return;
    }

    const finalStartDate = start_date !== undefined ? start_date : project.start_date;
    const finalPlannedEndDate = planned_end_date !== undefined ? planned_end_date : project.planned_end_date;
    const finalAcceptanceDate = acceptance_date !== undefined ? acceptance_date : project.acceptance_date;
    const finalSettlementDate = settlement_date !== undefined ? settlement_date : project.settlement_date;
    const finalHandoverDate = handover_date !== undefined ? handover_date : project.handover_date;

    if (finalStartDate && finalPlannedEndDate && new Date(finalStartDate) > new Date(finalPlannedEndDate)) {
      res.status(400).json({ message: 'Ngày kết thúc dự kiến phải sau ngày khởi công.' });
      return;
    }
    if (finalStartDate && finalAcceptanceDate && new Date(finalAcceptanceDate) < new Date(finalStartDate)) {
      res.status(400).json({ message: 'Ngày nghiệm thu không được trước ngày khởi công.' });
      return;
    }
    if (finalAcceptanceDate && finalSettlementDate && new Date(finalSettlementDate) < new Date(finalAcceptanceDate)) {
      res.status(400).json({ message: 'Ngày quyết toán không được trước ngày nghiệm thu.' });
      return;
    }
    if (finalAcceptanceDate && finalHandoverDate && new Date(finalHandoverDate) < new Date(finalAcceptanceDate)) {
      res.status(400).json({ message: 'Ngày bàn giao không được trước ngày nghiệm thu.' });
      return;
    }

    const updatePayload: any = {
      project_code: project_code !== undefined ? project_code.trim().toUpperCase() : project.project_code,
      project_name: project_name !== undefined ? project_name.trim() : project.project_name,
      investment_group: investment_group !== undefined ? investment_group : project.investment_group,
      approval_decision_no: approval_decision_no !== undefined ? (approval_decision_no ? approval_decision_no.trim() : null) : project.approval_decision_no,
      approval_date: approval_date !== undefined ? (approval_date || null) : project.approval_date,
      approving_authority: approving_authority !== undefined ? (approving_authority ? approving_authority.trim() : null) : project.approving_authority,
      design_approval_no: design_approval_no !== undefined ? (design_approval_no ? design_approval_no.trim() : null) : project.design_approval_no,
      bidding_method: bidding_method !== undefined ? bidding_method : project.bidding_method,
      contractor_selection_date: contractor_selection_date !== undefined ? (contractor_selection_date || null) : project.contractor_selection_date,
      contract_no: contract_no !== undefined ? (contract_no ? contract_no.trim() : null) : project.contract_no,
      contract_value: contract_value !== undefined ? Number(contract_value) : project.contract_value,
      start_date: start_date !== undefined ? (start_date || null) : project.start_date,
      planned_end_date: planned_end_date !== undefined ? (planned_end_date || null) : project.planned_end_date,
      actual_end_date: actual_end_date !== undefined ? (actual_end_date || null) : project.actual_end_date,
      acceptance_status: acceptance_status !== undefined ? acceptance_status : project.acceptance_status,
      acceptance_date: acceptance_date !== undefined ? (acceptance_date || null) : project.acceptance_date,
      settlement_status: settlement_status !== undefined ? settlement_status : project.settlement_status,
      settlement_value: settlement_value !== undefined ? Number(settlement_value) : project.settlement_value,
      settlement_date: settlement_date !== undefined ? (settlement_date || null) : project.settlement_date,
      handover_date: handover_date !== undefined ? (handover_date || null) : project.handover_date,
      project_manager_id: project_manager_id !== undefined ? (project_manager_id ? Number(project_manager_id) : null) : project.project_manager_id,
      supervisor_unit: supervisor_unit !== undefined ? (supervisor_unit ? supervisor_unit.trim() : null) : project.supervisor_unit,
      updated_by: user.id,
      version: project.version + 1,
      updated_at: new Date()
    };

    await db('projects').where('id', Number(id)).update(updatePayload);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_PROJECT',
      `Cập nhật thông tin dự án #${id} [${project.project_code}]: "${project.project_name}" (Phiên bản: ${project.version + 1})`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật dự án thành công!', version: project.version + 1 });
  } catch (err: any) {
    console.error('Lỗi cập nhật dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật dự án.' });
  }
}

/**
 * 5. DELETE /api/projects/:id - Xóa dự án (Bảo vệ ràng buộc giải ngân & nghiệm thu)
 */
export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canDeleteProject(user)) {
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND hoặc Quản trị viên mới được phép xóa dự án.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('projects', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    // Constraint Protection: Check if linked investment has disbursed money
    if (project.investment_project_id) {
      const inv = await db('public_investment_projects').where('id', project.investment_project_id).first();
      if (inv && inv.disbursed_amount > 0) {
        res.status(409).json({
          message: `Không thể xóa dự án "${project.project_code}" vì công trình đã phát sinh giải ngân (${inv.disbursed_amount.toLocaleString()}đ). Vui lòng cập nhật trạng thái hủy hoặc lưu trữ hồ sơ.`
        });
        return;
      }
    }

    // Constraint: Cannot delete accepted or settled projects
    if (project.acceptance_status === 'nghiem_thu_hoan_thanh' || project.settlement_status === 'da_quyet_toan' || project.settlement_value > 0) {
      res.status(409).json({
        message: `Không thể xóa dự án "${project.project_code}" vì công trình đã có hồ sơ nghiệm thu hoặc quyết toán hoàn thành.`
      });
      return;
    }

    await db.transaction(async (trx) => {
      // Milestones are deleted via CASCADE, delete project record
      await trx('projects').where('id', Number(id)).del();
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_PROJECT',
      `Xóa dự án #${id} [${project.project_code}]: "${project.project_name}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa dự án thành công!' });
  } catch (err: any) {
    console.error('Lỗi xóa dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa dự án.' });
  }
}

/**
 * 6. POST /api/projects/:id/link-investment - Liên kết dự án với công trình đầu tư công có sẵn
 */
export async function linkInvestmentProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    const { investment_project_id } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canUpdateProject(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật liên kết dự án này.' });
      return;
    }

    if (!investment_project_id) {
      res.status(400).json({ message: 'Vui lòng chọn công trình đầu tư công cần liên kết.' });
      return;
    }

    const inv = await db('public_investment_projects').where('id', Number(investment_project_id)).first();
    if (!inv) {
      res.status(404).json({ message: 'Không tìm thấy công trình đầu tư công tương ứng.' });
      return;
    }

    const alreadyLinked = await db('projects')
      .where('investment_project_id', Number(investment_project_id))
      .whereNot('id', Number(id))
      .first();

    if (alreadyLinked) {
      res.status(400).json({
        message: `Công trình đầu tư công #${investment_project_id} đã được liên kết với dự án "${alreadyLinked.project_code}".`
      });
      return;
    }

    await db('projects').where('id', Number(id)).update({
      investment_project_id: Number(investment_project_id),
      updated_by: user.id,
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'LINK_INVESTMENT_PROJECT',
      `Liên kết dự án #${id} [${project.project_code}] với công trình đầu tư công #${investment_project_id} [${inv.project_code}]`,
      clientIp
    );

    res.status(200).json({ message: 'Liên kết công trình đầu tư công thành công!' });
  } catch (err: any) {
    console.error('Lỗi liên kết đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi liên kết đầu tư công.' });
  }
}

/**
 * 7. POST /api/projects/:id/unlink-investment - Hủy liên kết đầu tư công
 */
export async function unlinkInvestmentProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canUpdateProject(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật dự án này.' });
      return;
    }

    if (!project.investment_project_id) {
      res.status(400).json({ message: 'Dự án hiện chưa liên kết với công trình đầu tư công nào.' });
      return;
    }

    const oldInvId = project.investment_project_id;
    await db('projects').where('id', Number(id)).update({
      investment_project_id: null,
      updated_by: user.id,
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UNLINK_INVESTMENT_PROJECT',
      `Hủy liên kết dự án #${id} [${project.project_code}] khỏi công trình đầu tư công #${oldInvId}`,
      clientIp
    );

    res.status(200).json({ message: 'Hủy liên kết đầu tư công thành công!' });
  } catch (err: any) {
    console.error('Lỗi hủy liên kết đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi hủy liên kết đầu tư công.' });
  }
}

/**
 * 8. GET /api/projects/dashboard - Thống kê Dashboard Quản lý dự án
 */
export async function getProjectDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const allProjects = await db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .select(
        'pr.*',
        'inv.planned_capital as inv_planned_capital',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.obstacle_type as inv_obstacle_type',
        'inv.status as inv_status'
      );

    // Grouping
    const byGroup = { A: 0, B: 0, C: 0, other: 0 };
    const byLifecycle = {
      preparing: 0,
      contracting: 0,
      executing: 0,
      acceptance_pending: 0,
      settling: 0,
      completed: 0
    };

    let totalPlannedCapital = 0;
    let totalAllocatedCapital = 0;
    let totalDisbursedAmount = 0;
    let totalContractValue = 0;
    let totalSettlementValue = 0;

    const obstaclesSummary: Record<string, number> = {
      gpmb: 0,
      procedure: 0,
      payment_document: 0,
      contractor: 0,
      weather: 0,
      funding: 0,
      other: 0,
      none: 0
    };

    const priorityProjects: any[] = [];

    const now = new Date();

    allProjects.forEach((p) => {
      // Group A/B/C
      if (p.investment_group === 'A') byGroup.A++;
      else if (p.investment_group === 'B') byGroup.B++;
      else if (p.investment_group === 'C') byGroup.C++;
      else byGroup.other++;

      // Lifecycle
      if (p.settlement_status === 'quyet_toan_xong' || p.acceptance_status === 'nghiem_thu_hoan_thanh') {
        byLifecycle.completed++;
      } else if (p.settlement_status === 'dang_quyet_toan' || p.settlement_status === 'da_quyet_toan') {
        byLifecycle.settling++;
      } else if (p.acceptance_status === 'nghiem_thu_tung_phan' || p.actual_end_date) {
        byLifecycle.acceptance_pending++;
      } else if (p.start_date || (p.inv_actual_progress_percent && p.inv_actual_progress_percent > 0)) {
        byLifecycle.executing++;
      } else if (p.contract_no) {
        byLifecycle.contracting++;
      } else {
        byLifecycle.preparing++;
      }

      // Financials directly from public_investment_projects
      totalPlannedCapital += Number(p.inv_planned_capital) || 0;
      totalAllocatedCapital += Number(p.inv_allocated_capital) || 0;
      totalDisbursedAmount += Number(p.inv_disbursed_amount) || 0;
      totalContractValue += Number(p.contract_value) || 0;
      totalSettlementValue += Number(p.settlement_value) || 0;

      // Obstacle
      const obst = p.inv_obstacle_type || 'none';
      if (obstaclesSummary[obst] !== undefined) obstaclesSummary[obst]++;
      else obstaclesSummary.other++;

      // Priority alert: low disbursement or approaching deadline with delay
      if (p.inv_obstacle_type && p.inv_obstacle_type !== 'none') {
        priorityProjects.push({
          id: p.id,
          project_code: p.project_code,
          project_name: p.project_name,
          reason: `Vướng mắc: ${p.inv_obstacle_type}`,
          disbursement_rate: p.inv_disbursement_rate || 0,
          progress: p.inv_actual_progress_percent || 0
        });
      } else if (p.planned_end_date && new Date(p.planned_end_date) < now && p.acceptance_status !== 'nghiem_thu_hoan_thanh') {
        priorityProjects.push({
          id: p.id,
          project_code: p.project_code,
          project_name: p.project_name,
          reason: 'Quá hạn hoàn thành nhưng chưa nghiệm thu',
          disbursement_rate: p.inv_disbursement_rate || 0,
          progress: p.inv_actual_progress_percent || 0
        });
      }
    });

    const averageDisbursementRate =
      totalAllocatedCapital > 0 ? Number(((totalDisbursedAmount / totalAllocatedCapital) * 100).toFixed(2)) : 0;

    res.status(200).json({
      total_projects: allProjects.length,
      by_group: byGroup,
      by_lifecycle: byLifecycle,
      financials: {
        total_planned_capital: totalPlannedCapital,
        total_allocated_capital: totalAllocatedCapital,
        total_disbursed_amount: totalDisbursedAmount,
        average_disbursement_rate: averageDisbursementRate,
        total_contract_value: totalContractValue,
        total_settlement_value: totalSettlementValue
      },
      obstacles_summary: obstaclesSummary,
      priority_projects: priorityProjects.slice(0, 10)
    });
  } catch (err: any) {
    console.error('Lỗi lấy thống kê dashboard dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê dashboard dự án.' });
  }
}

/**
 * 9. Milestone Handlers
 */
export async function addMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền thêm mốc tiến độ cho dự án này.' });
      return;
    }

    const { milestone_name, milestone_type = 'other', planned_date, actual_date, status = 'pending', note } = req.body;

    if (!milestone_name || !milestone_name.trim()) {
      res.status(400).json({ message: 'Tên mốc tiến độ là bắt buộc.' });
      return;
    }
    if (!planned_date) {
      res.status(400).json({ message: 'Ngày kế hoạch là bắt buộc.' });
      return;
    }

    const [milestoneId] = await db('project_milestones').insert({
      project_id: Number(id),
      milestone_name: milestone_name.trim(),
      milestone_type,
      planned_date,
      actual_date: actual_date || null,
      status,
      note: note ? note.trim() : null,
      created_by: user.id,
      updated_by: user.id
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_PROJECT_MILESTONE',
      `Thêm mốc tiến độ #${milestoneId} "${milestone_name}" cho dự án [${project.project_code}]`,
      clientIp
    );

    res.status(201).json({ message: 'Thêm mốc tiến độ thành công!', id: milestoneId });
  } catch (err: any) {
    console.error('Lỗi thêm mốc tiến độ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi thêm mốc tiến độ.' });
  }
}

export async function updateMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id, milestoneId } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa mốc tiến độ dự án này.' });
      return;
    }

    const milestone = await db('project_milestones')
      .where('id', Number(milestoneId))
      .where('project_id', Number(id))
      .first();

    if (!milestone) {
      res.status(404).json({ message: 'Không tìm thấy mốc tiến độ tương ứng.' });
      return;
    }

    const { milestone_name, milestone_type, planned_date, actual_date, status, note } = req.body;

    await db('project_milestones')
      .where('id', Number(milestoneId))
      .update({
        milestone_name: milestone_name !== undefined ? milestone_name.trim() : milestone.milestone_name,
        milestone_type: milestone_type !== undefined ? milestone_type : milestone.milestone_type,
        planned_date: planned_date !== undefined ? planned_date : milestone.planned_date,
        actual_date: actual_date !== undefined ? (actual_date || null) : milestone.actual_date,
        status: status !== undefined ? status : milestone.status,
        note: note !== undefined ? (note ? note.trim() : null) : milestone.note,
        updated_by: user.id,
        updated_at: new Date()
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_PROJECT_MILESTONE',
      `Cập nhật mốc tiến độ #${milestoneId} cho dự án [${project.project_code}]`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật mốc tiến độ thành công!' });
  } catch (err: any) {
    console.error('Lỗi sửa mốc tiến độ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật mốc tiến độ.' });
  }
}

export async function deleteMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id, milestoneId } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền xóa mốc tiến độ dự án này.' });
      return;
    }

    await db('project_milestones')
      .where('id', Number(milestoneId))
      .where('project_id', Number(id))
      .del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_PROJECT_MILESTONE',
      `Xóa mốc tiến độ #${milestoneId} của dự án [${project.project_code}]`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa mốc tiến độ thành công!' });
  } catch (err: any) {
    console.error('Lỗi xóa mốc tiến độ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa mốc tiến độ.' });
  }
}

/**
 * 10. GET /api/projects/export - Xuất báo cáo Excel Quản lý dự án
 */
export async function exportProjectsExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canReadProjectsList(user)) {
      res.status(403).json({ message: 'Bạn không có quyền xuất danh sách dự án.' });
      return;
    }

    const projects = await db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .leftJoin('users as pm', 'pr.project_manager_id', 'pm.id')
      .select(
        'pr.*',
        'pm.fullname as project_manager_name',
        'inv.planned_capital as inv_planned_capital',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.contractor as inv_contractor'
      )
      .orderBy('pr.id', 'asc');

    let rowsHtml = '';
    projects.forEach((p, idx) => {
      const acceptanceText =
        p.acceptance_status === 'nghiem_thu_hoan_thanh'
          ? 'Nghiệm thu hoàn thành'
          : p.acceptance_status === 'nghiem_thu_tung_phan'
          ? 'Nghiệm thu từng phần'
          : p.acceptance_status === 'khong_dat'
          ? 'Không đạt'
          : 'Chưa nghiệm thu';

      const settlementText =
        p.settlement_status === 'quyet_toan_xong'
          ? 'Quyết toán xong'
          : p.settlement_status === 'da_quyet_toan'
          ? 'Đã duyệt quyết toán'
          : p.settlement_status === 'dang_quyet_toan'
          ? 'Đang quyết toán'
          : 'Chưa quyết toán';

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${p.project_code}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${p.project_name}</td>
          <td style="text-align: center; border: 1px solid #999;">${p.investment_group}</td>
          <td style="border: 1px solid #999;">${p.approval_decision_no || '-'}</td>
          <td style="border: 1px solid #999;">${p.bidding_method || '-'}</td>
          <td style="border: 1px solid #999;">${p.contract_no || '-'}</td>
          <td style="text-align: right; border: 1px solid #999;">${(p.contract_value || 0).toLocaleString()}đ</td>
          <td style="text-align: right; border: 1px solid #999;">${(p.inv_allocated_capital || 0).toLocaleString()}đ</td>
          <td style="text-align: right; border: 1px solid #999;">${(p.inv_disbursed_amount || 0).toLocaleString()}đ</td>
          <td style="text-align: center; border: 1px solid #999; font-weight: bold;">${p.inv_disbursement_rate || 0}%</td>
          <td style="text-align: center; border: 1px solid #999;">${p.inv_actual_progress_percent || 0}%</td>
          <td style="border: 1px solid #999;">${acceptanceText}</td>
          <td style="border: 1px solid #999;">${settlementText}</td>
          <td style="border: 1px solid #999;">${p.project_manager_name || '-'}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Quan_Ly_Du_An</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="text-align: center; text-transform: uppercase;">UBND XÃ NGHĨA LÂM — BÁO CÁO TOÀN BỘ VÒNG ĐỜI DỰ ÁN ĐẦU TƯ CÔNG</h2>
          <p style="text-align: center; font-style: italic;">Thời điểm kết xuất: ${new Date().toLocaleString('vi-VN')}</p>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #0C3260; color: #ffffff; text-align: center;">
                <th style="border: 1px solid #999; padding: 8px;">STT</th>
                <th style="border: 1px solid #999; padding: 8px;">Mã DA</th>
                <th style="border: 1px solid #999; padding: 8px;">Tên công trình</th>
                <th style="border: 1px solid #999; padding: 8px;">Nhóm</th>
                <th style="border: 1px solid #999; padding: 8px;">QĐ phê duyệt</th>
                <th style="border: 1px solid #999; padding: 8px;">Hình thức thầu</th>
                <th style="border: 1px solid #999; padding: 8px;">Số HĐ</th>
                <th style="border: 1px solid #999; padding: 8px;">Giá trị HĐ</th>
                <th style="border: 1px solid #999; padding: 8px;">Vốn phân bổ</th>
                <th style="border: 1px solid #999; padding: 8px;">Đã giải ngân</th>
                <th style="border: 1px solid #999; padding: 8px;">% Giải ngân</th>
                <th style="border: 1px solid #999; padding: 8px;">% Tiến độ</th>
                <th style="border: 1px solid #999; padding: 8px;">Nghiệm thu</th>
                <th style="border: 1px solid #999; padding: 8px;">Quyết toán</th>
                <th style="border: 1px solid #999; padding: 8px;">Cán bộ phụ trách</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Bao_Cao_Vong_Doi_Du_An_${new Date().toISOString().slice(0, 10)}.xls`);
    res.send(excelTemplate);
  } catch (err: any) {
    console.error('Lỗi xuất Excel dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel dự án.' });
  }
}
