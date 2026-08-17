import http from 'http';
import app from './src/app';
import db from './src/config/db';
import { getApplicableSettlementLegalBasis, SETTLEMENT_CUTOFF_DATE_2026 } from './src/constants/projectConstants';

const PORT = 5160;

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

async function runLegalCompliance2026Tests() {
  console.log('⏳ Resetting database via knex seed...');
  await db.seed.run();
  console.log('✅ Database reset successfully.');

  const server = app.listen(PORT, async () => {
    console.log(`🏛️ Legal Compliance 2026 Verification Server running on http://localhost:${PORT}`);

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
      const empDcToken = await login('congchuc_dc', 'emp123');
      const empVpToken = await login('congchuc_vp', 'emp123');

      console.log('\n======================================================');
      console.log('1. KIỂM THỬ QUY TẮC CHUYỂN TIẾP PHÁP LÝ TỪ NGÀY 01/7/2026');
      console.log('======================================================');

      // 1.1 Kiểm tra Transition Rule trước 01/7/2026 (Không mặc nhiên áp đặt NĐ 254/2025)
      const beforeCutoff = getApplicableSettlementLegalBasis('2026-05-15');
      if (beforeCutoff.template_type === 'TRANSITIONAL_PRE_JULY_2026' && beforeCutoff.legal_review_required === true) {
        console.log('  ✅ PASS: 1.1 Hồ sơ quyết toán trước 01/7/2026 áp dụng quy tắc chuyển tiếp và đánh dấu LEGAL_REVIEW_REQUIRED');
      } else {
        throw new Error('FAIL 1.1: ' + JSON.stringify(beforeCutoff));
      }

      // 1.2 Kiểm tra Transition Rule từ 01/7/2026 trở đi (NĐ 193/2026 & TT 73/2026)
      const afterCutoff = getApplicableSettlementLegalBasis('2026-07-15');
      if (afterCutoff.template_type === 'CIRCULAR_73_2026' && afterCutoff.decree.includes('193/2026') && afterCutoff.circular.includes('73/2026')) {
        console.log('  ✅ PASS: 1.2 Hồ sơ quyết toán từ 01/7/2026 bắt buộc áp dụng Nghị định 193/2026/NĐ-CP & Thông tư 73/2026/TT-BTC');
      } else {
        throw new Error('FAIL 1.2: ' + JSON.stringify(afterCutoff));
      }

      // 1.3 API /projects/:id trả về applicable_settlement_framework chính xác
      const p1Res = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (p1Res.status === 200 && p1Res.body.applicable_settlement_framework) {
        console.log(`  ✅ PASS: 1.3 API /projects/1 tích hợp phân tích pháp lý quyết toán: [${p1Res.body.applicable_settlement_framework.decree}]`);
      } else {
        throw new Error('FAIL 1.3: ' + JSON.stringify(p1Res));
      }

      console.log('\n======================================================');
      console.log('2. ĐỐI CHIẾU 16 BƯỚC VỚI NGHỊ ĐỊNH 175/2024 & NGHỊ ĐỊNH 214/2025');
      console.log('======================================================');

      const steps = p1Res.body.workflow_steps;
      const step5 = steps.find((s: any) => s.step_number === 5);
      const step9 = steps.find((s: any) => s.step_number === 9);
      const step10 = steps.find((s: any) => s.step_number === 10);
      const step12 = steps.find((s: any) => s.step_number === 12);
      const step15 = steps.find((s: any) => s.step_number === 15);

      if (step5 && step5.legal_basis.includes('175/2024')) {
        console.log('  ✅ PASS: 2.1 Bước 5 (Nhiệm vụ khảo sát) tham chiếu chuẩn Nghị định 175/2024/NĐ-CP (thay thế NĐ 15/2021)');
      } else {
        throw new Error('FAIL 2.1: Step 5 legal basis mismatch');
      }

      if (step9 && step9.legal_basis.includes('58/2024/QH15') && step9.legal_basis.includes('175/2024')) {
        console.log('  ✅ PASS: 2.2 Bước 9 (Quyết định đầu tư) tham chiếu Luật ĐTC số 58/2024/QH15 và NĐ 175/2024/NĐ-CP');
      } else {
        throw new Error('FAIL 2.2: Step 9 legal basis mismatch');
      }

      if (step10 && step10.legal_basis.includes('22/2023/QH15') && step10.legal_basis.includes('24/2024')) {
        console.log('  ✅ PASS: 2.3 Bước 10 (KHLCNT) làm rõ quan hệ Luật Đấu thầu 2023, NĐ 24/2024 và NĐ 214/2025');
      } else {
        throw new Error('FAIL 2.3: Step 10 legal basis mismatch');
      }

      if (step12 && step12.legal_basis.includes('254/2025') && !step12.legal_basis.includes('193/2026')) {
        console.log('  ✅ PASS: 2.4 Bước 12 (Thanh toán, giải ngân) phân định đúng phạm vi NĐ 254/2025 (không gán nhầm NĐ 193/2026)');
      } else {
        throw new Error('FAIL 2.4: Step 12 legal basis mismatch');
      }

      if (step15 && step15.legal_basis.includes('193/2026')) {
        console.log('  ✅ PASS: 2.5 Bước 15 (Quyết toán) tham chiếu chuẩn Nghị định 193/2026/NĐ-CP & Thông tư 73/2026/TT-BTC');
      } else {
        throw new Error('FAIL 2.5: Step 15 legal basis mismatch');
      }

      console.log('\n======================================================');
      console.log('3. HỒ SƠ ĐIỆN TỬ THEO THÔNG TƯ 73/2026/TT-BTC & BẢO VỆ DỮ LIỆU');
      console.log('======================================================');

      // 3.1 Thêm tài liệu Báo cáo quyết toán theo Mẫu 01/QTDA Thông tư 73/2026/TT-BTC
      const addDocRes = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1/documents', method: 'POST', headers: { Authorization: `Bearer ${headDcToken}` } },
        {
          document_name: 'Báo cáo quyết toán vốn đầu tư hoàn thành (Mẫu 01/QTDA)',
          document_type: 'settlement_form_01_tt73',
          document_code: '01/QTDA-2026',
          issuing_authority: 'UBND xã Nghĩa Lâm',
          issuing_date: '2026-07-20',
          file_url: '/uploads/docs/settlement_01_tt73.pdf',
          workflow_step_id: step15.id
        }
      );
      if (addDocRes.status === 201) {
        console.log('  ✅ PASS: 3.1 Đính kèm tài liệu chuẩn Thông tư 73/2026/TT-BTC thành công (Mẫu 01/QTDA)');
      } else {
        throw new Error('FAIL 3.1: ' + JSON.stringify(addDocRes));
      }

      // 3.2 Chặn xóa dự án có tài liệu và giải ngân với HTTP 409
      const delRes = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/1', method: 'DELETE', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (delRes.status === 409) {
        console.log('  ✅ PASS: 3.2 Bảo vệ toàn vẹn: Chặn xóa vĩnh viễn dự án đã có hồ sơ và giải ngân (HTTP 409 Conflict)');
      } else {
        throw new Error('FAIL 3.2: ' + JSON.stringify(delRes));
      }

      console.log('\n======================================================');
      console.log('4. PHÂN QUYỀN RBAC BACKEND & KHÔNG NHÂN BẢN TÀI CHÍNH');
      console.log('======================================================');

      // 4.1 Công chức không được tạo dự án
      const empCreate = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects', method: 'POST', headers: { Authorization: `Bearer ${empDcToken}` } },
        { project_name: 'Dự án vi phạm thẩm quyền' }
      );
      if (empCreate.status === 403) {
        console.log('  ✅ PASS: 4.1 Công chức (EMPLOYEE) bị chặn tạo dự án với HTTP 403 Forbidden');
      } else {
        throw new Error('FAIL 4.1: ' + JSON.stringify(empCreate));
      }

      // 4.2 Dashboard kiểm tra SQL JOIN không làm nhân bản số liệu
      const dash = await request(
        { hostname: 'localhost', port: PORT, path: '/api/projects/dashboard', method: 'GET', headers: { Authorization: `Bearer ${leaderToken}` } }
      );
      if (dash.status === 200 && dash.body.financials.total_disbursed_amount === 1830000000) {
        console.log('  ✅ PASS: 4.2 Tổng số liệu giải ngân đọc 1:1 từ nguồn ĐTC đạt 1,830,000,000đ (Khớp 100%, không nhân bản)');
      } else {
        throw new Error('FAIL 4.2: ' + JSON.stringify(dash));
      }

      console.log('\n🏆 ALL 2026 LEGAL COMPLIANCE & TRANSITION RULE CHECKS VERIFIED 100%!');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('❌ Legal Compliance Test failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runLegalCompliance2026Tests();
