import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5096, () => resolve()));
  console.log('🧪 Test server started on http://localhost:5096');

  const baseUrl = 'http://localhost:5096/api';

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

  // Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'chutich', password: 'chutich123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('\n--- 1. Dashboard Metrics & Analytics API Tests ---');

  let dashboardData: any = null;
  await assert('Get dashboard stats returns complete metric payload', async () => {
    const res = await fetch(`${baseUrl}/reports/dashboard?month=2026-08`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    dashboardData = await res.json();
    return (
      res.status === 200 &&
      dashboardData.summary &&
      dashboardData.summary.totalUsers > 0 &&
      dashboardData.classifications !== undefined &&
      Array.isArray(dashboardData.departmentProgress) &&
      Array.isArray(dashboardData.urgentTasks)
    );
  });

  await assert('Dashboard includes Decree 335 classification breakdown', async () => {
    const cls = dashboardData.classifications;
    return (
      cls.countA !== undefined &&
      cls.countB !== undefined &&
      cls.countC !== undefined &&
      cls.countD !== undefined
    );
  });

  await assert('Dashboard includes Department Progress breakdown', async () => {
    return dashboardData.departmentProgress.length >= 1;
  });

  console.log('\n--- 2. Excel Report Export Tests ---');

  await assert('Export evaluations endpoint returns Excel spreadsheet', async () => {
    const res = await fetch(`${baseUrl}/reports/evaluations/export?month=2026-08`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentType = res.headers.get('content-type') || '';
    const contentDisp = res.headers.get('content-disposition') || '';
    const bodyText = await res.text();

    const isExcelHeader = contentType.includes('excel') || contentType.includes('ms-excel');
    const isAttachment = contentDisp.includes('attachment') && contentDisp.includes('.xls');
    const hasOrgTitle = bodyText.includes('ỦY BAN NHÂN DÂN XÃ NGHĨA LÂM');
    const hasDecreeRef = bodyText.includes('335/2025/NĐ-CP');
    const hasTableHeaders = bodyText.includes('Điểm tự chấm') && bodyText.includes('Kết quả xếp loại');

    return (
      res.status === 200 &&
      isExcelHeader &&
      isAttachment &&
      hasOrgTitle &&
      hasDecreeRef &&
      hasTableHeaders
    );
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
