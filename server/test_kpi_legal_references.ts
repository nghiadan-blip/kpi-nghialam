import { calculateKPIScore, KPI_LEGAL_REFERENCES } from './src/services/kpiCalculationEngine';

console.log('========================================================================');
console.log('⚖️ KIỂM THỬ TRUY XUẤT CĂN CỨ PHÁP LÝ & ĐIỀU KHOẢN NGHỊ ĐỊNH 335/2025/NĐ-CP');
console.log('========================================================================');

let passed = 0;
let failed = 0;

function check(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name} -> ${detail || ''}`);
    failed++;
  }
}

// -------------------------------------------------------------
// Test 1: Kiểm tra bộ hằng số căn cứ pháp lý chính thức
// -------------------------------------------------------------
check(
  KPI_LEGAL_REFERENCES.GENERAL_AND_TASK_SCALE === 'ND335_2025_NDCP_ART12' &&
  KPI_LEGAL_REFERENCES.WORK_CATALOG_AND_CONVERSION === 'ND335_2025_NDCP_ART13' &&
  KPI_LEGAL_REFERENCES.EMPLOYEE_EVALUATION_ABC === 'ND335_2025_NDCP_ART14' &&
  KPI_LEGAL_REFERENCES.LEADERSHIP_EVALUATION_ABCDE === 'ND335_2025_NDCP_ART15' &&
  KPI_LEGAL_REFERENCES.TASK_SCORE_FORMULAS === 'ND335_2025_NDCP_ART16' &&
  KPI_LEGAL_REFERENCES.TOTAL_SCORE_SYNTHESIS === 'ND335_2025_NDCP_ART17' &&
  KPI_LEGAL_REFERENCES.OFFICIAL_CLASSIFICATION === 'ND335_2025_NDCP_ART20' &&
  KPI_LEGAL_REFERENCES.APPEAL_AND_PETITION === 'ND335_2025_NDCP_ART24',
  'Bộ hằng số pháp lý đối chiếu chính xác từng Điều của NĐ 335 (Điều 12, 13, 14, 15, 16, 17, 20, 24)',
  JSON.stringify(KPI_LEGAL_REFERENCES)
);

// -------------------------------------------------------------
// Test 2: Công chức chuyên môn - ND335_OFFICIAL_ABC
// -------------------------------------------------------------
const empResult = calculateKPIScore({
  strategy: 'ND335_OFFICIAL_ABC',
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [{ product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1 }],
});

check(
  empResult.legalBasisId === KPI_LEGAL_REFERENCES.EMPLOYEE_EVALUATION_ABC &&
  empResult.articleReference.includes('Điều 14') &&
  empResult.articleReference.includes('Điều 16 khoản 1') &&
  empResult.strategyStatus === 'OFFICIAL_ACTIVE' &&
  empResult.rating === 'Hoàn thành xuất sắc nhiệm vụ',
  'Công chức chuyên môn trả về đúng căn cứ Điều 14, Điều 16 khoản 1 và trạng thái OFFICIAL_ACTIVE',
  JSON.stringify({ legalBasisId: empResult.legalBasisId, articleReference: empResult.articleReference })
);

// -------------------------------------------------------------
// Test 3: Công chức Lãnh đạo - ND335_OFFICIAL_ABC
// -------------------------------------------------------------
const leaderResult = calculateKPIScore({
  strategy: 'ND335_OFFICIAL_ABC',
  is_leadership_role: true,
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  leadership_unit_result: 100,
  leadership_execution: 100,
  leadership_solidarity: 100,
  items: [{ product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1 }],
});

check(
  leaderResult.legalBasisId === KPI_LEGAL_REFERENCES.LEADERSHIP_EVALUATION_ABCDE &&
  leaderResult.articleReference.includes('Điều 15') &&
  leaderResult.articleReference.includes('Điều 16 khoản 2') &&
  leaderResult.strategyStatus === 'OFFICIAL_ACTIVE' &&
  leaderResult.rating === 'Hoàn thành xuất sắc nhiệm vụ',
  'Công chức Lãnh đạo trả về đúng căn cứ Điều 15, Điều 16 khoản 2 và trạng thái OFFICIAL_ACTIVE',
  JSON.stringify({ legalBasisId: leaderResult.legalBasisId, articleReference: leaderResult.articleReference })
);

// -------------------------------------------------------------
// Test 4: WEIGHTED_DETAIL_SCORE bị vô hiệu hóa xếp loại chính thức
// -------------------------------------------------------------
const weightedResult = calculateKPIScore({
  strategy: 'WEIGHTED_DETAIL_SCORE',
  criteria_politics: 10,
  criteria_expertise: 10,
  criteria_innovation: 10,
  items: [{ product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, points: 25 }],
});

check(
  weightedResult.strategyStatus === 'DISABLED_FOR_OFFICIAL_RATING' &&
  weightedResult.rating === null &&
  weightedResult.auditFormula.legalNote?.includes('LOCAL_POLICY_PROPOSAL') &&
  weightedResult.auditFormula.legalNote?.includes('LEGAL_REVIEW_REQUIRED'),
  'WEIGHTED_DETAIL_SCORE bị vô hiệu hóa xếp loại chính thức (rating=null, DISABLED_FOR_OFFICIAL_RATING)',
  JSON.stringify({ strategyStatus: weightedResult.strategyStatus, rating: weightedResult.rating, legalNote: weightedResult.auditFormula.legalNote })
);

console.log('\n========================================================================');
console.log(`📊 TỔNG KẾT KIỂM THỬ CĂN CỨ PHÁP LÝ: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
