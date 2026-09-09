/**
 * Migration: Create Categories Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).unique().notNullable();
    table.text('description').nullable();
    table.integer('parent_id').unsigned().nullable();
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.string('image', 500).nullable();
    table.json('meta_data').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    table.index(['parent_id']);
    table.index(['slug']);
    table.index(['is_active', 'deleted_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('categories');
};
