/**
 * KPI Calculation Engine for Commune Civil Servants (CBCC)
 * Strictly conforms to Decree 335/2025/ND-CP & Nghia Lam Commune Regulation 295-QD/DU
 */

export type CalculationStrategy = 'WEIGHTED_DETAIL_SCORE' | 'COMPLETION_RATIO';

export interface KPILineItemInput {
  task_id?: number | null;
  product_catalog_id: number;
  quantity: number;
  baseline_score?: number;
  coefficient?: number;
  points?: number; // validated points if manually evaluated (self/mgr/final)
  remarks?: string | null;
  delays?: number;
  reworks?: number;
}

export interface KPICalculationInput {
  strategy?: CalculationStrategy;
  criteria_politics: number;
  criteria_expertise: number;
  criteria_innovation: number;
  items: KPILineItemInput[];
  is_leadership_role?: boolean;
  leadership_unit_result?: number;
  leadership_execution?: number;
  leadership_solidarity?: number;
  penalty_multiplier?: number;
}

export interface KPICalculatedLine {
  task_id?: number | null;
  product_catalog_id: number;
  quantity: number;
  baseline_score: number;
  coefficient: number;
  line_score: number;
  remarks?: string | null;
}

export interface KPICalculationResult {
  calculationStrategy: CalculationStrategy;
  calculationVersion: string;
  commonCriteriaScore: number;
  taskScore: number;
  totalScore: number;
  rating: string | null;
  taskLines: KPICalculatedLine[];
  auditFormula: {
    taskSectionMax: number;
    penaltyMultiplier: number;
    formula: string;
  };
}

export function validateNumericField(val: any, fieldName: string, min = 0, max = 100): number {
  if (val === undefined || val === null) return 0;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Trường "${fieldName}" không hợp lệ (không phải là số hữu hạn).`);
  }
  if (num < min) {
    throw new Error(`Trường "${fieldName}" không được nhỏ hơn ${min}.`);
  }
  if (num > max) {
    throw new Error(`Trường "${fieldName}" không được vượt quá ${max}.`);
  }
  return num;
}

export function calculateKPIScore(input: KPICalculationInput): KPICalculationResult {
  const strategy: CalculationStrategy = input.strategy || 'WEIGHTED_DETAIL_SCORE';
  const version = '2026.08.1';

  // 1. Validate General Criteria (Part I: 30đ max)
  const pol = validateNumericField(input.criteria_politics, 'Tiêu chí chính trị, tư tưởng', 0, 10);
  const exp = validateNumericField(input.criteria_expertise, 'Tiêu chí chuyên môn, nghiệp vụ', 0, 10);
  const inn = validateNumericField(input.criteria_innovation, 'Tiêu chí đổi mới, sáng tạo', 0, 10);
  const commonCriteriaScore = Number((pol + exp + inn).toFixed(2));

  // 2. Validate Items (Part II)
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Phiếu đánh giá phải có ít nhất 1 sản phẩm / tiêu chí NĐ 335.');
  }

  const calculatedLines: KPICalculatedLine[] = [];
  let sumLineScores = 0;

  for (const it of input.items) {
    const qty = validateNumericField(it.quantity, 'Số lượng sản phẩm', 0.01, 10000);
    const baseline = validateNumericField(it.baseline_score ?? 5.0, 'Điểm chuẩn', 0.1, 100);
    const coeff = validateNumericField(it.coefficient ?? 1.0, 'Hệ số quy đổi K', 0.1, 100);

    let lineScore = 0;
    if (it.points !== undefined && it.points !== null) {
      lineScore = validateNumericField(it.points, 'Điểm dòng chi tiết', 0, 100);
    } else {
      lineScore = Number((qty * baseline * coeff).toFixed(2));
    }

    sumLineScores += lineScore;

    calculatedLines.push({
      task_id: it.task_id,
      product_catalog_id: it.product_catalog_id,
      quantity: qty,
      baseline_score: baseline,
      coefficient: coeff,
      line_score: lineScore,
      remarks: it.remarks,
    });
  }

  // 3. Penalty Multiplier (if any delays/reworks)
  const penaltyMultiplier = input.penalty_multiplier !== undefined
    ? validateNumericField(input.penalty_multiplier, 'Hệ số phạt tiến độ/chất lượng', 0, 1)
    : 1.0;

  let taskScore = 0;

  if (strategy === 'WEIGHTED_DETAIL_SCORE') {
    // Current Commune Strategy: Directly sum validated row points, capped at 70đ
    const rawTaskScore = sumLineScores * penaltyMultiplier;
    taskScore = Math.min(70.0, Math.max(0.0, Number(rawTaskScore.toFixed(2))));
  } else {
    // COMPLETION_RATIO Strategy (if activated)
    taskScore = Math.min(70.0, Math.max(0.0, Number((sumLineScores * 0.70).toFixed(2))));
  }

  const totalScore = Math.min(100.0, Math.max(0.0, Number((commonCriteriaScore + taskScore).toFixed(2))));

  return {
    calculationStrategy: strategy,
    calculationVersion: version,
    commonCriteriaScore,
    taskScore,
    totalScore,
    rating: null,
    taskLines: calculatedLines,
    auditFormula: {
      taskSectionMax: 70,
      penaltyMultiplier,
      formula: 'min(70, sum(validated line scores) * penaltyMultiplier)',
    },
  };
}
