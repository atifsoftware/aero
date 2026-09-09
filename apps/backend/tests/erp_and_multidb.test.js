const TestRunner = require('../core/testRunner');
const DB = require('../config/db');
const Migrator = require('../core/Migrator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderItem = require('../models/PurchaseOrderItem');
const InventoryMovement = require('../models/InventoryMovement');
const PaymentTransaction = require('../models/PaymentTransaction');

TestRunner.register('ERP Models - Relationship Reflection & Architecture', async (assert) => {
  // Test Product relationships
  const prod = new Product({ id: 10, category_id: 2 });
  const categoryRel = prod.category();
  assert.strictEqual(categoryRel.RelatedModel, Category, 'Product belongsTo Category');
  assert.strictEqual(categoryRel.foreignKey, 'category_id');

  const orderItemsRel = prod.orderItems();
  assert.strictEqual(orderItemsRel.RelatedModel, OrderItem, 'Product hasMany OrderItem');

  const invRel = prod.inventoryMovements();
  assert.strictEqual(invRel.RelatedModel, InventoryMovement, 'Product hasMany InventoryMovement');

  // Test Category relationships
  const cat = new Category({ id: 2, parent_id: 1 });
  assert.strictEqual(cat.parent().RelatedModel, Category, 'Category belongsTo parent Category');
  assert.strictEqual(cat.children().RelatedModel, Category, 'Category hasMany children Categories');
  assert.strictEqual(cat.products().RelatedModel, Product, 'Category hasMany Products');

  // Test Order relationships
  const order = new Order({ id: 100, customer_id: 5, user_id: 1 });
  assert.strictEqual(order.customer().RelatedModel, Customer, 'Order belongsTo Customer');
  assert.strictEqual(order.items().RelatedModel, OrderItem, 'Order hasMany OrderItems');
  assert.strictEqual(order.paymentTransactions().RelatedModel, PaymentTransaction, 'Order hasMany PaymentTransactions');

  // Test PurchaseOrder relationships
  const po = new PurchaseOrder({ id: 20, supplier_id: 3, user_id: 1 });
  assert.strictEqual(po.supplier().RelatedModel, Supplier, 'PurchaseOrder belongsTo Supplier');
  assert.strictEqual(po.items().RelatedModel, PurchaseOrderItem, 'PurchaseOrder hasMany PurchaseOrderItems');
  assert.strictEqual(po.paymentTransactions().RelatedModel, PaymentTransaction, 'PurchaseOrder hasMany PaymentTransactions');

  // Test PaymentTransaction payment methods
  assert.strictEqual(PaymentTransaction.PAYMENT_METHODS.BKASH, 'bkash');
  assert.strictEqual(PaymentTransaction.PAYMENT_METHODS.NAGAD, 'nagad');
  assert.strictEqual(PaymentTransaction.PAYMENT_METHODS.ROCKET, 'rocket');
});

TestRunner.register('Multi-DB & Knex Integration - Migrator Schema Engine', async (assert) => {
  // Knex instance check
  const knex = DB.getKnex();
  assert.ok(knex, 'DB.getKnex() should return an active Knex instance');
  assert.ok(typeof knex.schema.createTable === 'function', 'Knex schema builder should be accessible');

  // Migrator check
  const migrator = new Migrator();
  const files = migrator.getMigrationFiles();
  assert.ok(files.length >= 10, `Should have at least 10 migration files, found: ${files.length}`);
  
  // Verify all 10 migrations export up & down
  for (const file of files) {
    const mod = require(file);
    assert.strictEqual(typeof mod.up, 'function', `${file} should export an up() function`);
    assert.strictEqual(typeof mod.down, 'function', `${file} should export a down() function`);
  }
});

TestRunner.register('QueryBuilder - Dialect Escaping & Postgres Placeholder Logic', async (assert) => {
  // Check escaping
  const qb = DB.table('orders');
  const sql = qb.where('status', 'pending').whereNotNull('customer_id').toSql();
  assert.ok(sql.includes('SELECT * FROM `orders`') || sql.includes('SELECT * FROM "orders"'), 'Table name properly escaped');
  assert.ok(sql.includes('IS NOT NULL'), 'Contains IS NOT NULL');
  
  // Parameter placeholders
  const bindings = qb.getBindings();
  assert.deepStrictEqual(bindings, ['pending'], 'Bindings recorded properly');
});
