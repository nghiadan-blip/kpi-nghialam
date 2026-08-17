import React, { useState, useEffect, useMemo } from 'react';
import { tasksApi, aiApi, budgetApi, publicInvestmentApi, landCertificateApi, officeApi } from '../services/api';
import { Task, User, ProductCatalog, BudgetRevenueItem, BudgetExpenditureItem, PublicInvestmentProject, LandCertificateCase, OfficeRequest } from '../types';
import {
  X,
  CheckSquare,
  AlertCircle,
  Scale,
  Layers,
  Sparkles,
  Search,
  Check,
  Filter,
  User as UserIcon,
  Calendar,
  FileText,
  Zap,
  RefreshCw,
  Link,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  task: Task | null;
  users: User[];
  catalog: ProductCatalog[];
  onClose: () => void;
  onSuccess: () => void;
}

// Position-to-category mapping keywords
const POSITION_GROUPS = [
  {
    id: 'AUTO',
    label: '🎯 Theo vị trí cán bộ',
    keywords: [],
  },
  {
    id: 'DIA_CHINH',
    label: 'Địa chính - Xây dựng',
    keywords: ['địa chính', 'xây dựng', 'môi trường', 'nông nghiệp', 'đất', 'quy hoạch', 'giao thông', 'thủy lợi', 'trật tự'],
  },
  {
    id: 'TU_PHAP',
    label: 'Tư pháp - Hộ tịch',
    keywords: ['tư pháp', 'hộ tịch', 'chứng thực', 'khai sinh', 'kết hôn', 'khai tử', 'hòa giải', 'pháp chế', 'chứng thực'],
  },
  {
    id: 'VAN_PHONG',
    label: 'Văn phòng - Thống kê',
    keywords: ['văn phòng', 'thống kê', 'nội vụ', 'báo cáo', 'công văn', 'lưu trữ', 'họp', 'tiếp dân', 'giao ban'],
  },
  {
    id: 'TAI_CHINH',
    label: 'Tài chính - Kế toán',
    keywords: ['tài chính', 'kế toán', 'ngân sách', 'thu chi', 'kho bạc', 'thanh quyết toán', 'chứng từ'],
  },
  {
    id: 'VAN_HOA',
    label: 'Văn hóa - Xã hội',
    keywords: ['văn hóa', 'xã hội', 'lao động', 'thương binh', 'chính sách', 'hộ nghèo', 'y tế', 'giáo dục', 'thể thao'],
  },
  {
    id: 'LANH_DAO',
    label: 'Lãnh đạo UBND',
    keywords: ['chủ tịch', 'lãnh đạo', 'hđnd', 'chỉ đạo', 'chủ trì', 'phê duyệt', 'kết luận', 'nghị quyết'],
  },
  {
    id: 'ALL',
    label: 'Tất cả (460+ mục)',
    keywords: [],
  },
];

export const TaskModal: React.FC<Props> = ({
  isOpen,
  task,
  users,
  catalog,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '' as string | number,
    product_catalog_id: '' as string | number,
    deadline: '',
    weight: 1.0,
    status: 'PENDING',
    assigned_quantity: 1.0 as any,
    related_land_case_id: '',
    related_project_id: '',
    related_revenue_id: '',
    related_expenditure_id: '',
    related_office_request_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [matchingAI, setMatchingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States to hold cross-linking tables data
  const [landCases, setLandCases] = useState<LandCertificateCase[]>([]);
  const [projects, setProjects] = useState<PublicInvestmentProject[]>([]);
  const [revenues, setRevenues] = useState<BudgetRevenueItem[]>([]);
  const [expenditures, setExpenditures] = useState<BudgetExpenditureItem[]>([]);
  const [officeRequests, setOfficeRequests] = useState<OfficeRequest[]>([]);

  // Load related documents on open
  useEffect(() => {
    if (isOpen) {
      landCertificateApi.getCases().then(res => setLandCases(res.cases || [])).catch(() => {});
      publicInvestmentApi.getProjects().then(res => setProjects(res.projects || [])).catch(() => {});
      budgetApi.getBudgets().then(res => {
        setRevenues(res.revenues || []);
        setExpenditures(res.expenditures || []);
      }).catch(() => {});
      officeApi.getRequests().then(res => setOfficeRequests(res.requests || [])).catch(() => {});
    }
  }, [isOpen]);

  // Catalog Filter & Search States
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('AUTO');
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ item: ProductCatalog; confidence: number; match_reason: string }>
  >([]);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);

  // Selected User Object
  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === Number(formData.assigned_to)) || null;
  }, [users, formData.assigned_to]);

  // Selected Catalog Item Object
  const selectedCatalogItem = useMemo(() => {
    return catalog.find((c) => c.id === Number(formData.product_catalog_id)) || null;
  }, [catalog, formData.product_catalog_id]);

  useEffect(() => {
    if (task) {
      let deadlineFormatted = '';
      if (task.deadline) {
        const d = new Date(task.deadline);
        deadlineFormatted = d.toISOString().slice(0, 16);
      }

      setFormData({
        title: task.title,
        description: task.description || '',
        assigned_to: task.assigned_to,
        product_catalog_id: task.product_catalog_id || '',
        deadline: deadlineFormatted,
        weight: task.weight,
        status: task.status,
        assigned_quantity: task.assigned_quantity || 1.0,
        related_land_case_id: task.related_land_case_id ? String(task.related_land_case_id) : '',
        related_project_id: task.related_project_id ? String(task.related_project_id) : '',
        related_revenue_id: task.related_revenue_id ? String(task.related_revenue_id) : '',
        related_expenditure_id: task.related_expenditure_id ? String(task.related_expenditure_id) : '',
        related_office_request_id: task.related_office_request_id ? String(task.related_office_request_id) : '',
      });
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      defaultDate.setHours(17, 0, 0, 0);

      setFormData({
        title: '',
        description: '',
        assigned_to: users[0]?.id || '',
        product_catalog_id: '',
        deadline: defaultDate.toISOString().slice(0, 16),
        weight: 1.0,
        status: 'PENDING',
        assigned_quantity: 1.0,
        related_land_case_id: '',
        related_project_id: '',
        related_revenue_id: '',
        related_expenditure_id: '',
        related_office_request_id: '',
      });
    }
    setError(null);
    setCatalogSearch('');
    setAiSuggestions([]);
    setIsCatalogPickerOpen(false);
  }, [task, isOpen, users]);

  // Filter Catalog Items based on Active Group & Search Text
  const filteredCatalog = useMemo(() => {
    let list = catalog;

    // 1. Group / Position Filtering
    if (selectedGroup === 'AUTO') {
      if (selectedUser) {
        const posDept = `${selectedUser.position || ''} ${selectedUser.department_name || ''}`.toLowerCase();
        // Detect matching keywords from posDept
        let activeKeywords: string[] = [];
        for (const grp of POSITION_GROUPS) {
          if (grp.id !== 'AUTO' && grp.id !== 'ALL') {
            if (grp.keywords.some((kw) => posDept.includes(kw))) {
              activeKeywords = [...activeKeywords, ...grp.keywords];
            }
          }
        }

        if (activeKeywords.length > 0) {
          list = list.filter((item) => {
            const itemText = `${item.name} ${item.code} ${item.description || ''}`.toLowerCase();
            return activeKeywords.some((kw) => itemText.includes(kw)) || item.category === 'PART_A';
          });
        }
      }
    } else if (selectedGroup !== 'ALL') {
      const grp = POSITION_GROUPS.find((g) => g.id === selectedGroup);
      if (grp && grp.keywords.length > 0) {
        list = list.filter((item) => {
          const itemText = `${item.name} ${item.code} ${item.description || ''}`.toLowerCase();
          return grp.keywords.some((kw) => itemText.includes(kw)) || item.category === 'PART_A';
        });
      }
    }

    // 2. Keyword Search Filtering
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [catalog, selectedGroup, catalogSearch, selectedUser]);

  if (!isOpen) return null;

  // AI Smart Matcher
  const handleAIMatchCatalog = async () => {
    setMatchingAI(true);
    setError(null);
    try {
      const res = await aiApi.matchCatalogItems({
        query: catalogSearch || formData.title || '',
        position: selectedUser?.position,
        department: selectedUser?.department_name || undefined,
        limit: 5,
      });

      setAiSuggestions(res.matches);
      setIsCatalogPickerOpen(true);
    } catch (err: any) {
      console.error('Lỗi tìm kiếm AI:', err);
    } finally {
      setMatchingAI(false);
    }
  };

  const handleSelectCatalogItem = (item: ProductCatalog) => {
    setFormData((prev) => ({
      ...prev,
      product_catalog_id: item.id,
      weight: item.coefficient || 1.0,
      title: prev.title.trim() ? prev.title : item.name,
      description: prev.description.trim() ? prev.description : (item.description || ''),
    }));
    setIsCatalogPickerOpen(false);
    setAiSuggestions([]);
  };

  const handleAISuggestDescription = async () => {
    if (!formData.title.trim() && !selectedCatalogItem) {
      setError('Vui lòng nhập Tiêu đề nhiệm vụ hoặc chọn Danh mục NĐ 335 trước.');
      return;
    }

    setGeneratingAI(true);
    setError(null);
    try {
      const res = await aiApi.suggestTaskDetails({
        title: formData.title || selectedCatalogItem?.name || '',
        department_name: selectedUser?.department_name ?? undefined,
        position: selectedUser?.position,
      });

      setFormData((prev) => ({
        ...prev,
        description: res.description,
      }));
    } catch (err: any) {
      console.error('Lỗi gợi ý AI:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề nhiệm vụ.');
      return;
    }

    if (!formData.assigned_to) {
      setError('Vui lòng chọn cán bộ thực hiện.');
      return;
    }

    if (!formData.product_catalog_id) {
      setError('Bắt buộc phải chọn Mã sản phẩm NĐ 335 (Hệ số K) để giao việc. Vui lòng bấm "Chọn từ danh mục NĐ 335" hoặc "✨ Tìm nhanh bằng AI" ở bên dưới.');
      setIsCatalogPickerOpen(true);
      return;
    }

    const qty = Number(formData.assigned_quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Số lượng giao việc phải là số dương lớn hơn 0.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: Number(formData.assigned_to),
        product_catalog_id: formData.product_catalog_id ? Number(formData.product_catalog_id) : null,
        deadline: new Date(formData.deadline).toISOString(),
        weight: Number(formData.weight) || 1.0,
        status: formData.status,
        assigned_quantity: qty,
        related_land_case_id: formData.related_land_case_id ? Number(formData.related_land_case_id) : null,
        related_project_id: formData.related_project_id ? Number(formData.related_project_id) : null,
        related_revenue_id: formData.related_revenue_id ? Number(formData.related_revenue_id) : null,
        related_expenditure_id: formData.related_expenditure_id ? Number(formData.related_expenditure_id) : null,
        related_office_request_id: formData.related_office_request_id ? Number(formData.related_office_request_id) : null,
      };

      if (isEditing && task) {
        await tasksApi.updateTask(task.id, payload);
      } else {
        await tasksApi.createTask(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-[#CFEBFC] max-h-[92vh] flex flex-col relative">
        {/* Header with Vietnix Blue styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFEBFC] bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <CheckSquare className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base tracking-wide">
                {isEditing ? 'Chỉnh Sửa Nhiệm Vụ Công Vụ' : 'Phân Công & Giao Nhiệm Vụ Mới'}
              </h3>
              <p className="text-[11px] text-[#CFEBFC]">
                Gắn mã sản phẩm chuẩn Nghị định số 335/2025/NĐ-CP & gợi ý bằng AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Row 1: Assignee and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider flex items-center space-x-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Người thực hiện (Cán bộ) <span className="text-red-500">*</span></span>
              </label>
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-medium text-[#0C3260]"
              >
                <option value="">-- Chọn cán bộ tiếp nhận --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullname} — {u.position} ({u.department_name || 'UBND xã'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Hạn hoàn thành (Deadline) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-medium text-[#0C3260]"
              />
            </div>
          </div>

          {/* SECTION 2: SMART DECREE 335 CATALOG PICKER WITH AI SEARCH */}
          <div className="bg-[#F0F7FD] p-4 rounded-2xl border border-[#CFEBFC] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase text-[#0C3260] flex items-center space-x-1.5 tracking-wider">
                <Layers className="w-4 h-4 text-[#27A4F2]" />
                <span>Danh Mục Sản Phẩm NĐ 335 (Hệ số K)</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAIMatchCatalog}
                  disabled={matchingAI}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#27A4F2] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>{matchingAI ? 'AI đang dò tìm...' : '✨ Tìm nhanh bằng AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(!isCatalogPickerOpen)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#9FD7F9] text-[#1864AB] rounded-xl text-xs font-bold transition"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{isCatalogPickerOpen ? 'Thu gọn bộ lọc' : 'Mở danh mục (Tra cứu)'}</span>
                </button>
              </div>
            </div>

            {/* Selected Catalog Badge */}
            {selectedCatalogItem ? (
              <div className="p-3 bg-white rounded-xl border border-[#9FD7F9] flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5 flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#1864AB] text-xs bg-[#CFEBFC] px-2 py-0.5 rounded-md">
                      {selectedCatalogItem.code}
                    </span>
                    <span className="font-bold text-xs text-[#0C3260]">{selectedCatalogItem.name}</span>
                  </div>
                  {selectedCatalogItem.description && (
                    <p className="text-[11px] text-slate-500 italic">
                      Sản phẩm đầu ra: {selectedCatalogItem.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-0.5">
                    <span>
                      Hệ số K: <strong className="text-[#27A4F2]">{selectedCatalogItem.coefficient}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Điểm chuẩn: <strong>{selectedCatalogItem.baseline_score}đ</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        title: selectedCatalogItem.name,
                        description: selectedCatalogItem.description || prev.description,
                      }));
                    }}
                    title="Sao chép tên và mô tả vào nhiệm vụ"
                    className="p-1.5 text-xs text-[#1864AB] hover:bg-[#CFEBFC] rounded-lg transition font-semibold flex items-center space-x-1"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Điền mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, product_catalog_id: '' })}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Bỏ chọn danh mục"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Chưa gắn mã sản phẩm NĐ 335 (Bấm <strong>"✨ Tìm nhanh bằng AI"</strong> hoặc chọn danh mục bên dưới để tự động tính điểm).
              </div>
            )}

            {/* AI Recommendation Cards (if available) */}
            {aiSuggestions.length > 0 && (
              <div className="p-3 bg-white rounded-2xl border border-yellow-200 shadow-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0C3260]">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>Gợi ý sản phẩm phù hợp nhất từ AI DeepSeek:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {aiSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCatalogItem(sug.item)}
                      className="p-2.5 rounded-xl border border-[#CFEBFC] hover:border-[#27A4F2] bg-[#F0F7FD]/40 hover:bg-[#CFEBFC]/40 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-[#1864AB] bg-white px-1.5 py-0.2 rounded border border-[#CFEBFC]">
                            {sug.item.code}
                          </span>
                          <span className="text-xs font-bold text-[#0C3260] group-hover:text-[#27A4F2] transition">
                            {sug.item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {sug.match_reason} • Hệ số K: <strong>{sug.item.coefficient}</strong>
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center space-x-1 flex-shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Chọn</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Catalog Browser */}
            {isCatalogPickerOpen && (
              <div className="p-3 bg-white rounded-2xl border border-[#CFEBFC] space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6EC2F7] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Tìm theo tên công việc, sản phẩm đầu ra hoặc mã..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CFEBFC] text-xs focus:ring-2 focus:ring-[#27A4F2] bg-[#F0F7FD]/30"
                  />
                </div>

                {/* Position Group Filter Pills */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {POSITION_GROUPS.map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setSelectedGroup(grp.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        selectedGroup === grp.id
                          ? 'bg-[#27A4F2] text-white shadow-2xs'
                          : 'bg-[#F0F7FD] text-slate-600 hover:bg-[#CFEBFC]'
                      }`}
                    >
                      {grp.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Catalog List */}
                <div className="max-h-48 overflow-y-auto divide-y divide-[#CFEBFC] border border-[#CFEBFC] rounded-xl">
                  {filteredCatalog.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    filteredCatalog.slice(0, 40).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectCatalogItem(item)}
                        className={`p-2.5 text-xs hover:bg-[#F0F7FD] cursor-pointer flex items-center justify-between transition ${
                          Number(formData.product_catalog_id) === item.id ? 'bg-[#CFEBFC]/50 font-bold' : ''
                        }`}
                      >
                        <div className="pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold text-[#1864AB] bg-[#CFEBFC]/70 px-1 rounded">
                              {item.code}
                            </span>
                            <span className="text-[#0C3260]">{item.name}</span>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-slate-400 truncate max-w-md">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#27A4F2] flex-shrink-0">
                          K={item.coefficient}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  Đang hiển thị {Math.min(40, filteredCatalog.length)} / {filteredCatalog.length} mục
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
              Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-medium text-[#0C3260]"
              placeholder="VD: Kiểm tra hiện trường và lập biên bản trật tự xây dựng thôn 3"
            />
          </div>

          {/* Row 4: Quantity, Weight and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                Số lượng giao (Định mức kỳ)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.assigned_quantity}
                onChange={(e) => setFormData({ ...formData, assigned_quantity: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-mono font-bold text-[#0C3260]"
              />
              <span className="text-[10px] text-sky-700 font-semibold block mt-0.5">
                Quy đổi: {Number(((Number(formData.assigned_quantity || 0)) * (formData.weight || 1)).toFixed(1))} SP chuẩn
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 flex items-center space-x-1 tracking-wider">
                <Scale className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Hệ số quy đổi K</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-mono font-bold text-[#0C3260]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                Trạng thái tiến độ
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white font-medium text-[#0C3260]"
              >
                <option value="PENDING">Chờ tiếp nhận (PENDING)</option>
                <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                <option value="OVERDUE">Quá hạn (OVERDUE)</option>
              </select>
            </div>
          </div>

          {/* Section: LIÊN KẾT CHÉO MÔ-ĐUN ĐIỀU HÀNH */}
          <div className="p-4 rounded-2xl border border-sky-100 bg-[#F0F7FD]/30 space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-sky-100 pb-1.5">
              <Link className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-xs text-[#0C3260] uppercase tracking-wide">
                Liên kết chéo mô-đun điều hành (Tùy chọn)
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Land Certificate Case selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Hồ sơ Đất đai (KH965)
                </label>
                <select
                  value={formData.related_land_case_id}
                  onChange={(e) => setFormData({ ...formData, related_land_case_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="">-- Chọn hồ sơ đất đai --</option>
                  {landCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.case_code}] {c.citizen_name} - {c.village}
                    </option>
                  ))}
                </select>
              </div>

              {/* Public Investment Project selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Dự án Đầu tư công
                </label>
                <select
                  value={formData.related_project_id}
                  onChange={(e) => setFormData({ ...formData, related_project_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="">-- Chọn công trình đầu tư công --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.project_code}] {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Revenue item selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Khoản thu Ngân sách
                </label>
                <select
                  value={formData.related_revenue_id}
                  onChange={(e) => setFormData({ ...formData, related_revenue_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="">-- Chọn khoản thu ngân sách --</option>
                  {revenues.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.year}] {r.source_name} ({r.planned_amount.toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Expenditure item selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Đề xuất chi Ngân sách
                </label>
                <select
                  value={formData.related_expenditure_id}
                  onChange={(e) => setFormData({ ...formData, related_expenditure_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="">-- Chọn đề xuất chi ngân sách --</option>
                  {expenditures.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      [{ex.year}] {ex.expense_name} ({ex.approved_amount.toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Office Request selection */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Yêu cầu Hậu cần Văn phòng (Lịch xe, phòng họp, công tác)
                </label>
                <select
                  value={formData.related_office_request_id}
                  onChange={(e) => setFormData({ ...formData, related_office_request_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="">-- Chọn yêu cầu hậu cần văn phòng --</option>
                  {officeRequests.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.request_type === 'vehicle' ? 'Xe' : o.request_type === 'room' ? 'Họp' : 'Khác'}] {o.title} - {o.start_time ? new Date(o.start_time).toLocaleDateString('vi-VN') : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 5: Detailed Description with DeepSeek AI Generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-[#0C3260] tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-[#27A4F2]" />
                <span>Mô tả chi tiết & Yêu cầu sản phẩm đầu ra</span>
              </label>

              <button
                type="button"
                onClick={handleAISuggestDescription}
                disabled={generatingAI}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#27A4F2] hover:text-[#1864AB] bg-[#CFEBFC]/50 hover:bg-[#CFEBFC] px-2.5 py-1 rounded-lg border border-[#9FD7F9] transition"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{generatingAI ? 'AI đang soạn thảo...' : 'AI Soạn gợi ý'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] text-xs sm:text-sm bg-white placeholder:text-slate-400"
              placeholder="Nhập nội dung chỉ đạo, quy trình các bước thực hiện và sản phẩm nghiệm thu..."
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#CFEBFC] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#27A4F2] via-[#3EAEF4] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#27A4F2]/25 transition flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang giao việc...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>{isEditing ? 'Lưu Thay Đổi' : 'Giao Nhiệm Vụ Ngay'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
