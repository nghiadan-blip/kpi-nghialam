import http from 'http';
import app from './src/app';
import db from './src/config/db';

const PORT = 5130;

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

async function runProjectLinkingTests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🔗 Project Linking Test Server running on http://localhost:${PORT}`);

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

      console.log('\n======================================================');
      console.log('1. TEST TẠO DỰ ÁN LIÊN KẾT ĐẦU TƯ CÔNG CÓ SẴN');
      console.log('======================================================');

      // 1.1 Tạo dự án liên kết với public_investment_projects id 1
      // Lưu ý: ban đầu seed đã liên kết id 1, nên thử tạo dự án mới với ĐTC id 1 sẽ bị chặn trùng!
      const p1 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${headDcToken}` } },
        { project_code: 'DA-DUP-01', project_name: 'Dự án trùng liên kết', investment_project_id: 1 }
      );
      if (p1.status === 400 && p1.body.message.includes('đã được liên kết')) {
        console.log('  ✅ PASS: 1.1 Không cho liên kết trùng công trình đầu tư công đã gắn với dự án khác');
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(p1));
      }

      console.log('\n======================================================');
      console.log('2. TEST TẠO ĐỒNG THỜI DỰ ÁN VÀ ĐẦU TƯ CÔNG BẰNG TRANSACTION');
      console.log('======================================================');

      const p2 = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        {
          project_code: 'DA-2026-99',
          project_name: 'Khu vui chơi thể thao xóm 5 Nghĩa Lâm',
          investment_group: 'C',
          contract_value: 850000000,
          create_new_investment: true,
          investment_payload: {
            planned_capital: 900000000,
            allocated_capital: 850000000,
            disbursed_amount: 0,
            funding_source: 'Ngân sách xã'
          }
        }
      );
      if (p2.status === 201 && p2.body.investment_project_id) {
        console.log(`  ✅ PASS: 2.1 Tạo đồng thời thành công! Project ID: ${p2.body.id}, Linked Investment ID: ${p2.body.investment_project_id}`);
      } else {
        throw new Error('FAIL 2.1: ' + JSON.stringify(p2));
      }

      console.log('\n======================================================');
      console.log('3. TEST ĐỌC DỮ LIỆU TÀI CHÍNH NGUỒN TỰ ĐỘNG CẬP NHẬT');
      console.log('======================================================');

      // 3.1 Cập nhật giải ngân ở public_investment_projects
      await db('public_investment_projects')
        .where('id', p2.body.investment_project_id)
        .update({ disbursed_amount: 425000000, disbursement_rate: 50.0, actual_progress_percent: 60.0 });

      // 3.2 Đọc lại chi tiết dự án tại /api/projects/:id
      const pDetail = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${p2.body.id}`, method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (
        pDetail.status === 200 &&
        pDetail.body.project.inv_disbursed_amount === 425000000 &&
        pDetail.body.project.inv_disbursement_rate === 50.0 &&
        pDetail.body.project.inv_actual_progress_percent === 60.0
      ) {
        console.log('  ✅ PASS: 3.1 /api/projects/:id tự động đọc số liệu giải ngân mới nhất từ bảng nguồn ĐTC mà không bị trùng lặp');
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(pDetail));
      }

      console.log('\n======================================================');
      console.log('4. TEST KHÔNG GHI ĐÈ SAI DỮ LIỆU TÀI CHÍNH KHI SỬA VÒNG ĐỜI');
      console.log('======================================================');

      const pUpdate = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${p2.body.id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` } },
        {
          approval_decision_no: '999/QĐ-UBND',
          bidding_method: 'Chỉ định thầu rút gọn',
          contract_no: '99/2026/HĐ-XL'
        }
      );
      if (pUpdate.status === 200) {
        // Kiểm tra xem public_investment_projects có bị mất số tiền giải ngân không
        const invCheck = await db('public_investment_projects').where('id', p2.body.investment_project_id).first();
        if (invCheck.disbursed_amount === 425000000 && invCheck.disbursement_rate === 50.0) {
          console.log('  ✅ PASS: 4.1 Sửa vòng đời dự án bảo toàn nguyên vẹn số liệu giải ngân của ĐTC');
        } else {
          throw new Error('FAIL 4.1: Investment data corrupted!');
        }
      } else {
        throw new Error('FAIL 4.1: ' + JSON.stringify(pUpdate));
      }

      console.log('\n======================================================');
      console.log('5. TEST CHẶN XÓA DỰ ÁN ĐÃ CÓ GIẢI NGÂN (HTTP 409)');
      console.log('======================================================');

      const pDel = await request(
        { hostname: 'localhost', port: PORT, path: `/api/projects/${p2.body.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (pDel.status === 409 && pDel.body.message.includes('đã phát sinh giải ngân')) {
        console.log('  ✅ PASS: 5.1 Chặn xóa dự án có giải ngân với HTTP 409 Conflict rõ ràng tiếng Việt');
      } else {
        throw new Error('FAIL 5.1: ' + JSON.stringify(pDel));
      }

      console.log('\n🏆 ALL PROJECT LINKING & 2-WAY DATA INTEGRITY TESTS PASSED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Project Linking Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runProjectLinkingTests();
