import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi, executiveDashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  CheckSquare,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { VietnameseEmblem } from '../components/VietnameseEmblem';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Phân hệ điều hành của Chủ tịch
  const [activeView, setActiveView] = useState<'general' | 'chairman'>('general');
  const [chairmanData, setChairmanData] = useState<any>(null);
  const [loadingChairman, setLoadingChairman] = useState<boolean>(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setData(null); // Clear old stats to prevent keeping old numbers
    try {
      const res = await reportsApi.getDashboardStats(selectedMonth);
      setData(res);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChairmanDashboard = async () => {
    try {
      setLoadingChairman(true);
      const res = await executiveDashboardApi.getDashboard();
      setChairmanData(res);
    } catch (err) {
      console.error('Lỗi tải dữ liệu điều hành Chủ tịch:', err);
    } finally {
      setLoadingChairman(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeView === 'chairman') {
      fetchChairmanDashboard();
    }
  }, [activeView]);

  const handleExportExcel = () => {
    reportsApi.downloadExcel(selectedMonth);
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên Hệ thống';
      case 'LEADERSHIP':
        return 'Lãnh đạo UBND Xã';
      case 'DEPARTMENT_HEAD':
        return 'Trưởng Bộ Phận / Trưởng Phòng';
      default:
        return 'Cán bộ, Công chức';
    }
  };

  const summary = {
    totalUsers: data?.summary?.totalUsers ?? data?.totalUsers ?? 0,
    totalDepartments: data?.summary?.totalDepartments ?? data?.totalDepartments ?? 0,
    totalTasks: data?.summary?.totalTasks ?? data?.totalTasks ?? 0,
    completedTasks: data?.summary?.completedTasks ?? data?.completedTasks ?? 0,
    inProgressTasks: data?.summary?.inProgressTasks ?? data?.inProgressTasks ?? 0,
    pendingTasks: data?.summary?.pendingTasks ?? data?.pendingTasks ?? 0,
    overdueTasks: data?.summary?.overdueTasks ?? data?.overdueTasks ?? 0,
    taskCompletionRate: data?.summary?.taskCompletionRate ?? data?.taskCompletionRate ?? 0,
    totalEvaluations: data?.summary?.totalEvaluations ?? data?.totalEvaluations ?? 0,
    approvedEvaluationsCount: data?.summary?.approvedEvaluationsCount ?? data?.approvedEvaluationsCount ?? 0,
    evalCompletionRate: data?.summary?.evalCompletionRate ?? data?.evalCompletionRate ?? 0,
    totalActiveStaff: data?.summary?.totalActiveStaff ?? 0,
    assignedStaff: data?.summary?.assignedStaff ?? 0,
    selfSubmittedStaff: data?.summary?.selfSubmittedStaff ?? 0,
    reviewedStaff: data?.summary?.reviewedStaff ?? 0,
    approvedStaff: data?.summary?.approvedStaff ?? 0,
    classifiedStaff: data?.summary?.classifiedStaff ?? 0,
    notStartedStaff: data?.summary?.notStartedStaff ?? 0,
  };

  const classifications = data?.classifications || {
    countA: 0,
    countB: 0,
    countC: 0,
    countD: 0,
    totalApproved: 0,
  };

  const totalClassified = classifications.totalApproved || 1; // Avoid division by 0
  const pctA = Math.round((classifications.countA / totalClassified) * 100);
  const pctB = Math.round((classifications.countB / totalClassified) * 100);
  const pctC = Math.round((classifications.countC / totalClassified) * 100);
  const pctD = Math.round((classifications.countD / totalClassified) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Hero Welcome Banner — Vietnix Blue Gradient */}
      <div className="bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] rounded-2xl p-6 lg:p-7 text-white shadow-xl relative overflow-hidden border border-[#9FD7F9]/30">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none" aria-hidden="true">
          <VietnameseEmblem size={240} alt="" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="hidden sm:block p-2 bg-[#0C3260]/70 rounded-2xl border border-[#9FD7F9]/40 shadow-inner flex-shrink-0" aria-hidden="true">
              <VietnameseEmblem size={56} alt="" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 bg-white/20 text-[#CFEBFC] border border-[#9FD7F9]/40 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Hệ thống Đánh giá & Xếp loại CBCC theo Nghị định 335/2025/NĐ-CP</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                Xin chào, {user?.fullname}!
              </h1>
              <p className="text-xs md:text-sm text-[#CFEBFC] max-w-2xl font-medium">
                Bạn đang đăng nhập với vai trò <strong className="text-white bg-[#0C3260]/60 px-2 py-0.5 rounded-md border border-[#6EC2F7]/40">{getRoleTitle(user?.role || '')}</strong>
                {user?.department_name ? ` — ${user.department_name}` : ''}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tasks"
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-[#0C3260]/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Giao việc mới</span>
            </Link>

            <Link
              to="/evaluations"
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#4585E6] hover:bg-[#1864AB] text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-[#0C3260]/30 transition"
            >
              <Award className="w-4 h-4 text-yellow-300" />
              <span>Tự chấm điểm tháng</span>
            </Link>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-emerald-900/30 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher for Chairman/Leadership */}
      {hasRole(['LEADERSHIP', 'ADMIN']) && (
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs space-x-1">
          <button
            onClick={() => setActiveView('general')}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
              activeView === 'general'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bảng Đánh Giá KPI & Cơ Quan (Chung)
          </button>
          <button
            onClick={() => setActiveView('chairman')}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
              activeView === 'chairman'
                ? 'bg-[#0C3260] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <VietnameseEmblem size={18} />
            <span>Bảng Điều Hành Chỉ Đạo Chủ Tịch</span>
          </button>
        </div>
      )}

      {activeView === 'chairman' ? (
        loadingChairman ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 shadow-2xs">
            Đang tổng hợp số liệu điều hành toàn xã Nghĩa Lâm...
          </div>
        ) : !chairmanData ? (
          <div className="p-12 text-center text-rose-500 text-sm bg-white rounded-2xl border border-slate-200 shadow-2xs">
            Lỗi tải dữ liệu điều hành của Chủ tịch.
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Assistant Summary Box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-2xs relative">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-800">
                  🤖 THƯ KÝ AI CHỦ TỊCH — DỰ THẢO THÔNG BÁO KẾT LUẬN CHỈ ĐẠO GIAO BAN
                </h3>
              </div>
              <div className="text-xs text-amber-900 leading-relaxed font-bold whitespace-pre-line">
                {chairmanData.summary}
              </div>
              <p className="text-[10px] text-amber-500 mt-3 font-medium italic">
                * Dự thảo chỉ đạo tự động dựa trên số liệu thực thu ngân sách, tiến độ giải ngân đầu tư công, hồ sơ đất đai trễ hạn trong ngày.
              </p>
            </div>

            {/* Warn Panels (Red/Yellow/Green) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Red warning */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-2 bg-rose-500" />
                <h4 className="text-xs font-black uppercase text-rose-700 flex items-center space-x-1.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>CẢNH BÁO ĐỎ (QUÁ HẠN / RỦI RO)</span>
                </h4>
                <ul className="space-y-3 text-xs text-slate-700 font-bold">
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Nhiệm vụ trễ hạn:</span>
                    <span className="text-rose-600 font-black">{chairmanData.metrics?.tasks?.overdue || 0} việc</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Khoản thu quá hạn:</span>
                    <span className="text-rose-600 font-black">{chairmanData.metrics?.budget?.overdueRevCount || 0} khoản</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Hồ sơ đất đai chậm hạn:</span>
                    <span className="text-rose-600 font-black">{chairmanData.metrics?.land?.overdueCases || 0} hồ sơ</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Công trình chậm tiến độ:</span>
                    <span className="text-rose-600 font-black">{chairmanData.metrics?.investment?.delayedProjCount || 0} công trình</span>
                  </li>
                </ul>
              </div>

              {/* Yellow warning */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-2 bg-amber-500" />
                <h4 className="text-xs font-black uppercase text-amber-700 flex items-center space-x-1.5 mb-4">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>CẢNH BÁO VÀNG (CẦN BỔ SUNG / SẮP HẠN)</span>
                </h4>
                <ul className="space-y-3 text-xs text-slate-700 font-bold">
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Nhiệm vụ đang thực hiện:</span>
                    <span className="text-amber-600 font-black">{chairmanData.metrics?.tasks?.inProgress || 0} việc</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Chi thiếu chứng từ:</span>
                    <span className="text-amber-600 font-black">{chairmanData.metrics?.budget?.missingDocExpCount || 0} khoản</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Đất đai (Cần bổ sung):</span>
                    <span className="text-amber-600 font-black">{chairmanData.metrics?.land?.yellowCases || 0} hồ sơ</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Đề xuất văn phòng chờ duyệt:</span>
                    <span className="text-amber-600 font-black">{chairmanData.metrics?.office?.pendingRequests || 0} đề xuất</span>
                  </li>
                </ul>
              </div>

              {/* Green info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-2 bg-emerald-500" />
                <h4 className="text-xs font-black uppercase text-emerald-700 flex items-center space-x-1.5 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>GHI NHẬN XANH (HOÀN THÀNH / TỐT)</span>
                </h4>
                <ul className="space-y-3 text-xs text-slate-700 font-bold">
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Nhiệm vụ hoàn thành:</span>
                    <span className="text-emerald-600 font-black">{chairmanData.metrics?.tasks?.completed || 0} việc</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Đã thu ngân sách:</span>
                    <span className="text-emerald-600 font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(chairmanData.metrics?.budget?.collectedRev || 0)}</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Đầu tư công giải ngân tb:</span>
                    <span className="text-emerald-600 font-black">{chairmanData.metrics?.investment?.avgDisbRate || 0}%</span>
                  </li>
                  <li className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Đất đai (Sổ đã cấp):</span>
                    <span className="text-emerald-600 font-black">{chairmanData.metrics?.land?.totalCases - chairmanData.metrics?.land?.greenCases - chairmanData.metrics?.land?.yellowCases - chairmanData.metrics?.land?.redCases} hồ sơ</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick module navigation shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card Budget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Thu/Chi Ngân Sách</h4>
                  <p className="text-slate-500 text-[11px] mt-1">Tổng thực chi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(chairmanData.metrics?.budget?.paidExp || 0)}</p>
                </div>
                <Link to="/budget" className="text-xs font-bold text-sky-600 hover:text-sky-800 mt-4 flex items-center space-x-1">
                  <span>Vào phân hệ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card Public Investment */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Giải ngân đầu tư công</h4>
                  <p className="text-slate-500 text-[11px] mt-1">Tổng số {chairmanData.metrics?.investment?.totalProj || 0} công trình trên địa bàn.</p>
                </div>
                <Link to="/public-investment" className="text-xs font-bold text-sky-600 hover:text-sky-800 mt-4 flex items-center space-x-1">
                  <span>Vào phân hệ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card Land Certificates */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Rà soát Đất đai KH965</h4>
                  <p className="text-slate-500 text-[11px] mt-1">Đã rà soát {chairmanData.metrics?.land?.reviewedPlots965 || 0}/{chairmanData.metrics?.land?.totalPlots965 || 0} thửa đất xóm.</p>
                </div>
                <Link to="/land-certificates" className="text-xs font-bold text-sky-600 hover:text-sky-800 mt-4 flex items-center space-x-1">
                  <span>Vào phân hệ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Card Office Requests */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Đăng ký & Hậu cần họp xe</h4>
                  <p className="text-slate-500 text-[11px] mt-1">Có {chairmanData.metrics?.office?.pendingRequests || 0} đề xuất chờ lãnh đạo duyệt.</p>
                </div>
                <Link to="/office" className="text-xs font-bold text-sky-600 hover:text-sky-800 mt-4 flex items-center space-x-1">
                  <span>Vào phân hệ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )
      ) : (
        // GENERAL VIEW (THE PRE-EXISTING GENERAL KPI DASHBOARD)
        <>
          {/* Month Filter Selector */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Kỳ báo cáo thống kê</div>
                <div className="text-sm font-bold text-slate-800">Tháng {selectedMonth}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const parts = val.split('-');
                  if (parts.length === 2) {
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12 && y >= 2020 && y <= 2050) {
                      setSelectedMonth(val);
                    }
                  }
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={fetchDashboard}
                title="Tải lại số liệu"
                className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 2. Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Personnel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cán bộ & Phòng ban</div>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">{summary.totalUsers}</span>
                <span className="text-xs text-slate-500">cán bộ</span>
              </div>
              <div className="mt-2 text-xs text-slate-600 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Thuộc <strong>{summary.totalDepartments}</strong> phòng ban, bộ phận</span>
              </div>
            </div>

            {/* Metric 2: Tasks Completion Rate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tiến độ nhiệm vụ</div>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
              {data?.summary?.tasksStatus === 'NO_DATA' ? (
                <div className="mt-4 text-xs font-bold text-slate-400">Chưa cập nhật dữ liệu</div>
              ) : data?.summary?.tasksStatus === 'NOT_APPLICABLE' ? (
                <div className="mt-4 text-xs font-bold text-slate-400">Không phát sinh</div>
              ) : data?.summary?.tasksStatus === 'PENDING' ? (
                <>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-400">0</span>
                    <span className="text-xs text-slate-500">/ {summary.totalTasks} việc</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded animate-pulse">Chưa thực hiện</span>
                    <span className="font-bold text-slate-400">0,00%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-sky-700">{summary.completedTasks}</span>
                    <span className="text-xs text-slate-500">/ {summary.totalTasks} việc</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Tỷ lệ hoàn thành:</span>
                    <span className="font-bold text-sky-700">{Number(summary.taskCompletionRate).toFixed(2).replace('.', ',')}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-sky-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${summary.taskCompletionRate}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Metric 3: Overdue Tasks */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nhiệm vụ quá hạn</div>
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-red-600">{summary.overdueTasks}</span>
                <span className="text-xs text-slate-500">việc quá hạn</span>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {summary.overdueTasks > 0 ? (
                  <span className="text-red-600 font-medium flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cần đôn đốc xử lý gấp</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center space-x-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Không có nhiệm vụ trễ hạn</span>
                  </span>
                )}
              </div>
            </div>

            {/* Metric 4: Monthly Evaluation Progress */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đánh giá tháng {selectedMonth}</div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              {data?.summary?.evaluationsStatus === 'NO_DATA' ? (
                <div className="mt-4 text-xs font-bold text-slate-400">Chưa cập nhật dữ liệu</div>
              ) : data?.summary?.evaluationsStatus === 'NOT_APPLICABLE' ? (
                <div className="mt-4 text-xs font-bold text-slate-400">Không phát sinh</div>
              ) : data?.summary?.evaluationsStatus === 'PENDING' ? (
                <>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-400">0</span>
                    <span className="text-xs text-slate-500">/ {summary.totalUsers} cán bộ</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded animate-pulse">Chưa thực hiện</span>
                    <span className="font-bold text-slate-400">0,00%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-amber-600">{summary.approvedEvaluationsCount}</span>
                    <span className="text-xs text-slate-500">/ {summary.totalUsers} cán bộ</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Tỷ lệ phê duyệt:</span>
                    <span className="font-bold text-amber-600">{Number(summary.evalCompletionRate).toFixed(2).replace('.', ',')}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${summary.evalCompletionRate}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Evaluation Step Progress Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Trạng Thái Đánh Giá & Thẩm Định Theo Kỳ (Tháng {selectedMonth})
                </h3>
                <p className="text-xs text-slate-500">Quy trình đánh giá 3 bước liên thông theo Nghị định 335</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Step 1: Active Staff */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng CBCC Hoạt Động</div>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-slate-800">{summary.totalActiveStaff ?? 0}</span>
                  <span className="text-xs text-slate-500">cán bộ</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Phạm vi kỳ báo cáo</div>
              </div>

              {/* Step 2: Assigned Staff */}
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Có Việc / Có Phiếu</div>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-sky-700">{summary.assignedStaff ?? 0}</span>
                  <span className="text-xs text-sky-600">/ {summary.totalActiveStaff ?? 0}</span>
                </div>
                <div className="text-[10px] text-sky-600 font-semibold mt-1">
                  {summary.totalActiveStaff > 0 ? Number((summary.assignedStaff / summary.totalActiveStaff) * 100).toFixed(2).replace('.', ',') : '0,00'}%
                </div>
              </div>

              {/* Step 3: Self Submitted */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Bước 1: Đã Tự Chấm</div>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-amber-700">{summary.selfSubmittedStaff ?? 0}</span>
                  <span className="text-xs text-amber-600">/ {summary.totalActiveStaff ?? 0}</span>
                </div>
                <div className="text-[10px] text-amber-600 font-semibold mt-1">
                  {summary.totalActiveStaff > 0 ? Number((summary.selfSubmittedStaff / summary.totalActiveStaff) * 100).toFixed(2).replace('.', ',') : '0,00'}%
                </div>
              </div>

              {/* Step 4: Reviewed */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Bước 2: Đã Thẩm Định</div>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-indigo-700">{summary.reviewedStaff ?? 0}</span>
                  <span className="text-xs text-indigo-600">/ {summary.totalActiveStaff ?? 0}</span>
                </div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-1">
                  {summary.totalActiveStaff > 0 ? Number((summary.reviewedStaff / summary.totalActiveStaff) * 100).toFixed(2).replace('.', ',') : '0,00'}%
                </div>
              </div>

              {/* Step 5: Approved */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Bước 3: Đã Phê Duyệt</div>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-emerald-700">{summary.approvedStaff ?? 0}</span>
                  <span className="text-xs text-emerald-600">/ {summary.totalActiveStaff ?? 0}</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  {summary.totalActiveStaff > 0 ? Number((summary.approvedStaff / summary.totalActiveStaff) * 100).toFixed(2).replace('.', ',') : '0,00'}%
                </div>
              </div>
            </div>
          </div>

          {/* 3. Middle Section: Charts & Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Decree 335 Performance Classification Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Xếp Loại Cán Bộ Theo Nghị Định 335 (Tháng {selectedMonth})
                  </h3>
                  <p className="text-xs text-slate-500">Tổng số đã phê duyệt: {classifications.totalApproved} cán bộ</p>
                </div>
                <Link to="/evaluations" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1">
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {/* Type A */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-800">Hoàn thành xuất sắc nhiệm vụ (Loại A: ≥ 90đ)</span>
                    <span className="font-bold text-emerald-700">{classifications.countA} cán bộ ({pctA}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pctA}%` }} />
                  </div>
                </div>

                {/* Type B */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-sky-800">Hoàn thành tốt nhiệm vụ (Loại B: 70 - 89đ)</span>
                    <span className="font-bold text-sky-700">{classifications.countB} cán bộ ({pctB}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${pctB}%` }} />
                  </div>
                </div>

                {/* Type C */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-800">Hoàn thành nhiệm vụ (Loại C: 50 - 69đ)</span>
                    <span className="font-bold text-amber-700">{classifications.countC} cán bộ ({pctC}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pctC}%` }} />
                  </div>
                </div>

                {/* Type D */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-red-800">Không hoàn thành nhiệm vụ (Loại D: &lt; 50đ)</span>
                    <span className="font-bold text-red-700">{classifications.countD} cán bộ ({pctD}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${pctD}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Department Tasks Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Tiến Độ Công Việc Theo Phòng Ban / Bộ Phận
                  </h3>
                  <p className="text-xs text-slate-500">Tỷ lệ hoàn thành nhiệm vụ giao</p>
                </div>
                <Link to="/tasks" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1">
                  <span>Xem nhiệm vụ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(data?.departmentProgress || []).map((d: any) => {
                  const hasTasks = d.total > 0;
                  return (
                    <div key={d.id}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-800 truncate max-w-[220px] font-semibold">{d.name}</span>
                        {hasTasks ? (
                          <span className="text-slate-700 font-bold">
                            {d.completed}/{d.total} ({Number(d.rate).toFixed(2).replace('.', ',')}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">
                            Không phát sinh
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            !hasTasks
                              ? 'bg-slate-200'
                              : d.rate >= 80
                              ? 'bg-emerald-500'
                              : d.rate >= 50
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${hasTasks ? d.rate : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Bottom Section: Urgent Tasks & Top Personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent Tasks */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Nhiệm Vụ Cần Xử Lý Gấp</h3>
                </div>
                <Link to="/tasks" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1">
                  <span>Tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {(!data?.urgentTasks || data.urgentTasks.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Không có nhiệm vụ nào tồn đọng hoặc gấp.
                  </div>
                ) : (
                  data.urgentTasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-slate-500 flex items-center space-x-1">
                          <span>{t.assignee_name}</span>
                          <span>•</span>
                          <span className="truncate">{t.department_name || 'UBND'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {t.is_overdue ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
                            Quá hạn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                            Sắp đến hạn
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Evaluated Employees */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Cán Bộ Có Điểm Đánh Giá Cao Nhất (Tháng {selectedMonth})
                  </h3>
                </div>
                <Link to="/evaluations" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1">
                  <span>Bảng điểm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {(!data?.topEmployees || data.topEmployees.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Chưa có phiếu đánh giá nào được phê duyệt trong tháng này.
                  </div>
                ) : (
                  data.topEmployees.map((emp: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.fullname}</div>
                          <div className="text-[11px] text-slate-500">{emp.position}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700">{emp.final_score} đ</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
