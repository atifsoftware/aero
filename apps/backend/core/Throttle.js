// @ts-check
const Cache = require('./Cache');

/**
 * @typedef {Object} ThrottleOptions
 * @property {number} [max=60] Maximum number of connections during windowMs
 * @property {number} [windowMs=60000] How long in milliseconds to keep records of requests
 * @property {string|Object} [message] Error message or response payload sent when rate limited
 * @property {number} [statusCode=429] HTTP status code returned when rate limit exceeded
 * @property {boolean} [headers=true] Whether to send RateLimit and X-RateLimit headers
 * @property {function(import('express').Request): string} [keyGenerator] Function used to generate keys
 * @property {function(import('express').Request): boolean} [skip] Function used to skip rate limiting
 */

/**
 * In-Memory Fallback Rate Limit Store with auto-eviction
 */
class MemoryStore {
  constructor() {
    /** @type {Map<string, { hits: number, resetTime: number }>} */
    this.hits = new Map();
    // Periodically sweep expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Increment hits for key
   * @param {string} key
   * @param {number} windowMs
   * @returns {{ totalHits: number, resetTime: number }}
   */
  increment(key, windowMs) {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || record.resetTime <= now) {
      const resetTime = now + windowMs;
      this.hits.set(key, { hits: 1, resetTime });
      return { totalHits: 1, resetTime };
    }

    record.hits += 1;
    return { totalHits: record.hits, resetTime: record.resetTime };
  }

  /**
   * Reset hits for a given key
   * @param {string} key
   */
  reset(key) {
    this.hits.delete(key);
  }

  /**
   * Remove expired keys to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (record.resetTime <= now) {
        this.hits.delete(key);
      }
    }
  }
}

const defaultMemoryStore = new MemoryStore();

/**
 * Enterprise Rate Limiting Middleware Factory
 * Supports distributed Redis rate limiting with seamless in-memory fallback,
 * RFC 6585 compliance, custom keys, and route-level granularity.
 *
 * @param {ThrottleOptions} [options]
 * @returns {import('express').RequestHandler}
 */
function throttle(options = {}) {
  const max = options.max || 60;
  const windowMs = options.windowMs || 60000;
  const statusCode = options.statusCode || 429;
  const sendHeaders = options.headers !== false;
  const defaultMessage = {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Too many requests. Please try again after ${Math.ceil(windowMs / 1000)} seconds.`
  };
  const message = options.message || defaultMessage;

  /**
   * Default key generator: client IP or authenticated user ID
   * @param {any} req
   * @returns {string}
   */
  const keyGenerator = options.keyGenerator || ((req) => {
    const userId = req.user?.id || req.user?.user_id || req.auth?.userId;
    if (userId) {
      return `user:${userId}`;
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? String(forwarded).split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || '127.0.0.1');
    return `ip:${ip}`;
  });

  return async function throttleMiddleware(req, res, next) {
    if (options.skip && options.skip(req)) {
      return next();
    }

    const clientKey = keyGenerator(req);
    const routeKey = `${req.baseUrl || ''}${req.path || ''}`;
    const storageKey = `ratelimit:${routeKey}:${clientKey}`;

    let totalHits = 1;
    let resetTime = Date.now() + windowMs;

    try {
      // 1. Try Distributed Redis Rate Limiting if connected
      Cache.init();
      if (Cache.isRedisConnected && Cache.redisClient) {
        const client = Cache.redisClient;
        const count = await client.incr(storageKey);
        if (count === 1) {
          await client.pexpire(storageKey, windowMs);
        }
        const ttl = await client.pttl(storageKey);
        resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);
        totalHits = count;
      } else {
        // 2. Fallback to High-Speed In-Memory Store
        const result = defaultMemoryStore.increment(storageKey, windowMs);
        totalHits = result.totalHits;
        resetTime = result.resetTime;
      }
    } catch (err) {
      // Graceful fallback to in-memory on redis glitch
      const result = defaultMemoryStore.increment(storageKey, windowMs);
      totalHits = result.totalHits;
      resetTime = result.resetTime;
    }

    const remaining = Math.max(0, max - totalHits);
    const retryAfterSec = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    const resetTimeSec = Math.ceil(resetTime / 1000);

    // Set RFC 6585 and X-RateLimit response headers
    if (sendHeaders && !res.headersSent) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetTimeSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTimeSec);
    }

    // Exceeded threshold -> reject with 429
    if (totalHits > max) {
      if (sendHeaders && !res.headersSent) {
        res.setHeader('Retry-After', retryAfterSec);
      }
      return res.status(statusCode).json(
        typeof message === 'function' ? message(req, res) : message
      );
    }

    next();
  };
}

/**
 * Pre-configured Throttle presets
 */
const Throttle = {
  /**
   * Custom granular limiter
   * @param {ThrottleOptions} [options]
   */
  custom: throttle,

  /**
   * Strict rate limiting for authentication (Login, Register, Token Refresh)
   * 5 requests per minute by default
   * @param {Partial<ThrottleOptions>} [options]
   */
  auth: (options = {}) => throttle({
    max: options.max || 5,
    windowMs: options.windowMs || 60 * 1000,
    message: {
      status: 'error',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please wait 1 minute before trying again.'
    },
    ...options
  }),

  /**
   * General API endpoints rate limiter
   * 120 requests per minute by default
   * @param {Partial<ThrottleOptions>} [options]
   */
  api: (options = {}) => throttle({
    max: options.max || 120,
    windowMs: options.windowMs || 60 * 1000,
    ...options
  }),

  /**
   * Sensitive operations rate limiter (Password reset, Payment submission, Export)
   * 10 requests per minute by default
   * @param {Partial<ThrottleOptions>} [options]
   */
  strict: (options = {}) => throttle({
    max: options.max || 10,
    windowMs: options.windowMs || 60 * 1000,
    message: {
      status: 'error',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      message: 'Action frequency limit reached. Please wait before retrying.'
    },
    ...options
  }),

  /**
   * Memory store reference for inspection or testing
   */
  _memoryStore: defaultMemoryStore
};

module.exports = Throttle;
