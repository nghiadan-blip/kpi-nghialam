import db from '../src/config/db';

export async function migrateAndSeed() {
  console.log('=== STARTING DECREE 335 & 33 JOB POSITIONS MIGRATION ===');

  // 1. Create table `job_positions` if not exists
  const hasJobPositions = await db.schema.hasTable('job_positions');
  if (!hasJobPositions) {
    await db.schema.createTable('job_positions', (table) => {
      table.increments('id').primary();
      table.string('code', 50).unique().notNullable();
      table.string('name', 255).notNullable();
      table.string('group_type', 50).notNullable(); // NHOM_I_LANH_DAO, NHOM_II_CHUYEN_MON, NHOM_III_PHUC_VU
      table.string('civil_service_rank', 100);
      table.integer('allocated_quota').defaultTo(0);
      table.float('allocated_ratio_percent').defaultTo(0.0);
      table.text('description');
      table.timestamps(true, true);
    });
    console.log('  ✅ Created table: job_positions');
  }

  // 2. Add columns to `users` if not exists
  const hasPositionCode = await db.schema.hasColumn('users', 'position_code');
  if (!hasPositionCode) {
    await db.schema.alterTable('users', (table) => {
      table.string('position_code', 50).nullable();
      table.boolean('is_disciplined').defaultTo(false);
      table.text('discipline_details').nullable();
    });
    console.log('  ✅ Added position_code, is_disciplined to users');
  }

  // 3. Add columns to `tasks` if not exists
  const hasTaskCols = await db.schema.hasColumn('tasks', 'assigned_quantity');
  if (!hasTaskCols) {
    await db.schema.alterTable('tasks', (table) => {
      table.float('assigned_quantity').defaultTo(1.0);
      table.float('converted_assigned_quantity').defaultTo(1.0);
      table.float('actual_completed_quantity').defaultTo(0.0);
      table.datetime('actual_completed_date').nullable();
      table.integer('delay_count').defaultTo(0);
      table.integer('rework_count').defaultTo(0);
    });
    console.log('  ✅ Added quantitative & log columns to tasks');
  }

  // 4. Add columns to `product_catalog` if not exists
  const hasCatalogCols = await db.schema.hasColumn('product_catalog', 'complexity_group');
  if (!hasCatalogCols) {
    await db.schema.alterTable('product_catalog', (table) => {
      table.string('complexity_group', 20).defaultTo('N2'); // N1, N2, N3, N4, N5
      table.text('applicable_position_codes').nullable();
      table.text('output_product').nullable();
      table.string('frequency', 50).defaultTo('Tháng');
    });
    console.log('  ✅ Added complexity_group, applicable_position_codes to product_catalog');
  }

  // 5. Add columns to `evaluations` if not exists
  const hasEvalCols = await db.schema.hasColumn('evaluations', 'general_score_self');
  if (!hasEvalCols) {
    await db.schema.alterTable('evaluations', (table) => {
      table.float('criteria_politics_self').defaultTo(15.0);
      table.float('criteria_politics_mgr').defaultTo(15.0);
      table.float('criteria_politics_final').defaultTo(15.0);
      table.float('criteria_expertise_self').defaultTo(10.0);
      table.float('criteria_expertise_mgr').defaultTo(10.0);
      table.float('criteria_expertise_final').defaultTo(10.0);
      table.float('criteria_innovation_self').defaultTo(5.0);
      table.float('criteria_innovation_mgr').defaultTo(5.0);
      table.float('criteria_innovation_final').defaultTo(5.0);
      table.float('general_score_self').defaultTo(30.0);
      table.float('general_score_mgr').defaultTo(30.0);
      table.float('general_score_final').defaultTo(30.0);
      table.float('task_score_self').defaultTo(100.0);
      table.float('task_score_mgr').defaultTo(100.0);
      table.float('task_score_final').defaultTo(100.0);
      table.float('leadership_unit_result').defaultTo(100.0);
      table.float('leadership_execution').defaultTo(100.0);
      table.float('leadership_solidarity').defaultTo(100.0);
      table.text('collective_comments').nullable();
      table.text('party_cell_comments').nullable();
      table.string('special_case', 50).defaultTo('NORMAL');
      table.boolean('is_disciplined').defaultTo(false);
      table.text('discipline_details').nullable();
      table.boolean('is_special_quota_case').defaultTo(false);
      table.text('special_quota_justification').nullable();
    });
    console.log('  ✅ Added 30/70 formula & collective consultation columns to evaluations');
  }

  // 6. Create table `evaluation_appeals` if not exists
  const hasAppeals = await db.schema.hasTable('evaluation_appeals');
  if (!hasAppeals) {
    await db.schema.createTable('evaluation_appeals', (table) => {
      table.increments('id').primary();
      table.integer('evaluation_id').notNullable().references('id').inTable('evaluations').onDelete('CASCADE');
      table.integer('employee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('reason').notNullable();
      table.text('evidence_url').nullable();
      table.string('status', 50).defaultTo('PENDING'); // PENDING, ACCEPTED, REJECTED
      table.text('response_text').nullable();
      table.integer('resolved_by').nullable().references('id').inTable('users');
      table.datetime('resolved_at').nullable();
      table.datetime('deadline_at').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Created table: evaluation_appeals');
  }

  // 7. Seed 33 Official Job Positions of UBND Xã Nghĩa Lâm
  console.log('\n=== SEEDING 33 OFFICIAL JOB POSITIONS OF NGHIA LAM COMMUNE ===');

  const positionsSeed = [
    // Nhóm I: Lãnh đạo, quản lý (06 vị trí, 12 biên chế, 36,36%)
    {
      code: 'NA-NL-I.01',
      name: 'Chánh Văn phòng HĐND và UBND',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Phụ trách toàn diện công tác Văn phòng HĐND và UBND xã Nghĩa Lâm',
    },
    {
      code: 'NA-NL-I.02',
      name: 'Phó Chánh Văn phòng HĐND và UBND',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính/Chuyên viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Giúp Chánh Văn phòng phụ trách các lĩnh vực công tác tổng hợp, văn thư, lưu trữ',
    },
    {
      code: 'NA-NL-I.03',
      name: 'Trưởng phòng / Trưởng bộ phận chuyên môn',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Lãnh đạo, chỉ đạo, quản lý và điều hành hoạt động chuyên môn của bộ phận',
    },
    {
      code: 'NA-NL-I.04',
      name: 'Phó Trưởng phòng / Phó Trưởng bộ phận chuyên môn',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính/Chuyên viên',
      allocated_quota: 4,
      allocated_ratio_percent: 12.12,
      description: 'Giúp Trưởng bộ phận thực hiện nhiệm vụ theo dõi các lĩnh vực chuyên trách',
    },
    {
      code: 'NA-NL-I.05',
      name: 'Giám đốc Trung tâm Phục vụ hành chính công',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Quản lý, điều hành hoạt động tiếp nhận và trả kết quả TTHC tại TTPVHCC xã',
    },
    {
      code: 'NA-NL-I.06',
      name: 'Phó Giám đốc Trung tâm Phục vụ hành chính công',
      group_type: 'NHOM_I_LANH_DAO',
      civil_service_rank: 'Chuyên viên chính/Chuyên viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Giúp Giám đốc TTPVHCC quản lý, giám sát quy trình giải quyết TTHC',
    },

    // Nhóm II: Chuyên môn, nghiệp vụ (33 vị trí, 21 biên chế, 63,64%)
    {
      code: 'NA-NL-II.01',
      name: 'Chuyên viên quản lý nhà nước về thanh tra',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Thực hiện công tác thanh tra, kiểm tra theo thẩm quyền',
    },
    {
      code: 'NA-NL-II.02',
      name: 'Chuyên viên lĩnh vực văn phòng',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Thực hiện công tác tổng hợp, hậu cần, văn thư, lưu trữ',
    },
    {
      code: 'NA-NL-II.03',
      name: 'Chuyên viên văn thư - lưu trữ',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Văn thư viên/Lưu trữ viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Thực hiện công tác tiếp nhận, quản lý và lưu trữ hồ sơ tài liệu',
    },
    {
      code: 'NA-NL-II.04',
      name: 'Chuyên viên lĩnh vực tư pháp',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Hộ tịch, chứng thực, phổ biến giáo dục pháp luật, trợ giúp pháp lý',
    },
    {
      code: 'NA-NL-II.05',
      name: 'Chuyên viên hộ tịch - chứng thực',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Chuyên trách đăng ký hộ tịch và chứng thực văn bản giấy tờ',
    },
    {
      code: 'NA-NL-II.06',
      name: 'Chuyên viên lĩnh vực tài chính',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên/Kế toán viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Quản lý thu chi ngân sách, quyết toán, tham mưu dự toán tài chính',
    },
    {
      code: 'NA-NL-II.07',
      name: 'Chuyên viên lĩnh vực kế hoạch, đầu tư, thống kê',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Tổng hợp kế hoạch phát triển KTXH, dự án đầu tư công, số liệu thống kê',
    },
    {
      code: 'NA-NL-II.08',
      name: 'Chuyên viên quản lý thương mại, dịch vụ, công nghiệp',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Theo dõi hoạt động kinh doanh, thương mại, làng nghề trên địa bàn',
    },
    {
      code: 'NA-NL-II.09',
      name: 'Chuyên viên quản lý quy hoạch xây dựng',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Quản lý quy hoạch nông thôn mới, cấp phép và trật tự xây dựng',
    },
    {
      code: 'NA-NL-II.10',
      name: 'Chuyên viên đầu tư xây dựng, phát triển đô thị',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Quản lý các công trình hạ tầng kỹ thuật, giao thông, thủy lợi',
    },
    {
      code: 'NA-NL-II.11',
      name: 'Chuyên viên quản lý giao thông nông thôn',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Theo dõi hệ thống cầu đường, an toàn giao thông đường bộ trên địa bàn',
    },
    {
      code: 'NA-NL-II.12',
      name: 'Chuyên viên tài nguyên nước, môi trường',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Giám sát vệ sinh môi trường, thu gom rác thải, xử lý nguồn nước',
    },
    {
      code: 'NA-NL-II.13',
      name: 'Chuyên viên nông nghiệp, thủy lợi, phòng chống thiên tai',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Chỉ đạo sản xuất nông nghiệp, chăn nuôi, thú y, đê điều, PCTT & TKCN',
    },
    {
      code: 'NA-NL-II.14',
      name: 'Chuyên viên lâm nghiệp, kiểm lâm địa bàn',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Quản lý diện tích rừng, phòng chống cháy rừng',
    },
    {
      code: 'NA-NL-II.15',
      name: 'Chuyên viên đất đai, tài nguyên khoáng sản',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 3,
      allocated_ratio_percent: 9.09,
      description: 'Thẩm định hồ sơ đất đai, cấp GCNQSDĐ, đo đạc, bồi thường GPMB, quản lý khoáng sản',
    },
    {
      code: 'NA-NL-II.16',
      name: 'Chuyên viên địa chính, bản đồ',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Lập và chỉnh lý bản đồ địa chính, hồ sơ địa chính cơ sở',
    },
    {
      code: 'NA-NL-II.17',
      name: 'Chuyên viên lĩnh vực nội vụ',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Tổ chức cán bộ, thi đua khen thưởng, tôn giáo, thanh niên, hội đồng nhân dân',
    },
    {
      code: 'NA-NL-II.18',
      name: 'Chuyên viên lao động, tiền lương, BHXH, người có công',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Chính sách người có công, bảo trợ xã hội, giảm nghèo, bảo hiểm y tế',
    },
    {
      code: 'NA-NL-II.19',
      name: 'Chuyên viên bảo trợ xã hội, trẻ em, bình đẳng giới',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Chăm sóc bảo vệ trẻ em, công tác gia đình và phòng chống tệ nạn xã hội',
    },
    {
      code: 'NA-NL-II.20',
      name: 'Chuyên viên giáo dục và đào tạo',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Phổ cập giáo dục, quản lý trung tâm học tập cộng đồng, khuyến học',
    },
    {
      code: 'NA-NL-II.21',
      name: 'Chuyên viên văn hóa, thể thao và du lịch',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Xây dựng đời sống văn hóa, bảo tồn di tích, phong trào thể dục thể thao',
    },
    {
      code: 'NA-NL-II.22',
      name: 'Chuyên viên phát thanh truyền hình, CNTT, chuyển đổi số',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Đài truyền thanh xã, ứng dụng CNTT, chuyển đổi số, an toàn thông tin mạng',
    },
    {
      code: 'NA-NL-II.23',
      name: 'Chuyên viên thông tin truyền thông cơ sở',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Tuyên truyền đường lối chính sách, thông tin đối ngoại cơ sở',
    },
    {
      code: 'NA-NL-II.24',
      name: 'Chuyên viên lĩnh vực y tế',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Y tế cơ sở, phòng chống dịch bệnh, an toàn vệ sinh thực phẩm, dân số KHHGĐ',
    },
    {
      code: 'NA-NL-II.25',
      name: 'Chuyên viên kiểm soát thủ tục hành chính, chính quyền điện tử',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 2,
      allocated_ratio_percent: 6.06,
      description: 'Kiểm soát TTHC, dịch vụ công trực tuyến, cổng DVC quốc gia, ISO hành chính',
    },
    {
      code: 'NA-NL-II.26',
      name: 'Chuyên viên tiếp công dân, giải quyết khiếu nại, tố cáo',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Tiếp công dân, xử lý đơn thư phản ánh, kiến nghị, khiếu nại, tố cáo',
    },
    {
      code: 'NA-NL-II.27',
      name: 'Chuyên viên quân sự địa phương',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên/Sĩ quan',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Tuyển quân, huấn luyện dân quân tự vệ, quốc phòng toàn dân',
    },
    {
      code: 'NA-NL-II.28',
      name: 'Chuyên viên công an xã / ANTT cơ sở',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên/Chiến sĩ CA',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'An ninh trật tự, quản lý cư trú, PCCC, Đề án 06',
    },
    {
      code: 'NA-NL-II.29',
      name: 'Chuyên viên quản lý dự án nông thôn mới',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Theo dõi các tiêu chí xây dựng NTM nâng cao, NTM kiểu mẫu',
    },
    {
      code: 'NA-NL-II.30',
      name: 'Chuyên viên quản lý thị trường cơ sở',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Phòng chống buôn lậu, gian lận thương mại, bình ổn giá',
    },
    {
      code: 'NA-NL-II.31',
      name: 'Chuyên viên đối ngoại, hợp tác liên kết',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Chuyên viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Hợp tác phát triển kinh tế vùng, kết nghĩa xã phường',
    },
    {
      code: 'NA-NL-II.32',
      name: 'Kế toán viên',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Kế toán viên',
      allocated_quota: 1,
      allocated_ratio_percent: 3.03,
      description: 'Thực hiện nghiệp vụ kế toán thu chi, tài sản công, bảng lương',
    },
    {
      code: 'NA-NL-II.33',
      name: 'Thủ quỹ cơ quan',
      group_type: 'NHOM_II_CHUYEN_MON',
      civil_service_rank: 'Cán sự/Nhân viên',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Quản lý quỹ tiền mặt, chứng từ thu chi nội bộ cơ quan',
    },

    // Nhóm III: Hỗ trợ, phục vụ (03 vị trí, 0 biên chế công chức)
    {
      code: 'NA-NL-III.1',
      name: 'Nhân viên phục vụ',
      group_type: 'NHOM_III_PHUC_VU',
      civil_service_rank: 'Hợp đồng theo NĐ 111',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Công tác tạp vụ, khánh tiết, hậu cần cơ quan',
    },
    {
      code: 'NA-NL-III.2',
      name: 'Nhân viên bảo vệ',
      group_type: 'NHOM_III_PHUC_VU',
      civil_service_rank: 'Hợp đồng theo NĐ 111',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Bảo vệ an ninh, trật tự, tài sản trụ sở cơ quan',
    },
    {
      code: 'NA-NL-III.3',
      name: 'Nhân viên lái xe',
      group_type: 'NHOM_III_PHUC_VU',
      civil_service_rank: 'Hợp đồng theo NĐ 111',
      allocated_quota: 0,
      allocated_ratio_percent: 0.0,
      description: 'Lái xe phục vụ công tác của Lãnh đạo và cơ quan',
    },
  ];

  for (const pos of positionsSeed) {
    const existing = await db('job_positions').where('code', pos.code).first();
    if (!existing) {
      await db('job_positions').insert(pos);
    } else {
      await db('job_positions').where('code', pos.code).update(pos);
    }
  }

  console.log(`  ✅ Synced ${positionsSeed.length} official job positions.`);

  // 8. Auto-map 12 existing users to official positions
  console.log('\n=== MAPPING 12 EXISTING USERS TO OFFICIAL JOB POSITIONS ===');
  const userMappings: Record<string, { position_code: string; position: string }> = {
    admin: { position_code: 'NA-NL-I.01', position: 'Quản trị hệ thống & Văn phòng' },
    chutich: { position_code: 'NA-NL-I.01', position: 'Chủ tịch UBND xã' },
    phochutich: { position_code: 'NA-NL-I.02', position: 'Phó Chủ tịch UBND xã' },
    truongphong_dc: { position_code: 'NA-NL-I.03', position: 'Trưởng Bộ phận Địa chính - Xây dựng' },
    congchuc_dc: { position_code: 'NA-NL-II.15', position: 'Chuyên viên đất đai, tài nguyên khoáng sản' },
    truongphong_hcc: { position_code: 'NA-NL-I.05', position: 'Giám đốc Trung tâm Phục vụ hành chính công' },
    congchuc_vh: { position_code: 'NA-NL-II.22', position: 'Chuyên viên phát thanh truyền hình, CNTT, chuyển đổi số' },
    thangle: { position_code: 'NA-NL-II.04', position: 'Chuyên viên lĩnh vực tư pháp' },
    dunghoang: { position_code: 'NA-NL-II.06', position: 'Chuyên viên lĩnh vực tài chính' },
    canbogmail1786505037648: { position_code: 'NA-NL-II.02', position: 'Chuyên viên lĩnh vực văn phòng' },
    canbotest1786507784514: { position_code: 'NA-NL-II.13', position: 'Chuyên viên nông nghiệp, thủy lợi, PCTT' },
    nghiadan: { position_code: 'NA-NL-II.25', position: 'Chuyên viên kiểm soát TTHC, chính quyền điện tử' },
  };

  for (const [uname, map] of Object.entries(userMappings)) {
    await db('users')
      .where('username', uname)
      .update({
        position_code: map.position_code,
        position: map.position,
      });
  }

  // 9. Update complexity group N1-N5 in product_catalog
  console.log('\n=== UPDATING PRODUCT CATALOG COMPLEXITY GROUPS (N1-N5) ===');
  await db('product_catalog')
    .where('coefficient', '<=', 1.0)
    .update({ complexity_group: 'N1' });
  await db('product_catalog')
    .where('coefficient', '>', 1.0)
    .andWhere('coefficient', '<=', 1.5)
    .update({ complexity_group: 'N2' });
  await db('product_catalog')
    .where('coefficient', '>', 1.5)
    .andWhere('coefficient', '<=', 2.0)
    .update({ complexity_group: 'N3' });
  await db('product_catalog')
    .where('coefficient', '>', 2.0)
    .andWhere('coefficient', '<=', 2.5)
    .update({ complexity_group: 'N4' });
  await db('product_catalog')
    .where('coefficient', '>', 2.5)
    .update({ complexity_group: 'N5' });

  console.log('  ✅ Product Catalog complexity groups N1-N5 updated.');
  console.log('=== MIGRATION & SEED COMPLETED SUCCESSFULLY ===');
}

if (require.main === module) {
  migrateAndSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
