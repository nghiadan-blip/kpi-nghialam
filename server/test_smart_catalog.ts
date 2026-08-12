import http from 'http';
import app from './src/app';

const PORT = 5097;

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(PORT, () => {
    console.log(`🧪 Smart Catalog Matcher Test Server running on http://localhost:${PORT}`);
  });

  try {
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

    const token = loginRes.body.token;
    if (!token) throw new Error('Cannot login admin');
    console.log('  ✅ PASS: Admin logged in successfully');

    console.log('\n--- 2. Test Smart Catalog Matching for Dia Chinh ---');
    const diaChinhRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/ai/match-catalog',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      {
        query: 'kiểm tra ranh giới thửa đất tranh chấp',
        position: 'Công chức Địa chính - Xây dựng',
        department: 'Bộ phận Địa chính - Xây dựng',
        limit: 5,
      }
    );

    console.log('  Matches found:', diaChinhRes.body.matches?.length, 'Source:', diaChinhRes.body.source);
    if (diaChinhRes.status === 200 && diaChinhRes.body.matches && diaChinhRes.body.matches.length > 0) {
      console.log('  ✅ PASS: Smart matcher returned relevant items for Dia Chinh');
      console.log('  Top item:', diaChinhRes.body.matches[0].item.name, 'K =', diaChinhRes.body.matches[0].item.coefficient);
    } else {
      console.error('  ❌ FAIL: Dia Chinh matching failed', diaChinhRes.body);
    }

    console.log('\n--- 3. Test Smart Catalog Matching for Tu Phap ---');
    const tuPhapRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/ai/match-catalog',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      {
        query: 'đăng ký kết hôn cho công dân',
        position: 'Công chức Tư pháp - Hộ tịch',
        department: 'Bộ phận Tư pháp - Hộ tịch',
        limit: 5,
      }
    );

    if (tuPhapRes.status === 200 && tuPhapRes.body.matches && tuPhapRes.body.matches.length > 0) {
      console.log('  ✅ PASS: Smart matcher returned relevant items for Tu Phap');
      console.log('  Top item:', tuPhapRes.body.matches[0].item.name, 'K =', tuPhapRes.body.matches[0].item.coefficient);
    } else {
      console.error('  ❌ FAIL: Tu Phap matching failed', tuPhapRes.body);
    }

    console.log('\n========================================');
    console.log('📊 SMART CATALOG MATCHER TEST COMPLETE');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.close();
  }
}

runTests();
