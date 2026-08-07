import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Award, Shield } from 'lucide-react';
import { StatusPing } from './StatusPing';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Trang chủ', icon: LayoutDashboard },
    { to: '/tasks', label: 'Nhiệm vụ', icon: CheckSquare },
    { to: '/evaluations', label: 'Đánh giá & Chấm điểm', icon: Award },
    { to: '/admin', label: 'Quản trị hệ thống', icon: Shield },
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      {/* Branding Header Banner */}
      <div className="bg-gov-red text-white px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gov-yellow text-gov-red flex items-center justify-center font-bold text-lg shadow">
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
        <StatusPing />
      </div>

      {/* Main Navigation Bar */}
      <nav className="px-6 py-1 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex space-x-1">
          {navItems.map((item) => {
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

        <div className="text-xs text-slate-500 font-mono">
          Phiên bản M1 Scaffolding
        </div>
      </nav>
    </header>
  );
};
