require('dotenv').config();
const DB = require('../config/db');

async function check() {
  try {
    const columns = await DB.query('DESCRIBE tbl_user_shops');
    console.log('tbl_user_shops columns:', columns);

    const userShops = await DB.query('SELECT * FROM tbl_user_shops LIMIT 5');
    console.log('tbl_user_shops sample data:', userShops);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

check();
