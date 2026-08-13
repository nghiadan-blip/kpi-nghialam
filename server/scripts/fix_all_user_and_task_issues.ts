import db from '../src/config/db';

async function fixData() {
  console.log('=== CHUẨN HÓA VÀ CỐ ĐỊNH CSDL CÁN BỘ & NHIỆM VỤ XÃ NGHĨA LÂM ===\n');

  // 1. Fix User 9: Trần Thị Thu (Chuyên viên văn phòng -> Phòng 5)
  await db('users')
    .where('id', 9)
    .orWhere('username', 'canbogmail1786505037648')
    .update({
      username: 'tranthithu',
      fullname: 'Trần Thị Thu',
      email: 'tranthithu@nghialam.nghean.gov.vn',
      department_id: 5, // Bộ phận Văn phòng - Thống kê & Tư pháp - Hộ tịch
      role: 'EMPLOYEE',
      position: 'Chuyên viên lĩnh vực văn phòng',
      position_code: 'NA-NL-II.02',
    });
  console.log('✅ Đã chuẩn hóa cán bộ: Trần Thị Thu -> Phòng Văn phòng - Thống kê (ID 5)');

  // 2. Fix User 10: Lê Văn Thắng (Chuyên viên tư pháp -> Phòng 5, Role EMPLOYEE)
  await db('users')
    .where('id', 10)
    .orWhere('username', 'thangle')
    .update({
      department_id: 5, // Bộ phận Văn phòng - Thống kê & Tư pháp - Hộ tịch
      role: 'EMPLOYEE',
      position: 'Chuyên viên lĩnh vực tư pháp',
      position_code: 'NA-NL-II.04',
    });
  console.log('✅ Đã chuẩn hóa cán bộ: Lê Văn Thắng -> Phòng Văn phòng - Thống kê (ID 5), Vai trò: Công chức');

  // 3. Fix User 11: Hoàng Thị Dung (Chuyên viên tài chính -> Phòng 6)
  await db('users')
    .where('id', 11)
    .orWhere('username', 'dunghoang')
    .update({
      department_id: 6, // Bộ phận Tài chính - Kế toán
      role: 'EMPLOYEE',
      position: 'Chuyên viên lĩnh vực tài chính',
      position_code: 'NA-NL-II.06',
    });
  console.log('✅ Đã chuẩn hóa cán bộ: Hoàng Thị Dung -> Phòng Tài chính - Kế toán (ID 6)');

  // 4. Fix User 14: Nguyễn Văn Mới (Chuyên viên nông nghiệp)
  await db('users')
    .where('id', 14)
    .orWhere('username', 'like', 'canbotest%')
    .update({
      username: 'nguyenvanmoi',
      fullname: 'Nguyễn Văn Mới',
      email: 'nguyenvanmoi@nghialam.nghean.gov.vn',
      department_id: 3, // Bộ phận Địa chính - Xây dựng - Nông nghiệp & Môi trường
      role: 'EMPLOYEE',
      position: 'Chuyên viên nông nghiệp, thủy lợi, PCTT',
      position_code: 'NA-NL-II.13',
    });
  console.log('✅ Đã chuẩn hóa cán bộ: Nguyễn Văn Mới -> Username nguyenvanmoi, email công vụ');

  // 5. Fix User 16: Nguyễn Văn Đan (Chuyên viên KSTTHC -> Phòng 5, Role EMPLOYEE)
  await db('users')
    .where('id', 16)
    .orWhere('username', 'nghiadan')
    .update({
      username: 'nguyenvandan',
      fullname: 'Nguyễn Văn Đan',
      email: 'nguyenvandan@nghialam.nghean.gov.vn',
      department_id: 5, // Bộ phận Văn phòng - Thống kê
      role: 'EMPLOYEE',
      position: 'Chuyên viên kiểm soát TTHC, chính quyền điện tử',
      position_code: 'NA-NL-II.25',
    });
  console.log('✅ Đã chuẩn hóa cán bộ: Nguyễn Văn Đan -> Username nguyenvandan, Phòng 5, Role EMPLOYEE');

  // 6. Delete duplicate task ID 7
  await db('tasks').where('id', 7).del();
  console.log('✅ Đã xóa bản ghi nhiệm vụ trùng lặp ID 7.');

  // 7. Verify all users
  const finalUsers = await db('users as u')
    .leftJoin('departments as d', 'u.department_id', 'd.id')
    .select('u.id', 'u.username', 'u.fullname', 'u.position', 'u.role', 'd.name as department_name');
  
  console.log('\n--- DANH SÁCH CÁN BỘ SAU KHI CHUẨN HÓA ---');
  finalUsers.forEach((u) => {
    console.log(`[${u.id}] ${u.fullname} (${u.username}) - ${u.position} -> ${u.department_name || 'N/A'} [${u.role}]`);
  });

  process.exit(0);
}

fixData().catch((err) => {
  console.error('Lỗi chuẩn hóa dữ liệu:', err);
  process.exit(1);
});
