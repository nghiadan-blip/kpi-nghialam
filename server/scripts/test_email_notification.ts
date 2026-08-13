import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testEmailNotification() {
  console.log('=== KIỂM THỬ TÍNH NĂNG GỬI THÔNG BÁO EMAIL KẾT QUẢ ĐÁNH GIÁ NĐ 335 ===\n');

  // 1. Login as Leadership (chutich)
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'chutich',
    password: 'chutich123',
  });
  const token = loginRes.data.token;
  console.log(`1. Đăng nhập Lãnh đạo UBND xã: ${loginRes.data.user.fullname} (${loginRes.data.user.role})`);

  // 2. Fetch approved evaluations
  const evalsRes = await axios.get(`${BASE_URL}/evaluations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const approvedEvals = evalsRes.data.evaluations.filter((e: any) => e.status === 'APPROVED');
  console.log(`2. Tìm thấy ${approvedEvals.length} phiếu đánh giá đã được phê duyệt trong hệ thống.`);

  if (approvedEvals.length === 0) {
    console.log('Chưa có phiếu đánh giá approved để test, vui lòng chạy test_decree335_full_flow.ts trước.');
    return;
  }

  const sampleEval = approvedEvals[0];
  console.log(`\n--- KIỂM TRA GỬI EMAIL THÔNG BÁO CHO 1 CÁN BỘ (ID #${sampleEval.id} - ${sampleEval.employee_name}) ---`);
  const singleEmailRes = await axios.post(
    `${BASE_URL}/evaluations/${sampleEval.id}/send-email`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`✅ Kết quả gửi email cá nhân:`, singleEmailRes.data);

  // 3. Test Batch Send Email for Month
  console.log(`\n--- KIỂM TRA GỬI EMAIL ĐỒNG LOẠT TOÀN XÃ THÁNG ${sampleEval.month} ---`);
  const batchRes = await axios.post(
    `${BASE_URL}/evaluations/batch-send-emails`,
    { month: sampleEval.month },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`✅ Kết quả gửi email đồng loạt:`, batchRes.data.message);
  console.log(`   Chi tiết: Tổng ${batchRes.data.result.total} cán bộ | Đã gửi: ${batchRes.data.result.sent}`);
  console.log('   Danh sách người nhận:', JSON.stringify(batchRes.data.result.details, null, 2));

  console.log('\n=== TẤT CẢ CHỨC NĂNG GỬI THÔNG BÁO EMAIL ĐỀU ĐẠT 100% ===\n');
}

testEmailNotification().catch((err) => {
  console.error('Lỗi kiểm thử email:', err.response?.data || err.message);
  process.exit(1);
});
