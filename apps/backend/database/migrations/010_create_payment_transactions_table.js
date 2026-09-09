/**
 * Migration: Create Payment Transactions Table for E-commerce ERP
 * @param {import('knex').Knex} knex
 */
exports.up = async function(knex) {
  await knex.schema.createTable('payment_transactions', (table) => {
    table.increments('id').primary();
    table.string('transaction_number', 50).unique().notNullable();
    table.integer('order_id').unsigned().nullable();
    table.integer('purchase_order_id').unsigned().nullable();
    table.integer('customer_id').unsigned().nullable();
    table.integer('supplier_id').unsigned().nullable();
    table.integer('user_id').unsigned().nullable();
    table.string('payment_type', 50).notNullable(); // receive, payment (customer receive, supplier payment)
    table.string('payment_method', 50).notNullable(); // cash, card, bkcash, nagad, bank_transfer, cheque
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 10).defaultTo('BDT');
    table.string('status', 50).defaultTo('completed'); // pending, completed, failed, cancelled
    table.string('reference_number', 100).nullable(); // Transaction ID from payment gateway
    table.text('notes').nullable();
    table.json('meta_data').nullable(); // Additional payment info
    table.timestamp('paid_at').nullable();
    table.timestamps(true, true);
    
    table.index(['transaction_number']);
    table.index(['order_id']);
    table.index(['purchase_order_id']);
    table.index(['customer_id']);
    table.index(['supplier_id']);
    table.index(['payment_type']);
    table.index(['status']);
    table.index(['created_at']);
    
    table.foreign('order_id').references('id').inTable('orders');
    table.foreign('purchase_order_id').references('id').inTable('purchase_orders');
    table.foreign('customer_id').references('id').inTable('customers');
    table.foreign('supplier_id').references('id').inTable('suppliers');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('payment_transactions');
};
