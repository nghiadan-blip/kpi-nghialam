import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { landCertificateApi } from '../services/api';
import { LandCertificateCase, KH965Progress } from '../types';
import { 
  Map, 
  Plus, 
  FileSpreadsheet, 
  AlertTriangle, 
  Trash2, 
  Edit,
  MapPin
} from 'lucide-react';

export const LandCertificates: React.FC = () => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'cases' | 'kh965'>('cases');
  const [cases, setCases] = useState<LandCertificateCase[]>([]);
  const [kh965List, setKH965List] = useState<KH965Progress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [villageFilter, setVillageFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showCaseModal, setShowCaseModal] = useState<boolean>(false);
  const [editCase, setEditCase] = useState<LandCertificateCase | null>(null);

  const [showKH965Modal, setShowKH965Modal] = useState<boolean>(false);
  const [, setEditKH965] = useState<KH965Progress | null>(null);

  // Form Inputs - Case
  const [caseCode, setCaseCode] = useState<string>('');
  const [citizenName, setCitizenName] = useState<string>('');
  const [village, setVillage] = useState<string>('Xóm 1');
  const [landPlotRef, setLandPlotRef] = useState<string>('');
  const [caseGroup, setCaseGroup] = useState<string>('Xanh');
  const [legalBasis, setLegalBasis] = useState<string>('other');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [caseStatus, setCaseStatus] = useState<string>('received');
  const [deadline, setDeadline] = useState<string>('');
  const [responsibleUserId, setResponsibleUserId] = useState<number>(6); // Vu Minh Tuan
  const [delayReason, setDelayReason] = useState<string>('');

  // Form Inputs - KH965
  const [khVillage, setKhVillage] = useState<string>('');
  const [totalPlots, setTotalPlots] = useState<number>(0);
  const [reviewedPlots, setReviewedPlots] = useState<number>(0);
  const [classifiedPlots, setClassifiedPlots] = useState<number>(0);
  const [eligibleCases, setEligibleCases] = useState<number>(0);
  const [needSupplement, setNeedSupplement] = useState<number>(0);
  const [complexCases, setComplexCases] = useState<number>(0);
  const [greenCount, setGreenCount] = useState<number>(0);
  const [yellowCount, setYellowCount] = useState<number>(0);
  const [redCount, setRedCount] = useState<number>(0);
  const [khNote, setKhNote] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'cases') {
        const data = await landCertificateApi.getCases(groupFilter, statusFilter, villageFilter, search);
        setCases(data.cases || []);
      } else {
        const data = await landCertificateApi.getKH965Progress();
        setKH965List(data.progress || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải dữ liệu đất đai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, groupFilter, statusFilter, villageFilter, search]);

  const openAddCaseModal = () => {
    setEditCase(null);
    setShowCaseModal(true);

    setCaseCode('');
    setCitizenName('');
    setVillage('Xóm 1');
    setLandPlotRef('');
    setCaseGroup('Xanh');
    setLegalBasis('other');
    setCurrentStep('Kiểm tra hồ sơ gốc');
    setCaseStatus('received');
    setDeadline(new Date().toISOString().slice(0, 10));
    setResponsibleUserId(6);
    setDelayReason('');
  };

  const openEditCaseModal = (item: LandCertificateCase) => {
    setEditCase(item);
    setShowCaseModal(true);

    setCaseCode(item.case_code);
    setCitizenName(item.citizen_name);
    setVillage(item.village);
    setLandPlotRef(item.land_plot_ref);
    setCaseGroup(item.case_group);
    setLegalBasis(item.legal_basis_group);
    setCurrentStep(item.current_step);
    setCaseStatus(item.status);
    setDeadline(item.deadline ? item.deadline.slice(0, 10) : '');
    setResponsibleUserId(item.responsible_user_id || 6);
    setDelayReason(item.delay_reason || '');
  };

  const openEditKH965Modal = (item: KH965Progress) => {
    setEditKH965(item);
    setShowKH965Modal(true);

    setKhVillage(item.village);
    setTotalPlots(item.total_plots);
    setReviewedPlots(item.reviewed_plots);
    setClassifiedPlots(item.classified_plots);
    setEligibleCases(item.eligible_cases);
    setNeedSupplement(item.need_supplement_cases);
    setComplexCases(item.complex_cases);
    setGreenCount(item.green_count);
    setYellowCount(item.yellow_count);
    setRedCount(item.red_count);
    setKhNote(item.note || '');
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        case_code: caseCode,
        citizen_name: citizenName,
        village,
        land_plot_ref: landPlotRef,
        case_group: caseGroup,
        legal_basis_group: legalBasis,
        current_step: currentStep,
        status: caseStatus,
        deadline: deadline || null,
        responsible_user_id: responsibleUserId,
        delay_reason: delayReason
      };

      if (editCase) {
        await landCertificateApi.updateCase(editCase.id, payload);
      } else {
        await landCertificateApi.createCase(payload);
      }
      setShowCaseModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu hồ sơ.');
    }
  };

  const handleSaveKH965 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        village: khVillage,
        total_plots: totalPlots,
        reviewed_plots: reviewedPlots,
        classified_plots: classifiedPlots,
        eligible_cases: eligibleCases,
        need_supplement_cases: needSupplement,
        complex_cases: complexCases,
        green_count: greenCount,
        yellow_count: yellowCount,
        red_count: redCount,
        responsible_user_id: 6,
        note: khNote
      };

      await landCertificateApi.updateKH965Progress(payload);
      setShowKH965Modal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật Kế hoạch 965.');
    }
  };

  const handleDeleteCase = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hồ sơ đất đai này?')) return;
    try {
      await landCertificateApi.deleteCase(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa hồ sơ.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Map className="w-6 h-6 text-sky-600" />
            <span>CẤP GCN QSDĐ & KẾ HOẠCH RÀ SOÁT 965</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Quản lý quy trình cấp giấy chứng nhận quyền sử dụng đất, phân luồng xanh - vàng - đỏ và theo dõi số liệu rà soát thửa đất theo xóm
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => landCertificateApi.exportExcel()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          {activeTab === 'cases' && hasRole(['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD']) && (
            <button
              onClick={openAddCaseModal}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng ký hồ sơ</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition ${
            activeTab === 'cases' 
              ? 'border-sky-600 text-sky-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Theo dõi Hồ sơ cấp GCN QSDĐ
        </button>
        <button
          onClick={() => setActiveTab('kh965')}
          className={`px-6 py-3 font-extrabold text-sm border-b-2 transition ${
            activeTab === 'kh965' 
              ? 'border-sky-600 text-sky-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tiến độ rà soát Kế hoạch 965 theo Xóm
        </button>
      </div>

      {/* Filters Area for Cases */}
      {activeTab === 'cases' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên công dân, mã hồ sơ, số tờ số thửa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-medium"
            />
          </div>

          <div className="w-full md:w-40">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">-- Mọi nhóm luồng --</option>
              <option value="Xanh">Luồng Xanh (Đất dễ)</option>
              <option value="Vàng">Luồng Vàng (Bổ sung)</option>
              <option value="Đỏ">Luồng Đỏ (Phức tạp)</option>
            </select>
          </div>

          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">-- Mọi trạng thái --</option>
              <option value="received">Mới tiếp nhận</option>
              <option value="checking">Đang kiểm tra</option>
              <option value="public_notice">Đang niêm yết</option>
              <option value="financial_obligation">Nghĩa vụ tài chính</option>
              <option value="submitted">Đã trình Huyện</option>
              <option value="issued">Đã cấp GCN</option>
              <option value="delayed">Đang bị trễ hạn</option>
            </select>
          </div>

          <div className="w-full md:w-40">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
            >
              <option value="">-- Mọi Xóm --</option>
              <option value="Xóm 1">Xóm 1</option>
              <option value="Xóm 2">Xóm 2</option>
              <option value="Xóm 3">Xóm 3</option>
              <option value="Xóm 4">Xóm 4</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Grid Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Đang tải dữ liệu đất đai...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-sm">{error}</div>
        ) : activeTab === 'cases' ? (
          <div className="overflow-x-auto">
            {/* Cases Table */}
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Mã hồ sơ</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Chủ đất / Công dân</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Địa chỉ tờ/thửa</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Nhóm luồng</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Cơ sở pháp lý</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Bước quy trình hiện tại</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hạn xử lý</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Cán bộ thụ lý</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-xs">Không tìm thấy hồ sơ cấp giấy nào.</td>
                  </tr>
                ) : (
                  cases.map((c) => {
                    const isOverdue = c.status !== 'issued' && c.deadline && new Date(c.deadline) < new Date();
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 text-xs">
                        <td className="px-4 py-3 font-mono font-bold text-[#1864AB] uppercase">{c.case_code}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{c.citizen_name}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">{c.land_plot_ref}</div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>Địa bàn: {c.village}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            c.case_group === 'Xanh' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            c.case_group === 'Vàng' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            Luồng {c.case_group}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {c.legal_basis_group === 'article_137' ? 'Điều 137 Luật Đất đai' :
                           c.legal_basis_group === 'article_138' ? 'Điều 138 Luật Đất đai' :
                           c.legal_basis_group === 'article_139' ? 'Điều 139 Luật Đất đai' :
                           c.legal_basis_group === 'article_140' ? 'Điều 140 Luật Đất đai' : 'Chưa rõ nguồn gốc'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {c.current_step}
                          {c.delay_reason && (
                            <div className="text-[10px] text-rose-500 font-bold mt-1 flex items-start space-x-0.5 max-w-[200px]">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate" title={c.delay_reason}>{c.delay_reason}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'issued' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'delayed' || isOverdue ? 'bg-rose-100 text-rose-800' :
                            c.status === 'public_notice' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {c.status === 'issued' ? 'Đã ra sổ' : 
                             c.status === 'delayed' || isOverdue ? 'Chậm giải quyết' :
                             c.status === 'public_notice' ? 'Niêm yết công khai' : 'Đang rà soát'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                          {c.deadline ? new Date(c.deadline).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.responsible_user_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-center flex justify-center space-x-1">
                          <button
                            onClick={() => openEditCaseModal(c)}
                            className="text-sky-600 hover:text-sky-800 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {hasRole(['ADMIN', 'LEADERSHIP']) && (
                            <button
                              onClick={() => handleDeleteCase(c.id)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            {/* KH965 Progress Table */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Tiến độ rà soát phân loại thửa đất nông thôn theo Kế hoạch 965</h4>
              <span className="text-[11px] text-[#1864AB] font-bold">Cập nhật định kỳ giao ban tuần</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Tên xóm</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Tổng số thửa</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Đã rà soát</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Đã phân loại</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Đất dễ (đủ đk)</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Cần bổ sung</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Đất khó (tranh chấp)</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Thửa Xanh</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Thửa Vàng</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Thửa Đỏ</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Phụ trách xóm</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {kh965List.map((k, idx) => {
                    const progressPercent = k.total_plots > 0 ? ((k.reviewed_plots / k.total_plots) * 100).toFixed(1) : '0';
                    return (
                      <tr key={k.id} className="hover:bg-slate-50 text-xs">
                        <td className="px-4 py-3 font-semibold text-slate-500 text-center">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{k.village}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{k.total_plots}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-bold text-slate-800">{k.reviewed_plots}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Đạt {progressPercent}%</div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{k.classified_plots}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{k.eligible_cases}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-600">{k.need_supplement_cases}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600">{k.complex_cases}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/30">{k.green_count}</td>
                        <td className="px-4 py-3 text-center text-amber-700 font-bold bg-amber-50/30">{k.yellow_count}</td>
                        <td className="px-4 py-3 text-center text-rose-700 font-bold bg-rose-50/30">{k.red_count}</td>
                        <td className="px-4 py-3 text-slate-600">{k.responsible_user_name || 'Vũ Minh Tuấn'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openEditKH965Modal(k)}
                            className="text-sky-600 hover:text-sky-800 p-1 flex items-center justify-center mx-auto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#1864AB] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                {editCase ? 'CẬP NHẬT TIẾN ĐỘ HỒ SƠ CẤP GCN' : 'ĐĂNG KÝ MỚI HỒ SƠ ĐẤT ĐAI'}
              </h3>
              <button onClick={() => setShowCaseModal(false)} className="text-white hover:text-slate-200 text-xs font-bold">Đóng</button>
            </div>

            <form onSubmit={handleSaveCase} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Mã hồ sơ hành chính</label>
                  <input
                    type="text"
                    value={caseCode}
                    onChange={(e) => setCaseCode(e.target.value)}
                    required
                    placeholder="HS-2026-XXX"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tên chủ đất / Công dân đề xuất</label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    required
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Xóm địa bàn xảy ra thửa đất</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="Xóm 1">Xóm 1</option>
                    <option value="Xóm 2">Xóm 2</option>
                    <option value="Xóm 3">Xóm 3</option>
                    <option value="Xóm 4">Xóm 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Số tờ / Số thửa cụ thể</label>
                  <input
                    type="text"
                    value={landPlotRef}
                    onChange={(e) => setLandPlotRef(e.target.value)}
                    required
                    placeholder="Ví dụ: Thửa số 112, Tờ bản đồ số 09"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phân luồng hồ sơ (Độ khó)</label>
                  <select
                    value={caseGroup}
                    onChange={(e) => setCaseGroup(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-sky-800"
                  >
                    <option value="Xanh">Luồng Xanh (Đất dễ - Đủ điều kiện)</option>
                    <option value="Vàng">Luồng Vàng (Cần bổ sung thêm hồ sơ)</option>
                    <option value="Đỏ">Luồng Đỏ (Phức tạp - Có tranh chấp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Cơ sở pháp lý theo Luật Đất đai</label>
                  <select
                    value={legalBasis}
                    onChange={(e) => setLegalBasis(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="article_137">Điều 137 (Có giấy tờ trước 2024)</option>
                    <option value="article_138">Điều 138 (Không có giấy tờ)</option>
                    <option value="article_139">Điều 139 (Đất lấn chiếm, vi phạm)</option>
                    <option value="article_140">Điều 140 (Đất được giao sai thẩm quyền)</option>
                    <option value="other">Trường hợp quy định khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Bước quy trình hiện tại</label>
                  <input
                    type="text"
                    value={currentStep}
                    onChange={(e) => setCurrentStep(e.target.value)}
                    required
                    placeholder="Ví dụ: Đo đạc thực địa / Công khai ý kiến"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Trạng thái hồ sơ</label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-sky-700"
                  >
                    <option value="received">Mới tiếp nhận hồ sơ</option>
                    <option value="checking">Đang đối soát hiện trạng</option>
                    <option value="public_notice">Đang niêm yết công khai (15 ngày)</option>
                    <option value="financial_obligation">Đang nộp nghĩa vụ tài chính</option>
                    <option value="submitted">Đã nộp trình UBND Huyện</option>
                    <option value="issued">Đã cấp GCN QSDĐ chính thức</option>
                    <option value="delayed">Đang bị trễ hạn / giải quyết chậm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Hạn giải quyết hồ sơ</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Cán bộ thụ lý chính</label>
                  <select
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value={6}>Vũ Minh Tuấn (Địa chính viên)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Lý do chậm trễ giải quyết (Nếu có)</label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="Ghi rõ lý do tại sao trễ hạn hoặc tạm ngưng quy trình..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-rose-600"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#1864AB] hover:bg-[#0c3260] text-white px-5 py-2 rounded-xl font-bold"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KH965 Modal */}
      {showKH965Modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#1864AB] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                CẬP NHẬT SỐ LIỆU RÀ SOÁT KẾ HOẠCH 965 — {khVillage}
              </h3>
              <button onClick={() => setShowKH965Modal(false)} className="text-white hover:text-slate-200 text-xs font-bold">Đóng</button>
            </div>

            <form onSubmit={handleSaveKH965} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tổng số thửa đất (xóm)</label>
                  <input
                    type="number"
                    value={totalPlots}
                    onChange={(e) => setTotalPlots(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Đã rà soát thực tế</label>
                  <input
                    type="number"
                    value={reviewedPlots}
                    onChange={(e) => setReviewedPlots(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Đã phân loại pháp lý</label>
                  <input
                    type="number"
                    value={classifiedPlots}
                    onChange={(e) => setClassifiedPlots(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-3 border-slate-100">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Đủ đk cấp sổ (Đất dễ)</label>
                  <input
                    type="number"
                    value={eligibleCases}
                    onChange={(e) => setEligibleCases(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Cần bổ sung hồ sơ</label>
                  <input
                    type="number"
                    value={needSupplement}
                    onChange={(e) => setNeedSupplement(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Đất khó (Tranh chấp)</label>
                  <input
                    type="number"
                    value={complexCases}
                    onChange={(e) => setComplexCases(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-3 border-slate-100">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Hồ sơ luồng Xanh</label>
                  <input
                    type="number"
                    value={greenCount}
                    onChange={(e) => setGreenCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-700 bg-emerald-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Hồ sơ luồng Vàng</label>
                  <input
                    type="number"
                    value={yellowCount}
                    onChange={(e) => setYellowCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-amber-700 bg-amber-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Hồ sơ luồng Đỏ</label>
                  <input
                    type="number"
                    value={redCount}
                    onChange={(e) => setRedCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-rose-700 bg-rose-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Ghi chú tình hình rà soát xóm</label>
                <textarea
                  value={khNote}
                  onChange={(e) => setKhNote(e.target.value)}
                  placeholder="Ghi chú thêm về các vụ việc tranh chấp phức tạp hoặc khó giải quyết..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowKH965Modal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#1864AB] hover:bg-[#0c3260] text-white px-5 py-2 rounded-xl font-bold"
                >
                  Lưu số liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandCertificates;
