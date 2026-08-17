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
  TrendingUp
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
  const [search, setSearch] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('');
  const [settlementFilter, setSettlementFilter] = useState<string>('');

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
          search,
          investment_group: groupFilter || undefined,
          acceptance_status: acceptanceFilter || undefined,
          settlement_status: settlementFilter || undefined
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
  }, [search, groupFilter, acceptanceFilter, settlementFilter]);

  const handleDelete = async (p: Project) => {
    if (!canDelete) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${p.project_name}" [${p.project_code}]?`)) return;

    try {
      await projectApi.deleteProject(p.id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa dự án.');
    }
  };

  const getAcceptanceBadge = (status: string) => {
    switch (status) {
      case 'nghiem_thu_hoan_thanh':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">Nghiệm thu HT</span>;
      case 'nghiem_thu_tung_phan':
        return <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full text-[11px] font-bold">NT từng phần</span>;
      case 'khong_dat':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full text-[11px] font-bold">Không đạt</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[11px]">Chưa NT</span>;
    }
  };

  const getSettlementBadge = (status: string) => {
    switch (status) {
      case 'quyet_toan_xong':
      case 'da_quyet_toan':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full text-[11px] font-bold">Đã quyết toán</span>;
      case 'dang_quyet_toan':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold">Đang QT</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[11px]">Chưa QT</span>;
    }
  };

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
                Toàn bộ vòng đời
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi từ Chủ trương, Đấu thầu, Hợp đồng, Thi công đến Nghiệm thu & Quyết toán bàn giao
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => projectApi.exportExcel()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
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
              <p className="text-xs font-semibold text-slate-500">Giai đoạn Vòng đời</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-700 mt-1 font-medium">
                <span>Thi công: <strong className="text-[#1864AB]">{stats.by_lifecycle.executing}</strong></span>
                <span>Chờ NT: <strong className="text-amber-700">{stats.by_lifecycle.acceptance_pending}</strong></span>
                <span>Quyết toán: <strong className="text-purple-700">{stats.by_lifecycle.settling}</strong></span>
                <span>Hoàn thành: <strong className="text-emerald-700">{stats.by_lifecycle.completed}</strong></span>
              </div>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã dự án, tên công trình, số hợp đồng..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">-- Tất cả nhóm DA --</option>
            <option value="A">Nhóm A</option>
            <option value="B">Nhóm B</option>
            <option value="C">Nhóm C</option>
          </select>

          <select
            value={acceptanceFilter}
            onChange={(e) => setAcceptanceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">-- Nghiệm thu --</option>
            <option value="chua_nghiem_thu">Chưa nghiệm thu</option>
            <option value="nghiem_thu_tung_phan">Nghiệm thu từng phần</option>
            <option value="nghiem_thu_hoan_thanh">Nghiệm thu hoàn thành</option>
            <option value="khong_dat">Không đạt</option>
          </select>

          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">-- Quyết toán --</option>
            <option value="chua_quyet_toan">Chưa quyết toán</option>
            <option value="dang_quyet_toan">Đang quyết toán</option>
            <option value="da_quyet_toan">Đã duyệt quyết toán</option>
            <option value="quyet_toan_xong">Quyết toán xong</option>
          </select>
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
            <p className="text-sm font-semibold text-slate-700">Chưa có dự án đầu tư công nào</p>
            <p className="text-xs text-slate-400">Nhấn nút "Thêm Dự án Mới" để khởi tạo dự án đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã DA</th>
                  <th className="py-3 px-4">Tên Công trình / Dự án</th>
                  <th className="py-3 px-3 text-center">Nhóm</th>
                  <th className="py-3 px-4">Nhà thầu / Số HĐ</th>
                  <th className="py-3 px-4 text-right">Vốn phân bổ</th>
                  <th className="py-3 px-3 text-center">% Giải ngân</th>
                  <th className="py-3 px-3 text-center">% Tiến độ</th>
                  <th className="py-3 px-3 text-center">Nghiệm thu</th>
                  <th className="py-3 px-3 text-center">Quyết toán</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {p.project_code}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-800 line-clamp-1">{p.project_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.inv_investor_name || 'UBND xã Nghĩa Lâm'} • Phụ trách: {p.project_manager_name || 'Chưa gán'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-[11px] px-2 py-0.5 bg-sky-100 text-[#1864AB] rounded-md">
                        {p.investment_group}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-800">{p.inv_contractor || 'Chưa có nhà thầu'}</p>
                      <p className="text-[11px] font-mono text-slate-500">{p.contract_no || 'Chưa ký HĐ'}</p>
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
                      {getAcceptanceBadge(p.acceptance_status)}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getSettlementBadge(p.settlement_status)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedProjectId(p.id)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#1864AB] rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-sky-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Xóa dự án"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
