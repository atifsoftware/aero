const mysql = require('mysql2/promise');
let PgPool = null;
try {
  const pg = require('pg');
  PgPool = pg.Pool;
} catch (e) {
  // pg will be loaded when required
}
require('dotenv').config();

// Resolve Logger lazily to prevent circular dependencies
let _logger = null;
function getLogger() {
  if (!_logger) {
    try {
      _logger = require('../core/Logger');
    } catch {
      _logger = null;
    }
  }
  return _logger;
}

/**
 * Parse Database Configuration from environment
 * Supports both DATABASE_URL and individual DB_* variables
 * Auto-detects database type (mysql or postgresql)
 */
function resolveDbConfig() {
  let dbType = 'mysql'; // default
  
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      if (parsedUrl.protocol === 'postgresql:' || parsedUrl.protocol === 'postgres:') {
        dbType = 'postgresql';
      }
      
      if (dbType === 'postgresql') {
        return {
          type: 'postgresql',
          host: parsedUrl.hostname || 'localhost',
          port: parseInt(parsedUrl.port) || 5432,
          user: decodeURIComponent(parsedUrl.username || 'postgres'),
          password: decodeURIComponent(parsedUrl.password || ''),
          database: (parsedUrl.pathname || '').replace(/^\//, '') || 'aero_db',
        };
      } else {
        return {
          type: 'mysql',
          host: parsedUrl.hostname || 'localhost',
          port: parseInt(parsedUrl.port) || 3306,
          user: decodeURIComponent(parsedUrl.username || 'root'),
          password: decodeURIComponent(parsedUrl.password || ''),
          database: (parsedUrl.pathname || '').replace(/^\//, '') || 'aero_db',
        };
      }
    } catch (e) {
      console.warn('[DB] Failed to parse DATABASE_URL, falling back to discrete DB_* env vars.');
    }
  }

  // Check for explicit DB_TYPE or auto-detect from port
  if (process.env.DB_TYPE) {
    dbType = process.env.DB_TYPE.toLowerCase();
  } else if (process.env.DB_PORT && parseInt(process.env.DB_PORT) === 5432) {
    dbType = 'postgresql';
  }

  if (dbType === 'postgresql') {
    return {
      type: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'aero_db',
    };
  }

  return {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'aero_db',
  };
}

const dbConfig = resolveDbConfig();
const slowQueryThresholdMs = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 100;

// Create connection pool based on database type
let pool;
if (dbConfig.type === 'postgresql') {
  if (!PgPool) {
    PgPool = require('pg').Pool;
  }
  pool = new PgPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  pool.on('error', (err) => {
    const logger = getLogger();
    if (logger && typeof logger.error === 'function') {
      logger.error(`[PostgreSQL Pool Error] ${err.message}`);
    } else {
      console.error(`[PostgreSQL Pool Error] ${err.message}`);
    }
  });
} else {
  pool = mysql.createPool({
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
}

// Flag to track whether database auto-creation check was executed
let dbChecked = false;

/**
 * Ensure database exists on the target MySQL server.
 * Automatically runs CREATE DATABASE IF NOT EXISTS if needed for MySQL.
 */
async function ensureDatabaseExists() {
  if (dbChecked) return;
  if (dbConfig.type === 'postgresql') {
    dbChecked = true;
    return;
  }

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
 * Supports MySQL & PostgreSQL with Enterprise Security Hardening
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
    this._allowMassDelete = false;
    this._allowMassUpdate = false;
    this._dbType = dbConfig.type;
  }

  /**
   * Escape SQL identifiers based on database dialect
   */
  _escapeIdentifier(identifier) {
    if (!identifier) return '';
    if (this._dbType === 'postgresql') {
      return `"${identifier.replace(/"/g, '""')}"`;
    }
    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  /**
   * Explicitly allow mass deletion without a WHERE clause
   */
  allowMassDelete() {
    this._allowMassDelete = true;
    return this;
  }

  /**
   * Explicitly allow mass update without a WHERE clause
   */
  allowMassUpdate() {
    this._allowMassUpdate = true;
    return this;
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
      alias = ` AS ${this._escapeIdentifier(parts[1].trim())}`;
    }
    const escTable = tableName.includes('.') 
      ? tableName.split('.').map(t => this._escapeIdentifier(t)).join('.') 
      : this._escapeIdentifier(tableName);
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

    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
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

    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('OR', `${colName} ${operator} ?`, [value]);
    return this;
  }

  whereIn(column, values) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => '?').join(', ');
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} IN (${placeholders})`, values);
    return this;
  }

  whereNotIn(column, values) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => '?').join(', ');
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} NOT IN (${placeholders})`, values);
    return this;
  }

  whereNull(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} IS NULL`, []);
    return this;
  }

  whereNotNull(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} IS NOT NULL`, []);
    return this;
  }

  whereBetween(column, range) {
    if (!Array.isArray(range) || range.length !== 2) return this;
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} BETWEEN ? AND ?`, range);
    return this;
  }

  whereNotBetween(column, range) {
    if (!Array.isArray(range) || range.length !== 2) return this;
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._addWhere('AND', `${colName} NOT BETWEEN ? AND ?`, range);
    return this;
  }

  whereLike(column, value) {
    return this.where(column, 'LIKE', value);
  }

  orWhereLike(column, value) {
    return this.orWhere(column, 'LIKE', value);
  }

  /**
   * Add a raw WHERE clause with parameterized bindings.
   */
  whereRaw(sql, bindings = []) {
    this._addWhere('AND', sql, bindings);
    return this;
  }

  /**
   * Add a raw OR WHERE clause with parameterized bindings.
   */
  orWhereRaw(sql, bindings = []) {
    this._addWhere('OR', sql, bindings);
    return this;
  }

  join(table, first, operator, second, type = 'INNER') {
    const escTable = this._parseTableName(table);
    if (operator === undefined && second === undefined) {
      this._joins.push(`${type} JOIN ${escTable} ON ${first}`);
    } else {
      const escFirst = first.includes('.') 
        ? first.split('.').map(c => this._escapeIdentifier(c)).join('.') 
        : this._escapeIdentifier(first);
      const escSecond = second.includes('.') 
        ? second.split('.').map(c => this._escapeIdentifier(c)).join('.') 
        : this._escapeIdentifier(second);
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
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._groupBy = `GROUP BY ${colName}`;
    return this;
  }

  having(column, operator, value) {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._having = `HAVING ${colName} ${operator} ?`;
    this._havingBindings = [value];
    return this;
  }

  orderBy(column, direction = 'ASC') {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    this._orders.push(`${colName} ${direction.toUpperCase()}`);
    return this;
  }

  latest(column = 'created_at') {
    return this.orderBy(column, 'DESC');
  }

  oldest(column = 'created_at') {
    return this.orderBy(column, 'ASC');
  }

  limit(number) {
    this._limit = parseInt(number);
    return this;
  }

  offset(number) {
    this._offset = parseInt(number);
    return this;
  }

  take(number) {
    return this.limit(number);
  }

  skip(number) {
    return this.offset(number);
  }

  _compileWheres() {
    if (this._wheres.length === 0) {
      return { sql: '', bindings: [] };
    }

    let sql = '';
    const bindings = [];

    this._wheres.forEach((w, index) => {
      if (index === 0) {
        sql += w.sql;
      } else {
        sql += ` ${w.boolean} ${w.sql}`;
      }
      if (w.bindings && w.bindings.length > 0) {
        bindings.push(...w.bindings);
      }
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
    }

    if (this._offset !== null) {
      sql += ` OFFSET ${this._offset}`;
    }

    return sql;
  }

  toRawSql() {
    let sql = this.toSql();
    const bindings = this.getBindings();
    bindings.forEach(val => {
      let formatted;
      if (val === null || val === undefined) {
        formatted = 'NULL';
      } else if (typeof val === 'number') {
        formatted = String(val);
      } else if (typeof val === 'boolean') {
        formatted = val ? '1' : '0';
      } else if (val instanceof Date) {
        formatted = `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
      } else {
        const escaped = String(val)
          .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
            switch (char) {
              case '\0': return '\\0';
              case '\x08': return '\\b';
              case '\x09': return '\\t';
              case '\x1a': return '\\z';
              case '\n': return '\\n';
              case '\r': return '\\r';
              case '"':
              case "'":
              case '\\':
              case '%':
                return '\\' + char;
              default:
                return char;
            }
          });
        formatted = `'${escaped}'`;
      }
      sql = sql.replace('?', () => formatted);
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
      let result;
      if (this._dbType === 'postgresql') {
        let paramIndex = 0;
        const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
        const pgResult = await executor.query(formattedSql, bindings);
        result = pgResult.rows;
      } else {
        const [rows] = await executor.query(sql, bindings);
        result = rows;
      }
      const duration = Date.now() - start;
      auditQueryPerformance(sql, bindings, duration);
      return result;
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

  async paginate(page = 1, perPage = 15) {
    page = Math.max(1, parseInt(page) || 1);
    perPage = Math.max(1, parseInt(perPage) || 15);

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
    const isPg = this._dbType === 'postgresql';
    const escapedKeys = keys.map(k => this._escapeIdentifier(k)).join(', ');
    const placeholders = keys.map((_, i) => isPg ? `$${i + 1}` : '?').join(', ');
    const tableEscaped = this._escapeIdentifier(this._table);
    let sql = `INSERT INTO ${tableEscaped} (${escapedKeys}) VALUES (${placeholders})`;
    if (isPg) {
      sql += ' RETURNING id';
    }
    const values = Object.values(data);

    const executor = this._connection || pool;
    const start = Date.now();
    let insertId;

    if (isPg) {
      const pgResult = await executor.query(sql, values);
      insertId = pgResult.rows[0]?.id;
    } else {
      const [mysqlResult] = await executor.query(sql, values);
      insertId = mysqlResult.insertId;
    }
    auditQueryPerformance(sql, values, Date.now() - start);
    return insertId;
  }

  async update(data) {
    const keys = Object.keys(data);
    const isPg = this._dbType === 'postgresql';
    const assignments = keys.map(k => `${this._escapeIdentifier(k)} = ?`).join(', ');
    const tableEscaped = this._escapeIdentifier(this._table);
    let sql = `UPDATE ${tableEscaped} SET ${assignments}`;
    const values = Object.values(data);

    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    } else if (!this._allowMassUpdate) {
      throw new Error(`Unsafe SQL operation: update() requires at least one WHERE condition to prevent accidental mass table updates. Call allowMassUpdate() if this was intentional.`);
    }

    const allBindings = [...values, ...whereBindings];
    const executor = this._connection || pool;
    const start = Date.now();
    let affectedRows;

    if (isPg) {
      let paramIndex = 0;
      const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
      const pgResult = await executor.query(formattedSql, allBindings);
      affectedRows = pgResult.rowCount;
    } else {
      const [result] = await executor.query(sql, allBindings);
      affectedRows = result.affectedRows;
    }
    auditQueryPerformance(sql, allBindings, Date.now() - start);
    return affectedRows;
  }

  async delete() {
    const tableEscaped = this._escapeIdentifier(this._table);
    let sql = `DELETE FROM ${tableEscaped}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    } else if (!this._allowMassDelete) {
      throw new Error(`Unsafe SQL operation: delete() requires at least one WHERE condition to prevent accidental table truncation. Call allowMassDelete() or truncate() if this was intentional.`);
    }

    const executor = this._connection || pool;
    const start = Date.now();
    let affectedRows;

    if (this._dbType === 'postgresql') {
      let paramIndex = 0;
      const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
      const pgResult = await executor.query(formattedSql, whereBindings);
      affectedRows = pgResult.rowCount;
    } else {
      const [result] = await executor.query(sql, whereBindings);
      affectedRows = result.affectedRows;
    }
    auditQueryPerformance(sql, whereBindings, Date.now() - start);
    return affectedRows;
  }

  async truncate() {
    const tableEscaped = this._escapeIdentifier(this._table);
    const sql = `TRUNCATE TABLE ${tableEscaped}`;
    const executor = this._connection || pool;
    const start = Date.now();
    let result;
    if (this._dbType === 'postgresql') {
      result = await executor.query(sql);
    } else {
      const [mysqlRes] = await executor.query(sql);
      result = mysqlRes;
    }
    auditQueryPerformance(sql, [], Date.now() - start);
    return result;
  }

  async count() {
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT COUNT(*) AS total FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? parseInt(rows[0].total) : 0;
  }

  async sum(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT SUM(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async avg(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT AVG(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async min(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT MIN(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async max(column) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const escTable = this._parseTableName(this._table);
    let sql = `SELECT MAX(${colName}) AS aggregate FROM ${escTable}`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;
    const rows = await this._query(sql, whereBindings);
    return rows[0] ? rows[0].aggregate : null;
  }

  async increment(column, amount = 1) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const tableEscaped = this._escapeIdentifier(this._table);
    let sql = `UPDATE ${tableEscaped} SET ${colName} = ${colName} + ?`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;

    const executor = this._connection || pool;
    const start = Date.now();
    let affectedRows;
    if (this._dbType === 'postgresql') {
      let paramIndex = 0;
      const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
      const pgResult = await executor.query(formattedSql, [amount, ...whereBindings]);
      affectedRows = pgResult.rowCount;
    } else {
      const [result] = await executor.query(sql, [amount, ...whereBindings]);
      affectedRows = result.affectedRows;
    }
    auditQueryPerformance(sql, [amount, ...whereBindings], Date.now() - start);
    return affectedRows;
  }

  async decrement(column, amount = 1) {
    const colName = column.includes('.') 
      ? column.split('.').map(c => this._escapeIdentifier(c)).join('.') 
      : this._escapeIdentifier(column);
    const tableEscaped = this._escapeIdentifier(this._table);
    let sql = `UPDATE ${tableEscaped} SET ${colName} = ${colName} - ?`;
    const { sql: whereSql, bindings: whereBindings } = this._compileWheres();
    if (whereSql) sql += ` WHERE ${whereSql}`;

    const executor = this._connection || pool;
    const start = Date.now();
    let affectedRows;
    if (this._dbType === 'postgresql') {
      let paramIndex = 0;
      const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
      const pgResult = await executor.query(formattedSql, [amount, ...whereBindings]);
      affectedRows = pgResult.rowCount;
    } else {
      const [result] = await executor.query(sql, [amount, ...whereBindings]);
      affectedRows = result.affectedRows;
    }
    auditQueryPerformance(sql, [amount, ...whereBindings], Date.now() - start);
    return affectedRows;
  }
}

let _knexInstance = null;

/**
 * Main Database Core Wrapper
 */
const DB = {
  pool,
  config: dbConfig,
  ensureDatabaseExists,
  getKnex: () => {
    if (!_knexInstance) {
      const knex = require('knex');
      const isPg = dbConfig.type === 'postgresql';
      _knexInstance = knex({
        client: isPg ? 'pg' : 'mysql2',
        connection: {
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.database,
        },
        pool: { min: 2, max: 10 }
      });
    }
    return _knexInstance;
  },
  query: async (sql, params = []) => {
    const start = Date.now();
    let rows;
    if (dbConfig.type === 'postgresql') {
      let paramIndex = 0;
      const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
      const res = await pool.query(formattedSql, params);
      rows = res.rows;
    } else {
      const [mysqlRows] = await pool.query(sql, params);
      rows = mysqlRows;
    }
    auditQueryPerformance(sql, params, Date.now() - start);
    return rows;
  },
  getConnection: async () => {
    if (dbConfig.type === 'postgresql') {
      return await pool.connect();
    }
    return await pool.getConnection();
  },
  table: (name, connection = null) => {
    return new QueryBuilder(name, connection);
  },
  raw: (sql) => {
    return { raw: sql };
  },
  beginTransaction: async () => {
    if (dbConfig.type === 'postgresql') {
      const client = await pool.connect();
      await client.query('BEGIN');
      return client;
    }
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  },
  transaction: async (callback) => {
    const isPg = dbConfig.type === 'postgresql';
    const connection = await (isPg ? pool.connect() : pool.getConnection());
    try {
      if (isPg) {
        await connection.query('BEGIN');
      } else {
        await connection.beginTransaction();
      }

      const transactionDB = {
        pool: connection,
        query: async (sql, params = []) => {
          const start = Date.now();
          let res;
          if (isPg) {
            let paramIndex = 0;
            const formattedSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
            const pgRes = await connection.query(formattedSql, params);
            res = pgRes.rows;
          } else {
            const mysqlRes = await connection.query(sql, params);
            res = Array.isArray(mysqlRes) ? mysqlRes[0] : mysqlRes;
          }
          auditQueryPerformance(sql, params, Date.now() - start);
          return res;
        },
        table: (name) => {
          return new QueryBuilder(name, connection);
        }
      };

      const result = await callback(transactionDB);
      if (isPg) {
        await connection.query('COMMIT');
      } else {
        await connection.commit();
      }
      return result;
    } catch (err) {
      if (isPg) {
        await connection.query('ROLLBACK');
      } else {
        await connection.rollback();
      }
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = DB;
