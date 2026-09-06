const fs = require('fs');
const path = require('path');
const readline = require('readline');
const DB = require('./config/db');
const User = require('./models/User');
const Cache = require('./core/Cache');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  magenta: "\x1b[35m"
};

function printHeader() {
  console.clear();
  console.log(colors.cyan + "╔════════════════════════════════════════════╗" + colors.reset);
  console.log(colors.cyan + "║          " + colors.bold + "AERO MVC CORE CLI" + colors.cyan + "         ║" + colors.reset);
  console.log(colors.cyan + "║       " + "Framework Development Kit" + colors.cyan + "      ║" + colors.reset);
  console.log(colors.cyan + "╚════════════════════════════════════════════╝" + colors.reset);
  console.log("");
}

function showMenu() {
  console.log(colors.bold + "\n=== MAIN MENU ===\n" + colors.reset);
  console.log("1. " + colors.green + "Database Setup (Initialize Schema & Admin User)" + colors.reset);
  console.log("2. " + colors.green + "Database Seed (Sample Users)" + colors.reset);
  console.log("3. " + colors.cyan + "View All Database Tables" + colors.reset);
  console.log("4. " + colors.blue + "Generate Model Scaffold" + colors.reset);
  console.log("5. " + colors.blue + "Generate Controller Scaffold" + colors.reset);
  console.log("6. " + colors.magenta + "Run All Seeders (db:seed)" + colors.reset);
  console.log("7. " + colors.magenta + "Generate Seeder Scaffold (make:seeder)" + colors.reset);
  console.log("8. " + colors.yellow + "Clear Application Cache (cache:clear)" + colors.reset);
  console.log("9. " + colors.cyan + "Framework Status Overview (app:status)" + colors.reset);
  console.log("10. " + colors.green + "Run Database Migrations (db:migrate)" + colors.reset);
  console.log("11. " + colors.blue + "Generate Migration Scaffold (make:migration)" + colors.reset);
  console.log("12. " + colors.yellow + "Launch Background Queue Worker (queue:work)" + colors.reset);
  console.log("13. " + colors.magenta + "Launch Interactive Tinker REPL (tinker)" + colors.reset);
  console.log("14. " + colors.cyan + "Run Automated Framework Tests (test)" + colors.reset);
  console.log("15. " + colors.red + "View Failed Queue Jobs (queue:failed)" + colors.reset);
  console.log("16. " + colors.yellow + "Retry Failed Queue Job (queue:retry)" + colors.reset);
  console.log("17. " + colors.blue + "Generate Middleware Scaffold (make:middleware)" + colors.reset);
  console.log("18. " + colors.blue + "Generate Background Job Scaffold (make:job)" + colors.reset);
  console.log("19. " + colors.cyan + "Launch Prisma Studio Web GUI (prisma:studio)" + colors.reset);
  console.log("20. " + colors.cyan + "Regenerate Prisma Client (prisma:generate)" + colors.reset);
  console.log("21. " + colors.cyan + "Push Prisma Schema to Database (prisma:db:push)" + colors.reset);
  console.log("0. " + colors.red + "Exit" + colors.reset);
  console.log("");
  
  rl.question(colors.yellow + "Select option: " + colors.reset, (choice) => {
    handleChoice(choice.trim());
  });
}

async function handleChoice(choice) {
  switch (choice) {
    case '1':
      await dbSetup();
      break;
    case '2':
      await dbSeed();
      break;
    case '3':
      await viewTables();
      break;
    case '4':
      promptGenerateModel();
      return;
    case '5':
      promptGenerateController();
      return;
    case '6':
      await runAllSeeders();
      break;
    case '7':
      promptGenerateSeeder();
      return;
    case '8':
      cacheClear();
      break;
    case '9':
      await appStatus();
      break;
    case '10':
      await runMigrations();
      break;
    case '11':
      promptGenerateMigration();
      return;
    case '12':
      await launchQueueWorker();
      break;
    case '13':
      await launchTinker();
      return;
    case '14':
      await runAutomatedTests();
      break;
    case '15':
      await viewFailedJobs();
      break;
    case '16':
      promptRetryFailedJob();
      return;
    case '17':
      promptGenerateMiddleware();
      return;
    case '18':
      promptGenerateJob();
      return;
    case '19':
      await launchPrismaStudio();
      break;
    case '20':
      await generatePrismaClient();
      break;
    case '21':
      await pushPrismaSchema();
      break;
    case '0':
      console.log(colors.green + "\n✓ Goodbye From Aero MVC!\n" + colors.reset);
      rl.close();
      process.exit(0);
    default:
      console.log(colors.red + "✗ Invalid option!" + colors.reset);
      pause();
  }
}

function pause() {
  if (process.argv[2]) {
    rl.close();
    process.exit(0);
  }
  rl.question("\nPress Enter to continue...", () => {
    printHeader();
    showMenu();
  });
}

async function dbSetup() {
  console.log(colors.yellow + "\nInitializing database schema setup..." + colors.reset);
  try {
    const mysql = require('mysql2/promise');
    
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || ''
    });
    
    const dbName = process.env.DB_NAME || 'aero_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tempConnection.end();
    console.log(colors.green + `✓ Database '${dbName}' created or verified successfully.` + colors.reset);

    const sqlPath = path.join(__dirname, 'database.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error("database.sql file not found in project root.");
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    let cleanedSql = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanedSql = cleanedSql.replace(/(--|#)[^\n]*\n/g, '\n');
    
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await DB.query(statement);
    }
    
    console.log(colors.green + "✓ Tables initialized successfully." + colors.reset);

    const adminEmail = 'admin@aeromvc.dev';
    const existing = await User.findByEmail(adminEmail);
    
    if (!existing) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        status: 1
      });
      console.log(colors.green + `✓ Default Admin user seeded:` + colors.reset);
      console.log(colors.white + `  Email:    admin@aeromvc.dev` + colors.reset);
      console.log(colors.white + `  Password: admin123` + colors.reset);
    } else {
      await User.query().where('email', adminEmail).update({ status: 1 });
      console.log(colors.yellow + "✓ Admin user already exists. Forced status to active." + colors.reset);
    }

    console.log(colors.green + "\n✓ Database Setup complete!" + colors.reset);

  } catch (error) {
    console.log(colors.red + "✗ Error during DB Setup: " + error.message + colors.reset);
  }
  pause();
}

async function dbSeed() {
  console.log(colors.yellow + "\nSeeding database with sample users..." + colors.reset);
  try {
    const users = [
      { name: 'System Administrator', email: 'admin@aeromvc.dev', password: 'admin123', role: 'admin', status: 1 },
      { name: 'Developer User', email: 'developer@aeromvc.dev', password: 'developer123', role: 'staff', status: 1 },
      { name: 'Guest User', email: 'guest@aeromvc.dev', password: 'guest123', role: 'staff', status: 1 }
    ];

    let inserted = 0;
    for (const user of users) {
      const existing = await User.findByEmail(user.email);
      if (!existing) {
        await User.create(user);
        inserted++;
      }
    }

    console.log(colors.green + `✓ Seeded ${inserted} new users into system successfully.` + colors.reset);

  } catch (error) {
    console.log(colors.red + "✗ Seed failure: " + error.message + colors.reset);
  }
  pause();
}

async function viewTables() {
  console.log(colors.yellow + "\nDatabase Tables:" + colors.reset);
  try {
    const rows = await DB.query("SHOW TABLES");
    const dbNameKey = `Tables_in_${process.env.DB_NAME || 'aero_db'}`;
    
    if (rows.length === 0) {
      console.log("No tables found inside database.");
    } else {
      rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row[dbNameKey]}`);
      });
    }
  } catch (error) {
    console.log(colors.red + "✗ Error: " + error.message + colors.reset);
  }
  pause();
}

function promptGenerateModel() {
  rl.question(colors.yellow + "\nEnter Model Name (e.g. Customer): " + colors.reset, (name) => {
    const modelName = name.trim();
    if (!modelName) {
      console.log(colors.red + "✗ Model name cannot be empty." + colors.reset);
      pause();
      return;
    }

    try {
      const targetDir = path.join(__dirname, 'models');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, `${modelName}.js`);
      if (fs.existsSync(filePath)) {
        throw new Error(`Model ${modelName}.js already exists!`);
      }

      // Generate table name from model name
      const tableName = modelName.replace(/([A-Z])/g, (match, p1, offset) => {
        return offset > 0 ? '_' + p1.toLowerCase() : p1.toLowerCase();
      }) + 's';

      const template = `const Model = require('../core/Model');

class ${modelName} extends Model {
  /**
   * Database table name
   */
  static table = '${tableName}';

  /**
   * Fields hidden from JSON output
   */
  static hidden = [];
}

module.exports = ${modelName};
`;

      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Model scaffold created at: models/${modelName}.js` + colors.reset);
      console.log(colors.cyan + `  Table: ${tableName}` + colors.reset);
      console.log(colors.cyan + `  Extends: Model (ORM Base Class)` + colors.reset);

    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

function promptGenerateController() {
  rl.question(colors.yellow + "\nEnter Controller Name (e.g. CustomerController): " + colors.reset, (name) => {
    const controllerName = name.trim();
    if (!controllerName) {
      console.log(colors.red + "✗ Controller name cannot be empty." + colors.reset);
      pause();
      return;
    }

    try {
      const targetDir = path.join(__dirname, 'controllers');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, `${controllerName}.js`);
      if (fs.existsSync(filePath)) {
        throw new Error(`Controller ${controllerName}.js already exists!`);
      }

      const template = `class ${controllerName} {
  /**
   * Display listing of index
   */
  static async index(req, res, next) {
    try {
      res.render('${controllerName.toLowerCase().replace('controller', '')}/index', {
        title: '${controllerName}'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create action
   */
  static async store(req, res) {
    try {
      // Logic for adding entries
      res.status(201).json({ status: 'success', message: 'Record created successfully.' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = ${controllerName};
`;

      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Controller scaffold created at: controllers/${controllerName}.js` + colors.reset);

    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

async function runAllSeeders() {
  console.log(colors.yellow + "\nRunning all database seeders..." + colors.reset);
  try {
    const DatabaseSeeder = require('./database/seeders/DatabaseSeeder');
    const results = await DatabaseSeeder.run();

    console.log(colors.green + "\n✓ Seeding complete." + colors.reset);
  } catch (error) {
    console.log(colors.red + "✗ Seeder error: " + error.message + colors.reset);
  }
  pause();
}

function promptGenerateSeeder() {
  rl.question(colors.yellow + "\nEnter Seeder Name (e.g. CategorySeeder): " + colors.reset, (name) => {
    const seederName = name.trim();
    if (!seederName) {
      console.log(colors.red + "✗ Seeder name cannot be empty." + colors.reset);
      pause();
      return;
    }

    try {
      const targetDir = path.join(__dirname, 'database', 'seeders');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, `${seederName}.js`);
      if (fs.existsSync(filePath)) {
        throw new Error(`Seeder ${seederName}.js already exists!`);
      }

      const template = `const DB = require('../../config/db');

/**
 * ${seederName}
 * Database seeder for populating sample data.
 */
class ${seederName} {
  static async run() {
    const records = [
      // Add your seed data here
      // { column1: 'value1', column2: 'value2' }
    ];

    let inserted = 0;
    for (const record of records) {
      // await DB.table('your_table').insert(record);
      inserted++;
    }

    return inserted;
  }
}

module.exports = ${seederName};
`;

      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Seeder scaffold created at: database/seeders/${seederName}.js` + colors.reset);
      console.log(colors.cyan + `  Remember to register it in DatabaseSeeder.js` + colors.reset);

    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

async function cacheClear() {
  console.log(colors.yellow + "\nClearing application cache..." + colors.reset);
  try {
    const cleaned = await Cache.clear();
    console.log(colors.green + `✓ Application cache cleared. (Redis flushed, ${cleaned} file(s) removed).` + colors.reset);
  } catch (error) {
    console.log(colors.red + "✗ Cache clear error: " + error.message + colors.reset);
  }
  pause();
}

async function viewFailedJobs() {
  console.log(colors.yellow + "\nFetching failed background jobs..." + colors.reset);
  try {
    const Queue = require('./core/Queue');
    const failed = await Queue.getFailed();
    if (failed.length === 0) {
      console.log(colors.green + "✓ No failed jobs found. Queue is clean!" + colors.reset);
    } else {
      console.log(colors.bold + `\nFound ${failed.length} failed job(s):\n` + colors.reset);
      failed.forEach(j => {
        console.log(`${colors.cyan}[ID: ${j.id}]${colors.reset} ${colors.bold}${j.display_name}${colors.reset} (Queue: ${j.queue})`);
        console.log(`   Failed at: ${j.failed_at}`);
        try {
          const ex = JSON.parse(j.exception);
          console.log(`   Error: ${colors.red}${ex.message}${colors.reset}`);
        } catch {
          console.log(`   Error: ${colors.red}${j.exception}${colors.reset}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.log(colors.red + "✗ Failed to fetch failed jobs: " + error.message + colors.reset);
  }
  pause();
}

function promptRetryFailedJob() {
  rl.question(colors.yellow + "\nEnter Failed Job ID to retry: " + colors.reset, async (id) => {
    const jobId = parseInt(id.trim());
    if (!jobId) {
      console.log(colors.red + "✗ Invalid job ID." + colors.reset);
      pause();
      return;
    }
    try {
      const Queue = require('./core/Queue');
      const retried = await Queue.retry(jobId);
      if (retried) {
        console.log(colors.green + `✓ Failed job #${jobId} pushed back into active queue.` + colors.reset);
      } else {
        console.log(colors.red + `✗ Failed job #${jobId} not found.` + colors.reset);
      }
    } catch (error) {
      console.log(colors.red + "✗ Retry error: " + error.message + colors.reset);
    }
    pause();
  });
}

function promptGenerateMiddleware() {
  rl.question(colors.yellow + "\nEnter Middleware Name (e.g. CheckRole): " + colors.reset, (name) => {
    const mwName = name.trim();
    if (!mwName) {
      console.log(colors.red + "✗ Middleware name cannot be empty." + colors.reset);
      pause();
      return;
    }
    try {
      const targetDir = path.join(__dirname, 'middlewares');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const filePath = path.join(targetDir, `${mwName}.js`);
      if (fs.existsSync(filePath)) throw new Error(`Middleware ${mwName}.js already exists!`);

      const template = `/**
 * ${mwName} Middleware
 */
module.exports = function ${mwName}(req, res, next) {
  // Add custom middleware logic here
  next();
};
`;
      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Middleware scaffold created at: middlewares/${mwName}.js` + colors.reset);
    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

function promptGenerateJob() {
  rl.question(colors.yellow + "\nEnter Job Name (e.g. ProcessReportJob): " + colors.reset, (name) => {
    const jobName = name.trim();
    if (!jobName) {
      console.log(colors.red + "✗ Job name cannot be empty." + colors.reset);
      pause();
      return;
    }
    try {
      const targetDir = path.join(__dirname, 'jobs');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const filePath = path.join(targetDir, `${jobName}.js`);
      if (fs.existsSync(filePath)) throw new Error(`Job ${jobName}.js already exists!`);

      const template = `const Job = require('../core/Job');

class ${jobName} extends Job {
  constructor(data = {}) {
    super(data);
    this.tries = 3;
    this.delay = 0;
  }

  /**
   * Execute the job
   */
  async handle() {
    console.log('[Job] Executing ${jobName} with data:', this.data);
    // Add background processing logic here
  }

  /**
   * Optional custom failure handler
   */
  async failed(error) {
    console.error('[Job Failed] ${jobName}:', error.message);
  }
}

module.exports = ${jobName};
`;
      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Job scaffold created at: jobs/${jobName}.js` + colors.reset);
    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

async function appStatus() {
  console.log(colors.yellow + "\nAero MVC Framework Status Overview" + colors.reset);
  console.log(colors.cyan + "─────────────────────────────────────" + colors.reset);

  try {
    // Database Status
    const tables = await DB.query("SHOW TABLES");
    const dbName = process.env.DB_NAME || 'aero_db';
    console.log(colors.bold + "\n📦 Database:" + colors.reset);
    console.log(`   Name:   ${dbName}`);
    console.log(`   Tables: ${tables.length}`);

    // Models Count
    const modelsDir = path.join(__dirname, 'models');
    const modelFiles = fs.existsSync(modelsDir)
      ? fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(colors.bold + "\n📄 QueryBuilder Models:" + colors.reset);
    console.log(`   Count: ${modelFiles.length}`);
    modelFiles.forEach(f => console.log(`   → ${f}`));

    // Prisma Schema Models
    const prismaSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      const content = fs.readFileSync(prismaSchemaPath, 'utf8');
      const matches = content.match(/^model\s+([A-Za-z0-9_]+)\s+\{/gm) || [];
      console.log(colors.bold + "\n💎 Prisma Schema Models:" + colors.reset);
      console.log(`   Count: ${matches.length}`);
      matches.forEach(m => {
        const name = m.replace(/^model\s+/, '').replace(/\s+\{$/, '');
        console.log(`   → ${name}`);
      });
    }

    // Controllers Count
    const controllersDir = path.join(__dirname, 'controllers');
    const controllerFiles = fs.existsSync(controllersDir)
      ? fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(colors.bold + "\n🎮 Controllers:" + colors.reset);
    console.log(`   Count: ${controllerFiles.length}`);
    controllerFiles.forEach(f => console.log(`   → ${f}`));

    // Seeders Count
    const seedersDir = path.join(__dirname, 'database', 'seeders');
    const seederFiles = fs.existsSync(seedersDir)
      ? fs.readdirSync(seedersDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(colors.bold + "\n🌱 Seeders:" + colors.reset);
    console.log(`   Count: ${seederFiles.length}`);
    seederFiles.forEach(f => console.log(`   → ${f}`));

    // Middlewares Count
    const middlewaresDir = path.join(__dirname, 'middlewares');
    const middlewareFiles = fs.existsSync(middlewaresDir)
      ? fs.readdirSync(middlewaresDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(colors.bold + "\n🛡️  Middlewares:" + colors.reset);
    console.log(`   Count: ${middlewareFiles.length}`);
    middlewareFiles.forEach(f => console.log(`   → ${f}`));

    // Core Libraries
    const coreDir = path.join(__dirname, 'core');
    const coreFiles = fs.existsSync(coreDir)
      ? fs.readdirSync(coreDir).filter(f => f.endsWith('.js'))
      : [];
    console.log(colors.bold + "\n⚙️  Core Libraries:" + colors.reset);
    console.log(`   Count: ${coreFiles.length}`);
    coreFiles.forEach(f => console.log(`   → ${f}`));

    // Cache Stats
    const cacheStats = Cache.stats();
    console.log(colors.bold + "\n💾 Cache:" + colors.reset);
    console.log(`   Files:   ${cacheStats.totalFiles}`);
    console.log(`   Size:    ${(cacheStats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Valid:   ${cacheStats.validCount}`);
    console.log(`   Expired: ${cacheStats.expiredCount}`);

    console.log(colors.cyan + "\n─────────────────────────────────────" + colors.reset);
    console.log(colors.green + "✓ Framework status check complete." + colors.reset);

  } catch (error) {
    console.log(colors.red + "✗ Status check error: " + error.message + colors.reset);
  }
  pause();
}

async function runMigrations() {
  console.log(colors.yellow + "\nRunning database migrations..." + colors.reset);
  try {
    const Migrator = require('./core/Migrator');
    const migrator = new Migrator();
    const ran = await migrator.run();
    if (ran.length === 0) {
      console.log(colors.green + "✓ No pending migrations." + colors.reset);
    } else {
      console.log(colors.green + `\n✓ Successfully executed ${ran.length} migration(s).` + colors.reset);
    }
  } catch (error) {
    console.log(colors.red + "✗ Migration failed: " + error.message + colors.reset);
  }
  pause();
}

function promptGenerateMigration() {
  rl.question(colors.yellow + "\nEnter Migration Name (e.g. create_orders_table): " + colors.reset, (name) => {
    const migrationName = name.trim().toLowerCase();
    if (!migrationName) {
      console.log(colors.red + "✗ Migration name cannot be empty." + colors.reset);
      pause();
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
      const fileName = `${timestamp}_${migrationName}.js`;
      const targetDir = path.join(__dirname, 'database', 'migrations');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      
      let tableName = 'table_name';
      if (migrationName.startsWith('create_') && migrationName.endsWith('_table')) {
        tableName = migrationName.replace('create_', '').replace('_table', '');
      }

      const template = `const DB = require('../../config/db');

class ${resolveClassName(migrationName)} {
  /**
   * Run the migrations.
   */
  async up() {
    await DB.query(\`
      CREATE TABLE IF NOT EXISTS \\\`${tableName}\\\` (
        \\\`id\\\` INT AUTO_INCREMENT PRIMARY KEY,
        \\\`created_at\\\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \\\`updated_at\\\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    \`);
  }

  /**
   * Reverse the migrations.
   */
  async down() {
    await DB.query(\`DROP TABLE IF EXISTS \\\`${tableName}\\\`\`);
  }
}

module.exports = ${resolveClassName(migrationName)};
`;

      fs.writeFileSync(filePath, template, 'utf8');
      console.log(colors.green + `✓ Migration scaffold created at: database/migrations/${fileName}` + colors.reset);
    } catch (error) {
      console.log(colors.red + "✗ Scaffold failed: " + error.message + colors.reset);
    }
    pause();
  });
}

function resolveClassName(migrationName) {
  const parts = migrationName.split('_');
  let className = '';
  parts.forEach(p => {
    if (p) className += p.charAt(0).toUpperCase() + p.slice(1);
  });
  return className;
}

async function launchQueueWorker() {
  console.log(colors.yellow + "\nLaunching Background Queue Worker..." + colors.reset);
  try {
    const QueueWorker = require('./core/QueueWorker');
    const worker = new QueueWorker();
    await worker.work();
  } catch (error) {
    console.log(colors.red + "✗ Worker failed: " + error.message + colors.reset);
    pause();
  }
}

async function launchTinker() {
  console.log(colors.magenta + "\nBooting Aero Interactive Tinker REPL..." + colors.reset);
  console.log(colors.white + "Pre-loaded Core Services: DB (QueryBuilder), prisma (PrismaClient), Cache, Logger, Flash, ApiResource, Queue, HasApiTokens" + colors.reset);
  
  const modelsDir = path.join(__dirname, 'models');
  let loadedModelsCount = 0;
  
  rl.close();
  
  const r = require('repl').start({
    prompt: colors.bold + colors.magenta + 'aero > ' + colors.reset,
    useGlobal: true
  });

  // Pre-load core services
  r.context.DB = require('./config/db');
  try {
    r.context.prisma = require('./config/prisma');
  } catch (err) {
    // ignore if not configured
  }
  r.context.Cache = require('./core/Cache');
  r.context.Logger = require('./core/Logger');
  r.context.Flash = require('./core/Flash');
  r.context.ApiResource = require('./core/ApiResource');
  r.context.Queue = require('./core/Queue');
  r.context.HasApiTokens = require('./core/HasApiTokens');

  // Pre-load models
  if (fs.existsSync(modelsDir)) {
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const modelName = path.basename(file, '.js');
      try {
        r.context[modelName] = require(path.join(modelsDir, file));
        loadedModelsCount++;
      } catch (err) {
        // Ignore
      }
    });
  }

  console.log(colors.white + `Pre-loaded ${loadedModelsCount} Model(s) into context.\n` + colors.reset);
  console.log("Type any JavaScript/Database command. Type '.exit' or Ctrl+D to quit.\n");

  r.on('exit', () => {
    console.log(colors.green + "\n✓ Goodbye From Tinker!\n" + colors.reset);
    process.exit(0);
  });
}

async function runAutomatedTests() {
  try {
    const TestRunner = require('./core/testRunner');
    await TestRunner.runAll();
  } catch (error) {
    console.log(colors.red + "✗ Testing failed: " + error.message + colors.reset);
  }
  pause();
}

async function launchPrismaStudio() {
  console.log(colors.cyan + "\n💎 Launching Prisma Studio Web GUI..." + colors.reset);
  console.log(colors.yellow + "Opening Prisma Studio at http://localhost:5555" + colors.reset);
  console.log(colors.white + "Press Ctrl+C to stop Prisma Studio and return.\n" + colors.reset);
  const { spawn } = require('child_process');
  const prismaSchema = path.join(__dirname, 'prisma', 'schema.prisma');
  const studio = spawn('npx', ['prisma', 'studio', '--schema', prismaSchema], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  studio.on('close', (code) => {
    console.log(colors.green + `\n✓ Prisma Studio closed.` + colors.reset);
    pause();
  });
}

async function generatePrismaClient() {
  console.log(colors.cyan + "\n💎 Regenerating Prisma Client..." + colors.reset);
  const { execSync } = require('child_process');
  const prismaSchema = path.join(__dirname, 'prisma', 'schema.prisma');
  try {
    const out = execSync(`npx prisma generate --schema="${prismaSchema}"`, {
      cwd: __dirname,
      encoding: 'utf8'
    });
    console.log(colors.green + out + colors.reset);
    console.log(colors.green + "✓ Prisma Client regenerated successfully." + colors.reset);
  } catch (error) {
    console.log(colors.red + "✗ Failed to generate Prisma Client: " + error.message + colors.reset);
  }
  pause();
}

async function pushPrismaSchema() {
  console.log(colors.cyan + "\n💎 Pushing Prisma Schema to Database..." + colors.reset);
  const { execSync } = require('child_process');
  const prismaSchema = path.join(__dirname, 'prisma', 'schema.prisma');
  try {
    const out = execSync(`npx prisma db push --schema="${prismaSchema}"`, {
      cwd: __dirname,
      encoding: 'utf8'
    });
    console.log(colors.green + out + colors.reset);
    console.log(colors.green + "✓ Database schema synchronized successfully via Prisma." + colors.reset);
  } catch (error) {
    console.log(colors.red + "✗ DB push failed: " + error.message + colors.reset);
  }
  pause();
}

// Kickstart CLI on execute
if (require.main === module) {
  printHeader();
  const arg = process.argv[2];
  if (arg) {
    handleChoice(arg.trim());
  } else {
    showMenu();
  }
}
