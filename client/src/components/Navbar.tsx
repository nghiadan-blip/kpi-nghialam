import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Award,
  Shield,
  LogOut,
  KeyRound,
  User as UserIcon,
  ChevronDown,
  Clock,
  Wallet,
  Building2,
  Map,
  Briefcase
} from 'lucide-react';
import { VietnameseEmblem } from './VietnameseEmblem';
import { StatusPing } from './StatusPing';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { APP_NAME, SUB_TITLE } from '../constants';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-[#91A8ED]/20 text-[#1864AB] border border-[#91A8ED] px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs">
            Quản trị viên
          </span>
        );
      case 'LEADERSHIP':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs">
            Lãnh đạo UBND
          </span>
        );
      case 'DEPARTMENT_HEAD':
        return (
          <span className="bg-[#CFEBFC] text-[#1864AB] border border-[#9FD7F9] px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs">
            Trưởng bộ phận
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs">
            Công chức
          </span>
        );
    }
  };

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: LayoutDashboard, show: true },
    { to: '/tasks', label: 'Nhiệm vụ', icon: CheckSquare, show: true },
    { to: '/evaluations', label: 'Đánh giá KPI', icon: Award, show: true },
    { to: '/budget', label: 'Ngân sách', icon: Wallet, show: isAuthenticated && (hasRole(['LEADERSHIP', 'ADMIN']) || user?.department_id === 6) },
    { to: '/public-investment', label: 'Đầu tư công', icon: Building2, show: isAuthenticated },
    { to: '/land-certificates', label: 'Đất đai (KH965)', icon: Map, show: isAuthenticated },
    { to: '/office', label: 'Văn phòng', icon: Briefcase, show: isAuthenticated },
    { to: '/admin', label: 'Quản trị', icon: Shield, show: hasRole(['ADMIN']) },
  ];

  return (
    <>
      <header className="bg-white border-b border-[#CFEBFC] shadow-sm sticky top-0 z-40">
        {/* Top Header Branding Banner — Exact Vietnix Blue Gradient */}
        <div className="bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white px-4 md:px-8 py-2.5 flex items-center justify-between border-b border-[#9FD7F9]/30">
          <div className="flex items-center space-x-3.5">
            {/* National Emblem of Vietnam (Quoc huy) */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-xs opacity-75 group-hover:opacity-100 transition" />
              <VietnameseEmblem size={44} className="relative transform group-hover:scale-105 transition duration-300 drop-shadow-md" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm md:text-base font-black uppercase tracking-wider text-white drop-shadow-xs">
                  ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-white/20 text-[#CFEBFC] border border-[#9FD7F9]/40 px-2 py-0.5 rounded-full font-bold">
                  TỈNH NGHỆ AN
                </span>
              </div>
              <p className="text-xs text-[#CFEBFC] font-medium tracking-wide">
                {APP_NAME} — {SUB_TITLE}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-[#CFEBFC] bg-[#0C3260]/60 px-3 py-1 rounded-full border border-[#9FD7F9]/30 font-mono shadow-inner">
              <Clock className="w-3.5 h-3.5 text-[#9FD7F9]" />
              <span>{currentTime}</span>
            </div>
            <StatusPing />
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex space-x-1 sm:space-x-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#27A4F2] text-white font-bold shadow-md shadow-[#27A4F2]/30 border border-[#27A4F2]'
                          : 'text-[#1864AB] hover:bg-[#CFEBFC]/60 hover:text-[#0C3260]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </div>

          {/* User Profile Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-[#CFEBFC]/50 transition-all border border-transparent hover:border-[#9FD7F9] text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1864AB] to-[#27A4F2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.fullname.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold leading-tight text-slate-900 flex items-center space-x-1.5">
                      <span className="truncate max-w-[140px]">{user.fullname}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-[11px] text-[#1864AB] truncate max-w-[180px]">
                      {user.department_name || user.position}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#CFEBFC] py-2 z-50 animate-fade-in divide-y divide-[#CFEBFC]">
                      <div className="px-4 py-2.5 bg-[#F0F7FD]">
                        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                          Tài khoản đang đăng nhập
                        </p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{user.fullname}</p>
                        <p className="text-xs text-[#27A4F2] font-medium">
                          {user.department_name || user.position}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#CFEBFC]/40 flex items-center space-x-2 transition"
                        >
                          <KeyRound className="w-4 h-4 text-[#27A4F2]" />
                          <span>Đổi mật khẩu cá nhân</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Đăng xuất hệ thống</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#27A4F2] to-[#4585E6] hover:from-[#3EAEF4] hover:to-[#27A4F2] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </>
  );
};
