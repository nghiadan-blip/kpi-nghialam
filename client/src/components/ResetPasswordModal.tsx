import React, { useState } from 'react';
import { usersApi } from '../services/api';
import { User } from '../types';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<Props> = ({ isOpen, user, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await usersApi.resetPassword(user.id, newPassword);
      setSuccess(`Đã đặt lại mật khẩu mới cho cán bộ ${user.fullname} thành công!`);
      setTimeout(() => {
        setSuccess(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cấp lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800">Cấp Lại Mật Khẩu Cán Bộ</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
            <div><strong>Họ và tên:</strong> {user.fullname}</div>
            <div><strong>Tài khoản:</strong> <span className="font-mono text-sky-700">{user.username}</span></div>
            <div><strong>Chức vụ:</strong> {user.position}</div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-mono"
              placeholder="Nhập mật khẩu mới"
            />
            <p className="text-xs text-slate-500 mt-1">Mặc định: 123456</p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Đang thực hiện...' : 'Xác nhận cấp lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
