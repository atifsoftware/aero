/**
 * Migration: Create Purchase Order Items Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('purchase_order_items', (table) => {
    table.increments('id').primary();
    table.integer('purchase_order_id').unsigned().notNullable();
    table.integer('product_id').unsigned().notNullable();
    table.string('product_name', 255).notNullable();
    table.string('product_sku', 100).notNullable();
    table.decimal('unit_cost', 10, 2).notNullable();
    table.integer('quantity_ordered').notNullable().defaultTo(1);
    table.integer('quantity_received').defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('total', 10, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['purchase_order_id']);
    table.index(['product_id']);
    table.foreign('purchase_order_id').references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('purchase_order_items');
};
