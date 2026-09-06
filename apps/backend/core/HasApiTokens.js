// @ts-check
const DB = require('../config/db');
const crypto = require('crypto');

/**
 * @typedef {Object} TokenResult
 * @property {string} plainTextToken The secret bearer token sent to client
 * @property {string} token Hashed token stored in database
 * @property {string|null} expires_at Expiration ISO timestamp string
 * @property {string} created_at Creation ISO timestamp string
 * @property {string[]} abilities Array of token permission scopes
 */

/**
 * Personal Access Token Manager for NodeFlow
 * Models Laravel Sanctum / OmniFlow PAT token workflows with strict expiration,
 * refresh lifecycle, and auto schema migration.
 */
class HasApiTokens {
  static table = 'personal_access_tokens';
  static schemaChecked = false;

  /**
   * Ensure table has required columns (expires_at, last_used_at)
   */
  static async ensureSchema() {
    if (this.schemaChecked) return;
    try {
      const columns = await DB.query(`SHOW COLUMNS FROM \`${this.table}\``);
      const colNames = columns.map(c => c.Field);

      if (!colNames.includes('expires_at')) {
        await DB.query(`ALTER TABLE \`${this.table}\` ADD COLUMN \`expires_at\` DATETIME NULL AFTER \`abilities\``);
      }
      if (!colNames.includes('last_used_at')) {
        await DB.query(`ALTER TABLE \`${this.table}\` ADD COLUMN \`last_used_at\` DATETIME NULL AFTER \`expires_at\``);
      }
      this.schemaChecked = true;
    } catch (e) {
      // If table doesn't exist yet or permissions are limited, mark checked to avoid tight retry loop
      this.schemaChecked = true;
    }
  }

  /**
   * Parse human-readable duration strings into milliseconds
   * @param {string|number|Date|null} duration e.g. '15m', '1h', '24h', '7d', '30d'
   * @returns {number|null} Duration in milliseconds, or null for indefinite
   */
  static parseDuration(duration) {
    if (!duration) return null;
    if (typeof duration === 'number') return duration;
    if (duration instanceof Date) {
      const diff = duration.getTime() - Date.now();
      return diff > 0 ? diff : 0;
    }
    if (typeof duration === 'string') {
      const match = duration.trim().match(/^(\d+)\s*(s|m|h|d|w|y)?$/i);
      if (!match) return null;
      const num = parseInt(match[1], 10);
      const unit = (match[2] || 'd').toLowerCase();
      switch (unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        case 'w': return num * 7 * 24 * 60 * 60 * 1000;
        case 'y': return num * 365 * 24 * 60 * 60 * 1000;
        default: return num * 24 * 60 * 60 * 1000;
      }
    }
    return null;
  }

  /**
   * Format JS Date to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
   * @param {Date} date
   * @returns {string}
   */
  static toSqlDateTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Generate and store a new personal access token with configurable expiration
   * @param {any} userInstance User model instance
   * @param {string} name Token identifier name (e.g. 'Mobile App Access')
   * @param {string[]} [abilities=['*']] Permitted permission scopes
   * @param {string|number|Date} [expiresIn='30d'] Token expiration duration
   * @returns {Promise<TokenResult>}
   */
  static async createToken(userInstance, name, abilities = ['*'], expiresIn = '30d') {
    await this.ensureSchema();

    const plainToken = 'aero_pat_' + crypto.randomBytes(30).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const now = new Date();
    const nowFormatted = this.toSqlDateTime(now);
    
    let expiresAtFormatted = null;
    const durationMs = this.parseDuration(expiresIn);
    if (durationMs !== null) {
      const expiresDate = new Date(now.getTime() + durationMs);
      expiresAtFormatted = this.toSqlDateTime(expiresDate);
    }

    const pk = userInstance.constructor?.primaryKey || 'id';
    const userId = typeof userInstance.get === 'function' ? userInstance.get(pk) : (userInstance[pk] || userInstance.id || userInstance.user_id);

    await DB.table(this.table).insert({
      tokenable_type: 'User',
      tokenable_id: userId,
      name,
      token: hashedToken,
      abilities: JSON.stringify(abilities),
      expires_at: expiresAtFormatted,
      created_at: nowFormatted,
      updated_at: nowFormatted
    });

    return {
      plainTextToken: plainToken,
      token: hashedToken,
      expires_at: expiresAtFormatted,
      created_at: nowFormatted,
      abilities
    };
  }

  /**
   * Refresh an existing unexpired token, invalidating the old one and issuing a fresh one
   * @param {any} userInstance
   * @param {string} plainOrHashedToken
   * @param {string|number} [expiresIn='30d']
   * @returns {Promise<TokenResult|null>}
   */
  static async refreshToken(userInstance, plainOrHashedToken, expiresIn = '30d') {
    await this.ensureSchema();

    const isPlain = plainOrHashedToken.startsWith('aero_pat_') || plainOrHashedToken.startsWith('nf_pat_');
    const hashed = isPlain
      ? crypto.createHash('sha256').update(plainOrHashedToken).digest('hex')
      : plainOrHashedToken;

    const pk = userInstance.constructor?.primaryKey || 'id';
    const userId = typeof userInstance.get === 'function' ? userInstance.get(pk) : (userInstance[pk] || userInstance.id || userInstance.user_id);

    const existing = await DB.table(this.table)
      .where('tokenable_id', userId)
      .where('token', hashed)
      .first();

    if (!existing) {
      return null;
    }

    // Check if old token is already expired
    if (existing.expires_at && new Date(existing.expires_at) <= new Date()) {
      return null;
    }

    // Revoke old token
    await DB.table(this.table).where('id', existing.id).delete();

    // Create fresh replacement token with same name and abilities
    let abilities = ['*'];
    try {
      abilities = JSON.parse(existing.abilities || '["*"]');
    } catch {}

    return await this.createToken(userInstance, existing.name, abilities, expiresIn);
  }

  /**
   * Get all active (unexpired) tokens for a user
   * @param {any} userInstance
   */
  static async tokens(userInstance) {
    await this.ensureSchema();
    const pk = userInstance.constructor?.primaryKey || 'id';
    const userId = typeof userInstance.get === 'function' ? userInstance.get(pk) : (userInstance[pk] || userInstance.id || userInstance.user_id);

    const tokens = await DB.table(this.table)
      .where('tokenable_id', userId)
      .get();

    const now = new Date();
    return tokens.map(t => ({
      ...t,
      is_expired: t.expires_at ? new Date(t.expires_at) <= now : false
    }));
  }

  /**
   * Revoke a token by ID or plain-text / hashed token
   * @param {any} userInstance
   * @param {number|string} idOrToken
   */
  static async revokeToken(userInstance, idOrToken) {
    await this.ensureSchema();
    const pk = userInstance.constructor?.primaryKey || 'id';
    const userId = typeof userInstance.get === 'function' ? userInstance.get(pk) : (userInstance[pk] || userInstance.id || userInstance.user_id);
    const q = DB.table(this.table).where('tokenable_id', userId);
    
    if (typeof idOrToken === 'number') {
      return await q.where('id', idOrToken).delete();
    } else {
      const isPlain = idOrToken.startsWith('aero_pat_') || idOrToken.startsWith('nf_pat_');
      const hashed = isPlain
        ? crypto.createHash('sha256').update(idOrToken).digest('hex')
        : idOrToken;
      return await q.where('token', hashed).delete();
    }
  }

  /**
   * Revoke all tokens for a user (e.g. after password reset)
   * @param {any} userInstance
   */
  static async revokeAllTokens(userInstance) {
    await this.ensureSchema();
    const pk = userInstance.constructor?.primaryKey || 'id';
    const userId = typeof userInstance.get === 'function' ? userInstance.get(pk) : (userInstance[pk] || userInstance.id || userInstance.user_id);
    return await DB.table(this.table).where('tokenable_id', userId).delete();
  }

  /**
   * Clean expired tokens from the database (Garbage collection utility)
   * @returns {Promise<number>} Number of pruned tokens
   */
  static async cleanExpiredTokens() {
    await this.ensureSchema();
    const nowFormatted = this.toSqlDateTime(new Date());
    const res = await DB.query(
      `DELETE FROM \`${this.table}\` WHERE \`expires_at\` IS NOT NULL AND \`expires_at\` < ?`,
      [nowFormatted]
    );
    return res?.affectedRows || 0;
  }
}

module.exports = HasApiTokens;
