const TestRunner = require('../core/testRunner');
const DB = require('../config/db');
const Model = require('../core/Model');
const Event = require('../core/Event');
const Money = require('../core/Money');
const Scheduler = require('../core/Scheduler');
const idempotency = require('../middlewares/idempotency');
const Cache = require('../core/Cache');

// Test 1: Pessimistic Row-Level Locking (forUpdate & sharedLock)
TestRunner.register('ERP Core - Pessimistic Row-Level Locking', async (assert) => {
  const qb1 = DB.table('inventory_movements').where('product_id', 42).forUpdate();
  const sql1 = qb1.toSql();
  assert.ok(sql1.includes('FOR UPDATE'), 'SQL should append FOR UPDATE clause');

  const qb2 = DB.table('products').where('id', 1).sharedLock();
  const sql2 = qb2.toSql();
  assert.ok(sql2.includes('LOCK IN SHARE MODE') || sql2.includes('FOR SHARE'), 'SQL should append shared lock clause');

  // Test Model passthrough
  class TestLockItem extends Model {
    static table = 'test_lock_items';
  }
  const modelSql = TestLockItem.query().where('stock', '>', 0).forUpdate().toSql();
  assert.ok(modelSql.includes('FOR UPDATE'), 'Model.query().forUpdate() should propagate to SQL');
});

// Test 2: Deadlock Auto-Retry Engine in DB.transaction
TestRunner.register('ERP Core - Deadlock Auto-Retry Resilience', async (assert) => {
  let attempts = 0;

  // We simulate a deadlock on attempt 1 and 2, then success on attempt 3
  const fakeCallback = async (trx) => {
    attempts++;
    if (attempts < 3) {
      const deadlockErr = new Error('Deadlock found when trying to get lock; try restarting transaction');
      deadlockErr.code = 'ER_LOCK_DEADLOCK';
      deadlockErr.errno = 1213;
      throw deadlockErr;
    }
    return { success: true, attempts };
  };

  const result = await DB.transaction(fakeCallback, { maxRetries: 3, backoffMs: 10 });
  assert.strictEqual(result.success, true, 'Transaction should succeed after auto-retry');
  assert.strictEqual(result.attempts, 3, 'Transaction should have retried until attempt 3');
});

// Test 3: Idempotency Engine Middleware
TestRunner.register('ERP Core - Idempotency Protection', async (assert) => {
  const mw = idempotency({ ttl: 60, lockTtl: 10 });
  const testKey = 'txn_test_' + Date.now();

  // Mock Request 1
  let nextCalled1 = false;
  const req1 = {
    method: 'POST',
    path: '/api/v1/orders',
    headers: { 'idempotency-key': testKey },
    user: { id: 99 }
  };
  let sentData = null;
  const finishCallbacks = [];
  const res1 = {
    statusCode: 201,
    headers: {},
    setHeader: (k, v) => { res1.headers[k] = v; },
    getHeader: (k) => res1.headers[k],
    on: (evt, cb) => { if (evt === 'finish') finishCallbacks.push(cb); },
    send: (body) => { sentData = body; },
    json: (obj) => { sentData = JSON.stringify(obj); }
  };

  await mw(req1, res1, () => { nextCalled1 = true; });
  assert.strictEqual(nextCalled1, true, 'First request should proceed to controller');

  // Complete response 1
  res1.json({ order_id: 1001, status: 'created' });
  for (const cb of finishCallbacks) await cb();

  // Mock Request 2 (Duplicate / Replay with same Idempotency-Key)
  let replayStatus = null;
  let replayBody = null;
  let replayHeaders = {};
  const req2 = {
    method: 'POST',
    path: '/api/v1/orders',
    headers: { 'idempotency-key': testKey },
    user: { id: 99 }
  };
  const res2 = {
    setHeader: (k, v) => { replayHeaders[k] = v; },
    getHeader: (k) => replayHeaders[k],
    status: (code) => {
      replayStatus = code;
      return {
        send: (b) => { replayBody = b; }
      };
    }
  };

  let nextCalled2 = false;
  await mw(req2, res2, () => { nextCalled2 = true; });

  assert.strictEqual(nextCalled2, false, 'Duplicate request should NOT call next() controller');
  assert.strictEqual(replayStatus, 201, 'Replay should return original status 201');
  assert.strictEqual(replayHeaders['X-Idempotent-Replay'], 'true', 'Replay header should be set');
  assert.ok(replayBody.includes('1001'), 'Replay body should match original response');
});

// Test 4: Event Dispatcher & Observer Bus
TestRunner.register('ERP Core - Event Dispatcher & Wildcard Observer Bus', async (assert) => {
  Event.forgetAll();

  const receivedEvents = [];

  // Exact listener
  Event.listen('order.created', async (payload) => {
    receivedEvents.push({ event: 'order.created', payload });
  });

  // Wildcard listener
  Event.listen('order.*', async (payload, eventName) => {
    receivedEvents.push({ event: `wildcard:${eventName}`, payload });
  });

  // Once listener
  let onceCount = 0;
  Event.once('invoice.generated', () => {
    onceCount++;
  });

  await Event.dispatch('order.created', { order_id: 505, amount: 250 });
  await Event.dispatch('invoice.generated', { invoice_no: 'INV-1' });
  await Event.dispatch('invoice.generated', { invoice_no: 'INV-2' });

  assert.strictEqual(receivedEvents.length, 2, 'Should trigger exact and wildcard listeners');
  assert.strictEqual(receivedEvents[0].event, 'order.created');
  assert.strictEqual(receivedEvents[1].event, 'wildcard:order.created');
  assert.strictEqual(onceCount, 1, 'Once listener should execute exactly once');
});

// Test 5: Financial Precision Engine (Money)
TestRunner.register('ERP Core - Financial Precision (Zero Floating-Point Error)', async (assert) => {
  // Test 0.1 + 0.2 floating point bug resolution
  const m1 = new Money(0.1, 'BDT');
  const m2 = new Money(0.2, 'BDT');
  const sum = m1.add(m2);
  assert.strictEqual(sum.toAmount(), 0.3, '0.1 + 0.2 must exactly equal 0.3 without 0.30000000000000004 distortion');

  // Test VAT calculation (7.5% on 1500)
  const base = new Money(1500, 'BDT');
  const vat = base.percentage(7.5);
  assert.strictEqual(vat.toAmount(), 112.5, '7.5% VAT on 1500 must equal 112.50');

  // Test Fair-Share Ratio Allocation (ERP accounting standard)
  const total = new Money(100, 'BDT');
  const shares = total.allocate([1, 1, 1]);
  assert.strictEqual(shares.length, 3);
  assert.strictEqual(shares[0].toAmount(), 33.34);
  assert.strictEqual(shares[1].toAmount(), 33.33);
  assert.strictEqual(shares[2].toAmount(), 33.33);
  
  // Sum of allocated shares must equal exactly 100.00 (not 99.99)
  const allocatedSum = shares.reduce((acc, s) => acc.add(s), new Money(0, 'BDT'));
  assert.strictEqual(allocatedSum.toAmount(), 100.00, 'Sum of allocated shares must equal original 100.00');

  // Gateway subunits (paisa/cents)
  assert.strictEqual(new Money(10.50, 'BDT').toSubunits(), 1050, '10.50 BDT must convert to 1050 paisa');
  assert.strictEqual(Money.fromSubunits(1050, 'BDT').toAmount(), 10.50, '1050 paisa must convert to 10.50 BDT');
});

// Test 6: Global Query Scopes (Multi-Branch / Multi-Store Isolation)
TestRunner.register('ERP Core - Global Query Scopes & Multi-Branch Isolation', async (assert) => {
  class TestBranchModel extends Model {
    static table = 'orders';
  }

  // Register branch scope
  TestBranchModel.addGlobalScope('branch', (qb) => {
    qb.where('branch_id', 7);
  });

  // Query with global scope automatically applied
  const q1 = TestBranchModel.query().where('status', 'paid');
  const sql1 = q1.toSql();
  assert.ok(sql1.includes('`branch_id` = ?') || sql1.includes('"branch_id" = ?'), 'Global branch scope must be automatically applied');
  assert.deepStrictEqual(q1.getBindings(), ['paid', 7], 'Bindings should contain branch_id 7');

  // Query bypassing branch scope (e.g. for super-admin dashboard)
  const q2 = TestBranchModel.query().withoutGlobalScope('branch').where('status', 'paid');
  const sql2 = q2.toSql();
  assert.ok(!sql2.includes('branch_id'), 'withoutGlobalScope should omit branch scope');
  assert.deepStrictEqual(q2.getBindings(), ['paid'], 'Bindings should not contain branch_id');
});

// Test 7: Automated Task Scheduler
TestRunner.register('ERP Core - Automated Task Scheduler', async (assert) => {
  Scheduler.clear();

  let taskRan = false;
  Scheduler.call('cancel-stale-orders', async () => {
    taskRan = true;
    return '5 orders cancelled';
  }).everyMinute();

  // Verify task registration
  const tasks = Scheduler.getTasks();
  assert.strictEqual(tasks.length, 1, 'Should have 1 registered task');
  assert.strictEqual(tasks[0].name, 'cancel-stale-orders');
  assert.strictEqual(tasks[0].isDue(), true, 'everyMinute task should be due now');

  // Execute due tasks
  const result = await Scheduler.runDue();
  assert.strictEqual(result.ran, 1, '1 task should have run');
  assert.strictEqual(taskRan, true, 'Task action should have executed');
  assert.strictEqual(result.results[0].status, 'success');
});
