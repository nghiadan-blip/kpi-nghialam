import app from './src/app';
import db from './src/config/db';
import http from 'http';

async function runAITests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5094, () => resolve()));
  console.log('🧪 AI Test Server started on http://localhost:5094');

  const baseUrl = 'http://localhost:5094/api';

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

  console.log('\n--- 1. DeepSeek AI Evaluation Remark Generator Tests ---');

  await assert('AI generates Self-Evaluation remark for Employee', async () => {
    const res = await fetch(`${baseUrl}/ai/evaluate-remark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employee_name: 'Vũ Minh Tuấn',
        position: 'Công chức Địa chính - Xây dựng',
        department: 'Bộ phận Địa chính - Xây dựng',
        month: '2026-08',
        score: 95,
        items: [
          { catalog_name: 'Soạn thảo công văn hành chính', quantity: 10, self_points: 50 },
          { catalog_name: 'Xây dựng kế hoạch chuyên đề', quantity: 6, self_points: 45 }
        ],
        role_type: 'SELF'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.remark && data.remark.length > 20;
  });

  await assert('AI generates Manager Review remark', async () => {
    const res = await fetch(`${baseUrl}/ai/evaluate-remark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employee_name: 'Vũ Minh Tuấn',
        position: 'Công chức Địa chính',
        department: 'Địa chính - Xây dựng',
        month: '2026-08',
        score: 95,
        items: [],
        role_type: 'MANAGER'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.remark && data.remark.length > 20;
  });

  await assert('AI generates Leadership Final Decision remark', async () => {
    const res = await fetch(`${baseUrl}/ai/evaluate-remark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employee_name: 'Vũ Minh Tuấn',
        position: 'Công chức Địa chính',
        department: 'Địa chính - Xây dựng',
        month: '2026-08',
        score: 95,
        items: [],
        role_type: 'LEADERSHIP'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.remark && data.remark.length > 20;
  });

  console.log('\n--- 2. DeepSeek AI Task Assistant Tests ---');

  await assert('AI suggests Task description and steps', async () => {
    const res = await fetch(`${baseUrl}/ai/suggest-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Kiểm tra trật tự xây dựng xóm 3 và xóm 4',
        department_name: 'Bộ phận Địa chính - Xây dựng',
        position: 'Công chức Địa chính'
      })
    });
    const data = await res.json();
    return res.status === 200 && data.suggestion && data.suggestion.length > 30;
  });

  console.log('\n--- 3. DeepSeek AI Legal & Decree 335 Chat Assistant Tests ---');

  await assert('AI Chat answers calculation formula question for Decree 335', async () => {
    const res = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Cách tính điểm theo Nghị định 335 như thế nào?' }
        ]
      })
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.reply &&
      (data.reply.includes('335') || data.reply.includes('Hệ số') || data.reply.includes('Điểm'))
    );
  });

  await assert('AI Chat answers Classification Type A threshold question', async () => {
    const res = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Tiêu chuẩn xếp loại Loại A (Xuất sắc) cần bao nhiêu điểm?' }
        ]
      })
    });
    const data = await res.json();
    return (
      res.status === 200 &&
      data.reply &&
      (data.reply.includes('90') || data.reply.includes('xuất sắc'))
    );
  });

  console.log(`\n========================================`);
  console.log(`📊 AI TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  server.close();
  await db.destroy();
  process.exit(failed > 0 ? 1 : 0);
}

runAITests().catch((e) => {
  console.error(e);
  process.exit(1);
});
