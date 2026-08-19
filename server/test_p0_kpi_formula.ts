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

      // --- TEST 1: Giao 1, Hoàn thành 1 -> a=100%, b=100%, c=100% -> Phần II = 70/70, Tổng = 95/100 (Phần I = 25đ) ---
      console.log('\n--- Test 1: 1/1 hoàn thành (NĐ 335) -> a,b,c=100% -> Phần II = 70/70, Tổng = 95/100 ---');
      const draft1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0, // Tổng Phần I = 25.0
          items: [
            { product_catalog_id: 1, assigned_quantity: 1, accepted_quantity: 1, remarks: '1 sản phẩm hoàn thành đúng hạn' }
          ]
        }
      );

      if (draft1.status === 200 && draft1.body.task_score === 70.0 && draft1.body.self_score === 95.0) {
        console.log(`  ✅ PASS: Draft 1 saved! Task Score = ${draft1.body.task_score}/70, Self Score = ${draft1.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 1:', draft1.body);
        process.exit(1);
      }

      const evalId = draft1.body.evaluation_id;

      // --- TEST 2: Giao 5, Hoàn thành 5 -> Tỷ lệ 100% -> Phần II vẫn là 70/70, Tổng = 95/100 ---
      console.log('\n--- Test 2: Giao 5, Hoàn thành 5 (5/5 = 100%) -> Phần II = 70/70, Tổng = 95/100 ---');
      const draft2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0, // 25.0
          items: [
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 5, remarks: '5 sản phẩm giao và hoàn thành đầy đủ' }
          ]
        }
      );

      if (draft2.status === 200 && draft2.body.task_score === 70.0 && draft2.body.self_score === 95.0) {
        console.log(`  ✅ PASS: Draft 2 updated! Task Score = ${draft2.body.task_score}/70, Self Score = ${draft2.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 2:', draft2.body);
        process.exit(1);
      }

      // --- TEST 3: Giao 5 nhưng chỉ hoàn thành 1 (1/5 = 20%) -> Phần II = 14/70, Tổng = 39/100 ---
      console.log('\n--- Test 3: Giao 5, hoàn thành 1 (1/5 = 20%) -> Phần II = 14/70, Tổng = 39/100 ---');
      const draft3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0,
          items: [
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 1, remarks: 'Chỉ hoàn thành 1/5 khối lượng' }
          ]
        }
      );

      if (draft3.status === 200 && draft3.body.task_score === 14.0 && draft3.body.self_score === 39.0) {
        console.log(`  ✅ PASS: Draft 3 -> Task Score = ${draft3.body.task_score}/70, Self Score = ${draft3.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 3:', draft3.body);
        process.exit(1);
      }

      // --- TEST 4: Giao 5, hoàn thành 0 (0/5 = 0%) -> Phần II = 0/70, Tổng = 25/100 ---
      console.log('\n--- Test 4: Giao 5, hoàn thành 0 (0/5 = 0%) -> Phần II = 0/70, Tổng = 25/100 ---');
      const draft4 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 9.0,
          criteria_expertise_self: 8.0,
          criteria_innovation_self: 8.0,
          items: [
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 0, remarks: 'Chưa hoàn thành sản phẩm nào' }
          ]
        }
      );

      if (draft4.status === 200 && draft4.body.task_score === 0.0 && draft4.body.self_score === 25.0) {
        console.log(`  ✅ PASS: Draft 4 -> Task Score = ${draft4.body.task_score}/70, Self Score = ${draft4.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 4:', draft4.body);
        process.exit(1);
      }

      // --- TEST 5: Cập nhật lại hoàn thành 5/5 -> Phần II = 70/70, Tổng = 95/100 ---
      console.log('\n--- Test 5: Cập nhật lại 5/5 hoàn thành -> Phần II = 70/70 ---');
      const draft5 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month,
          criteria_politics_self: 10.0,
          criteria_expertise_self: 10.0,
          criteria_innovation_self: 10.0, // 30.0
          items: [
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 5, remarks: 'Hoàn thành xuất sắc 5 nhiệm vụ' }
          ]
        }
      );

      if (draft5.status === 200 && draft5.body.task_score === 70.0 && draft5.body.self_score === 100.0) {
        console.log(`  ✅ PASS: Task Score correctly at 70/70! Total = ${draft5.body.self_score}/100`);
      } else {
        console.error('  ❌ FAIL Test 5:', draft5.body);
        process.exit(1);
      }

      // --- TEST 6: Kiểm tra đồng bộ dữ liệu giữa Form, Chi tiết và Danh sách ---
      console.log('\n--- Test 6: Kiểm tra đồng bộ dữ liệu giữa Form, Chi tiết và Danh sách ---');
      const detailRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );
      const listRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations?month=${month}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );
      const formDetailRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/forms/${evalId}`, method: 'GET', headers: { Authorization: `Bearer ${empToken}` } }
      );

      const dScore = detailRes.body.evaluation.self_score;
      const lScore = listRes.body.evaluations.find((e: any) => e.id === evalId)?.self_score;
      const fScore = formDetailRes.body.totalScore;

      if (dScore === 100.0 && lScore === 100.0 && fScore === 100.0) {
        console.log(`  ✅ PASS: Đồng bộ hoàn hảo: Detail (${dScore}), List (${lScore}), Form (${fScore}) = 100.0đ (ND335_OFFICIAL_ABC)`);
      } else {
        console.error(`  ❌ FAIL: Không đồng bộ: Detail (${dScore}), List (${lScore}), Form (${fScore})`);
        process.exit(1);
      }

      // --- TEST 7: Quy trình 3 bước (Submit -> Review -> Approve) bảo toàn điểm ---
      console.log('\n--- Test 7: Quy trình 3 bước (Submit -> Review -> Approve) bảo toàn điểm ---');
      await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/submit`, method: 'POST', headers: { Authorization: `Bearer ${empToken}` } }
      );

      const reviewRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/review`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` } },
        {
          criteria_politics_mgr: 10.0,
          criteria_expertise_mgr: 10.0,
          criteria_innovation_mgr: 10.0,
          collective_comments: 'Tập thể nhất trí 100%',
          remarks: 'Thẩm định hoàn thành xuất sắc'
        }
      );

      if (reviewRes.status === 200 && reviewRes.body.manager_score === 100.0) {
        console.log(`  ✅ PASS: Manager reviewed with exact 100.0đ (Part II: ${reviewRes.body.task_score_mgr}đ)`);
      } else {
        console.error('  ❌ FAIL Step 2 Review:', reviewRes.body);
        process.exit(1);
      }

      const approveRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/${evalId}/approve`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        {
          criteria_politics_final: 10.0,
          criteria_expertise_final: 10.0,
          criteria_innovation_final: 10.0,
          party_cell_comments: 'Chi bộ nhất trí xuất sắc',
          remarks: 'Phê duyệt chính thức theo NĐ 335'
        }
      );

      if (approveRes.status === 200 && approveRes.body.final_score === 100.0 && approveRes.body.classification === 'Hoàn thành xuất sắc nhiệm vụ') {
        console.log(`  ✅ PASS: Leadership approved with exact 100.0đ (Classification: ${approveRes.body.classification})`);
      } else {
        console.error('  ❌ FAIL Step 3 Approve:', approveRes.body);
        process.exit(1);
      }

      // --- TEST 8: Khóa kỳ đánh giá và chặn sửa đổi ---
      console.log('\n--- Test 8: Khóa kỳ đánh giá và chặn sửa đổi ---');
      await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/periods/lock', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        { month }
      );

      const modifyLocked = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        { month, criteria_politics_self: 9.0, items: [{ product_catalog_id: 1, quantity: 1 }] }
      );

      if (modifyLocked.status === 400 && modifyLocked.body.message.includes('đã bị khóa')) {
        console.log('  ✅ PASS: Blocked modification on locked period successfully.');
      } else {
        console.error('  ❌ FAIL: Allowed modifying locked period:', modifyLocked.body);
        process.exit(1);
      }

      // --- TEST 9: Chặn dữ liệu sai (Âm, NaN, Vượt trần) ---
      console.log('\n--- Test 9: Chặn dữ liệu sai (Âm, NaN, Vượt trần) ---');
      await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/periods/unlock', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        { month: '2026-09' }
      );

      const badDraft = await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/draft', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          month: '2026-09',
          criteria_politics_self: -5.0, // Âm
          items: [{ product_catalog_id: 1, quantity: 1 }]
        }
      );

      if (badDraft.status === 400) {
        console.log('  ✅ PASS: Blocked negative points with 400 Bad Request.');
      } else {
        console.error('  ❌ FAIL: Allowed negative criteria points:', badDraft.body);
        process.exit(1);
      }

      // --- TEST 10: Recalculate Endpoint (/api/evaluations/forms/:id/recalculate) ---
      console.log('\n--- Test 10: Recalculate Endpoint (/api/evaluations/forms/:id/recalculate) ---');
      await request(
        { hostname: 'localhost', port: PORT, path: '/api/evaluations/periods/unlock', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        { month }
      );

      const recalcRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/evaluations/forms/${evalId}/recalculate`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          criteria_politics: 10.0,
          criteria_expertise: 10.0,
          criteria_innovation: 10.0,
          items: [
            { product_catalog_id: 1, assigned_quantity: 5, accepted_quantity: 5 }
          ]
        }
      );

      if (recalcRes.status === 200 && recalcRes.body.taskScore === 70.0 && recalcRes.body.totalScore === 100.0) {
        console.log(`  ✅ PASS: Recalculate endpoint returned TaskScore = ${recalcRes.body.taskScore}, Total = ${recalcRes.body.totalScore}`);
      } else {
        console.error('  ❌ FAIL Recalculate:', recalcRes.body);
        process.exit(1);
      }

      console.log('\n🏆 ALL P0 CBCC KPI FORMULA & EVALUATION MODULE TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('\n❌ TEST RUNNER EXCEPTION:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
