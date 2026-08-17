import React, { useState, useEffect } from 'react';
import { evaluationsApi } from '../services/api';
import { Evaluation, EvaluationDetail, ProductCatalog, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Save,
  Send,
  UserCheck,
  Users,
  Shield,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  evaluation: Evaluation | null;
  catalog: ProductCatalog[];
  completedTasks: Task[];
  defaultMonth: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvaluationFormModal: React.FC<Props> = ({
  isOpen,
  evaluation,
  catalog,
  completedTasks,
  defaultMonth,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const isExisting = !!evaluation;
  const status = evaluation?.status || 'DRAFT';

  // Determine mode
  const isEmployee = user?.id === evaluation?.employee_id || !isExisting;
  const isManager =
    (user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN' || user?.role === 'LEADERSHIP') &&
    status === 'SUBMITTED';
  const isLeadership = (user?.role === 'LEADERSHIP' || user?.role === 'ADMIN') && status === 'MANAGER_REVIEWED';
  const isReadOnly = status === 'APPROVED' || (!isEmployee && !isManager && !isLeadership);

  const [month, setMonth] = useState(evaluation?.month || defaultMonth);

  // 1. Part I: General Criteria (Max 30.0đ)
  const [criteriaPolitics, setCriteriaPolitics] = useState<number>(evaluation?.criteria_politics_self ?? 9.5);
  const [criteriaExpertise, setCriteriaExpertise] = useState<number>(evaluation?.criteria_expertise_self ?? 9.5);
  const [criteriaInnovation, setCriteriaInnovation] = useState<number>(evaluation?.criteria_innovation_self ?? 9.0);

  // 2. Leadership management indicators (if leadership role)
  const [leadershipUnitResult, setLeadershipUnitResult] = useState<number>(evaluation?.leadership_unit_result ?? 100.0);
  const [leadershipExecution, setLeadershipExecution] = useState<number>(evaluation?.leadership_execution ?? 100.0);
  const [leadershipSolidarity, setLeadershipSolidarity] = useState<number>(evaluation?.leadership_solidarity ?? 100.0);

  // 3. Consultations & Special Cases
  const [collectiveComments, setCollectiveComments] = useState<string>(evaluation?.collective_comments || '');
  const [partyCellComments, setPartyCellComments] = useState<string>(evaluation?.party_cell_comments || '');
  const [specialCase, setSpecialCase] = useState<string>(evaluation?.special_case || 'NORMAL');
  const [generalRemarks, setGeneralRemarks] = useState(evaluation?.remarks || '');

  const [items, setItems] = useState<
    Array<{
      id?: number;
      product_catalog_id: number;
      task_id?: number | null;
      quantity: number;
      self_points: number;
      manager_points: number;
      final_points: number;
      remarks?: string;
      catalog_code?: string;
      catalog_name?: string;
      catalog_coefficient?: number;
      catalog_complexity_group?: string;
    }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load evaluation detail if existing
  useEffect(() => {
    if (evaluation) {
      setMonth(evaluation.month);
      setCriteriaPolitics(
        isLeadership
          ? evaluation.criteria_politics_final ?? evaluation.criteria_politics_mgr ?? 9.5
          : isManager
          ? evaluation.criteria_politics_mgr ?? evaluation.criteria_politics_self ?? 9.5
          : evaluation.criteria_politics_self ?? 9.5
      );
      setCriteriaExpertise(
        isLeadership
          ? evaluation.criteria_expertise_final ?? evaluation.criteria_expertise_mgr ?? 9.5
          : isManager
          ? evaluation.criteria_expertise_mgr ?? evaluation.criteria_expertise_self ?? 9.5
          : evaluation.criteria_expertise_self ?? 9.5
      );
      setCriteriaInnovation(
        isLeadership
          ? evaluation.criteria_innovation_final ?? evaluation.criteria_innovation_mgr ?? 9.0
          : isManager
          ? evaluation.criteria_innovation_mgr ?? evaluation.criteria_innovation_self ?? 9.0
          : evaluation.criteria_innovation_self ?? 9.0
      );
      setLeadershipUnitResult(evaluation.leadership_unit_result ?? 100.0);
      setLeadershipExecution(evaluation.leadership_execution ?? 100.0);
      setLeadershipSolidarity(evaluation.leadership_solidarity ?? 100.0);
      setCollectiveComments(evaluation.collective_comments || '');
      setPartyCellComments(evaluation.party_cell_comments || '');
      setSpecialCase(evaluation.special_case || 'NORMAL');
      setGeneralRemarks(evaluation.remarks || '');

      evaluationsApi.getEvaluationById(evaluation.id).then((data) => {
        if (data.evaluation.details) {
          setItems(
            data.evaluation.details.map((d: EvaluationDetail) => ({
              id: d.id,
              product_catalog_id: d.product_catalog_id || 0,
              task_id: d.task_id,
              quantity: d.quantity || 1,
              self_points: d.self_points || 0,
              manager_points: d.manager_points || 0,
              final_points: d.final_points || 0,
              remarks: d.remarks || '',
              catalog_code: d.catalog_code,
              catalog_name: d.catalog_name,
              catalog_coefficient: d.catalog_coefficient,
              catalog_complexity_group: d.catalog_complexity_group,
            }))
          );
        }
      });
    } else {
      setMonth(defaultMonth);
      setCriteriaPolitics(9.5);
      setCriteriaExpertise(9.5);
      setCriteriaInnovation(9.0);
      setLeadershipUnitResult(100.0);
      setLeadershipExecution(100.0);
      setLeadershipSolidarity(100.0);
      setCollectiveComments('');
      setPartyCellComments('');
      setSpecialCase('NORMAL');
      setGeneralRemarks('');

      const initialItems: any[] = [];
      for (const t of completedTasks) {
        if (t.product_catalog_id) {
          const cat = catalog.find((c) => c.id === t.product_catalog_id);
          const coeff = cat?.coefficient || 1.0;
          const baseline = cat?.baseline_score || 5.0;
          const pts = Number((1 * baseline * coeff).toFixed(2));
          initialItems.push({
            product_catalog_id: t.product_catalog_id,
            task_id: t.id,
            quantity: 1,
            self_points: pts,
            manager_points: pts,
            final_points: pts,
            remarks: `Nhiệm vụ: ${t.title}`,
            catalog_code: cat?.code,
            catalog_name: cat?.name,
            catalog_coefficient: coeff,
            catalog_complexity_group: cat?.complexity_group || 'N2',
          });
        }
      }

      if (initialItems.length === 0 && catalog.length > 0) {
        const firstCat = catalog[0];
        const pts = Number((1 * (firstCat.baseline_score || 5.0) * (firstCat.coefficient || 1.0)).toFixed(2));
        initialItems.push({
          product_catalog_id: firstCat.id,
          task_id: null,
          quantity: 1,
          self_points: pts,
          manager_points: pts,
          final_points: pts,
          remarks: 'Thực hiện nhiệm vụ chuyên môn theo phân công',
          catalog_code: firstCat.code,
          catalog_name: firstCat.name,
          catalog_coefficient: firstCat.coefficient,
          catalog_complexity_group: firstCat.complexity_group || 'N2',
        });
      }

      setItems(initialItems);
    }
    setError(null);
    setSuccess(null);
  }, [evaluation, defaultMonth, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (catalog.length === 0) return;
    const firstCat = catalog[0];
    const pts = Number((1 * (firstCat.baseline_score || 5.0) * (firstCat.coefficient || 1.0)).toFixed(2));
    setItems([
      ...items,
      {
        product_catalog_id: firstCat.id,
        task_id: null,
        quantity: 1,
        self_points: pts,
        manager_points: pts,
        final_points: pts,
        remarks: '',
        catalog_code: firstCat.code,
        catalog_name: firstCat.name,
        catalog_coefficient: firstCat.coefficient,
        catalog_complexity_group: firstCat.complexity_group || 'N2',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: value };

    if (field === 'product_catalog_id') {
      const cat = catalog.find((c) => c.id === Number(value));
      if (cat) {
        it.catalog_code = cat.code;
        it.catalog_name = cat.name;
        it.catalog_coefficient = cat.coefficient;
        it.catalog_complexity_group = cat.complexity_group || 'N2';
        const qty = Number(it.quantity) || 1;
        const pts = Number((qty * (cat.baseline_score || 5.0) * (cat.coefficient || 1.0)).toFixed(2));
        it.self_points = pts;
        it.manager_points = pts;
        it.final_points = pts;
      }
    } else if (field === 'quantity') {
      const cat = catalog.find((c) => c.id === Number(it.product_catalog_id));
      const coeff = cat?.coefficient || it.catalog_coefficient || 1.0;
      const baseline = cat?.baseline_score || 5.0;
      const qty = Math.max(0.1, Number(value) || 1);
      const pts = Number((qty * baseline * coeff).toFixed(2));
      it.self_points = pts;
      it.manager_points = pts;
      it.final_points = pts;
    }

    updated[index] = it;
    setItems(updated);
  };

  // --- Calculations according to Decree 335 and Home Affairs Handbook ---
  // Part I: General Score (Max 30.0đ - 10đ mỗi tiêu chí theo QĐ 283)
  const pol = Math.min(10.0, Math.max(0, Number(criteriaPolitics) || 0));
  const exp = Math.min(10.0, Math.max(0, Number(criteriaExpertise) || 0));
  const inn = Math.min(10.0, Math.max(0, Number(criteriaInnovation) || 0));
  const subtotalGeneralScore = Number((pol + exp + inn).toFixed(2));

  // Tính toán trừ điểm chậm hạn / sai sót từ danh sách Task liên kết
  let totalDelays = 0;
  let totalReworks = 0;
  for (const it of items) {
    if (it.task_id) {
      const task = completedTasks.find((t) => t.id === Number(it.task_id));
      if (task) {
        totalDelays += Number(task.delay_count) || 0;
        totalReworks += Number(task.rework_count) || 0;
      }
    }
  }

  const qtyRate = 100.0;
  const progRate = Math.max(0, 100.0 - (totalDelays * 25));
  const qualRate = Math.max(0, 100.0 - (totalReworks * 25));

  let selfTaskScore100 = (qtyRate + progRate + qualRate) / 3;
  const isLeadershipRole = ['LEADERSHIP', 'DEPARTMENT_HEAD'].includes(evaluation?.employee_role || user?.role || '');
  
  if (isLeadershipRole) {
    selfTaskScore100 = (qtyRate + progRate + qualRate + leadershipUnitResult + leadershipExecution + leadershipSolidarity) / 6;
  }
  selfTaskScore100 = Number(selfTaskScore100.toFixed(2));

  // Tính tỷ lệ điểm của Trưởng phòng hoặc Lãnh đạo điều chỉnh
  let sumSelfPoints = 0;
  let sumCurrentPoints = 0;
  for (const it of items) {
    sumSelfPoints += Number(it.self_points) || 0;
    if (isLeadership) {
      sumCurrentPoints += Number(it.final_points) || 0;
    } else if (isManager) {
      sumCurrentPoints += Number(it.manager_points) || 0;
    } else {
      sumCurrentPoints += Number(it.self_points) || 0;
    }
  }

  const pointsRatio = sumSelfPoints > 0 ? (sumCurrentPoints / sumSelfPoints) : 1.0;
  let currentTaskScore100 = selfTaskScore100;

  if (isManager || isLeadership) {
    if (isLeadershipRole) {
      const selfUnit = Number(evaluation?.leadership_unit_result) || 100;
      const selfExec = Number(evaluation?.leadership_execution) || 100;
      const selfSol = Number(evaluation?.leadership_solidarity) || 100;
      const baseSelf = Math.max(0, (selfTaskScore100 * 6 - selfUnit - selfExec - selfSol) / 3);
      const baseFinal = baseSelf * pointsRatio;
      
      currentTaskScore100 = (baseFinal * 3 + leadershipUnitResult + leadershipExecution + leadershipSolidarity) / 6;
    } else {
      currentTaskScore100 = selfTaskScore100 * pointsRatio;
    }
  }
  currentTaskScore100 = Math.min(100.0, Math.max(0, Number(currentTaskScore100.toFixed(2))));
  const subtotalTaskScore70 = Number((currentTaskScore100 * 0.70).toFixed(2));

  // Tổng điểm (Max 100.0đ)
  const calculatedTotalScore = Math.min(100.0, Number((subtotalGeneralScore + subtotalTaskScore70).toFixed(2)));

  const isDisciplined = evaluation?.is_disciplined || evaluation?.employee_is_disciplined;

  const getClassification = (score: number) => {
    if (isDisciplined) {
      return { title: 'Không hoàn thành nhiệm vụ (Kỷ luật)', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    if (specialCase === 'LESS_THAN_6_MONTHS') {
      return { title: 'Không xếp loại (Công tác chưa đủ 6 tháng)', color: 'text-slate-700 bg-slate-100 border-slate-300' };
    }
    if (score >= 90) return { title: 'Hoàn thành xuất sắc nhiệm vụ (Loại A: ≥ 90đ)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { title: 'Hoàn thành tốt nhiệm vụ (Loại B: 70 - 89đ)', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    if (score >= 50) return { title: 'Hoàn thành nhiệm vụ (Loại C: 50 - 69đ)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { title: 'Không hoàn thành nhiệm vụ (Loại D: < 50đ)', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  // 1. Employee Save Draft
  const handleSaveDraft = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Phiếu đánh giá cần ít nhất 1 sản phẩm / tiêu chí NĐ 335.');
      return;
    }

    setLoading(true);
    try {
      await evaluationsApi.saveDraft({
        month,
        criteria_politics_self: pol,
        criteria_expertise_self: exp,
        criteria_innovation_self: inn,
        leadership_unit_result: leadershipUnitResult,
        leadership_execution: leadershipExecution,
        leadership_solidarity: leadershipSolidarity,
        collective_comments: collectiveComments,
        party_cell_comments: partyCellComments,
        special_case: specialCase,
        items: items.map((it) => ({
          product_catalog_id: it.product_catalog_id,
          task_id: it.task_id,
          quantity: it.quantity,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });
      setSuccess('Đã lưu nháp phiếu tự đánh giá theo NĐ 335 thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nháp.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Employee Submit
  const handleSubmitSelf = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Phiếu đánh giá cần ít nhất 1 sản phẩm / tiêu chí NĐ 335.');
      return;
    }

    setLoading(true);
    try {
      const res = await evaluationsApi.saveDraft({
        month,
        criteria_politics_self: pol,
        criteria_expertise_self: exp,
        criteria_innovation_self: inn,
        leadership_unit_result: leadershipUnitResult,
        leadership_execution: leadershipExecution,
        leadership_solidarity: leadershipSolidarity,
        collective_comments: collectiveComments,
        party_cell_comments: partyCellComments,
        special_case: specialCase,
        items: items.map((it) => ({
          product_catalog_id: it.product_catalog_id,
          task_id: it.task_id,
          quantity: it.quantity,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });

      await evaluationsApi.submitSelfEvaluation(res.evaluation_id);
      setSuccess('Đã nộp phiếu tự đánh giá lên Trưởng bộ phận thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nộp phiếu đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Manager Review
  const handleManagerReview = async () => {
    if (!evaluation) return;
    setLoading(true);
    try {
      await evaluationsApi.reviewByManager(evaluation.id, {
        criteria_politics_mgr: pol,
        criteria_expertise_mgr: exp,
        criteria_innovation_mgr: inn,
        collective_comments: collectiveComments,
        items: items.map((it) => ({
          id: it.id!,
          manager_points: Number(it.manager_points) || 0,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });
      setSuccess('Trưởng bộ phận thẩm định và chuyển lên Lãnh đạo xã thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thẩm định đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Leadership Approve
  const handleLeadershipApprove = async () => {
    if (!evaluation) return;
    setLoading(true);
    try {
      await evaluationsApi.approveByLeadership(evaluation.id, {
        criteria_politics_final: pol,
        criteria_expertise_final: exp,
        criteria_innovation_final: inn,
        party_cell_comments: partyCellComments,
        final_score: calculatedTotalScore,
        items: items.map((it) => ({
          id: it.id!,
          final_points: Number(it.final_points !== undefined ? it.final_points : it.manager_points) || 0,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });
      setSuccess('Lãnh đạo UBND xã phê duyệt kết quả đánh giá thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-[#CFEBFC] max-h-[92vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFEBFC] bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs text-yellow-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm md:text-base tracking-wide uppercase">
                  Phiếu Đánh Giá CBCC Theo Nghị Định 335/2025/NĐ-CP
                </h3>
                <span className="bg-white/20 text-[#CFEBFC] border border-[#9FD7F9]/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Thang 100đ (30đ + 70đ)
                </span>
              </div>
              <p className="text-xs text-[#CFEBFC]">
                UBND Xã Nghĩa Lâm • {isExisting ? `Phiếu #${evaluation.id} — ${evaluation.employee_name} (${evaluation.employee_position})` : 'Tạo phiếu tự chấm điểm mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          {/* Discipline / Special case alerts */}
          {isDisciplined && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
              <div>
                <strong>Cảnh báo kỷ luật theo Điều 20 NĐ 335:</strong> Cán bộ có quyết định kỷ luật trong kỳ đánh giá sẽ tự động xếp ở mức <strong>Không hoàn thành nhiệm vụ (Loại D)</strong>.
              </div>
            </div>
          )}

          {/* Top Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F0F7FD] p-3.5 rounded-2xl border border-[#CFEBFC]">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#0C3260] block mb-1">
                Kỳ đánh giá (Tháng)
              </label>
              <input
                type="month"
                disabled={isReadOnly || isManager || isLeadership}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#CFEBFC] text-xs font-bold text-[#0C3260] bg-white focus:ring-2 focus:ring-[#27A4F2]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#0C3260] block mb-1">
                Trường hợp đặc thù (Điều 11)
              </label>
              <select
                disabled={isReadOnly}
                value={specialCase}
                onChange={(e) => setSpecialCase(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#CFEBFC] text-xs font-semibold text-[#0C3260] bg-white"
              >
                <option value="NORMAL">Bình thường (Đủ điều kiện đánh giá)</option>
                <option value="LESS_THAN_6_MONTHS">Công tác &lt; 6 tháng (Không xếp loại)</option>
                <option value="MATERNITY_LEAVE">Nghỉ chế độ thai sản</option>
                <option value="TRAINING_COURSE">Đi học tập trung</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#0C3260] block mb-1">
                Trạng thái quy trình
              </label>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#CFEBFC] font-bold text-xs flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#27A4F2]"></span>
                <span className="text-[#0C3260]">
                  {status === 'DRAFT' && 'Bước 1: Cá nhân tự chấm'}
                  {status === 'SUBMITTED' && 'Bước 2: Trưởng bộ phận thẩm định'}
                  {status === 'MANAGER_REVIEWED' && 'Bước 3: Lãnh đạo UBND phê duyệt'}
                  {status === 'APPROVED' && 'Đã phê duyệt chính thức'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: TIÊU CHÍ CHUNG (TỐI ĐA 30.0 ĐIỂM) — PHỤ LỤC I QUYẾT ĐỊNH 283/QĐ-UBND */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  I
                </div>
                <h4 className="font-extrabold text-slate-800 text-xs md:text-sm uppercase tracking-wide">
                  Phần I: Đánh Giá Tiêu Chí Chung (Tối Đa 30.0 Điểm — QĐ 283/QĐ-UBND)
                </h4>
              </div>
              <div className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 font-black rounded-xl text-xs">
                Điểm tiêu chí chung: {subtotalGeneralScore} / 30.0đ
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Criterion 1 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">1. Phẩm chất chính trị, đạo đức & kỷ luật</span>
                  <span className="text-sky-700 font-black text-xs">{pol} / 10.0đ</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Phẩm chất chính trị, đạo đức, văn hóa thực thi công vụ (5đ) và ý thức kỷ luật, kỷ cương trong công vụ (5đ).
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  disabled={isReadOnly}
                  value={pol}
                  onChange={(e) => setCriteriaPolitics(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Criterion 2 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">2. Chuyên môn, trách nhiệm & phối hợp</span>
                  <span className="text-sky-700 font-black text-xs">{exp} / 10.0đ</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Năng lực theo VTVL (2.5đ), đáp ứng việc đột xuất (2.5đ), tinh thần trách nhiệm (2.5đ) và thái độ phục vụ/phối hợp (2.5đ).
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  disabled={isReadOnly}
                  value={exp}
                  onChange={(e) => setCriteriaExpertise(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Criterion 3 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">3. Đổi mới, sáng tạo & dám nghĩ dám làm</span>
                  <span className="text-sky-700 font-black text-xs">{inn} / 10.0đ</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Giải pháp đột phá sáng tạo (2.5đ), nhận nhiệm vụ khó (2.5đ), chịu trách nhiệm (2.5đ) và chủ động tiên phong (2.5đ).
                </p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  disabled={isReadOnly}
                  value={inn}
                  onChange={(e) => setCriteriaInnovation(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: KẾT QUẢ THỰC HIỆN NHIỆM VỤ NĐ 335 (QUY ĐỔI 70%) */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  II
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs md:text-sm uppercase tracking-wide">
                    Phần II: Kết Quả Thực Hiện Nhiệm Vụ (Tối Đa 70.0 Điểm)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Đánh giá theo 3 chiều: Số lượng %, Tiến độ %, Chất lượng % (Hệ số K)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 font-black rounded-xl text-xs">
                  Điểm nhiệm vụ quy đổi: {subtotalTaskScore70} / 70.0đ
                </span>
                {status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 px-3 py-1 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm sản phẩm</span>
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Sản phẩm / Tiêu chí NĐ 335</th>
                    <th className="py-2.5 px-3 text-center">Nhóm</th>
                    <th className="py-2.5 px-3 text-center">Hệ số (K)</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-center">Tự chấm (đ)</th>
                    {(status === 'SUBMITTED' || isManager || status === 'MANAGER_REVIEWED' || status === 'APPROVED') && (
                      <th className="py-2.5 px-3 text-center">TP Duyệt (đ)</th>
                    )}
                    {(status === 'MANAGER_REVIEWED' || isLeadership || status === 'APPROVED') && (
                      <th className="py-2.5 px-3 text-center">Lãnh đạo (đ)</th>
                    )}
                    <th className="py-2.5 px-3">Ghi chú</th>
                    {status === 'DRAFT' && <th className="py-2.5 px-3 text-center">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const cat = catalog.find((c) => c.id === Number(it.product_catalog_id));
                    const coeff = cat?.coefficient || it.catalog_coefficient || 1.0;
                    const cGroup = cat?.complexity_group || it.catalog_complexity_group || 'N2';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 max-w-xs">
                          {status === 'DRAFT' ? (
                            <select
                              value={it.product_catalog_id}
                              onChange={(e) => handleItemChange(idx, 'product_catalog_id', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                            >
                              {catalog.map((c) => (
                                <option key={c.id} value={c.id}>
                                  [{c.code}] {c.name} ({c.complexity_group || 'N2'} - K={c.coefficient})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <div className="font-bold text-slate-800">{it.catalog_name || cat?.name}</div>
                              <div className="text-[11px] text-purple-700 font-mono">[{it.catalog_code || cat?.code}]</div>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded-md text-[10px]">
                            {cGroup}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-purple-700">{coeff}</td>
                        <td className="py-2 px-3 text-center">
                          {status === 'DRAFT' ? (
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-800">{it.quantity}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-sky-700">{it.self_points}đ</td>
                        {(status === 'SUBMITTED' || isManager || status === 'MANAGER_REVIEWED' || status === 'APPROVED') && (
                          <td className="py-2 px-3 text-center font-bold text-blue-700">
                            {isManager ? (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={it.manager_points}
                                onChange={(e) => handleItemChange(idx, 'manager_points', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-bold text-blue-700"
                              />
                            ) : (
                              (status === 'SUBMITTED') ? '-' : `${it.manager_points}đ`
                            )}
                          </td>
                        )}
                        {(status === 'MANAGER_REVIEWED' || isLeadership || status === 'APPROVED') && (
                          <td className="py-2 px-3 text-center font-bold text-red-700">
                            {isLeadership ? (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={it.final_points !== undefined ? it.final_points : it.manager_points}
                                onChange={(e) => handleItemChange(idx, 'final_points', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-bold text-red-700"
                              />
                            ) : (
                              (status === 'MANAGER_REVIEWED') ? '-' : `${it.final_points}đ`
                            )}
                          </td>
                        )}
                        <td className="py-2 px-3">
                          {status === 'DRAFT' ? (
                            <input
                              type="text"
                              value={it.remarks || ''}
                              onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                              placeholder="Số hiệu VB, minh chứng..."
                              className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                            />
                          ) : (
                            <span className="text-slate-600 text-[11px]">{it.remarks || '-'}</span>
                          )}
                        </td>
                        {status === 'DRAFT' && (
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: CONSULTATIONS & COMMENTS (ĐIỀU 21 NĐ 335) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Ý kiến cuộc họp nhận xét tập thể (Điều 21)</span>
              </label>
              <textarea
                rows={2}
                disabled={isReadOnly && !isManager}
                value={collectiveComments}
                onChange={(e) => setCollectiveComments(e.target.value)}
                placeholder="Tóm tắt ý kiến đóng góp của tập thể cơ quan/bộ phận..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-red-600" />
                <span>Ý kiến nhận xét của Cấp ủy / Chi bộ (Điều 21)</span>
              </label>
              <textarea
                rows={2}
                disabled={isReadOnly && !isLeadership}
                value={partyCellComments}
                onChange={(e) => setPartyCellComments(e.target.value)}
                placeholder="Ý kiến đánh giá của Chi ủy / Đảng ủy cơ sở..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: REAL-TIME CLASSIFICATION CARD (THANG 100 ĐIỂM CHUẨN) */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-[#CFEBFC]/30 border-[#9FD7F9]">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Kết quả xếp loại tạm tính theo Nghị định 335:
              </div>
              <div className="text-sm md:text-base font-black text-[#0C3260] mt-0.5">
                {getClassification(calculatedTotalScore).title}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Công thức: Tiêu chí chung (<strong>{subtotalGeneralScore}đ</strong>) + Nhiệm vụ 70% (<strong>{subtotalTaskScore70}đ</strong>)
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Tổng điểm chính thức:</span>
              <div className="text-2xl font-black text-[#1864AB]">
                {calculatedTotalScore.toFixed(1)} <span className="text-sm font-bold text-slate-500">/ 100 đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Đóng
          </button>

          <div className="flex items-center space-x-2">
            {isEmployee && status === 'DRAFT' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-[#9FD7F9] hover:bg-[#CFEBFC]/50 text-[#1864AB] font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu Nháp'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSelf}
                  disabled={loading}
                  className="px-5 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Đang nộp...' : 'Nộp Phiếu Lên Trưởng Bộ Phận'}</span>
                </button>
              </>
            )}

            {isManager && (
              <button
                type="button"
                onClick={handleManagerReview}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{loading ? 'Đang duyệt...' : 'Thẩm Định & Chuyển Lên Lãnh Đạo Xã'}</span>
              </button>
            )}

            {isLeadership && (
              <button
                type="button"
                onClick={handleLeadershipApprove}
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Award className="w-4 h-4" />
                <span>{loading ? 'Đang phê duyệt...' : 'Phê Duyệt Chính Thức (Ký Ban Hành)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
