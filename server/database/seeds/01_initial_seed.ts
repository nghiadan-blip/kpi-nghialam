import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    console.log('⚠️ Đang chạy seed trong môi trường production. Chỉ kiểm tra và khởi tạo dữ liệu danh mục/phòng ban/admin nếu chưa có.');
    
    // 1. Kiểm tra phòng ban
    const deptCount = await knex('departments').count({ count: '*' }).first();
    const hasDepts = Number(deptCount && (deptCount['count'] || (deptCount as any).count) || 0) > 0;
    if (!hasDepts) {
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
    }
    
    // 2. Kiểm tra danh mục
    const catCount = await knex('product_catalog').count({ count: '*' }).first();
    const hasCatalog = Number(catCount && (catCount['count'] || (catCount as any).count) || 0) > 0;
    if (!hasCatalog) {
      const catalog = [
        { id: 1, code: 'DOC_SIMPLE', name: 'Soạn thảo văn bản hành chính đơn giản', category: 'PART_A', coefficient: 1.00, baseline_score: 5.00, description: 'Công văn, thông báo, giấy mời đơn giản', status: 'ACTIVE' },
        { id: 2, code: 'DOC_COMPLEX', name: 'Soạn thảo văn bản quy phạm / Kế hoạch phức tạp', category: 'PART_A', coefficient: 1.50, baseline_score: 5.00, description: 'Quyết định, kế hoạch phát triển KTXH, báo cáo chuyên đề', status: 'ACTIVE' },
        { id: 3, code: 'HCC_ON_TIME', name: 'Giải quyết hồ sơ TTPVHCC đúng/trước hạn', category: 'PART_B_GROUP_I', coefficient: 1.20, baseline_score: 5.00, description: 'Hồ sơ hành chính giải quyết đúng mốc thời gian quy định', status: 'ACTIVE' },
        { id: 4, code: 'HCC_OVERDUE', name: 'Giải quyết hồ sơ TTPVHCC quá hạn', category: 'PART_B_GROUP_I', coefficient: 0.50, baseline_score: 5.00, description: 'Hồ sơ giải quyết trễ hạn (bị trừ điểm hệ số)', status: 'ACTIVE' },
        { id: 5, code: 'CITIZEN_RECEPTION', name: 'Tiếp công dân và xử lý phản ánh kiến nghị', category: 'PART_B_GROUP_II', coefficient: 1.00, baseline_score: 5.00, description: 'Tiếp dân định kỳ và xử lý đơn thư trực tiếp', status: 'ACTIVE' },
        { id: 6, code: 'SPECIAL_TASK', name: 'Thực hiện nhiệm vụ đột xuất / Chuyên đề đặc biệt', category: 'PART_B_GROUP_II', coefficient: 2.00, baseline_score: 5.00, description: 'Công tác ứng phó thiên tai, giải phóng mặt bằng, dự án trọng điểm', status: 'ACTIVE' }
      ];
      await knex('product_catalog').insert(catalog);
    }
    
    // 3. Kiểm tra admin mặc định
    const adminExists = await knex('users').where('role', 'ADMIN').first();
    if (!adminExists) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123456', saltRounds);
      await knex('users').insert({
        id: 1,
        username: 'admin',
        password_hash: hashedPassword,
        fullname: 'Quản trị viên Hệ thống',
        email: 'admin@nghialam.gov.vn',
        phone: '0912345678',
        role: 'ADMIN',
        position: 'Quản trị viên hệ thống',
        department_id: 1,
        status: 'ACTIVE'
      });
    }
    
    return;
  }

  // Clear existing records in reverse dependency order
  await knex('project_payment_disbursements').del();
  await knex('project_obstacles').del();
  await knex('project_work_items').del();
  await knex('project_settlement_records').del();
  await knex('project_acceptance_records').del();
  await knex('project_contracts').del();
  await knex('project_procurement_packages').del();
  await knex('project_funding_plans').del();
  await knex('project_documents').del();
  await knex('project_workflow_steps').del();
  await knex('project_milestones').del();
  await knex('projects').del();
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
      'office_requests',
      'projects',
      'project_milestones',
      'project_workflow_steps',
      'project_documents',
      'project_funding_plans',
      'project_procurement_packages',
      'project_contracts',
      'project_acceptance_records',
      'project_settlement_records',
      'project_work_items',
      'project_obstacles',
      'project_payment_disbursements'
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
      contractor: null,
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

  // 10. Insert Projects (Vòng đời dự án liên kết ĐTC)
  const projects = [
    {
      id: 1,
      investment_project_id: 1,
      project_code: 'DA-2026-01',
      project_name: 'Xây dựng đường bê tông liên thôn xóm 3 và xóm 4 Nghĩa Lâm',
      investment_group: 'C',
      approval_decision_no: '88/QĐ-UBND',
      approval_date: '2026-01-15',
      approving_authority: 'UBND huyện Nghĩa Đàn',
      design_approval_no: 'TK-12/2026/SXD',
      bidding_method: 'Chỉ định thầu rút gọn',
      contractor_selection_date: '2026-02-05',
      contract_no: '01/2026/HĐ-XL',
      contract_value: 3450000000,
      start_date: '2026-02-10',
      planned_end_date: '2026-11-30',
      actual_end_date: null,
      acceptance_status: 'chua_nghiem_thu',
      acceptance_date: null,
      settlement_status: 'chua_quyet_toan',
      settlement_value: 0,
      settlement_date: null,
      handover_date: null,
      project_manager_id: 6, // Vũ Minh Tuấn
      supervisor_unit: 'Ban Giám sát đầu tư của cộng đồng xã Nghĩa Lâm',
      created_by: 2,
      updated_by: 6,
      version: 1
    },
    {
      id: 2,
      investment_project_id: 2,
      project_code: 'DA-2026-02',
      project_name: 'Cải tạo, nâng cấp Nhà văn hóa đa năng xã Nghĩa Lâm',
      investment_group: 'C',
      approval_decision_no: '112/QĐ-UBND',
      approval_date: '2026-02-20',
      approving_authority: 'HĐND & UBND xã Nghĩa Lâm',
      design_approval_no: 'TK-04/2026/UBND',
      bidding_method: 'Đấu thầu rộng rãi qua mạng',
      contractor_selection_date: '2026-03-25',
      contract_no: '04/2026/HĐ-XD',
      contract_value: 1780000000,
      start_date: '2026-04-01',
      planned_end_date: '2026-12-15',
      actual_end_date: null,
      acceptance_status: 'chua_nghiem_thu',
      acceptance_date: null,
      settlement_status: 'chua_quyet_toan',
      settlement_value: 0,
      settlement_date: null,
      handover_date: null,
      project_manager_id: 6, // Vũ Minh Tuấn
      supervisor_unit: 'Công ty TNHH Tư vấn Giám sát Miền Trung',
      created_by: 2,
      updated_by: 6,
      version: 1
    },
    {
      id: 3,
      investment_project_id: 3,
      project_code: 'DA-2026-03',
      project_name: 'Xây mới Trạm Y tế xã Nghĩa Lâm đạt chuẩn Quốc gia',
      investment_group: 'B',
      approval_decision_no: '456/QĐ-UBND',
      approval_date: '2026-03-10',
      approving_authority: 'UBND tỉnh Nghệ An',
      design_approval_no: 'TK-28/2026/SYT',
      bidding_method: 'Đấu thầu rộng rãi qua mạng',
      contractor_selection_date: '2026-05-10',
      contract_no: '12/2026/HĐ-YT',
      contract_value: 5850000000,
      start_date: '2026-05-15',
      planned_end_date: '2027-04-30',
      actual_end_date: null,
      acceptance_status: 'chua_nghiem_thu',
      acceptance_date: null,
      settlement_status: 'chua_quyet_toan',
      settlement_value: 0,
      settlement_date: null,
      handover_date: null,
      project_manager_id: 5, // Lê Hoàng Anh
      supervisor_unit: 'Sở Y tế tỉnh Nghệ An & Ban QLDA huyện',
      created_by: 2,
      updated_by: 5,
      version: 1
    }
  ];
  await knex('projects').insert(projects);

  // 11. Insert Project Milestones (Mốc tiến độ chi tiết)
  const projectMilestones = [
    {
      id: 1,
      project_id: 1,
      milestone_name: 'Phê duyệt chủ trương & dự án đầu tư',
      milestone_type: 'approval',
      planned_date: '2026-01-15',
      actual_date: '2026-01-15',
      status: 'completed',
      note: 'Hoàn thành thẩm định và ban hành QĐ 88/QĐ-UBND'
    },
    {
      id: 2,
      project_id: 1,
      milestone_name: 'Lựa chọn nhà thầu & ký hợp đồng xây lắp',
      milestone_type: 'contract',
      planned_date: '2026-02-05',
      actual_date: '2026-02-05',
      status: 'completed',
      note: 'Ký kết HĐ 01/2026/HĐ-XL với Công ty 37'
    },
    {
      id: 3,
      project_id: 1,
      milestone_name: 'Khởi công và thi công nền đường',
      milestone_type: 'construction_start',
      planned_date: '2026-02-10',
      actual_date: '2026-02-10',
      status: 'completed',
      note: 'Đã hoàn thành lu lèn nền đường'
    },
    {
      id: 4,
      project_id: 1,
      milestone_name: 'Đổ bê tông mặt đường liên thôn xóm 3 - 4',
      milestone_type: 'structure',
      planned_date: '2026-07-30',
      actual_date: '2026-08-05',
      status: 'completed',
      note: 'Chậm 5 ngày do ảnh hưởng mưa bão'
    },
    {
      id: 5,
      project_id: 1,
      milestone_name: 'Nghiệm thu kỹ thuật và hoàn thành xây lắp',
      milestone_type: 'acceptance',
      planned_date: '2026-11-15',
      actual_date: null,
      status: 'in_progress',
      note: 'Đang hoàn thiện lề đường và cọc tiêu biển báo'
    },
    {
      id: 6,
      project_id: 2,
      milestone_name: 'Lựa chọn nhà thầu qua mạng',
      milestone_type: 'bidding',
      planned_date: '2026-03-25',
      actual_date: '2026-03-25',
      status: 'completed',
      note: 'Mở thầu thành công'
    },
    {
      id: 7,
      project_id: 2,
      milestone_name: 'Thi công cải tạo phần mái và hội trường',
      milestone_type: 'structure',
      planned_date: '2026-08-15',
      actual_date: null,
      status: 'delayed',
      note: 'Vướng mắc nguồn vốn ngân sách xã đối ứng'
    }
  ];
  await knex('project_milestones').insert(projectMilestones);

  // 12. Insert 16 Workflow Steps for Projects
  const workflowSteps: any[] = [];
  const stepTitles = [
    { num: 1, code: 'STEP_01', name: 'Đưa dự án vào kế hoạch đầu tư công', auth: 'HĐND xã', type: 'COLLECTIVE', title: 'TM. HĐND - CHỦ TỊCH' },
    { num: 2, code: 'STEP_02', name: 'Lập và thẩm định Báo cáo đề xuất chủ trương đầu tư', auth: 'Hội đồng thẩm định UBND xã', type: 'INDIVIDUAL', title: 'Chủ tịch Hội đồng thẩm định' },
    { num: 3, code: 'STEP_03', name: 'Quyết định chủ trương đầu tư', auth: 'UBND xã', type: 'COLLECTIVE', title: 'TM. UBND - CHỦ TỊCH' },
    { num: 4, code: 'STEP_04', name: 'Lựa chọn đơn vị tư vấn khảo sát, lập BCKTKT', auth: 'Chủ đầu tư', type: 'INDIVIDUAL', title: 'Chủ tịch UBND xã' },
    { num: 5, code: 'STEP_05', name: 'Phê duyệt nhiệm vụ khảo sát xây dựng', auth: 'Chủ đầu tư', type: 'INDIVIDUAL', title: 'Chủ tịch UBND xã' },
    { num: 6, code: 'STEP_06', name: 'Phê duyệt phương án kỹ thuật khảo sát', auth: 'Chủ đầu tư', type: 'INDIVIDUAL', title: 'Chủ tịch UBND xã' },
    { num: 7, code: 'STEP_07', name: 'Thực hiện khảo sát và lập Báo cáo kinh tế - kỹ thuật', auth: 'Đơn vị tư vấn', type: 'AUTHORIZED', title: 'Đại diện Tư vấn' },
    { num: 8, code: 'STEP_08', name: 'Thẩm định Báo cáo kinh tế - kỹ thuật, thiết kế và dự toán', auth: 'Phòng Kinh tế - Hạ tầng', type: 'INDIVIDUAL', title: 'Cơ quan thẩm định' },
    { num: 9, code: 'STEP_09', name: 'Phê duyệt dự án / Báo cáo kinh tế - kỹ thuật', auth: 'Chủ tịch UBND xã', type: 'INDIVIDUAL', title: 'CHỦ TỊCH' },
    { num: 10, code: 'STEP_10', name: 'Phê duyệt kế hoạch lựa chọn nhà thầu', auth: 'Chủ tịch UBND xã', type: 'INDIVIDUAL', title: 'CHỦ TỊCH' },
    { num: 11, code: 'STEP_11', name: 'Lựa chọn nhà thầu, phê duyệt kết quả và ký hợp đồng', auth: 'Chủ đầu tư & Nhà thầu', type: 'INDIVIDUAL', title: 'Chủ tịch UBND xã' },
    { num: 12, code: 'STEP_12', name: 'Bố trí kế hoạch vốn hằng năm và giải ngân', auth: 'Kế toán xã / KBNN', type: 'AUTHORIZED', title: 'Chủ tài khoản & Kế toán' },
    { num: 13, code: 'STEP_13', name: 'Thi công và quản lý chất lượng', auth: 'Nhà thầu & Tư vấn GS', type: 'AUTHORIZED', title: 'Chỉ huy trưởng công trường' },
    { num: 14, code: 'STEP_14', name: 'Nghiệm thu hoàn thành và bàn giao đưa vào sử dụng', auth: 'Chủ đầu tư & Các bên', type: 'AUTHORIZED', title: 'Hội đồng nghiệm thu cơ sở' },
    { num: 15, code: 'STEP_15', name: 'Lập, thẩm tra và phê duyệt quyết toán', auth: 'Chủ tịch UBND xã', type: 'INDIVIDUAL', title: 'CHỦ TỊCH' },
    { num: 16, code: 'STEP_16', name: 'Bàn giao quản lý, khai thác, bảo hành, bảo trì và kết thúc', auth: 'Đơn vị tiếp nhận', type: 'INDIVIDUAL', title: 'Đại diện Bên giao & Bên nhận' }
  ];

  for (let pId = 1; pId <= 3; pId++) {
    for (const s of stepTitles) {
      let status = 'NOT_STARTED';
      if (pId === 1) {
        if (s.num <= 12) status = 'COMPLETED';
        else if (s.num === 13) status = 'IN_PROGRESS';
      } else if (pId === 2) {
        if (s.num <= 10) status = 'COMPLETED';
        else if (s.num === 11) status = 'IN_PROGRESS';
      } else {
        if (s.num <= 4) status = 'COMPLETED';
        else if (s.num === 5) status = 'IN_PROGRESS';
      }

      workflowSteps.push({
        project_id: pId,
        step_number: s.num,
        step_code: s.code,
        step_name: s.name,
        authority_body: s.auth,
        signatory_type: s.type,
        signatory_title: s.title,
        status,
        checklist_data: JSON.stringify([
          { id: 'CHK_01', question: 'Công trình đã có trong Nghị quyết phê duyệt kế hoạch ĐTC của HĐND xã chưa?', status: 'Đạt' },
          { id: 'CHK_02', question: 'Văn bản thuộc thẩm quyền tập thể hay cá nhân; thể thức ký đúng quy định chưa?', status: 'Đạt' }
        ]),
        decision_number: status === 'COMPLETED' ? `${10 + s.num}/QĐ-UBND` : null,
        decision_date: status === 'COMPLETED' ? '2026-02-15' : null,
        is_blocked: false,
        legal_review_required: false
      });
    }
  }
  await knex('project_workflow_steps').insert(workflowSteps);

  // 13. Insert Documents for Project 1
  const projectDocs = [
    {
      project_id: 1,
      document_code: '15/NQ-HĐND',
      document_name: 'Nghị quyết thông qua danh mục đầu tư công năm 2026 xã Nghĩa Lâm',
      document_type: 'resolution',
      issuing_authority: 'HĐND xã Nghĩa Lâm',
      issuing_date: '2026-01-05',
      file_url: '/uploads/docs/nq_15_hdnd.pdf',
      file_size: 245000,
      file_type: 'application/pdf',
      version: 1,
      is_mandatory: true,
      verification_status: 'verified',
      uploaded_by: 6
    },
    {
      project_id: 1,
      document_code: '88/QĐ-UBND',
      document_name: 'Quyết định phê duyệt Báo cáo kinh tế - kỹ thuật xây dựng đường giao thông xóm 3-4',
      document_type: 'project_approval_decision',
      issuing_authority: 'UBND xã Nghĩa Lâm',
      issuing_date: '2026-01-15',
      file_url: '/uploads/docs/qd_88_phe_duyet.pdf',
      file_size: 512000,
      file_type: 'application/pdf',
      version: 1,
      is_mandatory: true,
      verification_status: 'verified',
      uploaded_by: 2
    },
    {
      project_id: 1,
      document_code: '01/2026/HĐ-XL',
      document_name: 'Hợp đồng thi công xây dựng công trình giao thông nông thôn',
      document_type: 'contract',
      issuing_authority: 'UBND xã Nghĩa Lâm & Công ty 37',
      issuing_date: '2026-02-05',
      file_url: '/uploads/docs/hd_01_2026.pdf',
      file_size: 890000,
      file_type: 'application/pdf',
      version: 1,
      is_mandatory: true,
      verification_status: 'verified',
      uploaded_by: 6
    }
  ];
  await knex('project_documents').insert(projectDocs);

  // 14. Insert Project Obstacles
  const obstacles = [
    {
      project_id: 2,
      obstacle_type: 'WEATHER',
      title: 'Mưa bão tháng 7 làm chậm tiến độ lợp mái và trát ngoài Nhà văn hóa',
      content: 'Thời tiết mưa lũ kéo dài liên tục 12 ngày trong tháng 7 gây ngập úng sân và ẩm ướt kết cấu.',
      root_cause: 'Thiên tai thời tiết bất thường khu vực miền núi Tây Nghệ An.',
      resolution_measure: 'Tăng ca thi công ngày nắng, bố trí bạt che chắn và bổ sung thêm 1 tổ thợ hoàn thiện.',
      responsible_user_id: 6,
      deadline: '2026-08-30',
      status: 'IN_PROGRESS',
      evidence_url: '/uploads/docs/nhat_ky_thoi_tiet_t7.pdf',
      created_by: 6
    },
    {
      project_id: 3,
      obstacle_type: 'LEGAL_PROCEDURE',
      title: 'Hồ sơ thiết kế bản vẽ thi công đang thẩm định tại Sở Y tế',
      content: 'Do có thay đổi quy chuẩn phòng cháy chữa cháy mới nên cần thẩm duyệt lại thiết kế.',
      root_cause: 'Quy chuẩn PCCC mới có hiệu lực yêu cầu bổ sung hệ thống hút khói.',
      resolution_measure: 'Đơn vị tư vấn đã chỉnh sửa nộp lại ngày 10/08, theo dõi sát tiến độ trả kết quả.',
      responsible_user_id: 6,
      deadline: '2026-08-25',
      status: 'OPEN',
      evidence_url: '/uploads/docs/giay_hen_so_y_te.pdf',
      created_by: 6
    }
  ];
  await knex('project_obstacles').insert(obstacles);

  // 15. Insert Project Payment Disbursements
  const disbursements = [
    {
      project_id: 1,
      voucher_no: 'UNC-2026/02-01',
      payment_date: '2026-02-20',
      amount: 400000000,
      funding_source: 'Vốn chương trình MTQG xây dựng NTM',
      payment_type: 'ADVANCE',
      completed_volume_amount: 0,
      treasury_control_status: 'APPROVED',
      voucher_url: '/uploads/vouchers/unc_tam_ung_01.pdf',
      justification_note: 'Tạm ứng hợp đồng đợt 1 theo quy định (30% giá trị hợp đồng).',
      created_by: 6
    },
    {
      project_id: 1,
      voucher_no: 'UNC-2026/05-02',
      payment_date: '2026-05-15',
      amount: 580000000,
      funding_source: 'Vốn chương trình MTQG xây dựng NTM',
      payment_type: 'VOLUME_PAYMENT',
      completed_volume_amount: 650000000,
      treasury_control_status: 'APPROVED',
      voucher_url: '/uploads/vouchers/unc_thanh_toan_02.pdf',
      justification_note: 'Thanh toán khối lượng hoàn thành đợt 1 (Đoạn Km0+00 đến Km1+200).',
      created_by: 6
    },
    {
      project_id: 2,
      voucher_no: 'UNC-2026/04-01',
      payment_date: '2026-04-28',
      amount: 250000000,
      funding_source: 'Vốn ngân sách xã đầu tư công trung hạn',
      payment_type: 'ADVANCE',
      completed_volume_amount: 0,
      treasury_control_status: 'APPROVED',
      voucher_url: '/uploads/vouchers/unc_tam_ung_nvh.pdf',
      justification_note: 'Tạm ứng hợp đồng thi công nâng cấp Nhà văn hóa xã.',
      created_by: 6
    }
  ];
  await knex('project_payment_disbursements').insert(disbursements);
}

