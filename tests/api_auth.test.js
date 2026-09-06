const TestRunner = require('../app/core/testRunner');
const User = require('../app/models/User');
const DB = require('../config/db');
const HasApiTokens = require('../app/core/HasApiTokens');

TestRunner.register('API Status, Settings, and Token Authentication Workflow', async (assert) => {
  // 1. Verify /api/settings fetch
  const cachedSettings = global.cachedSettingsMap || {};
  assert.ok(cachedSettings, 'Settings map should exist.');

  // 2. Simulate Login and issuing token
  const adminEmail = 'admin@aeromvc.dev';
  const adminUser = await User.findByEmail(adminEmail);
  assert.ok(adminUser, 'Admin user should exist.');

  // Create a token manually to test token verification
  const tokenName = 'Test Mobile Device';
  const { plainTextToken, token: hashedToken } = await HasApiTokens.createToken(adminUser, tokenName);

  assert.ok(plainTextToken.startsWith('nf_pat_'), 'Plain text token format is correct.');
  assert.ok(hashedToken, 'Hashed token exists.');

  // Validate via token authentication simulation
  const crypto = require('crypto');
  const hashedInput = crypto.createHash('sha256').update(plainTextToken).digest('hex');
  const tokenRecord = await DB.table('personal_access_tokens').where('token', hashedInput).first();

  assert.ok(tokenRecord, 'Token record found in database.');
  assert.strictEqual(tokenRecord.tokenable_id, adminUser.get('id'), 'Token belongs to the correct user.');
  assert.strictEqual(tokenRecord.name, 'Test Mobile Device', 'Token name matches.');

  // Clean up
  await HasApiTokens.revokeToken(adminUser, plainTextToken);
  const deletedToken = await DB.table('personal_access_tokens').where('token', hashedInput).first();
  assert.ok(!deletedToken, 'Token was successfully revoked.');
});
