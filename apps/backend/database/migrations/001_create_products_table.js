/**
 * Migration: Create Products Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('sku', 100).unique().notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.decimal('cost_price', 10, 2).nullable();
    table.integer('stock_quantity').notNullable().defaultTo(0);
    table.integer('low_stock_threshold').defaultTo(10);
    table.integer('category_id').unsigned().nullable();
    table.integer('brand_id').unsigned().nullable();
    table.string('unit', 50).defaultTo('pcs');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_featured').defaultTo(false);
    table.json('images').nullable();
    table.json('attributes').nullable(); // For variant attributes like size, color
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    table.index(['sku']);
    table.index(['category_id']);
    table.index(['is_active', 'deleted_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('products');
};
