import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('PRAGMA foreign_keys = ON;');

  // 1. Kỳ Đánh giá (Evaluation Periods)
  if (!await knex.schema.hasTable('evaluation_periods')) {
    await knex.schema.createTable('evaluation_periods', (table) => {
      table.increments('id').primary();
      table.string('month').unique().notNullable(); // định dạng YYYY-MM
      table
        .string('status')
        .notNullable()
        .defaultTo('ACTIVE')
        .checkIn(['ACTIVE', 'LOCKED']);
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.dateTime('locked_at').nullable();
      table
        .integer('locked_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Kiến nghị điều chỉnh kết quả (Evaluation Appeals)
  if (!await knex.schema.hasTable('evaluation_appeals')) {
    await knex.schema.createTable('evaluation_appeals', (table) => {
      table.increments('id').primary();
      table
        .integer('evaluation_id')
        .unsigned()
        .unique()
        .notNullable()
        .references('id')
        .inTable('evaluations')
        .onDelete('CASCADE');
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.text('reason').notNullable();
      table.string('evidence_url').nullable();
      table.float('requested_score').nullable();
      table
        .string('status')
        .notNullable()
        .defaultTo('PENDING')
        .checkIn(['PENDING', 'ACCEPTED', 'REJECTED']);
      table.text('response_text').nullable();
      table
        .integer('resolved_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.dateTime('resolved_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    // Nếu bảng đã tồn tại, đảm bảo có thêm cột requested_score
    if (!await knex.schema.hasColumn('evaluation_appeals', 'requested_score')) {
      await knex.schema.table('evaluation_appeals', (table) => {
        table.float('requested_score').nullable();
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('evaluation_appeals');
  await knex.schema.dropTableIfExists('evaluation_periods');
}
