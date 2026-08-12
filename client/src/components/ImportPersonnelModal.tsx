import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { usersApi } from '../services/api';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Users,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedUser {
  fullname: string;
  department_name?: string;
  position?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export const ImportPersonnelModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [parsedRows, setParsedRows] = useState<ParsedUser[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(15, rawData.length); i++) {
          const row = rawData[i];
          if (
            row &&
            row.some((cell: any) => {
              const str = String(cell).toLowerCase();
              return str.includes('họ tên') || str.includes('họ và tên') || str.includes('họ tên cán bộ');
            })
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          setError('Không tìm thấy dòng tiêu đề (HỌ TÊN) trong file Excel. Vui lòng kiểm tra lại cấu trúc file.');
          return;
        }

        const headers = rawData[headerRowIndex].map((h: any) => String(h || '').toLowerCase().trim());
        const nameIdx = headers.findIndex((h: string) => h.includes('họ tên') || h.includes('họ và tên'));
        const deptIdx = headers.findIndex((h: string) => h.includes('đơn vị') || h.includes('phòng ban') || h.includes('bộ phận'));
        const posIdx = headers.findIndex((h: string) => h.includes('chức vụ') || h.includes('vị trí'));
        const emailIdx = headers.findIndex((h: string) => h.includes('email') || h.includes('thư điện tử'));
        const phoneIdx = headers.findIndex((h: string) => h.includes('di động') || h.includes('điện thoại') || h.includes('sđt'));

        const users: ParsedUser[] = [];
        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          const fullname = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
          if (!fullname || fullname.startsWith('(') || fullname.toLowerCase() === 'họ tên') continue;

          const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : 'UBND xã Nghĩa Lâm';
          const pos = posIdx !== -1 && row[posIdx] ? String(row[posIdx]).trim() : 'Công chức chuyên môn';
          const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';
          const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';

          let role = 'EMPLOYEE';
          const lowerPos = pos.toLowerCase();
          if (lowerPos.includes('chủ tịch') || lowerPos.includes('hđnd') || lowerPos.includes('lãnh đạo')) {
            role = 'LEADERSHIP';
          } else if (
            lowerPos.includes('trưởng') ||
            lowerPos.includes('giám đốc') ||
            lowerPos.includes('phó phòng') ||
            lowerPos.includes('chỉ huy')
          ) {
            role = 'DEPARTMENT_HEAD';
          }

          users.push({
            fullname,
            department_name: dept,
            position: pos,
            email: email || undefined,
            phone: phone || undefined,
            role,
          });
        }

        if (users.length === 0) {
          setError('Không trích xuất được bản ghi cán bộ nào từ file.');
          return;
        }

        setParsedRows(users);
      } catch (err: any) {
        setError('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ['MẪU DANH SÁCH CÁN BỘ, CÔNG CHỨC UBND XÃ NGHĨA LÂM'],
      ['STT', 'HỌ TÊN', 'ĐƠN VỊ CÔNG TÁC', 'CHỨC VỤ', 'EMAIL', 'SỐ CCCD', 'DI ĐỘNG'],
      [1, 'Nguyễn Hùng Cường', 'UBND xã Nghĩa Lâm', 'Chủ tịch UBND Xã', 'cuongnh@nghialam.gov.vn', '038081003089', '0947003322'],
      [2, 'Trần Văn Hùng', 'Bộ phận Địa chính - Xây dựng', 'Trưởng bộ phận Địa chính', 'hungtv@nghialam.gov.vn', '038085002011', '0912345678'],
      [3, 'Lê Thị Mai', 'Trung tâm PV Hành chính công', 'Công chức Tiếp nhận hồ sơ', 'mailt@nghialam.gov.vn', '038192004522', '0988776655'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách cán bộ');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Can_Bo_UBND_Xa_Nghia_Lam.xlsx');
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.importUsersExcel(parsedRows);
      setSuccessMsg(res.message);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu cán bộ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-[#CFEBFC] max-h-[90vh] flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#CFEBFC]">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#CFEBFC] text-[#1864AB] rounded-2xl">
              <FileSpreadsheet className="w-7 h-7 text-[#27A4F2]" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-[#0C3260]">
                Nhập Danh Sách Cán Bộ Từ File Excel
              </h3>
              <p className="text-xs text-slate-500">
                Tự động trích xuất thông tin, khớp phòng ban và khởi tạo tài khoản đồng bộ
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-[#1864AB] bg-[#CFEBFC]/50 hover:bg-[#CFEBFC] rounded-xl border border-[#9FD7F9] transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Biểu Mẫu Mẫu</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          {parsedRows.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#9FD7F9] hover:border-[#27A4F2] bg-[#F0F7FD]/60 hover:bg-[#CFEBFC]/30 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="p-4 bg-white rounded-full text-[#27A4F2] shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0C3260]">
                  Bấm để chọn file Excel hoặc kéo thả vào đây
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hỗ trợ định dạng .xlsx, .xls (Tương thích file thu thập người dùng của xã)
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#0C3260]">
                    Tệp: <strong className="text-[#27A4F2]">{fileName}</strong> ({parsedRows.length} cán bộ đã nhận diện)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                  }}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-[#CFEBFC] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#CFEBFC]/60 text-[#0C3260] uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-3 py-2.5">STT</th>
                      <th className="px-3 py-2.5">Họ và tên</th>
                      <th className="px-3 py-2.5">Đơn vị công tác</th>
                      <th className="px-3 py-2.5">Chức vụ</th>
                      <th className="px-3 py-2.5">Email / SĐT</th>
                      <th className="px-3 py-2.5">Vai trò hệ thống</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CFEBFC]">
                    {parsedRows.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{u.fullname}</td>
                        <td className="px-3 py-2 text-slate-600">{u.department_name}</td>
                        <td className="px-3 py-2 text-slate-600">{u.position}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono">
                          {u.email || u.phone || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'LEADERSHIP'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : u.role === 'DEPARTMENT_HEAD'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {u.role === 'LEADERSHIP'
                              ? 'Lãnh đạo'
                              : u.role === 'DEPARTMENT_HEAD'
                              ? 'Trưởng phòng'
                              : 'Công chức'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#CFEBFC] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 italic">
            * Mật khẩu khởi tạo mặc định cho cán bộ là: <strong>password123</strong>
          </p>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0 || loading}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-gradient-to-r from-[#27A4F2] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <Users className="w-4 h-4" />
              <span>{loading ? 'Đang nhập dữ liệu...' : `Xác Nhận Nhập (${parsedRows.length} Cán Bộ)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
