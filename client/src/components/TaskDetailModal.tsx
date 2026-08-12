import React, { useState } from 'react';
import { tasksApi } from '../services/api';
import { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  Scale,
  FileCheck,
  Send,
  Building2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskDetailModal: React.FC<Props> = ({ isOpen, task, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>(task?.status || 'PENDING');
  const [evidence, setEvidence] = useState<string>(task?.evidence || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (task) {
      setStatus(task.status);
      setEvidence(task.evidence || '');
    }
    setError(null);
    setSuccess(null);
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate skipping from PENDING directly to COMPLETED
    if (task.status === 'PENDING' && status === 'COMPLETED') {
      const confirmSkip = window.confirm(
        'Nhiệm vụ đang ở trạng thái "Chờ tiếp nhận" (PENDING). Bạn có chắc chắn muốn hoàn thành trực tiếp mà không qua bước "Đang thực hiện" (IN_PROGRESS)?'
      );
      if (!confirmSkip) {
        setStatus('IN_PROGRESS');
        return;
      }
    }

    if (status === 'COMPLETED' && !evidence.trim() && !task.evidence) {
      setError('Vui lòng nhập minh chứng / tóm tắt kết quả thực hiện khi chuyển sang Đã hoàn thành (COMPLETED).');
      return;
    }

    setLoading(true);
    try {
      await tasksApi.updateTaskStatus(task.id, status, evidence.trim());
      setSuccess('Cập nhật tiến độ nhiệm vụ thành công!');
      setTimeout(() => {
        setSuccess(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tiến độ.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (t: Task) => {
    if (t.is_overdue || t.computed_status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Quá hạn</span>
        </span>
      );
    }
    switch (t.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Đã hoàn thành</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Đang thực hiện</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ tiếp nhận</span>
          </span>
        );
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isAssignee = user?.id === task.assigned_to;
  const isCreatorOrAdmin =
    user?.id === task.assigned_by || user?.role === 'ADMIN' || user?.role === 'LEADERSHIP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chi Tiết Nhiệm Vụ #{task.id}</h3>
              <p className="text-xs text-slate-500">UBND Xã Nghĩa Lâm — Theo dõi & Đánh giá công việc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                <span>Người giao việc: <strong>{task.creator_name || 'Lãnh đạo'}</strong></span>
                <span>•</span>
                <span>Ngày tạo: {formatDateTime(task.created_at || '')}</span>
              </div>
            </div>
            <div className="flex-shrink-0">{getStatusBadge(task)}</div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 flex items-center space-x-1 mb-1">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Người thực hiện</span>
              </span>
              <div className="font-bold text-slate-800">{task.assignee_name}</div>
              <div className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.assignee_department_name || task.assignee_position}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 flex items-center space-x-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Hạn hoàn thành (Deadline)</span>
              </span>
              <div className="font-bold text-red-700">{formatDateTime(task.deadline)}</div>
              {task.is_overdue && (
                <span className="text-xs text-red-600 font-medium">Đã quá thời hạn quy định</span>
              )}
            </div>

            {task.catalog_name && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/50">
                <span className="text-xs font-semibold uppercase text-slate-500 flex items-center space-x-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Danh mục sản phẩm NĐ 335</span>
                </span>
                <div className="font-semibold text-slate-800">
                  [{task.catalog_code}] {task.catalog_name}
                </div>
                <div className="text-xs text-purple-700 font-medium mt-0.5">
                  Hệ số quy đổi: <strong>{task.catalog_coefficient}</strong> (Tương đương {(task.catalog_coefficient || 1) * 5} điểm chuẩn)
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold uppercase text-slate-500 flex items-center space-x-1 mb-1">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>Trọng số</span>
              </span>
              <div className="font-bold text-slate-800">{task.weight}</div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Nội dung / Yêu cầu chi tiết
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-lg text-slate-700 text-xs leading-relaxed whitespace-pre-wrap border border-slate-200/50">
                {task.description}
              </div>
            </div>
          )}

          {/* Submitted Evidence View (If already submitted) */}
          {task.evidence && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Minh chứng sản phẩm đã nộp
              </h4>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs leading-relaxed whitespace-pre-wrap">
                {task.evidence}
              </div>
            </div>
          )}

          {/* Status Update Form (For Assignee or Creator/Admin) */}
          {(isAssignee || isCreatorOrAdmin) && (
            <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center space-x-2 text-sm">
                <Send className="w-4 h-4 text-sky-600" />
                <span>Cập nhật tiến độ & Nộp kết quả thực hiện</span>
              </h4>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Chuyển trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs bg-white font-medium"
                >
                  <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
                  <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                  <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Minh chứng / Ghi chú kết quả (Số hiệu văn bản, đường dẫn file, nội dung tóm tắt)
                </label>
                <textarea
                  rows={3}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="VD: Đã hoàn thiện dự thảo Quyết định số 12/QĐ-UBND, lưu tại hồ sơ công việc số 04..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Đang lưu...' : 'Lưu cập nhật tiến độ'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
