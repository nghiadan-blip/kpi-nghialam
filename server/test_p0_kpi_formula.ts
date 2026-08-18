import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5126;

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
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
    if (body) { req.write(JSON.stringify(body)); }
    req.end();
  });
}

async function runTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🧪 P0 KPI Test Server running on http://localhost:${PORT}`);

    try {
      // 0. Login employee (congchuc_dc), manager (truongphong_dc), and leadership (chutich)
      const empLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'congchuc_dc', password: 'emp123' }
      );
      const empToken = empLogin.body.token;

      const mgrLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'truongphong_dc', password: 'head123' }
      );
      const mgrToken = mgrLogin.body.token;

      const chairLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'chutich', password: 'chutich123' }
      );
      const chairToken = chairLogin.body.token;

      const month = '2026-08';

      // --- TEST 1: 1 dòng, tự chấm 5 điểm -> Phần II = 5/70, Tổng = 30/100 (Phần I = 25đ) ---
      console.log('\n--- Test 1: 1 sản phẩm 5 điểm -> Phần II = 5/70, Tổng = 30/100 ---');
      const draft1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0, // Tổng Phần I = 25.0
          items: [
            { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: '1 sản phẩm chuẩn 5đ' }
          ]
        }
      );

      if (draft1.status === 200 && draft1.body.task_score === 5.0 && draft1.body.self_score === 30.0) {
        console.log(`  ✅ PASS: Draft 1 saved! Task Score = ${draft1.body.task_score}/70, Self Score = ${draft1.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 1:', draft1.body);
        process.exit(1);
      }

      const evalId = draft1.body.evaluation_id;

      // --- TEST 2: Đổi số lượng từ 1 lên 5 -> Điểm dòng 25, Phần II = 25/70, Tổng = 50/100 ---
      console.log('\n--- Test 2: Đổi số lượng 1 -> 5 -> Phần II = 25/70, Tổng = 50/100 ---');
      const draft2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0, // 25.0
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0, remarks: '5 sản phẩm = 25đ' }
          ]
        }
      );

      if (draft2.status === 200 && draft2.body.task_score === 25.0 && draft2.body.self_score === 50.0) {
        console.log(`  ✅ PASS: Draft 2 updated! Task Score = ${draft2.body.task_score}/70, Self Score = ${draft2.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 2:', draft2.body);
        process.exit(1);
      }

      // --- TEST 3: Thêm dòng thứ hai (10đ) -> Tổng Phần II = 35/70, Tổng = 60/100 ---
      console.log('\n--- Test 3: Thêm dòng thứ hai (10đ) -> Phần II = 35/70, Tổng = 60/100 ---');
      const draft3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0, remarks: 'Dòng 1: 25đ' },
            { product_catalog_id: 2, quantity: 2, self_points: 10.0, remarks: 'Dòng 2: 10đ' }
          ]
        }
      );

      if (draft3.status === 200 && draft3.body.task_score === 35.0 && draft3.body.self_score === 60.0) {
        console.log(`  ✅ PASS: Draft 3 (2 dòng) -> Task Score = ${draft3.body.task_score}/70, Self Score = ${draft3.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 3:', draft3.body);
        process.exit(1);
      }

      // --- TEST 4: Xóa dòng thứ hai -> Giảm về 25/70 và 50/100 ---
      console.log('\n--- Test 4: Xóa dòng thứ hai -> Phần II = 25/70, Tổng = 50/100 ---');
      const draft4 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0, remarks: 'Dòng 1: 25đ' }
          ]
        }
      );

      if (draft4.status === 200 && draft4.body.task_score === 25.0 && draft4.body.self_score === 50.0) {
        console.log(`  ✅ PASS: Draft 4 (xóa dòng) -> Task Score = ${draft4.body.task_score}/70, Self Score = ${draft4.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 4:', draft4.body);
        process.exit(1);
      }

      // --- TEST 5: Tổng điểm vượt 70 -> Giới hạn trần 70/70, Tổng = 95/100 ---
      console.log('\n--- Test 5: Điểm Phần II vượt 70 (80đ) -> Giới hạn trần 70/70 ---');
      const draft5 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0, // 25đ
          items: [
            { product_catalog_id: 1, quantity: 16, self_points: 80.0, remarks: '16 sản phẩm = 80đ (>70)' }
          ]
        }
      );

      if (draft5.status === 200 && draft5.body.task_score === 70.0 && draft5.body.self_score === 95.0) {
        console.log(`  ✅ PASS: Task Score correctly capped at 70/70! Total = ${draft5.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 5:', draft5.body);
        process.exit(1);
      }

      // Reset back to 25đ Part II (Total 50đ) for workflow testing
      await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0,
          items: [
            { product_catalog_id: 1, quantity: 5, self_points: 25.0, remarks: '5 sản phẩm = 25đ' }
          ]
        }
      );

      // --- TEST 6: Đồng bộ số liệu giữa GET chi tiết, danh sách và Form ---
      console.log('\n--- Test 6: Kiểm tra đồng bộ dữ liệu giữa Form, Chi tiết và Danh sách ---');
      const detailRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );
      const listRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations?month=${month}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );
      const formRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/forms/${evalId}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );

      const dScore = detailRes.body.evaluation.self_score;
      const lScore = listRes.body.evaluations.find((e: any) => e.id === evalId)?.self_score;
      const fScore = formRes.body.totalScore;

      if (dScore === 50.0 && lScore === 50.0 && fScore === 50.0 && (formRes.body.calculationStrategy === 'ND335_OFFICIAL_ABC' || formRes.body.calculationStrategy === 'WEIGHTED_DETAIL_SCORE')) {
        console.log(`  ✅ PASS: Đồng bộ hoàn hảo: Detail (${dScore}), List (${lScore}), Form (${fScore}) = 50.0đ (${formRes.body.calculationStrategy})`);
      } else {
        console.error('  ❌ FAIL Test 6: Inconsistent scores:', { dScore, lScore, fScore });
        process.exit(1);
      }

      // --- TEST 7: Quy trình Nộp -> Thẩm định -> Phê duyệt điểm bảo toàn ---
      console.log('\n--- Test 7: Quy trình 3 bước (Submit -> Review -> Approve) bảo toàn điểm ---');
      
      // Step 1: Submit
      const subRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/submit`, method: 'POST', headers: { Authorization: `Bearer ${empToken}` } }
      );
      if (subRes.status !== 200) throw new Error('Submit failed: ' + JSON.stringify(subRes.body));

      // Step 2: Manager Review
      const revRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/review`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` } },
        {
          criteria_politics_mgr: 9.0,
          criteria_expertise_mgr: 8.0,
          criteria_innovation_mgr: 8.0,
          remarks: 'Trưởng bộ phận thẩm định đạt 50đ'
        }
      );
      if (revRes.status !== 200 || revRes.body.manager_score !== 50.0 || revRes.body.task_score !== 25.0) {
        console.error('  ❌ FAIL Test 7 (Review):', revRes.body);
        process.exit(1);
      }
      console.log('  ✅ PASS: Manager reviewed with exact 50.0đ (Part II: 25.0đ)');

      // Step 3: Leadership Approve
      const appRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/approve`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        {
          criteria_politics_final: 9.0,
          criteria_expertise_final: 8.0,
          criteria_innovation_final: 8.0,
          remarks: 'Chủ tịch xã phê duyệt chính thức 50đ'
        }
      );
      if (appRes.status !== 200 || appRes.body.evaluation.final_score !== 50.0 || appRes.body.evaluation.task_score_final !== 25.0) {
        console.error('  ❌ FAIL Test 7 (Approve):', appRes.body);
        process.exit(1);
      }
      console.log('  ✅ PASS: Leadership approved with exact 50.0đ (Classification: ' + appRes.body.evaluation.classification + ')');

      // --- TEST 8: Khóa kỳ đánh giá -> Chặn mọi thao tác sửa đổi ---
      console.log('\n--- Test 8: Khóa kỳ đánh giá và chặn sửa đổi ---');
      const lockRes = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/periods/lock', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        { month }
      );
      if (lockRes.status !== 200) throw new Error('Lock period failed: ' + JSON.stringify(lockRes.body));

      const blockedDraft = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 10,
          items: [{ product_catalog_id: 1, quantity: 1 }]
        }
      );
      if (blockedDraft.status === 400 && typeof blockedDraft.body.message === 'string' && blockedDraft.body.message.includes('khóa')) {
        console.log('  ✅ PASS: Blocked modification on locked period successfully.');
      } else {
        console.error('  ❌ FAIL Test 8: Allowed modification on locked period:', blockedDraft.body);
        process.exit(1);
      }

      // Unlock period for cleanup
      await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/periods/unlock', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        { month }
      );

      // --- TEST 9: Kiểm tra chặn dữ liệu sai (Negative, NaN, Vượt trần) ---
      console.log('\n--- Test 9: Chặn dữ liệu sai (Âm, NaN, Vượt trần) ---');
      const badDraft = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month: '2026-09',
          criteria_politics_self: -5.0,
          items: [{ product_catalog_id: 1, quantity: 1 }]
        }
      );
      if (badDraft.status === 400) {
        console.log('  ✅ PASS: Blocked negative points with 400 Bad Request.');
      } else {
        console.error('  ❌ FAIL Test 9: Allowed negative points:', badDraft.body);
        process.exit(1);
      }

      // --- TEST 10: Recalculate Endpoint ---
      console.log('\n--- Test 10: Recalculate Endpoint (/api/evaluations/forms/:id/recalculate) ---');
      const recalcRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/forms/${evalId}/recalculate`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          criteria_politics: 10,
          criteria_expertise: 10,
          criteria_innovation: 10,
          items: [{ product_catalog_id: 1, quantity: 2, baseline_score: 5, coefficient: 1 }]
        }
      );

      if (recalcRes.status === 200 && recalcRes.body.taskScore === 10 && recalcRes.body.totalScore === 40) {
        console.log(`  ✅ PASS: Recalculate endpoint returned TaskScore = ${recalcRes.body.taskScore}, Total = ${recalcRes.body.totalScore}`);
      } else {
        console.error('  ❌ FAIL Test 10:', recalcRes.body);
        process.exit(1);
      }

      console.log('\n🏆 ALL P0 CBCC KPI FORMULA & EVALUATION MODULE TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Test failed with error:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
