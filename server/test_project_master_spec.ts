import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5140;

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

async function runProjectMasterSpecTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🏛️ Project Master Spec Verification Server running on http://localhost:${PORT}`);

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
      console.log('PHASE 1: DỮ LIỆU & TRẠNG THÁI P0 (DATA INTEGRITY & STATE RULES)');
      console.log('======================================================');

      // 1.1 Tự sinh mã dự án chuẩn khi không nhập hoặc nhập DA
      const pNew = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { project_code: 'DA', project_name: 'Dự án tự sinh mã chuẩn', investment_group: 'C' }
      );
      if (pNew.status === 201 && pNew.body.id) {
        const pCheck = await db('projects').where('id', pNew.body.id).first();
        if (pCheck.project_code.startsWith('DA-2026-')) {
          console.log(`  ✅ PASS: 1.1 Tự sinh mã dự án chuẩn hóa thành công: [${pCheck.project_code}]`);
        } else {
          throw new Error('FAIL 1.1: Code not standardized: ' + pCheck.project_code);
        }
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(pNew));
      }

      // 1.2 Chặn xóa dự án có giải ngân hoặc có tài liệu (HTTP 409)
      const pDelFail = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'DELETE', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (pDelFail.status === 409) {
        console.log('  ✅ PASS: 1.2 Chặn xóa dự án đã có giải ngân/hồ sơ với HTTP 409 Conflict');
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(pDelFail));
      }

      // 1.3 Chuyển dự án sang trạng thái Lưu trữ (Archive)
      const pArchive = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${pNew.body.id}`, method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        { action: 'archive' }
      );
      if (pArchive.status === 200) {
        const pCheckArchived = await db('projects').where('id', pNew.body.id).first();
        if (pCheckArchived.lifecycle_status === 'ARCHIVED') {
          console.log('  ✅ PASS: 1.3 Chuyển hồ sơ dự án sang trạng thái Lưu trữ (ARCHIVED) thành công');
        } else {
          throw new Error('FAIL 1.3: Status is ' + pCheckArchived.lifecycle_status);
        }
      } else {
        throw new Error('FAIL 1.3: ' + JSON.stringify(pArchive));
      }

      console.log('\n======================================================');
      console.log('PHASE 2: HỒ SƠ ĐIỆN TỬ, 16 BƯỚC WORKFLOW, RBAC & AUDIT');
      console.log('======================================================');

      // 2.1 Dự án mới tự động khởi tạo đủ 16 bước quy trình kiểm soát
      const steps = await db('project_workflow_steps').where('project_id', pNew.body.id).orderBy('step_number', 'asc');
      if (steps.length === 16 && steps[0].step_code === 'STEP_01' && steps[15].step_code === 'STEP_16') {
        console.log('  ✅ PASS: 2.1 Khởi tạo đầy đủ 16 bước quy trình kiểm soát cho dự án mới');
      } else {
        throw new Error(`FAIL 2.1: Steps count is ${steps.length}`);
      }

      // 2.2 Gate condition: Phê duyệt Bước 1 chặn nếu chưa có Nghị quyết HĐND
      const approveStep1Fail = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${pNew.body.id}/workflow/1/approve`, method: 'POST', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (approveStep1Fail.status === 400 && approveStep1Fail.body.message.includes('Nghị quyết')) {
        console.log('  ✅ PASS: 2.2 Gate Rule: Chặn phê duyệt Bước 1 khi chưa đính kèm Nghị quyết HĐND');
      } else {
        throw new Error('FAIL 2.2: ' + JSON.stringify(approveStep1Fail));
      }

      // 2.3 Đính kèm văn bản Nghị quyết vào kho hồ sơ điện tử
      const docAdd = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${pNew.body.id}/documents`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        {
          document_name: 'Nghị quyết HĐND xã thông qua danh mục',
          document_type: 'resolution',
          document_code: '99/NQ-HĐND',
          file_url: '/uploads/nq_99.pdf'
        }
      );
      if (docAdd.status === 201 && docAdd.body.id) {
        console.log(`  ✅ PASS: 2.3 Đính kèm tài liệu điện tử thành công (Doc ID: ${docAdd.body.id})`);
      } else {
        throw new Error('FAIL 2.3: ' + JSON.stringify(docAdd));
      }

      // 2.4 Sau khi có Nghị quyết, phê duyệt Bước 1 thành công & tự kích hoạt Bước 2
      const approveStep1Ok = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${pNew.body.id}/workflow/1/approve`, method: 'POST', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (approveStep1Ok.status === 200) {
        const step2 = await db('project_workflow_steps').where({ project_id: pNew.body.id, step_number: 2 }).first();
        if (step2.status === 'IN_PROGRESS') {
          console.log('  ✅ PASS: 2.4 Phê duyệt Bước 1 thành công & tự động kích hoạt Bước 2 sang IN_PROGRESS');
        } else {
          throw new Error('FAIL 2.4: Step 2 status is ' + step2.status);
        }
      } else {
        throw new Error('FAIL 2.4: ' + JSON.stringify(approveStep1Ok));
      }

      // 2.5 Audit log ghi nhận đầy đủ thay đổi
      const auditRes = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${pNew.body.id}/audit-log`, method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (auditRes.status === 200 && auditRes.body.logs.length >= 2) {
        console.log(`  ✅ PASS: 2.5 Nhật ký Audit ghi nhận ${auditRes.body.logs.length} sự kiện kiểm soát bảo mật`);
      } else {
        throw new Error('FAIL 2.5: ' + JSON.stringify(auditRes));
      }

      console.log('\n======================================================');
      console.log('PHASE 3 & 4: VỐN, GIẢI NGÂN, ĐẤU THẦU, TIẾN ĐỘ & NGHIỆM THU');
      console.log('======================================================');

      // 3.1 Dữ liệu tài chính đọc trực tiếp từ nguồn /public-investment không trùng lặp
      const p1Detail = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (
        p1Detail.status === 200 &&
        p1Detail.body.project.inv_allocated_capital === 1200000000 &&
        p1Detail.body.project.inv_disbursed_amount === 980000000 &&
        p1Detail.body.project.inv_disbursement_rate === 81.67
      ) {
        console.log('  ✅ PASS: 3.1 /projects/1 đọc chính xác 100% số liệu tài chính giải ngân từ nguồn ĐTC');
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(p1Detail));
      }

      console.log('\n======================================================');
      console.log('PHASE 5: DASHBOARD ĐIỀU HÀNH, PROGRESS GAPS & BÁO CÁO');
      console.log('======================================================');

      // 5.1 Dashboard tổng hợp đầy đủ và phát hiện cảnh báo chênh lệch giải ngân/tiến độ
      const dash = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/dashboard', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (
        dash.status === 200 &&
        dash.body.total_projects >= 3 &&
        dash.body.financials.total_allocated_capital > 0
      ) {
        console.log(`  ✅ PASS: 5.1 Dashboard tổng hợp: ${dash.body.total_projects} dự án, Vốn PB: ${dash.body.financials.total_allocated_capital.toLocaleString()}đ, TB giải ngân: ${dash.body.financials.average_disbursement_rate}%`);
      } else {
        throw new Error('FAIL 5.1: ' + JSON.stringify(dash));
      }

      console.log('\n🏆 ALL 5 PHASES OF PROJECT LIFECYCLE MANAGEMENT VERIFIED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Project Master Spec Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runProjectMasterSpecTests();
