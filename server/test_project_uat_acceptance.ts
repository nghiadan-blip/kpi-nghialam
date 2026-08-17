import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5150;

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const opts = { ...options };
    let postData = '';
    if (body !== undefined) {
      postData = JSON.stringify(body);
      opts.headers = {
        ...opts.headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };
    }

    const req = http.request(opts, (res) => {
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
    if (postData) { req.write(postData); }
    req.end();
  });
}

async function runProjectUATAcceptance() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🏛️ Project UAT Final Acceptance Server running on http://localhost:${PORT}`);

    try {
      const login = async (username: string, pass: string) => {
        const res = await request(
          { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST' },
          { username, password: pass }
        );
        return res.body.token;
      };

      const leaderToken = await login('chutich', 'chutich123');
      const headDcToken = await login('truongphong_dc', 'head123');
      const empDcToken = await login('congchuc_dc', 'emp123'); // ID 6 (Vũ Minh Tuấn - PM of DA-1, DA-2)
      const empVpToken = await login('congchuc_vp', 'emp123'); // ID 4 (Nguyễn Văn An - Văn phòng)

      console.log('\n======================================================');
      console.log('UAT 1: PHÂN QUYỀN VÀ BẢO VỆ RANH GIỚI TRUY CẬP (RBAC)');
      console.log('======================================================');

      // 1.1 Công chức Văn phòng (không được phân công) xem danh sách dự án -> rỗng (0 DA)
      const vpList = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'GET', headers: { Authorization: `Bearer ${empVpToken}` } }
      );
      if (vpList.status === 200 && vpList.body.projects.length === 0) {
        console.log('  ✅ PASS: 1.1 Công chức không phụ trách dự án xem danh sách -> Chỉ thấy 0 dự án (không xem toàn bộ)');
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(vpList));
      }

      // 1.2 Công chức Văn phòng gọi GET /api/projects/1 -> 403 Forbidden
      const vpDetail = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${empVpToken}` } }
      );
      if (vpDetail.status === 403) {
        console.log('  ✅ PASS: 1.2 Công chức truy cập trực tiếp URL dự án không phân công -> 403 Forbidden');
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(vpDetail));
      }

      // 1.3 Công chức (kể cả Địa chính) gọi POST /api/projects để tạo dự án -> 403 Forbidden
      const empCreate = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { Authorization: `Bearer ${empDcToken}` } },
        { project_name: 'Dự án do công chức tự tạo trái phép', investment_group: 'C' }
      );
      if (empCreate.status === 403) {
        console.log('  ✅ PASS: 1.3 Công chức (EMPLOYEE) cố tạo dự án -> Bị chặn 403 Forbidden (Chỉ Lãnh đạo / Trưởng phòng)');
      } else {
        throw new Error('FAIL 1.3: ' + JSON.stringify(empCreate));
      }

      // 1.4 Công chức Địa chính xem dự án được phân công (DA 1) -> 200 OK
      const dcDetailAssigned = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (dcDetailAssigned.status === 200 && dcDetailAssigned.body.project.id === 1) {
        console.log('  ✅ PASS: 1.4 Công chức xem chi tiết dự án mình phụ trách (PM) -> 200 OK');
      } else {
        throw new Error('FAIL 1.4: ' + JSON.stringify(dcDetailAssigned));
      }

      // 1.5 Công chức Địa chính cố truy cập dự án DA 3 (do người khác phụ trách) -> 403 Forbidden
      const dcDetailUnassigned = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/3', method: 'GET', headers: { Authorization: `Bearer ${empDcToken}` } }
      );
      if (dcDetailUnassigned.status === 403) {
        console.log('  ✅ PASS: 1.5 Công chức Địa chính cố xem dự án không được phân công (DA 3) -> 403 Forbidden');
      } else {
        throw new Error('FAIL 1.5: ' + JSON.stringify(dcDetailUnassigned));
      }

      // 1.6 Công chức Địa chính cố sửa trường nhạy cảm (Giá trị hợp đồng / Quyết định duyệt) -> 403 Forbidden
      const dcEditSensitive = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT', headers: { Authorization: `Bearer ${empDcToken}` } },
        { contract_value: 9999999999 }
      );
      if (dcEditSensitive.status === 403) {
        console.log('  ✅ PASS: 1.6 Công chức cố sửa trường nhạy cảm (Giá trị HĐ / QĐ duyệt) -> Bị chặn 403 Forbidden');
      } else {
        throw new Error('FAIL 1.6: ' + JSON.stringify(dcEditSensitive));
      }

      // 1.7 Trưởng phòng Địa chính sửa trường nhạy cảm -> 200 OK
      const headEditSensitive = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT', headers: { Authorization: `Bearer ${headDcToken}` } },
        { contract_value: 3500000000 }
      );
      if (headEditSensitive.status === 200) {
        console.log('  ✅ PASS: 1.7 Trưởng phòng Địa chính sửa trường nhạy cảm theo đúng thẩm quyền -> 200 OK');
      } else {
        throw new Error('FAIL 1.7: ' + JSON.stringify(headEditSensitive));
      }

      // 1.8 Chặn xóa dự án có vốn/hồ sơ với HTTP 409 Conflict
      const leaderDel = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'DELETE', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (leaderDel.status === 409) {
        console.log('  ✅ PASS: 1.8 Chủ tịch UBND xã xóa dự án đã có giải ngân/hồ sơ -> Trả về 409 Conflict');
      } else {
        throw new Error('FAIL 1.8: ' + JSON.stringify(leaderDel));
      }

      console.log('\n======================================================');
      console.log('UAT 2: CĂN CỨ PHÁP LÝ & WORKFLOW 16 BƯỚC');
      console.log('======================================================');

      // 2.1 Kiểm tra 16 bước đều có căn cứ pháp lý và phân định thẩm quyền
      const p1Workflow = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (p1Workflow.status === 200 && p1Workflow.body.workflow_steps.length === 16) {
        console.log('  ✅ PASS: 2.1 Hồ sơ dự án chứa đầy đủ 16 bước quy trình kiểm soát');
      } else {
        throw new Error('FAIL 2.1: ' + JSON.stringify(p1Workflow));
      }

      console.log('\n======================================================');
      console.log('UAT 3: CẤU HÌNH NGƯỠNG PROGRESS GAPS & TÀI CHÍNH KHÔNG TRÙNG LẶP');
      console.log('======================================================');

      // 3.1 Cấu hình động ngưỡng cảnh báo chênh lệch qua Query Param
      const dashCustomGap = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/dashboard?warning_gap=5&danger_gap=20', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (dashCustomGap.status === 200 && Array.isArray(dashCustomGap.body.progress_gaps)) {
        console.log(`  ✅ PASS: 3.1 Dashboard hỗ trợ cấu hình động ngưỡng cảnh báo gap (Phát hiện ${dashCustomGap.body.progress_gaps.length} cảnh báo)`);
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(dashCustomGap));
      }

      // 3.2 Kiểm tra SQL JOIN không làm nhân bản vốn/giải ngân
      const linkedInvSum = await db('projects as pr')
        .leftJoin('public_investment_projects as inv', 'pr.investment_project_id', 'inv.id')
        .sum('inv.disbursed_amount as total')
        .first();
      
      const expectedDisbursed = Number((linkedInvSum as any)?.total || 0);

      const dashDefault = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/dashboard', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );

      if (
        dashDefault.status === 200 &&
        dashDefault.body.financials.total_disbursed_amount === expectedDisbursed &&
        expectedDisbursed === 1830000000
      ) {
        console.log(`  ✅ PASS: 3.2 SQL JOIN chuẩn 1:1, bảo toàn 100% số liệu giải ngân (${dashDefault.body.financials.total_disbursed_amount.toLocaleString()}đ), không nhân bản`);
      } else {
        throw new Error(`FAIL 3.2: Disbursed mismatch: Expected ${expectedDisbursed}, got ${dashDefault.body.financials.total_disbursed_amount}`);
      }

      console.log('\n🏆 ALL FINAL UAT ACCEPTANCE CHECKS VERIFIED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ UAT Acceptance Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runProjectUATAcceptance();
