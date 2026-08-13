import React, { useState, useEffect } from 'react';
import { tasksApi, usersApi, catalogApi, departmentsApi } from '../services/api';
import { Task, TaskStats, User, ProductCatalog, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { TaskModal } from '../components/TaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  Building2,
  RefreshCw,
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    completion_rate: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalog[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const data = await tasksApi.getTaskStats();
      setStats(data.stats);
    } catch (e) {
      console.error('Lỗi lấy thống kê nhiệm vụ:', e);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = {
        department_id: selectedDept ? Number(selectedDept) : undefined,
        assigned_to: selectedAssignee ? Number(selectedAssignee) : undefined,
        search: search || undefined,
      };

      if (activeStatusTab === 'OVERDUE') {
        params.overdue_only = true;
      } else if (activeStatusTab !== 'ALL') {
        params.status = activeStatusTab;
      }

      const data = await tasksApi.getTasks(params);
      setTasks(data.tasks);
    } catch (err: any) {
      console.error('Lỗi tải danh sách nhiệm vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [uData, dData, cData] = await Promise.all([
        usersApi.getUsers({ status: 'ACTIVE' }),
        departmentsApi.getDepartments(),
        catalogApi.getCatalog({ status: 'ACTIVE' }),
      ]);
      setUsers(uData.users);
      setDepartments(dData.departments);
      setCatalog(cData.catalog);
    } catch (e) {
      console.error('Lỗi tải dữ liệu danh mục phụ:', e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [activeStatusTab, selectedDept, selectedAssignee]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhiệm vụ "${task.title}"?`)) return;

    try {
      await tasksApi.deleteTask(task.id);
      setActionMessage({ type: 'success', text: `Đã xóa nhiệm vụ "${task.title}".` });
      fetchTasks();
      fetchStats();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa nhiệm vụ.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const getStatusBadge = (t: Task) => {
    if (t.is_overdue || t.computed_status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3" />
          <span>Quá hạn</span>
        </span>
      );
    }
    switch (t.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            <span>Đã xong</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            <Clock className="w-3 h-3" />
            <span>Đang làm</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            <span>Chờ tiếp nhận</span>
          </span>
        );
    }
  };

  const formatDeadline = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900">Quản Lý & Theo Dõi Nhiệm Vụ</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Phân công công việc, thiết lập hạn hoàn thành, gắn danh mục Nghị định 335 và theo dõi kết quả thực hiện.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-sm font-bold transition shadow-md shadow-[#27A4F2]/25 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Giao Nhiệm Vụ Mới</span>
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

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveStatusTab('ALL')}
          className={`p-4 rounded-xl border text-left transition ${
            activeStatusTab === 'ALL'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-slate-500 uppercase">Tổng nhiệm vụ</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('PENDING')}
          className={`p-4 rounded-xl border text-left transition ${
            activeStatusTab === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-amber-700 uppercase">Chờ tiếp nhận</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.pending}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('IN_PROGRESS')}
          className={`p-4 rounded-xl border text-left transition ${
            activeStatusTab === 'IN_PROGRESS'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-sky-700 uppercase">Đang thực hiện</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{stats.in_progress}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('COMPLETED')}
          className={`p-4 rounded-xl border text-left transition ${
            activeStatusTab === 'COMPLETED'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-700 uppercase">Đã hoàn thành</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.completed}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('OVERDUE')}
          className={`p-4 rounded-xl border text-left transition ${
            activeStatusTab === 'OVERDUE'
              ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-red-700 uppercase">Quá hạn xử lý</div>
          <div className="text-2xl font-black text-red-700 mt-1">{stats.overdue}</div>
        </button>
      </div>

      {/* Main Task List Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhiệm vụ, người thực hiện..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Tất cả phòng ban --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Tất cả cán bộ --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullname} ({u.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Nhiệm vụ / Nội dung</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Sản phẩm NĐ 335</th>
                <th className="py-3 px-4">Hạn hoàn thành</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Đang tải danh sách nhiệm vụ...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Không tìm thấy nhiệm vụ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const canEdit =
                    user?.id === t.assigned_by ||
                    user?.role === 'ADMIN' ||
                    user?.role === 'LEADERSHIP' ||
                    (user?.role === 'DEPARTMENT_HEAD' && user.id === t.assigned_to);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedDetailTask(t);
                            setDetailModalOpen(true);
                          }}
                          className="font-bold text-slate-900 hover:text-sky-700 text-left transition"
                        >
                          {t.title}
                        </button>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <span>Giao bởi: <strong>{t.creator_name || 'Lãnh đạo'}</strong></span>
                          <span>•</span>
                          <span>Trọng số: {t.weight}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{t.assignee_name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>{t.assignee_department_name || t.assignee_position}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {t.catalog_name ? (
                          <div className="text-xs">
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              {t.catalog_code}
                            </span>
                            <span className="text-slate-500 ml-1">(x{t.catalog_coefficient})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Không gắn</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div
                          className={`text-xs font-semibold ${
                            t.is_overdue ? 'text-red-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {formatDeadline(t.deadline)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">{getStatusBadge(t)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedDetailTask(t);
                              setDetailModalOpen(true);
                            }}
                            title="Xem chi tiết & Nộp kết quả"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingTask(t);
                                setTaskModalOpen(true);
                              }}
                              title="Sửa nhiệm vụ"
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleDeleteTask(t)}
                              title="Xóa nhiệm vụ"
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

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        task={editingTask}
        users={users}
        catalog={catalog}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          fetchTasks();
          fetchStats();
          setActionMessage({
            type: 'success',
            text: editingTask ? 'Cập nhật nhiệm vụ thành công!' : 'Giao nhiệm vụ mới thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <TaskDetailModal
        isOpen={detailModalOpen}
        task={selectedDetailTask}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailTask(null);
        }}
        onSuccess={() => {
          fetchTasks();
          fetchStats();
        }}
      />
    </div>
  );
};
