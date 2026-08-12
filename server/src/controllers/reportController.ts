import { Response } from 'express';
import db from '../config/db';
import { AuthRequest } from '../middleware/auth';

function calculateClassification(score: number): string {
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ (Loại A)';
  if (score >= 70) return 'Hoàn thành tốt nhiệm vụ (Loại B)';
  if (score >= 50) return 'Hoàn thành nhiệm vụ (Loại C)';
  return 'Không hoàn thành nhiệm vụ (Loại D)';
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const currentMonth = req.query.month ? String(req.query.month) : new Date().toISOString().slice(0, 7);

    // 1. General Metrics
    const userRows = await db('users').where('status', 'ACTIVE').select('id');
    const deptRows = await db('departments').select('id');

    const totalUsers = userRows.length;
    const totalDepartments = deptRows.length;

    // 2. Task Metrics
    const now = new Date();
    const tasks = await db('tasks as t')
      .leftJoin('users as u', 't.assigned_to', 'u.id')
      .select('t.id', 't.status', 't.deadline', 'u.department_id');

    let totalTasks = tasks.length;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    for (const t of tasks) {
      if (t.status === 'COMPLETED') {
        completedTasks++;
      } else if (new Date(t.deadline) < now) {
        overdueTasks++;
        if (t.status === 'IN_PROGRESS') inProgressTasks++;
        if (t.status === 'PENDING') pendingTasks++;
      } else {
        if (t.status === 'IN_PROGRESS') inProgressTasks++;
        if (t.status === 'PENDING') pendingTasks++;
      }
    }

    const taskCompletionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

    // 3. Evaluation Metrics for current month
    const evaluations = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .where('e.month', currentMonth)
      .select('e.id', 'e.status', 'e.final_score', 'e.self_score', 'u.fullname');

    const totalEvaluations = evaluations.length;
    const approvedEvaluations = evaluations.filter((e) => e.status === 'APPROVED');

    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;

    for (const ev of approvedEvaluations) {
      const score = Number(ev.final_score) || 0;
      if (score >= 90) countA++;
      else if (score >= 70) countB++;
      else if (score >= 50) countC++;
      else countD++;
    }

    const evalCompletionRate =
      totalUsers > 0 ? Number(((approvedEvaluations.length / totalUsers) * 100).toFixed(1)) : 0;

    // 4. Department Progress Breakdown
    const departments = await db('departments').select('id', 'name');
    const departmentProgress = [];

    for (const d of departments) {
      const deptTasks = tasks.filter((t) => t.department_id === d.id);
      const deptCompleted = deptTasks.filter((t) => t.status === 'COMPLETED').length;
      const deptTotal = deptTasks.length;
      const rate = deptTotal > 0 ? Number(((deptCompleted / deptTotal) * 100).toFixed(1)) : 100;

      departmentProgress.push({
        id: d.id,
        name: d.name,
        total: deptTotal,
        completed: deptCompleted,
        rate,
      });
    }

    // 5. Urgent Tasks (Top 5 overdue or close to deadline)
    const urgentTasks = await db('tasks as t')
      .leftJoin('users as u', 't.assigned_to', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .whereNot('t.status', 'COMPLETED')
      .select(
        't.id',
        't.title',
        't.deadline',
        't.status',
        't.weight',
        'u.fullname as assignee_name',
        'd.name as department_name'
      )
      .orderBy('t.deadline', 'asc')
      .limit(5);

    const processedUrgent = urgentTasks.map((t) => ({
      ...t,
      is_overdue: new Date(t.deadline) < now,
    }));

    // 6. Top Evaluated Employees this month
    const topEmployees = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .where('e.month', currentMonth)
      .where('e.status', 'APPROVED')
      .select(
        'u.fullname',
        'u.position',
        'd.name as department_name',
        'e.final_score'
      )
      .orderBy('e.final_score', 'desc')
      .limit(5);

    res.status(200).json({
      month: currentMonth,
      summary: {
        totalUsers,
        totalDepartments,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        taskCompletionRate,
        totalEvaluations,
        approvedEvaluationsCount: approvedEvaluations.length,
        evalCompletionRate,
      },
      classifications: {
        countA,
        countB,
        countC,
        countD,
        totalApproved: approvedEvaluations.length,
      },
      departmentProgress,
      urgentTasks: processedUrgent,
      topEmployees,
    });
  } catch (err) {
    console.error('Lỗi lấy dữ liệu thống kê dashboard:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu thống kê.' });
  }
}

export async function exportEvaluationsExcel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const month = req.query.month ? String(req.query.month) : new Date().toISOString().slice(0, 7);

    const evaluations = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .leftJoin('users as u_mgr', 'e.manager_id', 'u_mgr.id')
      .leftJoin('users as u_appr', 'e.approver_id', 'u_appr.id')
      .where('e.month', month)
      .select(
        'e.id',
        'e.month',
        'e.status',
        'e.self_score',
        'e.manager_score',
        'e.final_score',
        'e.remarks',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'd.name as department_name',
        'u_mgr.fullname as manager_name',
        'u_appr.fullname as approver_name'
      )
      .orderBy('u.department_id', 'asc')
      .orderBy('u.id', 'asc');

    // Build Excel-compatible XML/HTML content
    const dateFormatted = new Date().toLocaleDateString('vi-VN');

    let rowsHtml = '';
    evaluations.forEach((ev, idx) => {
      const classification = ev.status === 'APPROVED' ? calculateClassification(ev.final_score) : 'Chưa duyệt';
      const statusText =
        ev.status === 'APPROVED'
          ? 'Đã phê duyệt'
          : ev.status === 'MANAGER_REVIEWED'
          ? 'Chờ Lãnh đạo duyệt'
          : ev.status === 'SUBMITTED'
          ? 'Chờ TP duyệt'
          : 'Bản nháp';

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #999;">${idx + 1}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${ev.employee_name}</td>
          <td style="border: 1px solid #999;">${ev.employee_position || ''}</td>
          <td style="border: 1px solid #999;">${ev.department_name || ''}</td>
          <td style="text-align: center; border: 1px solid #999;">${ev.self_score}</td>
          <td style="text-align: center; border: 1px solid #999;">${ev.status !== 'DRAFT' && ev.status !== 'SUBMITTED' ? ev.manager_score : ''}</td>
          <td style="text-align: center; border: 1px solid #999; font-weight: bold; color: #b91c1c;">${ev.status === 'APPROVED' ? ev.final_score : ''}</td>
          <td style="border: 1px solid #999; font-weight: bold;">${classification}</td>
          <td style="text-align: center; border: 1px solid #999;">${statusText}</td>
          <td style="border: 1px solid #999;">${ev.remarks || ''}</td>
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
                <x:Name>Bao_cao_danh_gia_${month}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; }
          .header-title { font-size: 16pt; font-weight: bold; text-align: center; color: #1e3a8a; }
          .sub-title { font-size: 12pt; text-align: center; font-style: italic; margin-bottom: 20px; }
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
            <td colspan="4" style="text-align: center; font-size: 11pt;">Số: ..... /BC-UBND</td>
            <td colspan="6" style="text-align: center; font-style: italic; font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="10" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="10" class="header-title">
              BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI CÁN BỘ, CÔNG CHỨC
            </td>
          </tr>
          <tr>
            <td colspan="10" class="sub-title">
              Kỳ đánh giá: Tháng ${month} — Căn cứ theo Nghị định số 335/2025/NĐ-CP
            </td>
          </tr>
        </table>

        <br/>

        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Họ và tên cán bộ</th>
              <th>Chức vụ / Vị trí việc làm</th>
              <th>Phòng ban / Bộ phận</th>
              <th style="width: 80px;">Điểm tự chấm</th>
              <th style="width: 80px;">Điểm TP duyệt</th>
              <th style="width: 80px;">Điểm Lãnh đạo</th>
              <th>Kết quả xếp loại (NĐ 335)</th>
              <th style="width: 110px;">Trạng thái</th>
              <th>Ghi chú / Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align: center; padding: 20px;">Chưa có dữ liệu đánh giá trong tháng này</td></tr>'}
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%;">
          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold;">NGƯỜI LẬP BIỂU</td>
            <td colspan="2"></td>
            <td colspan="4" style="text-align: center;">
              <em>Nghĩa Lâm, ngày ${dateFormatted}</em><br/>
              <strong>CHỦ TỊCH ỦY BAN NHÂN DÂN XÃ</strong>
            </td>
          </tr>
          <tr><td colspan="10" style="height: 60px;"></td></tr>
          <tr>
            <td colspan="4" style="text-align: center; font-style: italic;">(Ký, ghi rõ họ tên)</td>
            <td colspan="2"></td>
            <td colspan="4" style="text-align: center; font-style: italic;">(Ký, đóng dấu)</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bao_cao_danh_gia_CBCC_Nghia_Lam_${month}.xls"`
    );

    res.send('\uFEFF' + excelTemplate);
  } catch (err) {
    console.error('Lỗi xuất báo cáo Excel:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xuất báo cáo Excel.' });
  }
}
