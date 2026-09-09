const fs = require('fs');
const path = require('path');
const DB = require('../config/db');

/**
 * Migrator Engine for Aero
 * Manages database schema migrations, modeled after NovaFlow.
 * Enhanced with Knex.js support for complex schema operations
 */
class Migrator {
  constructor(directory = null) {
    this.table = 'migrations';
    this.directory = directory || path.join(process.cwd(), 'database', 'migrations');
  }

  /**
   * Ensure the migrations tracking table exists.
   */
  async ensureTableExists() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`${this.table}\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`migration\` VARCHAR(255) NOT NULL UNIQUE,
        \`batch\` INT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await DB.query(sql);
  }

  /**
   * Run all pending migrations
   * @returns {Promise<string[]>} List of executed migration names
   */
  async run() {
    await this.ensureTableExists();

    const executed = await this.getExecutedMigrations();
    const files = this.getMigrationFiles();
    const batch = await this.getNextBatchNumber();
    const ran = [];
    
    // Get knex instance for migrations that need it
    const knex = await DB.getKnex();

    for (const file of files) {
      const migrationName = path.basename(file, '.js');

      if (executed.includes(migrationName)) {
        continue;
      }

      console.log(`\x1b[36mMigrating:\x1b[0m ${migrationName}`);

      try {
        const migrationModule = require(file);
        
        let instance;
        if (typeof migrationModule === 'function') {
          // If exports a class
          instance = new migrationModule();
        } else {
          // If exports a plain object/module
          instance = migrationModule;
        }

        if (typeof instance.up !== 'function') {
          throw new Error(`Migration ${migrationName} does not define an up() method.`);
        }

        // Run the schema migration up (pass knex for schema builder support)
        await instance.up(knex);

        // Record execution in migrations table
        await this.log(migrationName, batch);
        ran.push(migrationName);

        console.log(`\x1b[32mMigrated:\x1b[0m  ${migrationName}`);
      } catch (error) {
        console.error(`\x1b[31m✗ Error migrating ${migrationName}:\x1b[0m ${error.message}`);
        throw error;
      }
    }

    return ran;
  }

  /**
   * Rollback last batch of migrations
   * @returns {Promise<string[]>} List of rolled back migration names
   */
  async rollback() {
    await this.ensureTableExists();

    const batch = await this.getCurrentBatch();
    if (batch === 0) {
      console.log('\x1b[33mNo migrations to rollback\x1b[0m');
      return [];
    }

    const migrationsToRollback = await this.getMigrationsByBatch(batch);
    const knex = await DB.getKnex();
    const rolledBack = [];

    // Sort in reverse order for proper dependency handling
    migrationsToRollback.reverse();

    for (const migrationName of migrationsToRollback) {
      console.log(`\x1b[36mRolling back:\x1b[0m ${migrationName}`);

      try {
        const filePath = path.join(this.directory, `${migrationName}.js`);
        const migrationModule = require(filePath);
        
        let instance;
        if (typeof migrationModule === 'function') {
          instance = new migrationModule();
        } else {
          instance = migrationModule;
        }

        if (typeof instance.down !== 'function') {
          throw new Error(`Migration ${migrationName} does not define a down() method.`);
        }

        // Run the schema migration down
        await instance.down(knex);

        // Remove from migrations table
        await this.unlog(migrationName);
        rolledBack.push(migrationName);

        console.log(`\x1b[32mRolled back:\x1b[0m  ${migrationName}`);
      } catch (error) {
        console.error(`\x1b[31m✗ Error rolling back ${migrationName}:\x1b[0m ${error.message}`);
        throw error;
      }
    }

    return rolledBack;
  }

  /**
   * Fetch already executed migrations
   */
  async getExecutedMigrations() {
    const rows = await DB.query(`SELECT migration FROM \`${this.table}\` ORDER BY id`);
    return rows.map(r => r.migration);
  }

  /**
   * Get migrations by batch number
   */
  async getMigrationsByBatch(batch) {
    const rows = await DB.query(`SELECT migration FROM \`${this.table}\` WHERE batch = ? ORDER BY id DESC`, [batch]);
    return rows.map(r => r.migration);
  }

  /**
   * Get current batch number
   */
  async getCurrentBatch() {
    const rows = await DB.query(`SELECT MAX(batch) as max_batch FROM \`${this.table}\``);
    return rows[0].max_batch || 0;
  }

  /**
   * Get list of all migration files sorted chronologically
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true });
      return [];
    }

    return fs.readdirSync(this.directory)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(this.directory, file))
      .sort();
  }

  /**
   * Get next batch number
   */
  async getNextBatchNumber() {
    const rows = await DB.query(`SELECT MAX(batch) as max_batch FROM \`${this.table}\``);
    const max = rows[0].max_batch || 0;
    return max + 1;
  }

  /**
   * Log migration into database
   */
  async log(migration, batch) {
    await DB.table(this.table).insert({ migration, batch });
  }

  /**
   * Remove migration from database
   */
  async unlog(migration) {
    await DB.table(this.table).where('migration', migration).delete();
  }

  /**
   * Show migration status
   */
  async status() {
    await this.ensureTableExists();

    const executed = await this.getExecutedMigrations();
    const files = this.getMigrationFiles();

    console.log('\n\x1b[1m📊 Migration Status\x1b[0m\n');
    console.log('─'.repeat(70));

    if (files.length === 0) {
      console.log('\x1b[33mNo migrations found\x1b[0m');
      return;
    }

    for (const file of files) {
      const migrationName = path.basename(file, '.js');
      const status = executed.includes(migrationName) ? '\x1b[32m✓ Executed\x1b[0m' : '\x1b[33m○ Pending\x1b[0m';
      console.log(`${status.padEnd(18)} | ${migrationName}`);
    }

    console.log('─'.repeat(70));
    console.log(`Total: ${files.length} | Executed: ${executed.length} | Pending: ${files.length - executed.length}\n`);
  }
}

module.exports = Migrator;
