/**
 * Migration: Create Purchase Orders Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('purchase_orders', (table) => {
    table.increments('id').primary();
    table.string('purchase_number', 50).unique().notNullable();
    table.integer('supplier_id').unsigned().notNullable();
    table.integer('user_id').unsigned().nullable(); // User who created the purchase
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('shipping_cost', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('paid_amount', 10, 2).defaultTo(0);
    table.decimal('due_amount', 10, 2).defaultTo(0);
    table.string('status', 50).defaultTo('draft'); // draft, ordered, received, partial, cancelled
    table.string('payment_status', 50).defaultTo('unpaid');
    table.string('payment_method', 50).nullable();
    table.date('expected_date').nullable();
    table.date('received_date').nullable();
    table.text('notes').nullable();
    table.text('internal_notes').nullable();
    table.json('meta_data').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    table.index(['purchase_number']);
    table.index(['supplier_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['payment_status']);
    table.index(['created_at']);
    table.foreign('supplier_id').references('id').inTable('suppliers');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('purchase_orders');
};
