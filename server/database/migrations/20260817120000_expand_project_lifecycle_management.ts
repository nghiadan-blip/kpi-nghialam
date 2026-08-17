import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Cập nhật và mở rộng bảng projects với các trường chuẩn hóa
  const hasCol = await knex.schema.hasColumn('projects', 'project_type');
  if (!hasCol) {
    await knex.schema.alterTable('projects', (table) => {
      table.string('project_type').nullable().defaultTo('Xây dựng dân dụng / Giao thông');
      table.string('location').nullable().defaultTo('Xã Nghĩa Lâm, huyện Nghĩa Đàn');
      table.text('scale').nullable();
      table.text('objective').nullable();
      table.string('investor_name').nullable().defaultTo('UBND xã Nghĩa Lâm');
      table.string('management_unit').nullable().defaultTo('Ban Quản lý dự án xã Nghĩa Lâm');
      table.string('beneficiary_unit').nullable().defaultTo('UBND xã Nghĩa Lâm và Nhân dân địa phương');
      table.date('warranty_end_date').nullable();
      table
        .string('lifecycle_status')
        .notNullable()
        .defaultTo('PREPARATION');
      table.string('contractor_name').nullable();
      table.date('contract_signed_date').nullable();
      table.string('data_review_flag').nullable();
    });
  }

  // 2. Bảng 16 Bước Quy Trình Vòng Đời Dự Án Đầu Tư Công Cấp Xã
  if (!(await knex.schema.hasTable('project_workflow_steps'))) {
    await knex.schema.createTable('project_workflow_steps', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.integer('step_number').notNullable(); // 1 đến 16
    table.string('step_code').notNullable(); // STEP_01 đến STEP_16
    table.string('step_name').notNullable();
    table.string('authority_body').notNullable(); // HĐND xã, UBND xã, Chủ tịch UBND xã, Chủ đầu tư...
    table
      .string('signatory_type')
      .notNullable()
      .defaultTo('INDIVIDUAL')
      .checkIn(['COLLECTIVE', 'INDIVIDUAL', 'AUTHORIZED']);
    table.string('signatory_title').notNullable().defaultTo('Chủ tịch UBND xã');
    table
      .string('status')
      .notNullable()
      .defaultTo('NOT_STARTED')
      .checkIn(['NOT_STARTED', 'IN_PROGRESS', 'WAITING_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED', 'COMPLETED']);
    table.text('checklist_data').nullable(); // JSON checklist điện tử
    table.string('decision_number').nullable();
    table.date('decision_date').nullable();
    table.date('started_date').nullable();
    table.date('completed_date').nullable();
    table.string('evidence_url').nullable();
    table.text('notes').nullable();
    table.boolean('is_blocked').notNullable().defaultTo(false);
    table.text('block_reason').nullable();
    table.boolean('legal_review_required').notNullable().defaultTo(false);
    table
      .integer('reviewed_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('approved_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['project_id', 'step_number']);
    });
  }

  // 3. Bảng Hồ Sơ Điện Tử & Tài Liệu Pháp Lý
  await knex.schema.createTable('project_documents', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table
      .integer('workflow_step_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('project_workflow_steps')
      .onDelete('SET NULL');
    table.string('document_code').nullable();
    table.string('document_name').notNullable();
    table
      .string('document_type')
      .notNullable()
      .defaultTo('other')
      .checkIn([
        'resolution', // Nghị quyết HĐND
        'appraisal_decision', // QĐ thành lập HĐ thẩm định
        'appraisal_report', // Báo cáo thẩm định
        'investment_policy_decision', // QĐ chủ trương đầu tư
        'survey_task_decision', // Phê duyệt nhiệm vụ khảo sát
        'survey_method_decision', // Phê duyệt phương án khảo sát
        'economic_tech_report', // Báo cáo kinh tế - kỹ thuật
        'project_approval_decision', // QĐ phê duyệt dự án / BCKTKT
        'procurement_plan_decision', // QĐ phê duyệt kế hoạch LCNT
        'bidding_result_decision', // QĐ phê duyệt kết quả LCNT
        'contract', // Hợp đồng kinh tế
        'supervision_diary', // Nhật ký giám sát
        'acceptance_minutes', // Biên bản nghiệm thu
        'as_built_drawing', // Hồ sơ hoàn công
        'handover_minutes', // Biên bản bàn giao đưa vào sử dụng
        'settlement_report', // Báo cáo quyết toán
        'settlement_form_01_tt73', // Mẫu 01/QTDA Thông tư 73/2026
        'settlement_form_02_tt73', // Mẫu 02/QTDA Thông tư 73/2026
        'settlement_form_03_tt73', // Mẫu 03/QTDA Thông tư 73/2026
        'settlement_decision', // Quyết định phê duyệt quyết toán
        'warranty_letter', // Cam kết/bảo lãnh bảo hành
        'other'
      ]);
    table.string('issuing_authority').nullable();
    table.date('issuing_date').nullable();
    table.string('file_url').notNullable();
    table.integer('file_size').nullable().defaultTo(0);
    table.string('file_type').nullable().defaultTo('application/pdf');
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_mandatory').notNullable().defaultTo(false);
    table
      .string('verification_status')
      .notNullable()
      .defaultTo('verified')
      .checkIn(['pending', 'verified', 'rejected', 'LEGAL_REVIEW_REQUIRED']);
    table
      .integer('uploaded_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 4. Bảng Kế Hoạch Vốn Hằng Năm (Funding Plans)
  await knex.schema.createTable('project_funding_plans', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.integer('budget_year').notNullable();
    table.string('funding_source').notNullable();
    table.float('planned_amount').notNullable().defaultTo(0.0);
    table.float('allocated_amount').notNullable().defaultTo(0.0);
    table.float('adjusted_amount').notNullable().defaultTo(0.0);
    table.float('cancelled_amount').notNullable().defaultTo(0.0);
    table.string('decision_ref').nullable();
    table.text('note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. Bảng Gói Thầu (Procurement Packages)
  await knex.schema.createTable('project_procurement_packages', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.string('package_code').notNullable();
    table.string('package_name').notNullable();
    table.string('procurement_plan_ref').nullable();
    table.string('bidding_method').notNullable().defaultTo('Chỉ định thầu');
    table.float('package_estimate_value').notNullable().defaultTo(0.0);
    table.float('winning_bid_value').notNullable().defaultTo(0.0);
    table.string('contractor_name').nullable();
    table.date('selection_date').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('planned')
      .checkIn(['planned', 'bidding', 'selected', 'contracted', 'cancelled']);
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 6. Bảng Hợp Đồng & Phụ Lục (Project Contracts)
  await knex.schema.createTable('project_contracts', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table
      .integer('package_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('project_procurement_packages')
      .onDelete('SET NULL');
    table.string('contract_no').notNullable();
    table.string('contract_name').notNullable();
    table.string('contractor_name').notNullable();
    table.date('signed_date').nullable();
    table.float('contract_value').notNullable().defaultTo(0.0);
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.float('performance_guarantee_value').notNullable().defaultTo(0.0);
    table.date('performance_guarantee_expiry').nullable();
    table.float('advance_amount').notNullable().defaultTo(0.0);
    table
      .string('status')
      .notNullable()
      .defaultTo('active')
      .checkIn(['draft', 'active', 'completed', 'liquidated', 'terminated']);
    table.text('note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 7. Bảng Nghiệm Thu Công Trình (Acceptance Records)
  await knex.schema.createTable('project_acceptance_records', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table
      .string('acceptance_type')
      .notNullable()
      .defaultTo('completion')
      .checkIn(['stage', 'partial', 'completion', 'internal']);
    table.date('acceptance_date').notNullable();
    table.float('acceptance_value').notNullable().defaultTo(0.0);
    table
      .string('conclusion')
      .notNullable()
      .defaultTo('pass')
      .checkIn(['pass', 'conditional_pass', 'fail']);
    table.date('remediation_deadline').nullable();
    table.text('remediation_result').nullable();
    table.text('signatories_list').nullable(); // JSON list of signatories
    table.string('minutes_number').nullable();
    table.string('evidence_url').nullable();
    table.text('note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 8. Bảng Quyết Toán Dự Án Hoàn Thành (Settlement Records)
  await knex.schema.createTable('project_settlement_records', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.date('submission_date').nullable();
    table.string('appraising_body').nullable().defaultTo('Phòng Tài chính - Kế hoạch huyện Nghĩa Đàn');
    table.float('proposed_value').notNullable().defaultTo(0.0);
    table.float('approved_value').notNullable().defaultTo(0.0);
    table.float('difference_value').notNullable().defaultTo(0.0);
    table.string('decision_number').nullable();
    table.date('decision_date').nullable();
    table.string('asset_handover_status').notNullable().defaultTo('Chưa bàn giao');
    table.boolean('bank_account_settled').notNullable().defaultTo(false);
    table.text('note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 9. Bảng Phân Rã Công Việc WBS (Work Items)
  await knex.schema.createTable('project_work_items', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table
      .integer('parent_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('project_work_items')
      .onDelete('CASCADE');
    table.string('item_code').notNullable();
    table.string('item_name').notNullable();
    table.string('responsible_unit').nullable();
    table.date('planned_start_date').nullable();
    table.date('planned_end_date').nullable();
    table.date('actual_start_date').nullable();
    table.date('actual_end_date').nullable();
    table.float('progress_percent').notNullable().defaultTo(0.0);
    table
      .string('status')
      .notNullable()
      .defaultTo('pending')
      .checkIn(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']);
    table.text('obstacle_note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_work_items');
  await knex.schema.dropTableIfExists('project_settlement_records');
  await knex.schema.dropTableIfExists('project_acceptance_records');
  await knex.schema.dropTableIfExists('project_contracts');
  await knex.schema.dropTableIfExists('project_procurement_packages');
  await knex.schema.dropTableIfExists('project_funding_plans');
  await knex.schema.dropTableIfExists('project_documents');
  await knex.schema.dropTableIfExists('project_workflow_steps');
}
