import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runBatch2ValidationTests() {
  console.log('⏳ Running Batch 2 Validation & Data Safety Test Suite...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5096, () => resolve()));
  console.log('🧪 Validation Test Server started on http://localhost:5096');

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

  const login = async (u: string, p: string) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    return { status: res.status, token: data.token, user: data.user };
  };

  // Login as admin
  const loginRes = await login('admin', 'admin123');
  const token = loginRes.token;

  console.log('\n--- 1. Budget Revenue Validation Tests ---');

  await assert('1.1 Revenue planned_amount cannot be negative', async () => {
    const res = await fetch(`${baseUrl}/budget/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Đất công ích',
        source_name: 'TEST-CODEX-Negative-Revenue',
        planned_amount: -5000000,
        collected_amount: 0,
        due_date: '2026-12-31'
      })
    });
    const data = await res.json();
    return res.status === 400 && data.message.includes('không được là số âm');
  });

  await assert('1.2 Revenue collected_amount cannot be negative', async () => {
    const res = await fetch(`${baseUrl}/budget/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Đất công ích',
        source_name: 'TEST-CODEX-Negative-Collected',
        planned_amount: 10000000,
        collected_amount: -1000,
        due_date: '2026-12-31'
      })
    });
    const data = await res.json();
    return res.status === 400 && data.message.includes('không được là số âm');
  });

  await assert('1.3 Revenue collected > planned without note is rejected', async () => {
    const res = await fetch(`${baseUrl}/budget/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Đất công ích',
        source_name: 'TEST-CODEX-Collect-Excess-No-Note',
        planned_amount: 5000000,
        collected_amount: 6000000,
        due_date: '2026-12-31',
        note: ''
      })
    });
    const data = await res.json();
    return res.status === 400 && data.message.includes('ghi chú/lý do điều chỉnh');
  });

  await assert('1.4 Revenue collected > planned with note is accepted', async () => {
    const res = await fetch(`${baseUrl}/budget/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Đất công ích',
        source_name: 'TEST-CODEX-Collect-Excess-With-Note',
        planned_amount: 5000000,
        collected_amount: 6000000,
        due_date: '2026-12-31',
        note: 'Giải trình: Tăng thu từ đấu giá đất bổ sung'
      })
    });
    return res.status === 201;
  });

  console.log('\n--- 2. Budget Expenditure Validation Tests ---');

  await assert('2.1 Expenditure paid_amount cannot be negative', async () => {
    const res = await fetch(`${baseUrl}/budget/expenditure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Hoạt động công vụ',
        expense_name: 'TEST-CODEX-Negative-Paid',
        estimated_amount: 10000000,
        approved_amount: 10000000,
        paid_amount: -5000
      })
    });
    return res.status === 400;
  });

  await assert('2.2 Expenditure approved > estimated without note is rejected', async () => {
    const res = await fetch(`${baseUrl}/budget/expenditure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Hoạt động công vụ',
        expense_name: 'TEST-CODEX-Approved-Excess-No-Note',
        estimated_amount: 10000000,
        approved_amount: 12000000,
        paid_amount: 0,
        note: ''
      })
    });
    return res.status === 400;
  });

  await assert('2.3 Expenditure paid > approved is blocked', async () => {
    const res = await fetch(`${baseUrl}/budget/expenditure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        year: 2026,
        category: 'Hoạt động công vụ',
        expense_name: 'TEST-CODEX-Paid-Excess',
        estimated_amount: 10000000,
        approved_amount: 10000000,
        paid_amount: 11000000
      })
    });
    return res.status === 400;
  });

  console.log('\n--- 3. Public Investment Validation Tests ---');

  await assert('3.1 Project disbursed_amount > allocated_capital is blocked', async () => {
    const res = await fetch(`${baseUrl}/public-investment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        project_code: 'TEST-CODEX-PI-1',
        project_name: 'Dự án đầu tư công kiểm thử',
        funding_source: 'Vốn nông thôn mới',
        planned_capital: 1000000000,
        allocated_capital: 500000000,
        disbursed_amount: 600000000,
        acceptance_value: 0
      })
    });
    return res.status === 400;
  });

  console.log('\n--- 4. Office Logistics Time Validation Tests ---');

  await assert('4.1 Office Request end_time <= start_time is blocked', async () => {
    const res = await fetch(`${baseUrl}/office`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        request_type: 'vehicle',
        title: 'TEST-CODEX-Office-Time-Error',
        start_time: '2026-08-20T08:00',
        end_time: '2026-08-20T07:30',
        estimated_cost: 0
      })
    });
    return res.status === 400 && (await res.json()).message.includes('sau thời gian bắt đầu');
  });

  console.log('\n--- 5. Land Case Status Validation Tests ---');

  await assert('5.1 New Land Case cannot be set to delayed status if not overdue', async () => {
    const res = await fetch(`${baseUrl}/land-certificates/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        case_code: 'TEST-CODEX-LAND-D1',
        citizen_name: 'Công dân kiểm thử',
        village: 'Xóm 2',
        land_plot_ref: 'Tờ 10, Thửa 22',
        status: 'delayed',
        deadline: '2026-12-31'
      })
    });
    return res.status === 400 && (await res.json()).message.includes('không thể gán trạng thái Chậm giải quyết');
  });

  console.log('\n--- 6. Deletion Safety Policy Tests ---');

  // Let's create a temporary completed item
  let revId = 0;
  const createRevRes = await fetch(`${baseUrl}/budget/revenue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      year: 2026,
      category: 'Đất công ích',
      source_name: 'TEST-CODEX-Delete-Target',
      planned_amount: 5000000,
      collected_amount: 5000000,
      due_date: '2026-12-31'
    })
  });
  if (createRevRes.ok) {
    const data = await createRevRes.json();
    revId = data.id;
  }

  await assert('6.1 Finalized financial revenue (status=completed) cannot be deleted', async () => {
    if (!revId) return false;
    const res = await fetch(`${baseUrl}/budget/revenue/${revId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.status === 400 && (await res.json()).message.includes('Không được phép xóa nguồn thu đã thực hiện thu');
  });

  // Cleanup the test data by direct database command
  await db('budget_revenue_items').where('source_name', 'like', 'TEST-CODEX-%').del();
  await db('budget_expenditure_items').where('expense_name', 'like', 'TEST-CODEX-%').del();
  await db('public_investment_projects').where('project_code', 'like', 'TEST-CODEX-%').del();
  await db('office_requests').where('title', 'like', 'TEST-CODEX-%').del();
  await db('land_certificate_cases').where('case_code', 'like', 'TEST-CODEX-%').del();
  console.log('🧹 Cleaned up all TEST-CODEX- prefixed test data.');

  console.log(`\n======================================================`);
  console.log(`📊 BATCH 2 VALIDATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runBatch2ValidationTests().catch(console.error);
