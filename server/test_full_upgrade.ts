import http from 'http';
import app from './src/app';

const PORT = 5096;
let server: http.Server;

function request(options: http.RequestOptions, postData?: any): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode || 0, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);

    if (postData) {
      const payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.write(payload);
    }
    req.end();
  });
}

let adminToken = '';

async function runTests() {
  console.log('\n--- 1. Login Admin to obtain Token ---');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'admin', password: 'admin123' }
  );

  if (loginRes.status === 200 && loginRes.body.token) {
    adminToken = loginRes.body.token;
    console.log('  ✅ PASS: Admin logged in successfully');
  } else {
    console.error('  ❌ FAIL: Could not login admin', loginRes.body);
    process.exit(1);
  }

  console.log('\n--- 2. Register New Member (Public Register) ---');
  const regEmail = `canbo_test_${Date.now()}@nghialam.gov.vn`;
  const regRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      fullname: 'Đồng chí Nguyễn Văn Mới',
      email: regEmail,
      phone: '0987654321',
      requested_department: 'Bộ phận Địa chính - Xây dựng',
      requested_position: 'Chuyên viên quản lý đất đai',
      password: 'password123',
    }
  );

  if (regRes.status === 201 && regRes.body.status === 'PENDING_APPROVAL') {
    console.log('  ✅ PASS: Member registered and placed in PENDING_APPROVAL status');
  } else {
    console.error('  ❌ FAIL: Registration failed', regRes.body);
  }

  console.log('\n--- 3. Gmail / Google Authentication ---');
  const gmail = `canbo_gmail_${Date.now()}@gmail.com`;
  const googleRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/google',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: gmail,
      fullname: 'Trần Thị Thu Gmail',
      google_id: 'goog_123456789',
      requested_department: 'Trung tâm Phục vụ Hành chính công',
      requested_position: 'Cán bộ tiếp nhận và trả kết quả',
    }
  );

  if (googleRes.status === 200 && googleRes.body.status === 'PENDING_APPROVAL') {
    console.log('  ✅ PASS: New Gmail user registered and placed in PENDING_APPROVAL');
  } else {
    console.error('  ❌ FAIL: Gmail auth failed', googleRes.body);
  }

  console.log('\n--- 4. Admin checks Pending Approvals ---');
  const pendingRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/users/pending/list',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  let pendingUserId: number | null = null;
  if (pendingRes.status === 200 && Array.isArray(pendingRes.body.pending_users)) {
    const found = pendingRes.body.pending_users.find((u: any) => u.email === gmail);
    if (found) pendingUserId = found.id;
    console.log(`  ✅ PASS: Admin retrieved ${pendingRes.body.pending_users.length} pending members`);
  } else {
    console.error('  ❌ FAIL: Could not retrieve pending members', pendingRes.body);
  }

  console.log('\n--- 5. Admin Approves & Assigns Position / Department / Role ---');
  if (pendingUserId) {
    const approveRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/users/${pendingUserId}/approve`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        role: 'EMPLOYEE',
        department_id: 1,
        position: 'Cán bộ Bộ phận Một cửa xã Nghĩa Lâm',
      }
    );

    if (approveRes.status === 200 && approveRes.body.user.status === 'ACTIVE') {
      console.log('  ✅ PASS: Admin approved and assigned role & position successfully');
    } else {
      console.error('  ❌ FAIL: Approval failed', approveRes.body);
    }

    // Now test Gmail login again for approved user
    const googleLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/google',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: gmail,
      }
    );

    if (googleLoginRes.status === 200 && googleLoginRes.body.token && googleLoginRes.body.user.role === 'EMPLOYEE') {
      console.log('  ✅ PASS: Approved Gmail user logs in and receives session JWT token');
    } else {
      console.error('  ❌ FAIL: Approved Gmail login failed', googleLoginRes.body);
    }
  }

  console.log('\n--- 6. Excel Bulk Import Personnel ---');
  const importUsersRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/import-excel',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      users: [
        {
          fullname: 'Lê Văn Thắng',
          email: 'thangle@nghialam.gov.vn',
          phone: '0912345678',
          department_name: 'Ban Chỉ huy Quân sự xã',
          position: 'Phó Chỉ huy trưởng Quân sự',
          role: 'DEPARTMENT_HEAD',
        },
        {
          fullname: 'Hoàng Thị Dung',
          email: 'dunghoang@nghialam.gov.vn',
          phone: '0978112233',
          department_name: 'Bộ phận Văn hóa - Xã hội',
          position: 'Công chức Văn hóa - Xã hội',
          role: 'EMPLOYEE',
        },
      ],
    }
  );

  if (importUsersRes.status === 200 && (importUsersRes.body.created_count + importUsersRes.body.updated_count >= 1)) {
    console.log(`  ✅ PASS: Bulk imported/updated ${importUsersRes.body.created_count + importUsersRes.body.updated_count} personnel from Excel`);
  } else {
    console.error('  ❌ FAIL: Import personnel failed', importUsersRes.body);
  }

  console.log('\n--- 7. Excel Bulk Import Decree 335 Catalog ---');
  const importCatalogRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/catalog/import-excel',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    {
      items: [
        {
          code: 'NL_KT_001',
          name: 'Kiểm tra hiện trường trật tự xây dựng nông thôn',
          category: 'PART_B_GROUP_I',
          coefficient: 1.25,
          baseline_score: 5.0,
          description: 'Biên bản kiểm tra thực địa kèm chữ ký các bên liên quan',
        },
        {
          code: 'NL_TP_002',
          name: 'Chứng thực bản sao điện tử từ bản chính',
          category: 'PART_A',
          coefficient: 1.0,
          baseline_score: 5.0,
          description: 'Bản sao điện tử ký số hợp lệ trên cổng dịch vụ công',
        },
      ],
    }
  );

  if (importCatalogRes.status === 200 && (importCatalogRes.body.created_count + importCatalogRes.body.updated_count >= 1)) {
    console.log(`  ✅ PASS: Bulk imported/updated ${importCatalogRes.body.created_count + importCatalogRes.body.updated_count} Decree 335 items from Excel`);
  } else {
    console.error('  ❌ FAIL: Import catalog failed', importCatalogRes.body);
  }

  console.log('\n--- 8. 1-Click Load Official Catalog from QĐ Nghĩa Lâm (1.400+ items) ---');
  const officialQDRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/catalog/import-official-qd',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (officialQDRes.status === 200 && officialQDRes.body.total > 0) {
    console.log(`  ✅ PASS: Ingested official QĐ Nghĩa Lâm catalog (${officialQDRes.body.total} items)`);
  } else {
    console.log(`  ℹ️ Note: Official file import response: ${JSON.stringify(officialQDRes.body)}`);
  }

  console.log('\n========================================');
  console.log('📊 UPGRADE TEST SUITE COMPLETE');
  console.log('========================================\n');

  server.close();
  process.exit(0);
}

server = app.listen(PORT, () => {
  console.log(`🧪 Upgrade Test Server running on http://localhost:${PORT}`);
  runTests().catch((err) => {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  });
});
