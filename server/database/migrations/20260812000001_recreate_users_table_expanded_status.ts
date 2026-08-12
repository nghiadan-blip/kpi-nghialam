import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('PRAGMA foreign_keys = OFF;');

  // Create temporary table with new schema
  await knex.schema.createTable('users_expanded', (table) => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('fullname').notNullable();
    table.string('email').nullable();
    table.string('phone').nullable();
    table
      .string('role')
      .notNullable()
      .checkIn(['ADMIN', 'LEADERSHIP', 'DEPARTMENT_HEAD', 'EMPLOYEE']);
    table.string('position').notNullable();
    table
      .integer('department_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table.index('department_id');
    table
      .string('status')
      .notNullable()
      .defaultTo('ACTIVE')
      .checkIn(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED']);
    table.string('auth_provider').defaultTo('LOCAL');
    table.string('google_id').nullable();
    table.string('avatar_url').nullable();
    table.string('requested_department').nullable();
    table.string('requested_position').nullable();
    table.string('rejection_reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Copy existing data from users table
  await knex.raw(`
    INSERT INTO users_expanded (id, username, password_hash, fullname, email, phone, role, position, department_id, status, created_at, updated_at)
    SELECT id, username, password_hash, fullname, email, phone, role, position, department_id, status, created_at, updated_at FROM users;
  `);

  // Drop old table and rename
  await knex.schema.dropTable('users');
  await knex.schema.renameTable('users_expanded', 'users');

  await knex.raw('PRAGMA foreign_keys = ON;');
}

export async function down(knex: Knex): Promise<void> {
  // Revert back
}
