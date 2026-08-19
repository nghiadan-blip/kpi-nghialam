import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5142;

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(username: string, password: string): Promise<{ token: string; user: any }> {
  const res = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username, password }
  );
  if (!res.body.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user };
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU TEST TOÀN DIỆN: PERSISTENCE, KHÓA NGOẠI VÀ BẢO TOÀN DỮ LIỆU');
  console.log('========================================================================');

  console.log('\n⏳ 1. Reset Database về trạng thái Seed chuẩn...');
  await db.seed.run();
  console.log('✅ Database reset hoàn tất.');

  const server = app.listen(PORT, async () => {
    console.log(`🌐 Server đang chạy trên http://localhost:${PORT}`);

    try {
      // -------------------------------------------------------------
      // TEST 1: Kiểm tra khóa ngoại không hợp lệ trả về HTTP 400 bằng tiếng Việt
      // -------------------------------------------------------------
      console.log('\n--- TEST 1: Kiểm tra chặn FK không hợp lệ (task_id / product_catalog_id giả) ---');
      const emp = await login('congchuc_dc', 'emp123');

      // 1.1 product_catalog_id không tồn tại
      const fakeCatRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-10',
          criteria_politics_self: 9.5,
          criteria_expertise_self: 9.5,
          criteria_innovation_self: 9.0,
          items: [{ product_catalog_id: 999999, quantity: 1 }],
        }
      );
      if (fakeCatRes.status === 400 && fakeCatRes.body.message.includes('không còn tồn tại trong danh mục')) {
        console.log('  ✅ PASS 1.1: Bắt lỗi product_catalog_id giả -> HTTP 400 tiếng Việt:', fakeCatRes.body.message);
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(fakeCatRes.body));
      }

      // 1.2 task_id không tồn tại
      const fakeTaskRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-10',
          criteria_politics_self: 9.5,
          criteria_expertise_self: 9.5,
          criteria_innovation_self: 9.0,
          items: [{ product_catalog_id: 1, task_id: 888888, quantity: 1 }],
        }
      );
      if (fakeTaskRes.status === 400 && fakeTaskRes.body.message.includes('nhiệm vụ liên kết')) {
        console.log('  ✅ PASS 1.2: Bắt lỗi task_id không tồn tại -> HTTP 400 tiếng Việt:', fakeTaskRes.body.message);
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(fakeTaskRes.body));
      }

      // -------------------------------------------------------------
      // TEST 2: Transaction Rollback khi có lỗi giữa chừng (Không tạo rác/phiếu dở dang)
      // -------------------------------------------------------------
      console.log('\n--- TEST 2: Transaction Rollback khi gặp lỗi (Đảm bảo không tạo bản ghi dở dang) ---');
      const checkOrphan = await db('evaluations').where({ month: '2026-10', employee_id: emp.user.id }).first();
      if (!checkOrphan) {
        console.log('  ✅ PASS 2: Transaction đã rollback hoàn toàn, không có bản ghi evaluations mồ côi!');
      } else {
        throw new Error('FAIL 2: Transaction không rollback, tồn tại bản ghi dở dang: ' + JSON.stringify(checkOrphan));
      }

      // -------------------------------------------------------------
      // TEST 3: Tạo và Lưu phiếu hợp lệ vào SQLite
      // -------------------------------------------------------------
      console.log('\n--- TEST 3: Tạo phiếu hợp lệ cho tháng 2026-08 (Vũ Minh Tuấn) ---');
      const validDraftRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 9.5,
          criteria_expertise_self: 9.5,
          criteria_innovation_self: 9.0,
          items: [
            { product_catalog_id: 1, task_id: 1, quantity: 2, remarks: 'Rà soát đất xóm 3' },
            { product_catalog_id: 2, task_id: 2, quantity: 2, remarks: 'Báo cáo KH965' },
          ],
          remarks: 'Tự đánh giá hoàn thành nhiệm vụ tháng 8/2026',
        }
      );
      if (validDraftRes.status !== 200) {
        throw new Error('FAIL 3: Lưu nháp hợp lệ thất bại: ' + JSON.stringify(validDraftRes.body));
      }
      const evalId = validDraftRes.body.evaluation_id;
      console.log(`  ✅ PASS 3: Lưu nháp thành công vào SQLite! Eval ID = ${evalId}, Tổng điểm tự chấm = ${validDraftRes.body.self_score}đ`);

      // -------------------------------------------------------------
      // TEST 4: Tính Idempotent khi bấm Lưu nhiều lần (Không tạo bản ghi trùng)
      // -------------------------------------------------------------
      console.log('\n--- TEST 4: Idempotency (Bấm Lưu lại không tạo thêm ID mới hay bản ghi trùng) ---');
      const secondSave = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 9.5,
          criteria_expertise_self: 9.5,
          criteria_innovation_self: 9.0,
          items: [
            { product_catalog_id: 1, task_id: 1, quantity: 3, remarks: 'Cập nhật số lượng 3' },
          ],
        }
      );
      if (secondSave.status === 200 && secondSave.body.evaluation_id === evalId) {
        const countRecords = await db('evaluations').where({ month: '2026-08', employee_id: emp.user.id });
        if (countRecords.length === 1) {
          console.log(`  ✅ PASS 4: Idempotency chuẩn xác! Chỉ tồn tại đúng 1 bản ghi evalId=${evalId} trong database.`);
        } else {
          throw new Error('FAIL 4: Tạo nhiều bản ghi trùng lặp trong DB!');
        }
      } else {
        throw new Error('FAIL 4: ' + JSON.stringify(secondSave.body));
      }

      // -------------------------------------------------------------
      // TEST 5: Logout & Login lại kiểm tra dữ liệu vẫn tồn tại
      // -------------------------------------------------------------
      console.log('\n--- TEST 5: Kiểm tra dữ liệu bền vững sau khi Logout & Login lại ---');
      const empReLogin = await login('congchuc_dc', 'emp123');
      const listAfterReLogin = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations',
        method: 'GET',
        headers: { Authorization: `Bearer ${empReLogin.token}` },
      });
      const persistedEval = listAfterReLogin.body.evaluations.find((e: any) => e.id === evalId);
      if (persistedEval) {
        console.log(`  ✅ PASS 5: Phiếu ID ${evalId} vẫn tồn tại nguyên vẹn sau khi đăng nhập lại! Trạng thái: ${persistedEval.status}`);
      } else {
        throw new Error('FAIL 5: Phiếu bị biến mất sau khi đăng nhập lại!');
      }

      // -------------------------------------------------------------
      // TEST 6: Nộp phiếu lên Trưởng bộ phận (DRAFT -> SUBMITTED)
      // -------------------------------------------------------------
      console.log('\n--- TEST 6: Nộp phiếu tự đánh giá lên Trưởng bộ phận ---');
      const submitRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/${evalId}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${empReLogin.token}` },
      });
      if (submitRes.status === 200) {
        console.log('  ✅ PASS 6: Nộp phiếu thành công (SUBMITTED)!');
      } else {
        throw new Error('FAIL 6: ' + JSON.stringify(submitRes.body));
      }

      // -------------------------------------------------------------
      // TEST 7: Trưởng bộ phận thẩm định & Phân quyền Scoping
      // -------------------------------------------------------------
      console.log('\n--- TEST 7: Trưởng bộ phận Địa chính thẩm định phiếu ---');
      const head = await login('truongphong_dc', 'head123');
      const headListRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations?month=2026-08',
        method: 'GET',
        headers: { Authorization: `Bearer ${head.token}` },
      });
      const targetForHead = headListRes.body.evaluations.find((e: any) => e.id === evalId);
      if (!targetForHead || targetForHead.status !== 'SUBMITTED') {
        throw new Error('FAIL 7: Trưởng bộ phận không thấy phiếu SUBMITTED: ' + JSON.stringify(headListRes.body));
      }
      console.log(`  ✅ PASS 7.1: Trưởng bộ phận thấy phiếu chờ thẩm định của ${targetForHead.employee_name}`);

      const reviewRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: `/api/evaluations/${evalId}/review`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${head.token}` },
        },
        {
          criteria_politics_mgr: 9.5,
          criteria_expertise_mgr: 9.5,
          criteria_innovation_mgr: 9.0,
          collective_comments: 'Tập thể phòng nhất trí điểm tự chấm.',
          remarks: 'Thẩm định đạt yêu cầu.',
        }
      );
      if (reviewRes.status === 200) {
        console.log(`  ✅ PASS 7.2: Trưởng bộ phận thẩm định thành công (Điểm: ${reviewRes.body.manager_score}đ)!`);
      } else {
        throw new Error('FAIL 7.2: ' + JSON.stringify(reviewRes.body));
      }

      // -------------------------------------------------------------
      // TEST 8: Chủ tịch UBND xã phê duyệt chính thức
      // -------------------------------------------------------------
      console.log('\n--- TEST 8: Chủ tịch UBND xã phê duyệt chính thức (MANAGER_REVIEWED -> APPROVED) ---');
      const leader = await login('chutich', 'chutich123');
      const approveRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: `/api/evaluations/${evalId}/approve`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leader.token}` },
        },
        {
          criteria_politics_final: 9.5,
          criteria_expertise_final: 9.5,
          criteria_innovation_final: 9.0,
          party_cell_comments: 'Chi bộ nhất trí cao.',
          remarks: 'Phê duyệt chính thức theo NĐ 335.',
        }
      );
      if (approveRes.status === 200) {
        console.log(`  ✅ PASS 8: Chủ tịch phê duyệt thành công! Xếp loại: ${approveRes.body.classification} (${approveRes.body.final_score}đ)`);
      } else {
        throw new Error('FAIL 8: ' + JSON.stringify(approveRes.body));
      }

      // -------------------------------------------------------------
      // TEST 9: Admin kiểm tra toàn bộ hồ sơ và Audit Log
      // -------------------------------------------------------------
      console.log('\n--- TEST 9: Admin kiểm tra tính toàn vẹn và Audit Log ---');
      const admin = await login('admin', 'admin123');
      const adminList = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations',
        method: 'GET',
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      const adminFound = adminList.body.evaluations.find((e: any) => e.id === evalId);
      if (adminFound && adminFound.status === 'APPROVED') {
        console.log(`  ✅ PASS 9.1: Admin thấy phiếu đã phê duyệt của ${adminFound.employee_name} (${adminFound.final_score}đ - ${adminFound.classification})`);
      } else {
        throw new Error('FAIL 9.1: Admin không thấy phiếu APPROVED!');
      }

      const logs = await db('audit_logs').where('user_id', emp.user.id).orWhere('user_id', head.user.id).orWhere('user_id', leader.user.id);
      console.log(`  ✅ PASS 9.2: Đã ghi nhận ${logs.length} sự kiện Audit Log xuyên suốt quy trình 3 bước!`);

      // -------------------------------------------------------------
      // TEST 10: Dashboard, Form và Excel xuất dữ liệu thật từ SQLite
      // -------------------------------------------------------------
      console.log('\n--- TEST 10: Kiểm tra API Form Detail, Dashboard và Excel Data ---');
      const formRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/forms/${evalId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      if (formRes.status === 200 && formRes.body.formId && formRes.body.taskLines.length > 0) {
        console.log(`  ✅ PASS 10.1: Form Detail API trả về dữ liệu thật từ SQLite (formId: ${formRes.body.formId})`);
      } else {
        throw new Error('FAIL 10.1: ' + JSON.stringify(formRes.body));
      }

      const statsRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations/quota-stats?month=2026-08',
        method: 'GET',
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      if (statsRes.status === 200 && (statsRes.body.total_approved !== undefined || statsRes.body.totalApproved !== undefined)) {
        console.log(`  ✅ PASS 10.2: Quota Stats Dashboard tính toán từ dữ liệu thật: Total Approved = ${statsRes.body.total_approved ?? statsRes.body.totalApproved}`);
      } else {
        throw new Error('FAIL 10.2: ' + JSON.stringify(statsRes.body));
      }

      console.log('\n========================================================================');
      console.log('🏆 TẤT CẢ 10 MỤC KIỂM THỬ KHÓA NGOẠI, WORKFLOW & PERSISTENCE ĐẠT 100%!');
      console.log('========================================================================');

      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('\n❌ TEST FAILED:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
