import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Layers,
  Flag,
  ShieldAlert
} from 'lucide-react';
import { Project, ProjectMilestone } from '../types';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProjectDetailModalProps {
  projectId: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  onClose,
  onRefresh
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'general' | 'bidding' | 'milestones' | 'investment' | 'settlement'
  >('general');
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Milestone State
  const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false);
  const [newMilestone, setNewMilestone] = useState<{
    milestone_name: string;
    milestone_type: string;
    planned_date: string;
    status: string;
    note: string;
  }>({
    milestone_name: '',
    milestone_type: 'other',
    planned_date: new Date().toISOString().slice(0, 10),
    status: 'pending',
    note: ''
  });

  const fetchDetail = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await projectApi.getProjectById(projectId);
      setProject(data.project);
      setMilestones(data.milestones || []);
      setEditFormData({
        ...data.project,
        expected_version: data.project.version
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải chi tiết dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId]);

  if (!projectId) return null;

  const canEdit =
    user?.role === 'LEADERSHIP' ||
    (user?.role === 'DEPARTMENT_HEAD' && user?.department_id === 3) ||
    (user?.role === 'EMPLOYEE' && user?.department_id === 3 && (project?.project_manager_id === user?.id || project?.created_by === user?.id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      await projectApi.updateProject(project.id, editFormData);
      setSuccessMsg('Cập nhật thông tin dự án thành công!');
      setIsEditing(false);
      await fetchDetail();
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi cập nhật dự án.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      await projectApi.addMilestone(project.id, newMilestone);
      setShowAddMilestone(false);
      setNewMilestone({
        milestone_name: '',
        milestone_type: 'other',
        planned_date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        note: ''
      });
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi thêm mốc tiến độ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMilestone = async (mId: number) => {
    if (!project || !window.confirm('Bạn có chắc chắn muốn xóa mốc tiến độ này?')) return;
    try {
      await projectApi.deleteMilestone(project.id, mId);
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa mốc tiến độ.');
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold">Đã hoàn thành</span>;
      case 'in_progress':
        return <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs font-semibold">Đang thực hiện</span>;
      case 'delayed':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">Chậm tiến độ</span>;
      case 'cancelled':
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">Đã hủy</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-semibold">Chờ thực hiện</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0C3260] to-[#1864AB] text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-[#9FD7F9]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-0.5 bg-white/20 text-[#CFEBFC] rounded-full uppercase tracking-wider">
                  Mã DA: {project?.project_code || '...'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-400 text-slate-900 rounded-md">
                  Nhóm {project?.investment_group || 'C'}
                </span>
                {project?.version && (
                  <span className="text-[11px] text-white/70">v{project.version}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white line-clamp-1 mt-0.5">
                {project?.project_name || 'Chi tiết dự án đầu tư công'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition border border-white/20 shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#9FD7F9]" />
                <span>Chỉnh sửa</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex space-x-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'general'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Thông tin & Pháp lý</span>
          </button>
          <button
            onClick={() => setActiveTab('bidding')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'bidding'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Đấu thầu & Hợp đồng</span>
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'milestones'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>3. Mốc tiến độ ({milestones.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('investment')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'investment'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>4. Giải ngân Đầu tư công</span>
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'settlement'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>5. Nghiệm thu & Quyết toán</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-[#1864AB] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Đang tải thông tin dự án...</p>
            </div>
          ) : !project ? (
            <div className="py-16 text-center text-slate-500">Không tìm thấy dữ liệu dự án.</div>
          ) : (
            <form onSubmit={handleSave}>
              {/* TAB 1: THÔNG TIN CHUNG & PHÁP LÝ */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#1864AB]" />
                      <span>Thông tin Nhận diện & Phân loại</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Mã công trình/dự án:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.project_code || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, project_code: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 uppercase"
                          required
                        />
                      ) : (
                        <p className="font-bold font-mono text-slate-800 text-sm">{project.project_code}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Tên công trình/dự án:</label>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editFormData.project_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, project_name: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                          required
                        />
                      ) : (
                        <p className="font-semibold text-slate-900">{project.project_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Nhóm dự án (Luật Đầu tư công):</label>
                      {isEditing ? (
                        <select
                          value={editFormData.investment_group || 'C'}
                          onChange={(e) => setEditFormData({ ...editFormData, investment_group: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                        >
                          <option value="A">Nhóm A (Quy mô trọng điểm)</option>
                          <option value="B">Nhóm B</option>
                          <option value="C">Nhóm C (Quy mô cấp xã/huyện)</option>
                          <option value="Chưa phân loại">Chưa phân loại</option>
                        </select>
                      ) : (
                        <p className="font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded inline-block">
                          Nhóm {project.investment_group}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Cán bộ phụ trách (Project Manager):</label>
                      <p className="font-semibold text-slate-800 mt-1">
                        {project.project_manager_name || 'Chưa phân công'} ({project.project_manager_position || 'Cán bộ Địa chính - Xây dựng'})
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Căn cứ Pháp lý & Phê duyệt</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Số Quyết định phê duyệt chủ trương/DA:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.approval_decision_no || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, approval_decision_no: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                        />
                      ) : (
                        <p className="font-bold text-slate-800">{project.approval_decision_no || 'Chưa cập nhật'}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 font-medium">Ngày phê duyệt:</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.approval_date ? editFormData.approval_date.slice(0, 10) : ''}
                            onChange={(e) => setEditFormData({ ...editFormData, approval_date: e.target.value })}
                            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800 mt-1">{project.approval_date ? new Date(project.approval_date).toLocaleDateString('vi-VN') : '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium">Cấp phê duyệt:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.approving_authority || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, approving_authority: e.target.value })}
                            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800 mt-1">{project.approving_authority || 'UBND xã Nghĩa Lâm'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Phê duyệt Thiết kế - Bản vẽ thi công:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.design_approval_no || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, design_approval_no: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800">{project.design_approval_no || 'Chưa cập nhật'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Đơn vị tư vấn giám sát:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.supervisor_unit || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, supervisor_unit: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800">{project.supervisor_unit || 'Ban Giám sát cộng đồng xã'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ĐẤU THẦU & HỢP ĐỒNG */}
              {activeTab === 'bidding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#1864AB]" />
                      <span>Hình thức & Kết quả Lựa chọn Nhà thầu</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Hình thức lựa chọn nhà thầu:</label>
                      {isEditing ? (
                        <select
                          value={editFormData.bidding_method || 'Chỉ định thầu'}
                          onChange={(e) => setEditFormData({ ...editFormData, bidding_method: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                        >
                          <option value="Chỉ định thầu">Chỉ định thầu</option>
                          <option value="Chỉ định thầu rút gọn">Chỉ định thầu rút gọn</option>
                          <option value="Đấu thầu rộng rãi">Đấu thầu rộng rãi qua mạng</option>
                          <option value="Chào hàng cạnh tranh">Chào hàng cạnh tranh</option>
                          <option value="Tự thực hiện">Tự thực hiện (Cộng đồng)</option>
                          <option value="Khác">Khác</option>
                        </select>
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{project.bidding_method || 'Chỉ định thầu'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Nhà thầu thi công trúng thầu:</label>
                      <p className="font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mt-1 border border-emerald-200">
                        {project.inv_contractor || 'Chưa chỉ định nhà thầu'}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày phê duyệt kết quả lựa chọn nhà thầu:</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.contractor_selection_date ? editFormData.contractor_selection_date.slice(0, 10) : ''}
                          onChange={(e) => setEditFormData({ ...editFormData, contractor_selection_date: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800 mt-1">
                          {project.contractor_selection_date ? new Date(project.contractor_selection_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-sky-700" />
                      <span>Hợp đồng Xây lắp</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Số hiệu hợp đồng kinh tế:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.contract_no || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, contract_no: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                        />
                      ) : (
                        <p className="font-bold font-mono text-slate-900 mt-1">{project.contract_no || 'Chưa ký hợp đồng'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Giá trị hợp đồng (VNĐ):</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.contract_value || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, contract_value: Number(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800"
                        />
                      ) : (
                        <p className="font-extrabold text-emerald-700 text-sm mt-1">
                          {(project.contract_value || 0).toLocaleString()} VNĐ
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 font-medium">Ngày khởi công:</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.start_date ? editFormData.start_date.slice(0, 10) : ''}
                            onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800 mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString('vi-VN') : '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium">Hạn hoàn thành dự kiến:</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editFormData.planned_end_date ? editFormData.planned_end_date.slice(0, 10) : ''}
                            onChange={(e) => setEditFormData({ ...editFormData, planned_end_date: e.target.value })}
                            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800 mt-1">{project.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString('vi-VN') : '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MỐC TIẾN ĐỘ CHI TIẾT (MILESTONES) */}
              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                        <Flag className="w-4 h-4 text-[#1864AB]" />
                        <span>Mốc tiến độ trọng yếu theo vòng đời dự án</span>
                      </h3>
                      <p className="text-xs text-slate-500">Theo dõi chi tiết các mốc từ chủ trương đến bàn giao sử dụng.</p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowAddMilestone(!showAddMilestone)}
                        className="px-3 py-1.5 bg-[#1864AB] hover:bg-[#0C3260] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm mốc mới</span>
                      </button>
                    )}
                  </div>

                  {showAddMilestone && (
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
                      <h4 className="font-bold text-slate-800">Thêm mốc tiến độ mới</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Tên mốc tiến độ:</label>
                          <input
                            type="text"
                            value={newMilestone.milestone_name}
                            onChange={(e) => setNewMilestone({ ...newMilestone, milestone_name: e.target.value })}
                            placeholder="VD: Đổ bê tông dầm sàn tầng 1"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Loại mốc:</label>
                          <select
                            value={newMilestone.milestone_type}
                            onChange={(e) => setNewMilestone({ ...newMilestone, milestone_type: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="approval">Phê duyệt</option>
                            <option value="bidding">Đấu thầu</option>
                            <option value="contract">Hợp đồng</option>
                            <option value="construction_start">Khởi công</option>
                            <option value="foundation">Phần móng</option>
                            <option value="structure">Kết cấu / Thân</option>
                            <option value="completion">Hoàn thiện</option>
                            <option value="acceptance">Nghiệm thu</option>
                            <option value="settlement">Quyết toán</option>
                            <option value="handover">Bàn giao</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Ngày kế hoạch:</label>
                          <input
                            type="date"
                            value={newMilestone.planned_date}
                            onChange={(e) => setNewMilestone({ ...newMilestone, planned_date: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddMilestone(false)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMilestoneSubmit}
                          disabled={saving}
                          className="px-4 py-1.5 bg-[#1864AB] text-white rounded-lg text-xs font-semibold hover:bg-[#0C3260]"
                        >
                          Lưu mốc
                        </button>
                      </div>
                    </div>
                  )}

                  {milestones.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      Chưa có mốc tiến độ nào được thiết lập cho dự án này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {milestones.map((m, idx) => (
                        <div
                          key={m.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-7 h-7 rounded-full bg-[#CFEBFC] text-[#1864AB] font-bold flex items-center justify-center text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{m.milestone_name}</p>
                              <div className="flex items-center space-x-3 text-slate-500 text-[11px] mt-0.5">
                                <span>Kế hoạch: <strong className="text-slate-700">{new Date(m.planned_date).toLocaleDateString('vi-VN')}</strong></span>
                                {m.actual_date && (
                                  <span>Thực tế: <strong className="text-emerald-700">{new Date(m.actual_date).toLocaleDateString('vi-VN')}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {getMilestoneStatusBadge(m.status)}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMilestone(m.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Xóa mốc"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: GIẢI NGÂN ĐẦU TƯ CÔNG (DỮ LIỆU LIÊN KẾT NGUỒN CHÍNH) */}
              {activeTab === 'investment' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-[#CFEBFC]/30 border border-[#9FD7F9] rounded-xl flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-[#1864AB] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#0C3260]">Dữ liệu Tài chính & Giải ngân Nguồn Chính</h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Dữ liệu dưới đây được đồng bộ và đọc trực tiếp từ Module Đầu tư công (<code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">/public-investment</code>). Không trùng lặp hoặc nhập lại.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium">Vốn Kế hoạch:</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-1">
                        {(project.inv_planned_capital || 0).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium">Vốn Phân bổ:</p>
                      <p className="text-sm font-extrabold text-[#1864AB] mt-1">
                        {(project.inv_allocated_capital || 0).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium">Đã Giải ngân:</p>
                      <p className="text-sm font-extrabold text-emerald-700 mt-1">
                        {(project.inv_disbursed_amount || 0).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium">% Tỷ lệ Giải ngân:</p>
                      <p className="text-sm font-black text-amber-700 mt-1">
                        {project.inv_disbursement_rate || 0}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Tiến độ thi công thực tế tại hiện trường:</span>
                      <span className="font-extrabold text-slate-900">{project.inv_actual_progress_percent || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-[#1864AB] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, project.inv_actual_progress_percent || 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 font-medium">Nguồn vốn:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{project.inv_funding_source || 'Ngân sách địa phương'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Chủ đầu tư:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{project.inv_investor_name || 'UBND xã Nghĩa Lâm'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Tình trạng vướng mắc:</p>
                      <p className="font-bold text-amber-800 mt-0.5">
                        {project.inv_obstacle_type === 'none' || !project.inv_obstacle_type ? 'Không có vướng mắc' : project.inv_obstacle_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Trạng thái thi công:</p>
                      <p className="font-bold text-sky-900 mt-0.5">{project.inv_status || 'preparing'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NGHIỆM THU & QUYẾT TOÁN */}
              {activeTab === 'settlement' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Nghiệm thu Công trình</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Trạng thái nghiệm thu:</label>
                      {isEditing ? (
                        <select
                          value={editFormData.acceptance_status || 'chua_nghiem_thu'}
                          onChange={(e) => setEditFormData({ ...editFormData, acceptance_status: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                        >
                          <option value="chua_nghiem_thu">Chưa nghiệm thu</option>
                          <option value="nghiem_thu_tung_phan">Nghiệm thu từng phần</option>
                          <option value="nghiem_thu_hoan_thanh">Nghiệm thu hoàn thành</option>
                          <option value="khong_dat">Không đạt yêu cầu</option>
                        </select>
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">
                          {project.acceptance_status === 'nghiem_thu_hoan_thanh' ? 'Đã nghiệm thu hoàn thành' : project.acceptance_status}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày lập biên bản nghiệm thu:</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.acceptance_date ? editFormData.acceptance_date.slice(0, 10) : ''}
                          onChange={(e) => setEditFormData({ ...editFormData, acceptance_date: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800 mt-1">
                          {project.acceptance_date ? new Date(project.acceptance_date).toLocaleDateString('vi-VN') : 'Chưa nghiệm thu'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày bàn giao đưa vào sử dụng:</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.handover_date ? editFormData.handover_date.slice(0, 10) : ''}
                          onChange={(e) => setEditFormData({ ...editFormData, handover_date: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800 mt-1">
                          {project.handover_date ? new Date(project.handover_date).toLocaleDateString('vi-VN') : 'Chưa bàn giao'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-[#1864AB]" />
                      <span>Quyết toán Dự án Hoàn thành</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Trạng thái quyết toán:</label>
                      {isEditing ? (
                        <select
                          value={editFormData.settlement_status || 'chua_quyet_toan'}
                          onChange={(e) => setEditFormData({ ...editFormData, settlement_status: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                        >
                          <option value="chua_quyet_toan">Chưa quyết toán</option>
                          <option value="dang_quyet_toan">Đang lập hồ sơ quyết toán</option>
                          <option value="da_quyet_toan">Đã duyệt quyết toán</option>
                          <option value="quyet_toan_xong">Quyết toán xong</option>
                        </select>
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">
                          {project.settlement_status === 'quyet_toan_xong' ? 'Đã quyết toán xong' : project.settlement_status}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Giá trị quyết toán phê duyệt (VNĐ):</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.settlement_value || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, settlement_value: Number(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-extrabold text-emerald-800"
                        />
                      ) : (
                        <p className="font-extrabold text-emerald-700 text-sm mt-1">
                          {(project.settlement_value || 0).toLocaleString()} VNĐ
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày phê duyệt quyết toán:</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editFormData.settlement_date ? editFormData.settlement_date.slice(0, 10) : ''}
                          onChange={(e) => setEditFormData({ ...editFormData, settlement_date: e.target.value })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800 mt-1">
                          {project.settlement_date ? new Date(project.settlement_date).toLocaleDateString('vi-VN') : 'Chưa quyết toán'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Action Bar */}
              {isEditing && (
                <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#1864AB] hover:bg-[#0C3260] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
