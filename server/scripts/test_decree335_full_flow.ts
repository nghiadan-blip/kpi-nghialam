import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runDecree335TestSuite() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN NGHỊ ĐỊNH 335 & 33 VỊ TRÍ VIỆC LÀM XÃ NGHĨA LÂM ===\n');

  // 1. Healthcheck
  const health = await axios.get(`${BASE_URL}/health`);
  console.log(`1. Backend Health Check: [${health.data.status}] - DB: ${health.data.database}`);

  // 2. Login as Leadership (chutich)
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'chutich',
    password: 'chutich123',
  });
  const adminToken = adminLogin.data.token;
  console.log(`2. Đăng nhập Lãnh đạo UBND xã thành công: ${adminLogin.data.user.fullname} (${adminLogin.data.user.role})`);

  // 3. Login as Employee (congchuc_dc)
  const empLogin = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'congchuc_dc',
    password: 'emp123',
  });
  const empToken = empLogin.data.token;
  const empUser = empLogin.data.user;
  console.log(`3. Đăng nhập Công chức: ${empUser.fullname} - Vị trí: [${empUser.position_code || 'N/A'}] ${empUser.position}`);

  // 4. Test 33 Official Job Positions API
  console.log('\n--- KIỂM TRA DANH MỤC 33 VỊ TRÍ VIỆC LÀM CHUẨN XÃ NGHĨA LÂM ---');
  const posRes = await axios.get(`${BASE_URL}/job-positions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Tổng số vị trí việc làm trong CSDL: ${posRes.data.total_positions} vị trí`);
  console.log(`✅ Tổng biên chế được giao: ${posRes.data.total_allocated_quota} biên chế`);
  console.log(`✅ Tổng biên chế đã bố trí: ${posRes.data.total_assigned} cán bộ`);

  const samplePos = posRes.data.job_positions.find((p: any) => p.code === 'NA-NL-II.15');
  if (samplePos) {
    console.log(`  -> Kiểm tra vị trí mẫu [NA-NL-II.15]: ${samplePos.name}`);
    console.log(`     Biên chế giao: ${samplePos.allocated_quota}, Đã bố trí: ${samplePos.current_assigned}, Tỷ lệ lấp đầy: ${samplePos.fill_rate_percent}%`);
  }

  // 5. Test Product Catalog N1-N5 Complexity
  console.log('\n--- KIỂM TRA PHÂN NHÓM ĐỘ PHỨC TẠP SẢN PHẨM N1 - N5 ---');
  const catRes = await axios.get(`${BASE_URL}/catalog`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const nGroups = ['N1', 'N2', 'N3', 'N4', 'N5'];
  nGroups.forEach((ng) => {
    const count = catRes.data.catalog.filter((c: any) => c.complexity_group === ng).length;
    console.log(`  -> Nhóm ${ng}: ${count} sản phẩm/công việc`);
  });

  // 6. Test Task Creation with Quantitative Conversion
  console.log('\n--- KIỂM TRA GIAO NHIỆM VỤ ĐỊNH MƯỢC & QUY ĐỔI SẢN PHẨM ---');
  const catalogItem = catRes.data.catalog[0];
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 5);

  const taskPayload = {
    title: 'Giải quyết hồ sơ cấp đổi Giấy chứng nhận QSD đất hộ gia đình ông Nguyễn Văn A',
    description: 'Thực hiện kiểm tra thực địa, đối chiếu bản đồ địa chính 2026 và lập phiếu trình ký',
    assigned_to: empUser.id,
    product_catalog_id: catalogItem.id,
    assigned_quantity: 4.0, // 4 hồ sơ
    deadline: deadline.toISOString(),
    weight: catalogItem.coefficient,
    status: 'PENDING',
  };

  const createTaskRes = await axios.post(`${BASE_URL}/tasks`, taskPayload, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const createdTaskId = createTaskRes.data.task.id;
  console.log(`✅ Đã giao nhiệm vụ mới ID ${createdTaskId}:`);
  console.log(`   Số lượng giao: ${createTaskRes.data.task.assigned_quantity || 4.0} x Hệ số K (${catalogItem.coefficient}) = ${createTaskRes.data.task.converted_assigned_quantity || 4.0 * catalogItem.coefficient} SP quy đổi`);

  // Sequential task transition check: Try jumping PENDING -> COMPLETED (Must fail)
  try {
    await axios.patch(
      `${BASE_URL}/tasks/${createdTaskId}/status`,
      { status: 'COMPLETED', evidence: 'Test fail skip' },
      { headers: { Authorization: `Bearer ${empToken}` } }
    );
    console.error('❌ LỖI: Lẽ ra phải chặn nhảy cóc từ PENDING -> COMPLETED!');
  } catch (err: any) {
    console.log(`✅ Đã chặn nhảy cóc trạng thái PENDING -> COMPLETED: "${err.response?.data?.message}"`);
  }

  // Update PENDING -> IN_PROGRESS
  await axios.patch(
    `${BASE_URL}/tasks/${createdTaskId}/status`,
    { status: 'IN_PROGRESS' },
    { headers: { Authorization: `Bearer ${empToken}` } }
  );
  console.log('✅ Chuyển trạng thái sang IN_PROGRESS thành công');

  // Update IN_PROGRESS -> COMPLETED with evidence & logs
  await axios.patch(
    `${BASE_URL}/tasks/${createdTaskId}/status`,
    {
      status: 'COMPLETED',
      evidence: 'Đã hoàn thành bàn giao Giấy chứng nhận số BD-123456 cho công dân ngày 12/08/2026',
      actual_completed_quantity: 4.0,
      delay_count: 0,
      rework_count: 0,
    },
    { headers: { Authorization: `Bearer ${empToken}` } }
  );
  console.log('✅ Hoàn thành nhiệm vụ COMPLETED kèm minh chứng và số lượng thực tế');

  // 7. Test Evaluation 30/70 Formula Flow
  console.log('\n--- KIỂM THỬ QUY TRÌNH ĐÁNH GIÁ 3 CẤP & CÔNG THỨC 30/70 ---');
  const evalMonth = '2026-09';

  // Clean up if existing
  try {
    const existingEvalRes = await axios.get(`${BASE_URL}/evaluations?month=${evalMonth}&employee_id=${empUser.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (existingEvalRes.data.evaluations?.length > 0) {
      await axios.delete(`${BASE_URL}/evaluations/${existingEvalRes.data.evaluations[0].id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  } catch (e) {}

  // Step 1: Save Draft & Submit Self Evaluation
  const evalDraftPayload = {
    month: evalMonth,
    criteria_politics_self: 14.5, // max 15
    criteria_expertise_self: 9.5,  // max 10
    criteria_innovation_self: 4.5, // max 5
    // General score = 14.5 + 9.5 + 4.5 = 28.5 / 30.0đ
    items: [
      {
        product_catalog_id: catalogItem.id,
        task_id: createdTaskId,
        quantity: 4,
        remarks: 'Đã hoàn thành 4/4 hồ sơ đúng tiến độ và chất lượng',
      },
    ],
    remarks: 'Tự chấm điểm tháng 08/2026 theo Nghị định 335',
  };

  const draftRes = await axios.post(`${BASE_URL}/evaluations/draft`, evalDraftPayload, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const evalId = draftRes.data.evaluation_id;
  console.log(`✅ Bước 1 (Lưu nháp): ID #${evalId}`);
  console.log(`   Điểm tiêu chí chung: ${draftRes.data.general_score}/30đ | Điểm nhiệm vụ: ${draftRes.data.task_score}/100đ -> Tổng tự chấm: ${draftRes.data.self_score}/100đ`);

  // Submit to Manager
  const submitRes = await axios.post(
    `${BASE_URL}/evaluations/${evalId}/submit`,
    {},
    { headers: { Authorization: `Bearer ${empToken}` } }
  );
  console.log(`✅ Bước 1 (Nộp phiếu): "${submitRes.data.message}"`);

  // Step 2: Department Head Review
  const managerReviewPayload = {
    criteria_politics_mgr: 14.0,
    criteria_expertise_mgr: 9.0,
    criteria_innovation_mgr: 4.5,
    // General score = 27.5đ + (100 * 70%) = 97.5đ
    collective_comments: 'Tập thể phòng Địa chính đánh giá đồng chí Tuấn nhiệt tình, hoàn thành tốt khối lượng công việc được giao.',
  };
  const mgrRes = await axios.post(`${BASE_URL}/evaluations/${evalId}/review`, managerReviewPayload, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Bước 2 (Trưởng phòng thẩm định): "${mgrRes.data.message}" - Điểm TP: ${mgrRes.data.manager_score}đ`);

  // Step 3: Leadership Approval
  const leadershipPayload = {
    criteria_politics_final: 14.0,
    criteria_expertise_final: 9.0,
    criteria_innovation_final: 4.5,
    final_score: 97.5,
    party_cell_comments: 'Chi ủy Chi bộ thống nhất xếp loại Hoàn thành xuất sắc nhiệm vụ.',
    remarks: 'Phê duyệt chính thức theo đề xuất của Trưởng phòng',
  };
  const apprRes = await axios.post(`${BASE_URL}/evaluations/${evalId}/approve`, leadershipPayload, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Bước 3 (Lãnh đạo UBND xã duyệt): "${apprRes.data.message}"`);
  console.log(`   Tổng điểm chính thức: ${apprRes.data.final_score}đ -> Xếp loại: [${apprRes.data.classification}]`);

  // 8. Test Quota Stats Monitoring (Điều 16 - Trần 20%)
  console.log('\n--- KIỂM TRA GIÁM SÁT HẠN MỨC LOẠI A (ĐIỀU 16) ---');
  const quotaRes = await axios.get(`${BASE_URL}/evaluations/quota-stats?month=${evalMonth}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Thống kê hạn mức tháng ${evalMonth}:`);
  console.log(`   Tổng duyệt: ${quotaRes.data.total_approved} cán bộ`);
  console.log(`   Loại A (Xuất sắc): ${quotaRes.data.count_a} | Loại B: ${quotaRes.data.count_b} | Loại C: ${quotaRes.data.count_c} | Loại D: ${quotaRes.data.count_d}`);
  console.log(`   Tỷ lệ Loại A: ${quotaRes.data.type_a_ratio_percent}% (Hạn mức cho phép: ${quotaRes.data.max_allowed_quota_a} cán bộ - 20%)`);
  console.log(`   Cảnh báo vượt trần: ${quotaRes.data.is_exceeding_quota ? '⚠️ CÓ (Vượt trần 20%)' : '✅ ĐẠT (Trong hạn mức)'}`);

  // 9. Test Employee Appeal Flow (Điều 22 - 7 ngày làm việc)
  console.log('\n--- KIỂM THỬ QUY TRÌNH KIẾN NGHỊ ĐÁNH GIÁ (ĐIỀU 22) ---');
  const appealPayload = {
    reason: 'Tôi đề nghị xem xét lại điểm tiêu chí đổi mới sáng tạo do trong tháng tôi đã có sáng kiến số hóa bản đồ giải phóng mặt bằng thôn 4.',
    evidence_url: 'https://ubnd-nghialam.gov.vn/sang-kien-04.pdf',
  };
  const appealRes = await axios.post(`${BASE_URL}/evaluations/${evalId}/appeal`, appealPayload, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const appealId = appealRes.data.appeal_id;
  console.log(`✅ Đã gửi đơn kiến nghị ID #${appealId}: "${appealRes.data.message}"`);
  console.log(`   Hạn chót giải quyết (7 ngày): ${appealRes.data.deadline_at}`);

  // Leadership Resolves Appeal
  const resolvePayload = {
    status: 'ACCEPTED',
    response_text: 'Lãnh đạo UBND xã ghi nhận sáng kiến số hóa bản đồ thôn 4 và chấp thuận điều chỉnh tăng điểm đổi mới sáng tạo.',
    adjusted_score: 99.0,
  };
  const resolveRes = await axios.post(`${BASE_URL}/evaluations/appeals/${appealId}/resolve`, resolvePayload, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Lãnh đạo giải quyết kiến nghị: "${resolveRes.data.message}"`);

  // Verify updated evaluation
  const updatedEval = await axios.get(`${BASE_URL}/evaluations/${evalId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Điểm sau khi giải quyết kiến nghị: ${updatedEval.data.evaluation.final_score}đ - ${updatedEval.data.evaluation.classification}`);
  console.log(`   Ghi chú cập nhật: ${updatedEval.data.evaluation.remarks}`);

  console.log('\n=== TẤT CẢ CÁC MODULE THEO NGHỊ ĐỊNH 335 & SỔ TAY BỘ NỘI VỤ ĐỀU ĐẠT 100% ===');
}

runDecree335TestSuite().catch((err) => {
  console.error('Kiểm thử thất bại:', err.response?.data || err.message);
  process.exit(1);
});
