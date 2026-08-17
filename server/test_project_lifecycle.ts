import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5134;

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

async function runProjectLifecycleTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`⏱️ Project Lifecycle & Validation Test Server running on http://localhost:${PORT}`);

    try {
      const login = async (username: string, pass: string) => {
        const res = await request(
          { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
          { username, password: pass }
        );
        return res.body.token;
      };

      const leaderToken = await login('chutich', 'chutich123');
      const headDcToken = await login('truongphong_dc', 'head123');

      console.log('\n======================================================');
      console.log('1. TEST VALIDATION RÀNG BUỘC NGÀY THÁNG VÀ SỐ LIỆU');
      console.log('======================================================');

      // 1.1 Ngày kết thúc trước ngày khởi công -> 400
      const v1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { project_code: 'DA-VAL-01', project_name: 'Test ngày sai', start_date: '2026-08-15', planned_end_date: '2026-08-01' }
      );
      if (v1.status === 400 && v1.body.message.includes('sau ngày khởi công')) {
        console.log('  ✅ PASS: 1.1 Chặn ngày kết thúc trước ngày khởi công');
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(v1));
      }

      // 1.2 Giá trị hợp đồng âm -> 400
      const v2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { project_code: 'DA-VAL-02', project_name: 'Test số âm', contract_value: -1000000 }
      );
      if (v2.status === 400 && v2.body.message.includes('không được âm')) {
        console.log('  ✅ PASS: 1.2 Chặn giá trị hợp đồng âm');
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(v2));
      }

      console.log('\n======================================================');
      console.log('2. TEST QUẢN LÝ MỐC TIẾN ĐỘ CHI TIẾT (MILESTONES)');
      console.log('======================================================');

      // 2.1 Thêm mốc tiến độ
      const m1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1/milestones', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { milestone_name: 'Đổ bê tông mặt cầu vượt', planned_date: '2026-09-15', status: 'pending' }
      );
      if (m1.status === 201 && m1.body.id) {
        console.log(`  ✅ PASS: 2.1 Thêm mốc tiến độ thành công (Milestone ID: ${m1.body.id})`);
      } else {
        throw new Error('FAIL 2.1: ' + JSON.stringify(m1));
      }

      // 2.2 Sửa mốc tiến độ
      const m2 = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/1/milestones/${m1.body.id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { status: 'in_progress', note: 'Đang lắp đặt ván khuôn' }
      );
      if (m2.status === 200) {
        console.log('  ✅ PASS: 2.2 Cập nhật mốc tiến độ thành công');
      } else {
        throw new Error('FAIL 2.2: ' + JSON.stringify(m2));
      }

      // 2.3 Xóa mốc tiến độ
      const m3 = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/1/milestones/${m1.body.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${headDcToken}` } }
      );
      if (m3.status === 200) {
        console.log('  ✅ PASS: 2.3 Xóa mốc tiến độ thành công');
      } else {
        throw new Error('FAIL 2.3: ' + JSON.stringify(m3));
      }

      console.log('\n======================================================');
      console.log('3. TEST DASHBOARD THỐNG KÊ TOÀN BỘ VÒNG ĐỜI DỰ ÁN');
      console.log('======================================================');

      const dRes = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/dashboard', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (
        dRes.status === 200 &&
        dRes.body.total_projects === 3 &&
        dRes.body.by_group.C === 2 &&
        dRes.body.by_group.B === 1 &&
        dRes.body.financials.total_allocated_capital > 0
      ) {
        console.log(`  ✅ PASS: 3.1 Dashboard tổng hợp chính xác: ${dRes.body.total_projects} dự án (Nhóm B: ${dRes.body.by_group.B}, Nhóm C: ${dRes.body.by_group.C}), Vốn phân bổ: ${dRes.body.financials.total_allocated_capital.toLocaleString()}đ`);
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(dRes));
      }

      console.log('\n🏆 ALL PROJECT LIFECYCLE, MILESTONES & DASHBOARD TESTS PASSED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Project Lifecycle Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runProjectLifecycleTests();
