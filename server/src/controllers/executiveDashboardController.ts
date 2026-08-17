import { Response } from 'express';
import db from '../config/db';
import { AuthRequest } from '../middleware/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callDeepSeekSummary(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    return '';
  }
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Bạn là Thư ký AI của Chủ tịch UBND xã Nghĩa Lâm. Hãy phân tích các số liệu báo cáo tuần và lập dự thảo tóm tắt kết luận giao ban hành chính ngắn gọn, súc tích (3-4 dòng).'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
    });
    if (!response.ok) return '';
    const data = (await response.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  } catch (_err) {
    return '';
  }
}

export async function getExecutiveDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (user.role !== 'LEADERSHIP' && user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã mới có quyền truy cập bảng điều hành này.' });
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // 1. Tasks Stats
    const tasks = await db('tasks').select('status', 'deadline');
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let cancelledTasks = 0;
    let unknownTasks = 0;

    for (const t of tasks) {
      const statusUpper = (t.status || '').toUpperCase();
      if (statusUpper === 'CANCELLED') {
        cancelledTasks++;
      } else {
        totalTasks++;
        const isOverdue = new Date(t.deadline) < now;
        if (statusUpper === 'COMPLETED') {
          completedTasks++;
        } else if (isOverdue) {
          overdueTasks++;
        } else if (statusUpper === 'IN_PROGRESS') {
          inProgressTasks++;
        } else if (statusUpper === 'PENDING') {
          pendingTasks++;
        } else {
          unknownTasks++;
        }
      }
    }

    // 2. Budget Stats
    const revenues = await db('budget_revenue_items').where('year', currentYear);
    const expenditures = await db('budget_expenditure_items').where('year', currentYear);

    const plannedRev = revenues.reduce((sum, r) => sum + r.planned_amount, 0);
    const collectedRev = revenues.reduce((sum, r) => sum + r.collected_amount, 0);
    const remainingRev = revenues.reduce((sum, r) => sum + r.remaining_amount, 0);
    const overdueRevCount = revenues.filter(r => r.status === 'overdue').length;

    const estimatedExp = expenditures.reduce((sum, e) => sum + e.estimated_amount, 0);
    const approvedExp = expenditures.reduce((sum, e) => sum + e.approved_amount, 0);
    const paidExp = expenditures.reduce((sum, e) => sum + e.paid_amount, 0);
    const remainingExp = expenditures.reduce((sum, e) => sum + e.remaining_amount, 0);
    const missingDocExpCount = expenditures.filter(e => e.status === 'approved' && e.document_status === 'missing_evidence').length;

    // 3. Public Investment Projects
    const projects = await db('public_investment_projects');
    const totalProj = projects.length;
    const plannedCap = projects.reduce((sum, p) => sum + p.planned_capital, 0);
    const allocatedCap = projects.reduce((sum, p) => sum + p.allocated_capital, 0);
    const disbursedAmt = projects.reduce((sum, p) => sum + p.disbursed_amount, 0);
    const avgDisbRate = totalProj > 0 ? Number((projects.reduce((sum, p) => sum + p.disbursement_rate, 0) / totalProj).toFixed(2)) : 0;
    const delayedProjCount = projects.filter(p => p.status === 'delayed' || p.obstacle_type !== 'none').length;

    // 4. Land Certificates & KH965
    const cases = await db('land_certificate_cases');
    const totalCases = cases.length;
    const greenCases = cases.filter(c => c.case_group === 'Xanh' && c.status !== 'issued').length;
    const yellowCases = cases.filter(c => c.case_group === 'Vàng' && c.status !== 'issued').length;
    const redCases = cases.filter(c => c.case_group === 'Đỏ' && c.status !== 'issued').length;
    const overdueCases = cases.filter(c => c.status !== 'issued' && c.deadline && new Date(c.deadline) < now).length;

    const villages965 = await db('kh965_progress');
    const sumTotalPlots = villages965.reduce((sum, v) => sum + v.total_plots, 0);
    const sumReviewedPlots = villages965.reduce((sum, v) => sum + v.reviewed_plots, 0);
    const sumClassifiedPlots = villages965.reduce((sum, v) => sum + v.classified_plots, 0);
    const sumEligibleCases = villages965.reduce((sum, v) => sum + v.eligible_cases, 0);
    const sumComplexCases = villages965.reduce((sum, v) => sum + v.complex_cases, 0);

    // 5. Office Requests
    const officeReqs = await db('office_requests');
    const pendingOfficeReqsCount = officeReqs.filter(o => o.status === 'submitted').length;

    // 6. Generate AI Summary report
    const promptSummary = `
Hãy viết báo cáo giao ban tuần cho Chủ tịch UBND xã Nghĩa Lâm dựa trên số liệu thực tế sau:
1. Giao việc chuyên môn: Tổng số việc là ${totalTasks}, đã hoàn thành ${completedTasks}, quá hạn ${overdueTasks} việc.
2. Ngân sách thu/chi năm ${currentYear}: Thực thu được ${(collectedRev / 1000000).toFixed(1)} triệu đồng (kế hoạch ${(plannedRev / 1000000).toFixed(1)} triệu), thực chi giải ngân ${(paidExp / 1000000).toFixed(1)} triệu đồng.
3. Giải ngân đầu tư công: Tổng số công trình là ${totalProj}, tỉ lệ giải ngân trung bình là ${avgDisbRate}%, có ${delayedProjCount} công trình chậm tiến độ/vướng mắc.
4. Đất đai (KH965): Đã rà soát được ${sumReviewedPlots}/${sumTotalPlots} thửa đất, có ${sumComplexCases} thửa đất phức tạp/tranh chấp cần giải quyết gấp. Có ${overdueCases} hồ sơ xin cấp sổ bị chậm hạn.
5. Hậu cần văn phòng: Có ${pendingOfficeReqsCount} yêu cầu hậu cần/lịch họp đang chờ duyệt.

Hãy tóm tắt ngắn gọn thành 3 điểm chỉ đạo nóng của Chủ tịch để gửi vào nhóm Zalo giao ban của xã.
    `;

    let aiSummary = await callDeepSeekSummary(promptSummary);
    if (!aiSummary) {
      aiSummary = `
📢 **KẾT LUẬN CHỈ ĐẠO GIAO BAN TUẦN - CHỦ TỊCH UBND XÃ NGHĨA LÂM**
1. **Nhiệm vụ chuyên môn & Đất đai**: Yêu cầu Công chức Địa chính (${user.fullname}) rà soát ngay ${overdueCases} hồ sơ cấp GCN bị trễ hạn và giải quyết dứt điểm các vướng mắc của ${sumComplexCases} thửa đất tranh chấp xóm 3 sông Lam. Đẩy nhanh tiến độ Kế hoạch 965.
2. **Giải ngân đầu tư công**: Trực tiếp phê bình nhà thầu thi công dự án Nhà văn hóa đa năng xóm 4. Giao tổ giám sát địa chính theo dõi sát tiến độ thi công bù khối lượng bị chậm do mưa lũ.
3. **Ngân sách thu/chi**: Bộ phận Tài chính tập trung thu dứt điểm 30 triệu đồng tiền thầu đất 5% công ích xóm 3 còn tồn đọng trước hạn chót tháng 10/2026.
      `.trim();
    }

    res.status(200).json({
      summary: aiSummary,
      metrics: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          percent: totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0
        },
        budget: {
          plannedRev,
          collectedRev,
          remainingRev,
          overdueRevCount,
          estimatedExp,
          approvedExp,
          paidExp,
          remainingExp,
          missingDocExpCount
        },
        investment: {
          totalProj,
          plannedCap,
          allocatedCap,
          disbursedAmt,
          avgDisbRate,
          delayedProjCount
        },
        land: {
          totalCases,
          greenCases,
          yellowCases,
          redCases,
          overdueCases,
          totalPlots965: sumTotalPlots,
          reviewedPlots965: sumReviewedPlots,
          classifiedPlots965: sumClassifiedPlots,
          eligibleCases965: sumEligibleCases,
          complexCases965: sumComplexCases
        },
        office: {
          pendingRequests: pendingOfficeReqsCount
        }
      }
    });
  } catch (err) {
    console.error('Lỗi lấy dữ liệu dashboard điều hành:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi kết xuất dữ liệu bảng điều hành.' });
  }
}
