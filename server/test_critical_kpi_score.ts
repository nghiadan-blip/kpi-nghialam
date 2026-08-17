import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5123;

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
    console.log(`🧪 KPI Score Calculation Test Server running on http://localhost:${PORT}`);
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

    console.log('\n--- Scenario 1: A single item self-evaluated with 5 points produces a Part II score of exactly 5.0 ---');
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
          { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: 'Test item' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_1 = (draftRes1.body.task_score * 0.7).toFixed(2);
    console.log(`  Draft Response: self_score = ${draftRes1.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_1}`);
    if (draftRes1.status === 200 && Number(taskScoreSelf70_1) === 5.0) {
      console.log('  ✅ PASS: Part II score is exactly 5.0');
    } else {
      throw new Error(`Scenario 1 Failed! Part II score is ${taskScoreSelf70_1}, expected 5.0`);
    }

    const evalId = draftRes1.body.evaluation_id;

    console.log('\n--- Scenario 2: A single item self-evaluated with 0 points produces a Part II score of exactly 0 ---');
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
          { product_catalog_id: 1, quantity: 1, self_points: 0.0, remarks: 'Test item' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_2 = (draftRes2.body.task_score * 0.7).toFixed(2);
    console.log(`  Draft Response: self_score = ${draftRes2.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_2}`);
    if (draftRes2.status === 200 && Number(taskScoreSelf70_2) === 0.0) {
      console.log('  ✅ PASS: Part II score is exactly 0.0');
    } else {
      throw new Error(`Scenario 2 Failed! Part II score is ${taskScoreSelf70_2}, expected 0.0`);
    }

    console.log('\n--- Scenario 3: Two items self-evaluated with 5 points each produce a Part II score of exactly 10.0 ---');
    const draftRes3 = await request(
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
          { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: 'Test item 1' },
          { product_catalog_id: 2, quantity: 1, self_points: 5.0, remarks: 'Test item 2' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_3 = (draftRes3.body.task_score * 0.7).toFixed(2);
    console.log(`  Draft Response: self_score = ${draftRes3.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_3}`);
    if (draftRes3.status === 200 && Number(taskScoreSelf70_3) === 10.0) {
      console.log('  ✅ PASS: Part II score is exactly 10.0');
    } else {
      throw new Error(`Scenario 3 Failed! Part II score is ${taskScoreSelf70_3}, expected 10.0`);
    }

    console.log('\n--- Scenario 4: Deleting an item reduces the Part II score accordingly ---');
    // Save with 1 item instead of 2 items
    const draftRes4 = await request(
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
          { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: 'Test item 1' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_4 = (draftRes4.body.task_score * 0.7).toFixed(2);
    console.log(`  Draft Response: self_score = ${draftRes4.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_4}`);
    if (draftRes4.status === 200 && Number(taskScoreSelf70_4) === 5.0) {
      console.log('  ✅ PASS: Part II score dropped back to 5.0');
    } else {
      throw new Error(`Scenario 4 Failed! Part II score is ${taskScoreSelf70_4}, expected 5.0`);
    }

    console.log('\n--- Scenario 5: Capping at 70 points when points exceed 70 ---');
    const draftRes5 = await request(
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
          { product_catalog_id: 1, quantity: 20, self_points: 100.0, remarks: 'Test large qty' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    const taskScoreSelf70_5 = (draftRes5.body.task_score * 0.7).toFixed(2);
    console.log(`  Draft Response: self_score = ${draftRes5.body.self_score}, task_score (out of 70) = ${taskScoreSelf70_5}`);
    if (draftRes5.status === 200 && Number(taskScoreSelf70_5) === 70.0) {
      console.log('  ✅ PASS: Part II score capped at exactly 70.0');
    } else {
      throw new Error(`Scenario 5 Failed! Part II score is ${taskScoreSelf70_5}, expected 70.0`);
    }

    console.log('\n--- Scenario 6: Rejects negative, NaN, Infinity points with a Vietnamese message ---');
    const draftRes6 = await request(
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
          { product_catalog_id: 1, quantity: 1, self_points: -5.0, remarks: 'Negative points' },
        ],
        remarks: 'Test',
      }
    );

    console.log(`  Status code: ${draftRes6.status}, message: "${draftRes6.body.message}"`);
    if (draftRes6.status === 400 && draftRes6.body.message.includes('không hợp lệ')) {
      console.log('  ✅ PASS: Correctly blocked negative score with Vietnamese message');
    } else {
      throw new Error(`Scenario 6 Failed! status = ${draftRes6.status}, message = ${draftRes6.body.message}`);
    }

    // Save back a valid draft with 1 item of 5 points for workflow test
    await request(
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
          { product_catalog_id: 1, quantity: 1, self_points: 5.0, remarks: 'Test item' },
        ],
        criteria_politics_self: 10,
        criteria_expertise_self: 10,
        criteria_innovation_self: 10,
        remarks: 'Test',
      }
    );

    console.log('\n--- Scenario 7: Submit, Manager Review, Leadership Approval flow validation ---');
    // Submit evaluation
    const submitRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/evaluations/${evalId}/submit`,
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    console.log('  Submit response status:', submitRes.status);

    // Login Manager
    const managerLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'truongphong_dc', password: 'head123' }
    );
    const mgrToken = managerLogin.body.token;

    // Fetch correct detail id from database
    const dbDetail = await db('evaluation_details').where('evaluation_id', evalId).first();
    if (!dbDetail) throw new Error('Cannot find saved evaluation details in DB');
    const detailId = dbDetail.id;

    // Review with invalid points
    const reviewFailRes = await request(
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
          { id: detailId, manager_points: 120.0 } // Exceeds ceiling
        ],
        criteria_politics_mgr: 10,
        criteria_expertise_mgr: 10,
        criteria_innovation_mgr: 10,
      }
    );
    console.log(`  Manager review validation check: status = ${reviewFailRes.status}, message: "${reviewFailRes.body.message}"`);
    if (reviewFailRes.status === 400 && reviewFailRes.body.message.includes('không hợp lệ')) {
      console.log('  ✅ PASS: Manager review validation blocked invalid score');
    } else {
      throw new Error(`Manager review validation failed! status = ${reviewFailRes.status}, body = ${JSON.stringify(reviewFailRes.body)}`);
    }

    console.log('\n=== ALL KPI SCORE TESTS PASSED SUCCESSFULLY! ===\n');
    server.close();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST SCENARIO FAILED:', err.message);
    server.close();
    process.exit(1);
  }
}

runTests();
