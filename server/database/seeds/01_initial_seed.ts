import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing records in reverse dependency order
  await knex('audit_logs').del();
  await knex('evaluation_details').del();
  await knex('evaluations').del();
  await knex('tasks').del();
  await knex('product_catalog').del();
  await knex('users').del();
  await knex('departments').del();

  // Reset sqlite autoincrement sequence if sequence table exists
  try {
    await knex.raw("DELETE FROM sqlite_sequence WHERE name IN ('departments', 'users', 'product_catalog', 'tasks', 'evaluations', 'evaluation_details', 'audit_logs')");
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
    }
  ];
  await knex('users').insert(users);
}
