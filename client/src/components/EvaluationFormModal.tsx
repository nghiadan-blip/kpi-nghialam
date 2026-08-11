import React, { useState, useEffect } from 'react';
import { evaluationsApi, aiApi } from '../services/api';
import { Evaluation, EvaluationDetail, ProductCatalog, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  UserCheck,
  Calculator,
  Sparkles,
  RefreshCw,
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
    }>
  >([]);

  const [generalRemarks, setGeneralRemarks] = useState(evaluation?.remarks || '');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load evaluation detail if existing
  useEffect(() => {
    if (evaluation) {
      setMonth(evaluation.month);
      setGeneralRemarks(evaluation.remarks || '');
      // Fetch full details
      evaluationsApi.getEvaluationById(evaluation.id).then((data) => {
        if (data.evaluation.details) {
          setItems(
            data.evaluation.details.map((d: EvaluationDetail) => ({
              id: d.id,
              product_catalog_id: d.product_catalog_id,
              task_id: d.task_id,
              quantity: d.quantity,
              self_points: d.self_points,
              manager_points: d.manager_points,
              final_points: d.final_points,
              remarks: d.remarks || '',
              catalog_code: d.catalog_code,
              catalog_name: d.catalog_name,
              catalog_coefficient: d.catalog_coefficient,
            }))
          );
        }
      });
    } else {
      setMonth(defaultMonth);
      setGeneralRemarks('');
      // Default: if employee has completed tasks this month, auto-populate
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
          });
        }
      }

      if (initialItems.length === 0 && catalog.length > 0) {
        // Add 1 blank item
        const firstCat = catalog[0];
        const pts = Number((1 * (firstCat.baseline_score || 5.0) * firstCat.coefficient).toFixed(2));
        initialItems.push({
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
        });
      }
      setItems(initialItems);
    }
    setError(null);
    setSuccess(null);
  }, [evaluation, isOpen, defaultMonth, catalog, completedTasks]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (catalog.length === 0) return;
    const cat = catalog[0];
    const pts = Number((1 * (cat.baseline_score || 5.0) * cat.coefficient).toFixed(2));
    setItems([
      ...items,
      {
        product_catalog_id: cat.id,
        task_id: null,
        quantity: 1,
        self_points: pts,
        manager_points: pts,
        final_points: pts,
        remarks: '',
        catalog_code: cat.code,
        catalog_name: cat.name,
        catalog_coefficient: cat.coefficient,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
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
        const pts = Number((it.quantity * (cat.baseline_score || 5.0) * cat.coefficient).toFixed(2));
        it.self_points = pts;
        it.manager_points = pts;
        it.final_points = pts;
      }
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value) || 1);
      it.quantity = qty;
      const cat = catalog.find((c) => c.id === Number(it.product_catalog_id));
      const coeff = cat?.coefficient || 1.0;
      const base = cat?.baseline_score || 5.0;
      const pts = Number((qty * base * coeff).toFixed(2));
      it.self_points = pts;
      it.manager_points = pts;
      it.final_points = pts;
    }

    updated[index] = it;
    setItems(updated);
  };

  // Calculate totals
  const totalSelfScore = Number(items.reduce((sum, it) => sum + (Number(it.self_points) || 0), 0).toFixed(2));
  const totalManagerScore = Number(items.reduce((sum, it) => sum + (Number(it.manager_points) || 0), 0).toFixed(2));
  const totalFinalScore = Number(items.reduce((sum, it) => sum + (Number(it.final_points) || 0), 0).toFixed(2));

  const getClassification = (score: number) => {
    if (score >= 90) return { title: 'Hoàn thành xuất sắc nhiệm vụ (Loại A)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { title: 'Hoàn thành tốt nhiệm vụ (Loại B)', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    if (score >= 50) return { title: 'Hoàn thành nhiệm vụ (Loại C)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { title: 'Không hoàn thành nhiệm vụ (Loại D)', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  // 1. Employee Save Draft
  const handleSaveDraft = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Phiếu đánh giá cần ít nhất 1 sản phẩm/tiêu chí.');
      return;
    }

    setLoading(true);
    try {
      await evaluationsApi.saveDraft({
        month,
        items: items.map((it) => ({
          product_catalog_id: it.product_catalog_id,
          task_id: it.task_id,
          quantity: it.quantity,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });
      setSuccess('Đã lưu nháp phiếu tự đánh giá thành công!');
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
      setError('Phiếu đánh giá cần ít nhất 1 sản phẩm/tiêu chí.');
      return;
    }

    setLoading(true);
    try {
      const res = await evaluationsApi.saveDraft({
        month,
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
        items: items.map((it) => ({
          id: it.id!,
          manager_points: Number(it.manager_points) || 0,
          remarks: it.remarks,
        })),
        remarks: generalRemarks,
      });
      setSuccess('Trưởng bộ phận đánh giá và chuyển lên Lãnh đạo xã thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt đánh giá.');
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
        items: items.map((it) => ({
          id: it.id!,
          final_points: Number(it.final_points !== undefined ? it.final_points : it.manager_points) || 0,
          remarks: it.remarks,
        })),
        final_score: totalFinalScore,
        remarks: generalRemarks,
      });
      setSuccess('Lãnh đạo UBND xã phê duyệt và xếp loại thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt.');
    } finally {
      setLoading(false);
    }
  };

  // AI Generate Remark
  const handleGenerateAIRemark = async () => {
    setGeneratingAI(true);
    try {
      const activeScore =
        status === 'APPROVED' || isLeadership
          ? totalFinalScore
          : isManager
          ? totalManagerScore
          : totalSelfScore;

      const roleType = isLeadership ? 'LEADERSHIP' : isManager ? 'MANAGER' : 'SELF';

      const res = await aiApi.generateEvaluationRemark({
        employee_name: evaluation?.employee_name || user?.fullname,
        position: evaluation?.employee_position || user?.position,
        department: (evaluation?.department_name || user?.department_name) ?? undefined,
        month,
        score: activeScore,
        items,
        role_type: roleType,
      });

      setGeneralRemarks(res.remark);
    } catch (err: any) {
      console.error('Lỗi sinh nhận xét AI:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Phiếu Đánh Giá & Chấm Điểm CBCC (Tháng {month})
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng Khung định mức & Hệ số quy đổi theo Nghị định 335/2025/NĐ-CP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Personnel Meta Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Cán bộ đánh giá:</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {evaluation?.employee_name || user?.fullname}
              </div>
              <div className="text-slate-600">{evaluation?.employee_position || user?.position}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Đơn vị / Bộ phận:</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {evaluation?.department_name || user?.department_name || 'UBND xã Nghĩa Lâm'}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Trạng thái phiếu:</span>
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {status === 'DRAFT'
                    ? 'Bản nháp'
                    : status === 'SUBMITTED'
                    ? 'Chờ Trưởng phòng duyệt'
                    : status === 'MANAGER_REVIEWED'
                    ? 'Chờ Lãnh đạo phê duyệt'
                    : 'Đã phê duyệt & Xếp loại'}
                </span>
              </div>
            </div>
          </div>

          {/* Month Selector for Draft */}
          {status === 'DRAFT' && !isExisting && (
            <div className="max-w-xs">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Kỳ đánh giá (Tháng/Năm)
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 font-bold text-slate-800"
              />
            </div>
          )}

          {/* Product Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center space-x-1.5">
                <Calculator className="w-4 h-4 text-purple-600" />
                <span>Danh mục sản phẩm & Tiêu chí công việc trong tháng</span>
              </h4>
              {status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition border border-purple-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm sản phẩm</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Sản phẩm / Tiêu chí NĐ 335</th>
                    <th className="py-2.5 px-3 text-center">Hệ số (K)</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-center">Tự chấm (đ)</th>
                    {(status === 'SUBMITTED' || isManager || status === 'MANAGER_REVIEWED' || status === 'APPROVED') && (
                      <th className="py-2.5 px-3 text-center">TP Duyệt (đ)</th>
                    )}
                    {(status === 'MANAGER_REVIEWED' || isLeadership || status === 'APPROVED') && (
                      <th className="py-2.5 px-3 text-center">Lãnh đạo (đ)</th>
                    )}
                    <th className="py-2.5 px-3">Ghi chú / Minh chứng</th>
                    {status === 'DRAFT' && <th className="py-2.5 px-3 text-center">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const cat = catalog.find((c) => c.id === Number(it.product_catalog_id));
                    const coeff = cat?.coefficient || it.catalog_coefficient || 1.0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>

                        {/* Product selection */}
                        <td className="py-2.5 px-3 max-w-xs">
                          {status === 'DRAFT' ? (
                            <select
                              value={it.product_catalog_id}
                              onChange={(e) => handleItemChange(idx, 'product_catalog_id', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-purple-500 font-medium"
                            >
                              {catalog.map((c) => (
                                <option key={c.id} value={c.id}>
                                  [{c.code}] {c.name} (K={c.coefficient})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <div className="font-semibold text-slate-800">{it.catalog_name || cat?.name}</div>
                              <div className="text-[11px] text-purple-700 font-mono">
                                [{it.catalog_code || cat?.code}]
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Coefficient */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          x{coeff}
                        </td>

                        {/* Quantity */}
                        <td className="py-2.5 px-3 text-center">
                          {status === 'DRAFT' ? (
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-14 px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold"
                            />
                          ) : (
                            <span className="font-bold">{it.quantity}</span>
                          )}
                        </td>

                        {/* Self Points */}
                        <td className="py-2.5 px-3 text-center font-bold text-sky-700">
                          {it.self_points} đ
                        </td>

                        {/* Manager Points */}
                        {(status === 'SUBMITTED' || isManager || status === 'MANAGER_REVIEWED' || status === 'APPROVED') && (
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                            {isManager ? (
                              <input
                                type="number"
                                step="0.5"
                                value={it.manager_points}
                                onChange={(e) =>
                                  handleItemChange(idx, 'manager_points', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 px-1.5 py-1 border border-blue-300 rounded text-center text-xs font-bold bg-blue-50"
                              />
                            ) : (
                              <span>{it.manager_points} đ</span>
                            )}
                          </td>
                        )}

                        {/* Leadership Points */}
                        {(status === 'MANAGER_REVIEWED' || isLeadership || status === 'APPROVED') && (
                          <td className="py-2.5 px-3 text-center font-bold text-red-700">
                            {isLeadership ? (
                              <input
                                type="number"
                                step="0.5"
                                value={it.final_points}
                                onChange={(e) =>
                                  handleItemChange(idx, 'final_points', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 px-1.5 py-1 border border-red-300 rounded text-center text-xs font-bold bg-red-50"
                              />
                            ) : (
                              <span>{it.final_points} đ</span>
                            )}
                          </td>
                        )}

                        {/* Remarks */}
                        <td className="py-2.5 px-3">
                          {status === 'DRAFT' || isManager || isLeadership ? (
                            <input
                              type="text"
                              value={it.remarks || ''}
                              onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                              placeholder="Ghi chú minh chứng..."
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                          ) : (
                            <span className="text-slate-600 text-[11px]">{it.remarks || '-'}</span>
                          )}
                        </td>

                        {/* Delete item */}
                        {status === 'DRAFT' && (
                          <td className="py-2.5 px-3 text-center">
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
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold text-slate-800 border-t border-slate-200">
                    <td colSpan={4} className="py-3 px-3 text-right uppercase text-xs">
                      Tổng điểm tính toán:
                    </td>
                    <td className="py-3 px-3 text-center text-sm font-black text-sky-700">
                      {totalSelfScore} đ
                    </td>
                    {(status === 'SUBMITTED' || isManager || status === 'MANAGER_REVIEWED' || status === 'APPROVED') && (
                      <td className="py-3 px-3 text-center text-sm font-black text-blue-700">
                        {totalManagerScore} đ
                      </td>
                    )}
                    {(status === 'MANAGER_REVIEWED' || isLeadership || status === 'APPROVED') && (
                      <td className="py-3 px-3 text-center text-sm font-black text-red-700">
                        {totalFinalScore} đ
                      </td>
                    )}
                    <td colSpan={status === 'DRAFT' ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Real-time Classification Card */}
          <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Kết quả xếp loại tạm tính theo Nghị định 335:
              </div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {getClassification(status === 'APPROVED' ? totalFinalScore : isLeadership ? totalFinalScore : totalManagerScore).title}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Điểm áp dụng:</span>
              <div className="text-xl font-black text-purple-700">
                {(status === 'APPROVED' ? totalFinalScore : isLeadership ? totalFinalScore : totalManagerScore).toFixed(1)} / 100 đ
              </div>
            </div>
          </div>

          {/* General Remarks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">
                Nhận xét & Đánh giá kết quả công tác
              </label>

              {!isReadOnly && (
                <button
                  type="button"
                  disabled={generatingAI}
                  onClick={handleGenerateAIRemark}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-amber-50 to-red-50 hover:from-amber-100 hover:to-red-100 text-red-800 border border-amber-300/80 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {generatingAI ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{generatingAI ? 'DeepSeek AI đang soạn...' : '✨ DeepSeek AI Viết Nhận Xét'}</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={generalRemarks}
              onChange={(e) => setGeneralRemarks(e.target.value)}
              placeholder="Nhận xét về tinh thần trách nhiệm, thái độ phục vụ nhân dân, tiến độ hoàn thành các sản phẩm NĐ 335..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 focus:ring-2 focus:ring-amber-500 font-normal leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Đóng
          </button>

          <div className="flex items-center space-x-2">
            {/* Employee Actions */}
            {status === 'DRAFT' && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveDraft}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu nháp</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitSelf}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp phiếu đánh giá</span>
                </button>
              </>
            )}

            {/* Manager Review Action */}
            {isManager && (
              <button
                type="button"
                disabled={loading}
                onClick={handleManagerReview}
                className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Xác nhận duyệt điểm & Chuyển Lãnh đạo</span>
              </button>
            )}

            {/* Leadership Approve Action */}
            {isLeadership && (
              <button
                type="button"
                disabled={loading}
                onClick={handleLeadershipApprove}
                className="flex items-center space-x-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Phê duyệt & Xếp loại tháng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
