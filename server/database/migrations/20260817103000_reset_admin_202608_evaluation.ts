import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if evaluation for employee_id = 1 (admin) and month = '2026-08' exists
  const evaluation = await knex('evaluations')
    .where({ employee_id: 1, month: '2026-08' })
    .first();

  if (evaluation) {
    // Recalculate based on actual items
    const details = await knex('evaluation_details')
      .where({ evaluation_id: evaluation.id });

    let sumSelfPoints = 0;
    for (const d of details) {
      sumSelfPoints += Number(d.self_points) || 0;
    }

    const generalScoreSelf = Number((
      (Number(evaluation.criteria_politics_self) || 0) +
      (Number(evaluation.criteria_expertise_self) || 0) +
      (Number(evaluation.criteria_innovation_self) || 0)
    ).toFixed(2));

    const cappedTaskScore70 = Math.min(70.0, sumSelfPoints);
    const taskScoreSelf100 = Number((cappedTaskScore70 / 0.70).toFixed(2));
    const newSelfScore = Number((generalScoreSelf + cappedTaskScore70).toFixed(2));

    // Update evaluation
    await knex('evaluations')
      .where({ id: evaluation.id })
      .update({
        status: 'DRAFT',
        self_score: newSelfScore,
        manager_score: newSelfScore,
        final_score: newSelfScore,
        task_score_self: taskScoreSelf100,
        task_score_mgr: taskScoreSelf100,
        task_score_final: taskScoreSelf100,
        updated_at: new Date(),
      });

    // Write audit log
    await knex('audit_logs').insert({
      user_id: 1,
      action: 'RESET_DEMO_DATA_B2',
      details: `Reset và recalculate phiêu đánh giá admin tháng 08/2026 từ 95đ về ${newSelfScore}đ (Phần II: ${cappedTaskScore70}đ)`,
      old_value: `self_score: ${evaluation.self_score}, status: ${evaluation.status}`,
      new_value: `self_score: ${newSelfScore}, status: DRAFT`,
      reason: 'Sửa lỗi tính toán điểm Phần II luôn hiển thị 70/70',
      created_at: new Date().toISOString(),
    });

    console.log(`[MIGRATION] Reset demo evaluation for employee 1, month 2026-08 successfully. Score: ${newSelfScore}`);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Safe down: do nothing
}
