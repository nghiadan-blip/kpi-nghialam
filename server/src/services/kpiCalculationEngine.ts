/**
 * KPI Calculation Engine for Commune Civil Servants (CBCC)
 * Strictly conforms to Decree 335/2025/ND-CP, Ministry of Home Affairs Guidelines,
 * Decision 283/QD-UBND & Regulation 295-QD/DU of Nghia Lam Commune.
 * 
 * Engine Code: ND335_OFFICIAL_ABC_2026.08.1
 */

export type CalculationStrategy = 'ND335_OFFICIAL_ABC' | 'WEIGHTED_DETAIL_SCORE' | 'COMPLETION_RATIO';

export const KPI_LEGAL_REFERENCES = {
  GENERAL_AND_TASK_SCALE: 'ND335_2025_NDCP_ART12',         // Điều 12: Thang điểm 30/70
  WORK_CATALOG_AND_CONVERSION: 'ND335_2025_NDCP_ART13',    // Điều 13: Danh mục sản phẩm & Hệ số K
  EMPLOYEE_EVALUATION_ABC: 'ND335_2025_NDCP_ART14',        // Điều 14: Đánh giá công chức chuyên môn (a, b, c)
  LEADERSHIP_EVALUATION_ABCDE: 'ND335_2025_NDCP_ART15',    // Điều 15: Đánh giá công chức lãnh đạo (a, b, c, d, đ, e)
  TASK_SCORE_FORMULAS: 'ND335_2025_NDCP_ART16',            // Điều 16: Công thức tính điểm Phần II ((a+b+c)/3 hoặc (a+b+c+d+đ+e)/6)
  TOTAL_SCORE_SYNTHESIS: 'ND335_2025_NDCP_ART17',          // Điều 17: Tổng hợp điểm (Phần I + Phần II x 70)
  OFFICIAL_CLASSIFICATION: 'ND335_2025_NDCP_ART20',        // Điều 20: Ngưỡng và tỷ lệ xếp loại chất lượng
  APPEAL_AND_PETITION: 'ND335_2025_NDCP_ART24',            // Điều 24: Khiếu nại, phản ánh, kiến nghị đánh giá
};

export interface KPICriteriaConfig {
  legal_basis_id?: string;
  version?: string;
  effective_from?: string;
  max_general_score?: number;
  max_politics_score?: number;
  max_expertise_score?: number;
  max_innovation_score?: number;
  max_task_score?: number;
  max_total_score?: number;
  excellent_threshold?: number;
  good_threshold?: number;
  satisfactory_threshold?: number;
  delay_penalty_rate?: number;
  rework_penalty_rate?: number;
}

export interface KPILineItemInput {
  task_id?: number | null;
  product_catalog_id: number;
  quantity?: number;
  assigned_quantity?: number;
  accepted_quantity?: number;
  baseline_score?: number;
  coefficient?: number;
  points?: number; // Validated points (only used when strategy is WEIGHTED_DETAIL_SCORE)
  remarks?: string | null;
  delays?: number;
  reworks?: number;
  is_exempted_delay?: boolean;
  is_exempted_rework?: boolean;
}

export interface KPICalculationInput {
  strategy?: CalculationStrategy;
  config?: KPICriteriaConfig;
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
  legalBasisId: string;
  articleReference: string;
  effectiveFrom: string;
  commonCriteriaScore: number;
  taskScore: number;
  totalScore: number;
  rating: string | null;
  strategyStatus?: 'OFFICIAL_ACTIVE' | 'DISABLED_FOR_OFFICIAL_RATING';
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
    legalNote?: string;
  };
}

export const KPI_CONSTANTS = {
  LEGAL_BASIS_ID: KPI_LEGAL_REFERENCES.TOTAL_SCORE_SYNTHESIS,
  VERSION: 'ND335_OFFICIAL_ABC_2026.08.1',
  EFFECTIVE_FROM: '2026-01-01',
  MAX_GENERAL_SCORE: 30.0,
  MAX_POLITICS_SCORE: 10.0,
  MAX_EXPERTISE_SCORE: 10.0,
  MAX_INNOVATION_SCORE: 10.0,
  MAX_TASK_SCORE: 70.0,
  MAX_TOTAL_SCORE: 100.0,
  EXCELLENT_THRESHOLD: 90.0,
  GOOD_THRESHOLD: 70.0,
  SATISFACTORY_THRESHOLD: 50.0,
  DEFAULT_BASELINE_SCORE: 5.0,
  DEFAULT_COEFFICIENT: 1.0,
  DELAY_PENALTY_RATE: 0.25,
  REWORK_PENALTY_RATE: 0.25,
};

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

export function calculateClassification(
  score: number,
  isDisciplined?: boolean,
  thresholds?: { excellent?: number; good?: number; satisfactory?: number }
): string {
  if (isDisciplined) return 'Không hoàn thành nhiệm vụ (Kỷ luật)';
  const exc = thresholds?.excellent ?? KPI_CONSTANTS.EXCELLENT_THRESHOLD;
  const gd = thresholds?.good ?? KPI_CONSTANTS.GOOD_THRESHOLD;
  const sat = thresholds?.satisfactory ?? KPI_CONSTANTS.SATISFACTORY_THRESHOLD;

  if (score >= exc) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= gd) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= sat) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
}

export function calculateKPIScore(input: KPICalculationInput): KPICalculationResult {
  const cfg = input.config || {};
  const version = cfg.version || KPI_CONSTANTS.VERSION;
  const effectiveFrom = cfg.effective_from || KPI_CONSTANTS.EFFECTIVE_FROM;
  const strategy: CalculationStrategy = input.strategy || 'ND335_OFFICIAL_ABC';

  const maxGeneral = cfg.max_general_score ?? KPI_CONSTANTS.MAX_GENERAL_SCORE;
  const maxPol = cfg.max_politics_score ?? KPI_CONSTANTS.MAX_POLITICS_SCORE;
  const maxExp = cfg.max_expertise_score ?? KPI_CONSTANTS.MAX_EXPERTISE_SCORE;
  const maxInn = cfg.max_innovation_score ?? KPI_CONSTANTS.MAX_INNOVATION_SCORE;
  const maxTask = cfg.max_task_score ?? KPI_CONSTANTS.MAX_TASK_SCORE;
  const maxTotal = cfg.max_total_score ?? KPI_CONSTANTS.MAX_TOTAL_SCORE;
  const delayPenaltyRate = cfg.delay_penalty_rate ?? KPI_CONSTANTS.DELAY_PENALTY_RATE;
  const reworkPenaltyRate = cfg.rework_penalty_rate ?? KPI_CONSTANTS.REWORK_PENALTY_RATE;

  // 1. Validate General Criteria (Part I: Max 30.0 points)
  const pol = validateNumericField(input.criteria_politics, 'Tiêu chí chính trị, tư tưởng', 0, maxPol);
  const exp = validateNumericField(input.criteria_expertise, 'Tiêu chí chuyên môn, nghiệp vụ', 0, maxExp);
  const inn = validateNumericField(input.criteria_innovation, 'Tiêu chí đổi mới, sáng tạo', 0, maxInn);
  const rawCommonScore = pol + exp + inn;
  const commonCriteriaScore = Math.min(maxGeneral, Number(rawCommonScore.toFixed(2)));

  // 2. Validate Items (Part II)
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Phiếu đánh giá phải có ít nhất 1 sản phẩm / tiêu chí NĐ 335.');
  }

  let assignedConvertedTotal = 0;
  let completedConvertedTotal = 0;
  let qualityConvertedTotal = 0;
  let onTimeConvertedTotal = 0;
  let sumDirectPoints = 0;

  // Temporary container for line details before proportion calculation
  interface TempLine {
    task_id?: number | null;
    product_catalog_id: number;
    quantity: number;
    assigned_quantity: number;
    accepted_quantity: number;
    baseline_score: number;
    coefficient: number;
    converted_assigned: number;
    converted_accepted: number;
    quality_ratio: number;
    progress_ratio: number;
    direct_points: number;
    remarks?: string | null;
  }
  const tempLines: TempLine[] = [];

  for (const it of input.items) {
    const rawQty = it.quantity !== undefined ? it.quantity : (it.assigned_quantity ?? 1);
    const assignedQty = validateNumericField(it.assigned_quantity ?? rawQty, 'Số lượng giao', 0.0, 10000);
    const acceptedQty = validateNumericField(it.accepted_quantity ?? rawQty, 'Số lượng nghiệm thu', 0, 10000);
    const baseline = validateNumericField(it.baseline_score ?? KPI_CONSTANTS.DEFAULT_BASELINE_SCORE, 'Điểm chuẩn sản phẩm', 0.1, 100);
    const coeff = validateNumericField(it.coefficient ?? KPI_CONSTANTS.DEFAULT_COEFFICIENT, 'Hệ số quy đổi K', 0.1, 100);

    const convertedAssigned = Number((assignedQty * coeff).toFixed(4));
    const convertedAccepted = Number((acceptedQty * coeff).toFixed(4));

    assignedConvertedTotal += convertedAssigned;
    completedConvertedTotal += convertedAccepted;

    // Quality calculation (deduction per unexempted rework)
    const reworks = it.is_exempted_rework ? 0 : (Number(it.reworks) || 0);
    const qualityRatio = Math.max(0.0, 1.0 - (reworks * reworkPenaltyRate));
    qualityConvertedTotal += convertedAccepted * qualityRatio;

    // Progress calculation (deduction per unexempted delay)
    const delays = it.is_exempted_delay ? 0 : (Number(it.delays) || 0);
    const progressRatio = Math.max(0.0, 1.0 - (delays * delayPenaltyRate));
    onTimeConvertedTotal += convertedAccepted * progressRatio;

    const directPoints = it.points !== undefined && it.points !== null
      ? validateNumericField(it.points, 'Điểm dòng chi tiết', 0, maxTotal)
      : Number((acceptedQty * baseline * coeff * qualityRatio * progressRatio).toFixed(2));
    sumDirectPoints += directPoints;

    tempLines.push({
      task_id: it.task_id,
      product_catalog_id: it.product_catalog_id,
      quantity: acceptedQty,
      assigned_quantity: assignedQty,
      accepted_quantity: acceptedQty,
      baseline_score: baseline,
      coefficient: coeff,
      converted_assigned: convertedAssigned,
      converted_accepted: convertedAccepted,
      quality_ratio: qualityRatio,
      progress_ratio: progressRatio,
      direct_points: directPoints,
      remarks: it.remarks,
    });
  }

  // 3. Components a, b, c ratios according to Decree 335
  const isZeroDenominator = assignedConvertedTotal <= 0;
  const a_quantity_ratio = isZeroDenominator ? 0.0 : Math.min(1.0, Math.max(0.0, Number((completedConvertedTotal / assignedConvertedTotal).toFixed(4))));
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

  // 5. Compute Final Task Score & Strategy Identification
  const penaltyMultiplier = input.penalty_multiplier !== undefined
    ? validateNumericField(input.penalty_multiplier, 'Hệ số phạt tiến độ/chất lượng', 0, 1)
    : 1.0;

  let taskScore = 0.0;
  let rating: string | null = null;
  let strategyStatus: 'OFFICIAL_ACTIVE' | 'DISABLED_FOR_OFFICIAL_RATING' = 'OFFICIAL_ACTIVE';
  let legalBasisId = cfg.legal_basis_id || (isLeadership ? KPI_LEGAL_REFERENCES.LEADERSHIP_EVALUATION_ABCDE : KPI_LEGAL_REFERENCES.EMPLOYEE_EVALUATION_ABC);
  let articleReference = isLeadership ? 'Điều 15 & Điều 16 khoản 2 Nghị định 335/2025/NĐ-CP' : 'Điều 14 & Điều 16 khoản 1 Nghị định 335/2025/NĐ-CP';

  const calculatedLines: KPICalculatedLine[] = [];

  if (strategy === 'WEIGHTED_DETAIL_SCORE') {
    // Strategy B: Legacy / Local proposal (Sums direct points)
    // DISABLED FOR OFFICIAL RATING per User Directives
    strategyStatus = 'DISABLED_FOR_OFFICIAL_RATING';
    legalBasisId = cfg.legal_basis_id || 'LOCAL_POLICY_PROPOSAL_WEIGHTED_SCORE';
    articleReference = 'Đề xuất chính sách địa phương (LOCAL_POLICY_PROPOSAL - Chưa có căn cứ NĐ 335)';
    taskScore = Math.min(maxTask, Math.max(0.0, Number((sumDirectPoints * penaltyMultiplier).toFixed(2))));
    rating = null; // Không xếp loại chính thức với chiến lược chưa được phê duyệt

    for (const tl of tempLines) {
      calculatedLines.push({
        ...tl,
        line_score: tl.direct_points,
      });
    }
  } else {
    // Strategy A: ND335_OFFICIAL_ABC (Official Decree 335 - Sole official rating strategy)
    strategyStatus = 'OFFICIAL_ACTIVE';
    if (isZeroDenominator) {
      taskScore = 0.0;
    } else {
      const rawTaskScore = taskOverallRatio * maxTask * penaltyMultiplier;
      taskScore = Math.min(maxTask, Math.max(0.0, Number(rawTaskScore.toFixed(2))));
    }

    // Proportionate line scores
    for (const tl of tempLines) {
      let lineScore = 0;
      if (assignedConvertedTotal > 0) {
        const lineRatio = (tl.converted_accepted / assignedConvertedTotal) * ((1.0 + tl.quality_ratio + tl.progress_ratio) / 3.0);
        lineScore = Number((lineRatio * maxTask).toFixed(2));
      }
      calculatedLines.push({
        ...tl,
        line_score: lineScore,
      });
    }

    const totalScoreCalc = Math.min(maxTotal, Math.max(0.0, Number((commonCriteriaScore + taskScore).toFixed(2))));
    rating = calculateClassification(totalScoreCalc, false, {
      excellent: cfg.excellent_threshold,
      good: cfg.good_threshold,
      satisfactory: cfg.satisfactory_threshold,
    });
  }

  const totalScore = Math.min(maxTotal, Math.max(0.0, Number((commonCriteriaScore + taskScore).toFixed(2))));

  const formulaSummary = strategy === 'WEIGHTED_DETAIL_SCORE'
    ? `TaskScore (WEIGHTED_DETAIL_SCORE - LOCAL PROPOSAL) = min(${maxTask}, sum(line_points)) = min(${maxTask}, ${sumDirectPoints.toFixed(2)} * ${penaltyMultiplier}) = ${taskScore}đ [DISABLED_FOR_OFFICIAL_RATING]`
    : isLeadership
    ? `TaskScore (NĐ 335 Điều 15, 16) = min(${maxTask}, ${maxTask} * (a + b + c + d + đ + e) / 6) = min(${maxTask}, ${maxTask} * (${(a_quantity_ratio*100).toFixed(1)}% + ${(b_quality_ratio*100).toFixed(1)}% + ${(c_progress_ratio*100).toFixed(1)}% + ${(d_unit_result*100).toFixed(1)}% + ${(dd_execution*100).toFixed(1)}% + ${(e_solidarity*100).toFixed(1)}%) / 6) = ${taskScore}đ`
    : `TaskScore (NĐ 335 Điều 14, 16) = min(${maxTask}, ${maxTask} * (a + b + c) / 3) = min(${maxTask}, ${maxTask} * (${(a_quantity_ratio*100).toFixed(1)}% + ${(b_quality_ratio*100).toFixed(1)}% + ${(c_progress_ratio*100).toFixed(1)}%) / 3) = ${taskScore}đ`;

  return {
    calculationStrategy: strategy,
    calculationVersion: version,
    legalBasisId,
    articleReference,
    effectiveFrom,
    commonCriteriaScore,
    taskScore,
    totalScore,
    rating,
    strategyStatus,
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
      taskSectionMax: maxTask,
      penaltyMultiplier,
      formula: formulaSummary,
      componentsSummary: `a=${(a_quantity_ratio*100).toFixed(1)}%, b=${(b_quality_ratio*100).toFixed(1)}%, c=${(c_progress_ratio*100).toFixed(1)}%`,
      insufficientData: isZeroDenominator,
      legalNote: strategy === 'WEIGHTED_DETAIL_SCORE'
        ? 'LOCAL_POLICY_PROPOSAL | LEGAL_REVIEW_REQUIRED | DISABLED_FOR_OFFICIAL_RATING: Công thức tích lũy điểm trực tiếp theo từng sản phẩm chỉ là đề xuất nội bộ, không dùng để xếp loại CBCC chính thức.'
        : `LEGAL_MANDATORY: Chiến lược chính thức duy nhất theo Nghị định 335/2025/NĐ-CP (${articleReference}, Điều 12, Điều 17, Điều 20)`,
    },
  };
}
