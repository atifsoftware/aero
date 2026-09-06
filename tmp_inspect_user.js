const User = require('./app/models/User');

async function run() {
  try {
    const user = await User.findByUsername('admin');
    console.log("User instance:", user);
    console.log("Attributes:", user?.getAttributes());
    console.log("Primary Key Name:", User.primaryKey);
    console.log("user_id value:", user?.get('user_id'));
    console.log("id value:", user?.get('id'));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
