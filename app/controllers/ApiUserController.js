const User = require('../models/User');
const DB = require('../../config/db');

class ApiUserController {
  /**
   * Fetch all users with assigned shop IDs
   */
  static async index(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      // Fetch users
      const users = await DB.query(`
        SELECT user_id, full_name, username, role, is_active, created_at, permissions
        FROM tbl_users
        ORDER BY user_id DESC
      `);

      // Fetch all shop assignments
      const assignments = await DB.query('SELECT user_id, shop_id FROM tbl_user_shops');

      // Group assignments by user_id
      const userShopsMap = {};
      assignments.forEach(a => {
        if (!userShopsMap[a.user_id]) {
          userShopsMap[a.user_id] = [];
        }
        userShopsMap[a.user_id].push(a.shop_id);
      });

      // Format response
      const formatted = users.map(u => {
        let permissions = [];
        if (u.permissions) {
          try {
            permissions = JSON.parse(u.permissions);
          } catch (e) {
            console.error('Failed to parse user permissions:', e);
          }
        }
        return {
          user_id: u.user_id,
          full_name: u.full_name,
          username: u.username,
          role: u.role,
          is_active: u.is_active,
          created_at: u.created_at,
          shop_ids: userShopsMap[u.user_id] || [],
          permissions: permissions
        };
      });

      return res.status(200).json({
        status: 'success',
        data: formatted
      });
    } catch (err) {
      console.error('Failed to fetch api users:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch users list' });
    }
  }

  /**
   * Create new user and assign shops
   */
  static async store(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const currentRole = req.user.get('role');
      if (currentRole !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Forbidden access.' });
      }

      const { name, username, password, role, is_active, shop_ids, permissions } = req.body;

      if (!name || !username || !password || !role) {
        throw new Error('সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন।');
      }

      // Check username unique
      const existing = await User.findByUsername(username);
      if (existing) {
        throw new Error('এই ইউজারনেম দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা আছে।');
      }

      // Create user
      // Note: User.create hashes the password automatically
      const newUserId = await User.create({
        full_name: name,
        username: username,
        password,
        role,
        is_active: parseInt(is_active) === 1 ? 1 : 0,
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : null
      });

      // Assign shops
      if (Array.isArray(shop_ids) && shop_ids.length > 0) {
        for (const shopId of shop_ids) {
          await q('INSERT INTO tbl_user_shops (user_id, shop_id) VALUES (?, ?)', [newUserId, parseInt(shopId)]);
        }
      }

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to store api user:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'Failed to create user' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update existing user details and shop assignments
   */
  static async update(req, res) {
    const userId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const currentRole = req.user.get('role');
      if (currentRole !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Forbidden access.' });
      }

      const { name, username, password, role, is_active, shop_ids, permissions } = req.body;

      if (!name || !username || !role) {
        throw new Error('সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন।');
      }

      const target = await User.find(userId);
      if (!target) {
        throw new Error('ব্যবহারকারী পাওয়া যায়নি।');
      }

      // Check unique username conflict
      const existing = await User.findByUsername(username);
      if (existing && existing.get('id') !== userId) {
        throw new Error('এই ইউজারনেম ইতিমধ্যে অন্য একজন ব্যবহার করছেন।');
      }

      // Build update data
      const updateData = {
        full_name: name,
        username,
        role,
        is_active: parseInt(is_active) === 1 ? 1 : 0,
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : null
      };

      if (password && password.trim().length > 0) {
        updateData.password = password;
      }

      // Update user
      // Note: User.update hashes password automatically
      await User.update(userId, updateData);

      // Re-assign shops
      await q('DELETE FROM tbl_user_shops WHERE user_id = ?', [userId]);

      if (Array.isArray(shop_ids) && shop_ids.length > 0) {
        for (const shopId of shop_ids) {
          await q('INSERT INTO tbl_user_shops (user_id, shop_id) VALUES (?, ?)', [userId, parseInt(shopId)]);
        }
      }

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'ব্যবহারকারীর তথ্য সফলভাবে আপডেট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update api user:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'Failed to update user' });
    } finally {
      connection.release();
    }
  }

  /**
   * Delete user
   */
  static async destroy(req, res) {
    try {
      const currentRole = req.user.get('role');
      if (currentRole !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Forbidden access.' });
      }

      const userId = parseInt(req.params.id);

      if (userId === req.user.get('user_id')) {
        return res.status(400).json({ status: 'error', message: 'আপনি নিজের অ্যাকাউন্টটি ডিলিট করতে পারবেন না।' });
      }

      const target = await User.find(userId);
      if (!target) {
        return res.status(404).json({ status: 'error', message: 'ব্যবহারকারী পাওয়া যায়নি।' });
      }

      // Delete shops mapping
      await DB.query('DELETE FROM tbl_user_shops WHERE user_id = ?', [userId]);
      // Delete user
      await User.destroy(userId);

      return res.status(200).json({
        status: 'success',
        message: 'ব্যবহারকারী সফলভাবে ডিলিট করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to delete api user:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to delete user' });
    }
  }

  /**
   * Change logged-in user's password
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.get('user_id');
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          status: 'error',
          message: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড উভয়ই প্রদান করুন।'
        });
      }

      if (new_password.trim().length < 4) {
        return res.status(400).json({
          status: 'error',
          message: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
        });
      }

      // Find user
      const user = await User.find(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ব্যবহারকারী পাওয়া যায়নি।'
        });
      }

      // Verify current password
      const isMatch = User.verifyPassword(current_password, user.get('password'));
      if (!isMatch) {
        return res.status(400).json({
          status: 'error',
          message: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।'
        });
      }

      // Update password
      await User.update(userId, { password: new_password });

      return res.status(200).json({
        status: 'success',
        message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to change user password:', err);
      return res.status(500).json({
        status: 'error',
        message: 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।'
      });
    }
  }
}

module.exports = ApiUserController;

