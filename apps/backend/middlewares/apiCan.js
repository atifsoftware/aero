const DB = require('../config/db');

/**
 * Middleware to check if the authenticated API user has a specific permission.
 * Admin role automatically bypasses all permission checks.
 *
 * @param {string} permission The key of the permission required.
 */
function apiCan(permission) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized access.' });
      }

      // Admin role has all privileges
      if (user.get('role') === 'admin') {
        return next();
      }

      // Fetch user's permissions directly from the database to ensure we check the most current state
      const [userRecord] = await DB.query('SELECT permissions FROM tbl_users WHERE user_id = ?', [user.get('user_id')]);
      if (!userRecord) {
        return res.status(403).json({ status: 'error', message: 'ব্যবহারকারী পাওয়া যায়নি।' });
      }

      let userPermissions = [];
      if (userRecord.permissions) {
        try {
          userPermissions = JSON.parse(userRecord.permissions);
        } catch (e) {
          console.error('Failed to parse user permissions:', e);
        }
      }

      if (!Array.isArray(userPermissions) || !userPermissions.includes(permission)) {
        return res.status(403).json({
          status: 'error',
          message: 'দুঃখিত, এই কাজটি করার জন্য আপনার অ্যাকাউন্ট অনুমোদিত নয়।'
        });
      }

      next();
    } catch (err) {
      console.error('Error in apiCan middleware:', err);
      return res.status(500).json({ status: 'error', message: 'অভ্যন্তরীণ সার্ভার ত্রুটি।' });
    }
  };
}

module.exports = apiCan;
