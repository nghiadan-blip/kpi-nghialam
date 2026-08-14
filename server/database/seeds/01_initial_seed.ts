import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing records in reverse dependency order
  await knex('office_requests').del();
  await knex('kh965_progress').del();
  await knex('land_certificate_cases').del();
  await knex('public_investment_projects').del();
  await knex('budget_expenditure_items').del();
  await knex('budget_revenue_items').del();

  await knex('audit_logs').del();
  await knex('evaluation_details').del();
  await knex('evaluations').del();
  await knex('tasks').del();
  await knex('product_catalog').del();
  await knex('users').del();
  await knex('departments').del();

  // Reset sqlite autoincrement sequence if sequence table exists
  try {
    const tablesToReset = [
      'departments',
      'users',
      'product_catalog',
      'tasks',
      'evaluations',
      'evaluation_details',
      'audit_logs',
      'budget_revenue_items',
      'budget_expenditure_items',
      'public_investment_projects',
      'land_certificate_cases',
      'kh965_progress',
      'office_requests'
    ];
    for (const tbl of tablesToReset) {
      await knex.raw(`DELETE FROM sqlite_sequence WHERE name = '${tbl}'`);
    }
  } catch (_err) {
    // Ignore if sqlite_sequence table does not exist
  }

  // 1. Insert Departments (UBND xã Nghĩa Lâm Structure)
  const departments = [
    { id: 1, name: 'Lãnh đạo UBND xã Nghĩa Lâm', parent_id: null },
    { id: 2, name: 'Trung tâm Phục vụ Hành chính công (TTPVHCC)', parent_id: 1 },
    { id: 3, name: 'Bộ phận Địa chính - Xây dựng - Nông nghiệp & Môi trường', parent_id: 1 },
    { id: 4, name: 'Bộ phận Văn hóa - Xã hội & Thông tin', parent_id: 1 },
    { id: 5, name: 'Bộ phận Văn phòng - Thống kê & Tư pháp - Hộ tịch', parent_id: 1 },
    { id: 6, name: 'Bộ phận Tài chính - Kế toán', parent_id: 1 },
    { id: 7, name: 'Ban Chỉ huy Quân sự xã', parent_id: 1 }
  ];
  await knex('departments').insert(departments);

  // 2. Insert Decree 335 Product Catalog
  const catalog = [
    {
      id: 1,
      code: 'DOC_SIMPLE',
      name: 'Soạn thảo văn bản hành chính đơn giản',
      category: 'PART_A',
      coefficient: 1.00,
      baseline_score: 5.00,
      description: 'Công văn, thông báo, giấy mời đơn giản',
      status: 'ACTIVE'
    },
    {
      id: 2,
      code: 'DOC_COMPLEX',
      name: 'Soạn thảo văn bản quy phạm / Kế hoạch phức tạp',
      category: 'PART_A',
      coefficient: 1.50,
      baseline_score: 5.00,
      description: 'Quyết định, kế hoạch phát triển KTXH, báo cáo chuyên đề',
      status: 'ACTIVE'
    },
    {
      id: 3,
      code: 'HCC_ON_TIME',
      name: 'Giải quyết hồ sơ TTPVHCC đúng/trước hạn',
      category: 'PART_B_GROUP_I',
      coefficient: 1.20,
      baseline_score: 5.00,
      description: 'Hồ sơ hành chính giải quyết đúng mốc thời gian quy định',
      status: 'ACTIVE'
    },
    {
      id: 4,
      code: 'HCC_OVERDUE',
      name: 'Giải quyết hồ sơ TTPVHCC quá hạn',
      category: 'PART_B_GROUP_I',
      coefficient: 0.50,
      baseline_score: 5.00,
      description: 'Hồ sơ giải quyết trễ hạn (bị trừ điểm hệ số)',
      status: 'ACTIVE'
    },
    {
      id: 5,
      code: 'CITIZEN_RECEPTION',
      name: 'Tiếp công dân và xử lý phản ánh kiến nghị',
      category: 'PART_B_GROUP_II',
      coefficient: 1.00,
      baseline_score: 5.00,
      description: 'Tiếp dân định kỳ và xử lý đơn thư trực tiếp',
      status: 'ACTIVE'
    },
    {
      id: 6,
      code: 'SPECIAL_TASK',
      name: 'Thực hiện nhiệm vụ đột xuất / Chuyên đề đặc biệt',
      category: 'PART_B_GROUP_II',
      coefficient: 2.00,
      baseline_score: 5.00,
      description: 'Công tác ứng phó thiên tai, giải phóng mặt bằng, dự án trọng điểm',
      status: 'ACTIVE'
    }
  ];
  await knex('product_catalog').insert(catalog);

  // 3. Insert Default Users (Passwords hashed with bcrypt)
  const saltRounds = 10;
  const users = [
    {
      id: 1,
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', saltRounds),
      fullname: 'Quản trị hệ thống',
      email: 'admin@nghialam.gov.vn',
      phone: '0912000001',
      role: 'ADMIN',
      position: 'Quản trị viên CNTT',
      department_id: null,
      status: 'ACTIVE'
    },
    {
      id: 2,
      username: 'chutich',
      password_hash: bcrypt.hashSync('chutich123', saltRounds),
      fullname: 'Trần Văn Nam',
      email: 'chutich@nghialam.gov.vn',
      phone: '0912000002',
      role: 'LEADERSHIP',
      position: 'Chủ tịch UBND xã',
      department_id: 1,
      status: 'ACTIVE'
    },
    {
      id: 3,
      username: 'phochutich',
      password_hash: bcrypt.hashSync('phochutich123', saltRounds),
      fullname: 'Nguyễn Thị Hoa',
      email: 'phochutich@nghialam.gov.vn',
      phone: '0912000003',
      role: 'LEADERSHIP',
      position: 'Phó Chủ tịch UBND xã',
      department_id: 1,
      status: 'ACTIVE'
    },
    {
      id: 4,
      username: 'truongphong_hcc',
      password_hash: bcrypt.hashSync('head123', saltRounds),
      fullname: 'Phạm Quốc Hùng',
      email: 'hcc_head@nghialam.gov.vn',
      phone: '0912000004',
      role: 'DEPARTMENT_HEAD',
      position: 'Giám đốc TTPVHCC',
      department_id: 2,
      status: 'ACTIVE'
    },
    {
      id: 5,
      username: 'truongphong_dc',
      password_hash: bcrypt.hashSync('head123', saltRounds),
      fullname: 'Lê Hoàng Anh',
      email: 'diachinh_head@nghialam.gov.vn',
      phone: '0912000005',
      role: 'DEPARTMENT_HEAD',
      position: 'Trưởng bộ phận Địa chính',
      department_id: 3,
      status: 'ACTIVE'
    },
    {
      id: 6,
      username: 'congchuc_dc',
      password_hash: bcrypt.hashSync('emp123', saltRounds),
      fullname: 'Vũ Minh Tuấn',
      email: 'tuan_dc@nghialam.gov.vn',
      phone: '0912000006',
      role: 'EMPLOYEE',
      position: 'Công chức Địa chính - Xây dựng',
      department_id: 3,
      status: 'ACTIVE'
    },
    {
      id: 7,
      username: 'congchuc_vh',
      password_hash: bcrypt.hashSync('emp123', saltRounds),
      fullname: 'Hoàng Thị Mai',
      email: 'mai_vh@nghialam.gov.vn',
      phone: '0912000007',
      role: 'EMPLOYEE',
      position: 'Công chức Văn hóa - Xã hội',
      department_id: 4,
      status: 'ACTIVE'
    },
    {
      id: 8,
      username: 'congchuc_tc',
      password_hash: bcrypt.hashSync('emp123', saltRounds),
      fullname: 'Lê Văn Tài',
      email: 'tai_tc@nghialam.gov.vn',
      phone: '0912000008',
      role: 'EMPLOYEE',
      position: 'Công chức Tài chính - Kế toán',
      department_id: 6,
      status: 'ACTIVE'
    },
    {
      id: 9,
      username: 'congchuc_vp',
      password_hash: bcrypt.hashSync('emp123', saltRounds),
      fullname: 'Nguyễn Văn Phòng',
      email: 'phong_vp@nghialam.gov.vn',
      phone: '0912000009',
      role: 'EMPLOYEE',
      position: 'Công chức Văn phòng UBND xã',
      department_id: 5,
      status: 'ACTIVE'
    }
  ];
  await knex('users').insert(users);

  // 4. Insert Budget Revenue Items (Tài chính thu)
  const budgetRevenues = [
    {
      id: 1,
      year: 2026,
      category: 'Đất công ích',
      source_name: 'Thu sản lượng đấu thầu đất công ích 5% ven sông Lam',
      payer_or_unit: 'Các hộ dân xóm 3 đấu thầu đất canh tác',
      planned_amount: 150000000,
      collected_amount: 120000000,
      remaining_amount: 30000000,
      due_date: '2026-10-31',
      responsible_department_id: 3, // Địa chính
      responsible_user_id: 6, // Vũ Minh Tuấn
      status: 'partial',
      note: 'Thu đợt 1 đạt 80%. Còn lại nộp trước vụ đông.',
      evidence_ref: 'BL-2026-0089'
    },
    {
      id: 2,
      year: 2026,
      category: 'Hoa lợi công sản',
      source_name: 'Thu thầu ao cá hợp tác xã cũ xã Nghĩa Lâm',
      payer_or_unit: 'Hộ kinh doanh Nguyễn Văn Long',
      planned_amount: 45000000,
      collected_amount: 45000000,
      remaining_amount: 0,
      due_date: '2026-06-30',
      responsible_department_id: 6, // Tài chính
      responsible_user_id: 8, // Lê Văn Tài
      status: 'completed',
      note: 'Đã hoàn thành nộp đủ 100% đúng hạn.',
      evidence_ref: 'BL-2026-0045'
    },
    {
      id: 3,
      year: 2026,
      category: 'Phí và Lệ phí',
      source_name: 'Lệ phí chứng thực bản sao và hộ tịch một cửa',
      payer_or_unit: 'Bộ phận một cửa xã',
      planned_amount: 25000000,
      collected_amount: 15000000,
      remaining_amount: 10000000,
      due_date: '2026-12-31',
      responsible_department_id: 2, // TTPVHCC
      responsible_user_id: 4, // Phạm Quốc Hùng
      status: 'partial',
      note: 'Thống kê lũy kế đến hết quý II.',
      evidence_ref: 'BC-T6/2026'
    },
    {
      id: 4,
      year: 2026,
      category: 'Thuế phi nông nghiệp',
      source_name: 'Thu thuế sử dụng đất phi nông nghiệp năm 2026',
      payer_or_unit: 'Chi cục thuế khu vực / Ủy thác xã thu',
      planned_amount: 80000000,
      collected_amount: 0,
      remaining_amount: 80000000,
      due_date: '2026-09-15',
      responsible_department_id: 6, // Tài chính
      responsible_user_id: 8, // Lê Văn Tài
      status: 'planned',
      note: 'Chưa bắt đầu đợt thu chính thức.',
      evidence_ref: null
    }
  ];
  await knex('budget_revenue_items').insert(budgetRevenues);

  // 5. Insert Budget Expenditure Items (Tài chính chi)
  const budgetExpenditures = [
    {
      id: 1,
      year: 2026,
      category: 'Hoạt động công vụ',
      expense_name: 'Chi mua sắm mực in và văn phòng phẩm phục vụ đại hội chi bộ',
      funding_source: 'Kinh phí tự chủ',
      estimated_amount: 12000000,
      approved_amount: 11500000,
      paid_amount: 11500000,
      remaining_amount: 0,
      request_user_id: 9, // Nguyễn Văn Phòng
      approve_user_id: 2, // Chủ tịch Nam
      status: 'paid',
      document_status: 'full',
      payment_date: '2026-07-20',
      note: 'Kèm theo hóa đơn đỏ số GTGT-001235.'
    },
    {
      id: 2,
      year: 2026,
      category: 'Nghiệp vụ chuyên môn',
      expense_name: 'Chi hỗ trợ tuyên truyền pháp luật và hiến đất xây đường NTM',
      funding_source: 'Kinh phí không tự chủ',
      estimated_amount: 18000000,
      approved_amount: 18000000,
      paid_amount: 15000000,
      remaining_amount: 3000000,
      request_user_id: 6, // Vũ Minh Tuấn
      approve_user_id: 2, // Chủ tịch Nam
      status: 'approved',
      document_status: 'missing_evidence',
      payment_date: null,
      note: 'Tạm ứng 15 triệu chi cho hội nghị, chưa có hóa đơn thanh quyết toán.'
    },
    {
      id: 3,
      year: 2026,
      category: 'Hội nghị',
      expense_name: 'Chi tiếp đoàn kiểm tra nông thôn mới nâng cao của Huyện',
      funding_source: 'Kinh phí tự chủ',
      estimated_amount: 8000000,
      approved_amount: 7800000,
      paid_amount: 7800000,
      remaining_amount: 0,
      request_user_id: 9, // Nguyễn Văn Phòng
      approve_user_id: 3, // PCT Hoa
      status: 'paid',
      document_status: 'full',
      payment_date: '2026-08-05',
      note: 'Duyệt theo phiếu đề xuất tiếp khách ngày 04/08.'
    }
  ];
  await knex('budget_expenditure_items').insert(budgetExpenditures);

  // 6. Insert Public Investment Projects (Đầu tư công)
  const investmentProjects = [
    {
      id: 1,
      project_code: 'DA-2026-01',
      project_name: 'Xây dựng đường bê tông liên thôn xóm 3 và xóm 4 Nghĩa Lâm',
      investor_name: 'UBND xã Nghĩa Lâm',
      funding_source: 'Vốn chương trình mục tiêu quốc gia xây dựng nông thôn mới',
      planned_capital: 3500000000,
      allocated_capital: 1200000000,
      disbursed_amount: 980000000,
      disbursement_rate: 81.67,
      contractor: 'Công ty Cổ phần Xây dựng và Thương mại 37 Nghệ An',
      start_date: '2026-02-10',
      end_date: '2026-11-30',
      actual_progress_percent: 75.0,
      acceptance_value: 1050000000,
      payment_document_status: 'Đã nộp kho bạc chờ thanh toán',
      obstacle_type: 'none',
      obstacle_note: null,
      responsible_user_id: 6, // Vũ Minh Tuấn
      status: 'executing'
    },
    {
      id: 2,
      project_code: 'DA-2026-02',
      project_name: 'Cải tạo, nâng cấp Nhà văn hóa đa năng xã Nghĩa Lâm',
      investor_name: 'UBND xã Nghĩa Lâm',
      funding_source: 'Vốn ngân sách xã đầu tư công trung hạn',
      planned_capital: 1800000000,
      allocated_capital: 800000000,
      disbursed_amount: 250000000,
      disbursement_rate: 31.25,
      contractor: 'Doanh nghiệp tư nhân xây dựng Hoàng Long',
      start_date: '2026-04-15',
      end_date: '2026-10-15',
      actual_progress_percent: 40.0,
      acceptance_value: 300000000,
      payment_document_status: 'Chưa đủ điều kiện nghiệm thu đợt 2',
      obstacle_type: 'weather',
      obstacle_note: 'Mưa lũ kéo dài trong tháng 7 ảnh hưởng đến tiến độ thi công mái.',
      responsible_user_id: 6, // Vũ Minh Tuấn
      status: 'delayed'
    },
    {
      id: 3,
      project_code: 'DA-2026-03',
      project_name: 'Mở rộng kênh mương nội đồng phục vụ tưới tiêu cánh đồng vệ sông Lam',
      investor_name: 'UBND xã Nghĩa Lâm',
      funding_source: 'Vốn hỗ trợ phát triển đất trồng lúa cấp tỉnh',
      planned_capital: 1200000000,
      allocated_capital: 600000000,
      disbursed_amount: 600000000,
      disbursement_rate: 100.0,
      contractor: 'Công ty TNHH Thủy lợi Tây Nghệ An',
      start_date: '2026-01-05',
      end_date: '2026-06-30',
      actual_progress_percent: 100.0,
      acceptance_value: 1200000000,
      payment_document_status: 'Hoàn thành quyết toán',
      obstacle_type: 'none',
      obstacle_note: null,
      responsible_user_id: 6, // Vũ Minh Tuấn
      status: 'completed'
    },
    {
      id: 4,
      project_code: 'DA-2026-04',
      project_name: 'Nâng cấp trang thiết bị y tế và Cải tạo Trạm Y tế xã Nghĩa Lâm',
      investor_name: 'UBND huyện Nghĩa Đàn / Ủy quyền xã giám sát',
      funding_source: 'Vốn ngân sách huyện phân cấp',
      planned_capital: 2100000000,
      allocated_capital: 500000000,
      disbursed_amount: 50000000,
      disbursement_rate: 10.0,
      contractor: 'Chưa lựa chọn nhà thầu phụ trách phần cải tạo',
      start_date: '2026-08-01',
      end_date: '2027-03-31',
      actual_progress_percent: 5.0,
      acceptance_value: 0,
      payment_document_status: 'Đang chuẩn bị hồ sơ pháp lý mời thầu',
      obstacle_type: 'procedure',
      obstacle_note: 'Hồ sơ thiết kế bản vẽ thi công đang chờ Sở Y tế phê duyệt thẩm định.',
      responsible_user_id: 6, // Vũ Minh Tuấn
      status: 'preparing'
    }
  ];
  await knex('public_investment_projects').insert(investmentProjects);

  // 7. Insert Land Certificate Cases (Cấp GCN QSDĐ)
  const landCases = [
    {
      id: 1,
      case_code: 'HS-2026-089',
      citizen_name: 'Nguyễn Văn Hải',
      village: 'Xóm 3',
      land_plot_ref: 'Thửa số 112, Tờ bản đồ số 09',
      case_group: 'Xanh',
      legal_basis_group: 'article_137',
      current_step: 'Hoàn thành nghĩa vụ tài chính',
      status: 'financial_obligation',
      deadline: '2026-08-25',
      responsible_user_id: 6, // Vũ Minh Tuấn
      responsible_department_id: 3,
      delay_reason: null,
      evidence_ref: 'BB-002341'
    },
    {
      id: 2,
      case_code: 'HS-2026-092',
      citizen_name: 'Trần Thị Liên',
      village: 'Xóm 2',
      land_plot_ref: 'Thửa số 45, Tờ bản đồ số 11',
      case_group: 'Vàng',
      legal_basis_group: 'article_138',
      current_step: 'Xác minh hiện trạng và niêm yết công khai',
      status: 'public_notice',
      deadline: '2026-09-02',
      responsible_user_id: 6, // Vũ Minh Tuấn
      responsible_department_id: 3,
      delay_reason: null,
      evidence_ref: 'TTr-0089'
    },
    {
      id: 3,
      case_code: 'HS-2026-075',
      citizen_name: 'Đoàn Hữu Cảnh',
      village: 'Xóm 4',
      land_plot_ref: 'Thửa số 210, Tờ bản đồ số 07',
      case_group: 'Đỏ',
      legal_basis_group: 'article_139',
      current_step: 'Đang xin ý kiến Phòng TN&MT huyện',
      status: 'delayed',
      deadline: '2026-08-10',
      responsible_user_id: 6, // Vũ Minh Tuấn
      responsible_department_id: 3,
      delay_reason: 'Đất lấn chiếm hành lang kênh mương cũ, chưa làm rõ nguồn gốc sử dụng qua các thời kỳ.',
      evidence_ref: 'CV-45/UBND'
    }
  ];
  await knex('land_certificate_cases').insert(landCases);

  // 8. Insert KH965 Progress (Kế hoạch 965)
  const kh965 = [
    {
      id: 1,
      village: 'Xóm 1',
      total_plots: 245,
      reviewed_plots: 220,
      classified_plots: 190,
      eligible_cases: 150,
      need_supplement_cases: 30,
      complex_cases: 10,
      green_count: 140,
      yellow_count: 40,
      red_count: 10,
      responsible_user_id: 6,
      report_date: '2026-08-10',
      note: 'Xóm 1 rà soát đạt tiến độ tốt, đa số đất thổ cư cũ ổn định.'
    },
    {
      id: 2,
      village: 'Xóm 2',
      total_plots: 180,
      reviewed_plots: 120,
      classified_plots: 95,
      eligible_cases: 70,
      need_supplement_cases: 20,
      complex_cases: 5,
      green_count: 65,
      yellow_count: 22,
      red_count: 8,
      responsible_user_id: 6,
      report_date: '2026-08-12',
      note: 'Còn 60 thửa chưa ra soát do chủ hộ đi làm ăn xa chưa liên lạc được.'
    },
    {
      id: 3,
      village: 'Xóm 3',
      total_plots: 310,
      reviewed_plots: 280,
      classified_plots: 230,
      eligible_cases: 160,
      need_supplement_cases: 50,
      complex_cases: 20,
      green_count: 150,
      yellow_count: 65,
      red_count: 15,
      responsible_user_id: 6,
      report_date: '2026-08-14',
      note: 'Khu vực giáp ranh sông Lam có nhiều thửa cần đo đạc lại hiện trạng.'
    },
    {
      id: 4,
      village: 'Xóm 4',
      total_plots: 150,
      reviewed_plots: 145,
      classified_plots: 130,
      eligible_cases: 110,
      need_supplement_cases: 15,
      complex_cases: 5,
      green_count: 115,
      yellow_count: 10,
      red_count: 5,
      responsible_user_id: 6,
      report_date: '2026-08-11',
      note: 'Đã cơ bản hoàn thành phân loại rà soát đợt 1.'
    }
  ];
  await knex('kh965_progress').insert(kh965);

  // 9. Insert Office Requests (Hậu cần văn phòng)
  const officeRequests = [
    {
      id: 1,
      request_type: 'vehicle',
      title: 'Đăng ký xe ô tô 7 chỗ đi họp Ban Thường vụ Huyện ủy Nghĩa Đàn',
      description: 'Đoàn đi gồm: Đồng chí Bí thư Đảng ủy, Chủ tịch UBND xã, Chánh văn phòng.',
      request_user_id: 9, // Nguyễn Văn Phòng
      responsible_user_id: 9,
      approve_user_id: 2, // Chủ tịch Nam
      start_time: '2026-08-16 07:30:00',
      end_time: '2026-08-16 11:30:00',
      estimated_cost: 450000,
      approved_cost: 450000,
      funding_source: 'Kinh phí tự chủ',
      document_ref: null,
      settlement_status: 'pending',
      status: 'approved'
    },
    {
      id: 2,
      request_type: 'meeting_room',
      title: 'Đăng ký Hội trường UBND xã họp Ban chấp hành Đảng bộ mở rộng',
      description: 'Chuẩn bị khánh tiết, nước uống, thiết bị âm thanh hội trường lớn.',
      request_user_id: 9, // Nguyễn Văn Phòng
      responsible_user_id: 9,
      approve_user_id: 3, // PCT Hoa
      start_time: '2026-08-18 08:00:00',
      end_time: '2026-08-18 11:30:00',
      estimated_cost: 800000,
      approved_cost: 800000,
      funding_source: 'Kinh phí tự chủ',
      document_ref: null,
      settlement_status: 'pending',
      status: 'submitted'
    },
    {
      id: 3,
      request_type: 'guest_reception',
      title: 'Đề xuất kinh phí chiêu đãi đoàn công tác sở TN&MT về kiểm tra đất đai',
      description: 'Ăn trưa tại nhà hàng Nghĩa Lâm, 12 suất ăn, tiếp đoàn cấp tỉnh chuyên môn.',
      request_user_id: 6, // Vũ Minh Tuấn
      responsible_user_id: 9, // Nguyễn Văn Phòng
      approve_user_id: 2, // Chủ tịch Nam
      start_time: '2026-08-15 11:30:00',
      end_time: '2026-08-15 13:00:00',
      estimated_cost: 3600000,
      approved_cost: 3600000,
      funding_source: 'Kinh phí không tự chủ',
      document_ref: 'HD-REST-9082',
      settlement_status: 'completed',
      status: 'settled'
    }
  ];
  await knex('office_requests').insert(officeRequests);
}
