import React, { useState } from 'react';
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
} from 'lucide-react';
import { StatusPing } from './StatusPing';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold">Quản trị viên</span>;
      case 'LEADERSHIP':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">Lãnh đạo UBND</span>;
      case 'DEPARTMENT_HEAD':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">Trưởng bộ phận</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold">Công chức</span>;
    }
  };

  const navItems = [
    { to: '/', label: 'Trang chủ', icon: LayoutDashboard, show: true },
    { to: '/tasks', label: 'Nhiệm vụ', icon: CheckSquare, show: true },
    { to: '/evaluations', label: 'Đánh giá & Chấm điểm', icon: Award, show: true },
    { to: '/admin', label: 'Quản trị hệ thống', icon: Shield, show: hasRole(['ADMIN']) },
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        {/* Branding Header Banner */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-red-800 flex items-center justify-center font-bold text-lg shadow">
              ★
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold uppercase tracking-wide">
                ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM
              </h1>
              <p className="text-xs text-yellow-100 font-light">
                Hệ thống Quản lý Nhiệm vụ & Đánh giá Cán bộ, Công chức (NĐ 335/2025/NĐ-CP)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <StatusPing />
          </div>
        </div>

        {/* Main Navigation Bar */}
        <nav className="px-6 py-1 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex space-x-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </div>

          {/* User Account Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                    {user.fullname.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold leading-tight text-slate-900 flex items-center space-x-1.5">
                      <span>{user.fullname}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                      {user.position}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Đang đăng nhập với tư cách</p>
                        <p className="text-sm font-bold text-slate-800">{user.fullname}</p>
                        <p className="text-xs text-sky-700 font-medium mt-0.5">
                          {user.department_name || user.position}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span>Đổi mật khẩu</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
