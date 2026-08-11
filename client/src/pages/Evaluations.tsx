import React, { useState, useEffect } from 'react';
import { evaluationsApi, catalogApi, tasksApi, departmentsApi, reportsApi } from '../services/api';
import { Evaluation, ProductCatalog, Task, Department } from '../types';
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
} from 'lucide-react';

export const Evaluations: React.FC = () => {
  const { user } = useAuth();

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalog[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await evaluationsApi.getEvaluations({
        month: selectedMonth || undefined,
        department_id: selectedDept ? Number(selectedDept) : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setEvaluations(data.evaluations);
    } catch (err: any) {
      console.error('Lỗi tải danh sách đánh giá:', err);
    } finally {
      setLoading(false);
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
  }, [selectedMonth, selectedDept, selectedStatus]);

  const handleDeleteEvaluation = async (ev: Evaluation) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phiếu đánh giá tháng ${ev.month}?`)) return;

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

  // Stats
  const approvedEvals = evaluations.filter((e) => e.status === 'APPROVED');
  const countA = approvedEvals.filter((e) => e.final_score >= 90).length;
  const countB = approvedEvals.filter((e) => e.final_score >= 70 && e.final_score < 90).length;
  const countC = approvedEvals.filter((e) => e.final_score >= 50 && e.final_score < 70).length;
  const countD = approvedEvals.filter((e) => e.final_score < 50).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã phê duyệt</span>
          </span>
        );
      case 'MANAGER_REVIEWED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Lãnh đạo duyệt</span>
          </span>
        );
      case 'SUBMITTED':
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

  const getClassificationBadge = (score: number, status: string) => {
    if (status !== 'APPROVED') return <span className="text-slate-400 text-xs italic">Chưa xếp loại</span>;
    if (score >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Xuất sắc (Loại A)
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          Tốt (Loại B)
        </span>
      );
    }
    if (score >= 50) {
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

  // Check if current employee already created evaluation for selected month
  const userEvalThisMonth = evaluations.find((e) => e.employee_id === user?.id && e.month === selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Đánh Giá & Xếp Loại Cán Bộ, Công Chức (NĐ 335)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình chấm điểm đa cấp: Cá nhân tự chấm $\rightarrow$ Trưởng bộ phận đánh giá $\rightarrow$ Lãnh đạo UBND xã phê duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => reportsApi.downloadExcel(selectedMonth)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>

          <button
            onClick={() => {
              setSelectedEval(userEvalThisMonth || null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>
              {userEvalThisMonth ? 'Mở Phiếu Tự Chấm Tháng Này' : 'Tạo Phiếu Tự Đánh Giá Tháng'}
            </span>
          </button>
        </div>
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

      {/* Monthly Classification Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Đã phê duyệt</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{approvedEvals.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 uppercase">Loại A (Xuất sắc)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{countA}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">$\ge 90$ điểm</div>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-800 uppercase">Loại B (Tốt)</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{countB}</div>
          <div className="text-[11px] text-sky-600 mt-0.5">70 - 89 điểm</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-800 uppercase">Loại C (Hoàn thành)</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{countC}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">50 - 69 điểm</div>
        </div>

        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 shadow-sm">
          <div className="text-xs font-semibold text-red-800 uppercase">Loại D (Không đạt)</div>
          <div className="text-2xl font-black text-red-700 mt-1">{countD}</div>
          <div className="text-[11px] text-red-600 mt-0.5">&lt; 50 điểm</div>
        </div>
      </div>

      {/* Evaluations Table Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase">Kỳ đánh giá:</span>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
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
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
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
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Cán bộ / Phòng ban</th>
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
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
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
                    (ev.status === 'DRAFT' && (ev.employee_id === user?.id || user?.role === 'ADMIN'));

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ev.employee_name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{ev.department_name || ev.employee_position}</span>
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
                        {getClassificationBadge(ev.final_score, ev.status)}
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
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteEvaluation(ev)}
                              title="Xóa phiếu nháp"
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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

      {/* Modal */}
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
    </div>
  );
};
