import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Tổng quan Hệ thống CBCC xã Nghĩa Lâm
        </h2>
        <p className="text-slate-600">
          Chào mừng đến với hệ thống giao nhiệm vụ, quản lý công việc và đánh giá chấm điểm cán bộ, công chức cấp xã theo Nghị định 335/2025/NĐ-CP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sky-50 border border-sky-200 p-5 rounded-xl">
          <h3 className="font-semibold text-sky-900">Khung Đánh giá NĐ 335</h3>
          <p className="text-sm text-sky-700 mt-1">Sản phẩm chuẩn 5.0 điểm với hệ số chuyển đổi tương ứng.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
          <h3 className="font-semibold text-emerald-900">Quy trình 3 Bước</h3>
          <p className="text-sm text-emerald-700 mt-1">Tự đánh giá → Trưởng bộ phận duyệt → Lãnh đạo phê duyệt.</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl">
          <h3 className="font-semibold text-purple-900">Phân quyền RBAC</h3>
          <p className="text-sm text-purple-700 mt-1">4 Vai trò: Admin, Lãnh đạo, Trưởng bộ phận, Công chức.</p>
        </div>
      </div>
    </div>
  );
};
