import React, { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import { ProductCatalog } from '../types';
import { X, Layers, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  item: ProductCatalog | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CatalogModal: React.FC<Props> = ({ isOpen, item, onClose, onSuccess }) => {
  const isEditing = !!item;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'PART_A',
    coefficient: 1.0,
    baseline_score: 5.0,
    description: '',
    status: 'ACTIVE',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        category: item.category,
        coefficient: item.coefficient,
        baseline_score: item.baseline_score || 5.0,
        description: item.description || '',
        status: item.status,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'PART_A',
        coefficient: 1.0,
        baseline_score: 5.0,
        description: '',
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm / tiêu chí.');
      return;
    }

    if (!isEditing && !formData.code.trim()) {
      setError('Vui lòng nhập mã sản phẩm định danh.');
      return;
    }

    const coeff = Number(formData.coefficient);
    if (isNaN(coeff) || coeff <= 0) {
      setError('Hệ số quy đổi K phải là số dương lớn hơn 0.');
      return;
    }

    const baseScore = Number(formData.baseline_score);
    if (isNaN(baseScore) || baseScore <= 0) {
      setError('Điểm chuẩn gốc phải là số dương lớn hơn 0.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && item) {
        await catalogApi.updateCatalogItem(item.id, {
          name: formData.name.trim(),
          category: formData.category,
          coefficient: coeff,
          baseline_score: baseScore,
          description: formData.description ? formData.description.trim() : null,
          status: formData.status,
        });
      } else {
        await catalogApi.createCatalogItem({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          coefficient: coeff,
          baseline_score: baseScore,
          description: formData.description ? formData.description.trim() : null,
          status: formData.status,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm danh mục.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">
              {isEditing ? 'Sửa Sản Phẩm / Tiêu Chí NĐ 335' : 'Thêm Sản Phẩm Danh Mục NĐ 335'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Mã sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-slate-100 font-mono"
                placeholder="VD: DOC_CUSTOM"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Nhóm danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm bg-white"
              >
                <option value="PART_A">Phần A - Sản phẩm hành chính</option>
                <option value="PART_B_GROUP_I">Phần B.I - Giải quyết TTHC TTPVHCC</option>
                <option value="PART_B_GROUP_II">Phần B.II - Tiếp dân & Nhiệm vụ đột xuất</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Tên sản phẩm / Tiêu chí công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="VD: Soạn thảo văn bản quy phạm pháp luật cấp xã"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Hệ số quy đổi (K) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.05"
                required
                value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Điểm chuẩn = {(Number(formData.coefficient || 0) * Number(formData.baseline_score || 0)).toFixed(1)} điểm/sản phẩm
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Điểm chuẩn gốc (Mặc định 5.0)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.baseline_score}
                onChange={(e) => setFormData({ ...formData, baseline_score: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="Ghi chú quy cách, tiêu chuẩn áp dụng theo NĐ 335..."
            />
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
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu cập nhật' : 'Thêm vào danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
