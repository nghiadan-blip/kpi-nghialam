import React, { useState, useEffect } from 'react';
import { tasksApi } from '../services/api';
import { Task, User, ProductCatalog } from '../types';
import { X, CheckSquare, AlertCircle, Scale, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  task: Task | null;
  users: User[];
  catalog: ProductCatalog[];
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  task,
  users,
  catalog,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '' as string | number,
    product_catalog_id: '' as string | number,
    deadline: '',
    weight: 1.0,
    status: 'PENDING',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      // Format deadline to YYYY-MM-DDTHH:mm for datetime-local input
      let deadlineFormatted = '';
      if (task.deadline) {
        const d = new Date(task.deadline);
        deadlineFormatted = d.toISOString().slice(0, 16);
      }

      setFormData({
        title: task.title,
        description: task.description || '',
        assigned_to: task.assigned_to,
        product_catalog_id: task.product_catalog_id || '',
        deadline: deadlineFormatted,
        weight: task.weight,
        status: task.status,
      });
    } else {
      // Default deadline: 3 days from now at 17:00
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      defaultDate.setHours(17, 0, 0, 0);

      setFormData({
        title: '',
        description: '',
        assigned_to: users[0]?.id || '',
        product_catalog_id: '',
        deadline: defaultDate.toISOString().slice(0, 16),
        weight: 1.0,
        status: 'PENDING',
      });
    }
    setError(null);
  }, [task, isOpen, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề nhiệm vụ.');
      return;
    }

    if (!formData.assigned_to) {
      setError('Vui lòng chọn cán bộ thực hiện nhiệm vụ.');
      return;
    }

    if (!formData.deadline) {
      setError('Vui lòng chọn hạn hoàn thành (deadline).');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && task) {
        await tasksApi.updateTask(task.id, {
          title: formData.title.trim(),
          description: formData.description ? formData.description.trim() : null,
          assigned_to: Number(formData.assigned_to),
          product_catalog_id: formData.product_catalog_id ? Number(formData.product_catalog_id) : null,
          deadline: new Date(formData.deadline).toISOString(),
          weight: Number(formData.weight),
          status: formData.status,
        });
      } else {
        await tasksApi.createTask({
          title: formData.title.trim(),
          description: formData.description ? formData.description.trim() : undefined,
          assigned_to: Number(formData.assigned_to),
          product_catalog_id: formData.product_catalog_id ? Number(formData.product_catalog_id) : null,
          deadline: new Date(formData.deadline).toISOString(),
          weight: Number(formData.weight),
          status: formData.status,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800">
              {isEditing ? 'Chỉnh Sửa Nhiệm Vụ' : 'Giao Nhiệm Vụ Mới'}
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

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              placeholder="VD: Soạn thảo báo cáo tình hình kinh tế - xã hội Quý 3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Người thực hiện (Cán bộ) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">-- Chọn cán bộ --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullname} ({u.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Hạn hoàn thành (Deadline) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Gắn danh mục sản phẩm (Theo NĐ 335/2025/NĐ-CP)</span>
            </label>
            <select
              value={formData.product_catalog_id}
              onChange={(e) => setFormData({ ...formData, product_catalog_id: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">-- Không gắn danh mục --</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} (Hệ số: {c.coefficient})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Sản phẩm gắn với nhiệm vụ sẽ tự động được đưa vào biểu chấm điểm tháng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1 flex items-center space-x-1">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>Trọng số nhiệm vụ</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Trạng thái nhiệm vụ
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-white"
              >
                <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
                <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Mô tả chi tiết nội dung & yêu cầu
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              placeholder="Yêu cầu cụ thể về nội dung, quy cách trình bày, thời gian nghiệm thu..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
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
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Giao việc ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
