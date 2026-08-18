import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5139;

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

async function login(username: string, password: string):Promise<{ token: string; user: any }> {
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

async function runTest() {
  console.log('⏳ Running knex seed...');
  await db.seed.run();
  console.log('✅ Knex seed completed.');

  const server = app.listen(PORT, async () => {
    console.log(`🧪 Persistence E2E Test Server running on http://localhost:${PORT}`);

    try {
      console.log('\n===============================================================');
      console.log('1. KIỂM TRA TÀI KHOẢN VŨ MINH TUẤN (congchuc_dc)');
      console.log('===============================================================');
      const emp = await login('congchuc_dc', 'emp123');
      console.log(`  ✅ PASS: Đăng nhập thành công: ${emp.user.fullname} (${emp.user.role})`);

      // 1.1 Kiểm tra danh sách hồ sơ sẵn có sau seed
      const empListRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations',
        method: 'GET',
        headers: { Authorization: `Bearer ${emp.token}` },
      });
      console.log(`  Danh sách phiếu của ${emp.user.fullname}:`, empListRes.body.evaluations.map((e: any) => `${e.month} (${e.status} - ${e.final_score ?? e.self_score}đ)`));
      if (empListRes.body.evaluations.length < 2) {
        throw new Error(`FAIL 1.1: Kỳ vọng ít nhất 2 phiếu ban đầu, thực tế có ${empListRes.body.evaluations.length}`);
      }
      console.log('  ✅ PASS: Hồ sơ ban đầu hiển thị bền vững và đầy đủ!');

      // 1.2 Tạo phiếu đánh giá mới cho tháng 2026-09 (Test không bị lỗi FOREIGN KEY và không văng SQL)
      console.log('\n--- 1.2 Tạo & Nộp phiếu đánh giá mới cho tháng 2026-09 ---');
      const draftRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-09',
          criteria_politics_self: 9.5,
          criteria_expertise_self: 9.5,
          criteria_innovation_self: 9.0,
          items: [
            { product_catalog_id: 1, task_id: 1, quantity: 2, remarks: 'Soạn thảo 2 công văn' },
            { product_catalog_id: 2, task_id: 2, quantity: 2, remarks: 'Báo cáo phức tạp KH965' },
            { product_catalog_id: 3, task_id: null, quantity: 3, remarks: 'Hồ sơ HCC đúng hạn' },
          ],
          remarks: 'Bản tự đánh giá tháng 9/2026',
        }
      );

      if (draftRes.status !== 200) {
        throw new Error(`FAIL 1.2: Lưu nháp thất bại: ${JSON.stringify(draftRes.body)}`);
      }
      const evalId = draftRes.body.evaluation_id;
      console.log(`  ✅ PASS: Lưu nháp thành công (ID: ${evalId}, Tổng điểm: ${draftRes.body.self_score}đ, Phần II: ${draftRes.body.task_score}đ)`);

      // 1.3 Nộp phiếu lên Trưởng bộ phận
      const submitRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/${evalId}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${emp.token}` },
      });
      if (submitRes.status !== 200) {
        throw new Error(`FAIL 1.3: Nộp phiếu thất bại: ${JSON.stringify(submitRes.body)}`);
      }
      console.log('  ✅ PASS: Nộp phiếu lên Trưởng bộ phận thành công (SUBMITTED)!');

      console.log('\n===============================================================');
      console.log('2. KIỂM TRA TÀI KHOẢN TRƯỞNG BỘ PHẬN (truongphong_dc)');
      console.log('===============================================================');
      const mgr = await login('truongphong_dc', 'head123');
      console.log(`  ✅ PASS: Đăng nhập thành công: ${mgr.user.fullname} (${mgr.user.role})`);

      // 2.1 Trưởng bộ phận thấy phiếu SUBMITTED của Vũ Minh Tuấn
      const mgrListRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations?month=2026-09',
        method: 'GET',
        headers: { Authorization: `Bearer ${mgr.token}` },
      });
      const targetEval = mgrListRes.body.evaluations.find((e: any) => e.id === evalId);
      if (!targetEval || targetEval.status !== 'SUBMITTED') {
        throw new Error(`FAIL 2.1: Trưởng bộ phận không thấy phiếu SUBMITTED của Vũ Minh Tuấn: ${JSON.stringify(mgrListRes.body)}`);
      }
      console.log(`  ✅ PASS: Trưởng bộ phận thấy phiếu ID ${evalId} của ${targetEval.employee_name} (${targetEval.status})`);

      // 2.2 Trưởng bộ phận thẩm định phiếu (SUBMITTED -> MANAGER_REVIEWED)
      const reviewRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: `/api/evaluations/${evalId}/review`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgr.token}` },
        },
        {
          criteria_politics_mgr: 9.5,
          criteria_expertise_mgr: 9.5,
          criteria_innovation_mgr: 9.0,
          collective_comments: 'Tập thể thống nhất đồng ý kết quả tự chấm của đồng chí Tuấn.',
          remarks: 'Thẩm định đạt yêu cầu.',
        }
      );
      if (reviewRes.status !== 200) {
        throw new Error(`FAIL 2.2: Thẩm định thất bại: ${JSON.stringify(reviewRes.body)}`);
      }
      console.log(`  ✅ PASS: Trưởng bộ phận thẩm định thành công (MANAGER_REVIEWED - Điểm TP: ${reviewRes.body.manager_score}đ)`);

      console.log('\n===============================================================');
      console.log('3. KIỂM TRA TÀI KHOẢN CHỦ TỊCH UBND XÃ (chutich)');
      console.log('===============================================================');
      const leader = await login('chutich', 'chutich123');
      console.log(`  ✅ PASS: Đăng nhập thành công: ${leader.user.fullname} (${leader.user.role})`);

      // 3.1 Chủ tịch thấy phiếu MANAGER_REVIEWED
      const leaderListRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations?month=2026-09',
        method: 'GET',
        headers: { Authorization: `Bearer ${leader.token}` },
      });
      const leaderTarget = leaderListRes.body.evaluations.find((e: any) => e.id === evalId);
      if (!leaderTarget || leaderTarget.status !== 'MANAGER_REVIEWED') {
        throw new Error(`FAIL 3.1: Chủ tịch không thấy phiếu MANAGER_REVIEWED: ${JSON.stringify(leaderListRes.body)}`);
      }
      console.log(`  ✅ PASS: Chủ tịch thấy phiếu ID ${evalId} chờ duyệt của ${leaderTarget.employee_name}`);

      // 3.2 Chủ tịch phê duyệt chính thức (MANAGER_REVIEWED -> APPROVED)
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
          party_cell_comments: 'Chi bộ đánh giá hoàn thành tốt nhiệm vụ.',
          remarks: 'Phê duyệt kết quả chính thức theo Nghị định 335.',
        }
      );
      if (approveRes.status !== 200) {
        throw new Error(`FAIL 3.2: Phê duyệt thất bại: ${JSON.stringify(approveRes.body)}`);
      }
      console.log(`  ✅ PASS: Chủ tịch phê duyệt thành công! Xếp loại: ${approveRes.body.classification} (${approveRes.body.final_score}đ)`);

      console.log('\n===============================================================');
      console.log('4. KIỂM TRA TÍNH BỀN VỮNG TRÊN TÀI KHOẢN ADMIN');
      console.log('===============================================================');
      const admin = await login('admin', 'admin123');
      const adminListRes = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations',
        method: 'GET',
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      console.log(`  Tổng số phiếu toàn hệ thống hiển thị cho Admin: ${adminListRes.body.evaluations.length}`);
      const approvedTuan = adminListRes.body.evaluations.find((e: any) => e.id === evalId);
      if (!approvedTuan || approvedTuan.status !== 'APPROVED') {
        throw new Error(`FAIL 4: Admin không thấy phiếu đã duyệt của Vũ Minh Tuấn: ${JSON.stringify(adminListRes.body)}`);
      }
      console.log(`  ✅ PASS: Dữ liệu lưu bền vững 100% trên SQLite! Phiếu của Vũ Minh Tuấn: ${approvedTuan.month} (${approvedTuan.status} - ${approvedTuan.final_score}đ - ${approvedTuan.classification})`);

      console.log('\n===============================================================');
      console.log('🎉 TẤT CẢ CÁC BƯỚC QUY TRÌNH 3 CẤP & LƯU TRỮ DỮ LIỆU ĐỀU ĐẠT 100%!');
      console.log('===============================================================');

      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('\n❌ TEST FAILED:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runTest();
