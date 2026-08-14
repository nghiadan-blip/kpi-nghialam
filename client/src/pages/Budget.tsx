import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetApi } from '../services/api';
import { BudgetRevenueItem, BudgetExpenditureItem } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  FileSpreadsheet, 
  AlertCircle, 
  Trash2, 
  Edit,
  DollarSign
} from 'lucide-react';

export const Budget: React.FC = () => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenditure'>('revenue');
  const [year, setYear] = useState<number>(2026);
  const [revenues, setRevenues] = useState<BudgetRevenueItem[]>([]);
  const [expenditures, setExpenditures] = useState<BudgetExpenditureItem[]>([]);
  const [stats, setStats] = useState<any>({
    revenue: { planned: 0, collected: 0, remaining: 0, percent: 0 },
    expenditure: { estimated: 0, approved: 0, paid: 0, remaining: 0, percent: 0 }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'revenue' | 'expenditure'>('revenue');
  const [editItem, setEditItem] = useState<any>(null);

  // Form inputs
  const [category, setCategory] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [payerOrUnit, setPayerOrUnit] = useState<string>('');
  const [plannedAmount, setPlannedAmount] = useState<number>(0);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [responsibleUserId, setResponsibleUserId] = useState<number>(6); // default to Vu Minh Tuan (emp)
  const [note, setNote] = useState<string>('');

  const [expenseName, setExpenseName] = useState<string>('');
  const [fundingSource, setFundingSource] = useState<string>('Kinh phí tự chủ');
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [documentStatus, setDocumentStatus] = useState<string>('full');
  const [expStatus, setExpStatus] = useState<string>('submitted');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budgetApi.getBudgets(year);
      setRevenues(data.revenues || []);
      setExpenditures(data.expenditures || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải dữ liệu tài chính ngân sách.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  const openAddModal = (type: 'revenue' | 'expenditure') => {
    setModalType(type);
    setEditItem(null);
    setShowModal(true);

    // Reset fields
    setCategory(type === 'revenue' ? 'Đất công ích' : 'Hoạt động công vụ');
    setSourceName('');
    setPayerOrUnit('');
    setPlannedAmount(0);
    setCollectedAmount(0);
    setDueDate(new Date().toISOString().slice(0, 10));
    setResponsibleUserId(6);
    setNote('');

    setExpenseName('');
    setFundingSource('Kinh phí tự chủ');
    setEstimatedAmount(0);
    setApprovedAmount(0);
    setPaidAmount(0);
    setDocumentStatus('full');
    setExpStatus('submitted');
  };

  const openEditModal = (type: 'revenue' | 'expenditure', item: any) => {
    setModalType(type);
    setEditItem(item);
    setShowModal(true);

    if (type === 'revenue') {
      setCategory(item.category);
      setSourceName(item.source_name);
      setPayerOrUnit(item.payer_or_unit || '');
      setPlannedAmount(item.planned_amount);
      setCollectedAmount(item.collected_amount);
      setDueDate(item.due_date ? item.due_date.slice(0, 10) : '');
      setResponsibleUserId(item.responsible_user_id || 6);
      setNote(item.note || '');
    } else {
      setCategory(item.category);
      setExpenseName(item.expense_name);
      setFundingSource(item.funding_source);
      setEstimatedAmount(item.estimated_amount);
      setApprovedAmount(item.approved_amount);
      setPaidAmount(item.paid_amount);
      setDocumentStatus(item.document_status);
      setExpStatus(item.status);
      setNote(item.note || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'revenue') {
        const payload = {
          year,
          category,
          source_name: sourceName,
          payer_or_unit: payerOrUnit,
          planned_amount: plannedAmount,
          collected_amount: collectedAmount,
          due_date: dueDate || null,
          responsible_department_id: 3,
          responsible_user_id: responsibleUserId,
          note
        };
        if (editItem) {
          await budgetApi.updateRevenue(editItem.id, payload);
        } else {
          await budgetApi.createRevenue(payload);
        }
      } else {
        const payload = {
          year,
          category,
          expense_name: expenseName,
          funding_source: fundingSource,
          estimated_amount: estimatedAmount,
          approved_amount: approvedAmount,
          paid_amount: paidAmount,
          document_status: documentStatus,
          status: expStatus,
          note
        };
        if (editItem) {
          await budgetApi.updateExpenditure(editItem.id, payload);
        } else {
          await budgetApi.createExpenditure(payload);
        }
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    }
  };

  const handleDelete = async (type: 'revenue' | 'expenditure', id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục tài chính này?')) return;
    try {
      if (type === 'revenue') {
        await budgetApi.deleteRevenue(id);
      } else {
        await budgetApi.deleteExpenditure(id);
      }
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa mục tài chính.');
    }
  };

  const handleExport = () => {
    budgetApi.exportExcel(year);
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-sky-600" />
            <span>QUẢN LÝ TÀI CHÍNH & NGÂN SÁCH XÃ</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Điều hành dự toán, doanh thu địa phương và phê duyệt các chi phí hoạt động công vụ UBND xã Nghĩa Lâm
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-700"
          >
            <option value={2026}>Năm ngân sách 2026</option>
            <option value={2025}>Năm ngân sách 2025</option>
          </select>

          <button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-2 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Thu Ngân Sách Xã ({year})</span>
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold">
              Đạt {stats.revenue.percent}% chỉ tiêu
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Kế hoạch thu</p>
              <p className="text-sm font-extrabold text-slate-700">{formatVND(stats.revenue.planned)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Thực tế đã thu</p>
              <p className="text-sm font-extrabold text-emerald-600">{formatVND(stats.revenue.collected)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Còn phải thu</p>
              <p className="text-sm font-extrabold text-rose-500">{formatVND(stats.revenue.remaining)}</p>
            </div>
          </div>
        </div>

        {/* Expenditure Stats Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-2 bg-blue-500" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-blue-500" />
              <span>Chi Ngân Sách Xã ({year})</span>
            </h3>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-extrabold">
              Đã giải ngân {stats.expenditure.percent}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Dự toán chi</p>
              <p className="text-xs font-bold text-slate-700">{formatVND(stats.expenditure.estimated)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Phê duyệt</p>
              <p className="text-xs font-bold text-slate-700">{formatVND(stats.expenditure.approved)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Đã thực chi</p>
              <p className="text-xs font-bold text-blue-600">{formatVND(stats.expenditure.paid)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">Chưa giải ngân</p>
              <p className="text-xs font-bold text-amber-600">{formatVND(stats.expenditure.remaining)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition ${
            activeTab === 'revenue' 
              ? 'border-sky-600 text-sky-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Doanh thu & Khoản thu địa phương
        </button>
        <button
          onClick={() => setActiveTab('expenditure')}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition ${
            activeTab === 'expenditure' 
              ? 'border-sky-600 text-sky-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hồ sơ Đề xuất chi ngân sách
        </button>
      </div>

      {/* Main Table Display */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Đang tải dữ liệu ngân sách xã...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-sm flex items-center justify-center space-x-1.5">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : activeTab === 'revenue' ? (
          <div>
            {/* Revenue Section */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Danh sách nguồn thu địa bàn xã</h4>
              {hasRole(['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD']) && (
                <button
                  onClick={() => openAddModal('revenue')}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Khai báo khoản thu</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Phân nhóm</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Tên khoản thu</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Đơn vị / Hộ nộp</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Dự toán thu</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Đã thực thu</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Hạn nộp</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Cán bộ phụ trách</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Trạng thái</th>
                    {hasRole(['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD']) && (
                      <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hành động</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {revenues.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500 text-xs">Không tìm thấy khoản thu nào.</td>
                    </tr>
                  ) : (
                    revenues.map((r, idx) => {
                      const isOverdue = r.status === 'overdue';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 text-xs">
                          <td className="px-4 py-3 font-semibold text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{r.category}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{r.source_name}</td>
                          <td className="px-4 py-3 text-slate-600">{r.payer_or_unit || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{formatVND(r.planned_amount)}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-emerald-600">{formatVND(r.collected_amount)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{r.due_date ? new Date(r.due_date).toLocaleDateString('vi-VN') : '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{r.responsible_user_name || 'Chưa phân công'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                              isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {r.status === 'completed' ? 'Đã nộp đủ' : r.status === 'partial' ? 'Thu một phần' : isOverdue ? 'Trễ hạn' : 'Đang theo dõi'}
                            </span>
                          </td>
                          {hasRole(['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD']) && (
                            <td className="px-4 py-3 text-center flex justify-center space-x-1.5">
                              <button
                                onClick={() => openEditModal('revenue', r)}
                                className="text-sky-600 hover:text-sky-800 p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('revenue', r.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Expenditure Section */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Danh sách đề xuất chi hoạt động thường xuyên</h4>
              <button
                onClick={() => openAddModal('expenditure')}
                className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đề xuất chi mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Phân nhóm</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Nội dung chi phí</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Nguồn tiền</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Đề xuất (đ)</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Phê duyệt (đ)</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Đã thực chi</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Cán bộ đề xuất</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Hồ sơ chứng từ</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {expenditures.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-500 text-xs">Chưa có đề xuất chi phí nào.</td>
                    </tr>
                  ) : (
                    expenditures.map((e, idx) => {
                      return (
                        <tr key={e.id} className="hover:bg-slate-50 text-xs">
                          <td className="px-4 py-3 font-semibold text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{e.category}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{e.expense_name}</td>
                          <td className="px-4 py-3 text-slate-600">{e.funding_source}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-600">{formatVND(e.estimated_amount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">{formatVND(e.approved_amount)}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-blue-600">{formatVND(e.paid_amount)}</td>
                          <td className="px-4 py-3 text-slate-600">{e.request_user_name || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              e.document_status === 'full' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {e.document_status === 'full' ? 'Đầy đủ Hóa đơn' : 'Thiếu chứng từ'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              e.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              e.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              e.status === 'submitted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {e.status === 'paid' ? 'Đã ngân quỹ' : e.status === 'approved' ? 'Đã duyệt chi' : e.status === 'submitted' ? 'Chờ duyệt' : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center flex justify-center space-x-1">
                            <button
                              onClick={() => openEditModal('expenditure', e)}
                              className="text-sky-600 hover:text-sky-800 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {hasRole(['ADMIN', 'LEADERSHIP']) && (
                              <button
                                onClick={() => handleDelete('expenditure', e.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#1864AB] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                {editItem ? 'CẬP NHẬT KHOẢN TÀI CHÍNH' : 'THÊM MỚI KHOẢN TÀI CHÍNH'} — {modalType === 'revenue' ? 'THU NGÂN SÁCH' : 'ĐỀ XUẤT CHI'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 text-xs font-bold">Đóng</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {modalType === 'revenue' ? (
                <>
                  {/* Revenue Fields */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Phân nhóm thu</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-bold"
                    >
                      <option value="Đất công ích">Đất công ích (Đất 5%)</option>
                      <option value="Hoa lợi công sản">Hoa lợi công sản</option>
                      <option value="Phí và Lệ phí">Phí & Lệ phí một cửa</option>
                      <option value="Thuế phi nông nghiệp">Thuế phi nông nghiệp</option>
                      <option value="Thu khác">Khoản thu khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Tên nguồn thu chi tiết</label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      required
                      placeholder="Ví dụ: Thu sản lượng đất 5% xóm 3 ven sông Lam"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Đơn vị / Hộ nộp</label>
                    <input
                      type="text"
                      value={payerOrUnit}
                      onChange={(e) => setPayerOrUnit(e.target.value)}
                      placeholder="Ví dụ: Các hộ dân sản xuất đất màu xóm 3"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Số tiền dự toán kế hoạch (VND)</label>
                      <input
                        type="number"
                        value={plannedAmount}
                        onChange={(e) => setPlannedAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Số tiền thực tế đã thu (VND)</label>
                      <input
                        type="number"
                        value={collectedAmount}
                        onChange={(e) => setCollectedAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Hạn hoàn thành thu</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Cán bộ phụ trách thụ lý</label>
                      <select
                        value={responsibleUserId}
                        onChange={(e) => setResponsibleUserId(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-700"
                      >
                        <option value={6}>Vũ Minh Tuấn (Địa chính)</option>
                        <option value={8}>Lê Văn Tài (Kế toán)</option>
                        <option value={4}>Phạm Quốc Hùng (PVHCC)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Số chứng từ / Biên lai nộp tiền</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: Biên lai số BL-2026-0089"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Expenditure Fields */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Phân loại khoản chi</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-bold"
                    >
                      <option value="Hoạt động công vụ">Hoạt động công vụ</option>
                      <option value="Nghiệp vụ chuyên môn">Nghiệp vụ chuyên môn</option>
                      <option value="Hội nghị">Chi Hội nghị / Tiếp khách</option>
                      <option value="Chi khác">Khoản chi thường xuyên khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Nội dung đề xuất chi chi tiết</label>
                    <input
                      type="text"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      required
                      placeholder="Ví dụ: Chi sắm văn phòng phẩm chuẩn bị phục vụ hội họp"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Nguồn kinh phí chi trả</label>
                    <select
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-700"
                    >
                      <option value="Kinh phí tự chủ">Kinh phí tự chủ ngân sách</option>
                      <option value="Kinh phí không tự chủ">Kinh phí không tự chủ</option>
                      <option value="Ngân sách cấp trên bổ sung">Huyện/Tỉnh bổ sung mục tiêu</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Đề xuất (VND)</label>
                      <input
                        type="number"
                        value={estimatedAmount}
                        onChange={(e) => setEstimatedAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Duyệt chi (VND)</label>
                      <input
                        type="number"
                        disabled={!hasRole(['LEADERSHIP', 'ADMIN'])}
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Thực chi (VND)</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-blue-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Hồ sơ quyết toán</label>
                      <select
                        value={documentStatus}
                        onChange={(e) => setDocumentStatus(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                      >
                        <option value="full">Đầy đủ Hóa đơn đỏ / Chứng từ</option>
                        <option value="missing_evidence">Thiếu hóa đơn chứng từ gốc</option>
                        <option value="pending_invoice">Chờ nhà cung cấp xuất hóa đơn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Trạng thái phê duyệt</label>
                      <select
                        value={expStatus}
                        disabled={!hasRole(['LEADERSHIP', 'ADMIN'])}
                        onChange={(e) => setExpStatus(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-sky-800 disabled:bg-slate-100"
                      >
                        <option value="submitted">Chờ phê duyệt</option>
                        <option value="approved">Đã phê duyệt chi</option>
                        <option value="paid">Đã xuất quỹ/Chi trả</option>
                        <option value="rejected">Từ chối chi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Ghi chú chi tiết</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Thông tin làm rõ thêm về khoản chi..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#1864AB] hover:bg-[#0c3260] text-white px-5 py-2 rounded-xl font-bold"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
