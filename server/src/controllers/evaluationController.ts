import { Response } from 'express';
import db from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

function calculateClassification(score: number): string {
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
        'e.id',
        'e.employee_id',
        'e.month',
        'e.status',
        'e.self_score',
        'e.manager_score',
        'e.final_score',
        'e.manager_id',
        'e.approver_id',
        'e.remarks',
        'e.created_at',
        'e.updated_at',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'u.department_id as employee_department_id',
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
    // LEADERSHIP and ADMIN can see all

    if (month) {
      query = query.where('e.month', String(month));
    }
    if (department_id) {
      query = query.where('u.department_id', Number(department_id));
    }
    if (status) {
      query = query.where('e.status', String(status));
    }
    if (employee_id) {
      query = query.where('e.employee_id', Number(employee_id));
    }

    const evaluations = await query.orderBy('e.month', 'desc').orderBy('u.id', 'asc');

    const processed = evaluations.map((ev) => ({
      ...ev,
      classification: ev.status === 'APPROVED' ? calculateClassification(ev.final_score) : null,
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
        'e.id',
        'e.employee_id',
        'e.month',
        'e.status',
        'e.self_score',
        'e.manager_score',
        'e.final_score',
        'e.manager_id',
        'e.approver_id',
        'e.remarks',
        'e.created_at',
        'e.updated_at',
        'u.fullname as employee_name',
        'u.position as employee_position',
        'u.department_id as employee_department_id',
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
        'ed.id',
        'ed.evaluation_id',
        'ed.task_id',
        'ed.product_catalog_id',
        'ed.quantity',
        'ed.self_points',
        'ed.manager_points',
        'ed.final_points',
        'ed.remarks',
        'pc.code as catalog_code',
        'pc.name as catalog_name',
        'pc.category as catalog_category',
        'pc.coefficient as catalog_coefficient',
        'pc.baseline_score as catalog_baseline_score',
        't.title as task_title',
        't.evidence as task_evidence'
      )
      .orderBy('ed.id', 'asc');

    res.status(200).json({
      evaluation: {
        ...evaluation,
        classification: evaluation.status === 'APPROVED' ? calculateClassification(evaluation.final_score) : null,
        details,
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

    const { month, items, remarks } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      await trx.rollback();
      res.status(400).json({ message: 'Định dạng tháng đánh giá không hợp lệ (Phải là YYYY-MM, ví dụ: 2026-08).' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await trx.rollback();
      res.status(400).json({ message: 'Phiếu đánh giá phải có ít nhất 1 sản phẩm/tiêu chí.' });
      return;
    }

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

    let rawSelfScore = 0;
    const processedItems: any[] = [];

    for (const it of items) {
      const catalog = await trx('product_catalog').where('id', Number(it.product_catalog_id)).first();
      if (!catalog) {
        await trx.rollback();
        res.status(400).json({ message: `Sản phẩm danh mục ID ${it.product_catalog_id} không tồn tại.` });
        return;
      }

      const qty = Number(it.quantity) || 1;
      const unitPoint = (catalog.baseline_score || 5.0) * (catalog.coefficient || 1.0);
      const selfPoints = Number((qty * unitPoint).toFixed(2));
      rawSelfScore += selfPoints;

      processedItems.push({
        task_id: it.task_id ? Number(it.task_id) : null,
        product_catalog_id: Number(it.product_catalog_id),
        quantity: qty,
        self_points: selfPoints,
        manager_points: selfPoints,
        final_points: selfPoints,
        remarks: it.remarks ? it.remarks.trim() : null,
      });
    }

    // Decree 335: Cap monthly score at 100.0 maximum
    const totalSelfScore = Math.min(100.0, Number(rawSelfScore.toFixed(2)));

    let evalId: number;

    if (existing) {
      evalId = existing.id;
      await trx('evaluations')
        .where('id', evalId)
        .update({
          self_score: totalSelfScore,
          manager_score: totalSelfScore,
          final_score: totalSelfScore,
          remarks: remarks ? remarks.trim() : null,
          updated_at: new Date(),
        });

      // Clear existing details
      await trx('evaluation_details').where('evaluation_id', evalId).del();
    } else {
      const [newId] = await trx('evaluations').insert({
        employee_id: user.id,
        month,
        status: 'DRAFT',
        self_score: totalSelfScore,
        manager_score: totalSelfScore,
        final_score: totalSelfScore,
        remarks: remarks ? remarks.trim() : null,
      });
      evalId = newId;
    }

    // Insert details
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
      `Lưu nháp phiếu tự đánh giá tháng ${month}: ${totalSelfScore} điểm`,
      clientIp
    );

    res.status(200).json({
      message: 'Lưu nháp phiếu tự đánh giá thành công!',
      evaluation_id: evalId,
      self_score: totalSelfScore,
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
    const { items, remarks } = req.body;

    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    // Check permission: Must be DEPARTMENT_HEAD, LEADERSHIP or ADMIN
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

    let rawManagerScore = 0;

    if (items && Array.isArray(items)) {
      for (const it of items) {
        const mgrPts = Number(it.manager_points) || 0;
        rawManagerScore += mgrPts;

        await trx('evaluation_details')
          .where({ id: Number(it.id), evaluation_id: Number(id) })
          .update({
            manager_points: mgrPts,
            final_points: mgrPts, // default final to manager
            remarks: it.remarks ? it.remarks.trim() : null,
          });
      }
    } else {
      rawManagerScore = evaluation.self_score;
    }

    const totalManagerScore = Math.min(100.0, Number(rawManagerScore.toFixed(2)));

    await trx('evaluations')
      .where('id', Number(id))
      .update({
        status: 'MANAGER_REVIEWED',
        manager_score: totalManagerScore,
        final_score: totalManagerScore,
        manager_id: user.id,
        remarks: remarks ? remarks.trim() : evaluation.remarks,
        updated_at: new Date(),
      });

    await trx.commit();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'MANAGER_REVIEW_EVALUATION',
      `Trưởng phòng ${user.fullname} đánh giá phiếu ID ${id} (Tháng ${evaluation.month}) -> Điểm: ${totalManagerScore}`,
      clientIp
    );

    res.status(200).json({
      message: 'Trưởng bộ phận đánh giá và chuyển lên Lãnh đạo xã thành công!',
      manager_score: totalManagerScore,
    });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi duyệt phiếu của trưởng phòng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi duyệt phiếu đánh giá.' });
  }
}

export async function approveByLeadership(req: AuthRequest, res: Response): Promise<void> {
  const trx = await db.transaction();
  try {
    const user = req.user;
    const { id } = req.params;
    const { items, final_score, remarks } = req.body;

    if (!user) {
      await trx.rollback();
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    // Permission: LEADERSHIP or ADMIN
    if (!['LEADERSHIP', 'ADMIN'].includes(user.role)) {
      await trx.rollback();
      res.status(403).json({ message: 'Chỉ Lãnh đạo UBND xã (Chủ tịch / PCT) mới có quyền phê duyệt kết quả cuối cùng.' });
      return;
    }

    const evaluation = await trx('evaluations').where('id', Number(id)).first();
    if (!evaluation) {
      await trx.rollback();
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá.' });
      return;
    }

    let rawFinalScore = 0;

    if (items && Array.isArray(items)) {
      for (const it of items) {
        const finalPts = Number(it.final_points !== undefined ? it.final_points : it.manager_points) || 0;
        rawFinalScore += finalPts;

        await trx('evaluation_details')
          .where({ id: Number(it.id), evaluation_id: Number(id) })
          .update({
            final_points: finalPts,
            remarks: it.remarks ? it.remarks.trim() : null,
          });
      }
    } else {
      rawFinalScore = final_score !== undefined ? Number(final_score) : evaluation.manager_score;
    }

    const calculatedFinalScore = Math.min(100.0, Number(rawFinalScore.toFixed(2)));
    const classification = calculateClassification(calculatedFinalScore);

    await trx('evaluations')
      .where('id', Number(id))
      .update({
        status: 'APPROVED',
        final_score: calculatedFinalScore,
        approver_id: user.id,
        remarks: remarks ? remarks.trim() : evaluation.remarks,
        updated_at: new Date(),
      });

    await trx.commit();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(
      user.id,
      'APPROVE_EVALUATION',
      `Lãnh đạo ${user.fullname} phê duyệt phiếu ID ${id} (Tháng ${evaluation.month}) -> ${calculatedFinalScore} điểm (${classification})`,
      clientIp
    );

    res.status(200).json({
      message: 'Phê duyệt đánh giá và xếp loại thành công!',
      final_score: calculatedFinalScore,
      classification,
    });
  } catch (err) {
    await trx.rollback();
    console.error('Lỗi phê duyệt của lãnh đạo:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi phê duyệt đánh giá.' });
  }
}

export async function deleteEvaluation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Chưa xác thực danh tính.' });
      return;
    }

    const evaluation = await db('evaluations').where('id', Number(id)).first();
    if (!evaluation) {
      res.status(404).json({ message: 'Không tìm thấy phiếu đánh giá cần xóa.' });
      return;
    }

    if (evaluation.status !== 'DRAFT' && user.role !== 'ADMIN') {
      res.status(400).json({ message: 'Chỉ có thể xóa phiếu đánh giá khi đang ở trạng thái nháp (DRAFT).' });
      return;
    }

    if (evaluation.employee_id !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Bạn không có quyền xóa phiếu đánh giá này.' });
      return;
    }

    await db('evaluations').where('id', Number(id)).del();

    const clientIp = req.ip || req.socket.remoteAddress;
    await logAudit(user.id, 'DELETE_EVALUATION', `Xóa phiếu đánh giá tháng ${evaluation.month}`, clientIp);

    res.status(200).json({ message: 'Đã xóa phiếu đánh giá thành công.' });
  } catch (err) {
    console.error('Lỗi xóa phiếu đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa phiếu đánh giá.' });
  }
}
