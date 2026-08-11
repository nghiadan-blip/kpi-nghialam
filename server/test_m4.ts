import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5097, () => resolve()));
  console.log('🧪 Test server started on http://localhost:5097');

  const baseUrl = 'http://localhost:5097/api';

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

  console.log('\n--- 1. Decree 335 Evaluation Workflow Tests ---');
  let evalId = 0;

  await assert('Step 1: Employee creates Draft Evaluation for 2026-08', async () => {
    const res = await fetch(`${baseUrl}/evaluations/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenEmpDC}`
      },
      body: JSON.stringify({
        month: '2026-08',
        items: [
          {
            product_catalog_id: 1, // DOC_SIMPLE (K=1.0, pts=5.0)
            quantity: 10, // 10 * 5.0 = 50.0
            remarks: 'Soạn thảo 10 công văn hành chính'
          },
          {
            product_catalog_id: 2, // DOC_COMPLEX (K=1.5, pts=7.5)
            quantity: 6, // 6 * 7.5 = 45.0
            remarks: 'Soạn thảo 6 kế hoạch chuyên đề'
          }
        ],
        remarks: 'Đã hoàn thành toàn bộ khối lượng công việc được giao trong tháng'
      })
    });
    const data = await res.json();
    // Expected total: 50.0 + 45.0 = 95.0
    if (res.status === 200 && data.evaluation_id && data.self_score === 95) {
      evalId = data.evaluation_id;
      return true;
    }
    return false;
  });

  await assert('Step 2: Employee Submits Self-Evaluation (DRAFT -> SUBMITTED)', async () => {
    const res = await fetch(`${baseUrl}/evaluations/${evalId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpDC}` }
    });
    const data = await res.json();
    return res.status === 200;
  });

  await assert('Step 3: Department Head reviews & grades evaluation (SUBMITTED -> MANAGER_REVIEWED)', async () => {
    // Get evaluation details to retrieve item IDs
    const getRes = await fetch(`${baseUrl}/evaluations/${evalId}`, {
      headers: { Authorization: `Bearer ${tokenHeadDC}` }
    });
    const evalData = await getRes.json();
    const details = evalData.evaluation.details;

    const reviewRes = await fetch(`${baseUrl}/evaluations/${evalId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenHeadDC}`
      },
      body: JSON.stringify({
        items: details.map((d: any) => ({
          id: d.id,
          manager_points: d.self_points,
          remarks: 'Thống nhất điểm tự chấm'
        })),
        remarks: 'Cán bộ làm việc trách nhiệm cao, hoàn thành xuất sắc'
      })
    });
    const reviewData = await reviewRes.json();
    return reviewRes.status === 200 && reviewData.manager_score === 95;
  });

  await assert('Step 4: Commune Leadership approves & classifies evaluation (MANAGER_REVIEWED -> APPROVED)', async () => {
    const getRes = await fetch(`${baseUrl}/evaluations/${evalId}`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const evalData = await getRes.json();
    const details = evalData.evaluation.details;

    const apprRes = await fetch(`${baseUrl}/evaluations/${evalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenChutich}`
      },
      body: JSON.stringify({
        items: details.map((d: any) => ({
          id: d.id,
          final_points: d.manager_points,
          remarks: 'UBND xã thống nhất phê duyệt'
        })),
        final_score: 95,
        remarks: 'Xếp loại Hoàn thành xuất sắc nhiệm vụ tháng 8/2026'
      })
    });
    const apprData = await apprRes.json();
    return (
      apprRes.status === 200 &&
      apprData.final_score === 95 &&
      apprData.classification === 'Hoàn thành xuất sắc nhiệm vụ'
    );
  });

  await assert('Verification: Approved evaluation is finalized and classified correctly', async () => {
    const res = await fetch(`${baseUrl}/evaluations/${evalId}`, {
      headers: { Authorization: `Bearer ${tokenEmpDC}` }
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.evaluation.status === 'APPROVED' &&
      data.evaluation.final_score === 95 &&
      data.evaluation.classification === 'Hoàn thành xuất sắc nhiệm vụ'
    );
  });

  console.log('\n--- 2. Admin Scoring Catalog Management Tests ---');
  let testCatId = 0;
  await assert('Admin creates new product catalog item', async () => {
    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        code: 'SPECIAL_INSPECTION',
        name: 'Kiểm tra trật tự xây dựng & Hành lang giao thông',
        category: 'PART_B_GROUP_II',
        coefficient: 1.8,
        baseline_score: 5.0,
        description: 'Tổ chức đoàn kiểm tra liên ngành'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.item?.id) {
      testCatId = data.item.id;
      return true;
    }
    return false;
  });

  await assert('Admin updates catalog item coefficient', async () => {
    const res = await fetch(`${baseUrl}/catalog/${testCatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ coefficient: 2.2 })
    });
    const data = await res.json();
    return res.status === 200 && data.item.coefficient === 2.2;
  });

  await assert('Admin soft deletes catalog item', async () => {
    const res = await fetch(`${baseUrl}/catalog/${testCatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` }
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
