/**
 * Migration: Create Suppliers Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('suppliers', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('company_name', 255).nullable();
    table.string('email', 255).unique().nullable();
    table.string('phone', 50).nullable();
    table.string('alternate_phone', 50).nullable();
    table.text('address').nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.string('country', 100).defaultTo('Bangladesh');
    table.string('contact_person', 255).nullable();
    table.decimal('credit_limit', 10, 2).defaultTo(0);
    table.decimal('current_balance', 10, 2).defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.text('notes').nullable();
    table.json('meta_data').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['phone']);
    table.index(['is_active', 'deleted_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('suppliers');
};
