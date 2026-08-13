import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';
import { emailService } from '../services/emailService';

export function calculateClassification(score: number, isDisciplined?: boolean): string {
  if (isDisciplined) return 'Không hoàn thành nhiệm vụ (Kỷ luật)';
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= 70) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= 50) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
}

export async function getEvaluations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const { month, department_id, status, employee_id } = req.query;

    let query = db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .leftJoin('users as u_mgr', 'e.manager_id', 'u_mgr.id')
      .leftJoin('users as u_appr', 'e.approver_id', 'u_appr.id')
      .select(
        'e.*',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'u.position_code as employee_position_code',
        'u.department_id as employee_department_id',
        'u.is_disciplined as employee_is_disciplined',
        'd.name as department_name',
        'u_mgr.fullname as manager_name',
        'u_appr.fullname as approver_name'
      );

    // Role-based scoping
    if (user.role === 'EMPLOYEE') {
      query = query.where('e.employee_id', user.id);
    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (user.department_id) {
        query = query.where((builder) => {
          builder.where('u.department_id', user.department_id).orWhere('e.employee_id', user.id);
        });
      } else {
        query = query.where('e.employee_id', user.id);
      }
    }

    if (month) query = query.where('e.month', String(month));
    if (department_id) query = query.where('u.department_id', Number(department_id));
    if (status) query = query.where('e.status', String(status));
    if (employee_id) query = query.where('e.employee_id', Number(employee_id));

    const evaluations = await query.orderBy('e.month', 'desc').orderBy('u.id', 'asc');

    const processed = evaluations.map((ev) => ({
      ...ev,
      classification:
        ev.status === 'APPROVED'
          ? calculateClassification(ev.final_score, ev.is_disciplined || ev.employee_is_disciplined)
          : null,
    }));

    res.status(200).json({ evaluations: processed });
  } catch (err) {
    console.error('Lỗi lấy danh sách đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách đánh giá.' });
  }
}

export async function getEvaluationById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const evaluation = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .leftJoin('users as u_mgr', 'e.manager_id', 'u_mgr.id')
      .leftJoin('users as u_appr', 'e.approver_id', 'u_appr.id')
      .where('e.id', Number(id))
      .select(
        'e.*',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'u.position_code as employee_position_code',
        'u.department_id as employee_department_id',
        'u.is_disciplined as employee_is_disciplined',
        'u.discipline_details as employee_discipline_details',
        'd.name as department_name',
        'u_mgr.fullname as manager_name',
        'u_appr.fullname as approver_name'
      )
      .first();

    if (!evaluation) {
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá này.' });
      return;
    }

    // Fetch details
    const details = await db('evaluation_details as ed')
      .join('product_catalog as pc', 'ed.product_catalog_id', 'pc.id')
      .leftJoin('tasks as t', 'ed.task_id', 't.id')
      .where('ed.evaluation_id', Number(id))
      .select(
        'ed.*',
        'pc.code as catalog_code',
        'pc.name as catalog_name',
        'pc.category as catalog_category',
        'pc.complexity_group as catalog_complexity_group',
        'pc.coefficient as catalog_coefficient',
        'pc.baseline_score as catalog_baseline_score',
        't.title as task_title',
        't.evidence as task_evidence'
      )
      .orderBy('ed.id', 'asc');

    // Fetch appeal if any
    const appeal = await db('evaluation_appeals')
      .where('evaluation_id', Number(id))
      .orderBy('id', 'desc')
      .first();

    res.status(200).json({
      evaluation: {
        ...evaluation,
        classification:
          evaluation.status === 'APPROVED'
            ? calculateClassification(evaluation.final_score, evaluation.is_disciplined || evaluation.employee_is_disciplined)
            : null,
        details,
        appeal: appeal || null,
      },
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết phiếu đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết phiếu đánh giá.' });
  }
}

export async function saveDraftEvaluation(req: AuthRequest, res: Response): Promise<void> {
  const trx = await db.transaction();
  try {
    const user = req.user;
    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const {
      month,
      items,
      remarks,
      criteria_politics_self = 15.0,
      criteria_expertise_self = 10.0,
      criteria_innovation_self = 5.0,
      leadership_unit_result = 100.0,
      leadership_execution = 100.0,
      leadership_solidarity = 100.0,
      collective_comments,
      party_cell_comments,
      special_case = 'NORMAL',
    } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      await trx.rollback();
      res.status(400).json({ message: 'Định dạng tháng không hợp lệ (Phải là YYYY-MM, ví dụ: 2026-08).' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await trx.rollback();
      res.status(400).json({ message: 'Phiếu đánh giá phải có ít nhất 1 sản phẩm / tiêu chí NĐ 335.' });
      return;
    }

    // 1. Calculate General Criteria Score (Part I: Max 30.0đ — Phụ lục I QĐ 283: 10đ + 10đ + 10đ)
    const pol = Math.min(10.0, Math.max(0, Number(criteria_politics_self) || 0));
    const exp = Math.min(10.0, Math.max(0, Number(criteria_expertise_self) || 0));
    const inn = Math.min(10.0, Math.max(0, Number(criteria_innovation_self) || 0));
    const generalScoreSelf = Number((pol + exp + inn).toFixed(2));

    // 2. Calculate 3-dimensional Task Score (Part II: 100đ scale -> 70%)
    let totalAssignedConverted = 0;
    let totalCompletedConverted = 0;
    let totalDelays = 0;
    let totalReworks = 0;
    const processedItems: any[] = [];

    for (const it of items) {
      const catalog = await trx('product_catalog').where('id', Number(it.product_catalog_id)).first();
      if (!catalog) {
        await trx.rollback();
        res.status(400).json({ message: `Sản phẩm danh mục ID ${it.product_catalog_id} không tồn tại.` });
        return;
      }

      const qty = Math.max(0.1, Number(it.quantity) || 1);
      const coeff = Number(catalog.coefficient) || 1.0;
      const unitBaseline = Number(catalog.baseline_score) || 5.0;
      const convertedQty = Number((qty * coeff).toFixed(2));

      totalAssignedConverted += convertedQty;
      totalCompletedConverted += convertedQty; // self assumes completed

      const rawPoints = Number((qty * unitBaseline * coeff).toFixed(2));

      processedItems.push({
        task_id: it.task_id ? Number(it.task_id) : null,
        product_catalog_id: Number(it.product_catalog_id),
        quantity: qty,
        self_points: rawPoints,
        manager_points: rawPoints,
        final_points: rawPoints,
        remarks: it.remarks ? it.remarks.trim() : null,
      });
    }

    // 3D calculation according to Home Affairs Handbook
    const qtyRate = totalAssignedConverted > 0 ? Math.min(100, (totalCompletedConverted / totalAssignedConverted) * 100) : 100;
    const progRate = Math.max(0, 100 - (totalDelays * 25));
    const qualRate = Math.max(0, 100 - (totalReworks * 25));

    let taskScore100 = (qtyRate + progRate + qualRate) / 3;

    // If Leadership position, combine 6 dimensions (a+b+c+d+e+f)/6
    const isLeadershipRole = ['LEADERSHIP', 'DEPARTMENT_HEAD'].includes(user.role);
    if (isLeadershipRole) {
      const d = Math.min(100, Math.max(0, Number(leadership_unit_result) || 100));
      const e = Math.min(100, Math.max(0, Number(leadership_execution) || 100));
      const f = Math.min(100, Math.max(0, Number(leadership_solidarity) || 100));
      taskScore100 = (qtyRate + progRate + qualRate + d + e + f) / 6;
    }

    taskScore100 = Math.min(100, Math.max(0, Number(taskScore100.toFixed(2))));

    // Total Score = General Criteria (max 30) + (Task Score 100 * 70%) = max 100.0
    const totalSelfScore = Math.min(100.0, Number((generalScoreSelf + (taskScore100 * 0.70)).toFixed(2)));

    // Check existing evaluation for this user & month
    let existing = await trx('evaluations')
      .where({ employee_id: user.id, month })
      .first();

    if (existing && existing.status !== 'DRAFT') {
      await trx.rollback();
      res.status(400).json({
        message: `Phiếu đánh giá tháng ${month} đã được gửi (${existing.status}), không thể lưu nháp lại.`,
      });
      return;
    }

    let evalId: number;

    const evalPayload = {
      employee_id: user.id,
      month,
      status: 'DRAFT',
      criteria_politics_self: pol,
      criteria_politics_mgr: pol,
      criteria_politics_final: pol,
      criteria_expertise_self: exp,
      criteria_expertise_mgr: exp,
      criteria_expertise_final: exp,
      criteria_innovation_self: inn,
      criteria_innovation_mgr: inn,
      criteria_innovation_final: inn,
      general_score_self: generalScoreSelf,
      general_score_mgr: generalScoreSelf,
      general_score_final: generalScoreSelf,
      task_score_self: taskScore100,
      task_score_mgr: taskScore100,
      task_score_final: taskScore100,
      leadership_unit_result: Number(leadership_unit_result) || 100,
      leadership_execution: Number(leadership_execution) || 100,
      leadership_solidarity: Number(leadership_solidarity) || 100,
      self_score: totalSelfScore,
      manager_score: totalSelfScore,
      final_score: totalSelfScore,
      collective_comments: collective_comments ? collective_comments.trim() : null,
      party_cell_comments: party_cell_comments ? party_cell_comments.trim() : null,
      special_case,
      remarks: remarks ? remarks.trim() : null,
      updated_at: new Date(),
    };

    if (existing) {
      evalId = existing.id;
      await trx('evaluations').where('id', evalId).update(evalPayload);
      await trx('evaluation_details').where('evaluation_id', evalId).del();
    } else {
      const [newId] = await trx('evaluations').insert({
        ...evalPayload,
        created_at: new Date(),
      });
      evalId = newId;
    }

    for (const it of processedItems) {
      await trx('evaluation_details').insert({
        ...it,
        evaluation_id: evalId,
      });
    }

    await trx.commit();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'SAVE_DRAFT_EVALUATION',
      `Lưu nháp đánh giá NĐ 335 tháng ${month}: Tổng ${totalSelfScore}đ (Chung: ${generalScoreSelf}đ + Nhiệm vụ: ${(taskScore100 * 0.7).toFixed(1)}đ)`,
      clientIp
    );

    res.status(200).json({
      message: 'Lưu nháp phiếu tự đánh giá theo NĐ 335 thành công!',
      evaluation_id: evalId,
      self_score: totalSelfScore,
      general_score: generalScoreSelf,
      task_score: taskScore100,
    });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi lưu nháp đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lưu nháp phiếu đánh giá.' });
  }
}

export async function submitSelfEvaluation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const evaluation = await db('evaluations').where('id', Number(id)).first();
    if (!evaluation) {
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá.' });
      return;
    }

    if (evaluation.employee_id !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Bạn không có quyền nộp phiếu đánh giá của người khác.' });
      return;
    }

    if (evaluation.status !== 'DRAFT') {
      res.status(400).json({ message: `Phiếu này đang ở trạng thái "${evaluation.status}", không thể nộp lại.` });
      return;
    }

    await db('evaluations').where('id', Number(id)).update({
      status: 'SUBMITTED',
      updated_at: new Date(),
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'SUBMIT_SELF_EVALUATION',
      `Nộp phiếu tự đánh giá tháng ${evaluation.month} (Tổng điểm tự chấm: ${evaluation.self_score})`,
      clientIp
    );

    res.status(200).json({ message: 'Nộp phiếu tự đánh giá lên Trưởng bộ phận thành công!' });
  } catch (err) {
    console.error('Lỗi nộp phiếu đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi nộp phiếu đánh giá.' });
  }
}

export async function reviewByManager(req: AuthRequest, res: Response): Promise<void> {
  const trx = await db.transaction();
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      items,
      criteria_politics_mgr,
      criteria_expertise_mgr,
      criteria_innovation_mgr,
      collective_comments,
      remarks,
    } = req.body;

    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!['DEPARTMENT_HEAD', 'LEADERSHIP', 'ADMIN'].includes(user.role)) {
      await trx.rollback();
      res.status(403).json({ message: 'Chỉ Trưởng phòng/bộ phận hoặc Lãnh đạo mới có quyền đánh giá cấp phòng.' });
      return;
    }

    const evaluation = await trx('evaluations').where('id', Number(id)).first();
    if (!evaluation) {
      await trx.rollback();
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá.' });
      return;
    }

    if (evaluation.status === 'APPROVED') {
      await trx.rollback();
      res.status(400).json({ message: 'Phiếu đánh giá đã được Lãnh đạo phê duyệt, không thể sửa đổi.' });
      return;
    }

    // Manager General Score (Phụ lục I QĐ 283: 10đ + 10đ + 10đ)
    const pol = criteria_politics_mgr !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_politics_mgr))) : (evaluation.criteria_politics_self ?? 0.0);
    const exp = criteria_expertise_mgr !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_expertise_mgr))) : (evaluation.criteria_expertise_self ?? 0.0);
    const inn = criteria_innovation_mgr !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_innovation_mgr))) : (evaluation.criteria_innovation_self ?? 0.0);
    const generalScoreMgr = Number((pol + exp + inn).toFixed(2));

    // Manager Task Details
    if (items && Array.isArray(items)) {
      for (const it of items) {
        const mgrPts = Number(it.manager_points) || 0;
        await trx('evaluation_details')
          .where({ id: Number(it.id), evaluation_id: Number(id) })
          .update({
            manager_points: mgrPts,
            final_points: mgrPts,
            remarks: it.remarks ? it.remarks.trim() : null,
          });
      }
    }

    const taskScoreMgr = evaluation.task_score_self ?? 0.0; // default
    const totalManagerScore = Math.min(100.0, Number((generalScoreMgr + (taskScoreMgr * 0.70)).toFixed(2)));

    await trx('evaluations')
      .where('id', Number(id))
      .update({
        status: 'MANAGER_REVIEWED',
        criteria_politics_mgr: pol,
        criteria_expertise_mgr: exp,
        criteria_innovation_mgr: inn,
        general_score_mgr: generalScoreMgr,
        general_score_final: generalScoreMgr,
        manager_score: totalManagerScore,
        final_score: totalManagerScore,
        manager_id: user.id,
        collective_comments: collective_comments ? collective_comments.trim() : evaluation.collective_comments,
        remarks: remarks ? remarks.trim() : evaluation.remarks,
        updated_at: new Date(),
      });

    await trx.commit();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'MANAGER_REVIEW_EVALUATION',
      `Trưởng phòng ${user.fullname} thẩm định phiếu ID ${id} -> Tổng điểm: ${totalManagerScore}`,
      clientIp
    );

    res.status(200).json({
      message: 'Trưởng bộ phận thẩm định và chuyển lên Lãnh đạo xã thành công!',
      manager_score: totalManagerScore,
      general_score: generalScoreMgr,
    });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi thẩm định phiếu của trưởng phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi thẩm định phiếu đánh giá.' });
  }
}

export async function approveByLeadership(req: AuthRequest, res: Response): Promise<void> {
  const trx = await db.transaction();
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      items,
      final_score,
      criteria_politics_final,
      criteria_expertise_final,
      criteria_innovation_final,
      party_cell_comments,
      is_special_quota_case,
      special_quota_justification,
      remarks,
    } = req.body;

    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!['LEADERSHIP', 'ADMIN'].includes(user.role)) {
      await trx.rollback();
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã (Chủ tịch / PCT) mới có quyền phê duyệt kết quả cuối cùng.' });
      return;
    }

    const evaluation = await trx('evaluations')
      .join('users as u', 'evaluations.employee_id', 'u.id')
      .where('evaluations.id', Number(id))
      .select('evaluations.*', 'u.is_disciplined as employee_is_disciplined')
      .first();

    if (!evaluation) {
      await trx.rollback();
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá.' });
      return;
    }

    const pol = criteria_politics_final !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_politics_final))) : (evaluation.criteria_politics_mgr ?? 0.0);
    const exp = criteria_expertise_final !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_expertise_final))) : (evaluation.criteria_expertise_mgr ?? 0.0);
    const inn = criteria_innovation_final !== undefined ? Math.min(10.0, Math.max(0, Number(criteria_innovation_final))) : (evaluation.criteria_innovation_mgr ?? 0.0);
    const generalScoreFinal = Number((pol + exp + inn).toFixed(2));

    if (items && Array.isArray(items)) {
      for (const it of items) {
        const finalPts = Number(it.final_points !== undefined ? it.final_points : it.manager_points) || 0;
        await trx('evaluation_details')
          .where({ id: Number(it.id), evaluation_id: Number(id) })
          .update({
            final_points: finalPts,
            remarks: it.remarks ? it.remarks.trim() : null,
          });
      }
    }

    let calculatedFinalScore = final_score !== undefined ? Number(final_score) : Number((generalScoreFinal + ((evaluation.task_score_mgr ?? 0.0) * 0.70)).toFixed(2));
    calculatedFinalScore = Math.min(100.0, Math.max(0, calculatedFinalScore));

    const isDisciplined = evaluation.is_disciplined || evaluation.employee_is_disciplined;
    const classification = calculateClassification(calculatedFinalScore, isDisciplined);

    await trx('evaluations')
      .where('id', Number(id))
      .update({
        status: 'APPROVED',
        criteria_politics_final: pol,
        criteria_expertise_final: exp,
        criteria_innovation_final: inn,
        general_score_final: generalScoreFinal,
        final_score: calculatedFinalScore,
        approver_id: user.id,
        party_cell_comments: party_cell_comments ? party_cell_comments.trim() : evaluation.party_cell_comments,
        is_special_quota_case: Boolean(is_special_quota_case),
        special_quota_justification: special_quota_justification ? special_quota_justification.trim() : null,
        remarks: remarks ? remarks.trim() : evaluation.remarks,
        updated_at: new Date(),
      });

    await trx.commit();

    // Trigger Email Notification in Background
    (async () => {
      try {
        const emp = await db('users as u')
          .leftJoin('departments as d', 'u.department_id', 'd.id')
          .where('u.id', evaluation.employee_id)
          .select('u.id', 'u.fullname', 'u.email', 'u.position', 'u.position_code', 'd.name as department_name')
          .first();

        if (emp && emp.email) {
          await emailService.sendEvaluationResultEmail({
            employee: emp,
            evaluation: {
              id: Number(id),
              month: evaluation.month,
              general_score: generalScoreFinal,
              task_score: evaluation.task_score_mgr || 100,
              final_score: calculatedFinalScore,
              classification,
              remarks: remarks ? remarks.trim() : evaluation.remarks,
              party_cell_comments: party_cell_comments ? party_cell_comments.trim() : evaluation.party_cell_comments,
            },
            approver: {
              fullname: user.fullname,
              position: user.position,
            },
          });
        }
      } catch (e: any) {
        console.error('Lỗi gửi email thông báo kết quả đánh giá:', e.message);
      }
    })();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'APPROVE_EVALUATION',
      `Lãnh đạo UBND xã phê duyệt phiếu ID ${id} (Tháng ${evaluation.month}) -> Điểm: ${calculatedFinalScore} (${classification})`,
      clientIp
    );

    res.status(200).json({
      message: 'Lãnh đạo UBND xã phê duyệt kết quả đánh giá thành công!',
      final_score: calculatedFinalScore,
      classification,
    });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi phê duyệt phiếu của lãnh đạo:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi phê duyệt phiếu đánh giá.' });
  }
}

export async function getQuotaStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { month } = req.query;
    if (!month) {
      res.status(400).json({ message: 'Vui lòng chọn tháng thống kê (YYYY-MM).' });
      return;
    }

    const approved = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .where('e.month', String(month))
      .where('e.status', 'APPROVED')
      .select('e.id', 'e.final_score', 'e.is_disciplined', 'u.is_disciplined as user_disciplined', 'e.is_special_quota_case');

    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;

    approved.forEach((ev) => {
      const cls = calculateClassification(ev.final_score, ev.is_disciplined || ev.user_disciplined);
      if (cls.includes('xuất sắc')) countA++;
      else if (cls.includes('tốt')) countB++;
      else if (cls.includes('Hoàn thành nhiệm vụ')) countC++;
      else countD++;
    });

    const totalEligible = countA + countB; // Base for 20% calculation
    const typeARatio = totalEligible > 0 ? Number(((countA / totalEligible) * 100).toFixed(1)) : 0;
    const maxAllowedA = Math.max(1, Math.floor(totalEligible * 0.20));
    const isExceedingQuota = totalEligible > 0 && countA > maxAllowedA;

    res.status(200).json({
      month,
      total_approved: approved.length,
      count_a: countA,
      count_b: countB,
      count_c: countC,
      count_d: countD,
      total_eligible: totalEligible,
      type_a_ratio_percent: typeARatio,
      max_allowed_quota_a: maxAllowedA,
      is_exceeding_quota: isExceedingQuota,
      special_case_limit_percent: 25.0,
    });
  } catch (err) {
    console.error('Lỗi lấy thống kê hạn mức:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê hạn mức.' });
  }
}

export async function submitAppeal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    const { reason, evidence_url } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do kiến nghị kết quả đánh giá.' });
      return;
    }

    const evaluation = await db('evaluations').where('id', Number(id)).first();
    if (!evaluation) {
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá này.' });
      return;
    }

    if (evaluation.employee_id !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Chỉ cán bộ được đánh giá mới có quyền gửi kiến nghị.' });
      return;
    }

    if (evaluation.status !== 'APPROVED') {
      res.status(400).json({ message: 'Chỉ có thể gửi kiến nghị sau khi kết quả đã được Lãnh đạo phê duyệt chính thức.' });
      return;
    }

    // Decree 335: 7 working days deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const [appealId] = await db('evaluation_appeals').insert({
      evaluation_id: Number(id),
      employee_id: user.id,
      reason: reason.trim(),
      evidence_url: evidence_url ? evidence_url.trim() : null,
      status: 'PENDING',
      created_at: new Date(),
      deadline_at: deadline,
    });

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'SUBMIT_APPEAL',
      `Gửi đơn kiến nghị kết quả đánh giá tháng ${evaluation.month} (Phiếu ID ${id})`,
      clientIp
    );

    res.status(200).json({
      message: 'Đã gửi đơn kiến nghị kết quả đánh giá thành công! Thời hạn giải quyết theo quy định là 7 ngày làm việc.',
      appeal_id: appealId,
      deadline_at: deadline.toISOString(),
    });
  } catch (err) {
    console.error('Lỗi gửi kiến nghị:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi kiến nghị.' });
  }
}

export async function getAppeals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    let query = db('evaluation_appeals as ea')
      .join('evaluations as e', 'ea.evaluation_id', 'e.id')
      .join('users as u', 'ea.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .leftJoin('users as u_res', 'ea.resolved_by', 'u_res.id')
      .select(
        'ea.*',
        'e.month as evaluation_month',
        'e.final_score as evaluation_final_score',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'd.name as department_name',
        'u_res.fullname as resolver_name'
      );

    if (user.role === 'EMPLOYEE') {
      query = query.where('ea.employee_id', user.id);
    }

    const appeals = await query.orderBy('ea.created_at', 'desc');

    const enriched = appeals.map((a) => {
      const now = new Date();
      const deadline = new Date(a.deadline_at);
      const isOverdue = a.status === 'PENDING' && deadline < now;
      const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        ...a,
        is_overdue: isOverdue,
        days_remaining: daysRemaining,
      };
    });

    res.status(200).json({ appeals: enriched });
  } catch (err) {
    console.error('Lỗi lấy danh sách kiến nghị:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách kiến nghị.' });
  }
}

export async function resolveAppeal(req: AuthRequest, res: Response): Promise<void> {
  const trx = await db.transaction();
  try {
    const user = req.user;
    const { appealId } = req.params;
    const { status, response_text, adjusted_score } = req.body;

    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    if (!['LEADERSHIP', 'ADMIN'].includes(user.role)) {
      await trx.rollback();
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã mới có thẩm quyền giải quyết kiến nghị đánh giá.' });
      return;
    }

    const appeal = await trx('evaluation_appeals').where('id', Number(appealId)).first();
    if (!appeal) {
      await trx.rollback();
      res.status(404).json({ message: 'Không tìm thấy đơn kiến nghị này.' });
      return;
    }

    if (appeal.status !== 'PENDING') {
      await trx.rollback();
      res.status(400).json({ message: 'Đơn kiến nghị này đã được xử lý trước đó.' });
      return;
    }

    await trx('evaluation_appeals')
      .where('id', Number(appealId))
      .update({
        status: status || 'ACCEPTED',
        response_text: response_text ? response_text.trim() : null,
        resolved_by: user.id,
        resolved_at: new Date(),
        updated_at: new Date(),
      });

    // If accepted and adjusted score provided, update evaluation
    if (status === 'ACCEPTED' && adjusted_score !== undefined) {
      const newScore = Math.min(100.0, Math.max(0, Number(adjusted_score)));
      await trx('evaluations')
        .where('id', appeal.evaluation_id)
        .update({
          final_score: newScore,
          remarks: `Đã điều chỉnh điểm sau khi giải quyết kiến nghị ID #${appealId}: ${response_text || ''}`,
          updated_at: new Date(),
        });
    }

    await trx.commit();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'RESOLVE_APPEAL',
      `Giải quyết kiến nghị ID #${appealId} -> Trạng thái: ${status || 'ACCEPTED'}`,
      clientIp
    );

    res.status(200).json({ message: 'Giải quyết đơn kiến nghị kết quả đánh giá thành công!' });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi giải quyết kiến nghị:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi giải quyết kiến nghị.' });
  }
}

export async function deleteEvaluation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || !['ADMIN', 'LEADERSHIP'].includes(user.role)) {
      res.status(403).json({ message: 'Chỉ Quản trị viên hoặc Lãnh đạo UBND xã mới có quyền xóa phiếu đánh giá.' });
      return;
    }

    await db('evaluation_details').where('evaluation_id', Number(id)).del();
    await db('evaluation_appeals').where('evaluation_id', Number(id)).del();
    await db('evaluations').where('id', Number(id)).del();

    res.status(200).json({ message: 'Đã xóa phiếu đánh giá thành công.' });
  } catch (err) {
    console.error('Lỗi xóa phiếu đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa phiếu đánh giá.' });
  }
}

/**
 * Gửi lại email kết quả đánh giá cho 1 cán bộ
 */
export async function sendEvaluationEmail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const evaluation = await db('evaluations as e')
      .join('users as u', 'e.employee_id', 'u.id')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .where('e.id', Number(id))
      .select('e.*', 'u.id as user_id', 'u.fullname', 'u.email', 'u.position', 'u.position_code', 'd.name as department_name')
      .first();

    if (!evaluation) {
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá.' });
      return;
    }

    if (!evaluation.email) {
      res.status(400).json({ message: `Cán bộ ${evaluation.fullname} chưa có thông tin email trong hệ thống.` });
      return;
    }

    const result = await emailService.sendEvaluationResultEmail({
      employee: {
        id: evaluation.user_id,
        fullname: evaluation.fullname,
        email: evaluation.email,
        position: evaluation.position,
        position_code: evaluation.position_code,
        department_name: evaluation.department_name,
      },
      evaluation: {
        id: evaluation.id,
        month: evaluation.month,
        general_score: evaluation.general_score_final || evaluation.general_score_mgr || 28.5,
        task_score: evaluation.task_score_mgr || 100,
        final_score: evaluation.final_score || 0,
        classification: evaluation.classification || 'Hoàn thành tốt nhiệm vụ',
        remarks: evaluation.remarks,
        party_cell_comments: evaluation.party_cell_comments,
        collective_comments: evaluation.collective_comments,
      },
      approver: {
        fullname: user.fullname,
        position: user.position,
      },
    });

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (err: any) {
    console.error('Lỗi gửi email đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi email thông báo: ' + err.message });
  }
}

/**
 * Gửi email thông báo kết quả đánh giá đồng loạt cho toàn xã trong tháng
 */
export async function batchSendEvaluationEmails(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { month } = req.body;

    if (!user || !['ADMIN', 'LEADERSHIP'].includes(user.role)) {
      res.status(403).json({ message: 'Chỉ Quản trị viên hoặc Lãnh đạo UBND xã mới có quyền gửi thông báo hàng loạt.' });
      return;
    }

    if (!month) {
      res.status(400).json({ message: 'Vui lòng cung cấp tháng cần gửi thông báo (YYYY-MM).' });
      return;
    }

    const result = await emailService.sendBatchMonthlyEvaluationEmails(month);

    res.status(200).json({
      message: `Đã hoàn tất gửi email thông báo tháng ${month}: Thành công ${result.sent}/${result.total} cán bộ.`,
      result,
    });
  } catch (err: any) {
    console.error('Lỗi gửi email hàng loạt:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi email hàng loạt: ' + err.message });
  }
}
