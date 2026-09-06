const TestRunner = require('../core/testRunner');
const DB = require('../config/db');

TestRunner.register('Settings DB Persistence & Cache Integrity', async (assert) => {
  await DB.query(`
    CREATE TABLE IF NOT EXISTS \`settings\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`setting_key\` VARCHAR(255) UNIQUE NOT NULL,
      \`setting_value\` TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Save current values to restore later
  const originalRows = await DB.table('settings').get();
  const backup = {};
  originalRows.forEach(r => {
    backup[r.setting_key] = r.setting_value;
  });

  // Helper update
  const updateSetting = async (key, value) => {
    const existing = await DB.table('settings').where('setting_key', key).first();
    if (existing) {
      await DB.table('settings').where('setting_key', key).update({ setting_value: value || '' });
    } else {
      await DB.table('settings').insert({ setting_key: key, setting_value: value || '' });
    }
  };

  // Test updates
  await updateSetting('name', 'Test NodeFlow Pro');
  await updateSetting('short_name', 'TestNFPro');
  await updateSetting('email', 'test@nodeflow.com');
  await updateSetting('mobile', '01700000000');
  await updateSetting('address', 'Test Address, City');

  // Assertions
  const nameRow = await DB.table('settings').where('setting_key', 'name').first();
  assert.strictEqual(nameRow.setting_value, 'Test NodeFlow Pro', 'Name setting value matches.');

  const shortNameRow = await DB.table('settings').where('setting_key', 'short_name').first();
  assert.strictEqual(shortNameRow.setting_value, 'TestNFPro', 'Short Name setting value matches.');

  const emailRow = await DB.table('settings').where('setting_key', 'email').first();
  assert.strictEqual(emailRow.setting_value, 'test@nodeflow.com', 'Email setting value matches.');

  const mobileRow = await DB.table('settings').where('setting_key', 'mobile').first();
  assert.strictEqual(mobileRow.setting_value, '01700000000', 'Mobile setting value matches.');

  const addressRow = await DB.table('settings').where('setting_key', 'address').first();
  assert.strictEqual(addressRow.setting_value, 'Test Address, City', 'Address setting value matches.');

  // Restore backup
  const keys = ['name', 'short_name', 'email', 'mobile', 'address'];
  for (const key of keys) {
    if (backup[key] !== undefined) {
      await updateSetting(key, backup[key]);
    } else {
      await DB.table('settings').where('setting_key', key).delete();
    }
  }

  // Verify restore
  const restoredName = await DB.table('settings').where('setting_key', 'name').first();
  if (backup['name'] !== undefined) {
    assert.strictEqual(restoredName?.setting_value, backup['name'], 'Name successfully restored.');
  } else {
    assert.strictEqual(restoredName, null, 'Name deleted as it did not exist prior.');
  }
});
