const Cache = require('../core/Cache');

/**
 * Enterprise Idempotency Middleware for Aero MVC
 * Prevents double-submissions, duplicate payments, and redundant order creations.
 * 
 * Works with Redis or Hybrid In-Memory Cache.
 * Tracks incoming requests using `Idempotency-Key` or `X-Idempotency-Key` header.
 * 
 * @param {Object} [options]
 * @param {number} [options.ttl=86400] Time-to-live in seconds for completed responses (default: 24h)
 * @param {number} [options.lockTtl=60] Time-to-live in seconds for in-flight locks (default: 60s)
 * @param {boolean} [options.required=false] Whether the Idempotency-Key header is strictly required
 */
function idempotency(options = {}) {
  const ttl = options.ttl || 86400;
  const lockTtl = options.lockTtl || 60;
  const required = options.required === true;

  return async function idempotencyMiddleware(req, res, next) {
    // Only apply to state-modifying requests
    const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    if (!rawKey) {
      if (required && isMutatingMethod) {
        return res.status(400).json({
          status: 400,
          error: 'Bad Request',
          message: 'Idempotency-Key header is required for this endpoint.'
        });
      }
      return next();
    }

    const key = String(rawKey).trim();
    if (!key || key.length < 8) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Idempotency-Key must be a valid unique string (at least 8 characters).'
      });
    }

    // Prefix with user ID if authenticated to isolate user namespaces
    const userPrefix = (req.user && req.user.id) ? `u${req.user.id}:` : '';
    const cacheKey = `idempotency:${userPrefix}${key}`;

    try {
      const cached = await Cache.get(cacheKey);

      if (cached) {
        if (cached.state === 'in_progress') {
          return res.status(409).json({
            status: 409,
            error: 'Conflict',
            message: 'A request with this Idempotency-Key is currently being processed. Please wait.',
            idempotency_key: key
          });
        }

        if (cached.state === 'completed') {
          res.setHeader('X-Idempotent-Replay', 'true');
          res.setHeader('X-Idempotency-Key', key);
          
          if (cached.contentType) {
            res.setHeader('Content-Type', cached.contentType);
          }
          
          return res.status(cached.statusCode).send(cached.body);
        }
      }

      // Lock request as in-progress
      await Cache.set(cacheKey, { state: 'in_progress', started_at: Date.now() }, lockTtl);

      // Intercept response to store result upon successful completion
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      let responseBody = null;

      res.send = function (body) {
        responseBody = body;
        return originalSend(body);
      };

      res.json = function (jsonObj) {
        responseBody = JSON.stringify(jsonObj);
        return originalJson(jsonObj);
      };

      res.on('finish', async () => {
        try {
          // If server error 5xx, unlock key so client can retry safely
          if (res.statusCode >= 500) {
            await Cache.forget(cacheKey);
            return;
          }

          // Cache successful or client-side validated responses
          await Cache.set(cacheKey, {
            state: 'completed',
            statusCode: res.statusCode,
            body: responseBody,
            contentType: res.getHeader('Content-Type'),
            completed_at: Date.now()
          }, ttl);
        } catch (err) {
          // Silent catch to not break client response
        }
      });

      next();
    } catch (err) {
      // Fallback: if cache fails, don't block user workflow
      next();
    }
  };
}

module.exports = idempotency;
