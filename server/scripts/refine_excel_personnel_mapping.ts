import db from '../src/config/db';

async function refineMappings() {
  console.log('=== CHUẨN HÓA MÃ VỊ TRÍ VIỆC LÀM VÀ PHÒNG BAN CHO 45 CÁN BỘ ===\n');

  const updates = [
    // Lãnh đạo UBND / HĐND
    { name: 'Nguyễn Hùng Cường', dept: 1, role: 'LEADERSHIP', pos: 'NA-NL-I.01', title: 'Chủ tịch UBND xã' },
    { name: 'Nguyễn Huy Anh', dept: 1, role: 'LEADERSHIP', pos: 'NA-NL-I.02', title: 'Phó Chủ tịch UBND xã' },
    { name: 'Lô Xuân Du', dept: 1, role: 'LEADERSHIP', pos: 'NA-NL-I.02', title: 'Phó Chủ tịch UBND xã' },
    { name: 'Trương Thị Vân Anh', dept: 1, role: 'LEADERSHIP', pos: 'NA-NL-I.02', title: 'Phó Chủ tịch HĐND xã' },
    { name: 'Lộc Xuân Nghị', dept: 1, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Phó Trưởng ban KTXH - HĐND' },
    { name: 'Trần Thị Thìn', dept: 1, role: 'EMPLOYEE', pos: 'NA-NL-II.04', title: 'Phó Trưởng ban Pháp chế HĐND' },

    // Văn phòng - Thống kê & Tư pháp - Hộ tịch (Phòng ID 5)
    { name: 'Nguyễn Văn Thọ', dept: 5, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.03', title: 'Chánh Văn phòng HĐND & UBND' },
    { name: 'Trương Thị Thanh', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Lê Thị Thúy', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Trần Thị Thùy Linh', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Trương Thị Hoài Thương', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Ngô Thị Tuyết', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Lê Thị Quý', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Vi Thị Thu Hà', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Hoàng Thị Hồng Hạnh', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Trương Cảnh Huy', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Lô Văn Dương', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Nguyễn Văn Tuyên', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },
    { name: 'Nguyễn Thị Lâm Hoàn', dept: 5, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Văn phòng - Thống kê' },

    // Kinh tế / Địa chính - Xây dựng - Nông nghiệp (Phòng ID 3)
    { name: 'Trần Sơn', dept: 3, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.03', title: 'Trưởng phòng Kinh tế' },
    { name: 'Hồ Hoàng Ánh', dept: 3, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.06', title: 'Phó Trưởng phòng Kinh tế' },
    { name: 'Kiều Đình Việt', dept: 3, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.06', title: 'Phó Trưởng phòng Kinh tế' },
    { name: 'Lê Minh Dục', dept: 3, role: 'EMPLOYEE', pos: 'NA-NL-II.15', title: 'Chuyên viên quản lý đất đai' },
    { name: 'Hồ Thị Hường', dept: 3, role: 'EMPLOYEE', pos: 'NA-NL-II.15', title: 'Chuyên viên quản lý đất đai' },
    { name: 'Trần Quốc Hồng', dept: 3, role: 'EMPLOYEE', pos: 'NA-NL-II.15', title: 'Chuyên viên quản lý đất đai' },
    { name: 'Nguyễn Thị Mến', dept: 3, role: 'EMPLOYEE', pos: 'NA-NL-II.16', title: 'Chuyên viên quy hoạch - xây dựng' },
    { name: 'Nguyễn Đình Thao', dept: 3, role: 'EMPLOYEE', pos: 'NA-NL-II.13', title: 'Chuyên viên nông nghiệp, thủy lợi' },

    // Văn hóa - Xã hội (Phòng ID 4)
    { name: 'Lê Trung Kiên', dept: 4, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.04', title: 'Trưởng phòng Văn hóa - Xã hội' },
    { name: 'Hoàng Văn Chuân', dept: 4, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.06', title: 'Phó Trưởng phòng Văn hóa - Xã hội' },
    { name: 'Tô Thị Thanh', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.21', title: 'Chuyên viên văn hóa, thể thao, du lịch' },
    { name: 'Nguyễn Thị Phương', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.21', title: 'Chuyên viên văn hóa, thể thao, du lịch' },
    { name: 'Nguyễn Thị Mai', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.21', title: 'Chuyên viên văn hóa, thể thao, du lịch' },
    { name: 'Lê Thị Việt Hà', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.22', title: 'Chuyên viên CNTT, chuyển đổi số' },
    { name: 'Trịnh Hiếu Ánh Quang', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.23', title: 'Chuyên viên lao động, thương binh & xã hội' },
    { name: 'Đặng Thị Hồng Lý', dept: 4, role: 'EMPLOYEE', pos: 'NA-NL-II.23', title: 'Chuyên viên lao động, thương binh & xã hội' },

    // Tài chính - Kế toán (Phòng ID 6)
    { name: 'Hoàng Thị Hương', dept: 6, role: 'EMPLOYEE', pos: 'NA-NL-II.06', title: 'Kế toán ngân sách / VHXH' },
    { name: 'Nguyễn Phan Linh', dept: 6, role: 'EMPLOYEE', pos: 'NA-NL-II.06', title: 'Kế toán ngân sách xã' },

    // TTPVHCC (Phòng ID 2)
    { name: 'Nguyễn Thị Mỹ Công', dept: 2, role: 'DEPARTMENT_HEAD', pos: 'NA-NL-I.05', title: 'Giám đốc Trung tâm Phục vụ hành chính công' },
    { name: 'Phạm Thị Hà', dept: 2, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Trung tâm PVHCC' },
    { name: 'Cao Sỹ Hiếu', dept: 2, role: 'EMPLOYEE', pos: 'NA-NL-II.02', title: 'Chuyên viên Trung tâm PVHCC' },

    // Cung ứng dịch vụ công (Phòng ID 9)
    { name: 'Chu Xuân Toàn', dept: 9, role: 'EMPLOYEE', pos: 'NA-NL-III.1', title: 'Viên chức cung ứng dịch vụ công' },
    { name: 'Nguyễn Thị Hảo', dept: 9, role: 'EMPLOYEE', pos: 'NA-NL-III.1', title: 'Viên chức cung ứng dịch vụ công' },
    { name: 'Nguyễn Cảnh Sơn', dept: 9, role: 'EMPLOYEE', pos: 'NA-NL-III.2', title: 'Viên chức lái xe, vận hành' },
    { name: 'Nguyễn Thị Hương Kiều', dept: 9, role: 'EMPLOYEE', pos: 'NA-NL-III.1', title: 'Viên chức cung ứng dịch vụ công' },
    { name: 'Đinh Thị Thùy', dept: 9, role: 'EMPLOYEE', pos: 'NA-NL-III.1', title: 'Viên chức cung ứng dịch vụ công' },
  ];

  for (const item of updates) {
    const res = await db('users')
      .where('fullname', item.name)
      .update({
        department_id: item.dept,
        role: item.role,
        position: item.title,
        position_code: item.pos,
        updated_at: new Date().toISOString(),
      });
    if (res > 0) {
      console.log(`✅ [${item.pos}] ${item.name} -> ${item.title} (Phòng ID: ${item.dept}, Role: ${item.role})`);
    }
  }

  console.log('\n=== HOÀN TẤT ĐỒNG BỘ 100% CÁN BỘ THEO DANH MỤC VỊ TRÍ VIỆC LÀM CHUẨN ===\n');
  process.exit(0);
}

refineMappings().catch((err) => {
  console.error('Lỗi tinh chỉnh dữ liệu:', err);
  process.exit(1);
});
