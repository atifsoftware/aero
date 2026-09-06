const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let Redis;
try {
  Redis = require('ioredis');
} catch {
  Redis = null;
}

/**
 * Aero Hybrid Caching System
 * Supports high-speed Redis caching with seamless, zero-downtime
 * fallback to local file-based storage if Redis is unavailable.
 */
class Cache {
  static cacheDir = path.join(process.cwd(), 'storage', 'cache');
  static defaultTtl = 3600; // 1 hour in seconds
  static redisClient = null;
  static isRedisConnected = false;
  static redisInitAttempted = false;

  /**
   * Initialize Redis Client if configured
   */
  static _initRedis() {
    if (this.redisInitAttempted) return;
    this.redisInitAttempted = true;

    if (!Redis) return;

    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT) || 6379;
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    const redisUrl = process.env.REDIS_URL;

    try {
      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 1000,
          retryStrategy: () => null
        });
      } else {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 1000,
          retryStrategy: () => null
        });
      }

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
      });

      this.redisClient.on('error', () => {
        this.isRedisConnected = false;
      });

      this.redisClient.connect().then(() => {
        this.isRedisConnected = true;
      }).catch(() => {
        this.isRedisConnected = false;
      });
    } catch {
      this.isRedisConnected = false;
    }
  }

  /**
   * Ensure cache directory exists for file storage fallback
   */
  static init() {
    this._initRedis();
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  static _getFilePath(key) {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.cache.json`);
  }

  static _isValid(filePath) {
    if (!fs.existsSync(filePath)) return false;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return data && data.expires && Date.now() < data.expires;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve an item from the cache
   * @param {string} key
   * @param {*} [defaultValue=null]
   * @returns {Promise<*>|*}
   */
  static async get(key, defaultValue = null) {
    this.init();

    if (this.isRedisConnected && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        if (val !== null && val !== undefined) {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return defaultValue;
      } catch {
        // Fall back to file
      }
    }

    const filePath = this._getFilePath(key);
    if (!this._isValid(filePath)) {
      return defaultValue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return data.value !== undefined ? data.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Synchronous get fallback (for file-based cache)
   */
  static getSync(key, defaultValue = null) {
    this.init();
    const filePath = this._getFilePath(key);
    if (!this._isValid(filePath)) return defaultValue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return data.value !== undefined ? data.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Store an item in the cache
   * @param {string} key
   * @param {*} value
   * @param {number} [ttl] - TTL in seconds
   * @returns {Promise<boolean>|boolean}
   */
  static async set(key, value, ttl = null) {
    this.init();
    ttl = ttl || this.defaultTtl;

    if (this.isRedisConnected && this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisClient.setex(key, ttl, serialized);
        return true;
      } catch {
        // Fall back to file
      }
    }

    const filePath = this._getFilePath(key);
    const data = {
      key,
      value,
      expires: Date.now() + (ttl * 1000),
      created: Date.now()
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an item exists in the cache
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  static async has(key) {
    this.init();
    if (this.isRedisConnected && this.redisClient) {
      try {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      } catch {
        // Fall back to file
      }
    }
    const filePath = this._getFilePath(key);
    return this._isValid(filePath);
  }

  /**
   * Remove an item from the cache
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  static async delete(key) {
    this.init();
    let deleted = false;

    if (this.isRedisConnected && this.redisClient) {
      try {
        const res = await this.redisClient.del(key);
        if (res > 0) deleted = true;
      } catch {}
    }

    const filePath = this._getFilePath(key);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deleted = true;
      } catch {}
    }

    return deleted;
  }

  static async forget(key) {
    return await this.delete(key);
  }

  /**
   * Clear all cached data
   * @returns {Promise<number>}
   */
  static async clear() {
    this.init();
    let count = 0;

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch {}
    }

    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
          count++;
        }
      }
    } catch {}

    return count;
  }

  static async flush() {
    return await this.clear();
  }

  /**
   * Get an item from the cache, or execute the given callback and store the result
   * @param {string} key
   * @param {number} ttl - TTL in seconds
   * @param {Function} callback
   * @returns {Promise<*>}
   */
  static async remember(key, ttl, callback) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await callback();
    if (value !== undefined) {
      await this.set(key, value, ttl);
    }
    return value;
  }

  /**
   * Remember item in cache indefinitely (10 years)
   */
  static async rememberForever(key, callback) {
    return await this.remember(key, 315360000, callback);
  }

  /**
   * Clean expired cache files
   */
  static clean() {
    this.init();
    let cleaned = 0;
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache.json')) {
          const filePath = path.join(this.cacheDir, file);
          if (!this._isValid(filePath)) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        }
      }
    } catch {}
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  static stats() {
    this.init();
    let totalFiles = 0;
    let totalSize = 0;
    let validCount = 0;
    let expiredCount = 0;

    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache.json')) {
          totalFiles++;
          const filePath = path.join(this.cacheDir, file);
          const stat = fs.statSync(filePath);
          totalSize += stat.size;

          if (this._isValid(filePath)) {
            validCount++;
          } else {
            expiredCount++;
          }
        }
      }
    } catch {}

    return {
      driver: this.isRedisConnected ? 'redis' : 'file',
      redisConnected: this.isRedisConnected,
      fileCache: { totalFiles, totalSize, validCount, expiredCount }
    };
  }
}

module.exports = Cache;
