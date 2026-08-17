import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { LogIn, User, Lock, AlertCircle, Sparkles, Building, ShieldCheck, Mail, UserPlus, Clock } from 'lucide-react';
import { VietnameseEmblem } from '../components/VietnameseEmblem';
import { APP_NAME, SUB_TITLE } from '../constants';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  // Gmail Quick Login Dialog
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailAddress, setGmailAddress] = useState('');

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
    setPendingNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(null);

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
      if (err.response?.data?.status === 'PENDING_APPROVAL') {
        setPendingNotice(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(null);

    if (!gmailAddress.trim() || !gmailAddress.includes('@')) {
      setError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.googleAuth({
        email: gmailAddress.trim().toLowerCase(),
      });

      if (res.status === 'PENDING_APPROVAL') {
        setGmailModalOpen(false);
        setPendingNotice(res.message);
      } else if (res.token && res.user) {
        localStorage.setItem('cbcc_token', res.token);
        localStorage.setItem('cbcc_user', JSON.stringify(res.user));
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập Gmail không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 space-y-6">
      {/* Header chính (Ngoài login card) */}
      <div className="text-center max-w-md w-full space-y-3">
        <div className="relative inline-block">
          <div className="absolute -inset-1.5 bg-[#27A4F2]/20 rounded-full blur-xs opacity-75" />
          <VietnameseEmblem size={72} className="relative mx-auto drop-shadow-md" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-black tracking-wider uppercase text-[#0C3260]">
            ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM
          </h2>
          <h3 className="text-sm font-bold text-[#1864AB]">
            {APP_NAME}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {SUB_TITLE}
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-[#27A4F2]/10 border border-[#CFEBFC] overflow-hidden relative">
        {/* Login Form Body */}
        <div className="p-6 md:p-8">
          {/* Card branding header */}
          <div className="text-center pb-5 mb-5 border-b border-slate-100">
            <div className="inline-flex items-center justify-center p-2.5 bg-[#CFEBFC]/40 text-[#1864AB] rounded-2xl mb-2">
              <LogIn className="w-6 h-6 text-[#27A4F2]" />
            </div>
            <h4 className="text-base font-extrabold text-[#0C3260]">Đăng nhập hệ thống</h4>
            <p className="text-xs text-slate-500 mt-1">
              {APP_NAME}
            </p>
          </div>

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#27A4F2]" />
              <span>JWT Authentication</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Phiên bản bảo mật</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {pendingNotice && (
            <div className="mb-5 p-4 rounded-2xl bg-[#CFEBFC]/60 border border-[#9FD7F9] text-[#0C3260] text-xs flex items-start space-x-3">
              <Clock className="w-5 h-5 text-[#27A4F2] mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="font-bold">Hồ sơ đang chờ phê duyệt:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{pendingNotice}</p>
              </div>
            </div>
          )}

          {/* Quick Google Sign-In Button */}
          <button
            type="button"
            onClick={() => setGmailModalOpen(true)}
            className="w-full py-2.5 px-4 mb-4 bg-white hover:bg-slate-50 border border-[#9FD7F9] hover:border-[#27A4F2] rounded-xl flex items-center justify-center space-x-2.5 transition shadow-2xs group cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs font-bold text-[#0C3260] group-hover:text-[#27A4F2] transition">
              Đăng nhập bằng tài khoản Google / Gmail
            </span>
          </button>

          <div className="relative flex py-2 items-center mb-2">
            <div className="flex-grow border-t border-[#CFEBFC]"></div>
            <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">
              hoặc tài khoản hệ thống
            </span>
            <div className="flex-grow border-t border-[#CFEBFC]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                Tên đăng nhập hoặc Email
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
                  placeholder="Tài khoản hoặc email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
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
              className="w-full py-3 px-4 bg-gradient-to-r from-[#27A4F2] via-[#3EAEF4] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-[#27A4F2]/25 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer hover:shadow-lg active:scale-[0.99]"
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

          {/* Link to Register */}
          <div className="mt-4 text-center">
            <Link
              to="/register"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#27A4F2] hover:text-[#1864AB] transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Chưa có tài khoản? Đăng ký cán bộ mới</span>
            </Link>
          </div>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-4 border-t border-[#CFEBFC]">
            <div className="flex items-center justify-between mb-2.5">
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
                  className={`p-2 text-left rounded-xl text-xs font-medium transition hover:shadow-2xs flex flex-col justify-between ${acc.badge} active:scale-[0.98]`}
                >
                  <span className="font-bold truncate text-[11px] leading-tight">{acc.title}</span>
                  <span className="text-[10px] opacity-75 font-mono mt-0.5">@{acc.username}</span>
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

      {/* Gmail Input Dialog */}
      {gmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFEBFC]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="w-6 h-6 text-[#27A4F2]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Đăng Nhập Bằng Gmail</h3>
                <p className="text-xs text-slate-500">Xác thực tài khoản Gmail của đồng chí</p>
              </div>
            </div>

            <form onSubmit={handleGmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                  Địa chỉ Gmail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-sm focus:ring-2 focus:ring-[#27A4F2]"
                  placeholder="canbo.nghialam@gmail.com"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {loading ? 'Đang kiểm tra...' : 'Xác Nhận Đăng Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
