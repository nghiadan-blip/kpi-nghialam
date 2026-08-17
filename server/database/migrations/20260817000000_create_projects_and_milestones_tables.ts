import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Projects Table (Quản lý vòng đời dự án)
  await knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table
      .integer('investment_project_id')
      .unsigned()
      .nullable()
      .unique()
      .references('id')
      .inTable('public_investment_projects')
      .onDelete('SET NULL');
    table.string('project_code').unique().notNullable();
    table.string('project_name').notNullable();
    table
      .string('investment_group')
      .notNullable()
      .defaultTo('C')
      .checkIn(['A', 'B', 'C', 'Chưa phân loại']);
    table.string('approval_decision_no').nullable();
    table.date('approval_date').nullable();
    table.string('approving_authority').nullable();
    table.string('design_approval_no').nullable();
    table
      .string('bidding_method')
      .nullable()
      .defaultTo('Chỉ định thầu');
    table.date('contractor_selection_date').nullable();
    table.string('contract_no').nullable();
    table.float('contract_value').notNullable().defaultTo(0.0);
    table.date('start_date').nullable();
    table.date('planned_end_date').nullable();
    table.date('actual_end_date').nullable();
    table
      .string('acceptance_status')
      .notNullable()
      .defaultTo('chua_nghiem_thu')
      .checkIn(['chua_nghiem_thu', 'nghiem_thu_tung_phan', 'nghiem_thu_hoan_thanh', 'khong_dat']);
    table.date('acceptance_date').nullable();
    table
      .string('settlement_status')
      .notNullable()
      .defaultTo('chua_quyet_toan')
      .checkIn(['chua_quyet_toan', 'dang_quyet_toan', 'da_quyet_toan', 'quyet_toan_xong']);
    table.float('settlement_value').notNullable().defaultTo(0.0);
    table.date('settlement_date').nullable();
    table.date('handover_date').nullable();
    table
      .integer('project_manager_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('supervisor_unit').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('updated_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Project Milestones Table (Mốc tiến độ chi tiết dự án)
  await knex.schema.createTable('project_milestones', (table) => {
    table.increments('id').primary();
    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.string('milestone_name').notNullable();
    table
      .string('milestone_type')
      .notNullable()
      .defaultTo('other')
      .checkIn([
        'approval',
        'bidding',
        'contract',
        'construction_start',
        'foundation',
        'structure',
        'completion',
        'acceptance',
        'settlement',
        'handover',
        'other'
      ]);
    table.date('planned_date').notNullable();
    table.date('actual_date').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('pending')
      .checkIn(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']);
    table.text('note').nullable();
    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .integer('updated_by')
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
  await knex.schema.dropTableIfExists('project_milestones');
  await knex.schema.dropTableIfExists('projects');
}
