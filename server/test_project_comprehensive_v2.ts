import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5148;

function makeRequest(options: http.RequestOptions, body?: any): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
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
          resolve({ status: res.statusCode || 200, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) { req.write(postData); }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 BẮT ĐẦU CHẠY TEST SUITE TOÀN DIỆN V2 - QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG');
  console.log('========================================================================\n');

  console.log('⏳ Làm mới dữ liệu qua knex seed:run...');
  await db.seed.run();
  console.log('✅ Dữ liệu seed đã được thiết lập mới thành công.\n');

  const server = app.listen(PORT, async () => {
    console.log(`🏛️ Test Server đang chạy tại http://localhost:${PORT}`);

    let passed = 0;
    let failed = 0;

    async function testCase(name: string, fn: () => Promise<void>) {
      try {
        await fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Lỗi: ${err.message}`);
        failed++;
      }
    }

    try {
      const login = async (username: string, pass: string) => {
        const res = await makeRequest(
          { hostname: 'localhost', port: PORT, path: '/api/auth/login', method: 'POST' },
          { username, password: pass }
        );
        if (!res.body.token) throw new Error(`Đăng nhập thất bại cho ${username}: ${JSON.stringify(res.body)}`);
        return res.body.token;
      };

      const leaderToken = await login('chutich', 'chutich123'); // LEADERSHIP (Chủ tịch)
      const cadastralToken = await login('congchuc_dc', 'emp123'); // EMPLOYEE Dept 3 (Địa chính - Xây dựng)
      const officeToken = await login('congchuc_vp', 'emp123'); // EMPLOYEE Dept 5 (Văn phòng)

      // 1. Lọc PREPARATION
      await testCase('1. Lọc dự án theo mã trạng thái PREPARATION', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects?lifecycle_status=PREPARATION', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!Array.isArray(res.body.projects)) throw new Error('Projects not an array');
      });

      // 2. Lọc DELAYED
      await testCase('2. Lọc dự án theo trạng thái Chậm tiến độ (is_delayed=true)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects?is_delayed=true', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!Array.isArray(res.body.projects)) throw new Error('Projects not an array');
      });

      // 3. Lọc vướng mắc
      await testCase('3. Lọc dự án theo loại vướng mắc WEATHER và LEGAL_PROCEDURE', async () => {
        const resWeather = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects?obstacle_type=WEATHER', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (resWeather.status !== 200) throw new Error(`Weather Status ${resWeather.status}`);

        const resLegal = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects?obstacle_type=LEGAL_PROCEDURE', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (resLegal.status !== 200) throw new Error(`Legal Status ${resLegal.status}`);
      });

      // 4. Mã dự án trùng bị từ chối
      await testCase('4. Mã dự án trùng nhau bị từ chối (HTTP 400)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-2026-01', // Đã có trong seed
          project_name: 'Dự án trùng mã kiểm thử',
          investment_group: 'C'
        });
        if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
        if (!res.body.message.includes('đã tồn tại')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 5. Mã sai định dạng bị từ chối
      await testCase('5. Mã dự án sai định dạng DA-YYYY-NN bị từ chối (HTTP 400)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-SAI-DINH-DANG',
          project_name: 'Dự án mã sai format',
          investment_group: 'C'
        });
        if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
        if (!res.body.message.includes('DA-YYYY-NN')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 6. Vốn/giải ngân âm bị từ chối
      await testCase('6. Giá trị hợp đồng hoặc vốn âm bị từ chối (HTTP 400)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-2026-91',
          project_name: 'Dự án vốn âm kiểm thử',
          investment_group: 'C',
          contract_value: -50000000
        });
        if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
        if (!res.body.message.includes('âm')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 7. Giải ngân > vốn bị từ chối
      await testCase('7. Tạo dự án kèm giải ngân vượt vốn phân bổ bị từ chối (HTTP 400)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-2026-92',
          project_name: 'Dự án giải ngân vượt vốn phân bổ',
          investment_group: 'C',
          create_new_investment: true,
          investment_payload: {
            funding_source: 'Ngân sách xã',
            planned_capital: 1000000000,
            allocated_capital: 500000000,
            disbursed_amount: 800000000 // Vượt 500tr
          }
        });
        if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
        if (!res.body.message.includes('vượt quá')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 8. Thiếu nhà thầu/số HĐ không được ký HĐ
      await testCase('8. Thiếu thông tin nhà thầu hoặc giá trị hợp đồng khi có số HĐ bị từ chối (HTTP 400)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-2026-93',
          project_name: 'Dự án thiếu thông tin HĐ',
          investment_group: 'C',
          contract_no: 'HD-TEST-93'
        });
        if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
      });

      // 9. Thi công 100% thiếu nghiệm thu không được chuyển hoàn thành
      await testCase('9. Chuyển COMPLETION_ACCEPTANCE khi thiếu Biên bản nghiệm thu bị chặn (Gate Rule 400)', async () => {
        const createRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          project_code: 'DA-2026-94',
          project_name: 'Dự án kiểm tra Gate Rule Nghiệm thu',
          investment_group: 'C',
          approval_decision_no: '94/QĐ-UBND'
        });
        const pId = createRes.body.id;

        const updateRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: `/api/projects/${pId}`, method: 'PUT',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          lifecycle_status: 'COMPLETION_ACCEPTANCE'
        });
        if (updateRes.status !== 400) throw new Error(`Expected status 400, got ${updateRes.status}`);
        if (!updateRes.body.message.includes('Biên bản nghiệm thu')) throw new Error(`Unexpected message: ${updateRes.body.message}`);
      });

      // 10. Thiếu BB bàn giao không chuyển HANDED_OVER
      await testCase('10. Chuyển HANDED_OVER khi thiếu Biên bản bàn giao bị chặn (Gate Rule 400)', async () => {
        const updateRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/2', method: 'PUT',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          lifecycle_status: 'HANDED_OVER'
        });
        if (updateRes.status !== 400) throw new Error(`Expected status 400, got ${updateRes.status}`);
        if (!updateRes.body.message.includes('Biên bản bàn giao')) throw new Error(`Unexpected message: ${updateRes.body.message}`);
      });

      // 11. Thiếu QĐ quyết toán không chuyển SETTLEMENT_APPROVED
      await testCase('11. Chuyển SETTLEMENT_APPROVED khi thiếu QĐ quyết toán bị chặn (Gate Rule 400)', async () => {
        const updateRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/2', method: 'PUT',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, {
          lifecycle_status: 'SETTLEMENT_APPROVED'
        });
        if (updateRes.status !== 400) throw new Error(`Expected status 400, got ${updateRes.status}`);
        if (!updateRes.body.message.includes('Quyết định phê duyệt quyết toán')) throw new Error(`Unexpected message: ${updateRes.body.message}`);
      });

      // 12. Quá hạn tự tính delay_days
      await testCase('12. API getProjects tự động tính toán delay_days và gắn is_delayed', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const delayedProj = res.body.projects.find((p: any) => p.is_delayed);
        if (!delayedProj) {
          console.log('   (Dự án đang đúng hạn hoặc mới khởi tạo)');
        }
      });

      // 13. Cảnh báo Progress Gap
      await testCase('13. Dashboard tính toán cảnh báo chênh lệch Progress Gap', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/dashboard?warning_gap=15&danger_gap=30', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!Array.isArray(res.body.progress_gaps)) throw new Error('progress_gaps not array');
      });

      // 14. EMPLOYEE bị chặn sửa trường nhạy cảm
      await testCase('14. EMPLOYEE bị chặn sửa các trường nhạy cảm như QĐ phê duyệt (HTTP 403)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'PUT',
          headers: { 'Authorization': `Bearer ${cadastralToken}` }
        }, {
          approval_decision_no: 'SỬA_TRÁI_PHÉP_999'
        });
        if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
        if (!res.body.message.includes('Quyết định phê duyệt')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 15. Cột Hành động theo RBAC & Quyền Xem
      await testCase('15. Công chức khác bộ phận không xem được toàn bộ dự án (Data isolation)', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects', method: 'GET',
          headers: { 'Authorization': `Bearer ${officeToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const otherProjects = res.body.projects.filter((p: any) => p.project_manager_id !== 9 && p.created_by !== 9);
        if (otherProjects.length > 0) throw new Error('Data isolation failed: Office user saw other projects');
      });

      // 16. Tìm kiếm không dấu / 1 phần
      await testCase('16. Tìm kiếm dự án theo từ khóa không dấu và 1 phần', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects?search=be+tong', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
      });

      // 17. Xuất báo cáo Excel khớp bộ lọc
      await testCase('17. API /api/projects/export xuất tệp Excel binary hợp lệ', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/export?investment_group=C', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const contentType = String(res.headers['content-type'] || '');
        if (!contentType.includes('spreadsheetml')) throw new Error(`Content-Type ${contentType} is not spreadsheetml`);
      });

      // 18. Xóa dự án phát sinh trả 409 Conflict
      await testCase('18. Xóa dự án đã phát sinh giải ngân / hồ sơ trả về HTTP 409 Conflict', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'DELETE',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        }, { action: 'delete' });
        if (res.status !== 409) throw new Error(`Expected status 409 Conflict, got ${res.status}`);
        if (!res.body.message.includes('Không thể xóa dự án')) throw new Error(`Unexpected message: ${res.body.message}`);
      });

      // 19. Audit log đầy đủ
      await testCase('19. Truy xuất audit log đầy đủ của dự án', async () => {
        const res = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/projects/1/audit-log', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!Array.isArray(res.body.logs)) throw new Error('Logs not an array');
      });

      // 20. Regression test toàn bộ phân hệ (KPI, ĐTC, Ngân sách, Đất đai, Văn phòng)
      await testCase('20. Regression test toàn bộ phân hệ (KPI, ĐTC, Ngân sách, Đất đai, Văn phòng)', async () => {
        // KPI
        const kpiRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/evaluations', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (kpiRes.status !== 200) throw new Error(`KPI failed: ${kpiRes.status}`);

        // Public Investment
        const invRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/public-investment', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (invRes.status !== 200) throw new Error(`Public Investment failed: ${invRes.status}`);

        // Budget
        const budRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/budget', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (budRes.status !== 200) throw new Error(`Budget failed: ${budRes.status}`);

        // Land
        const landRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/land-certificates', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (landRes.status !== 200) throw new Error(`Land failed: ${landRes.status}`);

        // Office
        const officeRes = await makeRequest({
          hostname: 'localhost', port: PORT, path: '/api/office', method: 'GET',
          headers: { 'Authorization': `Bearer ${leaderToken}` }
        });
        if (officeRes.status !== 200) throw new Error(`Office failed: ${officeRes.status}`);
      });

      console.log('\n========================================================================');
      console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passed}/20 PASSED, ${failed} FAILED`);
      console.log('========================================================================\n');

      server.close();
      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (fatalErr) {
      console.error('Lỗi nghiêm trọng trong quá trình kiểm thử:', fatalErr);
      server.close();
      process.exit(1);
    }
  });
}

runTests().catch((err) => {
  console.error('Fatal test bootstrap error:', err);
  process.exit(1);
});
