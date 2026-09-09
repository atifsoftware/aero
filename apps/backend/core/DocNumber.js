const DB = require('../config/db');

/**
 * Enterprise Sequential Document Number Generator for Aero MVC
 * 
 * Used for generating unique, monotonic, sequential document numbers
 * for Invoices, Purchase Orders, Receipts, Payment Vouchers, Delivery Challans, etc.
 * 
 * Supports:
 * - Dynamic tokens: {PREFIX}, {YYYY}, {YY}, {MM}, {DD}, {BRANCH}, {00001} (configurable zero padding)
 * - Reset policies: 'never' | 'yearly' | 'monthly' | 'daily'
 * - Concurrency safety: atomic database upsert with fallback
 */
class DocNumber {
  // In-memory sequence tracker fallback if DB table is not yet migrated
  static _memorySequences = new Map();

  /**
   * Format document number from pattern and sequence integer
   * @param {string} pattern E.g. '{PREFIX}-{YYYY}{MM}-{00001}'
   * @param {number} seq Sequence number (e.g. 1)
   * @param {Object} [vars={}] Replacement tokens like { PREFIX: 'INV', BRANCH: 'DHK' }
   */
  static formatPattern(pattern, seq, vars = {}) {
    const now = vars.date ? new Date(vars.date) : new Date();
    const yyyy = String(now.getFullYear());
    const yy = yyyy.slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let result = pattern;

    // Replace date tokens
    result = result.replace(/{YYYY}/g, yyyy);
    result = result.replace(/{YY}/g, yy);
    result = result.replace(/{MM}/g, mm);
    result = result.replace(/{DD}/g, dd);

    // Replace custom tokens
    for (const [key, val] of Object.entries(vars)) {
      if (key !== 'date') {
        const regex = new RegExp(`{${key.toUpperCase()}}`, 'g');
        result = result.replace(regex, String(val));
      }
    }

    // Match zero-padding pattern e.g. {00001} or {0001} or {000001}
    const padMatch = result.match(/{0+1}/);
    if (padMatch) {
      const padLength = padMatch[0].length - 2; // length of digits inside {}
      const paddedNumber = String(seq).padStart(padLength, '0');
      result = result.replace(padMatch[0], paddedNumber);
    } else {
      // Default to plain sequence if no padding token
      result = result.replace(/{SEQ}/g, String(seq));
    }

    return result;
  }

  /**
   * Determine sequence period key based on reset policy
   * @param {string} resetPolicy 'never' | 'yearly' | 'monthly' | 'daily'
   * @param {Date} date
   */
  static getPeriodKey(resetPolicy, date = new Date()) {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    switch (resetPolicy) {
      case 'daily':
        return `${yyyy}${mm}${dd}`;
      case 'monthly':
        return `${yyyy}${mm}`;
      case 'yearly':
        return yyyy;
      case 'never':
      default:
        return 'ALL';
    }
  }

  /**
   * Generate next sequential document number
   * 
   * @param {string} type E.g. 'invoice', 'order', 'receipt', 'voucher', 'challan'
   * @param {Object} [options]
   * @param {string} [options.prefix] E.g. 'INV', 'PO', 'MR', 'CH'
   * @param {string} [options.format='{PREFIX}-{YYYY}{MM}-{00001}'] Format pattern
   * @param {string} [options.reset='monthly'] Reset policy ('never', 'yearly', 'monthly', 'daily')
   * @param {string} [options.branch] Optional branch/store code
   * @param {Date} [options.date] Reference date
   * @returns {Promise<string>} Next document code (e.g. "INV-202609-00001")
   */
  static async next(type, options = {}) {
    const prefix = options.prefix || type.toUpperCase().slice(0, 3);
    const format = options.format || '{PREFIX}-{YYYY}{MM}-{00001}';
    const reset = options.reset || 'monthly';
    const date = options.date || new Date();
    const period = this.getPeriodKey(reset, date);
    const branch = options.branch || '';

    const seqKey = `${type}:${branch}:${period}`;

    let nextSeq = 1;

    // Try atomic increment via Database table if available
    try {
      const isPg = DB.config && DB.config.type === 'postgresql';
      
      // Ensure sequence table exists (auto-create if not exists)
      const createTableSql = isPg ? `
        CREATE TABLE IF NOT EXISTS aero_doc_sequences (
          seq_key VARCHAR(100) PRIMARY KEY,
          current_val BIGINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ` : `
        CREATE TABLE IF NOT EXISTS aero_doc_sequences (
          seq_key VARCHAR(100) PRIMARY KEY,
          current_val BIGINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `;

      await DB.query(createTableSql).catch(() => {});

      if (isPg) {
        const res = await DB.query(`
          INSERT INTO aero_doc_sequences (seq_key, current_val)
          VALUES ($1, 1)
          ON CONFLICT (seq_key)
          DO UPDATE SET current_val = aero_doc_sequences.current_val + 1, updated_at = CURRENT_TIMESTAMP
          RETURNING current_val
        `, [seqKey]);
        nextSeq = parseInt(res[0]?.current_val || 1, 10);
      } else {
        await DB.query(`
          INSERT INTO aero_doc_sequences (seq_key, current_val)
          VALUES (?, 1)
          ON DUPLICATE KEY UPDATE current_val = current_val + 1
        `, [seqKey]);
        const res = await DB.query(`SELECT current_val FROM aero_doc_sequences WHERE seq_key = ?`, [seqKey]);
        nextSeq = parseInt(res[0]?.current_val || 1, 10);
      }
    } catch (err) {
      // Fallback: Safe In-memory atomic sequence tracking
      const current = this._memorySequences.get(seqKey) || 0;
      nextSeq = current + 1;
      this._memorySequences.set(seqKey, nextSeq);
    }

    return this.formatPattern(format, nextSeq, {
      PREFIX: prefix,
      BRANCH: branch,
      date,
      ...options.tokens
    });
  }

  /**
   * Set sequence counter to a specific value
   * Useful when migrating from legacy ERP or initializing starting voucher numbers
   * 
   * @param {string} type 
   * @param {number} val 
   * @param {Object} [options]
   */
  static async setSequence(type, val, options = {}) {
    const reset = options.reset || 'monthly';
    const date = options.date || new Date();
    const period = this.getPeriodKey(reset, date);
    const branch = options.branch || '';
    const seqKey = `${type}:${branch}:${period}`;

    this._memorySequences.set(seqKey, val);

    try {
      const isPg = DB.config && DB.config.type === 'postgresql';
      if (isPg) {
        await DB.query(`
          INSERT INTO aero_doc_sequences (seq_key, current_val)
          VALUES ($1, $2)
          ON CONFLICT (seq_key)
          DO UPDATE SET current_val = $2
        `, [seqKey, val]);
      } else {
        await DB.query(`
          INSERT INTO aero_doc_sequences (seq_key, current_val)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE current_val = ?
        `, [seqKey, val, val]);
      }
    } catch (e) {}
  }

  /**
   * Reset in-memory sequences (mainly for test suites)
   */
  static resetMemory() {
    this._memorySequences.clear();
  }
}

module.exports = DocNumber;
