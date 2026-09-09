/**
 * Migration: Create Orders Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).unique().notNullable();
    table.integer('customer_id').unsigned().notNullable();
    table.integer('user_id').unsigned().nullable(); // Sales person/user who created the order
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('shipping_cost', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('paid_amount', 10, 2).defaultTo(0);
    table.decimal('due_amount', 10, 2).defaultTo(0);
    table.string('status', 50).defaultTo('pending'); // pending, confirmed, processing, shipped, delivered, cancelled, refunded
    table.string('payment_status', 50).defaultTo('unpaid'); // unpaid, partial, paid
    table.string('payment_method', 50).nullable(); // cash, card, bkcash, nagad, bank_transfer
    table.text('shipping_address').nullable();
    table.text('billing_address').nullable();
    table.string('customer_name', 255).nullable();
    table.string('customer_phone', 50).nullable();
    table.string('customer_email', 255).nullable();
    table.text('notes').nullable();
    table.text('internal_notes').nullable();
    table.timestamp('confirmed_at').nullable();
    table.timestamp('shipped_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamp('cancelled_at').nullable();
    table.json('meta_data').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    table.index(['order_number']);
    table.index(['customer_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['payment_status']);
    table.index(['created_at']);
    table.index(['is_active', 'deleted_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('orders');
};
