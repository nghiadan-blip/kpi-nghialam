import React, { useState, useEffect } from 'react';
import { usersApi, jobPositionsApi } from '../services/api';
import { User, Department, UserRole, JobPosition } from '../types';
import { X, UserPlus, UserCheck, AlertCircle, Briefcase, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  user: User | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export const UserModal: React.FC<Props> = ({ isOpen, user, departments, onClose, onSuccess }) => {
  const isEditing = !!user;

  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE' as UserRole,
    position: '',
    position_code: '',
    department_id: '' as string | number,
    status: 'ACTIVE',
    is_disciplined: false,
    discipline_details: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobPositionsApi
      .getJobPositions()
      .then((res) => setJobPositions(res.job_positions))
      .catch(() => {});
  }, []);

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
        position_code: user.position_code || '',
        department_id: user.department_id || '',
        status: user.status,
        is_disciplined: Boolean(user.is_disciplined),
        discipline_details: user.discipline_details || '',
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
        position_code: '',
        department_id: departments[0]?.id || '',
        status: 'ACTIVE',
        is_disciplined: false,
        discipline_details: '',
      });
    }
    setError(null);
  }, [user, isOpen, departments]);

  if (!isOpen) return null;

  const handlePositionCodeChange = (code: string) => {
    const pos = jobPositions.find((p) => p.code === code);
    setFormData({
      ...formData,
      position_code: code,
      position: pos ? pos.name : formData.position,
    });
  };

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
          position_code: formData.position_code || null,
          department_id: formData.department_id ? Number(formData.department_id) : null,
          status: formData.status,
          is_disciplined: formData.is_disciplined,
          discipline_details: formData.discipline_details || null,
        } as any);
      } else {
        await usersApi.createUser({
          username: formData.username,
          password: formData.password,
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          position: formData.position,
          position_code: formData.position_code || null,
          department_id: formData.department_id ? Number(formData.department_id) : null,
          status: formData.status,
        } as any);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#CFEBFC] max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFEBFC] bg-gradient-to-r from-[#0C3260] to-[#1864AB] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base">
                {isEditing ? 'Cập Nhật Hồ Sơ Cán Bộ & Vị Trí Việc Làm' : 'Thêm Mới Cán Bộ Công Chức'}
              </h3>
              <p className="text-xs text-[#CFEBFC]">
                Chuẩn hóa chức danh 33 vị trí việc làm xã Nghĩa Lâm & phân quyền hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Tên đăng nhập (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                placeholder="VD: vu.minh.tuan"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block font-bold uppercase text-[#0C3260] mb-1">
                  Mật khẩu ban đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2]"
                  placeholder="••••••••"
                />
              </div>
            )}

            <div className={isEditing ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Họ và tên cán bộ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] font-medium"
                placeholder="VD: Nguyễn Văn An"
              />
            </div>
          </div>

          {/* 33 Position Dropdown */}
          <div className="bg-[#F0F7FD] p-3.5 rounded-2xl border border-[#CFEBFC] space-y-3">
            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Vị trí việc làm chuẩn (33 Vị trí NĐ 335)</span>
              </label>
              <select
                value={formData.position_code}
                onChange={(e) => handlePositionCodeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-xs font-semibold bg-white focus:ring-2 focus:ring-[#27A4F2]"
              >
                <option value="">-- Chưa gán mã vị trí chuẩn --</option>
                <optgroup label="Nhóm I: Lãnh đạo, quản lý (12 biên chế)">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_I_LANH_DAO')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name} ({p.current_assigned}/{p.allocated_quota} biên chế)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Nhóm II: Chuyên môn, nghiệp vụ (21 biên chế)">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_II_CHUYEN_MON')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name} ({p.current_assigned}/{p.allocated_quota} biên chế)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Nhóm III: Hỗ trợ, phục vụ">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_III_PHUC_VU')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Tên chức vụ hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] bg-white font-medium"
                placeholder="VD: Công chức Địa chính - Xây dựng"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Phòng ban trực thuộc
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] bg-white"
              >
                <option value="">-- Không trực thuộc --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Vai trò hệ thống <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] bg-white font-medium"
              >
                <option value="EMPLOYEE">Công chức (Tự chấm điểm)</option>
                <option value="DEPARTMENT_HEAD">Trưởng bộ phận (Thẩm định)</option>
                <option value="LEADERSHIP">Lãnh đạo UBND xã (Phê duyệt)</option>
                <option value="ADMIN">Quản trị viên (Toàn quyền)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] bg-white"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng / Đã khóa</option>
              </select>
            </div>
          </div>

          {/* Discipline status toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_disciplined}
                onChange={(e) => setFormData({ ...formData, is_disciplined: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="font-bold text-red-900 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Cán bộ đang trong thời gian thi hành kỷ luật (Điều 20 NĐ 335)</span>
              </span>
            </label>
            {formData.is_disciplined && (
              <input
                type="text"
                value={formData.discipline_details}
                onChange={(e) => setFormData({ ...formData, discipline_details: e.target.value })}
                placeholder="Hình thức kỷ luật (Khiển trách, Cảnh cáo...), Số hiệu Quyết định..."
                className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs bg-white text-red-900 placeholder:text-red-300"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">Email liên hệ</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC]"
                placeholder="canbo@nghialam.gov.vn"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-[#0C3260] mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC]"
                placeholder="0987654321"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#CFEBFC] flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white font-bold rounded-xl shadow-md transition"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu Thay Đổi' : 'Thêm Cán Bộ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
