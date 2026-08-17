import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('PRAGMA foreign_keys = ON;');

  // 1. Add related columns to tasks table
  await knex.schema.table('tasks', (table) => {
    table.integer('related_land_case_id').unsigned().nullable().references('id').inTable('land_certificate_cases').onDelete('SET NULL');
    table.integer('related_project_id').unsigned().nullable().references('id').inTable('public_investment_projects').onDelete('SET NULL');
    table.integer('related_revenue_id').unsigned().nullable().references('id').inTable('budget_revenue_items').onDelete('SET NULL');
    table.integer('related_expenditure_id').unsigned().nullable().references('id').inTable('budget_expenditure_items').onDelete('SET NULL');
    table.integer('related_office_request_id').unsigned().nullable().references('id').inTable('office_requests').onDelete('SET NULL');
  });

  // 2. Add old_value, new_value, reason to audit_logs table
  await knex.schema.table('audit_logs', (table) => {
    table.text('old_value').nullable();
    table.text('new_value').nullable();
    table.text('reason').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('tasks', (table) => {
    table.dropColumn('related_land_case_id');
    table.dropColumn('related_project_id');
    table.dropColumn('related_revenue_id');
    table.dropColumn('related_expenditure_id');
    table.dropColumn('related_office_request_id');
  });

  await knex.schema.table('audit_logs', (table) => {
    table.dropColumn('old_value');
    table.dropColumn('new_value');
    table.dropColumn('reason');
  });
}
