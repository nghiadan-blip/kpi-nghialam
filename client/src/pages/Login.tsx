import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Sparkles, Building } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'ADMIN',
      title: 'Quản trị viên',
      username: 'admin',
      password: 'admin123',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    },
    {
      role: 'LEADERSHIP',
      title: 'Chủ tịch UBND xã',
      username: 'chutich',
      password: 'chutich123',
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    },
    {
      role: 'LEADERSHIP',
      title: 'Phó Chủ tịch',
      username: 'phochutich',
      password: 'phochutich123',
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    },
    {
      role: 'DEPARTMENT_HEAD',
      title: 'Giám đốc TTPVHCC',
      username: 'truongphong_hcc',
      password: 'head123',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      role: 'DEPARTMENT_HEAD',
      title: 'Trưởng BP Địa chính',
      username: 'truongphong_dc',
      password: 'head123',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    },
    {
      role: 'EMPLOYEE',
      title: 'Công chức Địa chính',
      username: 'congchuc_dc',
      password: 'emp123',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
  ];

  const handleSelectDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white p-6 text-center relative">
          <div className="w-12 h-12 bg-amber-400 text-red-700 rounded-full flex items-center justify-center font-bold text-xl mx-auto shadow-md mb-2">
            ★
          </div>
          <h2 className="text-lg font-bold tracking-wide uppercase">UBND XÃ NGHĨA LÂM</h2>
          <p className="text-xs text-yellow-100 font-light mt-1">
            Hệ thống Quản lý & Đánh giá Cán bộ, Công chức
          </p>
          <div className="text-[10px] bg-red-900/40 text-yellow-200 rounded-full px-3 py-0.5 inline-block mt-2">
            Khung đánh giá Nghị định 335/2025/NĐ-CP
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <LogIn className="w-4 h-4 text-sky-600" />
            <span>Đăng nhập hệ thống</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                  placeholder="Nhập tên tài khoản"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Chọn tài khoản trải nghiệm nhanh:</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSelectDemo(acc.username, acc.password)}
                  className={`p-2 text-left rounded-lg border text-xs font-medium transition ${acc.color} flex flex-col`}
                >
                  <span className="font-bold truncate">{acc.title}</span>
                  <span className="text-[11px] opacity-75 font-mono">@{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>Ủy ban nhân dân xã Nghĩa Lâm — Tỉnh Nghệ An</span>
        </div>
      </div>
    </div>
  );
};
