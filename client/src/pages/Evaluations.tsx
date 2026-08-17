import React, { useState, useEffect } from 'react';
import { evaluationsApi, catalogApi, tasksApi, departmentsApi, reportsApi } from '../services/api';
import { Evaluation, ProductCatalog, Task, Department, QuotaStats, EvaluationAppeal } from '../types';
import { useAuth } from '../context/AuthContext';
import { EvaluationFormModal } from '../components/EvaluationFormModal';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Building2,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  HelpCircle,
  MessageSquareWarning,
  CheckCircle2,
  Scale,
  Mail,
  Lock as LockIcon,
  Unlock as UnlockIcon,
} from 'lucide-react';

export const Evaluations: React.FC = () => {
  const { user } = useAuth();

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [activeTab, setActiveTab] = useState<'EVALUATIONS' | 'APPEALS'>('EVALUATIONS');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalog[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [quotaStats, setQuotaStats] = useState<QuotaStats | null>(null);
  const [appeals, setAppeals] = useState<EvaluationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentPeriodLocked, setIsCurrentPeriodLocked] = useState<boolean>(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Appeal Modal State
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealTargetEval, setAppealTargetEval] = useState<Evaluation | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidenceUrl, setAppealEvidenceUrl] = useState('');

  // Resolve Appeal Modal State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<EvaluationAppeal | null>(null);
  const [resolveStatus, setResolveStatus] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [resolveResponseText, setResolveResponseText] = useState('');
  const [resolveAdjustedScore, setResolveAdjustedScore] = useState<number>(90);

  // Email Notification State
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [batchSendingEmails, setBatchSendingEmails] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await evaluationsApi.getEvaluations({
        month: selectedMonth || undefined,
        department_id: selectedDept ? Number(selectedDept) : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setEvaluations(data.evaluations);

      if (selectedMonth) {
        evaluationsApi
          .getQuotaStats(selectedMonth)
          .then((q) => setQuotaStats(q))
          .catch(() => {});

        evaluationsApi
          .getPeriods()
          .then((res) => {
            const matched = (res.periods || []).find((p: any) => p.month === selectedMonth);
            setIsCurrentPeriodLocked(matched?.status === 'LOCKED');
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await evaluationsApi.getAppeals();
      setAppeals(res.appeals);
    } catch (err) {
      console.error('Lỗi tải danh sách kiến nghị:', err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [dData, cData, tData] = await Promise.all([
        departmentsApi.getDepartments(),
        catalogApi.getCatalog({ status: 'ACTIVE' }),
        tasksApi.getTasks({ status: 'COMPLETED' }),
      ]);
      setDepartments(dData.departments);
      setCatalog(cData.catalog);
      setCompletedTasks(tData.tasks);
    } catch (e) {
      console.error('Lỗi tải dữ liệu danh mục phụ:', e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchEvaluations();
    fetchAppeals();
  }, [selectedMonth, selectedDept, selectedStatus]);

  const handleDeleteEvaluation = async (ev: Evaluation) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.')) return;

    try {
      await evaluationsApi.deleteEvaluation(ev.id);
      setActionMessage({ type: 'success', text: 'Đã xóa phiếu đánh giá thành công.' });
      fetchEvaluations();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa phiếu.',
      });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealTargetEval) return;
    try {
      await evaluationsApi.submitAppeal(appealTargetEval.id, {
        reason: appealReason,
        evidence_url: appealEvidenceUrl || undefined,
      });
      setAppealModalOpen(false);
      setAppealReason('');
      setAppealEvidenceUrl('');
      setActionMessage({
        type: 'success',
        text: 'Đã gửi đơn kiến nghị kết quả đánh giá thành công! Thời hạn giải quyết theo quy định là 7 ngày làm việc.',
      });
      fetchAppeals();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi khi gửi đơn kiến nghị.',
      });
    }
  };

  const handleResolveAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal) return;
    try {
      await evaluationsApi.resolveAppeal(selectedAppeal.id, {
        status: resolveStatus,
        response_text: resolveResponseText,
        adjusted_score: resolveStatus === 'ACCEPTED' ? Number(resolveAdjustedScore) : undefined,
      });
      setResolveModalOpen(false);
      setSelectedAppeal(null);
      setResolveResponseText('');
      setActionMessage({
        type: 'success',
        text: 'Đã giải quyết đơn kiến nghị kết quả đánh giá thành công!',
      });
      fetchAppeals();
      fetchEvaluations();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi khi giải quyết đơn kiến nghị.',
      });
    }
  };

  const handleSendEmail = async (ev: Evaluation) => {
    if (!window.confirm(`Gửi email thông báo kết quả đánh giá tháng ${ev.month} cho đồng chí "${ev.employee_name}"?`)) return;
    setSendingEmailId(ev.id);
    try {
      const res = await evaluationsApi.sendEvaluationEmail(ev.id);
      setActionMessage({
        type: 'success',
        text: res.message || `Đã gửi thông báo kết quả đánh giá cho ${ev.employee_name} thành công!`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi khi gửi email thông báo.',
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleBatchSendEmails = async () => {
    if (!window.confirm(`Gửi email thông báo kết quả đánh giá cho TOÀN BỘ cán bộ đã được phê duyệt trong tháng ${selectedMonth}?`)) return;
    setBatchSendingEmails(true);
    try {
      const res = await evaluationsApi.batchSendEvaluationEmails(selectedMonth);
      setActionMessage({
        type: 'success',
        text: res.message || `Đã hoàn tất gửi email thông báo tháng ${selectedMonth}!`,
      });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi khi gửi email đồng loạt.',
      });
    } finally {
      setBatchSendingEmails(false);
    }
  };

  const handleToggleLock = async () => {
    if (!['ADMIN', 'LEADERSHIP'].includes(user?.role || '')) {
      alert('Chỉ Admin hoặc Lãnh đạo mới có quyền khóa/mở khóa kỳ đánh giá.');
      return;
    }
    
    const confirmMsg = isCurrentPeriodLocked
      ? `Bạn có chắc chắn muốn MỞ KHÓA kỳ đánh giá tháng ${selectedMonth}?`
      : `Bạn có chắc chắn muốn KHÓA kỳ đánh giá tháng ${selectedMonth}? Khi đã khóa, cán bộ sẽ không thể tự chấm hoặc chỉnh sửa phiếu tự đánh giá.`;
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      if (isCurrentPeriodLocked) {
        await evaluationsApi.unlockPeriod(selectedMonth);
        setActionMessage({ type: 'success', text: `Đã mở khóa kỳ đánh giá tháng ${selectedMonth} thành công.` });
      } else {
        await evaluationsApi.lockPeriod(selectedMonth);
        setActionMessage({ type: 'success', text: `Đã khóa kỳ đánh giá tháng ${selectedMonth} thành công.` });
      }
      fetchEvaluations();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái khóa kỳ.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Stats
  const approvedEvals = evaluations.filter(
    (e) => (e.status === 'APPROVED' || e.step === 'STEP_3_LEADERSHIP_FINAL') && e.final_score !== null && e.final_score !== undefined
  );
  const countA = approvedEvals.filter((e) => (e.final_score ?? 0) >= 90).length;
  const countB = approvedEvals.filter((e) => (e.final_score ?? 0) >= 70 && (e.final_score ?? 0) < 90).length;
  const countC = approvedEvals.filter((e) => (e.final_score ?? 0) >= 50 && (e.final_score ?? 0) < 70).length;
  const countD = approvedEvals.filter((e) => (e.final_score ?? 0) < 50 || e.is_disciplined || e.employee_is_disciplined).length;

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'APPROVED':
      case 'STEP_3_LEADERSHIP_FINAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã phê duyệt</span>
          </span>
        );
      case 'MANAGER_REVIEWED':
      case 'STEP_2_MANAGER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Lãnh đạo duyệt</span>
          </span>
        );
      case 'SUBMITTED':
      case 'STEP_1_SELF':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Trưởng phòng duyệt</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <span>Bản nháp</span>
          </span>
        );
    }
  };

  const getClassificationBadge = (score?: number | null, status?: string | null, isDisciplined?: boolean) => {
    if (status !== 'APPROVED' && status !== 'STEP_3_LEADERSHIP_FINAL') return <span className="text-slate-400 text-xs italic">Chưa xếp loại</span>;
    if (isDisciplined) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          Kỷ luật (Loại D)
        </span>
      );
    }
    const finalScore = score ?? 0;
    if (finalScore >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Xuất sắc (Loại A)
        </span>
      );
    }
    if (finalScore >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          Tốt (Loại B)
        </span>
      );
    }
    if (finalScore >= 50) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Hoàn thành (Loại C)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        Không đạt (Loại D)
      </span>
    );
  };

  const userEvalThisMonth = evaluations.find((e) => e.employee_id === user?.id && e.month === selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-[#27A4F2]" />
            <h1 className="text-xl font-bold text-slate-900">
              Đánh Giá & Xếp Loại Cán Bộ, Công Chức (Nghị Định 335)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình chấm điểm 3 cấp: Cá nhân tự chấm (30đ + 70đ) → Trưởng bộ phận thẩm định → Lãnh đạo UBND xã phê duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {['ADMIN', 'LEADERSHIP'].includes(user?.role || '') && (
            <button
              onClick={handleBatchSendEmails}
              disabled={batchSendingEmails}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Gửi email thông báo kết quả cho toàn bộ cán bộ đã được phê duyệt trong tháng"
            >
              <Mail className={`w-4 h-4 ${batchSendingEmails ? 'animate-bounce' : ''}`} />
              <span>{batchSendingEmails ? 'Đang gửi email...' : `Gửi Email Toàn Xã (${selectedMonth})`}</span>
            </button>
          )}

          <button
            onClick={() => reportsApi.downloadExcel(selectedMonth)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>

          <button
            onClick={() => {
              if (isCurrentPeriodLocked && !['ADMIN', 'LEADERSHIP'].includes(user?.role || '')) {
                alert(`Kỳ đánh giá tháng ${selectedMonth} đã bị khóa. Bạn không thể thực hiện chỉnh sửa hoặc tạo phiếu mới.`);
                return;
              }
              setSelectedEval(userEvalThisMonth || null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#27A4F2]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {userEvalThisMonth ? 'Mở Phiếu Tự Chấm Tháng Này' : 'Tạo Phiếu Tự Đánh Giá Tháng'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('EVALUATIONS')}
          className={`px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'EVALUATIONS'
              ? 'border-[#27A4F2] text-[#0C3260]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Danh Sách Đánh Giá & Xếp Loại</span>
        </button>

        <button
          onClick={() => setActiveTab('APPEALS')}
          className={`px-4 py-2.5 font-bold text-xs md:text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'APPEALS'
              ? 'border-[#27A4F2] text-[#0C3260]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          <span>Đơn Kiến Nghị Kết Quả (Điều 22 - 7 ngày)</span>
          {appeals.filter((a) => a.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black">
              {appeals.filter((a) => a.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {activeTab === 'EVALUATIONS' ? (
        <>
          {/* Real-time Type A Quota Monitor Bar (Điều 16) */}
          {quotaStats && (
            <div className={`p-4 rounded-2xl border ${
              quotaStats.is_exceeding_quota
                ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                : 'bg-[#F0F7FD] border-[#CFEBFC] text-[#0C3260]'
            } shadow-xs space-y-2`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-[#27A4F2] flex-shrink-0" />
                  <span className="font-bold text-xs uppercase">
                    Giám sát hạn mức Loại A (Hoàn thành xuất sắc nhiệm vụ) — Điều 16 NĐ 335:
                  </span>
                </div>
                <div className="font-mono text-xs font-bold">
                  {quotaStats.count_a} / {quotaStats.total_eligible} cán bộ đã duyệt Loại A+B (Tỷ lệ: <strong>{quotaStats.type_a_ratio_percent}%</strong> / Trần: {quotaStats.is_exceeding_quota ? '25%' : '20%'})
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className={`h-full ${quotaStats.is_exceeding_quota ? 'bg-amber-500' : 'bg-emerald-500'} transition-all`}
                  style={{ width: `${Math.min(100, quotaStats.type_a_ratio_percent)}%` }}
                ></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-0.5 gap-1">
                <span>
                  * Mẫu số tính theo Điều 16: Tổng số cán bộ đạt <strong>Loại A + Loại B ({quotaStats.total_eligible} cán bộ đã phê duyệt)</strong>. Tối đa cho phép: <strong>{quotaStats.max_allowed_quota_a} cán bộ Loại A</strong>.
                </span>
                <span className="text-[#1864AB] font-semibold">
                  Toàn xã: {evaluations.length} cán bộ tham gia kỳ đánh giá
                </span>
              </div>

              {quotaStats.is_exceeding_quota && (
                <div className="text-[11px] text-amber-800 flex items-start space-x-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Cảnh báo vượt trần:</strong> Tỷ lệ xếp loại Xuất sắc ({quotaStats.type_a_ratio_percent}%) đã vượt mức trần 20% (Chỉ cho phép tối đa {quotaStats.max_allowed_quota_a} cán bộ). Nếu cơ quan có thành tích đặc biệt xuất sắc, Lãnh đạo UBND xã cần bổ sung giải trình để áp dụng khung trần tối đa 25%.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Monthly Classification Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase">Đã phê duyệt</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{approvedEvals.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
              <div className="text-xs font-semibold text-emerald-800 uppercase">Loại A (Xuất sắc)</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{countA}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">≥ 90 điểm</div>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 shadow-xs">
              <div className="text-xs font-semibold text-sky-800 uppercase">Loại B (Tốt)</div>
              <div className="text-2xl font-black text-sky-700 mt-1">{countB}</div>
              <div className="text-[11px] text-sky-600 mt-0.5">70 - 89 điểm</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs">
              <div className="text-xs font-semibold text-amber-800 uppercase">Loại C (Hoàn thành)</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{countC}</div>
              <div className="text-[11px] text-amber-600 mt-0.5">50 - 69 điểm</div>
            </div>

            <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 shadow-xs">
              <div className="text-xs font-semibold text-red-800 uppercase">Loại D (Không đạt)</div>
              <div className="text-2xl font-black text-red-700 mt-1">{countD}</div>
              <div className="text-[11px] text-red-600 mt-0.5">&lt; 50 điểm / Kỷ luật</div>
            </div>
          </div>

          {/* Evaluations Table Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            {/* Controls & Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 uppercase">Kỳ đánh giá:</span>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 border border-[#CFEBFC] rounded-xl text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-[#27A4F2]"
                />
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isCurrentPeriodLocked
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isCurrentPeriodLocked ? <LockIcon className="w-3 h-3" /> : <UnlockIcon className="w-3 h-3" />}
                  <span>{isCurrentPeriodLocked ? 'Đã khóa' : 'Đang mở'}</span>
                </span>
                {['ADMIN', 'LEADERSHIP'].includes(user?.role || '') && (
                  <button
                    onClick={handleToggleLock}
                    className={`px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                      isCurrentPeriodLocked
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isCurrentPeriodLocked ? 'Mở khóa kỳ' : 'Khóa kỳ'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Department Filter */}
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 border border-[#CFEBFC] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#27A4F2]"
                >
                  <option value="">-- Tất cả phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-[#CFEBFC] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#27A4F2]"
                >
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="SUBMITTED">Chờ Trưởng phòng duyệt</option>
                  <option value="MANAGER_REVIEWED">Chờ Lãnh đạo duyệt</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4">Cán bộ / Vị trí việc làm</th>
                    <th className="py-3 px-4 text-center">Tháng</th>
                    <th className="py-3 px-4 text-center">Tự chấm (đ)</th>
                    <th className="py-3 px-4 text-center">TP Duyệt (đ)</th>
                    <th className="py-3 px-4 text-center">Lãnh đạo (đ)</th>
                    <th className="py-3 px-4 text-center">Xếp loại NĐ 335</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#27A4F2]" />
                        Đang tải danh sách phiếu đánh giá...
                      </td>
                    </tr>
                  ) : evaluations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        Chưa có phiếu đánh giá nào trong tháng {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    evaluations.map((ev) => {
                      const canDelete =
                        ev.status === 'DRAFT' && (ev.employee_id === user?.id || user?.role === 'ADMIN');
                      const canAppeal =
                        ev.status === 'APPROVED' && ev.employee_id === user?.id;

                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ev.employee_name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              <span>{ev.department_name || ev.employee_position}</span>
                              {ev.employee_position_code && (
                                <span className="font-mono text-sky-600">[{ev.employee_position_code}]</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-700">
                            {ev.month}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-sky-700">
                            {ev.self_score}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-blue-700">
                            {ev.status !== 'DRAFT' && ev.status !== 'SUBMITTED' ? ev.manager_score : '-'}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-red-700">
                            {ev.status === 'APPROVED' ? ev.final_score : '-'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {getClassificationBadge(ev.final_score, ev.status, Boolean(ev.is_disciplined || ev.employee_is_disciplined))}
                          </td>

                          <td className="py-3 px-4 text-center">{getStatusBadge(ev.status)}</td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedEval(ev);
                                  setModalOpen(true);
                                }}
                                title="Xem chi tiết & Chấm điểm"
                                className="p-1.5 text-slate-600 hover:text-[#27A4F2] hover:bg-sky-50 rounded-lg transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {ev.status === 'APPROVED' && ['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD'].includes(user?.role || '') && (
                                <button
                                  onClick={() => handleSendEmail(ev)}
                                  disabled={sendingEmailId === ev.id}
                                  title="Gửi email thông báo kết quả đánh giá"
                                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Mail className={`w-4 h-4 ${sendingEmailId === ev.id ? 'animate-bounce' : ''}`} />
                                </button>
                              )}

                              {canAppeal && (
                                <button
                                  onClick={() => {
                                    setAppealTargetEval(ev);
                                    setAppealModalOpen(true);
                                  }}
                                  title="Gửi kiến nghị kết quả (Điều 22)"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteEvaluation(ev)}
                                  title="Xóa phiếu nháp"
                                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* APPEALS MANAGEMENT TAB (Điều 22) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#0C3260] uppercase">
                Danh Sách Đơn Kiến Nghị Kết Quả Đánh Giá (Điều 22 NĐ 335)
              </h3>
              <p className="text-xs text-slate-500">
                Thời hạn giải quyết kiến nghị tối đa 07 ngày làm việc kể từ ngày nhận được đơn.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Cán bộ kiến nghị</th>
                  <th className="py-3 px-4">Kỳ đánh giá</th>
                  <th className="py-3 px-4">Nội dung kiến nghị & Căn cứ</th>
                  <th className="py-3 px-4 text-center">Thời hạn giải quyết (7 ngày)</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Không có đơn kiến nghị nào được gửi.
                    </td>
                  </tr>
                ) : (
                  appeals.map((app, idx) => {
                    const isPending = app.status === 'PENDING';
                    const canResolve = isPending && (user?.role === 'LEADERSHIP' || user?.role === 'ADMIN');

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{app.employee_name}</div>
                          <div className="text-[11px] text-slate-500">{app.department_name || app.employee_position}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0C3260]">
                          Tháng {app.evaluation_month} ({app.evaluation_final_score}đ)
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p className="line-clamp-2 text-slate-700">{app.reason}</p>
                          {app.response_text && (
                            <div className="mt-1 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
                              <strong>Phản hồi:</strong> {app.response_text}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              app.is_overdue ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {app.is_overdue ? 'Quá hạn giải quyết' : `Còn ${app.days_remaining} ngày`}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Đã giải quyết</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {app.status === 'PENDING' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                              Chờ xử lý
                            </span>
                          )}
                          {app.status === 'ACCEPTED' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                              Đã chấp nhận (Điều chỉnh)
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[11px]">
                              Bác đơn kiến nghị
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canResolve && (
                            <button
                              onClick={() => {
                                setSelectedAppeal(app);
                                setResolveAdjustedScore(app.evaluation_final_score || 90);
                                setResolveModalOpen(true);
                              }}
                              className="px-3 py-1 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-lg font-bold text-xs shadow-xs"
                            >
                              Giải quyết đơn
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Evaluation Modal */}
      <EvaluationFormModal
        isOpen={modalOpen}
        evaluation={selectedEval}
        catalog={catalog}
        completedTasks={completedTasks}
        defaultMonth={selectedMonth}
        onClose={() => {
          setModalOpen(false);
          setSelectedEval(null);
        }}
        onSuccess={() => {
          fetchEvaluations();
        }}
      />

      {/* Submit Appeal Modal */}
      {appealModalOpen && appealTargetEval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#CFEBFC]">
            <h3 className="font-bold text-base text-[#0C3260] mb-2 flex items-center space-x-2">
              <MessageSquareWarning className="w-5 h-5 text-amber-500" />
              <span>Gửi Đơn Kiến Nghị Kết Quả Đánh Giá (Điều 22)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Kiến nghị kết quả đánh giá tháng {appealTargetEval.month} (Điểm hiện tại: {appealTargetEval.final_score}đ).
            </p>

            <form onSubmit={handleSubmitAppeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Lý do kiến nghị & Luận cứ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Nêu rõ nội dung không đồng ý, dẫn chứng các sản phẩm / nhiệm vụ đã hoàn thành..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Đường dẫn minh chứng đính kèm (URL file / văn bản)
                </label>
                <input
                  type="text"
                  value={appealEvidenceUrl}
                  onChange={(e) => setAppealEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white font-bold rounded-xl shadow-md"
                >
                  Gửi Đơn Lên Lãnh Đạo Xã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Appeal Modal (For Leadership) */}
      {resolveModalOpen && selectedAppeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#CFEBFC]">
            <h3 className="font-bold text-base text-[#0C3260] mb-2 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Giải Quyết Đơn Kiến Nghị — {selectedAppeal.employee_name}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Lý do kiến nghị: <em>"{selectedAppeal.reason}"</em>
            </p>

            <form onSubmit={handleResolveAppeal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Quyết định của Lãnh đạo UBND xã
                </label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="ACCEPTED">Chấp nhận kiến nghị & Điều chỉnh điểm</option>
                  <option value="REJECTED">Không chấp nhận (Bác đơn kiến nghị)</option>
                </select>
              </div>

              {resolveStatus === 'ACCEPTED' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Điểm số đánh giá sau điều chỉnh (Thang 100đ)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={resolveAdjustedScore}
                    onChange={(e) => setResolveAdjustedScore(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-emerald-700"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  Nội dung kết luận & phản hồi bằng văn bản
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolveResponseText}
                  onChange={(e) => setResolveResponseText(e.target.value)}
                  placeholder="Ghi rõ lý do chấp thuận hoặc không chấp thuận..."
                  className="w-full p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Ban Hành Quyết Định Giải Quyết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
