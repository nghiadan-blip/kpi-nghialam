import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5124;

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
  const server = app.listen(PORT, () => {
    console.log(`🧪 Reopen P0 Quantity Change Test Server running on http://localhost:${PORT}`);
  });

  try {
    // Clean evaluations first for testing consistency
    await db('evaluation_details').del();
    await db('evaluations').del();

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
    if (!empToken) throw new Error('Cannot login employee: ' + JSON.stringify(empLogin.body));
    console.log('  ✅ PASS: Employee logged in:', empLogin.body.user.fullname);

    console.log('\n--- 2. Save Draft with Quantity = 1 (Expected score = 5.0) ---');
    const draftRes1 = await request(
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
        month: '2026-08',
        items: [
          { product_catalog_id: 1, quantity: 1, remarks: 'Initial quantity 1' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_1 = (draftRes1.body.task_score * 0.7).toFixed(2);
    console.log(`  Quantity = 1 Response: self_score = ${draftRes1.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_1}`);
    if (draftRes1.status === 200 && Number(taskScoreSelf70_1) === 5.0) {
      console.log('  ✅ PASS: Part II score is exactly 5.0');
    } else {
      throw new Error(`Failed! Quantity = 1 gave Part II score = ${taskScoreSelf70_1}, expected 5.0`);
    }

    console.log('\n--- 3. Save Draft with Quantity = 5 (Expected score = 25.0) ---');
    const draftRes2 = await request(
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
        month: '2026-08',
        items: [
          { product_catalog_id: 1, quantity: 5, remarks: 'Updated quantity 5' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_2 = (draftRes2.body.task_score * 0.7).toFixed(2);
    console.log(`  Quantity = 5 Response: self_score = ${draftRes2.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_2}`);
    if (draftRes2.status === 200 && Number(taskScoreSelf70_2) === 25.0) {
      console.log('  ✅ PASS: Part II score changed from 5.0 to 25.0 successfully!');
    } else {
      throw new Error(`Failed! Quantity = 5 gave Part II score = ${taskScoreSelf70_2}, expected 25.0`);
    }

    console.log('\n=== QUANTITY CHANGE 1 -> 5 TEST PASSED SUCCESSFULLY! ===\n');
    server.close();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST SCENARIO FAILED:', err.message);
    server.close();
    process.exit(1);
  }
}

runTests();
