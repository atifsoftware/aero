/**
 * Migration: Create Order Items Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable();
    table.integer('product_id').unsigned().notNullable();
    table.string('product_name', 255).notNullable();
    table.string('product_sku', 100).notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('total', 10, 2).notNullable();
    table.json('product_options').nullable(); // Size, color, etc.
    table.timestamps(true, true);
    
    table.index(['order_id']);
    table.index(['product_id']);
    table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('order_items');
};
