import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Link2,
  PlusCircle
} from 'lucide-react';
import { projectApi, publicInvestmentApi, usersApi } from '../services/api';
import { PublicInvestmentProject, User } from '../types';

interface CreateProjectWizardModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectWizardModal: React.FC<CreateProjectWizardModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available investment projects to link
  const [availableInvestments, setAvailableInvestments] = useState<PublicInvestmentProject[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);

  // Linking mode: 'existing' | 'new' | 'none'
  const [linkingMode, setLinkingMode] = useState<'existing' | 'new' | 'none'>('existing');

  // Form State
  const [formData, setFormData] = useState<any>({
    project_code: '',
    project_name: '',
    investment_group: 'C',
    approval_decision_no: '',
    approval_date: '',
    approving_authority: 'UBND xã Nghĩa Lâm',
    design_approval_no: '',
    bidding_method: 'Chỉ định thầu',
    contractor_selection_date: '',
    contract_no: '',
    contract_value: 0,
    start_date: '',
    planned_end_date: '',
    project_manager_id: '',
    supervisor_unit: 'Ban Giám sát cộng đồng xã',
    investment_project_id: '',
    // If creating new investment simultaneously:
    create_new_investment: false,
    investment_payload: {
      investor_name: 'UBND xã Nghĩa Lâm',
      funding_source: 'Ngân sách tỉnh/huyện',
      planned_capital: 0,
      allocated_capital: 0,
      disbursed_amount: 0,
      contractor: '',
      actual_progress_percent: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, usersRes] = await Promise.all([
          publicInvestmentApi.getProjects(),
          usersApi.getUsers()
        ]);
        setAvailableInvestments(invRes.projects || []);
        // Filter officers (Địa chính - Xây dựng or active users)
        setOfficers(usersRes.users || []);
      } catch (err) {
        console.error('Lỗi tải danh mục liên kết:', err);
      }
    };
    fetchData();
  }, []);

  const handleSelectExistingInvestment = (invId: string) => {
    const inv = availableInvestments.find((item) => item.id === Number(invId));
    if (inv) {
      setFormData({
        ...formData,
        investment_project_id: inv.id,
        project_code: inv.project_code,
        project_name: inv.project_name,
        start_date: inv.start_date ? inv.start_date.slice(0, 10) : formData.start_date,
        planned_end_date: inv.end_date ? inv.end_date.slice(0, 10) : formData.planned_end_date,
        project_manager_id: inv.responsible_user_id || formData.project_manager_id
      });
    } else {
      setFormData({ ...formData, investment_project_id: '' });
    }
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.project_code.trim()) {
        setErrorMsg('Vui lòng nhập Mã công trình / dự án.');
        return false;
      }
      if (!formData.project_name.trim()) {
        setErrorMsg('Vui lòng nhập Tên công trình / dự án.');
        return false;
      }
      if (linkingMode === 'existing' && !formData.investment_project_id) {
        setErrorMsg('Vui lòng chọn Công trình Đầu tư công để liên kết.');
        return false;
      }
    }
    if (step === 2) {
      if (formData.contract_value < 0) {
        setErrorMsg('Giá trị hợp đồng không được âm.');
        return false;
      }
      if (formData.start_date && formData.planned_end_date && new Date(formData.start_date) > new Date(formData.planned_end_date)) {
        setErrorMsg('Hạn hoàn thành dự kiến phải sau ngày khởi công.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const payload = {
        ...formData,
        create_new_investment: linkingMode === 'new',
        investment_project_id: linkingMode === 'existing' ? Number(formData.investment_project_id) : null
      };

      await projectApi.createProject(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi tạo dự án.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in duration-150">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-[#0C3260] to-[#1864AB] text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <PlusCircle className="w-5 h-5 text-[#9FD7F9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thêm mới Dự án Đầu tư công</h2>
              <p className="text-xs text-[#CFEBFC]">Thiết lập vòng đời dự án và kiểm soát liên kết giải ngân</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Thông tin & Liên kết' },
              { num: 2, title: 'Đấu thầu & Hợp đồng' },
              { num: 3, title: 'Phụ trách & Giám sát' },
              { num: 4, title: 'Xác nhận & Lưu' }
            ].map((st) => (
              <div key={st.num} className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    currentStep === st.num
                      ? 'bg-[#1864AB] text-white ring-4 ring-sky-100'
                      : currentStep > st.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > st.num ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    currentStep === st.num ? 'text-[#1864AB] font-bold' : 'text-slate-500'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: THÔNG TIN DỰ ÁN & LIÊN KẾT */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2">
                <label className="font-bold text-sky-950 flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-[#1864AB]" />
                  <span>Chọn phương thức liên kết Đầu tư công:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkingMode('existing')}
                    className={`p-3 rounded-xl border text-left transition ${
                      linkingMode === 'existing'
                        ? 'bg-white border-[#1864AB] shadow-xs text-[#1864AB] font-bold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">1. Chọn CT đã có sẵn</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Liên kết với công trình ĐTC đang có</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMode('new');
                      setFormData({ ...formData, investment_project_id: '' });
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      linkingMode === 'new'
                        ? 'bg-white border-[#1864AB] shadow-xs text-[#1864AB] font-bold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">2. Tạo mới đồng thời</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tạo cả Dự án & Công trình ĐTC</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMode('none');
                      setFormData({ ...formData, investment_project_id: '' });
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      linkingMode === 'none'
                        ? 'bg-white border-[#1864AB] shadow-xs text-[#1864AB] font-bold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold text-xs">3. Chưa liên kết</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dự án độc lập giai đoạn chuẩn bị</p>
                  </button>
                </div>
              </div>

              {linkingMode === 'existing' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="font-bold text-slate-700">Chọn công trình đầu tư công:</label>
                  <select
                    value={formData.investment_project_id || ''}
                    onChange={(e) => handleSelectExistingInvestment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    required
                  >
                    <option value="">-- Chọn công trình từ danh mục ĐTC --</option>
                    {availableInvestments.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        [{inv.project_code}] {inv.project_name} (Giải ngân: {inv.disbursement_rate}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium">Mã công trình / dự án (*):</label>
                  <input
                    type="text"
                    value={formData.project_code}
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    placeholder="VD: DA-2026-01"
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium">Nhóm dự án (Luật ĐTC):</label>
                  <select
                    value={formData.investment_group}
                    onChange={(e) => setFormData({ ...formData, investment_group: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="A">Nhóm A (Trọng điểm)</option>
                    <option value="B">Nhóm B</option>
                    <option value="C">Nhóm C (Quy mô cấp xã/huyện)</option>
                    <option value="Chưa phân loại">Chưa phân loại</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Tên công trình / dự án (*):</label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="VD: Nâng cấp, mở rộng đường giao thông nông thôn xóm 3"
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
                  required
                />
              </div>

              {linkingMode === 'new' && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-900 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Thiết lập dữ liệu Đầu tư công kèm theo</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium">Vốn Kế hoạch (VNĐ):</label>
                      <input
                        type="number"
                        value={formData.investment_payload.planned_capital}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            investment_payload: {
                              ...formData.investment_payload,
                              planned_capital: Number(e.target.value)
                            }
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium">Vốn Phân bổ (VNĐ):</label>
                      <input
                        type="number"
                        value={formData.investment_payload.allocated_capital}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            investment_payload: {
                              ...formData.investment_payload,
                              allocated_capital: Number(e.target.value)
                            }
                          })
                        }
                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ĐẤU THẦU & HỢP ĐỒNG */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium">Số Quyết định phê duyệt chủ trương / DA:</label>
                  <input
                    type="text"
                    value={formData.approval_decision_no}
                    onChange={(e) => setFormData({ ...formData, approval_decision_no: e.target.value })}
                    placeholder="VD: 125/QĐ-UBND"
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium">Ngày phê duyệt quyết định:</label>
                  <input
                    type="date"
                    value={formData.approval_date}
                    onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium">Hình thức lựa chọn nhà thầu:</label>
                  <select
                    value={formData.bidding_method}
                    onChange={(e) => setFormData({ ...formData, bidding_method: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Chỉ định thầu">Chỉ định thầu</option>
                    <option value="Chỉ định thầu rút gọn">Chỉ định thầu rút gọn</option>
                    <option value="Đấu thầu rộng rãi">Đấu thầu rộng rãi qua mạng</option>
                    <option value="Chào hàng cạnh tranh">Chào hàng cạnh tranh</option>
                    <option value="Tự thực hiện">Tự thực hiện (Cộng đồng)</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium">Số hiệu Hợp đồng kinh tế:</label>
                  <input
                    type="text"
                    value={formData.contract_no}
                    onChange={(e) => setFormData({ ...formData, contract_no: e.target.value })}
                    placeholder="VD: 08/HĐ-XL/2026"
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Giá trị hợp đồng xây lắp (VNĐ):</label>
                <input
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-extrabold text-emerald-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium">Ngày khởi công:</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium">Hạn hoàn thành dự kiến:</label>
                  <input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHỤ TRÁCH & GIÁM SÁT */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-600 font-medium">Cán bộ phụ trách dự án (Project Manager):</label>
                <select
                  value={formData.project_manager_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="">-- Phân công cán bộ phụ trách --</option>
                  {officers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullname} ({u.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Đơn vị tư vấn giám sát / Ban giám sát:</label>
                <input
                  type="text"
                  value={formData.supervisor_unit}
                  onChange={(e) => setFormData({ ...formData, supervisor_unit: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Cấp thẩm quyền phê duyệt:</label>
                <input
                  type="text"
                  value={formData.approving_authority}
                  onChange={(e) => setFormData({ ...formData, approving_authority: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* STEP 4: XÁC NHẬN & LƯU */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Kiểm tra thông tin trước khi lưu</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Mã DA:</span>{' '}
                    <strong className="font-mono text-slate-900">{formData.project_code}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Nhóm:</span>{' '}
                    <strong className="text-sky-900">Nhóm {formData.investment_group}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Tên DA:</span>{' '}
                    <strong className="text-slate-900">{formData.project_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Giá trị HĐ:</span>{' '}
                    <strong className="text-emerald-700">{(formData.contract_value || 0).toLocaleString()} đ</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Số HĐ:</span>{' '}
                    <strong className="font-mono text-slate-800">{formData.contract_no || 'Chưa ký'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Khởi công:</span>{' '}
                    <strong>{formData.start_date || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Hạn hoàn thành:</span>{' '}
                    <strong>{formData.planned_end_date || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                Hệ thống sẽ tự động khởi tạo 5 mốc tiến độ chuẩn (Phê duyệt, Đấu thầu, Khởi công, Nghiệm thu, Bàn giao) và thiết lập giao dịch an toàn.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2 bg-[#1864AB] hover:bg-[#0C3260] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Đang tạo...' : 'Xác nhận tạo dự án'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
