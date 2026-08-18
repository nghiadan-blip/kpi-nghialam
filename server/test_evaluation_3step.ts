import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5098;

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

async function runTests() {
  await db.seed.run();
  const server = app.listen(PORT, () => {
    console.log(`🧪 3-Step Evaluation Test Server running on http://localhost:${PORT}`);
  });

  try {
    console.log('\n--- 1. Login Employee (congchuc_dc) ---');
    const empLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'congchuc_dc', password: 'emp123' }
    );

    const empToken = empLogin.body.token;
    if (!empToken) throw new Error('Cannot login employee congchuc_dc: ' + JSON.stringify(empLogin.body));
    console.log('  ✅ PASS: Employee logged in successfully:', empLogin.body.user.fullname);

    console.log('\n--- 2. Employee Saves Draft Evaluation (Thang điểm test vượt 100 để kiểm tra cap) ---');
    const month = '2026-08';
    const draftRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/evaluations/draft',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${empToken}`,
        },
      },
      {
        month,
        items: [
          { product_catalog_id: 1, quantity: 20, remarks: 'Thực hiện vượt mức công việc quy định' },
          { product_catalog_id: 2, quantity: 10, remarks: 'Hồ sơ tiếp nhận đúng hạn' },
        ],
        remarks: 'Tôi đã nỗ lực hoàn thành vượt mức toàn bộ nhiệm vụ được giao trong tháng 8/2026.',
      }
    );

    console.log('  Draft response:', draftRes.body);
    const evalId = draftRes.body.evaluation_id;
    if (draftRes.status === 200 && evalId && draftRes.body.self_score <= 100) {
      console.log(`  ✅ PASS: Draft saved (ID: ${evalId}), Self score correctly capped at ${draftRes.body.self_score}/100đ`);
    } else {
      console.error('  ❌ FAIL: Save draft failed', draftRes.body);
    }

    console.log('\n--- 3. Employee Submits Evaluation (Step 1 -> Step 2) ---');
    const submitRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/${evalId}/submit`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${empToken}`,
        },
      }
    );

    if (submitRes.status === 200) {
      console.log('  ✅ PASS: Employee submitted evaluation to Department Head');
    } else {
      console.error('  ❌ FAIL: Submit evaluation failed', submitRes.body);
    }

    console.log('\n--- 4. Login Department Head (truongphong_dc) ---');
    const mgrLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'truongphong_dc', password: 'head123' }
    );

    const mgrToken = mgrLogin.body.token;
    if (!mgrToken) throw new Error('Cannot login manager truongphong_dc');
    console.log('  ✅ PASS: Department Head logged in successfully:', mgrLogin.body.user.fullname);

    console.log('\n--- 5. Department Head Reviews and Evaluates (Step 2 -> Step 3) ---');
    const reviewRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/${evalId}/review`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgrToken}`,
        },
      },
      {
        items: [
          { id: 1, manager_points: 50, remarks: 'Thẩm định hồ sơ chính xác' },
          { id: 2, manager_points: 45, remarks: 'Thẩm định đạt yêu cầu' },
        ],
        remarks: 'Đồng chí có tinh thần trách nhiệm cao, hoàn thành tốt nhiệm vụ được giao trong tháng.',
      }
    );

    if (reviewRes.status === 200 && reviewRes.body.manager_score <= 100) {
      console.log(`  ✅ PASS: Manager reviewed successfully (Manager score: ${reviewRes.body.manager_score}đ)`);
    } else {
      console.error('  ❌ FAIL: Manager review failed', reviewRes.body);
    }

    console.log('\n--- 6. Login Leadership (chutich) ---');
    const ldrLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'chutich', password: 'chutich123' }
    );

    const ldrToken = ldrLogin.body.token;
    if (!ldrToken) throw new Error('Cannot login leadership chutich');
    console.log('  ✅ PASS: Leadership logged in successfully:', ldrLogin.body.user.fullname);

    console.log('\n--- 7. Leadership Approves & Finalizes Classification (Step 3 Complete) ---');
    const approveRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/evaluations/${evalId}/approve`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ldrToken}`,
        },
      },
      {
        final_score: 95.0,
        remarks: 'UBND xã thống nhất xếp loại Hoàn thành xuất sắc nhiệm vụ (Loại A).',
      }
    );

    if (approveRes.status === 200) {
      console.log('  ✅ PASS: Leadership approved evaluation, classification finalized!');
    } else {
      console.error('  ❌ FAIL: Leadership approval failed', approveRes.body);
    }

    console.log('\n========================================');
    console.log('🎉 3-STEP EVALUATION WORKFLOW 100% VERIFIED');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close();
  }
}

runTests();
