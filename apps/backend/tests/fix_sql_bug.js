const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../controllers');

const files = [
  'VoucherController.js',
  'SupplierController.js',
  'EmployeeController.js',
  'DailySheetController.js',
  'CustomerController.js',
  'CashbookController.js',
  'AttendanceController.js'
];

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('SELECT id FROM tbl_user_shops')) {
      console.log(`Fixing tbl_user_shops query in ${file}...`);
      content = content.replace(/SELECT id FROM tbl_user_shops/g, 'SELECT us_id FROM tbl_user_shops');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully fixed ${file}.`);
    } else {
      console.log(`No fix needed for ${file}.`);
    }
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
