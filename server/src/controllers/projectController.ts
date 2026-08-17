import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import {
  WORKFLOW_16_STEPS,
  SIGNING_CHECKLIST_TEMPLATE,
  canReadProjectsList,
  canReadProjectDetail,
  canCreateProject,
  canUpdateProject,
  canDeleteProject,
  canUpdateApprovalAndContract,
  canUpdateAcceptanceAndSettlement,
  canManageWorkflowSteps,
  canApproveWorkflowStep,
  canManageDocuments,
  canManageMilestones
} from '../constants/projectConstants';
import * as xlsx from 'xlsx';

/**
 * Helper: Tự sinh mã dự án chuẩn hóa theo mẫu DA-YYYY-NN
 */
export async function generateProjectCode(year: number = new Date().getFullYear()): Promise<string> {
  const prefix = `DA-${year}-`;
  const existing = await db('projects')
    .where('project_code', 'like', `${prefix}%`)
    .orderBy('project_code', 'desc')
    .first();

  if (!existing) {
    return `${prefix}01`;
  }

  const numPart = existing.project_code.replace(prefix, '');
  const seq = parseInt(numPart, 10);
  if (isNaN(seq)) {
    return `${prefix}01`;
  }
  const nextSeq = String(seq + 1).padStart(2, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Helper: Khởi tạo 16 bước quy trình chuẩn cho dự án mới
 */
export async function initializeProjectWorkflowSteps(projectId: number, trx?: any): Promise<void> {
  const dbClient = trx || db;
  const stepsToInsert = WORKFLOW_16_STEPS.map((step) => ({
    project_id: projectId,
    step_number: step.step_number,
    step_code: step.step_code,
    step_name: step.step_name,
    authority_body: step.authority_body,
    signatory_type: step.signatory_type,
    signatory_title: step.signatory_title,
    status: step.step_number === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
    checklist_data: JSON.stringify(SIGNING_CHECKLIST_TEMPLATE),
    is_blocked: false,
    legal_review_required: false
  }));

  await dbClient('project_workflow_steps').insert(stepsToInsert);
}

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
      lifecycle_status,
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

    // Filter scope
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
          .orWhere('pr.contractor_name', 'like', `%${search}%`)
          .orWhere('inv.contractor', 'like', `%${search}%`);
      });
    }

    if (investment_group) {
      query = query.where('pr.investment_group', String(investment_group));
    }

    if (lifecycle_status) {
      query = query.where('pr.lifecycle_status', String(lifecycle_status));
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
 * 2. GET /api/projects/:id - Lấy chi tiết dự án, 16 bước quy trình, tài liệu và mốc tiến độ
 */
export async function getProjectById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { id } = req.params;
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
      res.status(404).json({ message: 'Không tìm thấy hồ sơ dự án.' });
      return;
    }

    if (!canReadProjectDetail(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền truy cập hồ sơ dự án này.' });
      return;
    }

    // Lấy 16 bước workflow
    let workflowSteps = await db('project_workflow_steps')
      .where('project_id', project.id)
      .orderBy('step_number', 'asc');

    // Nếu dự án cũ chưa có workflow steps thì tự động khởi tạo
    if (workflowSteps.length === 0) {
      await initializeProjectWorkflowSteps(project.id);
      workflowSteps = await db('project_workflow_steps')
        .where('project_id', project.id)
        .orderBy('step_number', 'asc');
    }

    // Lấy các bảng liên quan
    const [milestones, documents, fundingPlans, packages, contracts, acceptanceRecords, settlementRecords, workItems] = await Promise.all([
      db('project_milestones').where('project_id', project.id).orderBy('planned_date', 'asc'),
      db('project_documents').where('project_id', project.id).orderBy('created_at', 'desc'),
      db('project_funding_plans').where('project_id', project.id).orderBy('budget_year', 'asc'),
      db('project_procurement_packages').where('project_id', project.id).orderBy('created_at', 'desc'),
      db('project_contracts').where('project_id', project.id).orderBy('created_at', 'desc'),
      db('project_acceptance_records').where('project_id', project.id).orderBy('acceptance_date', 'desc'),
      db('project_settlement_records').where('project_id', project.id).orderBy('created_at', 'desc'),
      db('project_work_items').where('project_id', project.id).orderBy('item_code', 'asc')
    ]);

    res.status(200).json({
      project,
      workflow_steps: workflowSteps,
      milestones,
      documents,
      funding_plans: fundingPlans,
      packages,
      contracts,
      acceptance_records: acceptanceRecords,
      settlement_records: settlementRecords,
      work_items: workItems
    });
  } catch (err: any) {
    console.error('Lỗi lấy chi tiết dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết dự án.' });
  }
}

/**
 * 3. POST /api/projects - Tạo dự án mới (Hỗ trợ transaction an toàn và khởi tạo 16 bước)
 */
export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canCreateProject(user)) {
      res.status(403).json({ message: 'Bạn không có quyền tạo dự án đầu tư công.' });
      return;
    }

    let {
      project_code,
      project_name,
      investment_group = 'C',
      project_type,
      location,
      scale,
      objective,
      investor_name = 'UBND xã Nghĩa Lâm',
      management_unit = 'Ban Quản lý dự án xã Nghĩa Lâm',
      beneficiary_unit,
      approval_decision_no,
      approval_date,
      approving_authority = 'UBND xã Nghĩa Lâm',
      design_approval_no,
      bidding_method = 'Chỉ định thầu',
      contractor_name,
      contractor_selection_date,
      contract_no,
      contract_value = 0,
      start_date,
      planned_end_date,
      project_manager_id,
      supervisor_unit = 'Ban Giám sát đầu tư của cộng đồng xã',
      investment_project_id,
      create_new_investment = false,
      investment_payload = {}
    } = req.body;

    // Validation
    if (!project_name || !project_name.trim()) {
      res.status(400).json({ message: 'Tên công trình/dự án là bắt buộc.' });
      return;
    }

    if (!project_code || !project_code.trim() || project_code.trim() === 'DA') {
      project_code = await generateProjectCode();
    } else {
      project_code = project_code.trim().toUpperCase();
    }

    if (contract_value < 0) {
      res.status(400).json({ message: 'Giá trị hợp đồng không được âm.' });
      return;
    }

    if (start_date && planned_end_date && new Date(start_date) > new Date(planned_end_date)) {
      res.status(400).json({ message: 'Hạn hoàn thành kế hoạch phải sau ngày khởi công.' });
      return;
    }

    const result = await db.transaction(async (trx) => {
      // 1. Kiểm tra trùng mã dự án
      const existingCode = await trx('projects').where('project_code', project_code).first();
      if (existingCode) {
        throw new Error(`Mã dự án "${project_code}" đã tồn tại trên hệ thống.`);
      }

      let linkedInvId = investment_project_id ? Number(investment_project_id) : null;

      // 2. Nếu tạo mới đồng thời công trình đầu tư công
      if (create_new_investment) {
        const [newInvId] = await trx('public_investment_projects').insert({
          project_code: project_code,
          project_name: project_name,
          investor_name: investor_name || 'UBND xã Nghĩa Lâm',
          funding_source: investment_payload.funding_source || 'Ngân sách địa phương',
          planned_capital: Number(investment_payload.planned_capital || 0),
          allocated_capital: Number(investment_payload.allocated_capital || 0),
          disbursed_amount: Number(investment_payload.disbursed_amount || 0),
          disbursement_rate:
            Number(investment_payload.allocated_capital || 0) > 0
              ? Math.min(
                  100,
                  Math.round(
                    (Number(investment_payload.disbursed_amount || 0) /
                      Number(investment_payload.allocated_capital || 0)) *
                      10000
                  ) / 100
                )
              : 0.0,
          contractor: contractor_name || investment_payload.contractor || null,
          start_date: start_date || null,
          end_date: planned_end_date || null,
          actual_progress_percent: Number(investment_payload.actual_progress_percent || 0.0),
          acceptance_value: 0.0,
          payment_document_status: 'Chưa có hồ sơ',
          obstacle_type: 'none',
          responsible_user_id: project_manager_id ? Number(project_manager_id) : user.id,
          status: 'preparing'
        });
        linkedInvId = newInvId;
      } else if (linkedInvId) {
        // Kiểm tra xem công trình ĐTC đã được liên kết với dự án nào khác chưa (1:1 UNIQUE)
        const dupLink = await trx('projects').where('investment_project_id', linkedInvId).first();
        if (dupLink) {
          throw new Error(`Công trình đầu tư công #${linkedInvId} đã được liên kết với dự án "${dupLink.project_code}".`);
        }
      }

      // 3. Tạo bản ghi projects
      const [newProjectId] = await trx('projects').insert({
        investment_project_id: linkedInvId,
        project_code,
        project_name: project_name.trim(),
        investment_group,
        project_type,
        location,
        scale,
        objective,
        investor_name,
        management_unit,
        beneficiary_unit,
        approval_decision_no,
        approval_date: approval_date || null,
        approving_authority,
        design_approval_no,
        bidding_method,
        contractor_name,
        contractor_selection_date: contractor_selection_date || null,
        contract_no,
        contract_value: Number(contract_value || 0),
        start_date: start_date || null,
        planned_end_date: planned_end_date || null,
        acceptance_status: 'chua_nghiem_thu',
        settlement_status: 'chua_quyet_toan',
        settlement_value: 0.0,
        lifecycle_status: approval_decision_no ? 'INVESTMENT_APPROVED' : 'PREPARATION',
        project_manager_id: project_manager_id ? Number(project_manager_id) : user.id,
        supervisor_unit,
        created_by: user.id,
        updated_by: user.id,
        version: 1
      });

      // 4. Khởi tạo 16 bước quy trình kiểm soát cho dự án
      await initializeProjectWorkflowSteps(newProjectId, trx);

      return { newProjectId, linkedInvId };
    });

    await logAudit(
      user.id,
      'CREATE_PROJECT',
      `Tạo dự án mới mã [${project_code}] "${project_name}" (Linked Inv: ${result.linkedInvId || 'None'})`
    );

    res.status(201).json({
      message: 'Tạo hồ sơ dự án và khởi tạo 16 bước quy trình thành công!',
      id: result.newProjectId,
      investment_project_id: result.linkedInvId
    });
  } catch (err: any) {
    console.error('Lỗi tạo dự án:', err);
    res.status(400).json({ message: err.message || 'Lỗi khi tạo dự án.' });
  }
}

/**
 * 4. PUT /api/projects/:id - Cập nhật dự án với kiểm soát RBAC và Optimistic Locking
 */
export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { id } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ dự án.' });
      return;
    }

    if (!canUpdateProject(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa dự án này.' });
      return;
    }

    const {
      expected_version,
      project_name,
      investment_group,
      project_type,
      location,
      scale,
      objective,
      investor_name,
      management_unit,
      beneficiary_unit,
      approval_decision_no,
      approval_date,
      approving_authority,
      design_approval_no,
      bidding_method,
      contractor_name,
      contractor_selection_date,
      contract_no,
      contract_value,
      start_date,
      planned_end_date,
      actual_end_date,
      warranty_end_date,
      acceptance_status,
      acceptance_date,
      settlement_status,
      settlement_value,
      settlement_date,
      handover_date,
      lifecycle_status,
      project_manager_id,
      supervisor_unit,
      data_review_flag
    } = req.body;

    // Optimistic locking check
    if (expected_version !== undefined && project.version !== Number(expected_version)) {
      res.status(409).json({
        message: 'Dữ liệu dự án đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang để xem dữ liệu mới nhất.'
      });
      return;
    }

    // Permission checks on sensitive fields
    const isSensitiveApprovalChange =
      (approval_decision_no !== undefined && approval_decision_no !== project.approval_decision_no) ||
      (design_approval_no !== undefined && design_approval_no !== project.design_approval_no) ||
      (contract_no !== undefined && contract_no !== project.contract_no) ||
      (contract_value !== undefined && Number(contract_value) !== project.contract_value);

    if (isSensitiveApprovalChange && !canUpdateApprovalAndContract(user)) {
      res.status(403).json({
        message: 'Chỉ Lãnh đạo UBND xã hoặc Trưởng bộ phận Địa chính mới có quyền chỉnh sửa Quyết định phê duyệt hoặc Giá trị hợp đồng.'
      });
      return;
    }

    const isSensitiveAcceptanceChange =
      (acceptance_status !== undefined && acceptance_status !== project.acceptance_status) ||
      (settlement_status !== undefined && settlement_status !== project.settlement_status) ||
      (settlement_value !== undefined && Number(settlement_value) !== project.settlement_value);

    if (isSensitiveAcceptanceChange && !canUpdateAcceptanceAndSettlement(user)) {
      res.status(403).json({
        message: 'Chỉ Lãnh đạo UBND xã hoặc Trưởng bộ phận Địa chính mới có quyền cập nhật trạng thái Nghiệm thu & Quyết toán.'
      });
      return;
    }

    // Validation
    if (contract_value !== undefined && Number(contract_value) < 0) {
      res.status(400).json({ message: 'Giá trị hợp đồng không được âm.' });
      return;
    }
    if (settlement_value !== undefined && Number(settlement_value) < 0) {
      res.status(400).json({ message: 'Giá trị quyết toán không được âm.' });
      return;
    }

    const updatePayload: any = {
      updated_by: user.id,
      version: project.version + 1,
      updated_at: db.fn.now()
    };

    if (project_name !== undefined) updatePayload.project_name = project_name.trim();
    if (investment_group !== undefined) updatePayload.investment_group = investment_group;
    if (project_type !== undefined) updatePayload.project_type = project_type;
    if (location !== undefined) updatePayload.location = location;
    if (scale !== undefined) updatePayload.scale = scale;
    if (objective !== undefined) updatePayload.objective = objective;
    if (investor_name !== undefined) updatePayload.investor_name = investor_name;
    if (management_unit !== undefined) updatePayload.management_unit = management_unit;
    if (beneficiary_unit !== undefined) updatePayload.beneficiary_unit = beneficiary_unit;
    if (approval_decision_no !== undefined) updatePayload.approval_decision_no = approval_decision_no;
    if (approval_date !== undefined) updatePayload.approval_date = approval_date || null;
    if (approving_authority !== undefined) updatePayload.approving_authority = approving_authority;
    if (design_approval_no !== undefined) updatePayload.design_approval_no = design_approval_no;
    if (bidding_method !== undefined) updatePayload.bidding_method = bidding_method;
    if (contractor_name !== undefined) updatePayload.contractor_name = contractor_name;
    if (contractor_selection_date !== undefined) updatePayload.contractor_selection_date = contractor_selection_date || null;
    if (contract_no !== undefined) updatePayload.contract_no = contract_no;
    if (contract_value !== undefined) updatePayload.contract_value = Number(contract_value);
    if (start_date !== undefined) updatePayload.start_date = start_date || null;
    if (planned_end_date !== undefined) updatePayload.planned_end_date = planned_end_date || null;
    if (actual_end_date !== undefined) updatePayload.actual_end_date = actual_end_date || null;
    if (warranty_end_date !== undefined) updatePayload.warranty_end_date = warranty_end_date || null;
    if (acceptance_status !== undefined) updatePayload.acceptance_status = acceptance_status;
    if (acceptance_date !== undefined) updatePayload.acceptance_date = acceptance_date || null;
    if (settlement_status !== undefined) updatePayload.settlement_status = settlement_status;
    if (settlement_value !== undefined) updatePayload.settlement_value = Number(settlement_value);
    if (settlement_date !== undefined) updatePayload.settlement_date = settlement_date || null;
    if (handover_date !== undefined) updatePayload.handover_date = handover_date || null;
    if (lifecycle_status !== undefined) updatePayload.lifecycle_status = lifecycle_status;
    if (project_manager_id !== undefined) updatePayload.project_manager_id = project_manager_id ? Number(project_manager_id) : null;
    if (supervisor_unit !== undefined) updatePayload.supervisor_unit = supervisor_unit;
    if (data_review_flag !== undefined) updatePayload.data_review_flag = data_review_flag;

    await db('projects').where('id', project.id).update(updatePayload);

    await logAudit(
      user.id,
      'UPDATE_PROJECT',
      `Cập nhật thông tin dự án [${project.project_code}] (v${project.version} -> v${updatePayload.version})`
    );

    res.status(200).json({
      message: 'Cập nhật thông tin dự án thành công!',
      version: updatePayload.version
    });
  } catch (err: any) {
    console.error('Lỗi cập nhật dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật dự án.' });
  }
}

/**
 * 5. DELETE /api/projects/:id - Xóa dự án (Bảo vệ dữ liệu toàn vẹn: HTTP 409 khi đã có vốn/hợp đồng/hồ sơ)
 */
export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canDeleteProject(user)) {
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã hoặc Quản trị viên mới có quyền xóa dự án.' });
      return;
    }

    const { id } = req.params;
    const action = (req.body && req.body.action) || (req.query && req.query.action) || 'delete';

    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ dự án.' });
      return;
    }

    // 1. Nếu yêu cầu Lưu trữ (Archive)
    if (action === 'archive') {
      await db('projects').where('id', project.id).update({
        lifecycle_status: 'ARCHIVED',
        updated_by: user.id,
        updated_at: db.fn.now()
      });
      await logAudit(user.id, 'ARCHIVE_PROJECT', `Chuyển dự án [${project.project_code}] sang trạng thái lưu trữ`);
      res.status(200).json({ message: 'Đã chuyển hồ sơ dự án sang trạng thái Lưu trữ thành công.' });
      return;
    }

    // 2. Kiểm tra ràng buộc bảo vệ không cho xóa dự án đã phát sinh nghiệp vụ
    if (project.investment_project_id) {
      const inv = await db('public_investment_projects').where('id', project.investment_project_id).first();
      if (inv && Number(inv.disbursed_amount) > 0) {
        res.status(409).json({
          message: `Không thể xóa dự án [${project.project_code}] vì công trình đã phát sinh giải ngân thực tế (${Number(inv.disbursed_amount).toLocaleString()} VNĐ). Vui lòng chuyển sang trạng thái "Lưu trữ" thay vì xóa.`
        });
        return;
      }
    }

    if (project.acceptance_status === 'nghiem_thu_hoan_thanh' || project.settlement_status === 'quyet_toan_xong') {
      res.status(409).json({
        message: `Không thể xóa dự án đã nghiệm thu hoàn thành hoặc quyết toán. Vui lòng chuyển sang trạng thái "Lưu trữ".`
      });
      return;
    }

    const docCount = await db('project_documents').where('project_id', project.id).count('id as total').first();
    const hasDocs = Number((docCount as any)?.total || 0) > 0;
    if (hasDocs && action !== 'force_delete') {
      res.status(409).json({
        message: `Dự án [${project.project_code}] đã có hồ sơ tài liệu đính kèm. Không thể xóa vĩnh viễn.`
      });
      return;
    }

    // Thực hiện xóa an toàn
    await db('projects').where('id', project.id).del();

    await logAudit(
      user.id,
      'DELETE_PROJECT',
      `Xóa vĩnh viễn dự án nháp mã [${project.project_code}] "${project.project_name}"`
    );

    res.status(200).json({ message: `Đã xóa thành công dự án [${project.project_code}].` });
  } catch (err: any) {
    console.error('Lỗi xóa dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa dự án.' });
  }
}

/**
 * 6. POST /api/projects/:id/workflow/:stepNumber - Cập nhật tiến độ bước quy trình
 */
export async function updateWorkflowStep(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canManageWorkflowSteps(user)) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật quy trình dự án.' });
      return;
    }

    const { id, stepNumber } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    const step = await db('project_workflow_steps')
      .where({ project_id: project.id, step_number: Number(stepNumber) })
      .first();

    if (!step) {
      res.status(404).json({ message: 'Không tìm thấy bước quy trình này.' });
      return;
    }

    const {
      status,
      checklist_data,
      decision_number,
      decision_date,
      evidence_url,
      notes,
      legal_review_required
    } = req.body;

    const updatePayload: any = {
      updated_at: db.fn.now()
    };

    if (status !== undefined) updatePayload.status = status;
    if (checklist_data !== undefined) updatePayload.checklist_data = typeof checklist_data === 'string' ? checklist_data : JSON.stringify(checklist_data);
    if (decision_number !== undefined) updatePayload.decision_number = decision_number;
    if (decision_date !== undefined) updatePayload.decision_date = decision_date || null;
    if (evidence_url !== undefined) updatePayload.evidence_url = evidence_url;
    if (notes !== undefined) updatePayload.notes = notes;
    if (legal_review_required !== undefined) updatePayload.legal_review_required = Boolean(legal_review_required);

    if (status === 'IN_PROGRESS' && !step.started_date) {
      updatePayload.started_date = new Date().toISOString().slice(0, 10);
    }
    if (status === 'COMPLETED' || status === 'APPROVED') {
      updatePayload.completed_date = new Date().toISOString().slice(0, 10);
      updatePayload.reviewed_by = user.id;
    }

    await db('project_workflow_steps').where('id', step.id).update(updatePayload);

    await logAudit(
      user.id,
      'UPDATE_WORKFLOW_STEP',
      `Cập nhật Bước ${step.step_number} [${step.step_name}] dự án ${project.project_code} -> Trạng thái: ${status || step.status}`
    );

    res.status(200).json({ message: 'Cập nhật bước quy trình thành công!' });
  } catch (err: any) {
    console.error('Lỗi cập nhật bước quy trình:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bước quy trình.' });
  }
}

/**
 * 7. POST /api/projects/:id/workflow/:stepNumber/approve - Phê duyệt bước quy trình có kiểm tra Gate Conditions
 */
export async function approveWorkflowStep(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canApproveWorkflowStep(user)) {
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã hoặc Trưởng bộ phận Địa chính mới có thẩm quyền phê duyệt bước quy trình.' });
      return;
    }

    const { id, stepNumber } = req.params;
    const num = Number(stepNumber);
    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    const step = await db('project_workflow_steps')
      .where({ project_id: project.id, step_number: num })
      .first();

    if (!step) {
      res.status(404).json({ message: 'Không tìm thấy bước quy trình.' });
      return;
    }

    // --- GATE CONDITIONS VALIDATION ---
    // Gate 1: Bước 1 cần Nghị quyết HĐND
    if (num === 1) {
      const hasResolution = await db('project_documents')
        .where({ project_id: project.id, document_type: 'resolution' })
        .first();
      if (!hasResolution && !req.body.bypass_gate) {
        res.status(400).json({
          message: 'Khóa điều kiện: Bắt buộc phải đính kèm Nghị quyết kế hoạch ĐTC của HĐND xã trước khi hoàn thành Bước 1.'
        });
        return;
      }
    }

    // Gate 9: Phê duyệt BCKTKT (Quyết định đầu tư)
    if (num === 9) {
      if (!req.body.decision_number && !step.decision_number) {
        res.status(400).json({
          message: 'Khóa điều kiện: Bắt buộc nhập Số Quyết định phê duyệt BCKTKT của Chủ tịch UBND xã.'
        });
        return;
      }
    }

    // Gate 11: Lựa chọn nhà thầu & ký hợp đồng
    if (num === 11) {
      if (!project.contract_no && !req.body.contract_no) {
        res.status(400).json({
          message: 'Khóa điều kiện: Bắt buộc có Số Hợp đồng xây lắp hợp lệ trước khi hoàn thành lựa chọn nhà thầu.'
        });
        return;
      }
    }

    // Gate 14: Nghiệm thu hoàn thành
    if (num === 14) {
      const hasMinutes = await db('project_acceptance_records')
        .where({ project_id: project.id, acceptance_type: 'completion', conclusion: 'pass' })
        .first();
      if (!hasMinutes && !req.body.bypass_gate) {
        res.status(400).json({
          message: 'Khóa điều kiện: Bắt buộc có Biên bản nghiệm thu hoàn thành đạt yêu cầu trước khi phê duyệt bàn giao.'
        });
        return;
      }
    }

    // Cập nhật trạng thái bước hiện tại sang COMPLETED
    await db('project_workflow_steps')
      .where('id', step.id)
      .update({
        status: 'COMPLETED',
        completed_date: new Date().toISOString().slice(0, 10),
        approved_by: user.id,
        updated_at: db.fn.now()
      });

    // Tự động kích hoạt bước tiếp theo (nếu có)
    if (num < 16) {
      await db('project_workflow_steps')
        .where({ project_id: project.id, step_number: num + 1 })
        .where('status', 'NOT_STARTED')
        .update({
          status: 'IN_PROGRESS',
          started_date: new Date().toISOString().slice(0, 10),
          updated_at: db.fn.now()
        });
    }

    // Đồng bộ trạng thái vòng đời tổng quan của dự án
    let nextLifecycleStatus = project.lifecycle_status;
    if (num === 3) nextLifecycleStatus = 'INVESTMENT_APPROVED';
    if (num === 10) nextLifecycleStatus = 'PROCUREMENT';
    if (num === 11) nextLifecycleStatus = 'CONTRACT_SIGNED';
    if (num === 13) nextLifecycleStatus = 'CONSTRUCTION';
    if (num === 14) nextLifecycleStatus = 'HANDOVER';
    if (num === 15) nextLifecycleStatus = 'SETTLEMENT';
    if (num === 16) nextLifecycleStatus = 'CLOSED';

    if (nextLifecycleStatus !== project.lifecycle_status) {
      await db('projects').where('id', project.id).update({
        lifecycle_status: nextLifecycleStatus,
        updated_at: db.fn.now()
      });
    }

    await logAudit(
      user.id,
      'APPROVE_WORKFLOW_STEP',
      `Phê duyệt hoàn thành Bước ${num} [${step.step_name}] dự án ${project.project_code}`
    );

    res.status(200).json({
      message: `Đã phê duyệt hoàn thành Bước ${num} thành công!`,
      next_lifecycle_status: nextLifecycleStatus
    });
  } catch (err: any) {
    console.error('Lỗi phê duyệt bước quy trình:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi phê duyệt bước quy trình.' });
  }
}

/**
 * 8. GET /api/projects/:id/documents - Lấy danh sách hồ sơ điện tử
 */
export async function getProjectDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const documents = await db('project_documents as doc')
      .leftJoin('users as u', 'doc.uploaded_by', 'u.id')
      .select('doc.*', 'u.fullname as uploader_name')
      .where('doc.project_id', Number(id))
      .orderBy('doc.created_at', 'desc');

    res.status(200).json({ documents });
  } catch (err: any) {
    console.error('Lỗi lấy tài liệu dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy tài liệu.' });
  }
}

/**
 * 9. POST /api/projects/:id/documents - Đính kèm tài liệu điện tử
 */
export async function addProjectDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { id } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    if (!canManageDocuments(user, project)) {
      res.status(403).json({ message: 'Bạn không có quyền thêm tài liệu cho dự án này.' });
      return;
    }

    const {
      workflow_step_id,
      document_code,
      document_name,
      document_type = 'other',
      issuing_authority,
      issuing_date,
      file_url,
      file_size = 0,
      file_type = 'application/pdf',
      is_mandatory = false,
      verification_status = 'verified'
    } = req.body;

    if (!document_name || !file_url) {
      res.status(400).json({ message: 'Tên tài liệu và đường dẫn tệp tin là bắt buộc.' });
      return;
    }

    const [docId] = await db('project_documents').insert({
      project_id: project.id,
      workflow_step_id: workflow_step_id ? Number(workflow_step_id) : null,
      document_code,
      document_name: document_name.trim(),
      document_type,
      issuing_authority,
      issuing_date: issuing_date || null,
      file_url,
      file_size: Number(file_size),
      file_type,
      version: 1,
      is_mandatory: Boolean(is_mandatory),
      verification_status,
      uploaded_by: user.id
    });

    await logAudit(
      user.id,
      'ADD_PROJECT_DOCUMENT',
      `Đính kèm tài liệu [${document_type}] "${document_name}" cho dự án ${project.project_code}`
    );

    res.status(201).json({ message: 'Đính kèm hồ sơ tài liệu thành công!', id: docId });
  } catch (err: any) {
    console.error('Lỗi thêm tài liệu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi thêm tài liệu.' });
  }
}

/**
 * 10. DELETE /api/projects/:id/documents/:docId - Xóa tài liệu điện tử
 */
export async function deleteProjectDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { id, docId } = req.params;
    const doc = await db('project_documents').where({ id: Number(docId), project_id: Number(id) }).first();
    if (!doc) {
      res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
      return;
    }

    if (user.role !== 'LEADERSHIP' && user.role !== 'ADMIN' && doc.uploaded_by !== user.id) {
      res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu do người khác tải lên.' });
      return;
    }

    await db('project_documents').where('id', doc.id).del();

    await logAudit(user.id, 'DELETE_PROJECT_DOCUMENT', `Xóa tài liệu "${doc.document_name}"`);

    res.status(200).json({ message: 'Đã xóa tài liệu thành công!' });
  } catch (err: any) {
    console.error('Lỗi xóa tài liệu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa tài liệu.' });
  }
}

/**
 * 11. GET /api/projects/dashboard - Dashboard tổng hợp chỉ số điều hành & Cảnh báo chênh lệch (Progress Gaps)
 */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const projects = await db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .select(
        'pr.id',
        'pr.project_code',
        'pr.project_name',
        'pr.investment_group',
        'pr.lifecycle_status',
        'pr.acceptance_status',
        'pr.settlement_status',
        'pr.contract_value',
        'pr.settlement_value',
        'inv.planned_capital as inv_planned_capital',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.obstacle_type as inv_obstacle_type'
      );

    const stats = {
      total_projects: projects.length,
      by_group: { A: 0, B: 0, C: 0, other: 0 },
      by_lifecycle: {
        preparing: 0,
        investment_approved: 0,
        procurement: 0,
        contracting: 0,
        executing: 0,
        acceptance_pending: 0,
        settling: 0,
        warranty: 0,
        completed: 0,
        archived: 0
      },
      financials: {
        total_planned_capital: 0,
        total_allocated_capital: 0,
        total_disbursed_amount: 0,
        average_disbursement_rate: 0,
        total_contract_value: 0,
        total_settlement_value: 0
      },
      obstacles_summary: {} as Record<string, number>,
      progress_gaps: [] as any[],
      priority_projects: [] as any[]
    };

    let totalDisbRate = 0;
    let countWithRate = 0;

    for (const p of projects) {
      // Nhóm
      if (p.investment_group === 'A') stats.by_group.A++;
      else if (p.investment_group === 'B') stats.by_group.B++;
      else if (p.investment_group === 'C') stats.by_group.C++;
      else stats.by_group.other++;

      // Vòng đời
      switch (p.lifecycle_status) {
        case 'PREPARATION': stats.by_lifecycle.preparing++; break;
        case 'INVESTMENT_APPROVED': stats.by_lifecycle.investment_approved++; break;
        case 'PROCUREMENT': stats.by_lifecycle.procurement++; break;
        case 'CONTRACT_SIGNED': stats.by_lifecycle.contracting++; break;
        case 'CONSTRUCTION': stats.by_lifecycle.executing++; break;
        case 'PARTIAL_ACCEPTANCE':
        case 'COMPLETION_ACCEPTANCE': stats.by_lifecycle.acceptance_pending++; break;
        case 'SETTLEMENT': stats.by_lifecycle.settling++; break;
        case 'WARRANTY': stats.by_lifecycle.warranty++; break;
        case 'CLOSED': stats.by_lifecycle.completed++; break;
        case 'ARCHIVED': stats.by_lifecycle.archived++; break;
        default: stats.by_lifecycle.executing++; break;
      }

      // Tài chính
      stats.financials.total_planned_capital += Number(p.inv_planned_capital || 0);
      stats.financials.total_allocated_capital += Number(p.inv_allocated_capital || 0);
      stats.financials.total_disbursed_amount += Number(p.inv_disbursed_amount || 0);
      stats.financials.total_contract_value += Number(p.contract_value || 0);
      stats.financials.total_settlement_value += Number(p.settlement_value || 0);

      if (p.inv_disbursement_rate !== null && p.inv_disbursement_rate !== undefined) {
        totalDisbRate += Number(p.inv_disbursement_rate);
        countWithRate++;
      }

      // Vướng mắc
      if (p.inv_obstacle_type && p.inv_obstacle_type !== 'none') {
        stats.obstacles_summary[p.inv_obstacle_type] = (stats.obstacles_summary[p.inv_obstacle_type] || 0) + 1;
      }

      // Cảnh báo chênh lệch (Progress Gaps: Giải ngân > Tiến độ hoặc Tiến độ 100% chưa nghiệm thu)
      const disbRate = Number(p.inv_disbursement_rate || 0);
      const progPercent = Number(p.inv_actual_progress_percent || 0);
      const gap = Math.round((disbRate - progPercent) * 100) / 100;

      if (gap > 15) {
        stats.progress_gaps.push({
          id: p.id,
          project_code: p.project_code,
          project_name: p.project_name,
          disbursement_rate: disbRate,
          progress_percent: progPercent,
          gap,
          alert_level: gap > 30 ? 'danger' : 'warning',
          reason: `Tỷ lệ giải ngân (${disbRate}%) cao hơn tiến độ hiện trường (${progPercent}%) ${gap}%`
        });
      } else if (progPercent >= 100 && p.acceptance_status === 'chua_nghiem_thu') {
        stats.progress_gaps.push({
          id: p.id,
          project_code: p.project_code,
          project_name: p.project_name,
          disbursement_rate: disbRate,
          progress_percent: progPercent,
          gap: 0,
          alert_level: 'warning',
          reason: 'Công trình đã đạt 100% tiến độ thi công nhưng chưa lập biên bản nghiệm thu hoàn thành.'
        });
      }
    }

    stats.financials.average_disbursement_rate =
      countWithRate > 0 ? Math.round((totalDisbRate / countWithRate) * 100) / 100 : 0;

    res.status(200).json(stats);
  } catch (err: any) {
    console.error('Lỗi dashboard dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu dashboard dự án.' });
  }
}

/**
 * 12. GET /api/projects/export - Xuất báo cáo Excel dự án theo mẫu hành chính xã Nghĩa Lâm
 */
export async function exportExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await db('projects as pr')
      .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
      .leftJoin('users as pm', 'pr.project_manager_id', 'pm.id')
      .select(
        'pr.*',
        'pm.fullname as project_manager_name',
        'inv.funding_source as inv_funding_source',
        'inv.allocated_capital as inv_allocated_capital',
        'inv.disbursed_amount as inv_disbursed_amount',
        'inv.disbursement_rate as inv_disbursement_rate',
        'inv.actual_progress_percent as inv_actual_progress_percent',
        'inv.contractor as inv_contractor'
      )
      .orderBy('pr.id', 'asc');

    const rows = projects.map((p, idx) => ({
      'STT': idx + 1,
      'Mã Dự Án': p.project_code,
      'Tên Công Trình / Dự Án': p.project_name,
      'Nhóm DA': p.investment_group,
      'Chủ Đầu Tư': p.investor_name || 'UBND xã Nghĩa Lâm',
      'Số QĐ Phê Duyệt': p.approval_decision_no || '-',
      'Ngày Phê Duyệt': p.approval_date ? new Date(p.approval_date).toLocaleDateString('vi-VN') : '-',
      'Nhà Thầu Thi Công': p.contractor_name || p.inv_contractor || '-',
      'Số Hợp Đồng': p.contract_no || '-',
      'Giá Trị Hợp Đồng (đ)': p.contract_value || 0,
      'Vốn Phân Bổ (đ)': p.inv_allocated_capital || 0,
      'Đã Giải Ngân (đ)': p.inv_disbursed_amount || 0,
      'Tỷ Lệ Giải Ngân (%)': p.inv_disbursement_rate || 0,
      'Tiến Độ Thi Công (%)': p.inv_actual_progress_percent || 0,
      'Trạng Thái Nghiệm Thu': p.acceptance_status,
      'Trạng Thái Quyết Toán': p.settlement_status,
      'Giá Trị Quyết Toán (đ)': p.settlement_value || 0,
      'Cán Bộ Phụ Trách': p.project_manager_name || '-'
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'DanhMucDuAn');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=Bao_Cao_Du_An_DTC_Nghia_Lam_${new Date().getFullYear()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err: any) {
    console.error('Lỗi xuất Excel dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}

/**
 * 13. Milestones CRUD (Hỗ trợ quản lý mốc chi tiết)
 */
export async function addMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực.' });
      return;
    }
    const { id } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project || !canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Không có quyền thêm mốc tiến độ.' });
      return;
    }
    const { milestone_name, milestone_type = 'other', planned_date, status = 'pending', note } = req.body;
    if (!milestone_name || !planned_date) {
      res.status(400).json({ message: 'Tên mốc và ngày kế hoạch là bắt buộc.' });
      return;
    }
    const [mId] = await db('project_milestones').insert({
      project_id: project.id,
      milestone_name: milestone_name.trim(),
      milestone_type,
      planned_date,
      status,
      note,
      created_by: user.id
    });
    res.status(201).json({ message: 'Thêm mốc tiến độ thành công!', id: mId });
  } catch (err: any) {
    res.status(500).json({ message: 'Lỗi thêm mốc tiến độ.' });
  }
}

export async function updateMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực.' });
      return;
    }
    const { id, milestoneId } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project || !canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Không có quyền cập nhật mốc tiến độ.' });
      return;
    }
    const { milestone_name, milestone_type, planned_date, actual_date, status, note } = req.body;
    await db('project_milestones').where({ id: Number(milestoneId), project_id: project.id }).update({
      milestone_name,
      milestone_type,
      planned_date,
      actual_date: actual_date || null,
      status,
      note,
      updated_by: user.id,
      updated_at: db.fn.now()
    });
    res.status(200).json({ message: 'Cập nhật mốc tiến độ thành công!' });
  } catch (err: any) {
    res.status(500).json({ message: 'Lỗi cập nhật mốc tiến độ.' });
  }
}

export async function deleteMilestone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực.' });
      return;
    }
    const { id, milestoneId } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project || !canManageMilestones(user, project)) {
      res.status(403).json({ message: 'Không có quyền xóa mốc tiến độ.' });
      return;
    }
    await db('project_milestones').where({ id: Number(milestoneId), project_id: project.id }).del();
    res.status(200).json({ message: 'Xóa mốc tiến độ thành công!' });
  } catch (err: any) {
    res.status(500).json({ message: 'Lỗi xóa mốc tiến độ.' });
  }
}

/**
 * 14. Audit Log Controller
 */
export async function getProjectAuditLog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await db('projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy dự án.' });
      return;
    }

    const logs = await db('audit_logs as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .select('a.*', 'u.fullname as user_fullname', 'u.username', 'u.role as user_role')
      .where((builder) => {
        builder
          .where('a.details', 'like', `%${project.project_code}%`)
          .orWhere('a.details', 'like', `%dự án #${project.id}%`)
          .orWhere('a.action', 'like', '%PROJECT%');
      })
      .orderBy('a.created_at', 'desc');

    res.status(200).json({ logs });
  } catch (err: any) {
    console.error('Lỗi lấy audit log dự án:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử audit log.' });
  }
}
