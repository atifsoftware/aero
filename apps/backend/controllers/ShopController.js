const DB = require('../config/db');

class ShopController {
  /**
   * List all shops with employee counts
   */
  static async index(req, res) {
    try {
      const role = req.user.get('role');
      let where = '1 = 1';
      
      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedShopIds = userShops.map(s => s.shop_id);
        if (assignedShopIds.length === 0) {
          return res.status(200).json({ status: 'success', data: [] });
        }
        where = `s.shop_id IN (${assignedShopIds.join(',')})`;
      }

      const shops = await DB.query(`
        SELECT s.*,
               COUNT(DISTINCT es.employee_id) AS employee_count
        FROM tbl_shops s
        LEFT JOIN tbl_employee_shop es ON s.shop_id = es.shop_id AND es.is_active = 1
        WHERE ${where}
        GROUP BY s.shop_id
        ORDER BY s.sort_order ASC, s.shop_name ASC
      `);
      
      return res.status(200).json({
        status: 'success',
        data: shops
      });
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch shops' });
    }
  }

  /**
   * Set active shop in session (for stateful web clients) or return details for mobile API client
   */
  static async select(req, res) {
    try {
      const shopId = parseInt(req.body.shop_id);
      
      if (shopId === 0 || !shopId) {
        if (req.session) {
          delete req.session.active_shop_id;
          delete req.session.active_shop_name;
        }
        return res.status(200).json({
          status: 'success',
          message: 'All shops selected (no shop filter)',
          active_shop: null
        });
      }

      const shop = await DB.table('tbl_shops').where('shop_id', shopId).first();
      if (!shop) {
        return res.status(404).json({ status: 'error', message: 'Shop not found' });
      }

      if (req.session) {
        req.session.active_shop_id = shopId;
        req.session.active_shop_name = shop.shop_name;
      }

      return res.status(200).json({
        status: 'success',
        message: `Active shop set to ${shop.shop_name}`,
        active_shop: {
          id: shopId,
          name: shop.shop_name
        }
      });
    } catch (err) {
      console.error('Failed to select shop:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to select shop' });
    }
  }

  /**
   * Create a new shop
   */
  static async store(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const { shop_name, shop_code, address, phone, sort_order, is_active } = req.body;

      if (!shop_name || !shop_code) {
        return res.status(400).json({ status: 'error', message: 'দোকানের নাম এবং কোড আবশ্যক।' });
      }

      const existing = await DB.table('tbl_shops').where('shop_code', shop_code.trim()).first();
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'এই দোকান কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
      }

      await DB.query(
        `INSERT INTO tbl_shops (shop_name, shop_code, address, phone, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          shop_name.trim(),
          shop_code.trim(),
          address ? address.trim() : null,
          phone ? phone.trim() : null,
          parseInt(sort_order) || 0,
          is_active === false ? 0 : 1
        ]
      );

      return res.status(201).json({
        status: 'success',
        message: 'দোকান সফলভাবে তৈরি করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to create shop:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to create shop' });
    }
  }

  /**
   * Update an existing shop
   */
  static async update(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const shopId = req.params.id;
      const { shop_name, shop_code, address, phone, sort_order, is_active } = req.body;

      if (!shop_name || !shop_code) {
        return res.status(400).json({ status: 'error', message: 'দোকানের নাম এবং কোড আবশ্যক।' });
      }

      const existing = await DB.query(
        'SELECT * FROM tbl_shops WHERE shop_code = ? AND shop_id != ?',
        [shop_code.trim(), shopId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ status: 'error', message: 'এই দোকান কোডটি অন্য একটি দোকানে ইতিমধ্যে ব্যবহার করা হয়েছে।' });
      }

      await DB.query(
        `UPDATE tbl_shops SET shop_name = ?, shop_code = ?, address = ?, phone = ?, sort_order = ?, is_active = ? WHERE shop_id = ?`,
        [
          shop_name.trim(),
          shop_code.trim(),
          address ? address.trim() : null,
          phone ? phone.trim() : null,
          parseInt(sort_order) || 0,
          is_active === false || is_active === 0 ? 0 : 1,
          shopId
        ]
      );

      return res.status(200).json({
        status: 'success',
        message: 'দোকানের তথ্য সফলভাবে আপডেট করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to update shop:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to update shop' });
    }
  }

  /**
   * Delete a shop
   */
  static async destroy(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const shopId = req.params.id;

      await DB.query('DELETE FROM tbl_shops WHERE shop_id = ?', [shopId]);

      return res.status(200).json({
        status: 'success',
        message: 'দোকানটি সফলভাবে মুছে ফেলা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to delete shop:', err);
      if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          status: 'error',
          message: 'এই দোকানের অধীনে কর্মকর্তা/কর্মচারী বা লেনদেনের খতিয়ান রয়েছে। তাই এটি ডিলিট করা সম্ভব নয়। আপনি দোকানটি অসক্রিয় (Inactive) করে রাখতে পারেন।'
        });
      }
      return res.status(500).json({ status: 'error', message: 'Failed to delete shop' });
    }
  }

  /**
   * Reorder shops sequence using swap method (up/down direction)
   */
  static async reorder(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const { shop_id, direction } = req.body;
      if (!shop_id || !direction) {
        return res.status(400).json({ status: 'error', message: 'দোকান আইডি এবং দিক নির্দেশনা আবশ্যক।' });
      }

      // 1. Get all shops ordered by current sort_order and shop_name
      const shops = await DB.query('SELECT shop_id, sort_order FROM tbl_shops ORDER BY sort_order ASC, shop_name ASC');
      
      // Find the index of target shop
      const targetIndex = shops.findIndex(s => s.shop_id === parseInt(shop_id));
      if (targetIndex === -1) {
        return res.status(404).json({ status: 'error', message: 'দোকানটি পাওয়া যায়নি।' });
      }

      let swapIndex = -1;
      if (direction === 'up' && targetIndex > 0) {
        swapIndex = targetIndex - 1;
      } else if (direction === 'down' && targetIndex < shops.length - 1) {
        swapIndex = targetIndex + 1;
      }

      if (swapIndex !== -1) {
        // Swap their sort_order values in database
        for (let i = 0; i < shops.length; i++) {
          let orderVal = i;
          let targetShopId = shops[i].shop_id;
          
          if (i === targetIndex) {
            orderVal = swapIndex;
          } else if (i === swapIndex) {
            orderVal = targetIndex;
          }
          
          await DB.query('UPDATE tbl_shops SET sort_order = ? WHERE shop_id = ?', [orderVal, targetShopId]);
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'দোকানের সিরিয়াল সফলভাবে পরিবর্তন করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to reorder shop:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to reorder shop' });
    }
  }
}

module.exports = ShopController;
