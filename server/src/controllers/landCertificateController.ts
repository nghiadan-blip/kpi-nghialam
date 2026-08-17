import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import { checkPeriodLockForRecord, checkPeriodLockForDate } from './evaluationController';

export async function getCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { case_group, status, village, search } = req.query;

    let query = db('land_certificate_cases as c')
      .leftJoin('users as u', 'c.responsible_user_id', 'u.id')
      .leftJoin('departments as d', 'c.responsible_department_id', 'd.id')
      .select(
        'c.*',
        'u.fullname as responsible_user_name',
        'u.position as responsible_user_position',
        'd.name as responsible_department_name'
      );

    if (case_group) {
      query = query.where('c.case_group', String(case_group));
    }
    if (status) {
      query = query.where('c.status', String(status));
    }
    if (village) {
      query = query.where('c.village', String(village));
    }
    if (search) {
      query = query.where((builder) => {
        builder.where('c.citizen_name', 'like', `%${search}%`)
          .orWhere('c.case_code', 'like', `%${search}%`)
          .orWhere('c.land_plot_ref', 'like', `%${search}%`);
      });
    }

    const cases = await query.orderBy('c.deadline', 'asc');
    res.status(200).json({ cases });
  } catch (err) {
    console.error('Lỗi lấy danh sách hồ sơ đất đai:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách hồ sơ đất đai.' });
  }
}

export async function createCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const {
      case_code,
      citizen_name,
      village,
      land_plot_ref,
      case_group,
      legal_basis_group,
      current_step,
      status,
      deadline,
      responsible_user_id,
      note,
      evidence_ref
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!case_code || !citizen_name || !village || !land_plot_ref) {
      res.status(400).json({ message: 'Các trường Mã hồ sơ, Tên công dân, Xóm và Số tờ số thửa là bắt buộc.' });
      return;
    }

    let finalStatus = status || 'received';
    if (finalStatus === 'delayed') {
      const now = new Date();
      if (!deadline || new Date(deadline) >= now) {
        res.status(400).json({ message: 'Hồ sơ mới hoặc chưa đến hạn không thể gán trạng thái Chậm giải quyết.' });
        return;
      }
    }

    const [newId] = await db('land_certificate_cases').insert({
      case_code: case_code.trim().toUpperCase(),
      citizen_name: citizen_name.trim(),
      village: village.trim(),
      land_plot_ref: land_plot_ref.trim(),
      case_group: case_group || 'Xanh',
      legal_basis_group: legal_basis_group || 'other',
      current_step: current_step ? current_step.trim() : 'Tiếp nhận hồ sơ',
      status: finalStatus,
      deadline: deadline || null,
      responsible_user_id: responsible_user_id ? Number(responsible_user_id) : null,
      responsible_department_id: 3, // Phòng địa chính mặc định
      evidence_ref: evidence_ref ? evidence_ref.trim() : null,
      created_at: new Date(),
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_LAND_CASE',
      `Tạo hồ sơ cấp GCN đất đai mới: "${case_code}" cho "${citizen_name}"`,
      clientIp
    );

    res.status(201).json({ message: 'Thêm hồ sơ cấp đất thành công!', id: newId });
  } catch (err) {
    console.error('Lỗi tạo hồ sơ cấp đất đai:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo hồ sơ đất đai.' });
  }
}

export async function updateCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const landCase = await db('land_certificate_cases').where('id', Number(id)).first();
    if (!landCase) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ đất đai.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('land_certificate_cases', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      case_code,
      citizen_name,
      village,
      land_plot_ref,
      case_group,
      legal_basis_group,
      current_step,
      status,
      deadline,
      responsible_user_id,
      delay_reason,
      evidence_ref
    } = req.body;

    const finalStatus = status !== undefined ? status : landCase.status;
    const finalDeadline = deadline !== undefined ? (deadline || null) : landCase.deadline;

    if (finalStatus === 'delayed') {
      const now = new Date();
      if (!finalDeadline || new Date(finalDeadline) >= now) {
        res.status(400).json({ message: 'Không thể gán trạng thái Chậm giải quyết khi chưa quá hạn.' });
        return;
      }
    }

    await db('land_certificate_cases')
      .where('id', Number(id))
      .update({
        case_code: case_code !== undefined ? case_code.trim().toUpperCase() : landCase.case_code,
        citizen_name: citizen_name !== undefined ? citizen_name.trim() : landCase.citizen_name,
        village: village !== undefined ? village.trim() : landCase.village,
        land_plot_ref: land_plot_ref !== undefined ? land_plot_ref.trim() : landCase.land_plot_ref,
        case_group: case_group !== undefined ? case_group : landCase.case_group,
        legal_basis_group: legal_basis_group !== undefined ? legal_basis_group : landCase.legal_basis_group,
        current_step: current_step !== undefined ? current_step.trim() : landCase.current_step,
        status: finalStatus,
        deadline: finalDeadline,
        responsible_user_id: responsible_user_id !== undefined ? (responsible_user_id ? Number(responsible_user_id) : null) : landCase.responsible_user_id,
        delay_reason: delay_reason !== undefined ? (delay_reason ? delay_reason.trim() : null) : landCase.delay_reason,
        evidence_ref: evidence_ref !== undefined ? (evidence_ref ? evidence_ref.trim() : null) : landCase.evidence_ref,
        updated_at: new Date()
      });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_LAND_CASE',
      `Cập nhật hồ sơ đất đai #${id}: "${case_code || landCase.case_code}" (Trạng thái: ${status || landCase.status})`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật hồ sơ đất đai thành công!' });
  } catch (err) {
    console.error('Lỗi sửa hồ sơ đất đai:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
  }
}

export async function deleteCase(req: AuthRequest, res: Response): Promise<void> {
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

    const landCase = await db('land_certificate_cases').where('id', Number(id)).first();
    if (!landCase) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
      return;
    }

    if (landCase.status === 'issued') {
      res.status(400).json({ message: 'Không thể xóa hồ sơ đất đai đã được phê duyệt cấp giấy (Đã ra sổ).' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('land_certificate_cases', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    await db('land_certificate_cases').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_LAND_CASE',
      `Xóa hồ sơ cấp đất #${id}: "${landCase.case_code}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa hồ sơ đất đai thành công!' });
  } catch (err) {
    console.error('Lỗi xóa hồ sơ:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa hồ sơ.' });
  }
}

export async function getKH965Progress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const progress = await db('kh965_progress as k')
      .leftJoin('users as u', 'k.responsible_user_id', 'u.id')
      .select('k.*', 'u.fullname as responsible_user_name')
      .orderBy('k.village', 'asc');

    res.status(200).json({ progress });
  } catch (err) {
    console.error('Lỗi lấy tiến độ KH965:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy tiến độ Kế hoạch 965.' });
  }
}

export async function updateKH965Progress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const {
      village,
      total_plots,
      reviewed_plots,
      classified_plots,
      eligible_cases,
      need_supplement_cases,
      complex_cases,
      green_count,
      yellow_count,
      red_count,
      responsible_user_id,
      note
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!village) {
      res.status(400).json({ message: 'Trường Xóm là bắt buộc.' });
      return;
    }

    const existing = await db('kh965_progress').where('village', village).first();

    const payload = {
      village,
      total_plots: Number(total_plots) || 0,
      reviewed_plots: Number(reviewed_plots) || 0,
      classified_plots: Number(classified_plots) || 0,
      eligible_cases: Number(eligible_cases) || 0,
      need_supplement_cases: Number(need_supplement_cases) || 0,
      complex_cases: Number(complex_cases) || 0,
      green_count: Number(green_count) || 0,
      yellow_count: Number(yellow_count) || 0,
      red_count: Number(red_count) || 0,
      responsible_user_id: responsible_user_id ? Number(responsible_user_id) : null,
      report_date: new Date(),
      note: note ? note.trim() : null
    };

    if (existing) {
      await db('kh965_progress').where('village', village).update(payload);
    } else {
      await db('kh965_progress').insert(payload);
    }

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_KH965',
      `Cập nhật tiến độ KH965 tại "${village}" (Tổng rà soát: ${reviewed_plots} thửa)`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật tiến độ rà soát Kế hoạch 965 thành công!' });
  } catch (err) {
    console.error('Lỗi lưu tiến độ KH965:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lưu tiến độ KH965.' });
  }
}

export async function exportLandExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cases = await db('land_certificate_cases as c')
      .leftJoin('users as u', 'c.responsible_user_id', 'u.id')
      .select('c.*', 'u.fullname as responsible_name')
      .orderBy('c.village', 'asc');

    const progress = await db('kh965_progress as k')
      .leftJoin('users as u', 'k.responsible_user_id', 'u.id')
      .select('k.*', 'u.fullname as responsible_name')
      .orderBy('k.village', 'asc');

    let caseRows = '';
    cases.forEach((c, idx) => {
      const legalBasis = c.legal_basis_group === 'article_137' ? 'Điều 137 Luật Đất đai'
        : c.legal_basis_group === 'article_138' ? 'Điều 138 Luật Đất đai'
        : c.legal_basis_group === 'article_139' ? 'Điều 139 Luật Đất đai'
        : c.legal_basis_group === 'article_140' ? 'Điều 140 Luật Đất đai'
        : 'Khác';

      const statusText = c.status === 'received' ? 'Tiếp nhận'
        : c.status === 'checking' ? 'Kiểm tra hồ sơ'
        : c.status === 'public_notice' ? 'Niêm yết công khai'
        : c.status === 'financial_obligation' ? 'Nghĩa vụ tài chính'
        : c.status === 'submitted' ? 'Trình huyện'
        : c.status === 'issued' ? 'Đã ra sổ'
        : c.status === 'delayed' ? 'Chậm hạn'
        : 'Tạm dừng';

      caseRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${c.case_code}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${c.citizen_name}</td>
          <td style="border: 1px solid #999;">${c.village}</td>
          <td style="border: 1px solid #999;">${c.land_plot_ref}</td>
          <td style="text-align: center; border: 1px solid #999;">${c.case_group}</td>
          <td style="border: 1px solid #999;">${legalBasis}</td>
          <td style="border: 1px solid #999;">${c.current_step}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${statusText}</td>
          <td style="text-align: center; border: 1px solid #999;">${c.deadline || ''}</td>
          <td style="border: 1px solid #999;">${c.responsible_name || ''}</td>
          <td style="border: 1px solid #999; color: red;">${c.delay_reason || ''}</td>
        </tr>
      `;
    });

    let progRows = '';
    progress.forEach((p, idx) => {
      progRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${p.village}</td>
          <td style="text-align: center; border: 1px solid #999;">${p.total_plots}</td>
          <td style="text-align: center; border: 1px solid #999; font-weight: bold;">${p.reviewed_plots}</td>
          <td style="text-align: center; border: 1px solid #999;">${p.classified_plots}</td>
          <td style="text-align: center; border: 1px solid #999; color: green;">${p.eligible_cases}</td>
          <td style="text-align: center; border: 1px solid #999; color: orange;">${p.need_supplement_cases}</td>
          <td style="text-align: center; border: 1px solid #999; color: red;">${p.complex_cases}</td>
          <td style="text-align: center; border: 1px solid #999; color: green; font-weight: bold;">${p.green_count}</td>
          <td style="text-align: center; border: 1px solid #999; color: orange; font-weight: bold;">${p.yellow_count}</td>
          <td style="text-align: center; border: 1px solid #999; color: red; font-weight: bold;">${p.red_count}</td>
          <td style="border: 1px solid #999;">${p.responsible_name || ''}</td>
          <td style="border: 1px solid #999;">${p.note || ''}</td>
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
            <td colspan="4" style="text-align: center; font-weight: bold;">UBND XÃ NGHĨA LÂM - BỘ PHẬN ĐỊA CHÍNH</td>
            <td colspan="8" style="text-align: center; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: center;">Số: ..... /BC-Đđ</td>
            <td colspan="8" style="text-align: center; font-style: italic;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="12" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="12" class="header-title">BÁO CÁO CHI TIẾT TIẾN ĐỘ CẤP GCN QSDĐ VÀ KẾ HOẠCH RÀ SOÁT 965</td>
          </tr>
        </table>
        <br/>

        <h3 style="color: #1e3a8a;">I. CHI TIẾT HỒ SƠ ĐANG XỬ LÝ (PHÂN LUỒNG XANH - VÀNG - ĐỎ)</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Mã hồ sơ</th>
              <th>Chủ đất / Công dân</th>
              <th>Thôn/Xóm</th>
              <th>Tờ/Thửa</th>
              <th>Luồng phân loại</th>
              <th>Cơ sở pháp lý</th>
              <th>Bước quy trình hiện tại</th>
              <th>Trạng thái</th>
              <th>Hạn xử lý</th>
              <th>Cán bộ thụ lý</th>
              <th>Lý do chậm trễ</th>
            </tr>
          </thead>
          <tbody>
            ${caseRows || '<tr><td colspan="12" style="text-align: center; padding: 10px;">Chưa có hồ sơ nào đang giải quyết</td></tr>'}
          </tbody>
        </table>

        <br/>
        <h3 style="color: #1e3a8a;">II. THỐNG KÊ TIẾN ĐỘ KẾ HOẠCH 965 THEO TỪNG THÔN/XÓM</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Tên Xóm</th>
              <th>Tổng số thửa</th>
              <th>Đã rà soát</th>
              <th>Đã phân loại</th>
              <th>Đủ đk cấp (đất dễ)</th>
              <th>Cần bổ sung</th>
              <th>Phức tạp/Tranh chấp</th>
              <th>Hồ sơ Xanh</th>
              <th>Hồ sơ Vàng</th>
              <th>Hồ sơ Đỏ</th>
              <th>Cán bộ phụ trách xóm</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${progRows || '<tr><td colspan="13" style="text-align: center; padding: 10px;">Chưa có số liệu rà soát xóm nào</td></tr>'}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">CÔNG CHỨC ĐỊA CHÍNH</td>
            <td colspan="5"></td>
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
    res.setHeader('Content-Disposition', 'attachment; filename="Tien_do_dat_dai_KH965_Nghia_Lam.xls"');
    res.send('\uFEFF' + excelTemplate);
  } catch (err) {
    console.error('Lỗi xuất báo cáo Excel đất đai:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}
