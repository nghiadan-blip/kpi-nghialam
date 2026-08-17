import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import { checkPeriodLockForRecord, checkPeriodLockForDate } from './evaluationController';

export async function getProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { status, obstacle_type, search } = req.query;

    let query = db('public_investment_projects as p')
      .leftJoin('users as u', 'p.responsible_user_id', 'u.id')
      .select('p.*', 'u.fullname as responsible_user_name', 'u.position as responsible_user_position');

    if (status) {
      query = query.where('p.status', String(status));
    }
    if (obstacle_type) {
      query = query.where('p.obstacle_type', String(obstacle_type));
    }
    if (search) {
      query = query.where((builder) => {
        builder.where('p.project_name', 'like', `%${search}%`)
          .orWhere('p.project_code', 'like', `%${search}%`)
          .orWhere('p.contractor', 'like', `%${search}%`);
      });
    }

    const projects = await query.orderBy('p.disbursement_rate', 'asc'); // Uu tiên hiển thị công trình có tỷ lệ giải ngân thấp lên đầu để cảnh báo
    res.status(200).json({ projects });
  } catch (err) {
    console.error('Lỗi lấy danh sách dự án đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách dự án đầu tư công.' });
  }
}

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'LEADERSHIP' && user.role !== 'DEPARTMENT_HEAD') {
      res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
      return;
    }

    const {
      project_code,
      project_name,
      investor_name,
      funding_source,
      planned_capital,
      allocated_capital,
      disbursed_amount,
      contractor,
      start_date,
      end_date,
      actual_progress_percent,
      acceptance_value,
      payment_document_status,
      obstacle_type,
      obstacle_note,
      responsible_user_id,
      status
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!project_code || !project_name || !funding_source) {
      res.status(400).json({ message: 'Các trường Mã dự án, Tên dự án và Nguồn vốn là bắt buộc.' });
      return;
    }

    const allocated = Number(allocated_capital) || 0;
    const disbursed = Number(disbursed_amount) || 0;
    const rate = allocated > 0 ? Number(((disbursed / allocated) * 100).toFixed(2)) : 0.0;

    const [newId] = await db('public_investment_projects').insert({
      project_code: project_code.trim().toUpperCase(),
      project_name: project_name.trim(),
      investor_name: investor_name ? investor_name.trim() : 'UBND xã Nghĩa Lâm',
      funding_source: funding_source.trim(),
      planned_capital: Number(planned_capital) || 0,
      allocated_capital: allocated,
      disbursed_amount: disbursed,
      disbursement_rate: rate,
      contractor: contractor ? contractor.trim() : null,
      start_date: start_date || null,
      end_date: end_date || null,
      actual_progress_percent: Number(actual_progress_percent) || 0,
      acceptance_value: Number(acceptance_value) || 0,
      payment_document_status: payment_document_status ? payment_document_status.trim() : 'Chưa nộp',
      obstacle_type: obstacle_type || 'none',
      obstacle_note: obstacle_note ? obstacle_note.trim() : null,
      responsible_user_id: responsible_user_id ? Number(responsible_user_id) : null,
      status: status || 'preparing',
      created_at: new Date(),
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_PUBLIC_INVESTMENT',
      `Tạo công trình đầu tư công mới: "${project_name}" (Vốn phân bổ: ${allocated.toLocaleString()}đ)`,
      clientIp
    );

    res.status(201).json({ message: 'Thêm dự án đầu tư công thành công!', id: newId });
  } catch (err) {
    console.error('Lỗi tạo công trình đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo dự án đầu tư công.' });
  }
}

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const project = await db('public_investment_projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy công trình đầu tư công.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('public_investment_projects', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      project_code,
      project_name,
      investor_name,
      funding_source,
      planned_capital,
      allocated_capital,
      disbursed_amount,
      contractor,
      start_date,
      end_date,
      actual_progress_percent,
      acceptance_value,
      payment_document_status,
      obstacle_type,
      obstacle_note,
      responsible_user_id,
      status
    } = req.body;

    const allocated = allocated_capital !== undefined ? Number(allocated_capital) : project.allocated_capital;
    const disbursed = disbursed_amount !== undefined ? Number(disbursed_amount) : project.disbursed_amount;
    const rate = allocated > 0 ? Number(((disbursed / allocated) * 100).toFixed(2)) : 0.0;

    await db('public_investment_projects')
      .where('id', Number(id))
      .update({
        project_code: project_code !== undefined ? project_code.trim().toUpperCase() : project.project_code,
        project_name: project_name !== undefined ? project_name.trim() : project.project_name,
        investor_name: investor_name !== undefined ? investor_name.trim() : project.investor_name,
        funding_source: funding_source !== undefined ? funding_source.trim() : project.funding_source,
        planned_capital: planned_capital !== undefined ? Number(planned_capital) : project.planned_capital,
        allocated_capital: allocated,
        disbursed_amount: disbursed,
        disbursement_rate: rate,
        contractor: contractor !== undefined ? (contractor ? contractor.trim() : null) : project.contractor,
        start_date: start_date !== undefined ? (start_date || null) : project.start_date,
        end_date: end_date !== undefined ? (end_date || null) : project.end_date,
        actual_progress_percent: actual_progress_percent !== undefined ? Number(actual_progress_percent) : project.actual_progress_percent,
        acceptance_value: acceptance_value !== undefined ? Number(acceptance_value) : project.acceptance_value,
        payment_document_status: payment_document_status !== undefined ? (payment_document_status ? payment_document_status.trim() : null) : project.payment_document_status,
        obstacle_type: obstacle_type !== undefined ? obstacle_type : project.obstacle_type,
        obstacle_note: obstacle_note !== undefined ? (obstacle_note ? obstacle_note.trim() : null) : project.obstacle_note,
        responsible_user_id: responsible_user_id !== undefined ? (responsible_user_id ? Number(responsible_user_id) : null) : project.responsible_user_id,
        status: status !== undefined ? status : project.status,
        updated_at: new Date()
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_PUBLIC_INVESTMENT',
      `Cập nhật công trình đầu tư công #${id}: "${project_name || project.project_name}" (Giải ngân: ${rate}%)`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật công trình đầu tư công thành công!' });
  } catch (err) {
    console.error('Lỗi sửa công trình đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật công trình đầu tư công.' });
  }
}

export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
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

    const project = await db('public_investment_projects').where('id', Number(id)).first();
    if (!project) {
      res.status(404).json({ message: 'Không tìm thấy công trình.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('public_investment_projects', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    await db('public_investment_projects').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_PUBLIC_INVESTMENT',
      `Xóa công trình #${id}: "${project.project_name}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa công trình đầu tư công thành công!' });
  } catch (err) {
    console.error('Lỗi xóa công trình:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa công trình đầu tư công.' });
  }
}

export async function exportProjectsExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const projects = await db('public_investment_projects as p')
      .leftJoin('users as u', 'p.responsible_user_id', 'u.id')
      .select('p.*', 'u.fullname as responsible_name')
      .orderBy('p.id', 'asc');

    let rowsHtml = '';
    projects.forEach((p, idx) => {
      const obstacleText = p.obstacle_type === 'none' ? 'Không vướng mắc'
        : p.obstacle_type === 'gpmb' ? 'Vướng GPMB'
        : p.obstacle_type === 'procedure' ? 'Vướng thủ tục'
        : p.obstacle_type === 'contractor' ? 'Vướng nhà thầu'
        : p.obstacle_type === 'weather' ? 'Thời tiết xấu'
        : 'Vướng mắc khác';

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${p.project_code}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${p.project_name}</td>
          <td style="border: 1px solid #999;">${p.funding_source}</td>
          <td style="text-align: right; border: 1px solid #999;">${p.planned_capital.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999;">${p.allocated_capital.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999; font-weight: bold; color: green;">${p.disbursed_amount.toLocaleString()}</td>
          <td style="text-align: center; border: 1px solid #999; font-weight: bold; color: #1e3a8a;">${p.disbursement_rate}%</td>
          <td style="text-align: center; border: 1px solid #999;">${p.actual_progress_percent}%</td>
          <td style="border: 1px solid #999;">${p.contractor || ''}</td>
          <td style="border: 1px solid #999; color: red;">${obstacleText} (${p.obstacle_note || ''})</td>
          <td style="border: 1px solid #999;">${p.responsible_name || ''}</td>
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
            <td colspan="8" style="text-align: center; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: center;">Số: ..... /BC-Đt</td>
            <td colspan="8" style="text-align: center; font-style: italic;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="12" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="12" class="header-title">BÁO CÁO TIẾN ĐỘ VÀ GIẢI NGÂN VỐN ĐẦU TƯ CÔNG</td>
          </tr>
        </table>
        <br/>

        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Mã dự án</th>
              <th>Tên công trình/dự án</th>
              <th>Nguồn vốn</th>
              <th>Kế hoạch vốn (đ)</th>
              <th>Vốn đã giao (đ)</th>
              <th>Đã giải ngân (đ)</th>
              <th>Tỷ lệ giải ngân</th>
              <th>Tiến độ thi công</th>
              <th>Nhà thầu thi công</th>
              <th>Vướng mắc hiện tại</th>
              <th>Cán bộ đầu mối</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="12" style="text-align: center; padding: 10px;">Chưa có dữ liệu dự án đầu tư công</td></tr>'}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">CÁN BỘ ĐỊA CHÍNH XÂY DỰNG</td>
            <td colspan="4"></td>
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
    res.setHeader('Content-Disposition', 'attachment; filename="Tien_do_giai_ngan_dau_tu_cong_Nghia_Lam.xls"');
    res.send('\uFEFF' + excelTemplate);
  } catch (err) {
    console.error('Lỗi xuất báo cáo Excel đầu tư công:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}
