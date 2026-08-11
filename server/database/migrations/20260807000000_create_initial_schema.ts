import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('PRAGMA foreign_keys = ON;');

  // 1. Departments Table
  await knex.schema.createTable('departments', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table
      .integer('parent_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL');
    table.index('parent_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Users (Employees) Table
  await knex.schema.createTable('users', (table) => {
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
      .checkIn(['ACTIVE', 'INACTIVE']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Product Catalog Table (Decree 335 Coefficients)
  await knex.schema.createTable('product_catalog', (table) => {
    table.increments('id').primary();
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table
      .string('category')
      .notNullable()
      .checkIn(['PART_A', 'PART_B_GROUP_I', 'PART_B_GROUP_II']);
    table.float('coefficient').notNullable().defaultTo(1.0);
    table.float('baseline_score').notNullable().defaultTo(5.0);
    table.text('description').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('ACTIVE')
      .checkIn(['ACTIVE', 'INACTIVE']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 4. Tasks Table
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description').nullable();
    table
      .integer('assigned_to')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.index('assigned_to');
    table
      .integer('assigned_by')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table.index('assigned_by');
    table
      .integer('product_catalog_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('product_catalog')
      .onDelete('SET NULL');
    table.index('product_catalog_id');
    table.dateTime('deadline').notNullable();
    table.float('weight').notNullable().defaultTo(1.0);
    table
      .string('status')
      .notNullable()
      .defaultTo('PENDING')
      .checkIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']);
    table.text('evidence').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. Monthly Evaluation Records Table
  await knex.schema.createTable('evaluations', (table) => {
    table.increments('id').primary();
    table
      .integer('employee_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('month').notNullable(); // Format: YYYY-MM
    table
      .string('status')
      .notNullable()
      .defaultTo('DRAFT')
      .checkIn(['DRAFT', 'SUBMITTED', 'MANAGER_REVIEWED', 'APPROVED']);
    table.float('self_score').defaultTo(0.0);
    table.float('manager_score').defaultTo(0.0);
    table.float('final_score').defaultTo(0.0);
    table
      .integer('manager_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.index('manager_id');
    table
      .integer('approver_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.index('approver_id');
    table.text('remarks').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['employee_id', 'month']);
  });

  // 6. Monthly Evaluation Details Table
  await knex.schema.createTable('evaluation_details', (table) => {
    table.increments('id').primary();
    table
      .integer('evaluation_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('evaluations')
      .onDelete('CASCADE');
    table.index('evaluation_id');
    table
      .integer('task_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('tasks')
      .onDelete('SET NULL');
    table.index('task_id');
    table
      .integer('product_catalog_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product_catalog')
      .onDelete('RESTRICT');
    table.index('product_catalog_id');
    table.integer('quantity').notNullable().defaultTo(1);
    table.float('self_points').notNullable();
    table.float('manager_points').notNullable();
    table.float('final_points').notNullable();
    table.text('remarks').nullable();
  });

  // 7. Audit Logs Table
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.index('user_id');
    table.string('action').notNullable();
    table.text('details').nullable();
    table.string('ip_address').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('evaluation_details');
  await knex.schema.dropTableIfExists('evaluations');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('product_catalog');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('departments');
}
