import React, { useState, useEffect } from 'react';
import { usersApi, departmentsApi, catalogApi } from '../services/api';
import { User, Department, ProductCatalog } from '../types';
import { UserModal } from '../components/UserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { DepartmentModal } from '../components/DepartmentModal';
import { CatalogModal } from '../components/CatalogModal';
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
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'catalog'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<ProductCatalog[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

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

  useEffect(() => {
    fetchDepartments();
    fetchCatalog();
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
    if (!window.confirm(`Bạn có chắc muốn xóa phòng ban "${dept.name}"?`)) return;

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
    if (!window.confirm(`Bạn có chắc muốn khóa sản phẩm danh mục "${item.name}"?`)) return;

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
        return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold">Quản trị</span>;
      case 'LEADERSHIP':
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">Lãnh đạo</span>;
      case 'DEPARTMENT_HEAD':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold">Trưởng BP</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-medium">Chuyên viên</span>;
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Quản Trị Hệ Thống UBND Xã Nghĩa Lâm</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý hồ sơ cán bộ công chức, cơ cấu phòng ban và cấu hình danh mục tiêu chí đánh giá theo NĐ 335/2025/NĐ-CP.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs md:text-sm font-semibold transition ${
              activeTab === 'users' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cán bộ ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs md:text-sm font-semibold transition ${
              activeTab === 'departments' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Phòng ban ({departments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs md:text-sm font-semibold transition ${
              activeTab === 'catalog' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh mục NĐ 335 ({catalog.length})</span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo họ tên, tài khoản, chức vụ..."
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

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
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
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Đã khóa</option>
              </select>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Cán Bộ</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Cán bộ / Tài khoản</th>
                  <th className="py-3 px-4">Chức vụ</th>
                  <th className="py-3 px-4">Phòng ban / Bộ phận</th>
                  <th className="py-3 px-4 text-center">Vai trò</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                      Đang tải danh sách cán bộ...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Không tìm thấy cán bộ công chức nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.fullname}</div>
                        <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{u.position}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.department_name ? (
                          <span className="inline-flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.department_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa xếp phòng</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4 text-center">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setUserModalOpen(true);
                            }}
                            title="Sửa hồ sơ"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-md transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setResetModalOpen(true);
                            }}
                            title="Cấp lại mật khẩu"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                            className={`p-1.5 rounded-md transition ${
                              u.status === 'ACTIVE'
                                ? 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cơ cấu Phòng ban / Bộ phận chuyên môn</h2>
              <p className="text-xs text-slate-500">Cơ cấu tổ chức bộ máy trực thuộc UBND xã Nghĩa Lâm.</p>
            </div>
            <button
              onClick={() => {
                setEditingDept(null);
                setDeptModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Phòng Ban</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tên Phòng Ban / Bộ Phận</th>
                  <th className="py-3 px-4">Đơn vị quản lý cấp trên</th>
                  <th className="py-3 px-4 text-center">Số lượng nhân sự</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDepts ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                      Đang tải danh sách phòng ban...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      Chưa có phòng ban nào.
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{d.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>{d.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.parent_name ? (
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                            {d.parent_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Cấp cao nhất</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700">
                          {d.user_count || 0} cán bộ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingDept(d);
                              setDeptModalOpen(true);
                            }}
                            title="Sửa phòng ban"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-md transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(d)}
                            title="Xóa phòng ban"
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATALOG (NĐ 335) */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Danh mục Sản phẩm, Tiêu chí & Hệ số theo NĐ 335/2025/NĐ-CP
              </h2>
              <p className="text-xs text-slate-500">
                Khung danh mục tính điểm sản phẩm: Điểm chuẩn = 5.0 × Hệ số quy đổi (K).
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCatalog(null);
                setCatalogModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm NĐ 335</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã / Tên Sản Phẩm</th>
                  <th className="py-3 px-4">Nhóm danh mục</th>
                  <th className="py-3 px-4 text-center">Hệ số quy đổi (K)</th>
                  <th className="py-3 px-4 text-center">Điểm chuẩn (5 × K)</th>
                  <th className="py-3 px-4">Mô tả quy cách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCatalog ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                      Đang tải danh mục sản phẩm...
                    </td>
                  </tr>
                ) : catalog.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Chưa có sản phẩm nào trong danh mục.
                    </td>
                  </tr>
                ) : (
                  catalog.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded inline-block mt-0.5">
                          {c.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getCategoryName(c.category)}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        <span className="bg-slate-100 px-2.5 py-1 rounded text-xs">x{c.coefficient}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-purple-700">
                        {(c.coefficient * (c.baseline_score || 5.0)).toFixed(1)} đ
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {c.description || <span className="italic text-slate-400">Không có mô tả</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingCatalog(c);
                              setCatalogModalOpen(true);
                            }}
                            title="Sửa sản phẩm"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalog(c)}
                            title="Khóa sản phẩm"
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserModal
        isOpen={userModalOpen}
        user={editingUser}
        departments={departments}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          fetchDepartments();
          setActionMessage({
            type: 'success',
            text: editingUser ? 'Cập nhật cán bộ thành công!' : 'Tạo mới cán bộ thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <ResetPasswordModal
        isOpen={resetModalOpen}
        user={resettingUser}
        onClose={() => {
          setResetModalOpen(false);
          setResettingUser(null);
        }}
        onSuccess={() => {
          setActionMessage({ type: 'success', text: 'Cấp lại mật khẩu thành công!' });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <DepartmentModal
        isOpen={deptModalOpen}
        department={editingDept}
        allDepartments={departments}
        onClose={() => {
          setDeptModalOpen(false);
          setEditingDept(null);
        }}
        onSuccess={() => {
          fetchDepartments();
          setActionMessage({
            type: 'success',
            text: editingDept ? 'Cập nhật phòng ban thành công!' : 'Thêm mới phòng ban thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

      <CatalogModal
        isOpen={catalogModalOpen}
        item={editingCatalog}
        onClose={() => {
          setCatalogModalOpen(false);
          setEditingCatalog(null);
        }}
        onSuccess={() => {
          fetchCatalog();
          setActionMessage({
            type: 'success',
            text: editingCatalog ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm danh mục thành công!',
          });
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />
    </div>
  );
};
