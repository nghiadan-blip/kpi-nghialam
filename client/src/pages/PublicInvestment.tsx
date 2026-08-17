import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { publicInvestmentApi } from '../services/api';
import { PublicInvestmentProject } from '../types';
import { 
  Building2, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Edit, 
  Construction
} from 'lucide-react';

export const PublicInvestment: React.FC = () => {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState<PublicInvestmentProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [obstacleFilter, setObstacleFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modal form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PublicInvestmentProject | null>(null);

  // Form inputs
  const [projectCode, setProjectCode] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [investorName, setInvestorName] = useState<string>('UBND xã Nghĩa Lâm');
  const [fundingSource, setFundingSource] = useState<string>('');
  const [plannedCapital, setPlannedCapital] = useState<number>(0);
  const [allocatedCapital, setAllocatedCapital] = useState<number>(0);
  const [disbursedAmount, setDisbursedAmount] = useState<number>(0);
  const [contractor, setContractor] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [actualProgress, setActualProgress] = useState<number>(0);
  const [acceptanceValue, setAcceptanceValue] = useState<number>(0);
  const [paymentDocumentStatus, setPaymentDocumentStatus] = useState<string>('Chưa nộp');
  const [obstacleType, setObstacleType] = useState<string>('none');
  const [obstacleNote, setObstacleNote] = useState<string>('');
  const [responsibleUserId, setResponsibleUserId] = useState<number>(6); // Vu Minh Tuan (emp)
  const [projStatus, setProjStatus] = useState<string>('preparing');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await publicInvestmentApi.getProjects(statusFilter, obstacleFilter, search);
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách công trình đầu tư công.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, obstacleFilter, search]);

  const openAddModal = () => {
    setEditItem(null);
    setShowModal(true);

    // Reset fields
    setProjectCode('');
    setProjectName('');
    setInvestorName('UBND xã Nghĩa Lâm');
    setFundingSource('Vốn chương trình mục tiêu quốc gia xây dựng nông thôn mới');
    setPlannedCapital(0);
    setAllocatedCapital(0);
    setDisbursedAmount(0);
    setContractor('');
    setStartDate('');
    setEndDate('');
    setActualProgress(0);
    setAcceptanceValue(0);
    setPaymentDocumentStatus('Chưa nộp');
    setObstacleType('none');
    setObstacleNote('');
    setResponsibleUserId(6);
    setProjStatus('preparing');
  };

  const openEditModal = (item: PublicInvestmentProject) => {
    setEditItem(item);
    setShowModal(true);

    setProjectCode(item.project_code);
    setProjectName(item.project_name);
    setInvestorName(item.investor_name);
    setFundingSource(item.funding_source);
    setPlannedCapital(item.planned_capital);
    setAllocatedCapital(item.allocated_capital);
    setDisbursedAmount(item.disbursed_amount);
    setContractor(item.contractor || '');
    setStartDate(item.start_date ? item.start_date.slice(0, 10) : '');
    setEndDate(item.end_date ? item.end_date.slice(0, 10) : '');
    setActualProgress(item.actual_progress_percent);
    setAcceptanceValue(item.acceptance_value);
    setPaymentDocumentStatus(item.payment_document_status || 'Chưa nộp');
    setObstacleType(item.obstacle_type);
    setObstacleNote(item.obstacle_note || '');
    setResponsibleUserId(item.responsible_user_id || 6);
    setProjStatus(item.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plannedCapital < 0) {
      alert('Vốn kế hoạch không được là số âm.');
      return;
    }
    if (allocatedCapital < 0) {
      alert('Vốn phân bổ không được là số âm.');
      return;
    }
    if (disbursedAmount < 0) {
      alert('Số tiền đã giải ngân không được là số âm.');
      return;
    }
    if (acceptanceValue < 0) {
      alert('Giá trị nghiệm thu không được là số âm.');
      return;
    }
    if (disbursedAmount > allocatedCapital) {
      alert('Số tiền đã giải ngân không được lớn hơn vốn phân bổ (tỷ lệ giải ngân không vượt 100%).');
      return;
    }

    try {
      const payload = {
        project_code: projectCode,
        project_name: projectName,
        investor_name: investorName,
        funding_source: fundingSource,
        planned_capital: plannedCapital,
        allocated_capital: allocatedCapital,
        disbursed_amount: disbursedAmount,
        contractor,
        start_date: startDate || null,
        end_date: endDate || null,
        actual_progress_percent: actualProgress,
        acceptance_value: acceptanceValue,
        payment_document_status: paymentDocumentStatus,
        obstacle_type: obstacleType,
        obstacle_note: obstacleNote,
        responsible_user_id: responsibleUserId,
        status: projStatus
      };

      if (editItem) {
        await publicInvestmentApi.updateProject(editItem.id, payload);
      } else {
        await publicInvestmentApi.createProject(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu công trình.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.')) return;
    try {
      await publicInvestmentApi.deleteProject(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa công trình.');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleExport = async () => {
    setExportStatus('loading');
    try {
      const res = await publicInvestmentApi.exportExcel();
      const blob = new Blob([res.data], { type: res.headers['content-type'] as string });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bao_cao_dau_tu_cong.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setExportStatus('failed');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-sky-600" />
            <span>GIẢI NGÂN VỐN ĐẦU TƯ CÔNG XÃ NGHĨA LÂM</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Theo dõi tiến độ thi công, hồ sơ nghiệm thu, tỷ lệ giải ngân kho bạc và tháo gỡ vướng mắc cho các công trình nông thôn mới nâng cao
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={handleExport}
            disabled={exportStatus === 'loading'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {exportStatus === 'idle' && 'Xuất báo cáo đầu tư'}
              {exportStatus === 'loading' && 'Đang xuất...'}
              {exportStatus === 'success' && 'Thành công ✓'}
              {exportStatus === 'failed' && 'Thất bại ✗'}
            </span>
          </button>
          {hasRole(['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD']) && (
            <button
              onClick={openAddModal}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm công trình</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center gap-4 text-xs font-bold text-slate-600">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên công trình, mã số, nhà thầu thi công..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-medium"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
          >
            <option value="">-- Mọi trạng thái --</option>
            <option value="preparing">Đang chuẩn bị hồ sơ</option>
            <option value="executing">Đang thi công</option>
            <option value="delayed">Bị chậm tiến độ</option>
            <option value="completed">Đã hoàn thành bàn giao</option>
            <option value="settled">Đã quyết toán công trình</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={obstacleFilter}
            onChange={(e) => setObstacleFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
          >
            <option value="">-- Mọi vướng mắc --</option>
            <option value="none">Không vướng mắc</option>
            <option value="gpmb">Giải phóng mặt bằng</option>
            <option value="procedure">Thủ tục pháp lý đầu tư</option>
            <option value="weather">Thời tiết bão lũ</option>
            <option value="contractor">Nhà thầu thi công</option>
            <option value="funding">Nguồn kinh phí giải ngân</option>
          </select>
        </div>
      </div>

      {/* Projects Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách công trình...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-sm">{error}</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Không tìm thấy công trình đầu tư công nào khớp bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Mã / Công trình</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Nguồn vốn</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Kế hoạch / Phân bổ</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Đã Giải ngân (đ)</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Tỷ lệ</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Thi công thực tế</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Nhà thầu</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Vướng mắc</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {projects.map((p) => {
                  const hasObstacles = p.obstacle_type !== 'none';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 text-xs">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.project_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-0.5">{p.project_code} — Chủ đầu tư: {p.investor_name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{p.funding_source}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-slate-700">{formatVND(p.planned_capital)}</div>
                        <div className="text-[10px] text-slate-400">Phân bổ: {formatVND(p.allocated_capital)}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                        {formatVND(p.disbursed_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-[#1864AB] flex items-center justify-center space-x-1">
                          <span>{Math.min(100, p.disbursement_rate)}%</span>
                          {(p.disbursed_amount > p.allocated_capital || p.disbursement_rate > 100) && (
                            <span className="text-rose-500 font-bold" title="Dữ liệu bất thường: Đã giải ngân vượt quá vốn phân bổ!">⚠️</span>
                          )}
                        </div>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, p.disbursement_rate)}%` }} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-700 flex items-center justify-center space-x-1">
                          <Construction className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.actual_progress_percent}%</span>
                        </div>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, p.actual_progress_percent)}%` }} 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{p.contractor || 'Chưa chọn'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.obstacle_type === 'none' ? 'bg-emerald-50 text-emerald-700' :
                          p.obstacle_type === 'weather' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {p.obstacle_type === 'none' ? 'Bình thường' : 
                           p.obstacle_type === 'gpmb' ? 'Vướng GPMB' :
                           p.obstacle_type === 'procedure' ? 'Vướng thủ tục' :
                           p.obstacle_type === 'weather' ? 'Thời tiết' : 'Vướng nhà thầu'}
                        </span>
                        {hasObstacles && p.obstacle_note && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate" title={p.obstacle_note}>
                            {p.obstacle_note}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'completed' || p.status === 'settled' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'delayed' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                          p.status === 'executing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.status === 'completed' ? 'Đã hoàn thành' : 
                           p.status === 'settled' ? 'Đã quyết toán' :
                           p.status === 'delayed' ? 'Chậm tiến độ' :
                           p.status === 'executing' ? 'Đang thi công' : 'Đang chuẩn bị'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center flex justify-center space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-sky-600 hover:text-sky-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {hasRole(['ADMIN', 'LEADERSHIP']) && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#1864AB] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                {editItem ? 'CẬP NHẬT CÔNG TRÌNH ĐẦU TƯ CÔNG' : 'THÊM MỚI DỰ ÁN ĐẦU TƯ CÔNG'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 text-xs font-bold">Đóng</button>
            </div>

            <form noValidate onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-slate-500 font-bold mb-1">Mã dự án (Chuẩn)</label>
                  <input
                    type="text"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    required
                    placeholder="DA-2026-XX"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">Tên công trình/dự án</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    placeholder="Ví dụ: Xây dựng nhà văn hóa thôn xóm 4 Nghĩa Lâm"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Chủ đầu tư</label>
                  <input
                    type="text"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Nguồn vốn cấp phát</label>
                  <input
                    type="text"
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    required
                    placeholder="Ví dụ: Vốn chương trình MTQG xây dựng nông thôn mới"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Dự toán trung hạn (đ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={plannedCapital}
                    onChange={(e) => setPlannedCapital(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Vốn phân bổ năm (đ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={allocatedCapital}
                    onChange={(e) => setAllocatedCapital(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Đã giải ngân (đ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={disbursedAmount}
                    onChange={(e) => setDisbursedAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Nhà thầu thi công</label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="Ví dụ: Công ty CP xây dựng Hoàng Long"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Giá trị khối lượng nghiệm thu</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={acceptanceValue}
                    onChange={(e) => setAcceptanceValue(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tiến độ thi công (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={actualProgress}
                    onChange={(e) => setActualProgress(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Trạng thái hồ sơ chi</label>
                  <input
                    type="text"
                    value={paymentDocumentStatus}
                    onChange={(e) => setPaymentDocumentStatus(e.target.value)}
                    placeholder="Ví dụ: Đang trình kho bạc"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Trạng thái dự án</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-sky-800"
                  >
                    <option value="preparing">Chuẩn bị hồ sơ</option>
                    <option value="executing">Đang thi công</option>
                    <option value="delayed">Chậm tiến độ</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="settled">Đã quyết toán</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phân loại vướng mắc</label>
                  <select
                    value={obstacleType}
                    onChange={(e) => setObstacleType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-rose-800"
                  >
                    <option value="none">Không vướng mắc</option>
                    <option value="gpmb">Giải phóng mặt bằng</option>
                    <option value="procedure">Thủ tục đầu tư</option>
                    <option value="weather">Thời tiết lũ lụt</option>
                    <option value="contractor">Năng lực nhà thầu</option>
                    <option value="funding">Thiếu nguồn vốn cấp</option>
                    <option value="other">Lý do khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Hạn hoàn thành công trình</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Ghi chú vướng mắc / Chỉ đạo nóng của Chủ tịch</label>
                <textarea
                  value={obstacleNote}
                  onChange={(e) => setObstacleNote(e.target.value)}
                  placeholder="Ghi rõ chi tiết vướng mắc, hướng xử lý..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

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

export default PublicInvestment;
