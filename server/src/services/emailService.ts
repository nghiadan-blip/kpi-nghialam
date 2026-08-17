import nodemailer from 'nodemailer';
import db from '../config/db';

interface EvaluationEmailData {
  employee: {
    id: number;
    fullname: string;
    email: string;
    position?: string;
    position_code?: string;
    department_name?: string;
  };
  evaluation: {
    id: number;
    month: string;
    general_score?: number;
    criteria_politics_final?: number;
    criteria_expertise_final?: number;
    criteria_innovation_final?: number;
    task_score?: number;
    final_score: number;
    classification: string;
    remarks?: string;
    party_cell_comments?: string;
    collective_comments?: string;
  };
  approver?: {
    fullname: string;
    position?: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(`📧 EmailService: Đã kết nối SMTP Server [${host}:${port}]`);
    } else {
      // Development mode / fallback
      this.transporter = null;
      console.log('📧 EmailService: Đang hoạt động ở chế độ DEV/MOCK (Email sẽ được log trực tiếp vào console và hệ thống)');
    }
  }

  private getClassificationColor(classification: string) {
    if (classification.includes('Loại A') || classification.includes('xuất sắc')) {
      return { bg: '#d1fae5', text: '#065f46', border: '#34d399', label: 'Xuất sắc (Loại A)' };
    }
    if (classification.includes('Loại B') || classification.includes('tốt')) {
      return { bg: '#e0f2fe', text: '#0369a1', border: '#38bdf8', label: 'Tốt (Loại B)' };
    }
    if (classification.includes('Loại C') || classification.includes('Hoàn thành nhiệm vụ')) {
      return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', label: 'Hoàn thành (Loại C)' };
    }
    return { bg: '#fee2e2', text: '#991b1b', border: '#f87171', label: 'Không hoàn thành (Loại D)' };
  }

  /**
   * Gửi email thông báo kết quả đánh giá định kỳ cho 1 cán bộ
   */
  async sendEvaluationResultEmail(data: EvaluationEmailData): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    const { employee, evaluation, approver } = data;

    if (!employee.email) {
      return { success: false, message: `Cán bộ ${employee.fullname} chưa có địa chỉ email.` };
    }

    const badge = this.getClassificationColor(evaluation.classification || '');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const monthFormatted = evaluation.month ? `Tháng ${evaluation.month.split('-')[1]}/${evaluation.month.split('-')[0]}` : 'Kỳ đánh giá định kỳ';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <title>Kết quả đánh giá CBCC - UBND xã Nghĩa Lâm</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0C3260 0%, #1864AB 50%, #27A4F2 100%); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .header p { margin: 4px 0 0 0; font-size: 13px; color: #CFEBFC; }
        .content { padding: 24px; }
        .salutation { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .card { background: #f0f7fd; border: 1px solid #cfebfc; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .row-label { color: #64748b; font-weight: 500; }
        .row-value { color: #0f172a; font-weight: 700; text-align: right; }
        .badge-box { text-align: center; padding: 16px; background: ${badge.bg}; border: 1.5px solid ${badge.border}; border-radius: 12px; margin: 18px 0; }
        .badge-score { font-size: 28px; font-weight: 900; color: ${badge.text}; margin: 0; }
        .badge-class { font-size: 15px; font-weight: 800; color: ${badge.text}; margin: 4px 0 0 0; text-transform: uppercase; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin: 16px 0 8px 0; letter-spacing: 0.5px; }
        .comments-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; color: #334155; margin-bottom: 12px; font-style: italic; }
        .appeal-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #92400e; margin: 20px 0; }
        .btn-container { text-align: center; margin: 24px 0 10px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #27A4F2, #1864AB); color: #ffffff !important; padding: 12px 28px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 10px rgba(39, 164, 242, 0.3); }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM</h1>
          <p>Hệ thống Quản lý nhiệm vụ và đánh giá CBCC — Theo Nghị định 335/2025/NĐ-CP</p>
        </div>

        <div class="content">
          <div class="salutation">
            Kính gửi: <strong>Đồng chí ${employee.fullname}</strong>,
          </div>
          <p style="font-size: 13px; color: #475569; margin-top: 0;">
            Lãnh đạo UBND xã Nghĩa Lâm thông báo kết quả đánh giá, xếp loại cán bộ, công chức định kỳ <strong>${monthFormatted}</strong> của đồng chí như sau:
          </p>

          <!-- Main Classification Badge -->
          <div class="badge-box">
            <div class="badge-score">${(evaluation.final_score ?? 0).toFixed(1)} / 100 điểm</div>
            <div class="badge-class">${evaluation.classification}</div>
          </div>

          <!-- Detailed Breakdown -->
          <div class="card">
            <div class="row">
              <span class="row-label">Họ và tên cán bộ:</span>
              <span class="row-value">${employee.fullname}</span>
            </div>
            <div class="row">
              <span class="row-label">Vị trí việc làm / Chức danh:</span>
              <span class="row-value">${employee.position || 'Chuyên viên'} ${employee.position_code ? `(${employee.position_code})` : ''}</span>
            </div>
            <div class="row">
              <span class="row-label">Phòng ban / Đơn vị:</span>
              <span class="row-value">${employee.department_name || 'UBND xã Nghĩa Lâm'}</span>
            </div>
            <div class="row">
              <span class="row-label">Điểm Tiêu chí chung (Tối đa 30đ):</span>
              <span class="row-value">${(evaluation.general_score ?? 28.5).toFixed(1)} / 30.0 điểm</span>
            </div>
            <div class="row">
              <span class="row-label">Điểm Kết quả thực hiện nhiệm vụ (70%):</span>
              <span class="row-value">${(evaluation.task_score ?? 100).toFixed(1)} / 100.0 điểm (Quy đổi: ${((evaluation.task_score ?? 100) * 0.7).toFixed(1)}đ)</span>
            </div>
            <div class="row" style="border-top: 2px solid #0284c7; padding-top: 8px;">
              <span class="row-label" style="color: #0369a1; font-weight: 700;">TỔNG ĐIỂM ĐÁNH GIÁ CHÍNH THỨC:</span>
              <span class="row-value" style="color: #0284c7; font-size: 15px;">${(evaluation.final_score ?? 0).toFixed(1)} / 100.0 điểm</span>
            </div>
          </div>

          <!-- Comments & Party Cell -->
          ${evaluation.remarks ? `
            <div class="section-title">Nhận xét của Lãnh đạo UBND xã:</div>
            <div class="comments-box">"${evaluation.remarks}"</div>
          ` : ''}

          ${evaluation.collective_comments ? `
            <div class="section-title">Ý kiến nhận xét cuộc họp cơ quan:</div>
            <div class="comments-box">"${evaluation.collective_comments}"</div>
          ` : ''}

          ${evaluation.party_cell_comments ? `
            <div class="section-title">Ý kiến nhận xét của Chi bộ / Cấp ủy:</div>
            <div class="comments-box">"${evaluation.party_cell_comments}"</div>
          ` : ''}

          <!-- Article 22 Appeal Notice -->
          <div class="appeal-notice">
            <strong>⚖️ Quyền kiến nghị kết quả (Điều 22 Nghị định số 335/2025/NĐ-CP):</strong><br>
            Trường hợp chưa nhất trí với kết quả đánh giá, xếp loại nêu trên, đồng chí có quyền gửi Đơn kiến nghị trực tiếp trên phần mềm trong thời hạn <strong>07 ngày làm việc</strong> kể từ ngày nhận được thông báo này.
          </div>

          <div class="btn-container">
            <a href="${clientUrl}/evaluations" class="btn">Xem Chi Tiết Phiếu Đánh Giá Trên Hệ Thống</a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0;"><strong>HỆ THỐNG QUẢN LÝ NHIỆM VỤ VÀ ĐÁNH GIÁ CBCC XÃ NGHĨA LÂM</strong></p>
          <p style="margin: 0;">Trụ sở: UBND xã Nghĩa Lâm, huyện Nghĩa Đàn, tỉnh Nghệ An — Email: ubnd@nghialam.nghean.gov.vn</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const subject = `[UBND XÃ NGHĨA LÂM] Thông báo kết quả đánh giá CBCC ${monthFormatted} - ${employee.fullname}`;

    if (this.transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM || '"UBND Xã Nghĩa Lâm" <no-reply@nghialam.nghean.gov.vn>';
        await this.transporter.sendMail({
          from: fromEmail,
          to: employee.email,
          subject,
          html: htmlContent,
        });
        console.log(`✅ [SMTP] Đã gửi email kết quả đánh giá tới: ${employee.fullname} <${employee.email}>`);
        return { success: true, message: `Đã gửi email kết quả tới ${employee.email}` };
      } catch (err: any) {
        console.error(`❌ [SMTP Error] Lỗi gửi email tới ${employee.email}:`, err.message);
        return { success: false, message: `Lỗi máy chủ gửi mail: ${err.message}` };
      }
    } else {
      // Mock log delivery
      console.log('\n======================================================');
      console.log(`📨 [SIMULATED EMAIL DISPATCH] -> ${employee.fullname} <${employee.email}>`);
      console.log(`📌 Tiêu đề: ${subject}`);
      console.log(`⭐ Điểm số: ${evaluation.final_score}đ - Xếp loại: [${evaluation.classification}]`);
      console.log(`🔗 Link xem phiếu: ${clientUrl}/evaluations`);
      console.log('======================================================\n');
      return {
        success: true,
        message: `[Mô phỏng] Đã gửi thông báo kết quả đánh giá đến email ${employee.email}`,
      };
    }
  }

  /**
   * Gửi email thông báo hàng loạt cho toàn bộ cán bộ đã được phê duyệt trong tháng
   */
  async sendBatchMonthlyEvaluationEmails(month: string): Promise<{ total: number; sent: number; errors: number; details: any[] }> {
    const evals = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .where('e.month', month)
      .whereIn('e.status', ['APPROVED', 'STEP_3_LEADERSHIP_FINAL'])
      .select(
        'e.*',
        'u.id as user_id',
        'u.fullname',
        'u.email',
        'u.position',
        'u.position_code',
        'd.name as department_name'
      );

    const results = [];
    let sentCount = 0;
    let errorCount = 0;

    for (const row of evals) {
      const emailData: EvaluationEmailData = {
        employee: {
          id: row.user_id,
          fullname: row.fullname,
          email: row.email,
          position: row.position,
          position_code: row.position_code,
          department_name: row.department_name,
        },
        evaluation: {
          id: row.id,
          month: row.month,
          general_score: row.general_score_final || row.general_score_mgr || 28.5,
          task_score: row.task_score_self || 100,
          final_score: row.final_score,
          classification: row.classification,
          remarks: row.remarks,
          party_cell_comments: row.party_cell_comments,
          collective_comments: row.collective_comments,
        },
      };

      const res = await this.sendEvaluationResultEmail(emailData);
      if (res.success) {
        sentCount++;
      } else {
        errorCount++;
      }
      results.push({ fullname: row.fullname, email: row.email, status: res.success ? 'SENT' : 'FAILED', message: res.message });
    }

    return {
      total: evals.length,
      sent: sentCount,
      errors: errorCount,
      details: results,
    };
  }

  /**
   * Gửi email thông báo kết quả giải quyết kiến nghị (Điều 22)
   */
  async sendAppealResolvedEmail(data: {
    employee: { fullname: string; email: string };
    appeal: { id: number; reason: string; status: string; response_text?: string; adjusted_score?: number };
    evaluation: { month: string; final_score: number; classification: string };
  }): Promise<{ success: boolean; message: string }> {
    const { employee, appeal, evaluation } = data;
    if (!employee.email) return { success: false, message: 'Chưa có email cán bộ' };

    const subject = `[UBND XÃ NGHĨA LÂM] Kết quả giải quyết đơn kiến nghị đánh giá tháng ${evaluation.month} - ${employee.fullname}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="utf-8"><title>Kết quả giải quyết kiến nghị</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: #0C3260; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 16px;">KẾT QUẢ GIẢI QUYẾT ĐƠN KIẾN NGHỊ ĐÁNH GIÁ (ĐIỀU 22)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #CFEBFC;">UBND XÃ NGHĨA LÂM</p>
        </div>
        <div style="padding: 20px;">
          <p>Kính gửi: <strong>Đồng chí ${employee.fullname}</strong>,</p>
          <p style="font-size: 13px;">Lãnh đạo UBND xã Nghĩa Lâm đã xem xét và ban hành quyết định giải quyết Đơn kiến nghị ID #${appeal.id} của đồng chí đối với kỳ đánh giá <strong>${evaluation.month}</strong>:</p>
          
          <div style="background: #f0f7fd; border: 1px solid #cfebfc; border-radius: 8px; padding: 14px; margin: 15px 0; font-size: 13px;">
            <p style="margin: 0 0 8px 0;"><strong>Trạng thái giải quyết:</strong> <span style="color: ${appeal.status === 'ACCEPTED' ? '#059669' : '#dc2626'}; font-weight: bold;">${appeal.status === 'ACCEPTED' ? 'CHẤP THUẬN ĐIỀU CHỈNH ĐIỂM' : 'GIỮ NGUYÊN KẾT QUẢ'}</span></p>
            <p style="margin: 0 0 8px 0;"><strong>Điểm chính thức sau giải quyết:</strong> <strong style="font-size: 15px; color: #0284c7;">${evaluation.final_score} điểm (${evaluation.classification})</strong></p>
            <p style="margin: 0;"><strong>Ý kiến kết luận của Lãnh đạo UBND xã:</strong> <em>"${appeal.response_text || 'Đã giải quyết theo quy định.'}"</em></p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${clientUrl}/evaluations" style="display: inline-block; background: #27A4F2; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">Xem Chi Tiết Trên Hệ Thống</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    if (this.transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM || '"UBND Xã Nghĩa Lâm" <no-reply@nghialam.nghean.gov.vn>';
        await this.transporter.sendMail({ from: fromEmail, to: employee.email, subject, html: htmlContent });
        return { success: true, message: `Đã gửi thông báo giải quyết kiến nghị tới ${employee.email}` };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else {
      console.log(`📨 [SIMULATED EMAIL] Kết quả giải quyết kiến nghị gửi tới: ${employee.email}`);
      return { success: true, message: `[Mô phỏng] Đã gửi thông báo giải quyết kiến nghị tới ${employee.email}` };
    }
  }
}

export const emailService = new EmailService();
