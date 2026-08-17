import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Bổ sung các cột tiến độ, nhà thầu và cảnh báo cho bảng projects
  const hasPlannedStart = await knex.schema.hasColumn('projects', 'planned_start_date');
  if (!hasPlannedStart) {
    await knex.schema.alterTable('projects', (table) => {
      table.date('planned_start_date').nullable();
      table.date('actual_start_date').nullable();
      table.float('planned_progress_percent').notNullable().defaultTo(0.0);
      table.integer('delay_days').notNullable().defaultTo(0);
      table.text('delay_reason').nullable();
      table.date('recovery_deadline').nullable();
      table
        .string('contractor_selection_status')
        .notNullable()
        .defaultTo('NOT_SELECTED')
        .checkIn(['NOT_SELECTED', 'IN_SELECTION', 'SELECTED', 'CONTRACT_SIGNED', 'CANCELLED']);
      table.date('contract_start_date').nullable();
      table.date('contract_end_date').nullable();
      table
        .integer('responsible_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });
  }

  // 2. Bảng Danh mục vướng mắc chi tiết (Project Obstacles)
  if (!(await knex.schema.hasTable('project_obstacles'))) {
    await knex.schema.createTable('project_obstacles', (table) => {
      table.increments('id').primary();
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE');
      table
        .string('obstacle_type')
        .notNullable()
        .defaultTo('OTHER')
        .checkIn([
          'LAND_CLEARANCE',
          'LEGAL_PROCEDURE',
          'WEATHER',
          'CONTRACTOR',
          'FUNDING',
          'DESIGN',
          'OTHER'
        ]);
      table.string('title').notNullable();
      table.text('content').nullable();
      table.text('root_cause').nullable();
      table.text('resolution_measure').nullable();
      table
        .integer('responsible_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.date('deadline').nullable();
      table
        .string('status')
        .notNullable()
        .defaultTo('OPEN')
        .checkIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']);
      table.string('evidence_url').nullable();
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.timestamp('resolved_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 3. Bảng Quản lý các đợt thanh toán, tạm ứng và giải ngân chi tiết (Payment Disbursements)
  if (!(await knex.schema.hasTable('project_payment_disbursements'))) {
    await knex.schema.createTable('project_payment_disbursements', (table) => {
      table.increments('id').primary();
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE');
      table.string('voucher_no').notNullable();
      table.date('payment_date').notNullable();
      table.float('amount').notNullable().defaultTo(0.0);
      table.string('funding_source').nullable().defaultTo('Ngân sách xã');
      table
        .string('payment_type')
        .notNullable()
        .defaultTo('VOLUME_PAYMENT')
        .checkIn(['ADVANCE', 'VOLUME_PAYMENT', 'SETTLEMENT', 'OTHER']);
      table.float('completed_volume_amount').notNullable().defaultTo(0.0);
      table
        .string('treasury_control_status')
        .notNullable()
        .defaultTo('APPROVED')
        .checkIn(['PENDING', 'APPROVED', 'REJECTED']);
      table.string('voucher_url').nullable();
      table.text('justification_note').nullable();
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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_payment_disbursements');
  await knex.schema.dropTableIfExists('project_obstacles');
}
