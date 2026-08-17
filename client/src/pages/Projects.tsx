import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  Search,
  Layers,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  TrendingUp,
  Archive,
  AlertOctagon,
  XCircle
} from 'lucide-react';
import { Project, ProjectDashboardStats } from '../types';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { CreateProjectWizardModal } from '../components/CreateProjectWizardModal';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('');
  const [obstacleFilter, setObstacleFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [delayedOnly, setDelayedOnly] = useState<boolean>(false);
  const [gapAlertOnly, setGapAlertOnly] = useState<boolean>(false);

  // Modals
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate =
    user?.role === 'LEADERSHIP' ||
    (user?.role === 'DEPARTMENT_HEAD' && user?.department_id === 3) ||
    (user?.role === 'EMPLOYEE' && user?.department_id === 3);

  const canDelete = user?.role === 'LEADERSHIP' || user?.role === 'ADMIN';

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [pRes, sRes] = await Promise.all([
        projectApi.getProjects({
          search: search || undefined,
          investment_group: groupFilter || undefined,
          lifecycle_status: lifecycleFilter || undefined,
          obstacle_type: obstacleFilter || undefined,
          year: yearFilter || undefined,
          is_delayed: delayedOnly ? 'true' : undefined,
          progress_gap_alert: gapAlertOnly ? 'warning' : undefined
        }),
        projectApi.getDashboard()
      ]);
      setProjects(pRes.projects || []);
      setStats(sRes);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu dự án:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, groupFilter, lifecycleFilter, obstacleFilter, yearFilter, delayedOnly, gapAlertOnly]);

  const handleClearFilters = () => {
    setSearch('');
    setGroupFilter('');
    setLifecycleFilter('');
    setObstacleFilter('');
    setYearFilter('');
    setDelayedOnly(false);
    setGapAlertOnly(false);
  };

  const handleDelete = async (p: Project) => {
    if (!canDelete) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${p.project_name}" [${p.project_code}]?`)) return;

    try {
      await projectApi.deleteProject(p.id, { action: 'delete' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa dự án.');
    }
  };

  const handleArchive = async (p: Project) => {
    if (!window.confirm(`Chuyển dự án "${p.project_name}" [${p.project_code}] sang trạng thái Lưu trữ?`)) return;
    try {
      await projectApi.deleteProject(p.id, { action: 'archive' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu trữ dự án.');
    }
  };

  const handleExport = () => {
    projectApi.exportExcel({
      search: search || undefined,
      investment_group: groupFilter || undefined,
      lifecycle_status: lifecycleFilter || undefined,
      obstacle_type: obstacleFilter || undefined,
      year: yearFilter || undefined
    });
  };

  const getLifecycleBadge = (status: string, isDelayed?: boolean) => {
    if (isDelayed || status === 'DELAYED') {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200 inline-flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span>Chậm tiến độ</span>
        </span>
      );
    }

    switch (status) {
      case 'PREPARATION':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">1. Đang chuẩn bị</span>;
      case 'BIDDING':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px] font-bold">2. Lựa chọn nhà thầu</span>;
      case 'CONTRACTED':
      case 'CONTRACT_SIGNED':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">3. Đã ký hợp đồng</span>;
      case 'CONSTRUCTION':
        return <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold">4. Đang thi công</span>;
      case 'PARTIAL_ACCEPTANCE':
        return <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[11px] font-bold">5. NT từng phần</span>;
      case 'COMPLETION_ACCEPTANCE':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">6. NT hoàn thành</span>;
      case 'HANDED_OVER':
      case 'HANDOVER':
        return <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[11px] font-bold">7. Đã bàn giao</span>;
      case 'SETTLEMENT_UNDER_REVIEW':
      case 'SETTLEMENT':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-bold">8. Đang thẩm tra QT</span>;
      case 'SETTLEMENT_APPROVED':
        return <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[11px] font-extrabold">9. Đã duyệt QT</span>;
      case 'WARRANTY':
        return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[11px] font-bold">10. Đang bảo hành</span>;
      case 'COMPLETED':
      case 'CLOSED':
        return <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-extrabold">11. Tất toán / Đóng</span>;
      case 'ARCHIVED':
        return <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px]">Lưu trữ</span>;
      case 'CANCELLED_DRAFT':
        return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[11px]">Đã hủy</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">{status}</span>;
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(groupFilter) ||
    Boolean(lifecycleFilter) ||
    Boolean(obstacleFilter) ||
    Boolean(yearFilter) ||
    delayedOnly ||
    gapAlertOnly;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C3260] to-[#1864AB] text-white flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-[#9FD7F9]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-800">Quản lý Dự án Đầu tư công</h1>
              <span className="bg-[#CFEBFC] text-[#1864AB] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#9FD7F9]">
                Quy trình 16 bước chuẩn
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ điện tử toàn bộ vòng đời: Chủ trương, BCKTKT, Đấu thầu, Thi công, Nghiệm thu, Quyết toán & Bảo hành
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition border border-slate-300 shadow-2xs"
            title="Xuất Excel theo bộ lọc hiện tại"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Báo Cáo Đầu Tư</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#0C3260] to-[#1864AB] hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#9FD7F9]" />
              <span>Thêm Dự án Mới</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress Gap Alerts Banner */}
      {stats?.progress_gaps && stats.progress_gaps.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertOctagon className="w-4.5 h-4.5 text-amber-700 shrink-0" />
            <span>Cảnh báo Chênh lệch Giải ngân & Tiến độ ({stats.progress_gaps.length} dự án cần lưu ý):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats.progress_gaps.map((gap) => (
              <div key={gap.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-800">[{gap.project_code}] {gap.project_name}</span>
                  <p className="text-amber-800 text-[11px] mt-0.5">{gap.reason}</p>
                </div>
                <button
                  onClick={() => setSelectedProjectId(gap.id)}
                  className="px-2 py-1 bg-amber-100 text-amber-900 rounded text-[11px] font-bold shrink-0 ml-2 hover:bg-amber-200"
                >
                  Xem ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Tổng số Dự án</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.total_projects}</p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-600 mt-1 font-medium">
                <span>Nhóm A: <strong className="text-slate-800">{stats.by_group.A}</strong></span>
                <span>•</span>
                <span>Nhóm B: <strong className="text-slate-800">{stats.by_group.B}</strong></span>
                <span>•</span>
                <span>Nhóm C: <strong className="text-[#1864AB]">{stats.by_group.C}</strong></span>
              </div>
            </div>
            <div className="w-11 h-11 bg-sky-50 text-[#1864AB] rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Vốn Phân bổ (Nguồn ĐTC)</p>
              <p className="text-xl font-black text-[#1864AB] mt-1">
                {(stats.financials.total_allocated_capital || 0).toLocaleString()} đ
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Kế hoạch: {(stats.financials.total_planned_capital || 0).toLocaleString()} đ
              </p>
            </div>
            <div className="w-11 h-11 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Đã Giải ngân</p>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {(stats.financials.total_disbursed_amount || 0).toLocaleString()} đ
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-bold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tỷ lệ: {stats.financials.average_disbursement_rate}%</span>
              </div>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Vòng đời Dự án</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-700 mt-1 font-medium">
                <span>Thi công: <strong className="text-[#1864AB]">{stats.by_lifecycle.executing}</strong></span>
                <span>Chờ NT: <strong className="text-amber-700">{stats.by_lifecycle.acceptance_pending}</strong></span>
                <span>Quyết toán: <strong className="text-purple-700">{stats.by_lifecycle.settling}</strong></span>
                <span>Tất toán: <strong className="text-emerald-700">{stats.by_lifecycle.completed}</strong></span>
              </div>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã DA, tên công trình, nhà thầu, số hợp đồng..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">-- Nhóm DA --</option>
              <option value="A">Nhóm A</option>
              <option value="B">Nhóm B</option>
              <option value="C">Nhóm C</option>
            </select>

            <select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">-- Trạng thái vòng đời --</option>
              <option value="PREPARATION">1. Đang chuẩn bị hồ sơ</option>
              <option value="BIDDING">2. Lựa chọn nhà thầu</option>
              <option value="CONTRACTED">3. Đã ký hợp đồng</option>
              <option value="CONSTRUCTION">4. Đang thi công</option>
              <option value="DELAYED">Chậm tiến độ</option>
              <option value="PARTIAL_ACCEPTANCE">5. Nghiệm thu từng phần</option>
              <option value="COMPLETION_ACCEPTANCE">6. Nghiệm thu hoàn thành</option>
              <option value="HANDED_OVER">7. Bàn giao đưa vào SD</option>
              <option value="SETTLEMENT_UNDER_REVIEW">8. Đang thẩm tra QT</option>
              <option value="SETTLEMENT_APPROVED">9. Đã duyệt quyết toán</option>
              <option value="WARRANTY">10. Đang bảo hành</option>
              <option value="COMPLETED">11. Tất toán / Đóng DA</option>
              <option value="ARCHIVED">Lưu trữ hồ sơ</option>
            </select>

            <select
              value={obstacleFilter}
              onChange={(e) => setObstacleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">-- Danh mục Vướng mắc --</option>
              <option value="LAND_CLEARANCE">Giải phóng mặt bằng</option>
              <option value="LEGAL_PROCEDURE">Thủ tục pháp lý</option>
              <option value="WEATHER">Thời tiết / Thiên tai</option>
              <option value="CONTRACTOR">Tiến độ nhà thầu</option>
              <option value="FUNDING">Nguồn vốn đối ứng</option>
              <option value="DESIGN">Thiết kế / Phát sinh</option>
              <option value="OTHER">Vướng mắc khác</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="">-- Năm kế hoạch --</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
            </select>
          </div>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDelayedOnly(!delayedOnly)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition ${
                delayedOnly
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Chỉ hiện DA Chậm tiến độ</span>
            </button>

            <button
              onClick={() => setGapAlertOnly(!gapAlertOnly)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition ${
                gapAlertOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Cảnh báo Chênh lệch Giải ngân</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center space-x-1 font-semibold transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          <p className="text-slate-500 font-medium">
            Tìm thấy <strong className="text-slate-800">{projects.length}</strong> dự án
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#1864AB] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium">Đang tải danh sách dự án...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Không tìm thấy dự án nào phù hợp</p>
            <p className="text-xs text-slate-400">Vui lòng thử lại với các tiêu chí tìm kiếm hoặc bộ lọc khác.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã DA</th>
                  <th className="py-3 px-4">Tên Công trình / Dự án</th>
                  <th className="py-3 px-3 text-center">Nhóm</th>
                  <th className="py-3 px-4">Giai đoạn Vòng đời</th>
                  <th className="py-3 px-4 text-right">Vốn phân bổ</th>
                  <th className="py-3 px-3 text-center">% Giải ngân</th>
                  <th className="py-3 px-3 text-center">% Tiến độ</th>
                  <th className="py-3 px-3 text-center">Tiến độ/Chậm</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const isDelayed = Boolean((p as any).is_delayed || (p as any).delay_days > 0);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition ${isDelayed ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.project_code}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 line-clamp-1">{p.project_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {p.investor_name || 'UBND xã Nghĩa Lâm'} • Phụ trách: {p.project_manager_name || 'Chưa gán'}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-[11px] px-2 py-0.5 bg-sky-100 text-[#1864AB] rounded-md">
                          {p.investment_group}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getLifecycleBadge(p.lifecycle_status, isDelayed)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 whitespace-nowrap">
                        {(p.inv_allocated_capital || 0).toLocaleString()} đ
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {p.inv_disbursement_rate || 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {p.inv_actual_progress_percent || 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isDelayed ? (
                          <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-[11px]">
                            Chậm {(p as any).delay_days || 0} ngày
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[11px]">Đúng tiến độ</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedProjectId(p.id)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#1864AB] rounded-lg text-xs font-bold flex items-center space-x-1 transition border border-sky-200 shadow-2xs"
                            title="Xem chi tiết, 16 bước quy trình & hồ sơ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết / 16 bước</span>
                          </button>

                          {canDelete && (
                            <>
                              <button
                                onClick={() => handleArchive(p)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded transition"
                                title="Lưu trữ hồ sơ"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Xóa dự án"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          onRefresh={fetchData}
        />
      )}

      {/* Create Project Wizard Modal */}
      {showCreateWizard && (
        <CreateProjectWizardModal
          onClose={() => setShowCreateWizard(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
