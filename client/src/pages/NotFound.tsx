import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="text-center py-12">
      <h2 className="text-4xl font-bold text-slate-800 mb-2">404</h2>
      <p className="text-slate-600 mb-4">Trang bạn tìm kiếm không tồn tại.</p>
      <Link to="/" className="text-sky-600 hover:underline font-medium text-sm">
        Quay lại Trang chủ
      </Link>
    </div>
  );
};
