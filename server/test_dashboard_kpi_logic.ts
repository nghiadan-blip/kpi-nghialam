import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5122;

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
  await db.seed.run();
  
  const server = app.listen(PORT, async () => {
    console.log(`🧪 Test Server running on http://localhost:${PORT}`);
    
    try {
      // 1. Get token
      const loginRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { username: 'admin', password: 'admin123' }
      );
      const token = loginRes.body.token;
      if (!token) throw new Error('Cannot login admin');

      // 2. Validate Month formats
      console.log('\n--- 1. P1: Month/Year Format Validation ---');
      const invalidMonths = [
        '2026-13', '2026-00', '2026-8', '2019-12', '2051-01', '2026-08.5', 'abc', '2026-'
      ];
      
      for (const invalid of invalidMonths) {
        const res = await request({
          hostname: 'localhost',
          port: PORT,
          path: `/api/reports/dashboard?month=${invalid}`,
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 400 && typeof res.body.message === 'string' && res.body.message.includes('Kỳ đánh giá')) {
          console.log(`  ✅ PASS: Blocked invalid month format: "${invalid}"`);
        } else {
          console.error(`  ❌ FAIL: Allowed invalid month format: "${invalid}" -> status: ${res.status}`);
          process.exit(1);
        }
      }

      // 3. Valid Month Dashboard query
      console.log('\n--- 2. P0: General KPI Dashboard Period Queries ---');
      const resOk = await request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/reports/dashboard?month=2026-08',
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resOk.status === 200 && resOk.body.month === '2026-08') {
        console.log('  ✅ PASS: Query dashboard for 2026-08 succeeded');
      } else {
        console.error('  ❌ FAIL: Query dashboard for 2026-08 failed:', resOk.body);
        process.exit(1);
      }

      // 4. Tasks status mutual exclusion
      console.log('\n--- 3. P0: Task Status Mutual Exclusion ---');
      const { totalTasks, completedTasks, overdueTasks, inProgressTasks, pendingTasks, unknownTasks } = resOk.body.summary;
      const calculatedTotal = completedTasks + overdueTasks + inProgressTasks + pendingTasks + unknownTasks;
      if (calculatedTotal === totalTasks) {
        console.log(`  ✅ PASS: Mutually exclusive tasks sum (${calculatedTotal}) matches totalTasks (${totalTasks})`);
      } else {
        console.error(`  ❌ FAIL: Tasks double counting detected! Sum: ${calculatedTotal}, Total: ${totalTasks}`);
        process.exit(1);
      }

      // 5. Staff hierarchy validation
      console.log('\n--- 4. P0: Staff Evaluation Hierarchy ---');
      const {
        totalActiveStaff,
        assignedStaff,
        selfSubmittedStaff,
        reviewedStaff,
        approvedStaff,
        classifiedStaff,
        notStartedStaff,
      } = resOk.body.summary;

      console.log(`  Stats: classified=${classifiedStaff} <= approved=${approvedStaff} <= reviewed=${reviewedStaff} <= selfSubmitted=${selfSubmittedStaff} <= assigned=${assignedStaff} <= total=${totalActiveStaff}`);
      
      const hierarchyOk =
        classifiedStaff <= approvedStaff &&
        approvedStaff <= reviewedStaff &&
        reviewedStaff <= selfSubmittedStaff &&
        selfSubmittedStaff <= assignedStaff &&
        assignedStaff <= totalActiveStaff;

      if (hierarchyOk) {
        console.log('  ✅ PASS: Staff evaluation hierarchy satisfies classifiedStaff <= approvedStaff <= reviewedStaff <= selfSubmittedStaff <= assignedStaff <= totalActiveStaff');
      } else {
        console.error('  ❌ FAIL: Staff evaluation hierarchy violated!');
        process.exit(1);
      }

      if (notStartedStaff + selfSubmittedStaff === totalActiveStaff) {
        console.log('  ✅ PASS: notStartedStaff + selfSubmittedStaff matches totalActiveStaff');
      } else {
        console.error('  ❌ FAIL: sum mismatch for active staff');
        process.exit(1);
      }

      // 6. dataStatus verification
      console.log('\n--- 5. P1: dataStatus Fields Validation ---');
      const { tasksStatus, evaluationsStatus } = resOk.body.summary;
      const validStatuses = ['NO_DATA', 'NOT_APPLICABLE', 'PENDING', 'AVAILABLE'];
      if (validStatuses.includes(tasksStatus) && validStatuses.includes(evaluationsStatus)) {
        console.log(`  ✅ PASS: tasksStatus="${tasksStatus}" and evaluationsStatus="${evaluationsStatus}" are valid`);
      } else {
        console.error(`  ❌ FAIL: Invalid dataStatus: tasksStatus=${tasksStatus}, evaluationsStatus=${evaluationsStatus}`);
        process.exit(1);
      }

      console.log('\n🏆 ALL DASHBOARD KPI PERIOD LOGIC & VALIDATION TESTS PASSED!');
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
