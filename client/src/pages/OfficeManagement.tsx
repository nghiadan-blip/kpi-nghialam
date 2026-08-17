import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { officeApi } from '../services/api';
import { OfficeRequest } from '../types';
import { 
  Briefcase, 
  Plus, 
  FileSpreadsheet, 
  Clock, 
  Trash2, 
  Edit,
  Coffee,
  Car,
  Home,
  FileText,
  DollarSign
} from 'lucide-react';

export const OfficeManagement: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState<OfficeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<OfficeRequest | null>(null);

  // Form Inputs
  const [requestType, setRequestType] = useState<string>('vehicle');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [approvedCost, setApprovedCost] = useState<number>(0);
  const [fundingSource, setFundingSource] = useState<string>('Kinh phí tự chủ');
  const [documentRef, setDocumentRef] = useState<string>('');
  const [settlementStatus, setSettlementStatus] = useState<string>('pending');
  const [reqStatus, setReqStatus] = useState<string>('submitted');
  const [responsibleUserId, setResponsibleUserId] = useState<number>(9); // default to Nguyen Van Phong (VP)

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await officeApi.getRequests(typeFilter, statusFilter);
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách đề xuất văn phòng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  const openAddModal = () => {
    setEditItem(null);
    setShowModal(true);

    setRequestType('vehicle');
    setTitle('');
    setDescription('');
    setStartTime(new Date().toISOString().slice(0, 16));
    setEndTime('');
    setEstimatedCost(0);
    setApprovedCost(0);
    setFundingSource('Kinh phí tự chủ');
    setDocumentRef('');
    setSettlementStatus('pending');
    setReqStatus('submitted');
    setResponsibleUserId(9);
  };

  const openEditModal = (item: OfficeRequest) => {
    setEditItem(item);
    setShowModal(true);

    setRequestType(item.request_type);
    setTitle(item.title);
    setDescription(item.description || '');
    setStartTime(item.start_time ? item.start_time.replace(' ', 'T').slice(0, 16) : '');
    setEndTime(item.end_time ? item.end_time.replace(' ', 'T').slice(0, 16) : '');
    setEstimatedCost(item.estimated_cost);
    setApprovedCost(item.approved_cost);
    setFundingSource(item.funding_source || 'Kinh phí tự chủ');
    setDocumentRef(item.document_ref || '');
    setSettlementStatus(item.settlement_status);
    setReqStatus(item.status);
    setResponsibleUserId(item.responsible_user_id || 9);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        request_type: requestType,
        title,
        description,
        start_time: startTime ? startTime.replace('T', ' ') + ':00' : null,
        end_time: endTime ? endTime.replace('T', ' ') + ':00' : null,
        estimated_cost: estimatedCost,
        approved_cost: approvedCost,
        funding_source: fundingSource,
        document_ref: documentRef,
        settlement_status: settlementStatus,
        status: reqStatus,
        responsible_user_id: responsibleUserId
      };

      if (editItem) {
        await officeApi.updateRequest(editItem.id, payload);
      } else {
        await officeApi.createRequest(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu yêu cầu văn phòng.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề xuất này?')) return;
    try {
      await officeApi.deleteRequest(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa đề xuất.');
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'guest_reception': return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'vehicle': return <Car className="w-5 h-5 text-sky-500" />;
      case 'meeting_room': return <Home className="w-5 h-5 text-indigo-500" />;
      case 'stationery': return <FileText className="w-5 h-5 text-emerald-500" />;
      default: return <Briefcase className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Briefcase className="w-6 h-6 text-sky-600" />
            <span>QUẢN LÝ VĂN PHÒNG & HẬU CẦN HÀNH CHÍNH</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Đăng ký sử dụng hội trường họp, điều động xe ô tô công tác, phê duyệt kinh phí tiếp khách và quyết toán văn phòng phẩm thường kỳ
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => officeApi.exportExcel()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất báo cáo văn phòng</span>
          </button>
          <button
            onClick={openAddModal}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng ký mới</span>
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase ml-1.5">Tổng số đề xuất</span>
          {requests.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 mt-2 ml-1.5">Chưa cập nhật (NO_DATA)</span>
          ) : (
            <span className="text-xl font-black text-slate-800 mt-1 ml-1.5">{requests.length} đề xuất</span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-500" />
          <span className="text-[10px] font-bold text-amber-800 uppercase ml-1.5">Đề xuất chờ duyệt</span>
          {requests.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 mt-2 ml-1.5">Chưa cập nhật (NO_DATA)</span>
          ) : (
            <span className="text-xl font-black text-amber-700 mt-1 ml-1.5">
              {requests.filter(r => r.status === 'submitted').length} đề xuất
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-800 uppercase ml-1.5">Đã phê duyệt</span>
          {requests.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 mt-2 ml-1.5">Chưa cập nhật (NO_DATA)</span>
          ) : (
            <span className="text-xl font-black text-emerald-700 mt-1 ml-1.5">
              {requests.filter(r => r.status === 'approved').length} đề xuất
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-sky-500" />
          <span className="text-[10px] font-bold text-sky-800 uppercase ml-1.5">Chi phí đã duyệt</span>
          {requests.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 mt-2 ml-1.5">Chưa cập nhật (NO_DATA)</span>
          ) : (
            <span className="text-xl font-black text-sky-700 mt-1 ml-1.5">
              {formatVND(requests.reduce((sum, r) => sum + (r.approved_cost || 0), 0))}
            </span>
          )}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center gap-4 text-xs font-bold text-slate-600">
        <div className="w-full md:w-64">
          <label className="block text-slate-400 text-[10px] uppercase mb-1">Loại yêu cầu</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
          >
            <option value="">-- Mọi loại đề xuất --</option>
            <option value="vehicle">Điều động xe công</option>
            <option value="meeting_room">Đăng ký phòng họp/hội trường</option>
            <option value="guest_reception">Chiêu đãi tiếp khách</option>
            <option value="stationery">Cấp phát văn phòng phẩm</option>
            <option value="business_trip">Công tác / Giấy đi đường</option>
          </select>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-slate-400 text-[10px] uppercase mb-1">Trạng thái phê duyệt</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
          >
            <option value="">-- Mọi trạng thái --</option>
            <option value="submitted">Chờ duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="settled">Đã quyết toán hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Grid Requests list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-slate-500 text-sm">Đang tải danh sách đề xuất hậu cần...</div>
        ) : error ? (
          <div className="col-span-2 p-12 text-center text-rose-500 text-sm">{error}</div>
        ) : requests.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 text-sm">Chưa có đề xuất văn phòng nào được tìm thấy.</div>
        ) : (
          requests.map((r) => {
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 relative hover:shadow-xs transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        {getRequestIcon(r.request_type)}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                          {r.request_type === 'vehicle' ? 'Điều xe công' :
                           r.request_type === 'meeting_room' ? 'Hội trường/Phòng họp' :
                           r.request_type === 'guest_reception' ? 'Chi tiếp khách' :
                           r.request_type === 'stationery' ? 'Văn phòng phẩm' : 'Hành chính khác'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-semibold">Người đề xuất: {r.request_user_name}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'settled' ? 'bg-blue-100 text-blue-800' :
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status === 'settled' ? 'Đã quyết toán' : r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Bị từ chối' : 'Chờ phê duyệt'}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight">{r.title}</h3>
                  {r.description && <p className="text-slate-500 text-xs mt-2 font-medium line-clamp-2">{r.description}</p>}

                  {/* Date & Time detail */}
                  {(r.start_time || r.end_time) && (
                    <div className="mt-3 bg-slate-50 px-3 py-2 rounded-xl text-slate-500 text-[10px] flex items-center space-x-2 border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Thời gian: <strong>{r.start_time ? new Date(r.start_time).toLocaleString('vi-VN') : ''}</strong>
                        {r.end_time ? ` — ${new Date(r.end_time).toLocaleString('vi-VN')}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Cost Details */}
                  {r.estimated_cost > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-bold">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kinh phí dự kiến: {formatVND(r.estimated_cost)}</span>
                      </div>
                      {r.approved_cost > 0 && (
                        <div className="text-emerald-600">
                          Thực tế đã duyệt: {formatVND(r.approved_cost)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <div className="text-[10px] text-slate-400">
                    Phụ trách hậu cần: <strong className="text-slate-600">{r.responsible_user_name || 'Văn phòng UBND'}</strong>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(r)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{hasRole(['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD']) ? 'Xét duyệt' : 'Xem chi tiết'}</span>
                    </button>
                    {(r.request_user_id === user?.id || hasRole(['ADMIN', 'LEADERSHIP'])) && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#1864AB] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight uppercase">
                {editItem ? 'DUYỆT & ĐIỀU HÀNH ĐỀ XUẤT HẬU CẦN' : 'ĐĂNG KÝ HẬU CẦN VĂN PHÒNG MỚI'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 text-xs font-bold">Đóng</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Loại hậu cần hành chính</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-bold"
                >
                  <option value="vehicle">Điều động xe công tác 4/7 chỗ</option>
                  <option value="meeting_room">Đăng ký sử dụng phòng họp/hội trường lớn</option>
                  <option value="guest_reception">Chiêu đãi / Tiếp khách sở ngành</option>
                  <option value="stationery">Cấp phát văn phòng phẩm / Mực in</option>
                  <option value="business_trip">Yêu cầu giấy đi đường công tác</option>
                  <option value="other">Yêu cầu hậu cần khác</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Tiêu đề đề xuất</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ví dụ: Đăng ký xe đi huyện họp giao ban quý III"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Chi tiết yêu cầu chuẩn bị</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi rõ thành phần đoàn đi, số lượng đại biểu họp, nước uống, chuẩn bị khánh tiết..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Kinh phí dự kiến (đ)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phê duyệt chi phí (đ)</label>
                  <input
                    type="number"
                    disabled={!hasRole(['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD'])}
                    value={approvedCost}
                    onChange={(e) => setApprovedCost(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3 border-slate-100">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Cán bộ văn phòng chuẩn bị</label>
                  <select
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(Number(e.target.value))}
                    disabled={!hasRole(['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD'])}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 disabled:bg-slate-100"
                  >
                    <option value={9}>Nguyễn Văn Phòng (Văn phòng UBND)</option>
                    <option value={8}>Lê Văn Tài (Bộ phận Tài chính)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Trạng thái phê duyệt</label>
                  <select
                    value={reqStatus}
                    disabled={!hasRole(['LEADERSHIP', 'ADMIN', 'DEPARTMENT_HEAD'])}
                    onChange={(e) => setReqStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-sky-800 disabled:bg-slate-100"
                  >
                    <option value="submitted">Đăng ký - Chờ duyệt</option>
                    <option value="approved">Đã phê duyệt/Chỉ định chuẩn bị</option>
                    <option value="completed">Đã tổ chức hoàn thành</option>
                    <option value="settled">Đã quyết toán chứng từ chi</option>
                    <option value="rejected">Bị từ chối</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Quyết toán chi phí</label>
                  <select
                    value={settlementStatus}
                    onChange={(e) => setSettlementStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="pending">Chưa thanh toán</option>
                    <option value="submitting">Đang đối chiếu chứng từ</option>
                    <option value="completed">Đã nộp hóa đơn/Quyết toán xong</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Số hóa đơn / Hợp đồng đính kèm</label>
                  <input
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="Ví dụ: HD-REST-9082"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#1864AB] hover:bg-[#0c3260] text-white px-5 py-2 rounded-xl font-bold"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeManagement;
