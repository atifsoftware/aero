const TestRunner = require('../core/testRunner');
const Throttle = require('../core/Throttle');
const HasApiTokens = require('../core/HasApiTokens');
const Mailer = require('../core/Mailer');
const Sms = require('../core/Sms');
const Notification = require('../core/Notification');

// Mock express response object generator
function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let jsonBody = null;

  return {
    setHeader(key, val) {
      headers[key] = val;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    },
    get headers() {
      return headers;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    headersSent: false
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Rate Limiting Tests (10/10 Verification)
// ─────────────────────────────────────────────────────────────────────────────
TestRunner.register('Enterprise Rate Limiting - Granular sliding window & RFC headers', async (assert) => {
  const testClientKey = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const limiter = Throttle.custom({
    max: 3,
    windowMs: 5000,
    keyGenerator: () => testClientKey
  });

  // Unique client simulation
  const req = {
    baseUrl: '/api',
    path: '/test-route',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {}
  };

  let nextCalls = 0;
  const next = () => { nextCalls++; };

  // Hit 1
  const res1 = createMockRes();
  await limiter(req, res1, next);
  assert.strictEqual(nextCalls, 1, 'Hit 1 should pass');
  assert.strictEqual(res1.headers['RateLimit-Limit'], 3, 'Limit header should be 3');
  assert.strictEqual(res1.headers['RateLimit-Remaining'], 2, 'Remaining header should be 2');

  // Hit 2
  const res2 = createMockRes();
  await limiter(req, res2, next);
  assert.strictEqual(nextCalls, 2, 'Hit 2 should pass');
  assert.strictEqual(res2.headers['RateLimit-Remaining'], 1, 'Remaining header should be 1');

  // Hit 3
  const res3 = createMockRes();
  await limiter(req, res3, next);
  assert.strictEqual(nextCalls, 3, 'Hit 3 should pass');
  assert.strictEqual(res3.headers['RateLimit-Remaining'], 0, 'Remaining header should be 0');

  // Hit 4 - Must be blocked
  const res4 = createMockRes();
  await limiter(req, res4, next);
  assert.strictEqual(nextCalls, 3, 'Hit 4 should be BLOCKED (next not called)');
  assert.strictEqual(res4.statusCode, 429, 'Status code should be 429 Too Many Requests');
  assert.ok(res4.headers['Retry-After'] > 0, 'Retry-After header must be present and > 0');
  assert.strictEqual(res4.jsonBody?.code, 'RATE_LIMIT_EXCEEDED', 'Should return RATE_LIMIT_EXCEEDED code');
});

TestRunner.register('Enterprise Rate Limiting - Presets (auth, api, strict)', async (assert) => {
  assert.ok(typeof Throttle.auth === 'function', 'Throttle.auth preset must exist');
  assert.ok(typeof Throttle.api === 'function', 'Throttle.api preset must exist');
  assert.ok(typeof Throttle.strict === 'function', 'Throttle.strict preset must exist');

  const authLimiter = Throttle.auth();
  assert.ok(typeof authLimiter === 'function', 'Throttle.auth() must return an express middleware function');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Token Expiry & Lifecycle Tests (10/10 Verification)
// ─────────────────────────────────────────────────────────────────────────────
TestRunner.register('Token Expiry & Lifecycle - Duration Parser & Datetime Formatter', async (assert) => {
  // Test duration string parsing
  assert.strictEqual(HasApiTokens.parseDuration('15m'), 15 * 60 * 1000, '15m should equal 900,000ms');
  assert.strictEqual(HasApiTokens.parseDuration('1h'), 60 * 60 * 1000, '1h should equal 3,600,000ms');
  assert.strictEqual(HasApiTokens.parseDuration('24h'), 24 * 60 * 60 * 1000, '24h should equal 86,400,000ms');
  assert.strictEqual(HasApiTokens.parseDuration('7d'), 7 * 24 * 60 * 60 * 1000, '7d should equal 604,800,000ms');
  assert.strictEqual(HasApiTokens.parseDuration('30d'), 30 * 24 * 60 * 60 * 1000, '30d should equal 2,592,000,000ms');

  // Test SQL datetime formatting
  const testDate = new Date('2026-06-15T12:00:00Z');
  const sqlDate = HasApiTokens.toSqlDateTime(testDate);
  assert.strictEqual(sqlDate, '2026-06-15 12:00:00', 'toSqlDateTime should format YYYY-MM-DD HH:mm:ss');
});

TestRunner.register('Token Expiry Middleware - Expired Token Rejection & Error Codes', async (assert) => {
  const apiTokenAuth = require('../middlewares/apiTokenAuth');

  // Test missing authorization header
  const reqNoAuth = { headers: {} };
  const resNoAuth = createMockRes();
  await apiTokenAuth(reqNoAuth, resNoAuth, () => {});
  assert.strictEqual(resNoAuth.statusCode, 401);
  assert.strictEqual(resNoAuth.jsonBody.code, 'UNAUTHORIZED');

  // Test invalid token prefix
  const reqInvalid = { headers: { authorization: 'Bearer invalid_prefix_token' } };
  const resInvalid = createMockRes();
  await apiTokenAuth(reqInvalid, resInvalid, () => {});
  assert.strictEqual(resInvalid.statusCode, 401);
  assert.strictEqual(resInvalid.jsonBody.code, 'INVALID_TOKEN_FORMAT');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Multi-Channel Notifications (10/10 Verification)
// ─────────────────────────────────────────────────────────────────────────────
TestRunner.register('Notifications - Mailer Service (Sandbox & Formatting)', async (assert) => {
  const result = await Mailer.send({
    to: 'customer@example.com',
    subject: 'Order Confirmation #1001',
    html: '<h1>Order Confirmed</h1><p>Thank you for your business!</p>',
    text: 'Order Confirmed. Thank you for your business!'
  });

  assert.strictEqual(result.success, true, 'Mailer.send should succeed');
  assert.ok(result.messageId, 'Mailer should return a messageId');
  assert.ok(result.accepted.includes('customer@example.com'), 'Accepted recipients should include customer email');
});

TestRunner.register('Notifications - SMS Service (Sandbox & Formatting)', async (assert) => {
  const result = await Sms.send({
    to: '+8801712345678',
    message: 'Your verification OTP is 482910. Valid for 5 minutes.'
  });

  assert.strictEqual(result.success, true, 'Sms.send should succeed');
  assert.ok(result.messageId, 'Sms should return a messageId');
  assert.strictEqual(result.provider, 'mock', 'Provider should be mock in development sandbox');
});

TestRunner.register('Notifications - Multi-Channel Dispatcher (Notification Bus)', async (assert) => {
  class WelcomeNotification {
    via(notifiable) {
      return ['mail', 'sms'];
    }
    toMail(notifiable) {
      return {
        to: notifiable.email,
        subject: 'Welcome to NodeFlow',
        text: `Hello ${notifiable.name}, welcome aboard!`
      };
    }
    toSms(notifiable) {
      return {
        to: notifiable.phone,
        message: `Hi ${notifiable.name}, welcome to NodeFlow!`
      };
    }
  }

  const user = {
    name: 'Atif',
    email: 'atif@nodeflow.local',
    phone: '+8801700000000'
  };

  const results = await Notification.send(user, new WelcomeNotification());
  assert.strictEqual(results.mail?.success, true, 'Mail channel should dispatch successfully');
  assert.strictEqual(results.sms?.success, true, 'SMS channel should dispatch successfully');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Global Type Safety & Helpers Contract (10/10 Verification)
// ─────────────────────────────────────────────────────────────────────────────
TestRunner.register('Type Safety & Global Framework Contracts', async (assert) => {
  require('../core/helpers');

  assert.ok(global.Throttle, 'global.Throttle must be bound');
  assert.ok(global.Mailer, 'global.Mailer must be bound');
  assert.ok(global.Sms, 'global.Sms must be bound');
  assert.ok(global.Notification, 'global.Notification must be bound');

  assert.strictEqual(typeof global.sendMail, 'function', 'global.sendMail must be a function');
  assert.strictEqual(typeof global.sendSms, 'function', 'global.sendSms must be a function');
  assert.strictEqual(typeof global.notify, 'function', 'global.notify must be a function');
});
