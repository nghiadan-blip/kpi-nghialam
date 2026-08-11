import React, { useState, useEffect } from 'react';
import { departmentsApi } from '../services/api';
import { Department } from '../types';
import { X, Building2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  department: Department | null;
  allDepartments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DepartmentModal: React.FC<Props> = ({
  isOpen,
  department,
  allDepartments,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!department;
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | number>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setParentId(department.parent_id || '');
    } else {
      setName('');
      setParentId('');
    }
    setError(null);
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập tên phòng ban, bộ phận.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && department) {
        await departmentsApi.updateDepartment(department.id, {
          name: name.trim(),
          parent_id: parentId ? Number(parentId) : null,
        });
      } else {
        await departmentsApi.createDepartment({
          name: name.trim(),
          parent_id: parentId ? Number(parentId) : null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  const availableParents = allDepartments.filter((d) => !department || d.id !== department.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800">
              {isEditing ? 'Sửa Thông Tin Phòng Ban' : 'Thêm Phòng Ban, Bộ Phận Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Tên phòng ban / Bộ phận chuyên môn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              placeholder="VD: Bộ phận Tư pháp - Hộ tịch"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Đơn vị quản lý cấp trên (Tùy chọn)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">-- Không trực thuộc cấp trên --</option>
              {availableParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Thêm phòng ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
