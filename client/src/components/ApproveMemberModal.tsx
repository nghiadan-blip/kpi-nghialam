import React, { useState, useEffect } from 'react';
import { User, Department, JobPosition } from '../types';
import { usersApi, departmentsApi, jobPositionsApi } from '../services/api';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Building,
  Mail,
  Phone,
  X,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: User | null;
  onSuccess: () => void;
}

export const ApproveMemberModal: React.FC<Props> = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [selectedPositionCode, setSelectedPositionCode] = useState('');
  const [assignedPosition, setAssignedPosition] = useState('');
  const [assignedRole, setAssignedRole] = useState<'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'LEADERSHIP' | 'ADMIN'>(
    'EMPLOYEE'
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentsApi
      .getDepartments()
      .then((res) => {
        setDepartments(res.departments);
        matchAndSetDepartment(candidate, res.departments);
      })
      .catch(() => {});

    jobPositionsApi
      .getJobPositions()
      .then((res) => {
        setJobPositions(res.job_positions);
        matchAndSetJobPosition(candidate, res.job_positions);
      })
      .catch(() => {});

    if (candidate) {
      const pos = candidate.requested_position || candidate.position || 'Công chức chuyên môn';
      setAssignedPosition(pos);

      // Auto-detect role from position
      const lowerPos = pos.toLowerCase();
      if (lowerPos.includes('chủ tịch') || lowerPos.includes('lãnh đạo') || lowerPos.includes('hđnd')) {
        setAssignedRole('LEADERSHIP');
      } else if (
        lowerPos.includes('trưởng') ||
        lowerPos.includes('giám đốc') ||
        lowerPos.includes('phó phòng') ||
        lowerPos.includes('chỉ huy')
      ) {
        setAssignedRole('DEPARTMENT_HEAD');
      } else {
        setAssignedRole((candidate.role as any) || 'EMPLOYEE');
      }

      setIsRejecting(false);
      setRejectionReason('');
      setError(null);
    }
  }, [candidate]);

  const matchAndSetDepartment = (cand: User | null, depts: Department[]) => {
    if (!cand || depts.length === 0) return;
    if (cand.department_id) {
      setSelectedDeptId(cand.department_id);
      return;
    }

    const req = (cand.requested_department || '').toLowerCase().trim();
    if (!req) return;

    let match = depts.find((d) => d.name.toLowerCase() === req);
    if (!match) {
      match = depts.find(
        (d) => d.name.toLowerCase().includes(req) || req.includes(d.name.toLowerCase())
      );
    }
    if (!match) {
      const keywords = ['địa chính', 'xây dựng', 'tư pháp', 'hộ tịch', 'văn phòng', 'thống kê', 'tài chính', 'kế toán', 'văn hóa', 'xã hội', 'công an', 'quân sự', 'hành chính công', 'lãnh đạo'];
      for (const kw of keywords) {
        if (req.includes(kw)) {
          match = depts.find((d) => d.name.toLowerCase().includes(kw));
          if (match) break;
        }
      }
    }
    if (match) setSelectedDeptId(match.id);
  };

  const matchAndSetJobPosition = (cand: User | null, positions: JobPosition[]) => {
    if (!cand || positions.length === 0) return;
    if (cand.position_code) {
      setSelectedPositionCode(cand.position_code);
      return;
    }

    const req = (cand.requested_position || cand.position || '').toLowerCase().trim();
    if (!req) return;

    // Try finding closest position
    let match = positions.find((p) => p.name.toLowerCase() === req);
    if (!match) {
      match = positions.find((p) => p.name.toLowerCase().includes(req) || req.includes(p.name.toLowerCase()));
    }
    if (!match) {
      if (req.includes('đất đai') || req.includes('địa chính') || req.includes('khoáng sản')) {
        match = positions.find((p) => p.code === 'NA-NL-II.15');
      } else if (req.includes('tư pháp') || req.includes('hộ tịch')) {
        match = positions.find((p) => p.code === 'NA-NL-II.04');
      } else if (req.includes('tài chính') || req.includes('kế toán')) {
        match = positions.find((p) => p.code === 'NA-NL-II.06');
      } else if (req.includes('văn hóa') || req.includes('cntt') || req.includes('truyền thông')) {
        match = positions.find((p) => p.code === 'NA-NL-II.22');
      } else if (req.includes('nông nghiệp') || req.includes('thủy lợi')) {
        match = positions.find((p) => p.code === 'NA-NL-II.13');
      } else if (req.includes('văn phòng')) {
        match = positions.find((p) => p.code === 'NA-NL-II.02');
      } else if (req.includes('hành chính công') || req.includes('dịch vụ công')) {
        match = positions.find((p) => p.code === 'NA-NL-II.25');
      }
    }

    if (match) {
      setSelectedPositionCode(match.code);
      setAssignedPosition(match.name);
    }
  };

  const handlePositionCodeChange = (code: string) => {
    setSelectedPositionCode(code);
    const pos = jobPositions.find((p) => p.code === code);
    if (pos) {
      setAssignedPosition(pos.name);
      if (pos.group_type === 'NHOM_I_LANH_DAO') {
        if (pos.name.toLowerCase().includes('trưởng phòng') || pos.name.toLowerCase().includes('giám đốc')) {
          setAssignedRole('DEPARTMENT_HEAD');
        } else {
          setAssignedRole('LEADERSHIP');
        }
      }
    }
  };

  if (!isOpen || !candidate) return null;

  const currentSelectedPos = jobPositions.find((p) => p.code === selectedPositionCode);
  const isPosOverQuota = currentSelectedPos && currentSelectedPos.allocated_quota > 0 && currentSelectedPos.current_assigned >= currentSelectedPos.allocated_quota;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedPosition.trim()) {
      setError('Vui lòng nhập hoặc chọn vị trí việc làm chính thức.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await usersApi.approveMembership(candidate.id, {
        role: assignedRole,
        department_id: selectedDeptId ? Number(selectedDeptId) : null,
        position: assignedPosition.trim(),
        position_code: selectedPositionCode || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt thành viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      await usersApi.rejectMembership(candidate.id, {
        rejection_reason: rejectionReason.trim() || 'Hồ sơ chưa phù hợp với vị trí công tác tại UBND xã.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-[#CFEBFC] relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#CFEBFC]">
          <div className="p-3 bg-[#CFEBFC] text-[#1864AB] rounded-2xl">
            <ShieldCheck className="w-7 h-7 text-[#27A4F2]" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-[#0C3260]">
              Kiểm Duyệt & Gán Vị Trí Việc Làm (33 Vị Trí NĐ 335)
            </h3>
            <p className="text-xs text-slate-500">
              Phê duyệt hồ sơ đăng ký và phân công vào danh mục vị trí việc làm xã Nghĩa Lâm
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Candidate Profile Summary */}
        <div className="bg-[#F0F7FD] p-4 rounded-2xl border border-[#CFEBFC] mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-[#0C3260]">{candidate.fullname}</h4>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
              Chờ phê duyệt
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-[#6EC2F7]" />
              <span className="truncate">{candidate.email || 'Chưa cung cấp email'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-[#6EC2F7]" />
              <span>{candidate.phone || 'Chưa cung cấp SĐT'}</span>
            </div>
            <div className="flex items-center space-x-1.5 col-span-2">
              <Building className="w-3.5 h-3.5 text-[#6EC2F7]" />
              <span>Đề xuất ban đầu: <strong>{candidate.requested_department || 'Chưa đăng ký'}</strong> — <em>{candidate.requested_position || 'Chưa đăng ký'}</em></span>
            </div>
          </div>
        </div>

        {!isRejecting ? (
          /* Approval & Assignment Form */
          <form onSubmit={handleApprove} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                Phòng ban / Bộ phận chính thức <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-xs md:text-sm focus:ring-2 focus:ring-[#27A4F2] bg-white font-medium"
              >
                <option value="">-- Chưa gán phòng ban cụ thể --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 33 Official Position Selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                  <span>Vị trí việc làm chuẩn (Quyết định UBND xã)</span> <span className="text-red-500">*</span>
                </span>
                {currentSelectedPos && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isPosOverQuota ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Biên chế: {currentSelectedPos.current_assigned}/{currentSelectedPos.allocated_quota} ({currentSelectedPos.allocated_ratio_percent}%)
                  </span>
                )}
              </label>
              <select
                value={selectedPositionCode}
                onChange={(e) => handlePositionCodeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-xs focus:ring-2 focus:ring-[#27A4F2] bg-white font-medium"
              >
                <option value="">-- Chọn trong danh mục 33 vị trí việc làm chuẩn --</option>
                <optgroup label="Nhóm I: Lãnh đạo, quản lý (12 biên chế - 36,36%)">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_I_LANH_DAO')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name} ({p.current_assigned}/{p.allocated_quota} biên chế)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Nhóm II: Chuyên môn, nghiệp vụ (21 biên chế - 63,64%)">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_II_CHUYEN_MON')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name} ({p.current_assigned}/{p.allocated_quota} biên chế)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Nhóm III: Hỗ trợ, phục vụ">
                  {jobPositions
                    .filter((p) => p.group_type === 'NHOM_III_PHUC_VU')
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                </optgroup>
              </select>

              {isPosOverQuota && (
                <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>
                    Vị trí này đã bố trí <strong>{currentSelectedPos.current_assigned}/{currentSelectedPos.allocated_quota}</strong> biên chế được phê duyệt.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                Tên chức vụ / vị trí hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assignedPosition}
                onChange={(e) => setAssignedPosition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-xs md:text-sm focus:ring-2 focus:ring-[#27A4F2] bg-white font-medium"
                placeholder="VD: Chuyên viên đất đai, tài nguyên khoáng sản"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                Vai trò phân quyền hệ thống <span className="text-red-500">*</span>
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-xs md:text-sm focus:ring-2 focus:ring-[#27A4F2] bg-white font-medium"
              >
                <option value="EMPLOYEE">Công chức (Tự chấm điểm & thực hiện nhiệm vụ)</option>
                <option value="DEPARTMENT_HEAD">Trưởng bộ phận (Giao việc & thẩm định bước 2)</option>
                <option value="LEADERSHIP">Lãnh đạo UBND (Phê duyệt bước 3 & xếp loại toàn diện)</option>
                <option value="ADMIN">Quản trị viên (Toàn quyền quản trị hệ thống)</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#CFEBFC]">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                Từ chối hồ sơ
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{loading ? 'Đang duyệt...' : 'Phê Duyệt & Gán Vị Trí'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Rejection Prompt */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-red-700 mb-1">
                Lý do từ chối hồ sơ đăng ký
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-red-200 text-sm focus:ring-2 focus:ring-red-400 bg-red-50/40"
                placeholder="Nhập lý do từ chối để thông báo cho cán bộ..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>{loading ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
