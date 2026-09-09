const TestRunner = require('../core/testRunner');
const DB = require('../config/db');
const csrf = require('../middlewares/csrf');
const helpers = require('../core/helpers');

// Test 1: CSRF Timing-Safe Validation & Boundary Protection
TestRunner.register('Security Hardening - CSRF Timing-Safe Protection', async (assert) => {
  const secretToken = 'a'.repeat(64);

  // Case A: Valid token passes
  let nextCalledA = false;
  let errorA = null;
  const reqA = {
    method: 'POST',
    path: '/admin/profile',
    session: { csrfToken: secretToken },
    body: { _csrf: secretToken },
    headers: {}
  };
  const resA = { locals: {} };
  csrf(reqA, resA, (err) => {
    nextCalledA = true;
    errorA = err;
  });
  assert.strictEqual(nextCalledA, true, 'Valid CSRF token should proceed');
  assert.strictEqual(errorA, undefined, 'No error for valid CSRF token');

  // Case B: Mismatched token of same length rejected
  let errorB = null;
  const reqB = {
    method: 'POST',
    path: '/admin/profile',
    session: { csrfToken: secretToken },
    body: { _csrf: 'b'.repeat(64) },
    headers: {}
  };
  csrf(reqB, resA, (err) => { errorB = err; });
  assert.ok(errorB, 'Mismatched CSRF token must trigger an error');
  assert.strictEqual(errorB.status, 403, 'CSRF failure must return HTTP 403');

  // Case C: Token of different length rejected cleanly without throwing unhandled exceptions
  let errorC = null;
  const reqC = {
    method: 'POST',
    path: '/admin/profile',
    session: { csrfToken: secretToken },
    body: { _csrf: 'short_token' },
    headers: {}
  };
  csrf(reqC, resA, (err) => { errorC = err; });
  assert.ok(errorC, 'Different-length CSRF token must trigger an error');
  assert.strictEqual(errorC.status, 403, 'CSRF failure on length mismatch returns HTTP 403');
});

// Test 2: QueryBuilder Mass Delete & Mass Update Protection
TestRunner.register('Security Hardening - QueryBuilder Mass Mutation Guards', async (assert) => {
  // Test Delete without WHERE clause throws
  let deleteError = null;
  try {
    await DB.table('users').delete();
  } catch (err) {
    deleteError = err;
  }
  assert.ok(deleteError, 'Calling delete() without a WHERE clause must throw');
  assert.ok(deleteError.message.includes('Unsafe SQL operation'), 'Error message specifies unsafe delete');

  // Test Update without WHERE clause throws
  let updateError = null;
  try {
    await DB.table('users').update({ status: 0 });
  } catch (err) {
    updateError = err;
  }
  assert.ok(updateError, 'Calling update() without a WHERE clause must throw');
  assert.ok(updateError.message.includes('Unsafe SQL operation'), 'Error message specifies unsafe update');

  // Test allowMassDelete() bypass
  const massDelQuery = DB.table('users').allowMassDelete();
  assert.strictEqual(massDelQuery._allowMassDelete, true, 'allowMassDelete() enables mass deletion flag');

  // Test allowMassUpdate() bypass
  const massUpdateQuery = DB.table('users').allowMassUpdate();
  assert.strictEqual(massUpdateQuery._allowMassUpdate, true, 'allowMassUpdate() enables mass update flag');
});

// Test 3: QueryBuilder toRawSql() Value Escaping & Dollar Replacement Security
TestRunner.register('Security Hardening - toRawSql() Secure Escaping & Pattern Safety', async (assert) => {
  const query = DB.table('users')
    .where('name', "O'Reilly")
    .where('bio', 'Earn $100 & win $1')
    .where('is_active', true)
    .where('rating', 99)
    .whereNull('deleted_at');

  const rawSql = query.toRawSql();

  // Escaping single quotes
  assert.ok(rawSql.includes("O\\'Reilly"), 'Quotes should be escaped');
  // Ensuring dollar signs $100 and $1 aren\'t interpreted as regex replacement patterns
  assert.ok(rawSql.includes('Earn $100 & win $1'), 'Dollar signs must be preserved verbatim in raw SQL');
  // Boolean handled as 1
  assert.ok(rawSql.includes('`is_active` = 1'), 'Booleans formatted as 1 or 0');
  // Number handled without quotes
  assert.ok(rawSql.includes('`rating` = 99'), 'Numbers formatted without quotes');
});

// Test 4: Helpers XSS Sanitization & Crypto Random Generation
TestRunner.register('Security Hardening - Helpers XSS & Crypto Random Integrity', async (assert) => {
  // Test escapeHtml
  const dirty = '<script>alert("xss") & "quotes" & \'single\'</script>';
  const clean = helpers.escapeHtml(dirty);
  assert.strictEqual(clean.includes('<script>'), false, 'Tags must be escaped');
  assert.strictEqual(clean.includes('&lt;script&gt;'), true, 'Tags converted to entities');
  assert.strictEqual(clean.includes('&amp;'), true, 'Ampersands converted to entities');

  // Test str_random entropy & length
  const token1 = helpers.str_random(32);
  const token2 = helpers.str_random(32);
  assert.strictEqual(token1.length, 32, 'str_random produces expected length');
  assert.strictEqual(token2.length, 32, 'str_random produces expected length');
  assert.notStrictEqual(token1, token2, 'Two consecutive random tokens must not collide');

  // Test flash XSS escaping
  const store = require('../core/RequestContext');
  const fakeReq = {
    session: {
      flash_error: '<img src=x onerror=alert(1)>',
      flash_error_class: 'alert alert-danger'
    }
  };
  const fakeRes = { locals: {} };

  let renderedHtml = '';
  store.run({ req: fakeReq, res: fakeRes }, () => {
    renderedHtml = helpers.flash('error');
  });
  assert.strictEqual(renderedHtml.includes('<img src=x'), false, 'Flash message must escape XSS payloads');
  assert.strictEqual(renderedHtml.includes('&lt;img src=x'), true, 'Flash message contains escaped HTML entities');
});
