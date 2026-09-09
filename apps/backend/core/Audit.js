const DB = require('../config/db');
const Logger = require('./Logger');

/**
 * Enterprise Audit Trail & Compliance Logger for Aero MVC
 * 
 * Tracks all state changes across models, financial transactions,
 * order status transitions, and user actions.
 */
class Audit {
  static _memoryLogs = [];

  /**
   * Calculate field diff between old and new state
   * @param {Object} oldData 
   * @param {Object} newData 
   * @returns {{ oldValues: Object, newValues: Object }}
   */
  static diff(oldData = {}, newData = {}) {
    const oldValues = {};
    const newValues = {};

    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    // Ignore internal timestamp / tracking fields
    const ignoreFields = ['created_at', 'updated_at', 'deleted_at'];

    for (const key of allKeys) {
      if (ignoreFields.includes(key)) continue;

      const oldVal = oldData ? oldData[key] : undefined;
      const newVal = newData ? newData[key] : undefined;

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        if (oldVal !== undefined) oldValues[key] = oldVal;
        if (newVal !== undefined) newValues[key] = newVal;
      }
    }

    return { oldValues, newValues };
  }

  /**
   * Record an audit trail log
   * @param {Object} entry
   * @param {number|string} [entry.userId] ID of user making the change
   * @param {'CREATE'|'UPDATE'|'DELETE'|'LOGIN'|'EXPORT'|'STATUS_CHANGE'} entry.action Action performed
   * @param {string} entry.auditableType Entity name (e.g. 'Order', 'Product', 'Invoice')
   * @param {number|string} [entry.auditableId] Primary key of the entity
   * @param {Object} [entry.oldValues] Previous state
   * @param {Object} [entry.newValues] New state
   * @param {string} [entry.ip] Client IP address
   * @param {string} [entry.userAgent] Client User Agent
   */
  static async log(entry = {}) {
    const auditData = {
      user_id: entry.userId || entry.user_id || null,
      action: (entry.action || 'UPDATE').toUpperCase(),
      auditable_type: entry.auditableType || entry.auditable_type || 'System',
      auditable_id: entry.auditableId || entry.auditable_id || null,
      old_values: entry.oldValues || entry.old_values ? JSON.stringify(entry.oldValues || entry.old_values) : null,
      new_values: entry.newValues || entry.new_values ? JSON.stringify(entry.newValues || entry.new_values) : null,
      ip_address: entry.ip || entry.ip_address || null,
      user_agent: entry.userAgent || entry.user_agent || null,
      created_at: new Date()
    };

    try {
      const isPg = DB.config && DB.config.type === 'postgresql';
      
      const createTableSql = isPg ? `
        CREATE TABLE IF NOT EXISTS aero_audit_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(50),
          action VARCHAR(50) NOT NULL,
          auditable_type VARCHAR(100) NOT NULL,
          auditable_id VARCHAR(100),
          old_values JSONB,
          new_values JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ` : `
        CREATE TABLE IF NOT EXISTS aero_audit_logs (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(50),
          action VARCHAR(50) NOT NULL,
          auditable_type VARCHAR(100) NOT NULL,
          auditable_id VARCHAR(100),
          old_values JSON,
          new_values JSON,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `;

      await DB.query(createTableSql).catch(() => {});

      if (isPg) {
        await DB.query(`
          INSERT INTO aero_audit_logs (user_id, action, auditable_type, auditable_id, old_values, new_values, ip_address, user_agent, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          auditData.user_id,
          auditData.action,
          auditData.auditable_type,
          auditData.auditable_id,
          auditData.old_values,
          auditData.new_values,
          auditData.ip_address,
          auditData.user_agent,
          auditData.created_at
        ]);
      } else {
        await DB.query(`
          INSERT INTO aero_audit_logs (user_id, action, auditable_type, auditable_id, old_values, new_values, ip_address, user_agent, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          auditData.user_id,
          auditData.action,
          auditData.auditable_type,
          auditData.auditable_id,
          auditData.old_values,
          auditData.new_values,
          auditData.ip_address,
          auditData.user_agent,
          auditData.created_at
        ]);
      }
    } catch (err) {
      // In-memory fallback
      this._memoryLogs.push(auditData);
      Logger.info(`[Audit] ${auditData.action} on ${auditData.auditable_type}:${auditData.auditable_id}`);
    }

    return auditData;
  }

  /**
   * Get audit trail for a specific model instance
   * @param {string} auditableType Model name
   * @param {number|string} auditableId Model PK
   */
  static async getTrail(auditableType, auditableId) {
    try {
      const isPg = DB.config && DB.config.type === 'postgresql';
      const sql = isPg 
        ? `SELECT * FROM aero_audit_logs WHERE auditable_type = $1 AND auditable_id = $2 ORDER BY id DESC`
        : `SELECT * FROM aero_audit_logs WHERE auditable_type = ? AND auditable_id = ? ORDER BY id DESC`;
      
      const rows = await DB.query(sql, [auditableType, String(auditableId)]);
      return rows.map(r => ({
        ...r,
        old_values: typeof r.old_values === 'string' ? JSON.parse(r.old_values) : r.old_values,
        new_values: typeof r.new_values === 'string' ? JSON.parse(r.new_values) : r.new_values
      }));
    } catch (err) {
      return this._memoryLogs.filter(
        l => l.auditable_type === auditableType && String(l.auditable_id) === String(auditableId)
      );
    }
  }

  /**
   * Clear in-memory logs (for test teardowns)
   */
  static resetMemory() {
    this._memoryLogs = [];
  }
}

module.exports = Audit;
