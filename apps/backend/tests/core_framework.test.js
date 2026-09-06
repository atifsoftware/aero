const TestRunner = require('../core/testRunner');
const Cache = require('../core/Cache');
const Queue = require('../core/Queue');
const Validator = require('../core/Validator');
const DB = require('../config/db');

// Test 1: QueryBuilder enhancements
TestRunner.register('QueryBuilder SQL compilation & methods', async (assert) => {
  const q = DB.table('users')
    .select(['id', 'name', 'email'])
    .where('status', 1)
    .whereBetween('id', [10, 50])
    .whereNotNull('email')
    .orderBy('id', 'DESC');

  const sql = q.toSql();
  assert.ok(sql.includes('BETWEEN ? AND ?'), 'SQL should include BETWEEN clause');
  assert.ok(sql.includes('IS NOT NULL'), 'SQL should include IS NOT NULL');
  assert.ok(sql.includes('ORDER BY `id` DESC'), 'SQL should include ORDER BY');

  const bindings = q.getBindings();
  assert.deepStrictEqual(bindings, [1, 10, 50], 'Bindings should match where values');

  const rawSql = q.toRawSql();
  assert.ok(rawSql.includes('BETWEEN 10 AND 50'), 'Raw SQL should interpolate values');
});

// Test 2: Hybrid Cache operations
TestRunner.register('Hybrid Cache (Set, Get, Has, Remember, Forget)', async (assert) => {
  const testKey = `test_aero_${Date.now()}`;
  const testVal = { id: 101, role: 'admin', active: true };

  // Set & Get
  await Cache.set(testKey, testVal, 60);
  const fetched = await Cache.get(testKey);
  assert.deepStrictEqual(fetched, testVal, 'Cache value should match stored value');

  // Has
  const exists = await Cache.has(testKey);
  assert.strictEqual(exists, true, 'Cache.has should return true');

  // Remember
  const remembered = await Cache.remember(testKey, 60, async () => ({ id: 999 }));
  assert.deepStrictEqual(remembered, testVal, 'Cache.remember should return existing cache on hit');

  // Forget
  await Cache.forget(testKey);
  const afterDelete = await Cache.get(testKey);
  assert.strictEqual(afterDelete, null, 'Cache.get should return null after forget');
});

// Test 3: Request Validator Engine
TestRunner.register('Validator engine (sync & async validation)', async (assert) => {
  const invalidData = {
    email: 'not-an-email',
    age: 'twenty',
    name: ''
  };

  const rules = {
    name: 'required|min:3',
    email: 'required|email',
    age: 'required|integer|min:18'
  };

  const validator = await Validator.makeAsync(invalidData, rules);
  assert.strictEqual(validator.fails(), true, 'Validation should fail for invalid data');
  assert.ok(validator.errors().name, 'Should contain error for name');
  assert.ok(validator.errors().email, 'Should contain error for email');
  assert.ok(validator.errors().age, 'Should contain error for age');

  const validData = {
    name: 'Tanvir Hossain',
    email: 'tanvir@aeromvc.dev',
    age: 28
  };

  const validValidator = await Validator.makeAsync(validData, rules);
  assert.strictEqual(validValidator.passes(), true, 'Validation should pass for valid data');
});

// Test 4: Queue push & pop broker
TestRunner.register('Queue broker push and stats', async (assert) => {
  await Queue.ensureTableExists();

  const dummyJob = {
    name: 'DummyInvoiceNotification',
    invoiceId: 504,
    tries: 2,
    delay: 0
  };

  const jobId = await Queue.push(dummyJob, 'test_queue');
  assert.ok(jobId > 0, 'Job ID should be a positive integer');

  const stats = await Queue.stats();
  assert.ok(stats.pending >= 1, 'Queue pending count should be at least 1');

  // Clean up
  await Queue.delete(jobId);
});

// Test 5: ApiResponse decorator & pagination structure
TestRunner.register('ApiResponse decorator and pagination format', async (assert) => {
  const apiResponse = require('../middlewares/apiResponse');

  let responseData = null;
  let statusCode = 200;
  const mockReq = { originalUrl: '/api/test' };
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (payload) => {
      responseData = payload;
      return mockRes;
    }
  };

  apiResponse(mockReq, mockRes, () => {});

  // Test res.success
  mockRes.success({ user: 'admin' }, 'Loaded successfully');
  assert.strictEqual(responseData.status, 'success');
  assert.strictEqual(responseData.message, 'Loaded successfully');
  assert.deepStrictEqual(responseData.data, { user: 'admin' });
  assert.ok(responseData.meta.execution_time_ms !== undefined, 'Should include execution time');

  // Test res.error
  mockRes.error('Resource not found', 404);
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseData.status, 'error');
  assert.strictEqual(responseData.message, 'Resource not found');

  // Test res.paginate
  const samplePaginated = {
    data: [{ id: 1 }, { id: 2 }],
    pagination: { total: 50, per_page: 15, current_page: 1, last_page: 4 }
  };
  mockRes.paginate(samplePaginated);
  assert.strictEqual(responseData.status, 'success');
  assert.strictEqual(responseData.data.length, 2);
  assert.strictEqual(responseData.pagination.total, 50);
});

// Test 6: Prisma Client Initialization & Model Reflection
TestRunner.register('Prisma Client singleton & schema models reflection', async (assert) => {
  const prisma = require('../config/prisma');
  assert.ok(prisma, 'Prisma singleton should be instantiated');
  assert.ok(typeof prisma.user?.findMany === 'function', 'Prisma should expose User model');
  assert.ok(typeof prisma.voucher?.findMany === 'function', 'Prisma should expose Voucher model');
  assert.ok(typeof prisma.account?.findMany === 'function', 'Prisma should expose Account model');
  assert.ok(typeof prisma.customer?.findMany === 'function', 'Prisma should expose Customer model');
  assert.ok(typeof prisma.supplier?.findMany === 'function', 'Prisma should expose Supplier model');
  assert.ok(typeof prisma.employee?.findMany === 'function', 'Prisma should expose Employee model');
  assert.ok(typeof prisma.$queryRaw === 'function', 'Prisma should expose $queryRaw');
});

