import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5145;

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

async function runUATTests() {
  console.log('========================================================================');
  console.log('🏛️ BẮT ĐẦU KIỂM THỬ UAT NĐ 335: CÁC KỊCH BẢN THỰC TẾ & BẢO TOÀN ĐIỂM SỐ');
  console.log('========================================================================');

  await db.seed.run();
  console.log('✅ Database reset hoàn tất.');

  const server = app.listen(PORT, async () => {
    console.log(`🌐 UAT Server running on http://localhost:${PORT}`);

    try {
      const emp = await login('congchuc_dc', 'emp123');
      const leader = await login('chutich', 'chutich123');

      // -------------------------------------------------------------
      // UAT Case 1: Tự chấm 5 điểm không được tự phóng đại lên 70đ
      // -------------------------------------------------------------
      console.log('\n--- UAT 1: Tự chấm 1 sản phẩm 5đ (Phần I = 30đ) -> Phần II = 5/70, Tổng = 35/100 ---');
      const uat1Res = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 10.0,
          criteria_expertise_self: 10.0,
          criteria_innovation_self: 10.0,
          items: [
            { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: '1 văn bản hành chính' },
          ],
        }
      );
      if (uat1Res.status === 200 && uat1Res.body.task_score === 5.0 && uat1Res.body.self_score === 35.0) {
        console.log(`  ✅ PASS UAT 1: Phần II = ${uat1Res.body.task_score}/70đ, Tổng = ${uat1Res.body.self_score}/100đ (KHÔNG bị tự phóng đại lên 70đ)!`);
      } else {
        throw new Error('FAIL UAT 1: ' + JSON.stringify(uat1Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 2: Thay đổi số lượng 1 -> 5
      // -------------------------------------------------------------
      console.log('\n--- UAT 2: Thay đổi số lượng sản phẩm từ 1 -> 5 ---');
      const uat2Res = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 10.0,
          criteria_expertise_self: 10.0,
          criteria_innovation_self: 10.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0, remarks: '5 văn bản hành chính' },
          ],
        }
      );
      if (uat2Res.status === 200 && uat2Res.body.task_score === 25.0 && uat2Res.body.self_score === 55.0) {
        console.log(`  ✅ PASS UAT 2: Điểm tự động tăng theo số lượng: Phần II = ${uat2Res.body.task_score}/70đ, Tổng = ${uat2Res.body.self_score}/100đ`);
      } else {
        throw new Error('FAIL UAT 2: ' + JSON.stringify(uat2Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 3: Thêm và xóa sản phẩm
      // -------------------------------------------------------------
      console.log('\n--- UAT 3: Thêm dòng thứ hai (15đ) và sau đó xóa bỏ ---');
      const addRowRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 10.0,
          criteria_expertise_self: 10.0,
          criteria_innovation_self: 10.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0 },
            { product_catalog_id: 2, quantity: 2, self_points: 15.0 },
          ],
        }
      );
      if (addRowRes.status === 200 && addRowRes.body.task_score === 40.0 && addRowRes.body.self_score === 70.0) {
        console.log(`  ✅ PASS UAT 3.1 (Thêm dòng): Phần II = ${addRowRes.body.task_score}/70đ, Tổng = ${addRowRes.body.self_score}/100đ`);
      } else {
        throw new Error('FAIL UAT 3.1: ' + JSON.stringify(addRowRes.body));
      }

      const removeRowRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 10.0,
          criteria_expertise_self: 10.0,
          criteria_innovation_self: 10.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0 },
          ],
        }
      );
      if (removeRowRes.status === 200 && removeRowRes.body.task_score === 25.0 && removeRowRes.body.self_score === 55.0) {
        console.log(`  ✅ PASS UAT 3.2 (Xóa dòng): Phần II quay về đúng = ${removeRowRes.body.task_score}/70đ`);
      } else {
        throw new Error('FAIL UAT 3.2: ' + JSON.stringify(removeRowRes.body));
      }

      // -------------------------------------------------------------
      // UAT Case 4: Khóa kỳ và mở khóa có Audit Log
      // -------------------------------------------------------------
      console.log('\n--- UAT 4: Khóa kỳ đánh giá & Mở khóa kèm Audit Log ---');
      const lockRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/periods/lock',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leader.token}` },
        },
        { month: '2026-08' }
      );
      if (lockRes.status === 200) {
        console.log('  ✅ PASS UAT 4.1: Lãnh đạo khóa kỳ đánh giá tháng 2026-08 thành công!');
      } else {
        throw new Error('FAIL UAT 4.1: ' + JSON.stringify(lockRes.body));
      }

      // Kiểm tra chặn sửa đổi khi đã khóa
      const editLockedRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/draft',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emp.token}` },
        },
        {
          month: '2026-08',
          criteria_politics_self: 10.0,
          items: [{ product_catalog_id: 1, quantity: 1 }],
        }
      );
      if (editLockedRes.status === 400 && editLockedRes.body.message.includes('đã bị khóa')) {
        console.log('  ✅ PASS UAT 4.2: Hệ thống chặn chỉnh sửa khi kỳ bị khóa:', editLockedRes.body.message);
      } else {
        throw new Error('FAIL UAT 4.2: ' + JSON.stringify(editLockedRes.body));
      }

      // Mở khóa kỳ
      const unlockRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/evaluations/periods/unlock',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leader.token}` },
        },
        { month: '2026-08' }
      );
      if (unlockRes.status === 200) {
        console.log('  ✅ PASS UAT 4.3: Lãnh đạo mở khóa kỳ đánh giá thành công!');
      } else {
        throw new Error('FAIL UAT 4.3: ' + JSON.stringify(unlockRes.body));
      }

      // Kiểm tra Audit Log có ghi nhận LOCK_PERIOD và UNLOCK_PERIOD
      const lockLogs = await db('audit_logs').whereIn('action', ['LOCK_PERIOD', 'UNLOCK_PERIOD']);
      if (lockLogs.length >= 2) {
        console.log(`  ✅ PASS UAT 4.4: Đã lưu vết ${lockLogs.length} sự kiện Audit Log cho thao tác Khóa / Mở khóa kỳ!`);
      } else {
        throw new Error('FAIL UAT 4.4: Không tìm thấy Audit Log cho lock/unlock!');
      }

      console.log('\n========================================================================');
      console.log('🏆 TẤT CẢ CÁC KỊCH BẢN UAT THỰC TẾ NĐ 335 ĐÃ VƯỢT QUA 100%!');
      console.log('========================================================================');

      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('\n❌ UAT FAILED:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runUATTests();
