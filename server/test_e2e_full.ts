import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runFullE2ETests() {
  console.log('⏳ Resetting database via knex seed...');
  try {
    await db.seed.run();
    console.log('✅ Database reset successfully.');
  } catch (err: any) {
    console.warn('⚠️ Warning resetting database:', err.message);
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5095, () => resolve()));
  console.log('🧪 Full E2E Test Server started on http://localhost:5095');

  const baseUrl = 'http://localhost:5095/api';

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

  const login = async (u: string, p: string) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    return { status: res.status, token: data.token, user: data.user };
  };

  console.log('\n======================================================');
  console.log('🏛️  UBND XÃ NGHĨA LÂM — E2E COMPREHENSIVE TEST SUITE');
  console.log('======================================================');

  // --- SECTION 1: AUTHENTICATION & MULTI-ROLE ACCESS ---
  console.log('\n--- 1. Authentication & Multi-Role Sessions ---');

  let tokenAdmin = '';
  let tokenChutich = '';
  let tokenHeadDC = '';
  let tokenEmpDC = '';
  let tokenEmpVH = '';

  await assert('1.1 Login as Administrator (ADMIN)', async () => {
    const res = await login('admin', 'admin123');
    if (res.status === 200 && res.token && res.user.role === 'ADMIN') {
      tokenAdmin = res.token;
      return true;
    }
    return false;
  });

  await assert('1.2 Login as Commune Chairman (LEADERSHIP)', async () => {
    const res = await login('chutich', 'chutich123');
    if (res.status === 200 && res.token && res.user.role === 'LEADERSHIP') {
      tokenChutich = res.token;
      return true;
    }
    return false;
  });

  await assert('1.3 Login as Land Department Head (DEPARTMENT_HEAD)', async () => {
    const res = await login('truongphong_dc', 'head123');
    if (res.status === 200 && res.token && res.user.role === 'DEPARTMENT_HEAD') {
      tokenHeadDC = res.token;
      return true;
    }
    return false;
  });

  await assert('1.4 Login as Land Officer (EMPLOYEE)', async () => {
    const res = await login('congchuc_dc', 'emp123');
    if (res.status === 200 && res.token && res.user.role === 'EMPLOYEE') {
      tokenEmpDC = res.token;
      return true;
    }
    return false;
  });

  await assert('1.5 Login as Culture Officer (EMPLOYEE)', async () => {
    const res = await login('congchuc_vh', 'emp123');
    if (res.status === 200 && res.token && res.user.role === 'EMPLOYEE') {
      tokenEmpVH = res.token;
      return true;
    }
    return false;
  });

  await assert('1.6 User Profile Endpoint (/api/auth/me) works with Bearer Token', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const data = await res.json();
    return res.status === 200 && data.user.fullname === 'Trần Văn Nam';
  });

  // --- SECTION 2: RBAC SECURITY & BOUNDARY TESTS ---
  console.log('\n--- 2. RBAC Security & Access Boundary Enforcement ---');

  await assert('2.1 Unauthenticated request returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/tasks`);
    return res.status === 401;
  });

  await assert('2.2 Employee attempting to create user returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({
        username: 'hack_admin',
        password: '123',
        fullname: 'Hacker',
        role: 'ADMIN',
        position: 'Attacker'
      })
    });
    return res.status === 403;
  });

  await assert('2.3 Employee attempting to manage departments returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({ name: 'Fake Dept' })
    });
    return res.status === 403;
  });

  await assert('2.4 Employee attempting to manage NĐ 335 Catalog returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({ code: 'HACK', name: 'Hack Item', category: 'PART_A', coefficient: 99 })
    });
    return res.status === 403;
  });

  // --- SECTION 3: ADMINISTRATIVE MANAGEMENT (USERS & DEPARTMENTS & CATALOG) ---
  console.log('\n--- 3. Administrative Management & Setup ---');

  let newEmpId = 0;
  await assert('3.1 Admin creates new Civil Servant account', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        username: 'test_officer_e2e',
        password: 'password123',
        fullname: 'Đặng Quốc Bảo',
        position: 'Chuyên viên Tư pháp',
        role: 'EMPLOYEE',
        department_id: 5,
        email: 'bao_tp@nghialam.gov.vn',
        phone: '0981112233'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.user?.id) {
      newEmpId = data.user.id;
      return true;
    }
    return false;
  });

  await assert('3.2 Admin updates Civil Servant profile', async () => {
    const res = await fetch(`${baseUrl}/users/${newEmpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ position: 'Công chức Tư pháp - Hộ tịch chính' })
    });
    const data = await res.json();
    return res.status === 200 && data.user.position.includes('Hộ tịch chính');
  });

  await assert('3.3 Admin creates new Decree 335 Catalog Product', async () => {
    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        code: 'E2E_CITIZEN_MEDIATION',
        name: 'Hòa giải tranh chấp đất đai tại cơ sở',
        category: 'PART_B_GROUP_II',
        coefficient: 2.0,
        baseline_score: 5.0,
        description: 'Tổ chức hội đồng hòa giải thành công'
      })
    });
    const data = await res.json();
    return res.status === 201 && data.item?.code === 'E2E_CITIZEN_MEDIATION';
  });

  // --- SECTION 4: TASK ASSIGNMENT & LIFECYCLE ---
  console.log('\n--- 4. Task Assignment & Lifecycle Workflow ---');

  let e2eTaskId = 0;
  await assert('4.1 Department Head assigns Task linked to Decree 335 Catalog', async () => {
    const deadline = new Date(Date.now() + 86400000 * 3).toISOString();
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenHeadDC}` },
      body: JSON.stringify({
        title: 'Tổ chức đối thoại và giải quyết đơn khiếu nại xóm 5',
        description: 'Thực hiện xác minh nguồn gốc đất và hoàn tất biên bản làm việc',
        assigned_to: 6, // congchuc_dc
        product_catalog_id: 5, // CITIZEN_RECEPTION (K=1.0)
        deadline,
        weight: 1.5,
        status: 'PENDING'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.task?.id) {
      e2eTaskId = data.task.id;
      return true;
    }
    return false;
  });

  await assert('4.2 Assignee views assigned task and updates to IN_PROGRESS', async () => {
    const res = await fetch(`${baseUrl}/tasks/${e2eTaskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    return res.status === 200;
  });

  await assert('4.3 Assignee completes task and attaches official evidence', async () => {
    const res = await fetch(`${baseUrl}/tasks/${e2eTaskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({
        status: 'COMPLETED',
        evidence: 'Đã lập Biên bản hòa giải thành số 08/BB-UBND ngày 11/08/2026.'
      })
    });
    return res.status === 200;
  });

  // --- SECTION 5: 3-STEP DECREE 335 EVALUATION WORKFLOW ---
  console.log('\n--- 5. Decree 335 3-Step Evaluation & Scoring Workflow ---');

  const testMonth = '2026-09';
  let e2eEvalId = 0;

  await assert('5.1 Step 1 (Employee): Creates Draft Evaluation and calculates points', async () => {
    const res = await fetch(`${baseUrl}/evaluations/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEmpDC}` },
      body: JSON.stringify({
        month: testMonth,
        items: [
          {
            product_catalog_id: 1, // DOC_SIMPLE: 5.0 * 1.0 = 5.0
            quantity: 10, // 10 * 5.0 = 50.0
            remarks: 'Soạn thảo 10 thông báo hành chính'
          },
          {
            product_catalog_id: 2, // DOC_COMPLEX: 5.0 * 1.5 = 7.5
            quantity: 4, // 4 * 7.5 = 30.0
            remarks: 'Xây dựng 4 kế hoạch sử dụng đất'
          },
          {
            product_catalog_id: 6, // SPECIAL_TASK: 5.0 * 2.0 = 10.0
            quantity: 2, // 2 * 10.0 = 20.0
            remarks: 'Nhiệm vụ đột xuất GPMB dự án tỉnh lộ'
          }
        ],
        remarks: 'Tự đánh giá hoàn thành xuất sắc các chỉ tiêu tháng 9/2026'
      })
    });
    const data = await res.json();
    // Expected: 50.0 + 30.0 + 20.0 = 100.0
    if (res.status === 200 && data.evaluation_id && data.self_score === 100) {
      e2eEvalId = data.evaluation_id;
      return true;
    }
    return false;
  });

  await assert('5.2 Step 1 (Employee): Submits Evaluation to Manager (DRAFT -> SUBMITTED)', async () => {
    const res = await fetch(`${baseUrl}/evaluations/${e2eEvalId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpDC}` }
    });
    return res.status === 200;
  });

  await assert('5.3 Step 2 (Manager): Reviews and approves department score (SUBMITTED -> MANAGER_REVIEWED)', async () => {
    const getRes = await fetch(`${baseUrl}/evaluations/${e2eEvalId}`, {
      headers: { Authorization: `Bearer ${tokenHeadDC}` }
    });
    const evalData = await getRes.json();
    const details = evalData.evaluation.details;

    const res = await fetch(`${baseUrl}/evaluations/${e2eEvalId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenHeadDC}` },
      body: JSON.stringify({
        items: details.map((d: any) => ({
          id: d.id,
          manager_points: d.self_points,
          remarks: 'Trưởng bộ phận thẩm định đạt yêu cầu'
        })),
        remarks: 'Cán bộ năng nổ, hoàn thành xuất sắc các sản phẩm chuyên môn'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.manager_score === 100;
  });

  await assert('5.4 Step 3 (Leadership): Final Approval & Official Decree 335 Classification (MANAGER_REVIEWED -> APPROVED)', async () => {
    const getRes = await fetch(`${baseUrl}/evaluations/${e2eEvalId}`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const evalData = await getRes.json();
    const details = evalData.evaluation.details;

    const res = await fetch(`${baseUrl}/evaluations/${e2eEvalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenChutich}` },
      body: JSON.stringify({
        items: details.map((d: any) => ({
          id: d.id,
          final_points: d.manager_points,
          remarks: 'UBND xã phê duyệt chuẩn xác'
        })),
        final_score: 100,
        remarks: 'Biểu dương thành tích công tác tháng 9/2026'
      })
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.final_score === 100 &&
      data.classification.includes('xuất sắc')
    );
  });

  // --- SECTION 6: ANALYTICS DASHBOARD & EXCEL EXPORT ---
  console.log('\n--- 6. Analytics Dashboard & Administrative Excel Export ---');

  await assert('6.1 Real-time Analytics Dashboard accurately reflects new evaluation metrics', async () => {
    const res = await fetch(`${baseUrl}/reports/dashboard?month=${testMonth}`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.classifications.countA >= 1 &&
      data.topEmployees.some((e: any) => e.fullname === 'Vũ Minh Tuấn')
    );
  });

  await assert('6.2 Excel Spreadsheet Export generates valid Vietnamese administrative report', async () => {
    const res = await fetch(`${baseUrl}/reports/evaluations/export?month=${testMonth}`, {
      headers: { Authorization: `Bearer ${tokenChutich}` }
    });
    const text = await res.text();
    return (
      res.status === 200 &&
      text.includes('ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM') &&
      text.includes('Vũ Minh Tuấn') &&
      text.includes('Hoàn thành xuất sắc nhiệm vụ')
    );
  });

  // --- SECTION 7: AUDIT LOGGING & DATA INTEGRITY ---
  console.log('\n--- 7. System Audit Logs & Transaction Integrity ---');

  await assert('7.1 System Audit Logs captured all state-changing operations', async () => {
    const logs = await db('audit_logs').select('*');
    const actions = logs.map((l) => l.action);
    const hasLogin = actions.includes('LOGIN');
    const hasTask = actions.includes('CREATE_TASK') || actions.includes('UPDATE_TASK_STATUS');
    const hasEval = actions.includes('SUBMIT_SELF_EVALUATION') || actions.includes('APPROVE_EVALUATION');
    return logs.length >= 8 && hasLogin && hasTask && hasEval;
  });

  console.log(`\n======================================================`);
  console.log(`📊 FINAL E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  server.close();
  await db.destroy();
  process.exit(failed > 0 ? 1 : 0);
}

runFullE2ETests().catch((e) => {
  console.error(e);
  process.exit(1);
});
