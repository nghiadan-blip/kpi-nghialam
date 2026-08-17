import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5127;

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

async function runRBACTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🛡️ RBAC Task Assignment Test Server running on http://localhost:${PORT}`);

    try {
      // 1. Logins
      const empLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'congchuc_dc', password: 'emp123' } // Employee (Địa chính)
      );
      const empToken = empLogin.body.token;

      const mgrDcLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'truongphong_dc', password: 'head123' } // Dept Head (Địa chính)
      );
      const mgrDcToken = mgrDcLogin.body.token;

      const chairLogin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { username: 'chutich', password: 'chutich123' } // Leadership (Chủ tịch)
      );
      const chairToken = chairLogin.body.token;

      // Find user IDs
      const empDc = await db('users').where('username', 'congchuc_dc').first();
      const empVp = await db('users').where('username', 'congchuc_vp').first(); // Office employee
      const adminUser = await db('users').where('username', 'admin').first();

      // --- TEST 1: Employee attempts to call POST /api/tasks to assign task -> MUST RETURN 403 ---
      console.log('\n--- Test 1: Employee calls POST /api/tasks -> 403 Forbidden ---');
      const empAssignAttempt = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          title: 'Nhiệm vụ tự tạo trái phép',
          assigned_to: empDc.id,
          product_catalog_id: 1,
          deadline: '2026-08-30T17:00:00Z',
        }
      );

      if (empAssignAttempt.status === 403) {
        console.log('  ✅ PASS: Employee task assignment blocked with 403 Forbidden.');
      } else {
        console.error('  ❌ FAIL Test 1: Employee was allowed to create task:', empAssignAttempt.body);
        process.exit(1);
      }

      // --- TEST 2: Employee attempts to assign task to ADMIN -> MUST RETURN 403 ---
      console.log('\n--- Test 2: Employee attempts to assign task to ADMIN -> 403 Forbidden ---');
      const empAssignToAdmin = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` } },
        {
          title: 'Giao việc cho Admin trái phép',
          assigned_to: adminUser.id,
          product_catalog_id: 1,
          deadline: '2026-08-30T17:00:00Z',
        }
      );

      if (empAssignToAdmin.status === 403) {
        console.log('  ✅ PASS: Assigning task to Admin by Employee blocked with 403 Forbidden.');
      } else {
        console.error('  ❌ FAIL Test 2: Employee assigned task to Admin:', empAssignToAdmin.body);
        process.exit(1);
      }

      // --- TEST 3: Department Head assigns task within department -> MUST RETURN 201 ---
      console.log('\n--- Test 3: Dept Head assigns task within department -> 201 Created ---');
      const mgrAssignInDept = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrDcToken}` } },
        {
          title: 'Đo đạc hiện trạng thửa đất số 45',
          assigned_to: empDc.id,
          product_catalog_id: 1,
          assigned_quantity: 1,
          deadline: '2026-08-30T17:00:00Z',
        }
      );

      if (mgrAssignInDept.status === 201) {
        console.log('  ✅ PASS: Dept Head successfully assigned task within department.');
      } else {
        console.error('  ❌ FAIL Test 3: Dept Head failed to assign in department:', mgrAssignInDept.body);
        process.exit(1);
      }

      // --- TEST 4: Department Head attempts to assign task outside department -> MUST RETURN 403 ---
      console.log('\n--- Test 4: Dept Head attempts to assign task outside department -> 403 Forbidden ---');
      const mgrAssignOutDept = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrDcToken}` } },
        {
          title: 'Soạn thảo thông báo tiếp dân',
          assigned_to: empVp.id, // Office employee
          product_catalog_id: 1,
          deadline: '2026-08-30T17:00:00Z',
        }
      );

      if (mgrAssignOutDept.status === 403) {
        console.log('  ✅ PASS: Dept Head assigning task outside department blocked with 403 Forbidden.');
      } else {
        console.error('  ❌ FAIL Test 4: Dept Head assigned outside department:', mgrAssignOutDept.body);
        process.exit(1);
      }

      // --- TEST 5: Leadership assigns task across departments -> MUST RETURN 201 ---
      console.log('\n--- Test 5: Leadership assigns task across departments -> 201 Created ---');
      const chairAssign = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chairToken}` } },
        {
          title: 'Tổng kiểm tra công tác cải cách hành chính Quý III',
          assigned_to: empVp.id,
          product_catalog_id: 1,
          assigned_quantity: 1,
          deadline: '2026-08-30T17:00:00Z',
        }
      );

      if (chairAssign.status === 201) {
        console.log('  ✅ PASS: Leadership successfully assigned task to employee.');
      } else {
        console.error('  ❌ FAIL Test 5: Leadership failed to assign task:', chairAssign.body);
        process.exit(1);
      }

      console.log('\n🏆 ALL RBAC TASK ASSIGNMENT TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ RBAC Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runRBACTests();
