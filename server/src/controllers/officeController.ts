import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import { checkPeriodLockForRecord, checkPeriodLockForDate } from './evaluationController';

export async function getRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { request_type, status } = req.query;

    let query = db('office_requests as o')
      .leftJoin('users as u_req', 'o.request_user_id', 'u_req.id')
      .leftJoin('users as u_resp', 'o.responsible_user_id', 'u_resp.id')
      .leftJoin('users as u_appr', 'o.approve_user_id', 'u_appr.id')
      .select(
        'o.*',
        'u_req.fullname as request_user_name',
        'u_req.position as request_user_position',
        'u_resp.fullname as responsible_user_name',
        'u_appr.fullname as approve_user_name'
      );

    if (request_type) {
      query = query.where('o.request_type', String(request_type));
    }
    if (status) {
      query = query.where('o.status', String(status));
    }

    // Role scoping: Employee only sees their requests
    if (user.role === 'EMPLOYEE') {
      query = query.where((builder) => {
        builder.where('o.request_user_id', user.id)
          .orWhere('o.responsible_user_id', user.id);
      });
    }

    const requests = await query.orderBy('o.created_at', 'desc');
    res.status(200).json({ requests });
  } catch (err) {
    console.error('Lỗi lấy yêu cầu văn phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách yêu cầu văn phòng.' });
  }
}

export async function createRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const {
      request_type,
      title,
      description,
      start_time,
      end_time,
      estimated_cost,
      funding_source
    } = req.body;

    const lockCheck = await checkPeriodLockForDate(start_time || new Date(), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    if (!request_type || !title) {
      res.status(400).json({ message: 'Các trường Loại yêu cầu và Tiêu đề là bắt buộc.' });
      return;
    }

    const [newId] = await db('office_requests').insert({
      request_type,
      title: title.trim(),
      description: description ? description.trim() : null,
      request_user_id: user.id,
      responsible_user_id: null,
      approve_user_id: null,
      start_time: start_time || null,
      end_time: end_time || null,
      estimated_cost: Number(estimated_cost) || 0,
      approved_cost: 0,
      funding_source: funding_source ? funding_source.trim() : 'Tự chủ',
      document_ref: null,
      settlement_status: 'pending',
      status: 'submitted',
      created_at: new Date(),
      updated_at: new Date()
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'CREATE_OFFICE_REQUEST',
      `Tạo yêu cầu hậu cần văn phòng mới: "${title}" (Loại: ${request_type})`,
      clientIp
    );

    res.status(201).json({ message: 'Đăng ký yêu cầu hậu cần văn phòng thành công!', id: newId });
  } catch (err) {
    console.error('Lỗi tạo yêu cầu văn phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi yêu cầu văn phòng.' });
  }
}

export async function updateRequestStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const request = await db('office_requests').where('id', Number(id)).first();
    if (!request) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('office_requests', Number(id), req.body.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    const {
      status,
      responsible_user_id,
      approved_cost,
      funding_source,
      document_ref,
      settlement_status,
      description
    } = req.body;

    const updatePayload: any = {
      updated_at: new Date()
    };

    if (status !== undefined) {
      updatePayload.status = status;
      // Nếu phê duyệt hoặc từ chối, ghi nhận approve_user_id là Lãnh đạo
      if (['approved', 'rejected', 'settled'].includes(status) && ['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD'].includes(user.role)) {
        updatePayload.approve_user_id = user.id;
      }
    }

    if (responsible_user_id !== undefined) {
      updatePayload.responsible_user_id = responsible_user_id ? Number(responsible_user_id) : null;
    }

    if (approved_cost !== undefined) {
      updatePayload.approved_cost = Number(approved_cost) || 0;
    }

    if (funding_source !== undefined) {
      updatePayload.funding_source = funding_source ? funding_source.trim() : null;
    }

    if (document_ref !== undefined) {
      updatePayload.document_ref = document_ref ? document_ref.trim() : null;
    }

    if (settlement_status !== undefined) {
      updatePayload.settlement_status = settlement_status;
    }

    if (description !== undefined) {
      updatePayload.description = description ? description.trim() : null;
    }

    await db('office_requests').where('id', Number(id)).update(updatePayload);

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'UPDATE_OFFICE_REQUEST',
      `Cập nhật yêu cầu văn phòng #${id}: Trạng thái = ${status || request.status}, Người giải quyết: User #${responsible_user_id || ''}`,
      clientIp
    );

    res.status(200).json({ message: 'Cập nhật yêu cầu hậu cần văn phòng thành công!' });
  } catch (err) {
    console.error('Lỗi sửa trạng thái yêu cầu văn phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật yêu cầu văn phòng.' });
  }
}

export async function deleteRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const request = await db('office_requests').where('id', Number(id)).first();
    if (!request) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu.' });
      return;
    }

    const lockCheck = await checkPeriodLockForRecord('office_requests', Number(id), req.body.reason || req.query.reason, user.role);
    if (lockCheck.locked) {
      res.status(400).json({ message: lockCheck.message });
      return;
    }

    // Chỉ chủ sở hữu đề xuất hoặc Admin/Leadership mới được xóa
    if (request.request_user_id !== user.id && user.role !== 'ADMIN' && user.role !== 'LEADERSHIP') {
      res.status(403).json({ message: 'Bạn không có quyền xóa đề xuất của người khác.' });
      return;
    }

    await db('office_requests').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'DELETE_OFFICE_REQUEST',
      `Xóa đề xuất văn phòng #${id}: "${request.title}"`,
      clientIp
    );

    res.status(200).json({ message: 'Xóa yêu cầu văn phòng thành công!' });
  } catch (err) {
    console.error('Lỗi xóa yêu cầu văn phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa yêu cầu.' });
  }
}

export async function exportOfficeExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const requests = await db('office_requests as o')
      .leftJoin('users as u_req', 'o.request_user_id', 'u_req.id')
      .leftJoin('users as u_resp', 'o.responsible_user_id', 'u_resp.id')
      .leftJoin('users as u_appr', 'o.approve_user_id', 'u_appr.id')
      .select(
        'o.*',
        'u_req.fullname as requester_name',
        'u_resp.fullname as responsible_name',
        'u_appr.fullname as approver_name'
      )
      .orderBy('o.created_at', 'desc');

    let rowsHtml = '';
    requests.forEach((o, idx) => {
      const typeText = o.request_type === 'vehicle' ? 'Điều xe'
        : o.request_type === 'meeting_room' ? 'Đặt phòng họp'
        : o.request_type === 'guest_reception' ? 'Tiếp khách'
        : o.request_type === 'stationery' ? 'Văn phòng phẩm'
        : o.request_type === 'business_trip' ? 'Đi công tác'
        : 'Khác';

      const statusText = o.status === 'approved' ? 'Đã duyệt'
        : o.status === 'rejected' ? 'Từ chối'
        : o.status === 'completed' ? 'Hoàn thành'
        : o.status === 'settled' ? 'Quyết toán'
        : 'Chờ duyệt';

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${typeText}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${o.title}</td>
          <td style="border: 1px solid #999;">${o.description || ''}</td>
          <td style="border: 1px solid #999;">${o.requester_name}</td>
          <td style="text-align: center; border: 1px solid #999;">${o.start_time || ''}</td>
          <td style="text-align: center; border: 1px solid #999;">${o.end_time || ''}</td>
          <td style="text-align: right; border: 1px solid #999;">${o.estimated_cost.toLocaleString()}</td>
          <td style="text-align: right; border: 1px solid #999;">${o.approved_cost.toLocaleString()}</td>
          <td style="border: 1px solid #999;">${o.responsible_name || ''}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${statusText}</td>
          <td style="border: 1px solid #999;">${o.settlement_status === 'completed' ? 'Đã thanh toán' : 'Chưa quyết toán'}</td>
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
            <td colspan="4" style="text-align: center; font-weight: bold;">ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM - VĂN PHÒNG</td>
            <td colspan="8" style="text-align: center; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
          </tr>
          <tr>
            <td colspan="4" style="text-align: center;">Số: ..... /BC-Vp</td>
            <td colspan="8" style="text-align: center; font-style: italic;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="12" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="12" class="header-title">DANH SÁCH THỐNG KÊ YÊU CẦU HẬU CẦN VĂN PHÒNG</td>
          </tr>
        </table>
        <br/>

        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Loại yêu cầu</th>
              <th>Tiêu đề đăng ký</th>
              <th>Chi tiết yêu cầu</th>
              <th>Người đăng ký</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Dự kiến chi (đ)</th>
              <th>Duyệt chi (đ)</th>
              <th>Người chuẩn bị</th>
              <th>Trạng thái</th>
              <th>Quyết toán</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="12" style="text-align: center; padding: 10px;">Chưa có yêu cầu hậu cần văn phòng nào</td></tr>'}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">CHÁNH VĂN PHÒNG UBND XÃ</td>
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
    res.setHeader('Content-Disposition', 'attachment; filename="Thong_ke_hau_can_van_phong_Nghia_Lam.xls"');
    res.send('\uFEFF' + excelTemplate);
  } catch (err) {
    console.error('Lỗi xuất báo cáo Excel văn phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}
