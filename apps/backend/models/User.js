const Model = require('../core/Model');
const bcrypt = require('bcryptjs');

class User extends Model {
  /**
   * Database table name
   */
  static table = 'tbl_users';

  /**
   * Primary key name
   */
  static primaryKey = 'user_id';

  /**
   * Fields hidden from JSON output
   */
  static hidden = ['password'];

  /**
   * Find a user by their username
   * @param {string} username 
   * @returns {Promise<object|null>}
   */
  static async findByUsername(username) {
    return await this.query().where('username', username).first();
  }

  /**
   * Alias findByEmail to findByUsername for schema compatibility
   */
  static async findByEmail(email) {
    return await this.findByUsername(email);
  }

  /**
   * Find a user by their ID
   * @param {number} id 
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    return await this.query().where(this.primaryKey, id).first();
  }

  get(key) {
    if (key === 'id') return this._attributes.user_id !== undefined ? this._attributes.user_id : null;
    if (key === 'name') return this._attributes.full_name !== undefined ? this._attributes.full_name : null;
    if (key === 'email') return this._attributes.username !== undefined ? this._attributes.username : null;
    if (key === 'status') return this._attributes.is_active !== undefined ? this._attributes.is_active : null;
    return super.get(key);
  }

  set(key, value) {
    if (key === 'id') { this._attributes.user_id = value; return this; }
    if (key === 'name') { this._attributes.full_name = value; return this; }
    if (key === 'email') { this._attributes.username = value; return this; }
    if (key === 'status') { this._attributes.is_active = value; return this; }
    return super.set(key, value);
  }

  /**
   * Create a new user with automatic password hashing
   * @param {object} userData 
   * @returns {Promise<number>} Inserted user's ID
   */
  static async create(userData) {
    const data = { ...userData };
    if (data.password) {
      data.password = this.hashPassword(data.password);
    }
    return await super.create(data);
  }

  /**
   * Update details of an existing user
   */
  static async update(id, userData) {
    const data = { ...userData };
    if (data.password) {
      data.password = this.hashPassword(data.password);
    }
    return await super.update(id, data);
  }

  /**
   * Securely hash a plain text password
   * @param {string} password 
   * @returns {string} Hashed password
   */
  static hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verify if a plain text password matches a hash
   * @param {string} plain 
   * @param {string} hashed 
   * @returns {boolean} Verified?
   */
  static verifyPassword(plain, hashed) {
    try {
      // In PHP, passwords might use $2y$ prefix. bcryptjs supports $2a$ and $2b$.
      // Usually bcryptjs works out of the box with $2y$ by internally replacing it,
      // but to be safe we can normalize $2y$ to $2a$.
      let normalizedHash = hashed;
      if (hashed && hashed.startsWith('$2y$')) {
        normalizedHash = '$2a$' + hashed.substring(4);
      }
      return bcrypt.compareSync(plain, normalizedHash);
    } catch (e) {
      console.error('Password verification error:', e);
      return false;
    }
  }

  /**
   * HasMany tokens relationship
   */
  tokens() {
    return this.hasMany(require('./PersonalAccessToken'), 'tokenable_id');
  }
}

module.exports = User;
