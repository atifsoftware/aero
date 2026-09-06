// @ts-check
const crypto = require('crypto');
const DB = require('../config/db');
const User = require('../models/User');
const requestContext = require('../core/RequestContext');

/**
 * Personal Access Token Authentication Middleware (Sanctum-like API Token Auth)
 * Validates cryptographically secure nf_pat_... Bearer tokens,
 * checks expiration timestamp (expires_at), records last_used_at,
 * and sets up the request context.
 *
 * @param {import('express').Request & { user?: any, tokenAbilities?: string[], token?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function apiTokenAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Bearer token required for API authorization.'
    });
  }

  const plainToken = authHeader.substring(7).trim();
  if (!plainToken.startsWith('aero_pat_') && !plainToken.startsWith('nf_pat_')) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN_FORMAT',
      message: 'Invalid API token format. Must be a valid personal access token (aero_pat_...).'
    });
  }

  try {
    // Generate SHA-256 hash to match stored record
    const hashed = crypto.createHash('sha256').update(plainToken).digest('hex');

    const tokenRecord = await DB.table('personal_access_tokens')
      .where('token', hashed)
      .first();

    if (!tokenRecord) {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_INVALID',
        message: 'API token is invalid or does not exist.'
      });
    }

    // Check token expiration
    if (tokenRecord.expires_at) {
      const expiresAt = new Date(tokenRecord.expires_at);
      if (expiresAt <= new Date()) {
        return res.status(401).json({
          status: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'API access token has expired. Please refresh your token or log in again.'
        });
      }
    }

    // Resolve matching User model instance
    const user = await User.find(tokenRecord.tokenable_id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'User associated with this token not found.'
      });
    }

    // Check if user account is active
    if (user.get('is_active') !== 1 && user.get('is_active') !== '1' && user.get('is_active') !== 'active') {
      return res.status(403).json({
        status: 'error',
        code: 'USER_INACTIVE',
        message: 'Your account is deactivated.'
      });
    }

    // Record last used timestamp in background (non-blocking)
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    DB.table('personal_access_tokens')
      .where('id', tokenRecord.id)
      .update({ last_used_at: now })
      .catch(() => {});

    // Mount user, active token record, and scopes to request
    req.user = user;
    req.token = tokenRecord;
    try {
      req.tokenAbilities = JSON.parse(tokenRecord.abilities || '["*"]');
    } catch {
      req.tokenAbilities = ['*'];
    }

    // Register active user in global RequestContext for cross-library access (Gate, Logger)
    const store = requestContext.getStore();
    if (store && store.req) {
      store.req.session = store.req.session || {};
      store.req.session.user = {
        id: user.get('user_id') || user.get('id'),
        name: user.get('full_name') || user.get('name'),
        username: user.get('username') || user.get('email'),
        role: user.get('role')
      };
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      code: 'AUTH_INTERNAL_ERROR',
      message: 'Authentication internal failure: ' + (error instanceof Error ? error.message : String(error))
    });
  }
}

module.exports = apiTokenAuth;
