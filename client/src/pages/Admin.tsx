import React, { useState, useEffect } from 'react';
import { usersApi, departmentsApi, catalogApi, jobPositionsApi } from '../services/api';
import { User, Department, ProductCatalog, JobPosition } from '../types';
import { UserModal } from '../components/UserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { DepartmentModal } from '../components/DepartmentModal';
import { CatalogModal } from '../components/CatalogModal';
import { ApproveMemberModal } from '../components/ApproveMemberModal';
import { ImportPersonnelModal } from '../components/ImportPersonnelModal';
import { ImportCatalogModal } from '../components/ImportCatalogModal';
import {
  Users,
  Building2,
  Layers,
  UserPlus,
  Plus,
  Search,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  Briefcase,
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'catalog' | 'pending' | 'positions'>('users');

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalog[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<ProductCatalog | null>(null);

  // Upgrade Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [candidateToApprove, setCandidateToApprove] = useState<User | null>(null);
  const [importPersonnelModalOpen, setImportPersonnelModalOpen] = useState(false);
  const [importCatalogModalOpen, setImportCatalogModalOpen] = useState(false);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await usersApi.getUsers({
        department_id: selectedDept ? Number(selectedDept) : undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        search: search || undefined,
      });
      setUsers(data.users);
    } catch (err: any) {
      console.error('Lỗi tải người dùng:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const data = await usersApi.getPendingApprovals();
      setPendingUsers(data.pending_users);
    } catch (err: any) {
      console.error('Lỗi tải danh sách chờ duyệt:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const data = await departmentsApi.getDepartments();
      setDepartments(data.departments);
    } catch (err: any) {
      console.error('Lỗi tải phòng ban:', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const data = await catalogApi.getCatalog();
      setCatalog(data.catalog);
    } catch (err: any) {
      console.error('Lỗi tải danh mục NĐ 335:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchJobPositions = async () => {
    setLoadingPositions(true);
    try {
      const data = await jobPositionsApi.getJobPositions();
      setJobPositions(data.job_positions);
    } catch (err: any) {
      console.error('Lỗi tải danh mục vị trí việc làm:', err);
    } finally {
      setLoadingPositions(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCatalog();
    fetchPendingUsers();
    fetchJobPositions();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedDept, selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmText =
      newStatus === 'INACTIVE'
        ? `Bạn có chắc chắn muốn khóa tài khoản "${user.fullname}"?`
        : `Bạn có chắc chắn muốn kích hoạt lại tài khoản "${user.fullname}"?`;

    if (!window.confirm(confirmText)) return;

    try {
      await usersApi.updateUser(user.id, { status: newStatus });
      setActionMessage({
        type: 'success',
        text: `Đã ${newStatus === 'INACTIVE' ? 'khóa' : 'kích hoạt'} tài khoản ${user.fullname} thành công.`,
      });
      fetchUsers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái tài khoản.',
      });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.')) return;

    try {
      await departmentsApi.deleteDepartment(dept.id);
      setActionMessage({ type: 'success', text: `Đã xóa phòng ban ${dept.name} thành công.` });
      fetchDepartments();
      fetchUsers();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa phòng ban.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDeleteCatalog = async (item: ProductCatalog) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.')) return;

    try {
      await catalogApi.deleteCatalogItem(item.id);
      setActionMessage({ type: 'success', text: `Đã khóa sản phẩm ${item.name} thành công.` });
      fetchCatalog();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi khóa sản phẩm danh mục.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-[#91A8ED]/25 text-[#0C3260] border border-[#91A8ED] px-2.5 py-1 rounded-md text-xs font-bold">
            Quản trị
          </span>
        );
      case 'LEADERSHIP':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md text-xs font-bold">
            Lãnh đạo
          </span>
        );
      case 'DEPARTMENT_HEAD':
        return (
          <span className="bg-[#CFEBFC] text-[#1864AB] border border-[#9FD7F9] px-2.5 py-1 rounded-md text-xs font-bold">
            Trưởng BP
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium">
            Công chức
          </span>
        );
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'PART_A':
        return <span className="text-purple-700 font-medium">Phần A (Hành chính)</span>;
      case 'PART_B_GROUP_I':
        return <span className="text-blue-700 font-medium">Phần B.I (TTPVHCC)</span>;
      default:
        return <span className="text-emerald-700 font-medium">Phần B.II (Tiếp dân / Đột xuất)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#CFEBFC] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#27A4F2]" />
            <h1 className="text-xl font-black text-[#0C3260]">Quản Trị Hệ Thống UBND Xã Nghĩa Lâm</h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Quản lý hồ sơ cán bộ, kiểm duyệt đăng ký thành viên, cơ cấu phòng ban và danh mục tiêu chí đánh giá theo NĐ 335.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-[#F0F7FD] p-1.5 rounded-xl border border-[#CFEBFC] self-start md:self-auto gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
              activeTab === 'users' ? 'bg-[#27A4F2] text-white shadow-sm' : 'text-[#1864AB] hover:bg-[#CFEBFC]/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cán bộ ({users.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pending');
              fetchPendingUsers();
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition relative ${
              activeTab === 'pending' ? 'bg-[#27A4F2] text-white shadow-sm' : 'text-[#1864AB] hover:bg-[#CFEBFC]/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kiểm duyệt</span>
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
              activeTab === 'departments' ? 'bg-[#27A4F2] text-white shadow-sm' : 'text-[#1864AB] hover:bg-[#CFEBFC]/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Phòng ban ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
              activeTab === 'catalog' ? 'bg-[#27A4F2] text-white shadow-sm' : 'text-[#1864AB] hover:bg-[#CFEBFC]/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh mục NĐ 335 ({catalog.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('positions');
              fetchJobPositions();
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
              activeTab === 'positions' ? 'bg-[#27A4F2] text-white shadow-sm' : 'text-[#1864AB] hover:bg-[#CFEBFC]/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Vị trí việc làm ({jobPositions.length})</span>
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

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#CFEBFC] shadow-sm overflow-hidden space-y-4 p-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#6EC2F7] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo họ tên, tài khoản, chức vụ, email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm bg-[#F0F7FD]/40 text-[#0C3260]"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#CFEBFC] hover:bg-[#9FD7F9] text-[#0C3260] rounded-xl text-sm font-bold transition"
              >
                Tìm
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 border border-[#CFEBFC] rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#27A4F2]"
              >
                <option value="">-- Tất cả phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-[#CFEBFC] rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#27A4F2]"
              >
                <option value="">-- Tất cả vai trò --</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                <option value="LEADERSHIP">Lãnh đạo (LEADERSHIP)</option>
                <option value="DEPARTMENT_HEAD">Trưởng phòng (DEPARTMENT_HEAD)</option>
                <option value="EMPLOYEE">Công chức (EMPLOYEE)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-[#CFEBFC] rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-[#27A4F2]"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Đã khóa</option>
              </select>

              <button
                onClick={() => setImportPersonnelModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#CFEBFC] hover:bg-[#9FD7F9] text-[#0C3260] border border-[#9FD7F9] rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#27A4F2]" />
                <span>📥 Nhập Excel Cán Bộ</span>
              </button>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Cán Bộ</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-[#CFEBFC]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#CFEBFC]/50 border-b border-[#CFEBFC] text-xs font-bold text-[#0C3260] uppercase tracking-wider">
                  <th className="py-3 px-4">Cán bộ / Tài khoản</th>
                  <th className="py-3 px-4">Chức vụ</th>
                  <th className="py-3 px-4">Phòng ban / Bộ phận</th>
                  <th className="py-3 px-4 text-center">Vai trò</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFEBFC]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Đang tải danh sách cán bộ...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy cán bộ nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0C3260]">{u.fullname}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                          <span>@{u.username}</span>
                          {u.email && <span>• {u.email}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{u.position}</td>
                      <td className="py-3.5 px-4 text-slate-600">{u.department_name || '-'}</td>
                      <td className="py-3.5 px-4 text-center">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status === 'ACTIVE'
                            ? 'Đang hoạt động'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'Chờ duyệt'
                            : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`p-1.5 rounded-lg transition ${
                            u.status === 'ACTIVE'
                              ? 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-[#CFEBFC] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#CFEBFC]">
            <div>
              <h3 className="text-base font-black text-[#0C3260] flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#27A4F2]" />
                <span>Danh Sách Đăng Ký Thành Viên Chờ Kiểm Duyệt ({pendingUsers.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem xét hồ sơ, phê duyệt và gán chính thức phòng ban, vị trí việc làm theo Nghị định 335
              </p>
            </div>
            <button
              onClick={fetchPendingUsers}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#CFEBFC]/50 hover:bg-[#CFEBFC] text-[#0C3260] rounded-xl text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#CFEBFC]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#CFEBFC]/50 border-b border-[#CFEBFC] text-xs font-bold text-[#0C3260] uppercase tracking-wider">
                  <th className="py-3 px-4">Họ và tên cán bộ</th>
                  <th className="py-3 px-4">Hình thức đăng ký</th>
                  <th className="py-3 px-4">Đơn vị & Vị trí đề xuất</th>
                  <th className="py-3 px-4">Thời gian đăng ký</th>
                  <th className="py-3 px-4 text-right">Kiểm duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFEBFC]">
                {loadingPending ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Đang tải danh sách chờ duyệt...
                    </td>
                  </tr>
                ) : pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                      <span>Hiện không có hồ sơ nào đang chờ kiểm duyệt.</span>
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0C3260]">{u.fullname}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                          {u.email && <span>{u.email}</span>}
                          {u.phone && <span>• SĐT: {u.phone}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.auth_provider === 'GOOGLE'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {u.auth_provider === 'GOOGLE' ? 'Tài khoản Gmail' : 'Đăng ký Biểu mẫu'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{u.requested_department || 'Chưa chọn'}</div>
                        <div className="text-xs text-slate-500">{u.requested_position || 'Chưa ghi rõ'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setCandidateToApprove(u);
                            setApproveModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Phê Duyệt & Gán Vị Trí
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl border border-[#CFEBFC] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0C3260]">Danh Sách Phòng Ban / Bộ Phận</h3>
            <button
              onClick={() => {
                setEditingDept(null);
                setDeptModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-sm font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Phòng Ban</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#CFEBFC]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#CFEBFC]/50 border-b border-[#CFEBFC] text-xs font-bold text-[#0C3260] uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tên phòng ban / Bộ phận</th>
                  <th className="py-3 px-4">Thuộc đơn vị cấp trên</th>
                  <th className="py-3 px-4 text-center">Số lượng nhân sự</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFEBFC]">
                {loadingDepts ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Đang tải danh sách phòng ban...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có phòng ban nào.
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">#{d.id}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0C3260]">{d.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{d.parent_name || 'Ủy ban nhân dân xã'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#27A4F2]">
                        {d.user_count || 0} cán bộ
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingDept(d);
                            setDeptModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#27A4F2] hover:bg-[#CFEBFC]/50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(d)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT CATALOG (NĐ 335) */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-[#CFEBFC] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[#0C3260]">
                Danh Mục Tiêu Chí & Sản Phẩm Chuẩn (Nghị định 335/2025/NĐ-CP)
              </h3>
              <p className="text-xs text-slate-500">
                Quy định hệ số quy đổi (K) cho từng vị trí việc làm và nhóm công việc
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setImportCatalogModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#CFEBFC] hover:bg-[#9FD7F9] text-[#0C3260] border border-[#9FD7F9] rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#27A4F2]" />
                <span>📥 Nạp Excel Danh Mục NĐ 335</span>
              </button>

              <button
                onClick={() => {
                  setEditingCatalog(null);
                  setCatalogModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Tiêu Chí</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#CFEBFC]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#CFEBFC]/50 border-b border-[#CFEBFC] text-xs font-bold text-[#0C3260] uppercase tracking-wider">
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Tên sản phẩm / Tiêu chí</th>
                  <th className="py-3 px-4">Phân nhóm</th>
                  <th className="py-3 px-4 text-center">Điểm chuẩn</th>
                  <th className="py-3 px-4 text-center">Hệ số quy đổi (K)</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFEBFC]">
                {loadingCatalog ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Đang tải danh mục tiêu chí NĐ 335...
                    </td>
                  </tr>
                ) : catalog.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Chưa có tiêu chí nào được cấu hình.
                    </td>
                  </tr>
                ) : (
                  catalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1864AB]">{item.code}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0C3260] max-w-xs">{item.name}</td>
                      <td className="py-3.5 px-4">{getCategoryName(item.category)}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{item.baseline_score.toFixed(1)}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-[#27A4F2]">
                        {item.coefficient.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingCatalog(item);
                            setCatalogModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#27A4F2] hover:bg-[#CFEBFC]/50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCatalog(item)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Khóa tiêu chí"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: 33 JOB POSITIONS & QUOTA MONITORING */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#CFEBFC] shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Tổng số vị trí chuẩn</div>
              <div className="text-2xl font-black text-[#0C3260] mt-1">{jobPositions.length}</div>
              <div className="text-[11px] text-[#27A4F2] mt-0.5 font-bold">Theo Quyết định UBND xã</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#CFEBFC] shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Tổng biên chế giao</div>
              <div className="text-2xl font-black text-[#1864AB] mt-1">
                {jobPositions.reduce((s, p) => s + p.allocated_quota, 0)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Nhóm I (12) + Nhóm II (21)</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
              <div className="text-xs font-bold text-emerald-800 uppercase">Đã bố trí cán bộ</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {jobPositions.reduce((s, p) => s + p.current_assigned, 0)}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                Đạt {jobPositions.reduce((s, p) => s + p.allocated_quota, 0) > 0 ? Math.round((jobPositions.reduce((s, p) => s + p.current_assigned, 0) / jobPositions.reduce((s, p) => s + p.allocated_quota, 0)) * 100) : 0}% tổng biên chế
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
              <div className="text-xs font-bold text-amber-800 uppercase">Vị trí còn khuyết</div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {jobPositions.filter((p) => p.allocated_quota > 0 && p.current_assigned === 0).length}
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">Cần tuyển dụng / kiện toàn</div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-white rounded-2xl border border-[#CFEBFC] shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm md:text-base text-[#0C3260] uppercase tracking-wide flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-[#27A4F2]" />
                  <span>Danh Mục 33 Vị Trí Việc Làm & Cơ Cấu Biên Chế Xã Nghĩa Lâm</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Căn cứ Nghị định số 335/2025/NĐ-CP và Quyết định phê duyệt tỷ lệ bố trí công chức của UBND xã Nghĩa Lâm
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">
                    <th className="py-3 px-4">Mã vị trí</th>
                    <th className="py-3 px-4">Tên vị trí việc làm</th>
                    <th className="py-3 px-4">Nhóm vị trí</th>
                    <th className="py-3 px-4">Ngạch công chức</th>
                    <th className="py-3 px-4 text-center">Biên chế</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ %</th>
                    <th className="py-3 px-4 text-center">Hiện có</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPositions ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#27A4F2]" />
                        Đang tải danh mục vị trí việc làm...
                      </td>
                    </tr>
                  ) : (
                    jobPositions.map((pos) => {
                      const isVacant = pos.allocated_quota > 0 && pos.current_assigned === 0;
                      const isOver = pos.allocated_quota > 0 && pos.current_assigned > pos.allocated_quota;

                      return (
                        <tr key={pos.code} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-[#1864AB]">{pos.code}</td>
                          <td className="py-3 px-4 font-bold text-[#0C3260]">{pos.name}</td>
                          <td className="py-3 px-4">
                            {pos.group_type === 'NHOM_I_LANH_DAO' && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-md text-[10px]">
                                Nhóm I: Lãnh đạo
                              </span>
                            )}
                            {pos.group_type === 'NHOM_II_CHUYEN_MON' && (
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-md text-[10px]">
                                Nhóm II: Chuyên môn
                              </span>
                            )}
                            {pos.group_type === 'NHOM_III_PHUC_VU' && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-md text-[10px]">
                                Nhóm III: Phục vụ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{pos.civil_service_rank || 'Công chức'}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">
                            {pos.allocated_quota > 0 ? pos.allocated_quota : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {pos.allocated_ratio_percent > 0 ? `${pos.allocated_ratio_percent}%` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-[#27A4F2]">
                            {pos.current_assigned}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isVacant ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-md text-[10px]">
                                Khuyết vị trí (0%)
                              </span>
                            ) : isOver ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 font-bold rounded-md text-[10px]">
                                Vượt biên chế
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-md text-[10px]">
                                Đã bố trí ({pos.current_assigned}/{pos.allocated_quota})
                              </span>
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
        </div>
      )}

      {/* Modals */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        user={editingUser}
        departments={departments}
        onSuccess={() => {
          fetchUsers();
          setActionMessage({
            type: 'success',
            text: editingUser ? 'Cập nhật cán bộ thành công!' : 'Tạo mới cán bộ thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        user={resettingUser}
        onSuccess={() => {
          setActionMessage({ type: 'success', text: 'Cấp lại mật khẩu thành công!' });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <DepartmentModal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        department={editingDept}
        allDepartments={departments}
        onSuccess={() => {
          fetchDepartments();
          setActionMessage({
            type: 'success',
            text: editingDept ? 'Cập nhật phòng ban thành công!' : 'Thêm phòng ban thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <CatalogModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        item={editingCatalog}
        onSuccess={() => {
          fetchCatalog();
          setActionMessage({
            type: 'success',
            text: editingCatalog ? 'Cập nhật sản phẩm NĐ 335 thành công!' : 'Thêm sản phẩm NĐ 335 thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      {/* Upgrade Modals */}
      <ApproveMemberModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        candidate={candidateToApprove}
        onSuccess={() => {
          fetchPendingUsers();
          fetchUsers();
          setActionMessage({
            type: 'success',
            text: 'Đã hoàn tất kiểm duyệt và kích hoạt thành viên thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <ImportPersonnelModal
        isOpen={importPersonnelModalOpen}
        onClose={() => setImportPersonnelModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchDepartments();
          setActionMessage({
            type: 'success',
            text: 'Đã nhập danh sách cán bộ từ Excel thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <ImportCatalogModal
        isOpen={importCatalogModalOpen}
        onClose={() => setImportCatalogModalOpen(false)}
        onSuccess={() => {
          fetchCatalog();
          setActionMessage({
            type: 'success',
            text: 'Đã nạp danh mục tiêu chí NĐ 335 thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />
    </div>
  );
};
