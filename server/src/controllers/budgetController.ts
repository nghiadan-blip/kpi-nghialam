import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import { checkPeriodLockForRecord, checkPeriodLockForDate } from './evaluationController';

function canAccessBudget(user: any): boolean {
  if (!user) return false;
  if (['ADMIN', 'LEADERSHIP'].includes(user.role)) return true;
  if (user.department_id === 6) return true; // Bộ phận Tài chính - Kế toán
  return false;
}

function canModifyBudget(user: any): boolean {
  if (!user) return false;
  if (['ADMIN', 'LEADERSHIP'].includes(user.role)) return true;
  if (user.department_id === 6) return true; // Cán bộ / Trưởng bộ phận Tài chính - Kế toán
  return false;
}

export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canAccessBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền truy cập dữ liệu Tài chính - Ngân sách xã.' });
      return;
    }

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const { category, status } = req.query;

    // 1. Get Revenues
    let revQuery = db('budget_revenue_items as r')
      .leftJoin('users as u', 'r.responsible_user_id', 'u.id')
      .leftJoin('departments as d', 'r.responsible_department_id', 'd.id')
      .select(
        'r.*',
        'u.fullname as responsible_user_name',
        'u.position as responsible_user_position',
        'd.name as responsible_department_name'
      )
      .where('r.year', year);

    // 2. Get Expenditures
    let expQuery = db('budget_expenditure_items as e')
      .leftJoin('users as u_req', 'e.request_user_id', 'u_req.id')
      .leftJoin('users as u_appr', 'e.approve_user_id', 'u_appr.id')
      .select(
        'e.*',
        'u_req.fullname as request_user_name',
        'u_req.position as request_user_position',
        'u_appr.fullname as approve_user_name'
      )
      .where('e.year', year);

    if (category) {
      revQuery = revQuery.where('r.category', String(category));
      expQuery = expQuery.where('e.category', String(category));
    }
    if (status) {
      revQuery = revQuery.where('r.status', String(status));
      expQuery = expQuery.where('e.status', String(status));
    }

    const revenues = await revQuery.orderBy('r.due_date', 'asc');
    const expenditures = await expQuery.orderBy('e.created_at', 'desc');

    // 3. Compute Stats
    const totalPlannedRevenue = revenues.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
    const totalCollectedRevenue = revenues.reduce((sum, item) => sum + (item.collected_amount || 0), 0);
    const totalRemainingRevenue = revenues.reduce((sum, item) => sum + (item.remaining_amount || 0), 0);

    const totalEstimatedExpenditure = expenditures.reduce((sum, item) => sum + (item.estimated_amount || 0), 0);
    const totalApprovedExpenditure = expenditures.reduce((sum, item) => sum + (item.approved_amount || 0), 0);
    const totalPaidExpenditure = expenditures.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
    const totalRemainingExpenditure = expenditures.reduce((sum, item) => sum + (item.remaining_amount || 0), 0);

    res.status(200).json({
      revenues,
      expenditures,
      stats: {
        revenue: {
          planned: totalPlannedRevenue,
          collected: totalCollectedRevenue,
          remaining: totalRemainingRevenue,
          percent: totalPlannedRevenue > 0 ? Number(((totalCollectedRevenue / totalPlannedRevenue) * 100).toFixed(1)) : 0
        },
        expenditure: {
          estimated: totalEstimatedExpenditure,
          approved: totalApprovedExpenditure,
          paid: totalPaidExpenditure,
          remaining: totalRemainingExpenditure,
          percent: totalApprovedExpenditure > 0 ? Number(((totalPaidExpenditure / totalApprovedExpenditure) * 100).toFixed(1)) : 0
        }
      }
    });
  } catch (err) {
    console.error('Lỗi lấy thông tin ngân sách:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu ngân sách.' });
  }
}

export async function createRevenue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canModifyBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền tạo khoản thu ngân sách xã.' });
      return;
    }

    const {
      year,
      category,
      source_name,
      payer_or_unit,
      planned_amount,
      collected_amount,
      due_date,
      responsible_department_id,
      responsible_user_id,
      note,
      evidence_ref
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(due_date || new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!year || !category || !source_name) {
      res.status(400).json({ message: 'Các trường Năm ngân sách, Nhóm khoản thu và Tên nguồn thu là bắt buộc.' });
      return;
    }

    const planned = Number(planned_amount) || 0;
    const collected = Number(collected_amount) || 0;
    const remaining = Math.max(0, planned - collected);
    let status = 'planned';
    if (collected > 0) {
      status = remaining === 0 ? 'completed' : 'partial';
    }
    if (due_date && new Date(due_date) < new Date() && status !== 'completed') {
      status = 'overdue';
    }

    const [newId] = await db('budget_revenue_items').insert({
      year: Number(year),
      category: category.trim(),
      source_name: source_name.trim(),
      payer_or_unit: payer_or_unit ? payer_or_unit.trim() : null,
      planned_amount: planned,
      collected_amount: collected,
      remaining_amount: remaining,
      due_date: due_date || null,
      responsible_department_id: responsible_department_id ? Number(responsible_department_id) : null,
      responsible_user_id: responsible_user_id ? Number(responsible_user_id) : null,
      status,
      note: note ? note.trim() : null,
      evidence_ref: evidence_ref ? evidence_ref.trim() : null,
      created_at: new Date(),
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_BUDGET_REVENUE',
      `Tạo nguồn thu mới: "${source_name}" (${planned.toLocaleString()}đ, Phụ trách: User #${responsible_user_id})`,
      clientIp
    );

    res.status(201).json({ message: 'Thêm khoản thu ngân sách thành công!', id: newId });
  } catch (err) {
    console.error('Lỗi tạo khoản thu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo khoản thu ngân sách.' });
  }
}

export async function updateRevenue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canModifyBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật khoản thu ngân sách xã.' });
      return;
    }

    const revenue = await db('budget_revenue_items').where('id', Number(id)).first();
    if (!revenue) {
      res.status(404).json({ message: 'Không tìm thấy khoản thu ngân sách.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('budget_revenue_items', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      year,
      category,
      source_name,
      payer_or_unit,
      planned_amount,
      collected_amount,
      due_date,
      responsible_department_id,
      responsible_user_id,
      status: reqStatus,
      note,
      evidence_ref
    } = req.body;

    const planned = planned_amount !== undefined ? Number(planned_amount) : revenue.planned_amount;
    const collected = collected_amount !== undefined ? Number(collected_amount) : revenue.collected_amount;
    const remaining = Math.max(0, planned - collected);

    let status = reqStatus;
    if (!status) {
      status = 'planned';
      if (collected > 0) {
        status = remaining === 0 ? 'completed' : 'partial';
      }
      const finalDueDate = due_date || revenue.due_date;
      if (finalDueDate && new Date(finalDueDate) < new Date() && status !== 'completed') {
        status = 'overdue';
      }
    }

    await db('budget_revenue_items')
      .where('id', Number(id))
      .update({
        year: year !== undefined ? Number(year) : revenue.year,
        category: category !== undefined ? category.trim() : revenue.category,
        source_name: source_name !== undefined ? source_name.trim() : revenue.source_name,
        payer_or_unit: payer_or_unit !== undefined ? (payer_or_unit ? payer_or_unit.trim() : null) : revenue.payer_or_unit,
        planned_amount: planned,
        collected_amount: collected,
        remaining_amount: remaining,
        due_date: due_date !== undefined ? (due_date || null) : revenue.due_date,
        responsible_department_id: responsible_department_id !== undefined ? (responsible_department_id ? Number(responsible_department_id) : null) : revenue.responsible_department_id,
        responsible_user_id: responsible_user_id !== undefined ? (responsible_user_id ? Number(responsible_user_id) : null) : revenue.responsible_user_id,
        status,
        note: note !== undefined ? (note ? note.trim() : null) : revenue.note,
        evidence_ref: evidence_ref !== undefined ? (evidence_ref ? evidence_ref.trim() : null) : revenue.evidence_ref,
        updated_at: new Date()
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_BUDGET_REVENUE',
      `Cập nhật khoản thu #${id}: "${source_name || revenue.source_name}" (Thu: ${collected.toLocaleString()}đ)`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật khoản thu ngân sách thành công!' });
  } catch (err) {
    console.error('Lỗi sửa khoản thu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản thu.' });
  }
}

export async function deleteRevenue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'LEADERSHIP') {
      res.status(403).json({ message: 'Chỉ Lãnh đạo hoặc Admin mới được phép xóa.' });
      return;
    }

    const revenue = await db('budget_revenue_items').where('id', Number(id)).first();
    if (!revenue) {
      res.status(404).json({ message: 'Không tìm thấy khoản thu.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('budget_revenue_items', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    await db('budget_revenue_items').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_BUDGET_REVENUE',
      `Xóa khoản thu #${id}: "${revenue.source_name}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa khoản thu ngân sách thành công!' });
  } catch (err) {
    console.error('Lỗi xóa khoản thu:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa khoản thu.' });
  }
}

export async function createExpenditure(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canModifyBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền tạo đề xuất chi ngân sách xã.' });
      return;
    }

    const {
      year,
      category,
      expense_name,
      funding_source,
      estimated_amount,
      approved_amount,
      paid_amount,
      note
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!year || !category || !expense_name) {
      res.status(400).json({ message: 'Các trường Năm ngân sách, Nhóm khoản chi và Nội dung chi là bắt buộc.' });
      return;
    }

    const est = Number(estimated_amount) || 0;
    const app = Number(approved_amount) || 0;
    const paid = Number(paid_amount) || 0;
    const remaining = Math.max(0, app - paid);

    let status = 'submitted'; // Mặc định trình duyệt chi
    if (paid > 0) {
      status = remaining === 0 ? 'paid' : 'approved';
    }

    const [newId] = await db('budget_expenditure_items').insert({
      year: Number(year),
      category: category.trim(),
      expense_name: expense_name.trim(),
      funding_source: funding_source ? funding_source.trim() : 'Tự chủ',
      estimated_amount: est,
      approved_amount: app,
      paid_amount: paid,
      remaining_amount: remaining,
      request_user_id: user.id, // Ai đề xuất
      approve_user_id: null,
      status,
      document_status: 'full',
      payment_date: paid > 0 ? new Date() : null,
      note: note ? note.trim() : null,
      created_at: new Date(),
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_BUDGET_EXPENDITURE',
      `Tạo đề xuất chi: "${expense_name}" (${est.toLocaleString()}đ, Người đề xuất: ${user.fullname})`,
      clientIp
    );

    res.status(201).json({ message: 'Tạo đề xuất chi ngân sách thành công!', id: newId });
  } catch (err) {
    console.error('Lỗi tạo khoản chi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo khoản chi ngân sách.' });
  }
}

export async function updateExpenditure(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canModifyBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật đề xuất chi ngân sách xã.' });
      return;
    }

    const exp = await db('budget_expenditure_items').where('id', Number(id)).first();
    if (!exp) {
      res.status(404).json({ message: 'Không tìm thấy đề xuất chi ngân sách.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('budget_expenditure_items', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      year,
      category,
      expense_name,
      funding_source,
      estimated_amount,
      approved_amount,
      paid_amount,
      status: reqStatus,
      document_status,
      payment_date,
      note
    } = req.body;

    const est = estimated_amount !== undefined ? Number(estimated_amount) : exp.estimated_amount;
    const app = approved_amount !== undefined ? Number(approved_amount) : exp.approved_amount;
    const paid = paid_amount !== undefined ? Number(paid_amount) : exp.paid_amount;
    const remaining = Math.max(0, app - paid);

    let status = reqStatus || exp.status;
    let approve_user_id = exp.approve_user_id;

    // Nếu chuyển sang trạng thái APPROVED/PAID thì ghi nhận Lãnh đạo duyệt
    if ((reqStatus === 'approved' || reqStatus === 'paid') && ['LEADERSHIP', 'ADMIN'].includes(user.role)) {
      approve_user_id = user.id;
    }

    await db('budget_expenditure_items')
      .where('id', Number(id))
      .update({
        year: year !== undefined ? Number(year) : exp.year,
        category: category !== undefined ? category.trim() : exp.category,
        expense_name: expense_name !== undefined ? expense_name.trim() : exp.expense_name,
        funding_source: funding_source !== undefined ? funding_source.trim() : exp.funding_source,
        estimated_amount: est,
        approved_amount: app,
        paid_amount: paid,
        remaining_amount: remaining,
        approve_user_id,
        status,
        document_status: document_status !== undefined ? document_status : exp.document_status,
        payment_date: payment_date !== undefined ? (payment_date || null) : exp.payment_date,
        note: note !== undefined ? (note ? note.trim() : null) : exp.note,
        updated_at: new Date()
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_BUDGET_EXPENDITURE',
      `Cập nhật khoản chi #${id}: "${expense_name || exp.expense_name}" (Trạng thái: ${status})`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật đề xuất chi ngân sách thành công!' });
  } catch (err) {
    console.error('Lỗi sửa khoản chi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật khoản chi.' });
  }
}

export async function deleteExpenditure(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'LEADERSHIP') {
      res.status(403).json({ message: 'Chỉ Lãnh đạo hoặc Admin mới được phép xóa.' });
      return;
    }

    const exp = await db('budget_expenditure_items').where('id', Number(id)).first();
    if (!exp) {
      res.status(404).json({ message: 'Không tìm thấy khoản chi.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('budget_expenditure_items', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    await db('budget_expenditure_items').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_BUDGET_EXPENDITURE',
      `Xóa khoản chi #${id}: "${exp.expense_name}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa đề xuất chi ngân sách thành công!' });
  } catch (err) {
    console.error('Lỗi xóa khoản chi:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa khoản chi.' });
  }
}

export async function exportBudgetExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!canAccessBudget(user)) {
      res.status(403).json({ message: 'Bạn không có quyền xuất dữ liệu Tài chính - Ngân sách xã.' });
      return;
    }

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const revenues = await db('budget_revenue_items as r')
      .leftJoin('departments as d', 'r.responsible_department_id', 'd.id')
      .select('r.*', 'd.name as department_name')
      .where('r.year', year);

    const expenditures = await db('budget_expenditure_items as e')
      .leftJoin('users as u', 'e.request_user_id', 'u.id')
      .select('e.*', 'u.fullname as requester_name')
      .where('e.year', year);

    let revRows = '';
    revenues.forEach((r, idx) => {
      revRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999;">${r.category}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${r.source_name}</td>
          <td style="border: 1px solid #999;">${r.payer_or_unit || ''}</td>
          <td style="text-align: right; border: 1px solid #999;">${r.planned_amount.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999; font-weight: bold; color: green;">${r.collected_amount.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999; color: red;">${r.remaining_amount.toLocaleString()}</td>
          <td style="text-align: center; border: 1px solid #999;">${r.due_date || ''}</td>
          <td style="border: 1px solid #999;">${r.department_name || ''}</td>
          <td style="border: 1px solid #999;">${r.status === 'completed' ? 'Hoàn thành' : r.status === 'partial' ? 'Thu một phần' : r.status === 'overdue' ? 'Quá hạn' : 'Lập kế hoạch'}</td>
        </tr>
      `;
    });

    let expRows = '';
    expenditures.forEach((e, idx) => {
      expRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999;">${e.category}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${e.expense_name}</td>
          <td style="border: 1px solid #999;">${e.funding_source}</td>
          <td style="text-align: right; border: 1px solid #999;">${e.estimated_amount.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999;">${e.approved_amount.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999; font-weight: bold; color: blue;">${e.paid_amount.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999; color: red;">${e.remaining_amount.toLocaleString()}</td>
          <td style="border: 1px solid #999;">${e.requester_name || ''}</td>
          <td style="border: 1px solid #999;">${e.status === 'paid' ? 'Đã chi trả' : e.status === 'approved' ? 'Đã phê duyệt' : e.status === 'submitted' ? 'Chờ duyệt' : 'Bản nháp'}</td>
        </tr>
      `;
    });

    const dateFormatted = new Date().toLocaleDateString('vi-VN');
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
          .header-title { font-size: 15pt; font-weight: bold; text-align: center; color: #1e3a8a; }
          th { background-color: #dbeafe; color: #1e3a8a; font-weight: bold; text-align: center; border: 1px solid #999; padding: 6px; }
          td { padding: 5px; }
        </style>
      </head>
      <body>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM</td>
            <td colspan="6" style="text-align: center; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: center;">Số: ..... /BC-Tckt</td>
            <td colspan="6" style="text-align: center; font-style: italic;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="10" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="10" class="header-title">BÁO CÁO CHI TIẾT NGÂN SÁCH THU - CHI NĂM ${year}</td>
          </tr>
        </table>

        <h3 style="color: #1e3a8a;">I. CÁC KHOẢN THU NGÂN SÁCH</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Phân nhóm</th>
              <th>Tên nguồn thu</th>
              <th>Đối tượng nộp</th>
              <th>Kế hoạch (đ)</th>
              <th>Thực thu (đ)</th>
              <th>Còn phải thu (đ)</th>
              <th>Hạn hoàn thành</th>
              <th>Bộ phận phụ trách</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${revRows || '<tr><td colspan="10" style="text-align: center; padding: 10px;">Chưa có khoản thu nào</td></tr>'}
          </tbody>
        </table>

        <br/>
        <h3 style="color: #1e3a8a;">II. CÁC KHOẢN CHI NGÂN SÁCH</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Phân nhóm</th>
              <th>Nội dung chi</th>
              <th>Nguồn kinh phí</th>
              <th>Dự toán đề xuất (đ)</th>
              <th>Phê duyệt (đ)</th>
              <th>Thực tế đã chi (đ)</th>
              <th>Còn lại (đ)</th>
              <th>Người đề xuất</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${expRows || '<tr><td colspan="10" style="text-align: center; padding: 10px;">Chưa có đề xuất chi nào</td></tr>'}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">PHỤ TRÁCH KẾ TOÁN</td>
            <td colspan="2"></td>
            <td colspan="4" style="text-align: center;">
              <em>Nghĩa Lâm, ngày ${dateFormatted}</em><br/>
              <strong>CHỦ TỊCH ỦY BAN NHÂN DÂN XÃ</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_ngan_sach_Nghia_Lam_${year}.xls"`);
    res.send('\uFEFF' + excelTemplate);
  } catch (err) {
    console.error('Lỗi xuất báo cáo Excel ngân sách:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}
