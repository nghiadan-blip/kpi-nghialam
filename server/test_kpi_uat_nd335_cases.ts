import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5146;

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
  console.log('🏛️ BẮT ĐẦU KIỂM THỬ UAT CHUẨN NGHỊ ĐỊNH 335 (ND335_OFFICIAL_ABC)');
  console.log('========================================================================');

  await db.seed.run();
  console.log('✅ Database reset hoàn tất.');

  const server = app.listen(PORT, async () => {
    console.log(`🌐 UAT Server running on http://localhost:${PORT}`);

    try {
      const emp = await login('congchuc_dc', 'emp123');
      const leader = await login('chutich', 'chutich123');

      // -------------------------------------------------------------
      // UAT Case 1: Giao 1, hoàn thành 1, đạt chất lượng, đúng tiến độ -> 70/70đ
      // -------------------------------------------------------------
      console.log('\n--- UAT 1: Giao 1, Hoàn thành 1 (Phần I = 30đ) -> a=100%, b=100%, c=100% -> Phần II = 70/70đ, Tổng = 100/100đ ---');
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
            { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, remarks: '1 văn bản hành chính đúng hạn' },
          ],
        }
      );
      if (uat1Res.status === 200 && uat1Res.body.task_score === 70.0 && uat1Res.body.self_score === 100.0) {
        console.log(`  ✅ PASS UAT 1: Phần II = ${uat1Res.body.task_score}/70đ, Tổng = ${uat1Res.body.self_score}/100đ (Chính xác theo NĐ 335 tỷ lệ 100%)!`);
      } else {
        throw new Error('FAIL UAT 1: ' + JSON.stringify(uat1Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 2: Đổi số lượng từ 1 -> 5 (Giao 5, Hoàn thành 5) -> Tỷ lệ vẫn là 100%, Điểm vẫn 70/70
      // -------------------------------------------------------------
      console.log('\n--- UAT 2: Giao 5, Hoàn thành 5 -> Tỷ lệ hoàn thành vẫn là 100% -> Phần II = 70/70đ (Không tự tăng điểm tùy tiện) ---');
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
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 5, remarks: '5 văn bản hành chính đúng hạn' },
          ],
        }
      );
      if (uat2Res.status === 200 && uat2Res.body.task_score === 70.0 && uat2Res.body.self_score === 100.0) {
        console.log(`  ✅ PASS UAT 2: Tỷ lệ 5/5 = 100%, Phần II = ${uat2Res.body.task_score}/70đ, Tổng = ${uat2Res.body.self_score}/100đ`);
      } else {
        throw new Error('FAIL UAT 2: ' + JSON.stringify(uat2Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 3: Giao 5 nhưng chỉ hoàn thành 1 (1/5) -> Tỷ lệ 20% -> Phần II = 14/70đ
      // -------------------------------------------------------------
      console.log('\n--- UAT 3: Giao 5 nhưng chỉ hoàn thành 1 (1/5) -> Tỷ lệ 20% -> Phần II = 14/70đ, Tổng = 44/100đ ---');
      const uat3Res = await request(
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
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 1, remarks: 'Chỉ hoàn thành 1/5 văn bản' },
          ],
        }
      );
      if (uat3Res.status === 200 && uat3Res.body.task_score === 14.0 && uat3Res.body.self_score === 44.0) {
        console.log(`  ✅ PASS UAT 3: Tỷ lệ 1/5 = 20%, Phần II = ${uat3Res.body.task_score}/70đ, Tổng = ${uat3Res.body.self_score}/100đ (< 50đ Không hoàn thành)!`);
      } else {
        throw new Error('FAIL UAT 3: ' + JSON.stringify(uat3Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 4: Giao 5 nhưng hoàn thành 0 (0/5) -> Phần II = 0/70đ
      // -------------------------------------------------------------
      console.log('\n--- UAT 4: Giao 5 nhưng hoàn thành 0 (0/5) -> Phần II = 0/70đ, Tổng = 30/100đ ---');
      const uat4Res = await request(
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
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 0, remarks: 'Chưa hoàn thành văn bản nào' },
          ],
        }
      );
      if (uat4Res.status === 200 && uat4Res.body.task_score === 0.0 && uat4Res.body.self_score === 30.0) {
        console.log(`  ✅ PASS UAT 4: Tỷ lệ 0/5 = 0%, Phần II = ${uat4Res.body.task_score}/70đ, Tổng = ${uat4Res.body.self_score}/100đ`);
      } else {
        throw new Error('FAIL UAT 4: ' + JSON.stringify(uat4Res.body));
      }

      // -------------------------------------------------------------
      // UAT Case 5: Khóa kỳ và mở khóa có Audit Log
      // -------------------------------------------------------------
      console.log('\n--- UAT 5: Khóa kỳ đánh giá & Mở khóa kèm Audit Log ---');
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
        console.log('  ✅ PASS UAT 5.1: Lãnh đạo khóa kỳ đánh giá tháng 2026-08 thành công!');
      } else {
        throw new Error('FAIL UAT 5.1: ' + JSON.stringify(lockRes.body));
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
        console.log('  ✅ PASS UAT 5.2: Hệ thống chặn chỉnh sửa khi kỳ bị khóa:', editLockedRes.body.message);
      } else {
        throw new Error('FAIL UAT 5.2: ' + JSON.stringify(editLockedRes.body));
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
        console.log('  ✅ PASS UAT 5.3: Lãnh đạo mở khóa kỳ đánh giá thành công!');
      } else {
        throw new Error('FAIL UAT 5.3: ' + JSON.stringify(unlockRes.body));
      }

      // Kiểm tra Audit Log có ghi nhận LOCK_PERIOD và UNLOCK_PERIOD
      const lockLogs = await db('audit_logs').whereIn('action', ['LOCK_PERIOD', 'UNLOCK_PERIOD']);
      if (lockLogs.length >= 2) {
        console.log(`  ✅ PASS UAT 5.4: Đã lưu vết ${lockLogs.length} sự kiện Audit Log cho thao tác Khóa / Mở khóa kỳ!`);
      } else {
        throw new Error('FAIL UAT 5.4: Không tìm thấy Audit Log cho lock/unlock!');
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
