import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { User, Department, UserRole } from '../types';
import { X, UserPlus, UserCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  user: User | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export const UserModal: React.FC<Props> = ({ isOpen, user, departments, onClose, onSuccess }) => {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE' as UserRole,
    position: '',
    department_id: '' as string | number,
    status: 'ACTIVE',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        fullname: user.fullname,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role as UserRole,
        position: user.position,
        department_id: user.department_id || '',
        status: user.status,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        fullname: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        position: '',
        department_id: departments[0]?.id || '',
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [user, isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullname.trim() || !formData.position.trim()) {
      setError('Vui lòng nhập họ tên và chức vụ.');
      return;
    }

    if (!isEditing && (!formData.username.trim() || !formData.password.trim())) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu khởi tạo.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && user) {
        await usersApi.updateUser(user.id, {
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          position: formData.position,
          department_id: formData.department_id ? Number(formData.department_id) : null,
          status: formData.status,
        });
      } else {
        await usersApi.createUser({
          username: formData.username,
          password: formData.password,
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          position: formData.position,
          department_id: formData.department_id ? Number(formData.department_id) : null,
          status: formData.status,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin cán bộ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            {isEditing ? <UserCheck className="w-5 h-5 text-sky-600" /> : <UserPlus className="w-5 h-5 text-emerald-600" />}
            <h3 className="font-bold text-slate-800">
              {isEditing ? 'Cập Nhật Hồ Sơ Cán Bộ' : 'Thêm Cán Bộ, Công Chức Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm disabled:bg-slate-100"
                placeholder="VD: nguyen_van_a"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Mật khẩu ban đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            )}

            <div className={isEditing ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                placeholder="VD: Nguyễn Văn An"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Chức vụ / Vị trí việc làm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                placeholder="VD: Công chức Địa chính"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Phòng ban / Bộ phận trực thuộc
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">-- Không trực thuộc phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Vai trò hệ thống <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white font-medium"
              >
                <option value="EMPLOYEE">EMPLOYEE (Công chức / Chuyên viên)</option>
                <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD (Trưởng phòng / Trưởng bộ phận)</option>
                <option value="LEADERSHIP">LEADERSHIP (Lãnh đạo UBND xã)</option>
                <option value="ADMIN">ADMIN (Quản trị hệ thống)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Trạng thái hoạt động <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                <option value="INACTIVE">INACTIVE (Đã khóa / Tạm dừng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email liên hệ</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                placeholder="nghialam@nghean.gov.vn"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                placeholder="0912..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Tạo mới cán bộ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
