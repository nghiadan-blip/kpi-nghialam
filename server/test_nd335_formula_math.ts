import { calculateKPIScore, KPI_CONSTANTS } from './src/services/kpiCalculationEngine';

console.log('========================================================================');
console.log('📐 BẮT ĐẦU KIỂM THỬ TOÁN HỌC ĐỘC LẬP THEO NGHỊ ĐỊNH 335 (ND335_OFFICIAL_ABC)');
console.log('========================================================================');

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} -> ${detail || ''}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// Test 1: 1/1 hoàn thành, đạt chất lượng, đúng hạn -> a=100%, b=100%, c=100%, Phần II = 70/70
// -------------------------------------------------------------
const res1 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, coefficient: 1.0 }
  ]
});
assert(
  res1.components.a_quantity_ratio === 1.0 &&
  res1.components.b_quality_ratio === 1.0 &&
  res1.components.c_progress_ratio === 1.0 &&
  res1.taskScore === 70.0 &&
  res1.totalScore === 100.0 &&
  res1.rating === 'Hoàn thành xuất sắc nhiệm vụ',
  '1/1 hoàn thành, chất lượng, đúng hạn -> 70/70đ Phần II, 100/100đ Tổng',
  JSON.stringify({ taskScore: res1.taskScore, components: res1.components })
);

// -------------------------------------------------------------
// Test 2: 5/5 hoàn thành -> tỷ lệ vẫn 100%, Phần II = 70/70 (không tăng điểm tùy tiện)
// -------------------------------------------------------------
const res2 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 5, coefficient: 1.0 }
  ]
});
assert(
  res2.components.a_quantity_ratio === 1.0 &&
  res2.taskScore === 70.0 &&
  res2.totalScore === 100.0,
  '5/5 hoàn thành -> Tỷ lệ 100%, Phần II = 70/70đ chuẩn xác',
  JSON.stringify({ taskScore: res2.taskScore, components: res2.components })
);

// -------------------------------------------------------------
// Test 3: 1/5 hoàn thành -> a=20%, b=20%, c=20% -> Phần II = 14/70đ
// -------------------------------------------------------------
const res3 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 1, coefficient: 1.0 }
  ]
});
assert(
  res3.components.a_quantity_ratio === 0.2 &&
  res3.components.b_quality_ratio === 0.2 &&
  res3.components.c_progress_ratio === 0.2 &&
  res3.taskScore === 14.0 &&
  res3.totalScore === 44.0 &&
  res3.rating === 'Không hoàn thành nhiệm vụ',
  '1/5 hoàn thành -> Tỷ lệ 20%, Phần II = 14/70đ, Tổng = 44/100đ (< 50đ Không hoàn thành)',
  JSON.stringify({ taskScore: res3.taskScore, components: res3.components })
);

// -------------------------------------------------------------
// Test 4: 0/5 hoàn thành -> a=0%, b=0%, c=0% -> Phần II = 0/70đ
// -------------------------------------------------------------
const res4 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 0, coefficient: 1.0 }
  ]
});
assert(
  res4.components.a_quantity_ratio === 0.0 &&
  res4.components.b_quality_ratio === 0.0 &&
  res4.components.c_progress_ratio === 0.0 &&
  res4.taskScore === 0.0 &&
  res4.totalScore === 30.0,
  '0/5 hoàn thành -> Tỷ lệ 0%, Phần II = 0/70đ, Tổng = 30/100đ',
  JSON.stringify({ taskScore: res4.taskScore })
);

// -------------------------------------------------------------
// Test 5: 1/1 hoàn thành nhưng có 1 lần chậm tiến độ (-25% tiến độ c)
// -------------------------------------------------------------
const res5 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, delays: 1, coefficient: 1.0 }
  ]
});
assert(
  res5.components.a_quantity_ratio === 1.0 &&
  res5.components.b_quality_ratio === 1.0 &&
  res5.components.c_progress_ratio === 0.75 &&
  res5.taskScore === 64.17 &&
  res5.totalScore === 94.17,
  '1 lần chậm tiến độ (c=75%) -> Phần II = 64.17/70đ, Tổng = 94.17/100đ',
  JSON.stringify({ taskScore: res5.taskScore, components: res5.components })
);

// -------------------------------------------------------------
// Test 6: 1/1 hoàn thành nhưng có 1 lần làm lại lỗi chất lượng (-25% chất lượng b)
// -------------------------------------------------------------
const res6 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, reworks: 1, coefficient: 1.0 }
  ]
});
assert(
  res6.components.a_quantity_ratio === 1.0 &&
  res6.components.b_quality_ratio === 0.75 &&
  res6.components.c_progress_ratio === 1.0 &&
  res6.taskScore === 64.17 &&
  res6.totalScore === 94.17,
  '1 lần làm lại (b=75%) -> Phần II = 64.17/70đ, Tổng = 94.17/100đ',
  JSON.stringify({ taskScore: res6.taskScore, components: res6.components })
);

// -------------------------------------------------------------
// Test 7: Miễn trừ lý do khách quan (is_exempted_delay & is_exempted_rework)
// -------------------------------------------------------------
const res7 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    {
      product_catalog_id: 1,
      assigned_quantity: 1,
      accepted_quantity: 1,
      delays: 2,
      reworks: 2,
      is_exempted_delay: true,
      is_exempted_rework: true,
      coefficient: 1.0
    }
  ]
});
assert(
  res7.components.a_quantity_ratio === 1.0 &&
  res7.components.b_quality_ratio === 1.0 &&
  res7.components.c_progress_ratio === 1.0 &&
  res7.taskScore === 70.0,
  'Miễn trừ khách quan -> Bảo toàn 100% b và c, Phần II = 70.0/70đ',
  JSON.stringify({ taskScore: res7.taskScore, components: res7.components })
);

// -------------------------------------------------------------
// Test 8: Mẫu số bằng 0 (assigned = 0) -> insufficientData: true, Phần II = 0đ
// -------------------------------------------------------------
const res8 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [
    { product_catalog_id: 1, assigned_quantity: 0, accepted_quantity: 0, coefficient: 1.0 }
  ]
});
assert(
  res8.auditFormula.insufficientData === true &&
  res8.taskScore === 0.0 &&
  res8.totalScore === 30.0,
  'Mẫu số bằng 0 -> insufficientData=true, Phần II = 0.0/70đ',
  JSON.stringify({ taskScore: res8.taskScore, auditFormula: res8.auditFormula })
);

// -------------------------------------------------------------
// Test 9: Công chức Lãnh đạo (6 thành tố a, b, c, d, đ, e)
// -------------------------------------------------------------
const res9 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  is_leadership_role: true,
  leadership_unit_result: 80,  // d = 80%
  leadership_execution: 90,    // đ = 90%
  leadership_solidarity: 100,  // e = 100%
  items: [
    { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, coefficient: 1.0 }
  ]
});
// a=1, b=1, c=1, d=0.8, dd=0.9, e=1.0 -> Sum = 5.7 / 6 = 0.95 -> 0.95 * 70 = 66.5đ
assert(
  res9.components.d_unit_result === 0.8 &&
  res9.components.dd_execution === 0.9 &&
  res9.components.e_solidarity === 1.0 &&
  res9.taskScore === 66.5 &&
  res9.totalScore === 96.5,
  'Lãnh đạo 6 thành tố (a,b,c=1, d=0.8, đ=0.9, e=1.0) -> Phần II = 66.5/70đ',
  JSON.stringify({ taskScore: res9.taskScore, components: res9.components })
);

// -------------------------------------------------------------
// Test 10: Metadata và cấu hình động (legal_basis_id, version, effective_from)
// -------------------------------------------------------------
const res10 = calculateKPIScore({
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  config: {
    legal_basis_id: 'QD_283_UBND_NGHIA_LAM',
    version: 'ND335_OFFICIAL_ABC_2026.08.1',
    effective_from: '2026-06-01',
    max_task_score: 70.0,
    max_general_score: 30.0,
    max_total_score: 100.0,
  },
  items: [
    { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, coefficient: 1.0 }
  ]
});
assert(
  res10.legalBasisId === 'QD_283_UBND_NGHIA_LAM' &&
  res10.calculationVersion === 'ND335_OFFICIAL_ABC_2026.08.1' &&
  res10.effectiveFrom === '2026-06-01' &&
  res10.auditFormula.taskSectionMax === 70.0,
  'Bộ tiêu chí cấu hình động kèm metadata pháp lý đầy đủ',
  JSON.stringify({ legalBasisId: res10.legalBasisId, version: res10.calculationVersion })
);

console.log('\n========================================================================');
console.log(`📊 TỔNG KẾT: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('========================================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
