import React, { useState, useEffect } from 'react';
import { tasksApi, aiApi } from '../services/api';
import { Task, User, ProductCatalog } from '../types';
import { X, CheckSquare, AlertCircle, Scale, Layers, Sparkles, RefreshCw } from 'lucide-react';

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
  const [generatingAI, setGeneratingAI] = useState(false);
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

  const handleAISuggest = async () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập Tiêu đề nhiệm vụ trước để DeepSeek AI có cơ sở gợi ý.');
      return;
    }

    const assignedUser = users.find((u) => u.id === Number(formData.assigned_to));
    setGeneratingAI(true);
    setError(null);

    try {
      const res = await aiApi.suggestTaskDetails({
        title: formData.title,
        department_name: assignedUser?.department_name ?? undefined,
        position: assignedUser?.position,
      });

      setFormData((prev) => ({
        ...prev,
        description: res.description,
      }));
    } catch (err: any) {
      console.error('Lỗi gợi ý AI:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề nhiệm vụ.');
      return;
    }

    if (!formData.assigned_to) {
      setError('Vui lòng chọn cán bộ thực hiện.');
      return;
    }

    if (!formData.deadline) {
      setError('Vui lòng chọn hạn hoàn thành.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: Number(formData.assigned_to),
        product_catalog_id: formData.product_catalog_id ? Number(formData.product_catalog_id) : null,
        deadline: new Date(formData.deadline).toISOString(),
        weight: Number(formData.weight) || 1.0,
        status: formData.status,
      };

      if (isEditing && task) {
        await tasksApi.updateTask(task.id, payload);
      } else {
        await tasksApi.createTask(payload);
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-red-700" />
            <h3 className="font-bold text-slate-900 text-base">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">
              Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
              placeholder="VD: Soạn thảo báo cáo tình hình kinh tế - xã hội Quý 3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">
                Người thực hiện (Cán bộ) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-white"
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
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">
                Hạn hoàn thành (Deadline) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1 tracking-wider">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Gắn danh mục sản phẩm (Theo NĐ 335/2025/NĐ-CP)</span>
            </label>
            <select
              value={formData.product_catalog_id}
              onChange={(e) => setFormData({ ...formData, product_catalog_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-white"
            >
              <option value="">-- Không gắn danh mục --</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} (Hệ số: {c.coefficient})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Sản phẩm gắn với nhiệm vụ sẽ tự động được đưa vào biểu chấm điểm tháng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1 tracking-wider">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">
                Trạng thái nhiệm vụ
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm bg-white"
              >
                <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
                <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                Mô tả chi tiết nội dung & yêu cầu
              </label>
              <button
                type="button"
                disabled={generatingAI}
                onClick={handleAISuggest}
                className="flex items-center space-x-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-50 to-red-50 hover:from-amber-100 hover:to-red-100 text-red-800 border border-amber-300 rounded-md text-[11px] font-bold transition shadow-2xs disabled:opacity-50"
              >
                {generatingAI ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-red-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-600" />
                )}
                <span>{generatingAI ? 'AI đang soạn...' : '✨ DeepSeek AI Gợi Ý'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs sm:text-sm font-normal leading-relaxed"
              placeholder="Yêu cầu cụ thể về nội dung, quy cách trình bày, thời gian nghiệm thu..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Cập Nhật Nhiệm Vụ' : 'Phân Công Nhiệm Vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
