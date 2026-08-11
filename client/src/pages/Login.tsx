import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Sparkles, Building, ShieldCheck } from 'lucide-react';
import { VietnameseEmblem } from '../components/VietnameseEmblem';

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
      title: 'Quản trị hệ thống',
      username: 'admin',
      password: 'admin123',
      dept: 'Phòng CNTT & Quản trị',
      badge: 'bg-[#BDCBF4]/40 text-[#0C3260] border border-[#91A8ED] hover:bg-[#BDCBF4]/70',
    },
    {
      role: 'LEADERSHIP',
      title: 'Chủ tịch UBND xã',
      username: 'chutich',
      password: 'chutich123',
      dept: 'Lãnh đạo UBND xã',
      badge: 'bg-[#CFEBFC] text-[#0C3260] border border-[#6EC2F7] hover:bg-[#9FD7F9]/50',
    },
    {
      role: 'LEADERSHIP',
      title: 'Phó Chủ tịch UBND',
      username: 'phochutich',
      password: 'phochutich123',
      dept: 'Lãnh đạo UBND xã',
      badge: 'bg-[#CFEBFC]/80 text-[#1864AB] border border-[#9FD7F9] hover:bg-[#CFEBFC]',
    },
    {
      role: 'DEPARTMENT_HEAD',
      title: 'Giám đốc TTPVHCC',
      username: 'truongphong_hcc',
      password: 'head123',
      dept: 'Trung tâm PV Hành chính công',
      badge: 'bg-[#9FD7F9]/30 text-[#1864AB] border border-[#6EC2F7] hover:bg-[#9FD7F9]/60',
    },
    {
      role: 'DEPARTMENT_HEAD',
      title: 'Trưởng BP Địa chính',
      username: 'truongphong_dc',
      password: 'head123',
      dept: 'Bộ phận Địa chính - Xây dựng',
      badge: 'bg-[#6EC2F7]/25 text-[#0C3260] border border-[#3EAEF4] hover:bg-[#6EC2F7]/50',
    },
    {
      role: 'EMPLOYEE',
      title: 'Công chức Địa chính',
      username: 'congchuc_dc',
      password: 'emp123',
      dept: 'Bộ phận Địa chính - Xây dựng',
      badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
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
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4">
      {/* Container with Vietnix palette shadow */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-[#27A4F2]/10 border border-[#CFEBFC] overflow-hidden relative">
        {/* Header with National Emblem & Vietnix Blue Gradient */}
        <div className="bg-gradient-to-br from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white p-6 md:p-8 text-center relative border-b-2 border-[#9FD7F9]/40">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur-md" />
            <VietnameseEmblem size={78} className="relative mx-auto drop-shadow-xl" />
          </div>

          <h2 className="text-base md:text-lg font-black tracking-wider uppercase drop-shadow-sm text-white">
            ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM
          </h2>
          <p className="text-xs text-[#CFEBFC] font-medium mt-1">
            Hệ thống Quản lý Nhiệm vụ & Đánh giá Cán bộ, Công chức
          </p>

          <div className="inline-flex items-center space-x-1.5 mt-3 text-[11px] bg-[#0C3260]/60 text-[#9FD7F9] border border-[#6EC2F7]/30 px-3 py-1 rounded-full font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3EAEF4]" />
            <span>Khung Đánh giá Nghị định số 335/2025/NĐ-CP</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-[#0C3260] flex items-center space-x-2">
              <LogIn className="w-4 h-4 text-[#27A4F2]" />
              <span>Đăng nhập hệ thống</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Bảo mật JWT</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1.5 tracking-wider">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium transition placeholder:text-slate-400 bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                  placeholder="Nhập tên tài khoản"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1.5 tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium transition placeholder:text-slate-400 bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#27A4F2] via-[#3EAEF4] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-[#27A4F2]/25 transition-all flex items-center justify-center space-x-2 mt-3 cursor-pointer hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#CFEBFC]" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-7 pt-5 border-t border-[#CFEBFC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#0C3260] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Chọn nhanh tài khoản trải nghiệm:</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSelectDemo(acc.username, acc.password)}
                  className={`p-2.5 text-left rounded-xl text-xs font-medium transition hover:shadow-xs flex flex-col justify-between ${acc.badge} active:scale-[0.98]`}
                >
                  <span className="font-bold truncate text-[11px] leading-tight">{acc.title}</span>
                  <span className="text-[10px] opacity-75 font-mono mt-1">@{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#F0F7FD] px-6 py-3.5 border-t border-[#CFEBFC] text-center text-xs text-[#1864AB] flex items-center justify-center space-x-1.5">
          <Building className="w-3.5 h-3.5 text-[#6EC2F7]" />
          <span>Ủy ban nhân dân xã Nghĩa Lâm — Tỉnh Nghệ An</span>
        </div>
      </div>
    </div>
  );
};
