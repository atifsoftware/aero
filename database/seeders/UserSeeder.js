const User = require('../../app/models/User');

/**
 * User Seeder
 * Seeds sample user accounts into the users table.
 */
class UserSeeder {
  static async run() {
    const users = [
      { name: 'System Administrator', email: 'admin@aeromvc.dev', password: 'admin123', role: 'admin', status: 1 },
      { name: 'Developer User', email: 'developer@aeromvc.dev', password: 'developer123', role: 'staff', status: 1 },
      { name: 'Guest User', email: 'guest@aeromvc.dev', password: 'guest123', role: 'staff', status: 1 },
    ];

    let inserted = 0;
    for (const user of users) {
      const existing = await User.findByEmail(user.email);
      if (!existing) {
        await User.create(user);
        inserted++;
      } else {
        await User.query().where('email', user.email).update({ status: 1 });
      }
    }

    return inserted;
  }
}

module.exports = UserSeeder;
