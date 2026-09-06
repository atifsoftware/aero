const TestRunner = require('../core/testRunner');
const User = require('../models/User');
const DB = require('../config/db');

TestRunner.register('User Management ORM CRUD Integrity', async (assert) => {
  const testEmail = 'staff-test@nodeflow.com';

  // Clean existing test user if any
  const existing = await User.findByEmail(testEmail);
  if (existing) {
    await User.query().where('email', testEmail).delete();
  }

  // 1. Create a user
  const userId = await User.create({
    name: 'Temporary Staff Partner',
    email: testEmail,
    password: 'securepass123',
    role: 'staff',
    status: 0 // suspended
  });

  assert.ok(userId > 0, 'User insertion ID should be positive.');

  // 2. Find user and verify details + password hashing
  const staff = await User.find(userId);
  assert.ok(staff, 'Staff user should be retrieved.');
  assert.strictEqual(staff.get('name'), 'Temporary Staff Partner', 'Name should match.');
  assert.strictEqual(staff.get('role'), 'staff', 'Role must be staff.');
  assert.strictEqual(parseInt(staff.get('status')), 0, 'Status must be suspended.');
  assert.ok(User.verifyPassword('securepass123', staff.get('password')), 'Password verification should succeed.');

  // 3. Update user status to active (1)
  await User.update(userId, { status: 1 });
  const activeStaff = await User.find(userId);
  assert.strictEqual(parseInt(activeStaff.get('status')), 1, 'Status must be updated to active.');

  // 4. Delete user
  await User.destroy(userId);
  const deletedStaff = await User.find(userId);
  assert.ok(!deletedStaff, 'User should be deleted and no longer retrievable.');
});
