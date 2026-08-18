/**
 * KPI Calculation Engine for Commune Civil Servants (CBCC)
 * Strictly conforms to Decree 335/2025/ND-CP, Ministry of Home Affairs Guidelines,
 * Decision 283/QD-UBND & Regulation 295-QD/DU of Nghia Lam Commune.
 * 
 * Engine Code: ND335_OFFICIAL_ABC_2026.08.1
 */

export type CalculationStrategy = 'ND335_OFFICIAL_ABC' | 'WEIGHTED_DETAIL_SCORE' | 'COMPLETION_RATIO';

export interface KPILineItemInput {
  task_id?: number | null;
  product_catalog_id: number;
  quantity?: number;
  assigned_quantity?: number;
  accepted_quantity?: number;
  baseline_score?: number;
  coefficient?: number;
  points?: number; // Validated points (self/manager/final)
  remarks?: string | null;
  delays?: number;
  reworks?: number;
  is_exempted_delay?: boolean;
  is_exempted_rework?: boolean;
}

export interface KPICalculationInput {
  strategy?: CalculationStrategy;
  criteria_politics: number;
  criteria_expertise: number;
  criteria_innovation: number;
  items: KPILineItemInput[];
  is_leadership_role?: boolean;
  leadership_unit_result?: number; // Component d (0-100%)
  leadership_execution?: number;   // Component đ (0-100%)
  leadership_solidarity?: number;  // Component e (0-100%)
  penalty_multiplier?: number;
}

export interface KPICalculatedLine {
  task_id?: number | null;
  product_catalog_id: number;
  quantity: number;
  assigned_quantity: number;
  accepted_quantity: number;
  baseline_score: number;
  coefficient: number;
  converted_assigned: number;
  converted_accepted: number;
  line_score: number;
  quality_ratio: number;
  progress_ratio: number;
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
  components: {
    assigned_converted_total: number;
    completed_converted_total: number;
    a_quantity_ratio: number;
    b_quality_ratio: number;
    c_progress_ratio: number;
    d_unit_result?: number;
    dd_execution?: number;
    e_solidarity?: number;
    task_overall_ratio: number;
  };
  auditFormula: {
    taskSectionMax: number;
    penaltyMultiplier: number;
    formula: string;
    componentsSummary: string;
    insufficientData?: boolean;
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

export function calculateClassification(score: number, isDisciplined?: boolean): string {
  if (isDisciplined) return 'Không hoàn thành nhiệm vụ (Kỷ luật)';
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= 70) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= 50) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
}

export function calculateKPIScore(input: KPICalculationInput): KPICalculationResult {
  const version = 'ND335_OFFICIAL_ABC_2026.08.1';
  const strategy: CalculationStrategy = input.strategy || 'ND335_OFFICIAL_ABC';

  // 1. Validate General Criteria (Part I: Max 30.0 points)
  const pol = validateNumericField(input.criteria_politics, 'Tiêu chí chính trị, tư tưởng', 0, 10);
  const exp = validateNumericField(input.criteria_expertise, 'Tiêu chí chuyên môn, nghiệp vụ', 0, 10);
  const inn = validateNumericField(input.criteria_innovation, 'Tiêu chí đổi mới, sáng tạo', 0, 10);
  const commonCriteriaScore = Number((pol + exp + inn).toFixed(2));

  // 2. Validate Items (Part II)
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Phiếu đánh giá phải có ít nhất 1 sản phẩm / tiêu chí NĐ 335.');
  }

  const calculatedLines: KPICalculatedLine[] = [];
  let assignedConvertedTotal = 0;
  let completedConvertedTotal = 0;
  let qualityConvertedTotal = 0;
  let onTimeConvertedTotal = 0;
  let sumDirectLineScores = 0;

  for (const it of input.items) {
    const rawQty = it.quantity !== undefined ? it.quantity : (it.assigned_quantity ?? 1);
    const assignedQty = validateNumericField(it.assigned_quantity ?? rawQty, 'Số lượng giao', 0.01, 10000);
    const acceptedQty = validateNumericField(it.accepted_quantity ?? rawQty, 'Số lượng nghiệm thu', 0, 10000);
    const baseline = validateNumericField(it.baseline_score ?? 5.0, 'Điểm chuẩn sản phẩm', 0.1, 100);
    const coeff = validateNumericField(it.coefficient ?? 1.0, 'Hệ số quy đổi K', 0.1, 100);

    const convertedAssigned = Number((assignedQty * coeff).toFixed(4));
    const convertedAccepted = Number((acceptedQty * coeff).toFixed(4));

    assignedConvertedTotal += convertedAssigned;
    completedConvertedTotal += convertedAccepted;

    // Quality calculation (25% deduction per unexempted rework)
    const reworks = it.is_exempted_rework ? 0 : (Number(it.reworks) || 0);
    const qualityRatio = Math.max(0.0, 1.0 - (reworks * 0.25));
    qualityConvertedTotal += convertedAccepted * qualityRatio;

    // Progress calculation (25% deduction per unexempted delay)
    const delays = it.is_exempted_delay ? 0 : (Number(it.delays) || 0);
    const progressRatio = Math.max(0.0, 1.0 - (delays * 0.25));
    onTimeConvertedTotal += convertedAccepted * progressRatio;

    // Direct line points if manually specified or computed from baseline
    let lineScore = 0;
    if (it.points !== undefined && it.points !== null) {
      lineScore = validateNumericField(it.points, 'Điểm dòng chi tiết', 0, 100);
    } else {
      lineScore = Number((acceptedQty * baseline * coeff * qualityRatio * progressRatio).toFixed(2));
    }
    sumDirectLineScores += lineScore;

    calculatedLines.push({
      task_id: it.task_id,
      product_catalog_id: it.product_catalog_id,
      quantity: acceptedQty,
      assigned_quantity: assignedQty,
      accepted_quantity: acceptedQty,
      baseline_score: baseline,
      coefficient: coeff,
      converted_assigned: convertedAssigned,
      converted_accepted: convertedAccepted,
      line_score: lineScore,
      quality_ratio: qualityRatio,
      progress_ratio: progressRatio,
      remarks: it.remarks,
    });
  }

  // 3. Components a, b, c ratios according to Decree 335
  const isZeroDenominator = assignedConvertedTotal <= 0;
  const a_quantity_ratio = isZeroDenominator ? 0.0 : Math.min(1.0, Number((completedConvertedTotal / assignedConvertedTotal).toFixed(4)));
  const b_quality_ratio = isZeroDenominator ? 0.0 : Math.min(1.0, Math.max(0.0, Number((qualityConvertedTotal / assignedConvertedTotal).toFixed(4))));
  const c_progress_ratio = isZeroDenominator ? 0.0 : Math.min(1.0, Math.max(0.0, Number((onTimeConvertedTotal / assignedConvertedTotal).toFixed(4))));

  // 4. Leadership components d, đ, e (if applicable)
  const isLeadership = Boolean(input.is_leadership_role);
  let d_unit_result = 1.0;
  let dd_execution = 1.0;
  let e_solidarity = 1.0;
  let taskOverallRatio = 0.0;

  if (isLeadership) {
    const rawD = input.leadership_unit_result !== undefined ? validateNumericField(input.leadership_unit_result, 'Thành tố d', 0, 100) : 100.0;
    const rawDd = input.leadership_execution !== undefined ? validateNumericField(input.leadership_execution, 'Thành tố đ', 0, 100) : 100.0;
    const rawE = input.leadership_solidarity !== undefined ? validateNumericField(input.leadership_solidarity, 'Thành tố e', 0, 100) : 100.0;

    d_unit_result = Number((rawD / 100.0).toFixed(4));
    dd_execution = Number((rawDd / 100.0).toFixed(4));
    e_solidarity = Number((rawE / 100.0).toFixed(4));

    taskOverallRatio = Number(((a_quantity_ratio + b_quality_ratio + c_progress_ratio + d_unit_result + dd_execution + e_solidarity) / 6.0).toFixed(4));
  } else {
    taskOverallRatio = Number(((a_quantity_ratio + b_quality_ratio + c_progress_ratio) / 3.0).toFixed(4));
  }

  // 5. Compute Final Task Score (Part II: Max 70.0 points)
  const penaltyMultiplier = input.penalty_multiplier !== undefined
    ? validateNumericField(input.penalty_multiplier, 'Hệ số phạt tiến độ/chất lượng', 0, 1)
    : 1.0;

  let taskScore = 0.0;

  // If specific item points are provided, we preserve exact item points summation (capped at 70.0)
  // while checking that empty/zero denominator returns 0 / insufficient data
  if (isZeroDenominator && sumDirectLineScores === 0) {
    taskScore = 0.0;
  } else if (sumDirectLineScores > 0) {
    const rawTaskScore = sumDirectLineScores * penaltyMultiplier;
    taskScore = Math.min(70.0, Math.max(0.0, Number(rawTaskScore.toFixed(2))));
  } else {
    const rawTaskScore = taskOverallRatio * 70.0 * penaltyMultiplier;
    taskScore = Math.min(70.0, Math.max(0.0, Number(rawTaskScore.toFixed(2))));
  }

  const totalScore = Math.min(100.0, Math.max(0.0, Number((commonCriteriaScore + taskScore).toFixed(2))));
  const rating = calculateClassification(totalScore);

  const formulaSummary = isLeadership
    ? `TaskScore = min(70, 70 * (a + b + c + d + đ + e) / 6) = min(70, 70 * (${(a_quantity_ratio*100).toFixed(1)}% + ${(b_quality_ratio*100).toFixed(1)}% + ${(c_progress_ratio*100).toFixed(1)}% + ${(d_unit_result*100).toFixed(1)}% + ${(dd_execution*100).toFixed(1)}% + ${(e_solidarity*100).toFixed(1)}%) / 6)`
    : `TaskScore = min(70, sum(line_points)) = min(70, ${sumDirectLineScores.toFixed(2)} * ${penaltyMultiplier})`;

  return {
    calculationStrategy: strategy,
    calculationVersion: version,
    commonCriteriaScore,
    taskScore,
    totalScore,
    rating,
    taskLines: calculatedLines,
    components: {
      assigned_converted_total: Number(assignedConvertedTotal.toFixed(4)),
      completed_converted_total: Number(completedConvertedTotal.toFixed(4)),
      a_quantity_ratio: a_quantity_ratio,
      b_quality_ratio: b_quality_ratio,
      c_progress_ratio: c_progress_ratio,
      ...(isLeadership ? { d_unit_result, dd_execution, e_solidarity } : {}),
      task_overall_ratio: taskOverallRatio,
    },
    auditFormula: {
      taskSectionMax: 70,
      penaltyMultiplier,
      formula: formulaSummary,
      componentsSummary: `a=${(a_quantity_ratio*100).toFixed(1)}%, b=${(b_quality_ratio*100).toFixed(1)}%, c=${(c_progress_ratio*100).toFixed(1)}%`,
      insufficientData: isZeroDenominator,
    },
  };
}
