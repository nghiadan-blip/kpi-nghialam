import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
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
} from 'lucide-react';
import { VietnameseEmblem } from '../components/VietnameseEmblem';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getDashboardStats(selectedMonth);
      setData(res);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth]);

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

  const summary = data?.summary || {
    totalUsers: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    taskCompletionRate: 0,
    totalEvaluations: 0,
    approvedEvaluationsCount: 0,
    evalCompletionRate: 0,
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
      {/* 1. Hero Welcome Banner — Modern Royal Navy Gradient */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 rounded-2xl p-6 lg:p-7 text-white shadow-xl relative overflow-hidden border border-sky-500/30">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <VietnameseEmblem size={240} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="hidden sm:block p-2 bg-slate-900/80 rounded-2xl border border-sky-400/30 shadow-inner flex-shrink-0">
              <VietnameseEmblem size={56} />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 bg-sky-500/20 text-sky-200 border border-sky-300/30 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                <span>Hệ thống Đánh giá & Xếp loại CBCC theo Nghị định 335/2025/NĐ-CP</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                Xin chào, {user?.fullname}!
              </h1>
              <p className="text-xs md:text-sm text-sky-100/90 max-w-2xl font-medium">
                Bạn đang đăng nhập với vai trò <strong className="text-white bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-600/40">{getRoleTitle(user?.role || '')}</strong>
                {user?.department_name ? ` — ${user.department_name}` : ''}. Chúc bạn một ngày làm việc hiệu quả!
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tasks"
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-blue-900/40 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Giao việc mới</span>
            </Link>

            <Link
              to="/evaluations"
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-indigo-900/40 transition"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Tự chấm điểm tháng</span>
            </Link>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-emerald-900/40 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

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
            onChange={(e) => setSelectedMonth(e.target.value)}
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
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-sky-700">{summary.completedTasks}</span>
            <span className="text-xs text-slate-500">/ {summary.totalTasks} việc</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Tỷ lệ hoàn thành:</span>
            <span className="font-bold text-sky-700">{summary.taskCompletionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-sky-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.taskCompletionRate}%` }}
            />
          </div>
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
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{summary.approvedEvaluationsCount}</span>
            <span className="text-xs text-slate-500">/ {summary.totalUsers} cán bộ</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Tỷ lệ phê duyệt:</span>
            <span className="font-bold text-amber-600">{summary.evalCompletionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.evalCompletionRate}%` }}
            />
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
                <span className="text-emerald-800">Hoàn thành xuất sắc nhiệm vụ (Loại A - $\ge 90$đ)</span>
                <span className="font-bold text-emerald-700">{classifications.countA} cán bộ ({pctA}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pctA}%` }} />
              </div>
            </div>

            {/* Type B */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-sky-800">Hoàn thành tốt nhiệm vụ (Loại B - $70 - 89$đ)</span>
                <span className="font-bold text-sky-700">{classifications.countB} cán bộ ({pctB}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${pctB}%` }} />
              </div>
            </div>

            {/* Type C */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-800">Hoàn thành nhiệm vụ (Loại C - $50 - 69$đ)</span>
                <span className="font-bold text-amber-700">{classifications.countC} cán bộ ({pctC}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pctC}%` }} />
              </div>
            </div>

            {/* Type D */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-red-800">Không hoàn thành nhiệm vụ (Loại D - &lt; 50đ)</span>
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
            {(data?.departmentProgress || []).map((d: any) => (
              <div key={d.id}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-800 truncate max-w-[240px]">{d.name}</span>
                  <span className="text-slate-600 font-bold">
                    {d.completed}/{d.total} ({d.rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 50 ? 'bg-sky-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
              </div>
            ))}
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
    </div>
  );
};
