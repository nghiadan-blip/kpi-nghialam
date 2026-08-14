import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('PRAGMA foreign_keys = ON;');

  // 1. Budget Revenue Items Table (Thu ngân sách)
  await knex.schema.createTable('budget_revenue_items', (table) => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.string('category').notNullable(); // ví dụ: Thu thuế, thu phí, đất công ích...
    table.string('source_name').notNullable(); // ví dụ: Thu tiền đất xóm 3
    table.string('payer_or_unit').nullable(); // người nộp hoặc đơn vị
    table.float('planned_amount').notNullable().defaultTo(0.0);
    table.float('collected_amount').notNullable().defaultTo(0.0);
    table.float('remaining_amount').notNullable().defaultTo(0.0);
    table.date('due_date').nullable();
    table
      .integer('responsible_department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table
      .integer('responsible_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .string('status')
      .notNullable()
      .defaultTo('planned')
      .checkIn(['planned', 'partial', 'completed', 'overdue', 'cancelled']);
    table.text('note').nullable();
    table.string('evidence_ref').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Budget Expenditure Items Table (Chi ngân sách)
  await knex.schema.createTable('budget_expenditure_items', (table) => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.string('category').notNullable(); // Hoạt động thường xuyên, hội họp...
    table.string('expense_name').notNullable(); // Nội dung chi chi tiết
    table.string('funding_source').notNullable().defaultTo('Tự chủ'); // Tự chủ, không tự chủ...
    table.float('estimated_amount').notNullable().defaultTo(0.0);
    table.float('approved_amount').notNullable().defaultTo(0.0);
    table.float('paid_amount').notNullable().defaultTo(0.0);
    table.float('remaining_amount').notNullable().defaultTo(0.0);
    table
      .integer('request_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('approve_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .string('status')
      .notNullable()
      .defaultTo('draft')
      .checkIn(['draft', 'submitted', 'approved', 'paid', 'rejected', 'missing_document']);
    table.string('document_status').notNullable().defaultTo('full'); // full, missing_evidence...
    table.date('payment_date').nullable();
    table.text('note').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Public Investment Projects Table (Đầu tư công)
  await knex.schema.createTable('public_investment_projects', (table) => {
    table.increments('id').primary();
    table.string('project_code').unique().notNullable();
    table.string('project_name').notNullable();
    table.string('investor_name').notNullable().defaultTo('UBND xã Nghĩa Lâm');
    table.string('funding_source').notNullable(); // Vốn tỉnh, huyện, xã...
    table.float('planned_capital').notNullable().defaultTo(0.0);
    table.float('allocated_capital').notNullable().defaultTo(0.0);
    table.float('disbursed_amount').notNullable().defaultTo(0.0);
    table.float('disbursement_rate').notNullable().defaultTo(0.0);
    table.string('contractor').nullable();
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.float('actual_progress_percent').notNullable().defaultTo(0.0);
    table.float('acceptance_value').notNullable().defaultTo(0.0);
    table.string('payment_document_status').nullable().defaultTo('Chưa nộp');
    table
      .string('obstacle_type')
      .notNullable()
      .defaultTo('none')
      .checkIn(['gpmb', 'procedure', 'payment_document', 'contractor', 'weather', 'funding', 'none', 'other']);
    table.text('obstacle_note').nullable();
    table
      .integer('responsible_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .string('status')
      .notNullable()
      .defaultTo('preparing')
      .checkIn(['preparing', 'executing', 'delayed', 'completed', 'settled']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 4. Land Certificate Cases Table (Hồ sơ cấp GCN QSDĐ)
  await knex.schema.createTable('land_certificate_cases', (table) => {
    table.increments('id').primary();
    table.string('case_code').unique().notNullable();
    table.string('citizen_name').notNullable();
    table.string('village').notNullable(); // Xóm 1, Xóm 2...
    table.string('land_plot_ref').notNullable(); // Số tờ, số thửa
    table
      .string('case_group')
      .notNullable()
      .defaultTo('Xanh')
      .checkIn(['Xanh', 'Vàng', 'Đỏ']);
    table
      .string('legal_basis_group')
      .notNullable()
      .defaultTo('other')
      .checkIn(['article_137', 'article_138', 'article_139', 'article_140', 'other']);
    table.string('current_step').notNullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('received')
      .checkIn(['received', 'checking', 'public_notice', 'financial_obligation', 'submitted', 'issued', 'returned', 'delayed', 'paused']);
    table.date('deadline').nullable();
    table
      .integer('responsible_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('responsible_department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table.text('delay_reason').nullable();
    table.string('evidence_ref').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. KH965 Progress Table (Tiến độ Kế hoạch 965 theo xóm)
  await knex.schema.createTable('kh965_progress', (table) => {
    table.increments('id').primary();
    table.string('village').unique().notNullable(); // Tên xóm
    table.integer('total_plots').notNullable().defaultTo(0);
    table.integer('reviewed_plots').notNullable().defaultTo(0);
    table.integer('classified_plots').notNullable().defaultTo(0);
    table.integer('eligible_cases').notNullable().defaultTo(0);
    table.integer('need_supplement_cases').notNullable().defaultTo(0);
    table.integer('complex_cases').notNullable().defaultTo(0);
    table.integer('green_count').notNullable().defaultTo(0);
    table.integer('yellow_count').notNullable().defaultTo(0);
    table.integer('red_count').notNullable().defaultTo(0);
    table
      .integer('responsible_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.date('report_date').nullable();
    table.text('note').nullable();
  });

  // 6. Office Requests Table (Văn phòng & Hậu cần)
  await knex.schema.createTable('office_requests', (table) => {
    table.increments('id').primary();
    table
      .string('request_type')
      .notNullable()
      .checkIn(['guest_reception', 'travel_paper', 'business_trip', 'vehicle', 'meeting_room', 'stationery', 'equipment', 'conference_logistics', 'other']);
    table.string('title').notNullable();
    table.text('description').nullable();
    table
      .integer('request_user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('responsible_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('approve_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.dateTime('start_time').nullable();
    table.dateTime('end_time').nullable();
    table.float('estimated_cost').notNullable().defaultTo(0.0);
    table.float('approved_cost').notNullable().defaultTo(0.0);
    table.string('funding_source').nullable();
    table.string('document_ref').nullable();
    table.string('settlement_status').notNullable().defaultTo('pending').checkIn(['pending', 'submitting', 'completed']);
    table
      .string('status')
      .notNullable()
      .defaultTo('submitted')
      .checkIn(['draft', 'submitted', 'approved', 'in_progress', 'completed', 'settled', 'rejected']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('office_requests');
  await knex.schema.dropTableIfExists('kh965_progress');
  await knex.schema.dropTableIfExists('land_certificate_cases');
  await knex.schema.dropTableIfExists('public_investment_projects');
  await knex.schema.dropTableIfExists('budget_expenditure_items');
  await knex.schema.dropTableIfExists('budget_revenue_items');
}
