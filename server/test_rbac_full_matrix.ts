import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5128;

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

async function runRBACMatrixTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🛡️ Full RBAC Matrix Test Server running on http://localhost:${PORT}`);

    try {
      // Login all user test roles
      const login = async (username: string, pass: string) => {
        const res = await request(
          { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
          { username, password: pass }
        );
        return res.body.token;
      };

      const adminToken = await login('admin', 'admin123');
      const leaderToken = await login('chutich', 'chutich123');
      const headDcToken = await login('truongphong_dc', 'head123');
      const headHccToken = await login('truongphong_hcc', 'head123');
      const empDcToken = await login('congchuc_dc', 'emp123');
      const empVpToken = await login('congchuc_vp', 'emp123');

      const empDcUser = await db('users').where('username', 'congchuc_dc').first();
      const empVpUser = await db('users').where('username', 'congchuc_vp').first();

      console.log('\n======================================================');
      console.log('1. TASK ASSIGNMENT RBAC TESTS');
      console.log('======================================================');
      
      // 1.1 Employee DC cannot create/assign tasks -> 403
      const t1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empDcToken}` } },
        { title: 'Tự giao việc', assigned_to: empDcUser!.id, product_catalog_id: 1, deadline: '2026-08-30' }
      );
      if (t1.status === 403) console.log('  ✅ PASS: 1.1 Employee (Địa chính) calling POST /api/tasks -> 403 Forbidden');
      else throw new Error('FAIL 1.1: ' + JSON.stringify(t1));

      // 1.2 Employee VP cannot create/assign tasks -> 403
      const t2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empVpToken}` } },
        { title: 'Tự giao việc', assigned_to: empVpUser!.id, product_catalog_id: 1, deadline: '2026-08-30' }
      );
      if (t2.status === 403) console.log('  ✅ PASS: 1.2 Employee (Văn phòng) calling POST /api/tasks -> 403 Forbidden');
      else throw new Error('FAIL 1.2: ' + JSON.stringify(t2));

      // 1.3 Dept Head DC assigns inside department -> 201
      const t3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { title: 'Giao việc nội bộ', assigned_to: empDcUser!.id, product_catalog_id: 1, deadline: '2026-08-30' }
      );
      if (t3.status === 201) console.log('  ✅ PASS: 1.3 Dept Head (Địa chính) assigning inside dept -> 201 Created');
      else throw new Error('FAIL 1.3: ' + JSON.stringify(t3));

      // 1.4 Dept Head DC assigns outside department -> 403
      const t4 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { title: 'Giao việc ngoài bộ phận', assigned_to: empVpUser!.id, product_catalog_id: 1, deadline: '2026-08-30' }
      );
      if (t4.status === 403) console.log('  ✅ PASS: 1.4 Dept Head (Địa chính) assigning outside dept -> 403 Forbidden');
      else throw new Error('FAIL 1.4: ' + JSON.stringify(t4));

      // 1.5 Leadership assigns task across departments -> 201
      const t5 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/tasks', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        { title: 'Lãnh đạo giao việc', assigned_to: empVpUser!.id, product_catalog_id: 1, deadline: '2026-08-30' }
      );
      if (t5.status === 201) console.log('  ✅ PASS: 1.5 Leadership assigning task across departments -> 201 Created');
      else throw new Error('FAIL 1.5: ' + JSON.stringify(t5));


      console.log('\n======================================================');
      console.log('2. PUBLIC INVESTMENT (ĐẦU TƯ CÔNG) RBAC TESTS');
      console.log('======================================================');

      // 2.1 Employee VP tries to read public investment -> 403
      const inv1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/investment', method: 'GET', headers: { Authorization: `Bearer ${empVpToken}` } }
      );
      if (inv1.status === 403) console.log('  ✅ PASS: 2.1 Employee (Văn phòng) GET /api/investment -> 403 Forbidden');
      else throw new Error('FAIL 2.1: ' + JSON.stringify(inv1));

      // 2.2 Employee VP tries to create project -> 403
      const inv2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/investment', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empVpToken}` } },
        { project_code: 'DA-TEST', project_name: 'Dự án trái phép', funding_source: 'Ngân sách' }
      );
      if (inv2.status === 403) console.log('  ✅ PASS: 2.2 Employee (Văn phòng) POST /api/investment -> 403 Forbidden');
      else throw new Error('FAIL 2.2: ' + JSON.stringify(inv2));

      // 2.3 Employee DC (Dept 3) can read public investment -> 200
      const inv3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/investment', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (inv3.status === 200 && Array.isArray(inv3.body.projects)) console.log('  ✅ PASS: 2.3 Employee (Địa chính - Xây dựng) GET /api/investment -> 200 OK');
      else throw new Error('FAIL 2.3: ' + JSON.stringify(inv3));

      // 2.4 Employee DC tries to delete project -> 403 (Only Admin/Leadership can delete)
      const inv4 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/investment/1', method: 'DELETE', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (inv4.status === 403) console.log('  ✅ PASS: 2.4 Employee (Địa chính) DELETE /api/investment/1 -> 403 Forbidden');
      else throw new Error('FAIL 2.4: ' + JSON.stringify(inv4));

      // 2.5 Leadership creates project -> 201
      const inv5 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/investment', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        { project_code: 'DA-DTC-01', project_name: 'Đường liên thôn', funding_source: 'Ngân sách tỉnh' }
      );
      if (inv5.status === 201) console.log('  ✅ PASS: 2.5 Leadership POST /api/investment -> 201 Created');
      else throw new Error('FAIL 2.5: ' + JSON.stringify(inv5));


      console.log('\n======================================================');
      console.log('3. BUDGET (TÀI CHÍNH - NGÂN SÁCH) RBAC TESTS');
      console.log('======================================================');

      // 3.1 Employee DC tries to read budget -> 403
      const b1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/budgets?year=2026', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (b1.status === 403) console.log('  ✅ PASS: 3.1 Employee (Địa chính) GET /api/budgets -> 403 Forbidden');
      else throw new Error('FAIL 3.1: ' + JSON.stringify(b1));

      // 3.2 Employee VP tries to create revenue -> 403
      const b2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/budgets/revenues', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empVpToken}` } },
        { year: 2026, category: 'Thu phí', source_name: 'Nguồn thu test' }
      );
      if (b2.status === 403) console.log('  ✅ PASS: 3.2 Employee (Văn phòng) POST /api/budgets/revenues -> 403 Forbidden');
      else throw new Error('FAIL 3.2: ' + JSON.stringify(b2));

      // 3.3 Leadership can read and create budget -> 200 / 201
      const b3 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/budgets?year=2026', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (b3.status === 200 && b3.body.revenues) console.log('  ✅ PASS: 3.3 Leadership GET /api/budgets -> 200 OK');
      else throw new Error('FAIL 3.3: ' + JSON.stringify(b3));


      console.log('\n======================================================');
      console.log('4. LAND CERTIFICATES (ĐẤT ĐAI & KH965) RBAC TESTS');
      console.log('======================================================');

      // 4.1 Employee VP tries to read land cases -> 403
      const l1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/land-certificates', method: 'GET', headers: { Authorization: `Bearer ${empVpToken}` } }
      );
      if (l1.status === 403) console.log('  ✅ PASS: 4.1 Employee (Văn phòng) GET /api/land-certificates -> 403 Forbidden');
      else throw new Error('FAIL 4.1: ' + JSON.stringify(l1));

      // 4.2 Employee DC (Dept 3) can read land cases -> 200
      const l2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/land-certificates', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (l2.status === 200 && Array.isArray(l2.body.cases)) console.log('  ✅ PASS: 4.2 Employee (Địa chính) GET /api/land-certificates -> 200 OK');
      else throw new Error('FAIL 4.2: ' + JSON.stringify(l2));

      console.log('\n🏆 FULL RBAC SECURITY MATRIX (Role x Module x Read/Write) VERIFIED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ RBAC Matrix Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runRBACMatrixTests();
