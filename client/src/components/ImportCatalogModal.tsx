import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { catalogApi } from '../services/api';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Award,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedCatalogItem {
  code: string;
  name: string;
  category: string;
  coefficient: number;
  baseline_score: number;
  description?: string;
}

export const ImportCatalogModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [parsedItems, setParsedItems] = useState<ParsedCatalogItem[]>([]);
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

        // Find header row containing 'nhiệm vụ' or 'sản phẩm'
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(15, rawData.length); i++) {
          const row = rawData[i];
          if (
            row &&
            row.some((cell: any) => {
              const str = String(cell).toLowerCase();
              return str.includes('nhiệm vụ') || str.includes('tên công việc') || str.includes('sản phẩm');
            })
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          setError('Không tìm thấy dòng tiêu đề (Nhiệm vụ / Sản phẩm) trong file Excel.');
          return;
        }

        const headers = rawData[headerRowIndex].map((h: any) => String(h || '').toLowerCase().trim());
        const nameIdx = headers.findIndex((h: string) => h.includes('nhiệm vụ') || h.includes('tên công việc'));
        const codeIdx = headers.findIndex((h: string) => h.includes('mã'));
        const descIdx = headers.findIndex((h: string) => h.includes('sản phẩm đầu ra') || h.includes('mô tả'));
        const groupIdx = headers.findIndex((h: string) => h.includes('phân nhóm') || h.includes('nhóm'));
        const baseIdx = headers.findIndex((h: string) => h.includes('điểm chuẩn'));
        const coeffIdx = headers.findIndex((h: string) => h.includes('hệ số'));

        const items: ParsedCatalogItem[] = [];
        let currentCat = 'PART_A';

        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          const taskName = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
          if (!taskName || taskName.startsWith('(1)') || taskName.toLowerCase() === 'nhiệm vụ') continue;

          if (taskName.includes('PHẦN B') || taskName.includes('CÔNG VIỆC THEO VỊ TRÍ')) {
            currentCat = 'PART_B_GROUP_I';
          }

          const groupVal = groupIdx !== -1 && row[groupIdx] ? String(row[groupIdx]) : '';
          if (groupVal.includes('II') || groupVal.includes('Nhóm 2')) {
            currentCat = 'PART_B_GROUP_II';
          }

          const codeVal = codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : `CV_${r}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const descVal = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '';
          const coeffVal = coeffIdx !== -1 && Number(row[coeffIdx]) > 0 ? Number(row[coeffIdx]) : 1.0;
          const baseVal = baseIdx !== -1 && Number(row[baseIdx]) > 0 ? Number(row[baseIdx]) : 5.0;

          items.push({
            code: codeVal,
            name: taskName,
            category: currentCat,
            coefficient: coeffVal,
            baseline_score: baseVal,
            description: descVal || undefined,
          });
        }

        if (items.length === 0) {
          setError('Không tìm thấy danh mục sản phẩm hợp lệ trong file.');
          return;
        }

        setParsedItems(items);
      } catch (err: any) {
        setError('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ['ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM — DANH MỤC CÔNG VIỆC THEO NĐ 335/2025/NĐ-CP'],
      ['STT', 'Nhiệm vụ / Tên công việc', 'Mã công việc', 'Sản phẩm đầu ra', 'Phân nhóm', 'Điểm chuẩn', 'Hệ số quy đổi'],
      [1, 'Chủ trì cuộc họp giao ban tuần của UBND xã', 'CV_HOP_001', 'Biên bản kết luận giao ban', 'Phần A', 5.0, 1.5],
      [2, 'Tiếp công dân định kỳ tại Trụ sở UBND xã', 'CV_TCD_002', 'Sổ nhật ký tiếp công dân', 'Phần A', 5.0, 1.25],
      [3, 'Thẩm định hồ sơ chuyển mục đích sử dụng đất', 'CV_DC_003', 'Tờ trình và biên bản thẩm định', 'Phần B.I', 5.0, 1.25],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh mục NĐ 335');
    XLSX.writeFile(wb, 'Mau_Danh_Muc_Cong_Viec_ND335_Nghia_Lam.xlsx');
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await catalogApi.importCatalogExcel(parsedItems);
      setSuccessMsg(res.message);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi nạp danh mục sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickOfficialQD = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await catalogApi.importOfficialQD();
      setSuccessMsg(res.message);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể nạp danh mục từ tệp QĐ của xã.');
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
              <Award className="w-7 h-7 text-[#27A4F2]" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-[#0C3260]">
                Cập Nhật Danh Mục Công Việc NĐ 335 (Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Nạp danh mục sản phẩm chuẩn, phân nhóm và hệ số quy đổi K phục vụ tự chấm điểm
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

          {/* 1-Click Load Official File Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center space-x-1.5 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Nạp 1-Click Toàn Bộ Danh Mục QĐ UBND Xã Nghĩa Lâm</span>
              </div>
              <p className="text-xs text-[#CFEBFC] mt-0.5">
                Nạp tự động hơn 460+ danh mục công việc chuẩn từ tệp Quyết định có sẵn trên máy chủ.
              </p>
            </div>
            <button
              onClick={handle1ClickOfficialQD}
              disabled={loading}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-[#0C3260] text-xs font-black rounded-xl shadow transition self-start sm:self-auto cursor-pointer"
            >
              {loading ? 'Đang nạp...' : '⚡ Nạp Ngay QĐ Xã'}
            </button>
          </div>

          {/* Upload Area */}
          {parsedItems.length === 0 ? (
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
                  Bấm để chọn file Excel danh mục khác hoặc kéo thả vào đây
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hỗ trợ các file phụ lục danh mục sản phẩm công việc quy đổi (.xlsx, .xls)
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#0C3260]">
                    Tệp: <strong className="text-[#27A4F2]">{fileName}</strong> ({parsedItems.length} mục đã nhận diện)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedItems([]);
                    setFileName('');
                  }}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-[#CFEBFC] rounded-2xl overflow-hidden shadow-2xs max-h-[340px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#CFEBFC]/60 text-[#0C3260] uppercase text-[11px] font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">Mã</th>
                      <th className="px-3 py-2.5">Nhiệm vụ / Tên công việc</th>
                      <th className="px-3 py-2.5">Phân nhóm</th>
                      <th className="px-3 py-2.5">Điểm chuẩn</th>
                      <th className="px-3 py-2.5">Hệ số (K)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CFEBFC]">
                    {parsedItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-[#1864AB]">{item.code}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.category === 'PART_A'
                                ? 'bg-purple-100 text-purple-800'
                                : item.category === 'PART_B_GROUP_I'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.category === 'PART_A'
                              ? 'Phần A'
                              : item.category === 'PART_B_GROUP_I'
                              ? 'Phần B.I'
                              : 'Phần B.II'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono">{item.baseline_score.toFixed(1)}</td>
                        <td className="px-3 py-2 font-mono font-bold text-[#27A4F2]">
                          {item.coefficient.toFixed(2)}
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
        <div className="pt-4 border-t border-[#CFEBFC] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={parsedItems.length === 0 || loading}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-gradient-to-r from-[#27A4F2] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <Award className="w-4 h-4" />
            <span>{loading ? 'Đang lưu...' : `Xác Nhận Nhập (${parsedItems.length} Mục)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
