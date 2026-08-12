import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, departmentsApi } from '../services/api';
import { VietnameseEmblem } from '../components/VietnameseEmblem';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const Register: React.FC = () => {

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedDepartment, setRequestedDepartment] = useState('');
  const [requestedPosition, setRequestedPosition] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Google Gmail Mock/Direct Auth prompt
  const [gmailPromptOpen, setGmailPromptOpen] = useState(false);
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailName, setGmailName] = useState('');

  React.useEffect(() => {
    departmentsApi
      .getDepartments()
      .then((res) => setDepartments(res.departments))
      .catch(() => {});
  }, []);

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullname.trim() || !password || (!email.trim() && !phone.trim())) {
      setError('Vui lòng điền đầy đủ Họ tên, Mật khẩu và Email hoặc Số điện thoại.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        fullname: fullname.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        requested_department: requestedDepartment.trim() || undefined,
        requested_position: requestedPosition.trim() || undefined,
        password,
      });

      setSuccessNotice(res.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gmailAddress.trim() || !gmailAddress.includes('@')) {
      setError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.googleAuth({
        email: gmailAddress.trim().toLowerCase(),
        fullname: gmailName.trim() || gmailAddress.split('@')[0],
        requested_department: requestedDepartment.trim() || undefined,
        requested_position: requestedPosition.trim() || undefined,
      });

      setGmailPromptOpen(false);
      setSuccessNotice(res.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký qua Gmail không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center py-10 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl shadow-[#27A4F2]/10 border border-[#CFEBFC] overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white p-6 md:p-8 text-center relative border-b-2 border-[#9FD7F9]/40">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur-md" />
            <VietnameseEmblem size={72} className="relative mx-auto drop-shadow-xl" />
          </div>

          <h2 className="text-base md:text-lg font-black tracking-wider uppercase drop-shadow-sm text-white">
            ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM
          </h2>
          <p className="text-xs text-[#CFEBFC] font-medium mt-1">
            Đăng Ký Tài Khoản Cán Bộ & Công Chức
          </p>

          <div className="inline-flex items-center space-x-1.5 mt-3 text-[11px] bg-[#0C3260]/60 text-[#9FD7F9] border border-[#6EC2F7]/30 px-3 py-1 rounded-full font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3EAEF4]" />
            <span>Quy trình kiểm duyệt & gán vị trí việc làm theo NĐ 335</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8">
          {successNotice ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-[#0C3260]">Đăng Ký Thành Công!</h3>
              <div className="p-4 bg-[#CFEBFC]/50 border border-[#9FD7F9] rounded-2xl text-xs md:text-sm text-[#0C3260] text-left space-y-2">
                <p className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-[#27A4F2] mt-0.5 flex-shrink-0" />
                  <span>{successNotice}</span>
                </p>
                <p className="text-[11px] text-slate-500 italic mt-2">
                  * Sau khi được Lãnh đạo hoặc Quản trị viên phê duyệt, đồng chí có thể đăng nhập ngay để tham gia quy trình giao việc và tự chấm điểm hàng tháng.
                </p>
              </div>

              <div className="pt-3 flex justify-center space-x-3">
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-[#27A4F2] hover:bg-[#1864AB] text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  Quay Về Trang Đăng Nhập
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Quick Google Gmail Register Option */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setGmailPromptOpen(true)}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-[#9FD7F9] hover:border-[#27A4F2] rounded-2xl flex items-center justify-center space-x-3 transition shadow-xs group cursor-pointer"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-xs md:text-sm font-bold text-[#0C3260] group-hover:text-[#27A4F2] transition">
                    Đăng ký nhanh bằng Tài khoản Google / Gmail
                  </span>
                </button>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-[#CFEBFC]"></div>
                  <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400 uppercase">
                    Hoặc đăng ký biểu mẫu
                  </span>
                  <div className="flex-grow border-t border-[#CFEBFC]"></div>
                </div>
              </div>

              {/* Standard Form */}
              <form onSubmit={handleManualRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                    Họ và tên cán bộ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Địa chỉ Email / Gmail <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="canbo@nghialam.gov.vn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Số điện thoại di động
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="0987xxxxxx"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Bộ phận / Phòng ban đề nghị
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        list="dept-list"
                        value={requestedDepartment}
                        onChange={(e) => setRequestedDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="VD: Bộ phận Địa chính - Xây dựng"
                      />
                      <datalist id="dept-list">
                        {departments.map((d) => (
                          <option key={d.id} value={d.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Chức vụ / Vị trí đề nghị
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={requestedPosition}
                        onChange={(e) => setRequestedPosition(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="VD: Công chức Địa chính - Nông nghiệp"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Mật khẩu khởi tạo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1 tracking-wider">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6EC2F7]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CFEBFC] focus:ring-2 focus:ring-[#27A4F2] focus:border-transparent text-sm font-medium bg-[#F0F7FD]/50 focus:bg-white text-[#0C3260]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#27A4F2] via-[#3EAEF4] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-[#27A4F2]/25 transition-all flex items-center justify-center space-x-2 mt-4 cursor-pointer hover:shadow-lg active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Gửi Đăng Ký Chờ Phê Duyệt</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#CFEBFC] text-center">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản được phê duyệt?{' '}
                  <Link to="/login" className="text-[#27A4F2] hover:text-[#1864AB] font-bold">
                    Đăng nhập tại đây
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gmail Input Dialog */}
      {gmailPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFEBFC]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="w-6 h-6 text-[#27A4F2]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Đăng Ký Bằng Tài Khoản Gmail</h3>
                <p className="text-xs text-slate-500">Nhập thông tin Gmail của đồng chí</p>
              </div>
            </div>

            <form onSubmit={handleGoogleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                  Địa chỉ Gmail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-sm focus:ring-2 focus:ring-[#27A4F2]"
                  placeholder="canbo.nghialam@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                  Họ và tên cán bộ
                </label>
                <input
                  type="text"
                  value={gmailName}
                  onChange={(e) => setGmailName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-sm focus:ring-2 focus:ring-[#27A4F2]"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#0C3260] mb-1">
                  Đơn vị / Vị trí đề nghị
                </label>
                <input
                  type="text"
                  value={requestedPosition}
                  onChange={(e) => setRequestedPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CFEBFC] text-sm focus:ring-2 focus:ring-[#27A4F2]"
                  placeholder="VD: Cán bộ Địa chính - Xây dựng"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGmailPromptOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#27A4F2] hover:bg-[#1864AB] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {loading ? 'Đang gửi...' : 'Gửi Đăng Ký Gmail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
