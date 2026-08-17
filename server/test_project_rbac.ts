import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5132;

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

async function runProjectRBACTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🛡️ Project RBAC Matrix Test Server running on http://localhost:${PORT}`);

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
      const empDcToken = await login('congchuc_dc', 'emp123');
      const empVpToken = await login('congchuc_vp', 'emp123');

      console.log('\n======================================================');
      console.log('1. TEST CÔNG CHỨC KHÔNG THUỘC ĐỊA CHÍNH (VĂN PHÒNG)');
      console.log('======================================================');

      // 1.1 Công chức VP không xem được chi tiết dự án không được gán -> 403
      const r1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/3', method: 'GET', headers: { Authorization: `Bearer ${empVpToken}` } }
      );
      if (r1.status === 403) {
        console.log('  ✅ PASS: 1.1 Công chức VP gọi GET /api/projects/3 -> 403 Forbidden');
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(r1));
      }

      // 1.2 Công chức VP không thể tạo dự án -> 403
      const r2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empVpToken}` } },
        { project_code: 'DA-VP-01', project_name: 'Dự án trái phép' }
      );
      if (r2.status === 403) {
        console.log('  ✅ PASS: 1.2 Công chức VP gọi POST /api/projects -> 403 Forbidden');
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(r2));
      }

      console.log('\n======================================================');
      console.log('2. TEST CÔNG CHỨC ĐỊA CHÍNH (PROJECT MANAGER)');
      console.log('======================================================');

      // 2.1 Công chức Địa chính xem được chi tiết dự án mình được gán (DA 1) -> 200
      const r3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (r3.status === 200 && r3.body.project) {
        console.log('  ✅ PASS: 2.1 Công chức Địa chính xem dự án được phân công -> 200 OK');
      } else {
        throw new Error('FAIL 2.1: ' + JSON.stringify(r3));
      }

      // 2.2 Công chức Địa chính không có quyền sửa trường phê duyệt/hợp đồng nhạy cảm -> 403
      const r4 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empDcToken}` } },
        { approval_decision_no: 'SUA-TRAI-PHEP-99' }
      );
      if (r4.status === 403) {
        console.log('  ✅ PASS: 2.2 Công chức Địa chính cố sửa QĐ phê duyệt -> 403 Forbidden');
      } else {
        throw new Error('FAIL 2.2: ' + JSON.stringify(r4));
      }

      // 2.3 Công chức Địa chính không có quyền xóa dự án -> 403
      const r5 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'DELETE', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (r5.status === 403) {
        console.log('  ✅ PASS: 2.3 Công chức Địa chính gọi DELETE /api/projects/1 -> 403 Forbidden');
      } else {
        throw new Error('FAIL 2.3: ' + JSON.stringify(r5));
      }

      console.log('\n======================================================');
      console.log('3. TEST TRƯỞNG BỘ PHẬN ĐỊA CHÍNH & LÃNH ĐẠO UBND XÃ');
      console.log('======================================================');

      // 3.1 Trưởng bộ phận Địa chính sửa QĐ phê duyệt và hợp đồng dự án nội bộ -> 200
      const r6 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { approval_decision_no: '88-DC/QĐ-UBND', contract_no: '01-DC/2026/HĐ-XL' }
      );
      if (r6.status === 200) {
        console.log('  ✅ PASS: 3.1 Trưởng bộ phận Địa chính sửa QĐ phê duyệt / Hợp đồng -> 200 OK');
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(r6));
      }

      // 3.2 Lãnh đạo UBND xã phê duyệt nghiệm thu / quyết toán -> 200
      const r7 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        { acceptance_status: 'nghiem_thu_tung_phan', settlement_status: 'dang_quyet_toan' }
      );
      if (r7.status === 200) {
        console.log('  ✅ PASS: 3.2 Lãnh đạo UBND xã cập nhật nghiệm thu / quyết toán -> 200 OK');
      } else {
        throw new Error('FAIL 3.2: ' + JSON.stringify(r7));
      }

      console.log('\n🏆 ALL PROJECT MANAGEMENT RBAC CONTROLS VERIFIED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Project RBAC Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runProjectRBACTests();
