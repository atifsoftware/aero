/**
 * Migration: Create Inventory/Stock Movements Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('inventory_movements', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.integer('quantity_change').notNullable(); // Positive for in, negative for out
    table.string('movement_type', 50).notNullable(); // purchase, sale, return, adjustment, transfer, damage
    table.integer('reference_id').unsigned().nullable(); // Order ID, Purchase ID, etc.
    table.string('reference_type', 50).nullable(); // order, purchase, adjustment, etc.
    table.integer('user_id').unsigned().nullable(); // User who performed the movement
    table.text('notes').nullable();
    table.decimal('cost_price', 10, 2).nullable();
    table.integer('stock_before').notNullable().defaultTo(0);
    table.integer('stock_after').notNullable().defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['product_id']);
    table.index(['movement_type']);
    table.index(['reference_type', 'reference_id']);
    table.index(['created_at']);
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('inventory_movements');
};
