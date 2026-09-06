const mysql = require('mysql2/promise');
require('dotenv').config();

// Resolve Logger lazily to prevent circular dependencies
let _logger = null;
function getLogger() {
  if (!_logger) {
    try {
      _logger = require('../app/core/Logger');
    } catch {
      _logger = null;
    }
  }
  return _logger;
}

/**
 * Parse Database Configuration from environment
 * Supports both DATABASE_URL and individual DB_* variables
 */
function resolveDbConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      return {
        host: parsedUrl.hostname || 'localhost',
        port: parseInt(parsedUrl.port) || 3306,
        user: decodeURIComponent(parsedUrl.username || 'root'),
        password: decodeURIComponent(parsedUrl.password || ''),
        database: (parsedUrl.pathname || '').replace(/^\//, '') || 'aero_db',
      };
    } catch (e) {
      console.warn('[DB] Failed to parse DATABASE_URL, falling back to discrete DB_* env vars.');
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'aero_db',
  };
}

const dbConfig = resolveDbConfig();
const slowQueryThresholdMs = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 100;

// Create connection pool
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Flag to track whether database auto-creation check was executed
let dbChecked = false;

/**
 * Ensure database exists on the target MySQL server.
 * Automatically runs CREATE DATABASE IF NOT EXISTS if needed.
 */
async function ensureDatabaseExists() {
  if (dbChecked) return;
  try {
    const rawConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await rawConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rawConnection.end();
    dbChecked = true;
  } catch (err) {
    // If permission denied or server unreachable, proceed and let connection pool report
    dbChecked = true;
  }
}

// Trigger check in background
ensureDatabaseExists().catch(() => {});

/**
 * Audit and log query performance if it exceeds threshold
 */
function auditQueryPerformance(sql, params, durationMs) {
  if (durationMs >= slowQueryThresholdMs) {
    const logger = getLogger();
    const msg = `[SLOW QUERY] (${durationMs}ms) ${sql} | Params: ${JSON.stringify(params || [])}`;
    if (logger && typeof logger.warning === 'function') {
      logger.warning(msg);
    } else {
      console.warn(`\x1b[33m${msg}\x1b[0m`);
    }
  }
}

/**
 * Fluent Query Builder Class for Aero
 */
class QueryBuilder {
  constructor(table, connection = null) {
    this._table = table;
    this._connection = connection;
    this._select = '*';
    this._wheres = []; // Elements: { boolean: 'AND'|'OR', sql: string, bindings: Array }
    this._joins = [];
    this._orders = [];
    this._limit = null;
    this._offset = null;
    this._groupBy = null;
    this._having = null;
    this._havingBindings = [];
  }

  select(fields, ...more) {
    if (more.length > 0) {
      this._select = [fields, ...more].join(', ');
    } else {
      this._select = Array.isArray(fields) ? fields.join(', ') : fields;
    }
    return this;
  }

  _parseTableName(table) {
    let tableName = table;
    let alias = '';
    if (tableName.toLowerCase().includes(' as ')) {
      const parts = tableName.split(/ as /i);
      tableName = parts[0].trim();
      alias = ` AS \`${parts[1].trim()}\``;
    }
    const escTable = tableName.includes('.') 
      ? tableName.split('.').map(t => `\`${t}\``).join('.') 
      : `\`${tableName}\``;
    return `${escTable}${alias}`;
  }

  _addWhere(boolean, sql, bindings = []) {
    this._wheres.push({ boolean, sql, bindings });
    return this;
  }

  where(column, operator, value) {
    if (typeof column === 'function') {
      const nested = new QueryBuilder(this._table, this._connection);
      column(nested);
      if (nested._wheres.length > 0) {
        const { sql, bindings } = nested._compileWheres();
        this._addWhere('AND', `(${sql})`, bindings);
      }
      return this;
    }

    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} ${operator} ?`, [value]);
    return this;
  }

  orWhere(column, operator, value) {
    if (typeof column === 'function') {
      const nested = new QueryBuilder(this._table, this._connection);
      column(nested);
      if (nested._wheres.length > 0) {
        const { sql, bindings } = nested._compileWheres();
        this._addWhere('OR', `(${sql})`, bindings);
      }
      return this;
    }

    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('OR', `${colName} ${operator} ?`, [value]);
    return this;
  }

  whereIn(column, values) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => '?').join(', ');
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} IN (${placeholders})`, values);
    return this;
  }

  whereNotIn(column, values) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => '?').join(', ');
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} NOT IN (${placeholders})`, values);
    return this;
  }

  whereNull(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} IS NULL`, []);
    return this;
  }

  whereNotNull(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} IS NOT NULL`, []);
    return this;
  }

  whereBetween(column, range) {
    if (!Array.isArray(range) || range.length !== 2) return this;
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} BETWEEN ? AND ?`, range);
    return this;
  }

  whereNotBetween(column, range) {
    if (!Array.isArray(range) || range.length !== 2) return this;
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._addWhere('AND', `${colName} NOT BETWEEN ? AND ?`, range);
    return this;
  }

  whereLike(column, value) {
    return this.where(column, 'LIKE', value);
  }

  orWhereLike(column, value) {
    return this.orWhere(column, 'LIKE', value);
  }

  whereRaw(sql, bindings = []) {
    this._addWhere('AND', sql, bindings);
    return this;
  }

  orWhereRaw(sql, bindings = []) {
    this._addWhere('OR', sql, bindings);
    return this;
  }

  join(table, first, operator, second, type = 'INNER') {
    const escTable = this._parseTableName(table);
    if (operator === undefined && second === undefined) {
      this._joins.push(`${type} JOIN ${escTable} ON ${first}`);
    } else {
      const escFirst = first.includes('.') ? first.split('.').map(c => `\`${c}\``).join('.') : `\`${first}\``;
      const escSecond = second.includes('.') ? second.split('.').map(c => `\`${c}\``).join('.') : `\`${second}\``;
      this._joins.push(`${type} JOIN ${escTable} ON ${escFirst} ${operator} ${escSecond}`);
    }
    return this;
  }

  leftJoin(table, first, operator, second) {
    return this.join(table, first, operator, second, 'LEFT');
  }

  rightJoin(table, first, operator, second) {
    return this.join(table, first, operator, second, 'RIGHT');
  }

  groupBy(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._groupBy = `GROUP BY ${colName}`;
    return this;
  }

  having(column, operator, value) {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._having = `HAVING ${colName} ${operator} ?`;
    this._havingBindings = [value];
    return this;
  }

  orderBy(column, direction = 'ASC') {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    this._orders.push(`${colName} ${direction.toUpperCase()}`);
    return this;
  }

  latest(column = 'created_at') {
    return this.orderBy(column, 'DESC');
  }

  oldest(column = 'created_at') {
    return this.orderBy(column, 'ASC');
  }

  limit(count) {
    this._limit = parseInt(count);
    return this;
  }

  offset(count) {
    this._offset = parseInt(count);
    return this;
  }

  when(condition, callback, defaultCallback = null) {
    if (condition) {
      callback(this, condition);
    } else if (defaultCallback) {
      defaultCallback(this, condition);
    }
    return this;
  }

  _compileWheres() {
    if (this._wheres.length === 0) {
      return { sql: '', bindings: [] };
    }
    let sql = '';
    const bindings = [];
    this._wheres.forEach((w, idx) => {
      if (idx === 0) {
        sql += w.sql;
      } else {
        sql += ` ${w.boolean} ${w.sql}`;
      }
      bindings.push(...w.bindings);
    });
    return { sql, bindings };
  }

  toSql() {
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT ${this._select} FROM ${escTable}`;

    if (this._joins.length > 0) {
      sql += ` ${this._joins.join(' ')}`;
    }

    const { sql: whereSql } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    if (this._groupBy) {
      sql += ` ${this._groupBy}`;
    }

    if (this._having) {
      sql += ` ${this._having}`;
    }

    if (this._orders.length > 0) {
      sql += ` ORDER BY ${this._orders.join(', ')}`;
    }

    if (this._limit !== null) {
      sql += ` LIMIT ${this._limit}`;
      if (this._offset !== null) {
        sql += ` OFFSET ${this._offset}`;
      }
    }

    return sql;
  }

  toRawSql() {
    let sql = this.toSql();
    const bindings = this.getBindings();
    bindings.forEach(val => {
      const formatted = typeof val === 'string' ? `'${val.replace(/'/g, "\\'")}'` : val;
      sql = sql.replace('?', formatted);
    });
    return sql;
  }

  getBindings() {
    const { bindings } = this._compileWheres();
    return [...bindings, ...this._havingBindings];
  }

  async _query(sql, bindings = []) {
    const executor = this._connection || pool;
    const start = Date.now();
    try {
      const [rows] = await executor.query(sql, bindings);
      const duration = Date.now() - start;
      auditQueryPerformance(sql, bindings, duration);
      return rows;
    } catch (err) {
      const duration = Date.now() - start;
      auditQueryPerformance(sql, bindings, duration);
      throw err;
    }
  }

  async get() {
    const sql = this.toSql();
    const bindings = this.getBindings();
    return await this._query(sql, bindings);
  }

  async first() {
    this.limit(1);
    const sql = this.toSql();
    const bindings = this.getBindings();
    const rows = await this._query(sql, bindings);
    return rows.length > 0 ? rows[0] : null;
  }

  async find(id, primaryKey = 'id') {
    return await this.where(primaryKey, id).first();
  }

  async exists() {
    this.limit(1);
    const sql = this.toSql();
    const bindings = this.getBindings();
    const rows = await this._query(sql, bindings);
    return rows.length > 0;
  }

  async doesntExist() {
    const exists = await this.exists();
    return !exists;
  }

  async pluck(column, key = null) {
    this.select(key ? [column, key] : [column]);
    const rows = await this.get();
    if (key) {
      const result = {};
      rows.forEach(r => { result[r[key]] = r[column]; });
      return result;
    }
    return rows.map(r => r[column]);
  }

  /**
   * Enterprise Pagination
   * Returns data array and full pagination metadata
   */
  async paginate(page = 1, perPage = 15) {
    page = Math.max(1, parseInt(page) || 1);
    perPage = Math.max(1, parseInt(perPage) || 15);

    // Count total rows matching criteria
    const total = await this.count();

    const offset = (page - 1) * perPage;
    this.offset(offset).limit(perPage);
    const data = await this.get();

    const lastPage = Math.ceil(total / perPage) || 1;

    return {
      data,
      pagination: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: lastPage,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + perPage, total),
        has_more: page < lastPage,
        has_previous: page > 1
      }
    };
  }

  /**
   * Chunk records in memory-safe batches
   */
  async chunk(size, callback) {
    let page = 1;
    let keepGoing = true;
    while (keepGoing) {
      const clone = new QueryBuilder(this._table, this._connection);
      clone._wheres = [...this._wheres];
      clone._joins = [...this._joins];
      clone._orders = [...this._orders];
      clone._select = this._select;
      clone.offset((page - 1) * size).limit(size);

      const records = await clone.get();
      if (!records || records.length === 0) break;

      const res = await callback(records, page);
      if (res === false) {
        keepGoing = false;
        break;
      }
      if (records.length < size) break;
      page++;
    }
  }

  async insert(data) {
    const keys = Object.keys(data);
    const escapedKeys = keys.map(k => `\`${k}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${this._table}\` (${escapedKeys}) VALUES (${placeholders})`;
    const values = Object.values(data);

    const executor = this._connection || pool;
    const start = Date.now();
    const [result] = await executor.query(sql, values);
    auditQueryPerformance(sql, values, Date.now() - start);
    return result.insertId;
  }

  async update(data) {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
    let sql = `UPDATE \`${this._table}\` SET ${setClause}`;
    const values = Object.values(data);

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    const executor = this._connection || pool;
    const start = Date.now();
    const [result] = await executor.query(sql, [...values, ...whereBindings]);
    auditQueryPerformance(sql, [...values, ...whereBindings], Date.now() - start);
    return result.affectedRows;
  }

  async delete() {
    let sql = `DELETE FROM \`${this._table}\``;

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    const executor = this._connection || pool;
    const start = Date.now();
    const [result] = await executor.query(sql, whereBindings);
    auditQueryPerformance(sql, whereBindings, Date.now() - start);
    return result.affectedRows;
  }

  async count() {
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT COUNT(*) AS total FROM ${escTable}`;

    if (this._joins.length > 0) {
      sql += ` ${this._joins.join(' ')}`;
    }

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    const rows = await this._query(sql, whereBindings);
    return rows[0] ? Number(rows[0].total) : 0;
  }

  async sum(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT SUM(${colName}) AS aggregate FROM ${escTable}`;

    if (this._joins.length > 0) {
      sql += ` ${this._joins.join(' ')}`;
    }

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    const rows = await this._query(sql, whereBindings);
    return rows[0] ? Number(rows[0].aggregate || 0) : 0;
  }

  async avg(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT AVG(${colName}) AS aggregate FROM ${escTable}`;

    if (this._joins.length > 0) {
      sql += ` ${this._joins.join(' ')}`;
    }

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    }

    const rows = await this._query(sql, whereBindings);
    return rows[0] ? Number(rows[0].aggregate || 0) : 0;
  }

  async min(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT MIN(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async max(column) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT MAX(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async increment(column, amount = 1) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    let sql = `UPDATE \`${this._table}\` SET ${colName} = ${colName} + ?`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;

    const executor = this._connection || pool;
    const start = Date.now();
    const [result] = await executor.query(sql, [amount, ...whereBindings]);
    auditQueryPerformance(sql, [amount, ...whereBindings], Date.now() - start);
    return result.affectedRows;
  }

  async decrement(column, amount = 1) {
    const colName = column.includes('.') ? column.split('.').map(c => `\`${c}\``).join('.') : `\`${column}\``;
    let sql = `UPDATE \`${this._table}\` SET ${colName} = ${colName} - ?`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;

    const executor = this._connection || pool;
    const start = Date.now();
    const [result] = await executor.query(sql, [amount, ...whereBindings]);
    auditQueryPerformance(sql, [amount, ...whereBindings], Date.now() - start);
    return result.affectedRows;
  }
}

/**
 * Main Database Core Wrapper
 */
const DB = {
  pool,
  config: dbConfig,
  ensureDatabaseExists,
  query: async (sql, params = []) => {
    const start = Date.now();
    const [rows] = await pool.query(sql, params);
    auditQueryPerformance(sql, params, Date.now() - start);
    return rows;
  },
  getConnection: async () => {
    return await pool.getConnection();
  },
  table: (name, connection = null) => {
    return new QueryBuilder(name, connection);
  },
  raw: (sql) => {
    return { raw: sql };
  },
  beginTransaction: async () => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  },
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const transactionDB = {
        pool: connection,
        query: async (sql, params = []) => {
          const start = Date.now();
          const res = await connection.query(sql, params);
          auditQueryPerformance(sql, params, Date.now() - start);
          return Array.isArray(res) ? res[0] : res;
        },
        table: (name) => {
          return new QueryBuilder(name, connection);
        }
      };

      const result = await callback(transactionDB);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = DB;
