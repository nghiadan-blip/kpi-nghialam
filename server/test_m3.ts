import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5098, () => resolve()));
  console.log('🧪 Test server started on http://localhost:5098');

  const baseUrl = 'http://localhost:5098/api';

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

  // Get tokens
  let tokenAdmin = '';
  let tokenChutich = '';
  let tokenHeadDC = '';
  let tokenEmpDC = '';
  let tokenEmpVH = '';

  const login = async (u: string, p: string) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    return data.token;
  };

  tokenAdmin = await login('admin', 'admin123');
  tokenChutich = await login('chutich', 'chutich123');
  tokenHeadDC = await login('truongphong_dc', 'head123');
  tokenEmpDC = await login('congchuc_dc', 'emp123');
  tokenEmpVH = await login('congchuc_vh', 'emp123');

  console.log('\n--- 1. Decree 335 Product Catalog Tests ---');
  let catalogId = 0;
  await assert('Get active product catalog returns items', async () => {
    const res = await fetch(`${baseUrl}/catalog`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const data = await res.json();
    if (res.status === 200 && data.catalog?.length > 0) {
      catalogId = data.catalog[0].id;
      return true;
    }
    return false;
  });

  console.log('\n--- 2. Task Creation & Assignment Tests ---');
  let createdTaskId = 0;
  await assert('Department Head (truongphong_dc) assigns task to Employee (congchuc_dc)', async () => {
    const deadline = new Date(Date.now() + 86400000 * 2).toISOString();
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHeadDC}`
      },
      body: JSON.stringify({
        title: 'Hoàn thiện hồ sơ cấp GCN QSDĐ đợt 3',
        description: 'Kiểm tra thực địa và hoàn thiện hồ sơ 5 hộ dân xóm 2',
        assigned_to: 6, // congchuc_dc
        product_catalog_id: catalogId,
        deadline: deadline,
        weight: 1.5,
        status: 'PENDING'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.task?.id) {
      createdTaskId = data.task.id;
      return true;
    }
    return false;
  });

  console.log('\n--- 3. Task Visibility & Role-Based Scoping Tests ---');
  await assert('Assignee (congchuc_dc) sees assigned task', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${tokenEmpDC}` }
    });
    const data = await res.json();
    return res.status === 200 && data.tasks.some((t: any) => t.id === createdTaskId);
  });

  await assert('Other Employee (congchuc_vh in Culture Dept) CANNOT see task in Land Dept', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${tokenEmpVH}` }
    });
    const data = await res.json();
    return res.status === 200 && !data.tasks.some((t: any) => t.id === createdTaskId);
  });

  await assert('Commune Leadership (chutich) sees all tasks', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const data = await res.json();
    return res.status === 200 && data.tasks.some((t: any) => t.id === createdTaskId);
  });

  console.log('\n--- 4. Task Progress & Evidence Submission Tests ---');
  await assert('Employee updates task status to IN_PROGRESS', async () => {
    const res = await fetch(`${baseUrl}/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenEmpDC}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    return res.status === 200;
  });

  await assert('Employee completes task and submits evidence', async () => {
    const res = await fetch(`${baseUrl}/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenEmpDC}`
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        evidence: 'Đã hoàn thành thẩm tra thực địa 5/5 hồ sơ theo Tờ trình số 45/TTr-ĐC.'
      })
    });
    return res.status === 200;
  });

  await assert('Task details show completed status and evidence', async () => {
    const res = await fetch(`${baseUrl}/tasks/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${tokenHeadDC}` }
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.task.status === 'COMPLETED' &&
      data.task.evidence.includes('Tờ trình số 45')
    );
  });

  console.log('\n--- 5. Task Statistics Tests ---');
  await assert('Task stats endpoint returns counts', async () => {
    const res = await fetch(`${baseUrl}/tasks/stats`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const data = await res.json();
    return res.status === 200 && data.stats && data.stats.total >= 1 && data.stats.completed >= 1;
  });

  console.log('\n--- 6. Task Deletion Tests ---');
  await assert('Creator/Admin can delete task', async () => {
    const res = await fetch(`${baseUrl}/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenHeadDC}` }
    });
    return res.status === 200;
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
