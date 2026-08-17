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
  ShieldAlert,
  FolderOpen,
  History,
  CheckSquare,
  Lock,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Project, ProjectWorkflowStep, ProjectDocument } from '../types';
import { projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DOCUMENT_TYPES = [
  { value: 'resolution', label: 'Nghị quyết HĐND xã' },
  { value: 'appraisal_decision', label: 'QĐ thành lập Hội đồng thẩm định' },
  { value: 'appraisal_report', label: 'Báo cáo thẩm định chủ trương/BCKTKT' },
  { value: 'investment_policy_decision', label: 'Quyết định chủ trương đầu tư' },
  { value: 'survey_task_decision', label: 'Phê duyệt nhiệm vụ khảo sát (NĐ 175/2024)' },
  { value: 'survey_method_decision', label: 'Phê duyệt phương án kỹ thuật khảo sát (NĐ 175/2024)' },
  { value: 'economic_tech_report', label: 'Báo cáo kinh tế - kỹ thuật (Thuyết minh, TK-DT)' },
  { value: 'project_approval_decision', label: 'Quyết định phê duyệt dự án / BCKTKT' },
  { value: 'procurement_plan_decision', label: 'Quyết định phê duyệt KHLCNT' },
  { value: 'bidding_result_decision', label: 'Quyết định phê duyệt kết quả LCNT' },
  { value: 'contract', label: 'Hợp đồng kinh tế xây lắp / tư vấn' },
  { value: 'supervision_diary', label: 'Nhật ký thi công & giám sát' },
  { value: 'acceptance_minutes', label: 'Biên bản nghiệm thu (giai đoạn/hoàn thành)' },
  { value: 'as_built_drawing', label: 'Bản vẽ hoàn công' },
  { value: 'handover_minutes', label: 'Biên bản bàn giao đưa vào sử dụng' },
  { value: 'settlement_report', label: 'Báo cáo quyết toán A-B' },
  { value: 'settlement_form_01_tt73', label: 'Báo cáo quyết toán vốn ĐTC (Mẫu 01/QTDA - TT 73/2026/TT-BTC)' },
  { value: 'settlement_form_02_tt73', label: 'Bảng tổng hợp chi phí quyết toán (Mẫu 02/QTDA - TT 73/2026/TT-BTC)' },
  { value: 'settlement_decision', label: 'Quyết định phê duyệt quyết toán (NĐ 193/2026/NĐ-CP)' },
  { value: 'warranty_letter', label: 'Cam kết/chứng thư bảo hành (Điều 28 NĐ 06/2021)' },
  { value: 'other', label: 'Tài liệu minh chứng khác' }
];

const SIGNING_CHECKLIST_TEMPLATE = [
  { id: 'CHK_01', question: 'Công trình đã có trong Nghị quyết phê duyệt kế hoạch ĐTC của HĐND xã chưa?', category: 'LEGAL' },
  { id: 'CHK_02', question: 'Văn bản thuộc thẩm quyền tập thể hay cá nhân; thể thức ký đúng quy định chưa?', category: 'AUTHORITY' },
  { id: 'CHK_03', question: 'Chủ trương đầu tư đã có biên bản họp hoặc phiếu lấy ý kiến tập thể UBND xã chưa?', category: 'COLLECTIVE_INPUT' },
  { id: 'CHK_04', question: 'Căn cứ pháp lý đã bao gồm Luật Đầu tư công, Luật Xây dựng và văn bản sửa đổi còn hiệu lực chưa?', category: 'LEGAL' },
  { id: 'CHK_05', question: 'Nguồn vốn đã được tách rõ ràng từng nguồn (NS tỉnh/huyện/xã) và số tiền tương ứng chưa?', category: 'FINANCIAL' },
  { id: 'CHK_06', question: 'Dự toán, hợp đồng hoặc giá trị quyết toán có bị vượt tổng mức đầu tư được duyệt không?', category: 'FINANCIAL' },
  { id: 'CHK_07', question: 'Các bước quy trình trước đó đã được nghiệm thu hoàn tất với ngày tháng hợp lý chưa?', category: 'PROCESS' },
  { id: 'CHK_08', question: 'Hồ sơ tài liệu gửi kèm theo đã đầy đủ theo danh mục hồ sơ bắt buộc chưa?', category: 'DOCUMENTATION' }
];

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
    'general' | 'workflow' | 'obstacles' | 'disbursements' | 'documents' | 'bidding' | 'investment' | 'settlement' | 'audit'
  >('general');

  const [project, setProject] = useState<Project | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<ProjectWorkflowStep[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [obstacles, setObstacles] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settlementFramework, setSettlementFramework] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active step in workflow tab
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);
  const [stepChecklist, setStepChecklist] = useState<Record<string, string>>({});
  const [stepNotes, setStepNotes] = useState<string>('');
  const [stepDecisionNo, setStepDecisionNo] = useState<string>('');

  // Obstacle Form State
  const [showAddObstacle, setShowAddObstacle] = useState<boolean>(false);
  const [newObstacle, setNewObstacle] = useState<{
    obstacle_type: string;
    title: string;
    content: string;
    root_cause: string;
    resolution_measure: string;
    deadline: string;
    status: string;
  }>({
    obstacle_type: 'FUNDING',
    title: '',
    content: '',
    root_cause: '',
    resolution_measure: '',
    deadline: '',
    status: 'OPEN'
  });

  // Disbursement Form State
  const [showAddDisb, setShowAddDisb] = useState<boolean>(false);
  const [newDisb, setNewDisb] = useState<{
    voucher_no: string;
    payment_date: string;
    amount: number;
    funding_source: string;
    payment_type: string;
    completed_volume_amount: number;
    justification_note: string;
  }>({
    voucher_no: '',
    payment_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    funding_source: 'Ngân sách xã',
    payment_type: 'VOLUME_PAYMENT',
    completed_volume_amount: 0,
    justification_note: ''
  });

  // New Document State
  const [showAddDoc, setShowAddDoc] = useState<boolean>(false);
  const [newDoc, setNewDoc] = useState<{
    document_name: string;
    document_type: string;
    document_code: string;
    issuing_authority: string;
    issuing_date: string;
    file_url: string;
    workflow_step_id?: number | null;
  }>({
    document_name: '',
    document_type: 'resolution',
    document_code: '',
    issuing_authority: 'UBND xã Nghĩa Lâm',
    issuing_date: new Date().toISOString().slice(0, 10),
    file_url: ''
  });

  const fetchDetail = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [data, obsRes, disbRes, auditRes] = await Promise.all([
        projectApi.getProjectById(projectId),
        projectApi.getObstacles(projectId).catch(() => ({ obstacles: [] })),
        projectApi.getDisbursements(projectId).catch(() => ({ disbursements: [] })),
        projectApi.getProjectAuditLog(projectId).catch(() => ({ logs: [] }))
      ]);
      setProject(data.project);
      setWorkflowSteps(data.workflow_steps || []);
      setDocuments(data.documents || []);
      setObstacles(obsRes.obstacles || []);
      setDisbursements(disbRes.disbursements || []);
      setAuditLogs(auditRes.logs || []);
      setSettlementFramework(data.applicable_settlement_framework || null);
      setEditFormData({
        ...data.project,
        expected_version: data.project.version
      });

      // Load active step data
      const currentStep = (data.workflow_steps || []).find((s) => s.step_number === selectedStepNumber);
      if (currentStep) {
        setStepNotes(currentStep.notes || '');
        setStepDecisionNo(currentStep.decision_number || '');
        try {
          if (currentStep.checklist_data) {
            const parsed = typeof currentStep.checklist_data === 'string' ? JSON.parse(currentStep.checklist_data) : currentStep.checklist_data;
            if (Array.isArray(parsed)) {
              const map: Record<string, string> = {};
              parsed.forEach((item: any) => { map[item.id] = item.status || 'Đạt'; });
              setStepChecklist(map);
            }
          }
        } catch {
          setStepChecklist({});
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải chi tiết dự án:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải chi tiết hồ sơ dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId, selectedStepNumber]);

  if (!projectId) return null;

  const canEdit =
    user?.role === 'LEADERSHIP' ||
    (user?.role === 'DEPARTMENT_HEAD' && user?.department_id === 3) ||
    (user?.role === 'EMPLOYEE' && user?.department_id === 3 && (project?.project_manager_id === user?.id || project?.created_by === user?.id));

  const canApproveStep = user?.role === 'LEADERSHIP' || (user?.role === 'DEPARTMENT_HEAD' && user?.department_id === 3);

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

  const handleApproveCurrentStep = async () => {
    if (!project || !canApproveStep) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      await projectApi.approveWorkflowStep(project.id, selectedStepNumber, {
        decision_number: stepDecisionNo,
        notes: stepNotes
      });
      setSuccessMsg(`Đã phê duyệt hoàn thành Bước ${selectedStepNumber}!`);
      await fetchDetail();
      onRefresh();
      if (selectedStepNumber < 16) {
        setSelectedStepNumber(selectedStepNumber + 1);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi phê duyệt bước quy trình.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      await projectApi.addProjectDocument(project.id, newDoc);
      setShowAddDoc(false);
      setNewDoc({
        document_name: '',
        document_type: 'resolution',
        document_code: '',
        issuing_authority: 'UBND xã Nghĩa Lâm',
        issuing_date: new Date().toISOString().slice(0, 10),
        file_url: ''
      });
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi thêm hồ sơ tài liệu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!project || !window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await projectApi.deleteProjectDocument(project.id, docId);
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa tài liệu.');
    }
  };

  const handleCreateObstacleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      await projectApi.createObstacle(project.id, newObstacle);
      setShowAddObstacle(false);
      setNewObstacle({
        obstacle_type: 'FUNDING',
        title: '',
        content: '',
        root_cause: '',
        resolution_measure: '',
        deadline: '',
        status: 'OPEN'
      });
      await fetchDetail();
      setSuccessMsg('Ghi nhận vướng mắc thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi ghi nhận vướng mắc.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateObstacleStatus = async (obstacleId: number, status: string) => {
    if (!project) return;
    try {
      await projectApi.updateObstacle(project.id, obstacleId, { status });
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái vướng mắc.');
    }
  };

  const handleDeleteObstacle = async (obstacleId: number) => {
    if (!project || !window.confirm('Bạn có chắc chắn muốn xóa vướng mắc này?')) return;
    try {
      await projectApi.deleteObstacle(project.id, obstacleId);
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa vướng mắc.');
    }
  };

  const handleCreateDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      await projectApi.createDisbursement(project.id, newDisb);
      setShowAddDisb(false);
      setNewDisb({
        voucher_no: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: 0,
        funding_source: 'Ngân sách xã',
        payment_type: 'VOLUME_PAYMENT',
        completed_volume_amount: 0,
        justification_note: ''
      });
      await fetchDetail();
      setSuccessMsg('Ghi nhận đợt thanh toán thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi ghi nhận đợt thanh toán.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDisbursement = async (disbursementId: number) => {
    if (!project || !window.confirm('Bạn có chắc chắn muốn xóa đợt thanh toán này?')) return;
    try {
      await projectApi.deleteDisbursement(project.id, disbursementId);
      await fetchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi xóa đợt thanh toán.');
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>Đã duyệt HT</span></span>;
      case 'IN_PROGRESS':
        return <span className="bg-sky-100 text-[#1864AB] px-2 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1"><TrendingUp className="w-3 h-3" /><span>Đang xử lý</span></span>;
      case 'BLOCKED':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1"><Lock className="w-3 h-3" /><span>Bị khóa</span></span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">Chưa bắt đầu</span>;
    }
  };

  const selectedStep = workflowSteps.find((s) => s.step_number === selectedStepNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] border border-slate-200 animate-in fade-in duration-200">
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
                <span className="text-xs font-bold px-2 py-0.5 bg-sky-900 text-sky-200 rounded-md">
                  {project?.lifecycle_status || 'PREPARATION'}
                </span>
                {project?.version && (
                  <span className="text-[11px] text-white/70">v{project.version}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white line-clamp-1 mt-0.5">
                {project?.project_name || 'Hồ sơ điện tử dự án đầu tư công'}
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
            <span>1. Tổng quan & Pháp lý</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'workflow'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>2. Quy trình 16 bước kiểm soát</span>
          </button>
          <button
            onClick={() => setActiveTab('obstacles')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'obstacles'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>3. Vướng mắc ({obstacles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('disbursements')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'disbursements'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>4. Đợt thanh toán ({disbursements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'documents'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-sky-600" />
            <span>5. Hồ sơ ({documents.length})</span>
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
            <span>6. Đấu thầu & HĐ</span>
          </button>
          <button
            onClick={() => setActiveTab('investment')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'investment'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>7. Vốn ĐTC</span>
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
            <span>8. Quyết toán & BH</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'audit'
                ? 'border-[#1864AB] text-[#1864AB] font-bold bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>9. Audit ({auditLogs.length})</span>
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
              <p className="text-xs font-medium">Đang tải hồ sơ dự án...</p>
            </div>
          ) : !project ? (
            <div className="py-16 text-center text-slate-500">Không tìm thấy dữ liệu dự án.</div>
          ) : (
            <form onSubmit={handleSave}>
              {/* TAB 1: TỔNG QUAN & PHÁP LÝ */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#1864AB]" />
                      <span>Thông tin Nhận diện & Mục tiêu</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Mã công trình/dự án:</label>
                      <p className="font-bold font-mono text-slate-800 text-sm">{project.project_code}</p>
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 font-medium">Nhóm dự án:</label>
                        <p className="font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded inline-block mt-0.5">
                          Nhóm {project.investment_group}
                        </p>
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium">Loại công trình:</label>
                        <p className="font-semibold text-slate-800 mt-0.5">{project.project_type || 'Xây dựng dân dụng'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Địa điểm xây dựng:</label>
                      <p className="font-semibold text-slate-800 mt-0.5">{project.location || 'Xã Nghĩa Lâm, Nghĩa Đàn'}</p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Cán bộ phụ trách (Project Manager):</label>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {project.project_manager_name || 'Chưa phân công'} ({project.project_manager_position || 'Cán bộ Địa chính - Xây dựng'})
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Căn cứ Pháp lý & Cấp Thẩm quyền</span>
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
                        <p className="font-semibold text-slate-800 mt-1">{project.approval_date ? new Date(project.approval_date).toLocaleDateString('vi-VN') : '-'}</p>
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium">Cấp phê duyệt:</label>
                        <p className="font-semibold text-slate-800 mt-1">{project.approving_authority || 'UBND xã Nghĩa Lâm'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Chủ đầu tư & Ban QLDA:</label>
                      <p className="font-semibold text-slate-800 mt-0.5">{project.investor_name || 'UBND xã Nghĩa Lâm'} • {project.management_unit || 'BQLDA xã'}</p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Đơn vị tư vấn giám sát / Ban GS cộng đồng:</label>
                      <p className="font-semibold text-slate-800 mt-0.5">{project.supervisor_unit || 'Ban Giám sát đầu tư của cộng đồng xã'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUY TRÌNH 16 BƯỚC KIỂM SOÁT (WORKFLOW GATES & CHECKLIST) */}
              {activeTab === 'workflow' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Left Column: 16 Steps List */}
                  <div className="md:col-span-5 space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                    {workflowSteps.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setSelectedStepNumber(step.step_number)}
                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          selectedStepNumber === step.step_number
                            ? 'bg-[#CFEBFC]/50 border-[#1864AB] shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                              step.status === 'COMPLETED'
                                ? 'bg-emerald-600 text-white'
                                : step.status === 'IN_PROGRESS'
                                ? 'bg-[#1864AB] text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {step.step_number}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{step.step_name}</p>
                            <p className="text-[10px] text-slate-500">{step.authority_body} • {step.signatory_title}</p>
                          </div>
                        </div>
                        <div>{getStepStatusBadge(step.status)}</div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Step Detail, Checklist & Actions */}
                  <div className="md:col-span-7 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                    {selectedStep ? (
                      <>
                        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#CFEBFC] text-[#1864AB] rounded-full uppercase">
                              Bước {selectedStep.step_number}/16 • {selectedStep.step_code}
                            </span>
                            <h3 className="font-bold text-slate-800 text-sm mt-1">{selectedStep.step_name}</h3>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              Thẩm quyền ký: <strong className="text-slate-800">{selectedStep.signatory_title}</strong> ({selectedStep.authority_body})
                            </p>
                          </div>
                          {getStepStatusBadge(selectedStep.status)}
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                          <p className="font-bold flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Điều kiện khóa bước (Gate Rule):</span>
                          </p>
                          <p>{selectedStep.notes || 'Chỉ được phê duyệt hoàn thành khi có đủ tài liệu minh chứng hợp pháp.'}</p>
                        </div>

                        {/* Checklist Section */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-700" />
                            <span>Checklist kiểm soát trước khi Chủ tịch ký:</span>
                          </h4>
                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                            {SIGNING_CHECKLIST_TEMPLATE.map((chk) => (
                              <div key={chk.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                                <span className="text-slate-700 flex-1 pr-2">{chk.question}</span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold shrink-0">
                                  {stepChecklist[chk.id] || 'Đạt'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form Action for Step */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="text-slate-600 font-medium">Số văn bản / QĐ căn cứ:</label>
                            <input
                              type="text"
                              value={stepDecisionNo}
                              onChange={(e) => setStepDecisionNo(e.target.value)}
                              placeholder="VD: 88/QĐ-UBND"
                              className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-600 font-medium">Ý kiến thẩm định / Phê duyệt:</label>
                            <input
                              type="text"
                              value={stepNotes}
                              onChange={(e) => setStepNotes(e.target.value)}
                              placeholder="Ghi chú thẩm tra..."
                              className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {canApproveStep && selectedStep.status !== 'COMPLETED' && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleApproveCurrentStep}
                              disabled={saving}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{saving ? 'Đang duyệt...' : `Phê duyệt hoàn thành Bước ${selectedStep.step_number}`}</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-12 text-center text-slate-500">Chọn một bước bên trái để xem chi tiết.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DANH MỤC VƯỚNG MẮC & BIỆN PHÁP XỬ LÝ */}
              {activeTab === 'obstacles' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Danh mục Vướng mắc & Kế hoạch Khắc phục</span>
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Ghi nhận khó khăn (Mặt bằng, Pháp lý, Thời tiết, Nhà thầu, Vốn, Thiết kế), người phụ trách và hạn xử lý.
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowAddObstacle(!showAddObstacle)}
                        className="px-3 py-1.5 bg-[#1864AB] hover:bg-[#0C3260] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ghi nhận vướng mắc</span>
                      </button>
                    )}
                  </div>

                  {showAddObstacle && (
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <h4 className="font-bold text-slate-800">Ghi nhận khó khăn / vướng mắc mới</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Nhóm vướng mắc:</label>
                          <select
                            value={newObstacle.obstacle_type}
                            onChange={(e) => setNewObstacle({ ...newObstacle, obstacle_type: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="LAND_CLEARANCE">Giải phóng mặt bằng</option>
                            <option value="LEGAL_PROCEDURE">Thủ tục pháp lý</option>
                            <option value="WEATHER">Thời tiết / Thiên tai</option>
                            <option value="CONTRACTOR">Tiến độ nhà thầu</option>
                            <option value="FUNDING">Nguồn vốn đối ứng</option>
                            <option value="DESIGN">Thiết kế / Thay đổi quy mô</option>
                            <option value="OTHER">Vướng mắc khác</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-slate-600 font-medium">Tiêu đề vướng mắc:</label>
                          <input
                            type="text"
                            value={newObstacle.title}
                            onChange={(e) => setNewObstacle({ ...newObstacle, title: e.target.value })}
                            placeholder="VD: Chưa thỏa thuận được phương án đền bù 2 hộ dân xóm 3"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Nguyên nhân cốt lõi:</label>
                          <textarea
                            rows={2}
                            value={newObstacle.root_cause}
                            onChange={(e) => setNewObstacle({ ...newObstacle, root_cause: e.target.value })}
                            placeholder="Nguyên nhân phát sinh vướng mắc..."
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Biện pháp xử lý / Tháo gỡ:</label>
                          <textarea
                            rows={2}
                            value={newObstacle.resolution_measure}
                            onChange={(e) => setNewObstacle({ ...newObstacle, resolution_measure: e.target.value })}
                            placeholder="Đề xuất giải pháp và cơ quan phối hợp..."
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Hạn hoàn thành xử lý:</label>
                          <input
                            type="date"
                            value={newObstacle.deadline}
                            onChange={(e) => setNewObstacle({ ...newObstacle, deadline: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Trạng thái ban đầu:</label>
                          <select
                            value={newObstacle.status}
                            onChange={(e) => setNewObstacle({ ...newObstacle, status: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="OPEN">Mới ghi nhận (OPEN)</option>
                            <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddObstacle(false)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateObstacleSubmit}
                          disabled={saving}
                          className="px-4 py-1.5 bg-[#1864AB] text-white rounded-lg text-xs font-semibold hover:bg-[#0C3260]"
                        >
                          Lưu vướng mắc
                        </button>
                      </div>
                    </div>
                  )}

                  {obstacles.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      Không có vướng mắc nào đang ghi nhận cho công trình này. Tiến độ bình thường.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {obstacles.map((ob) => (
                        <div
                          key={ob.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition text-xs shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">
                                  {ob.obstacle_type}
                                </span>
                                <h4 className="font-bold text-slate-800">{ob.title}</h4>
                              </div>
                              <p className="text-slate-600 text-[11px] mt-1">
                                <strong>Nguyên nhân:</strong> {ob.root_cause || 'Chưa nêu'} | <strong>Giải pháp:</strong> {ob.resolution_measure || 'Chưa nêu'}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {ob.status === 'RESOLVED' ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold">
                                  Đã tháo gỡ
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[11px] font-bold">
                                  {ob.status === 'IN_PROGRESS' ? 'Đang tháo gỡ' : 'Chưa tháo gỡ'}
                                </span>
                              )}

                              {canEdit && (
                                <>
                                  {ob.status !== 'RESOLVED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateObstacleStatus(ob.id, 'RESOLVED')}
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-200"
                                    >
                                      Xác nhận đã giải quyết
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteObstacle(ob.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    title="Xóa vướng mắc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>Phụ trách: <strong>{ob.responsible_user_name || 'Cán bộ phụ trách'}</strong></span>
                            <span>Hạn tháo gỡ: <strong>{ob.deadline ? new Date(ob.deadline).toLocaleDateString('vi-VN') : 'Không có hạn'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: QUẢN LÝ CÁC ĐỢT THANH TOÁN & GIẢI NGÂN CHI TIẾT */}
              {activeTab === 'disbursements' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Các Đợt Tạm Ứng & Thanh Toán Khối Lượng Hoàn Thành (KBNN)</span>
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Chi tiết từng giấy rút dự toán / ủy nhiệm chi, ngày thanh toán, giá trị nghiệm thu tương ứng.
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowAddDisb(!showAddDisb)}
                        className="px-3 py-1.5 bg-[#1864AB] hover:bg-[#0C3260] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ghi nhận đợt thanh toán</span>
                      </button>
                    )}
                  </div>

                  {showAddDisb && (
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <h4 className="font-bold text-slate-800">Ghi nhận đợt thanh toán / tạm ứng mới</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Số chứng từ / Ủy nhiệm chi:</label>
                          <input
                            type="text"
                            value={newDisb.voucher_no}
                            onChange={(e) => setNewDisb({ ...newDisb, voucher_no: e.target.value })}
                            placeholder="VD: UNC-2026/05"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Ngày thanh toán KBNN:</label>
                          <input
                            type="date"
                            value={newDisb.payment_date}
                            onChange={(e) => setNewDisb({ ...newDisb, payment_date: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Loại hình thanh toán:</label>
                          <select
                            value={newDisb.payment_type}
                            onChange={(e) => setNewDisb({ ...newDisb, payment_type: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            <option value="ADVANCE">Tạm ứng hợp đồng</option>
                            <option value="VOLUME_PAYMENT">Thanh toán khối lượng hoàn thành</option>
                            <option value="SETTLEMENT">Thanh toán quyết toán dự án</option>
                            <option value="OTHER">Thanh toán khác</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Số tiền thanh toán (VNĐ):</label>
                          <input
                            type="number"
                            min="1"
                            value={newDisb.amount || ''}
                            onChange={(e) => setNewDisb({ ...newDisb, amount: Number(e.target.value) })}
                            placeholder="50000000"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-extrabold text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Giá trị khối lượng nghiệm thu (VNĐ):</label>
                          <input
                            type="number"
                            min="0"
                            value={newDisb.completed_volume_amount || ''}
                            onChange={(e) => setNewDisb({ ...newDisb, completed_volume_amount: Number(e.target.value) })}
                            placeholder="50000000"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Nguồn vốn thanh toán:</label>
                          <input
                            type="text"
                            value={newDisb.funding_source}
                            onChange={(e) => setNewDisb({ ...newDisb, funding_source: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-600 font-medium">Ghi chú giải trình / Diễn giải nội dung:</label>
                        <input
                          type="text"
                          value={newDisb.justification_note}
                          onChange={(e) => setNewDisb({ ...newDisb, justification_note: e.target.value })}
                          placeholder="Thanh toán đợt 1 hoàn thành phần móng và trụ..."
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddDisb(false)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateDisbursementSubmit}
                          disabled={saving}
                          className="px-4 py-1.5 bg-[#1864AB] text-white rounded-lg text-xs font-semibold hover:bg-[#0C3260]"
                        >
                          Lưu đợt thanh toán
                        </button>
                      </div>
                    </div>
                  )}

                  {disbursements.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      Chưa ghi nhận đợt thanh toán hay tạm ứng nào qua KBNN cho dự án này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5">Số chứng từ</th>
                            <th className="p-2.5">Ngày thanh toán</th>
                            <th className="p-2.5">Loại hình</th>
                            <th className="p-2.5 text-right">Số tiền (VNĐ)</th>
                            <th className="p-2.5 text-right">KL nghiệm thu</th>
                            <th className="p-2.5">Nguồn vốn</th>
                            <th className="p-2.5">Kiểm soát KBNN</th>
                            {canEdit && <th className="p-2.5 text-center">Xóa</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {disbursements.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-slate-800">{d.voucher_no}</td>
                              <td className="p-2.5">{d.payment_date ? new Date(d.payment_date).toLocaleDateString('vi-VN') : '-'}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 bg-blue-50 text-[#1864AB] rounded text-[10px] font-bold">
                                  {d.payment_type}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-bold text-emerald-700">
                                {Number(d.amount).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-600">
                                {Number(d.completed_volume_amount || 0).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-slate-600">{d.funding_source}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                  {d.treasury_control_status || 'APPROVED'}
                                </span>
                              </td>
                              {canEdit && (
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDisbursement(d.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    title="Xóa đợt thanh toán"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: KHO HỒ SƠ ĐIỆN TỬ */}
              {activeTab === 'documents' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-amber-600" />
                        <span>Kho Hồ sơ & Tài liệu Pháp lý Điện tử</span>
                      </h3>
                      <p className="text-slate-500 text-xs">Quản lý toàn bộ Quyết định, Báo cáo, Bản vẽ hoàn công và Biên bản nghiệm thu.</p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowAddDoc(!showAddDoc)}
                        className="px-3 py-1.5 bg-[#1864AB] hover:bg-[#0C3260] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Đính kèm văn bản mới</span>
                      </button>
                    )}
                  </div>

                  {showAddDoc && (
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <h4 className="font-bold text-slate-800">Đính kèm tài liệu điện tử mới</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Tên văn bản / tài liệu:</label>
                          <input
                            type="text"
                            value={newDoc.document_name}
                            onChange={(e) => setNewDoc({ ...newDoc, document_name: e.target.value })}
                            placeholder="VD: QĐ phê duyệt Báo cáo KTKT"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Loại tài liệu:</label>
                          <select
                            value={newDoc.document_type}
                            onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            {DOCUMENT_TYPES.map((dt) => (
                              <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Số / Ký hiệu văn bản:</label>
                          <input
                            type="text"
                            value={newDoc.document_code}
                            onChange={(e) => setNewDoc({ ...newDoc, document_code: e.target.value })}
                            placeholder="VD: 125/QĐ-UBND"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium">Đường dẫn tệp tin / File URL:</label>
                          <input
                            type="text"
                            value={newDoc.file_url}
                            onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
                            placeholder="/uploads/qd_phe_duyet.pdf"
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Cơ quan ban hành:</label>
                          <input
                            type="text"
                            value={newDoc.issuing_authority}
                            onChange={(e) => setNewDoc({ ...newDoc, issuing_authority: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddDoc(false)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleAddDocumentSubmit}
                          disabled={saving}
                          className="px-4 py-1.5 bg-[#1864AB] text-white rounded-lg text-xs font-semibold hover:bg-[#0C3260]"
                        >
                          Lưu tài liệu
                        </button>
                      </div>
                    </div>
                  )}

                  {documents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      Chưa có văn bản pháp lý nào được đính kèm vào kho hồ sơ điện tử.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#1864AB] flex items-center justify-center font-bold">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{doc.document_name}</p>
                              <div className="flex items-center space-x-3 text-slate-500 text-[11px] mt-0.5">
                                <span>Số: <strong className="font-mono text-slate-700">{doc.document_code || '-'}</strong></span>
                                <span>Cơ quan: <strong className="text-slate-700">{doc.issuing_authority || '-'}</strong></span>
                                <span>Phiên bản: <strong>v{doc.version}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-0.5 bg-sky-50 text-[#1864AB] rounded text-[10px] font-bold uppercase">
                              {doc.document_type}
                            </span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Xóa tài liệu"
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

              {/* TAB 4: ĐẤU THẦU & HỢP ĐỒNG */}
              {activeTab === 'bidding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#1864AB]" />
                      <span>Gói thầu & Lựa chọn Nhà thầu</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Hình thức lựa chọn nhà thầu:</label>
                      <p className="font-bold text-slate-900 mt-1">{project.bidding_method || 'Chỉ định thầu rút gọn'}</p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Nhà thầu thi công chính:</label>
                      <p className="font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg mt-1 border border-emerald-200">
                        {project.contractor_name || project.inv_contractor || 'Chưa chỉ định nhà thầu'}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày phê duyệt kết quả lựa chọn nhà thầu:</label>
                      <p className="font-semibold text-slate-800 mt-1">
                        {project.contractor_selection_date ? new Date(project.contractor_selection_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-sky-700" />
                      <span>Hợp đồng Xây lắp & Bảo lãnh</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Số hiệu hợp đồng kinh tế:</label>
                      <p className="font-bold font-mono text-slate-900 mt-1">{project.contract_no || 'Chưa ký hợp đồng'}</p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Giá trị hợp đồng xây lắp (VNĐ):</label>
                      <p className="font-extrabold text-emerald-700 text-sm mt-1">
                        {(project.contract_value || 0).toLocaleString()} VNĐ
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 font-medium">Ngày khởi công:</label>
                        <p className="font-semibold text-slate-800 mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString('vi-VN') : '-'}</p>
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium">Hạn hoàn thành kế hoạch:</label>
                        <p className="font-semibold text-slate-800 mt-1">{project.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString('vi-VN') : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: KẾ HOẠCH VỐN & GIẢI NGÂN (ĐỌC TỪ /public-investment) */}
              {activeTab === 'investment' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-[#CFEBFC]/30 border border-[#9FD7F9] rounded-xl flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-[#1864AB] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#0C3260]">Dữ liệu Tài chính Giải ngân Nguồn Chính</h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Số liệu kế hoạch vốn, phân bổ và giải ngân được tham chiếu trực tiếp từ module Đầu tư công (<code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">/public-investment</code>).
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
                </div>
              )}

              {/* TAB 6: NGHIỆM THU, QUYẾT TOÁN & BẢO HÀNH */}
              {activeTab === 'settlement' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Nghiệm thu Công trình</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Trạng thái nghiệm thu:</label>
                      <p className="font-bold text-slate-900 mt-1">
                        {project.acceptance_status === 'nghiem_thu_hoan_thanh' ? 'Đã nghiệm thu hoàn thành' : project.acceptance_status}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày lập biên bản nghiệm thu:</label>
                      <p className="font-semibold text-slate-800 mt-1">
                        {project.acceptance_date ? new Date(project.acceptance_date).toLocaleDateString('vi-VN') : 'Chưa nghiệm thu'}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Ngày bàn giao đưa vào sử dụng:</label>
                      <p className="font-semibold text-slate-800 mt-1">
                        {project.handover_date ? new Date(project.handover_date).toLocaleDateString('vi-VN') : 'Chưa bàn giao'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-[#1864AB]" />
                      <span>Quyết toán Dự án & Bảo hành</span>
                    </h3>
                    <div>
                      <label className="text-slate-500 font-medium">Trạng thái quyết toán:</label>
                      <p className="font-bold text-slate-900 mt-1">
                        {project.settlement_status === 'quyet_toan_xong' ? 'Đã quyết toán xong & Tất toán' : project.settlement_status}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Giá trị quyết toán phê duyệt (VNĐ):</label>
                      <p className="font-extrabold text-emerald-700 text-sm mt-1">
                        {(project.settlement_value || 0).toLocaleString()} VNĐ
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Thời hạn bảo hành công trình:</label>
                      <p className="font-semibold text-slate-800 mt-1">
                        {project.warranty_end_date
                          ? `Đến ngày: ${new Date(project.warranty_end_date).toLocaleDateString('vi-VN')}`
                          : 'Theo điều khoản hợp đồng xây lắp & loại công trình (Điều 28 NĐ 06/2021/NĐ-CP)'}
                      </p>
                    </div>

                    {settlementFramework && (
                      <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                          <FileCheck className="w-4 h-4 text-[#1864AB]" />
                          <span>Căn cứ pháp lý quyết toán (Hiệu lực 2026):</span>
                        </div>
                        <p className="text-[11px] text-blue-800 mt-1 font-medium">{settlementFramework.decree} & {settlementFramework.circular}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{settlementFramework.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: LỊCH SỬ AUDIT LOG */}
              {activeTab === 'audit' && (
                <div className="space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <History className="w-4 h-4 text-purple-600" />
                    <span>Nhật ký Kiểm soát & Lịch sử Thay đổi</span>
                  </h3>
                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                      Chưa có nhật ký audit nào cho dự án này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{log.action}</span>
                            <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                          </div>
                          <div className="text-right text-[11px] text-slate-500">
                            <p className="font-medium text-slate-700">{log.user_fullname || 'Hệ thống'} ({log.user_role})</p>
                            <p>{new Date(log.created_at).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
