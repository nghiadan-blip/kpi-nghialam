import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | string)[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">Đang tải phiên làm việc...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-xl shadow-sm border border-red-200 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-600 mb-6">
          Tài khoản của bạn (<strong className="text-slate-800">{user.fullname}</strong> - Vai trò:{' '}
          <span className="font-semibold text-sky-700">{user.role}</span>) không được phép truy cập vào chức năng này.
        </p>
        <div className="flex justify-center space-x-3">
          <a
            href="/"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            Quay về Trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
