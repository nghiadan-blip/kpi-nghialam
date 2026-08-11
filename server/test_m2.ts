import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, () => resolve()));
  console.log('🧪 Test server started on http://localhost:5099');

  const baseUrl = 'http://localhost:5099/api';

  let passed = 0;
  let failed = 0;

  async function assert(desc: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      if (ok) {
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${desc}`);
        failed++;
      }
    } catch (e: any) {
      console.error(`  ❌ ERROR: ${desc} -> ${e.message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Healthcheck & Database Test ---');
  await assert('Health endpoint returns UP', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    return res.status === 200 && data.status === 'UP';
  });

  console.log('\n--- 2. Auth Tests ---');
  let adminToken = '';
  let employeeToken = '';

  await assert('Login as admin succeeds', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token && data.user.role === 'ADMIN') {
      adminToken = data.token;
      return true;
    }
    return false;
  });

  await assert('Login as employee succeeds', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'congchuc_dc', password: 'emp123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token && data.user.role === 'EMPLOYEE') {
      employeeToken = data.token;
      return true;
    }
    return false;
  });

  await assert('Login with wrong password fails (400)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    return res.status === 400;
  });

  await assert('Get Me (/auth/me) returns correct user profile', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    return res.status === 200 && data.user.username === 'admin';
  });

  console.log('\n--- 3. RBAC Access Control Tests ---');
  await assert('EMPLOYEE is forbidden (403) from creating users', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        username: 'hack_user',
        password: 'password123',
        fullname: 'Hacker',
        role: 'ADMIN',
        position: 'Fake'
      })
    });
    return res.status === 403;
  });

  console.log('\n--- 4. User CRUD (Admin) Tests ---');
  let createdUserId = 0;
  await assert('ADMIN can create a new employee', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        username: 'test_canbo_m2',
        password: 'password123',
        fullname: 'Nguyễn Văn Test',
        role: 'EMPLOYEE',
        position: 'Cán bộ thử nghiệm',
        department_id: 2,
        email: 'test@nghialam.gov.vn',
        phone: '0988776655'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.user?.id) {
      createdUserId = data.user.id;
      return true;
    }
    return false;
  });

  await assert('ADMIN can update user information', async () => {
    const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullname: 'Nguyễn Văn Test (Đã cập nhật)',
        position: 'Chuyên viên chính'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.user.fullname === 'Nguyễn Văn Test (Đã cập nhật)';
  });

  await assert('ADMIN can reset employee password', async () => {
    const res = await fetch(`${baseUrl}/users/${createdUserId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ newPassword: 'newpassword456' })
    });
    return res.status === 200;
  });

  await assert('Employee can login with newly reset password', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_canbo_m2', password: 'newpassword456' })
    });
    return res.status === 200;
  });

  await assert('ADMIN can deactivate employee (Status -> INACTIVE)', async () => {
    const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.status === 200;
  });

  console.log('\n--- 5. Department CRUD Tests ---');
  let deptId = 0;
  await assert('ADMIN can create a new department', async () => {
    const res = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Tổ Công tác Chuyển đổi số Nghĩa Lâm',
        parent_id: 1
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.department?.id) {
      deptId = data.department.id;
      return true;
    }
    return false;
  });

  await assert('ADMIN can update department name', async () => {
    const res = await fetch(`${baseUrl}/departments/${deptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Tổ Công tác Chuyển đổi số & Đề án 06'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.department.name === 'Tổ Công tác Chuyển đổi số & Đề án 06';
  });

  await assert('ADMIN can delete department', async () => {
    const res = await fetch(`${baseUrl}/departments/${deptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.status === 200;
  });

  console.log('\n--- 6. Audit Logs Verification ---');
  await assert('Audit logs recorded user actions', async () => {
    const logs = await db('audit_logs').select('*');
    return logs.length >= 4;
  });

  console.log(`\n========================================`);
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  server.close();
  await db.destroy();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
