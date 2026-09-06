const DB = require('../config/db');

class TemplateController {
  static getTable(type) {
    return type === 'income' ? 'tbl_income_templates' : 'tbl_expense_templates';
  }

  /**
   * Fetch templates list filtered by type and shop_id
   */
  static async index(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const type = req.query.type || 'expense';
      const shopId = req.query.shop_id;
      const table = TemplateController.getTable(type);

      let sql = `
        SELECT t.template_id, t.shop_id, t.category_id, t.template_name, t.amount,
               s.shop_name, c.category_name
        FROM ${table} t
        JOIN tbl_shops s ON t.shop_id = s.shop_id
        JOIN tbl_expense_categories c ON t.category_id = c.category_id
      `;
      const params = [];
      if (shopId) {
        sql += ' WHERE t.shop_id = ?';
        params.push(parseInt(shopId));
      }
      sql += ' ORDER BY s.shop_name ASC, t.template_name ASC';
      const templates = await DB.query(sql, params);

      return res.status(200).json({
        status: 'success',
        data: templates
      });
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch templates' });
    }
  }

  /**
   * Save a new template
   */
  static async store(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const type = req.query.type || 'expense';
      const table = TemplateController.getTable(type);
      const { shop_id, category_id, template_name, amount } = req.body;

      if (!shop_id || !category_id || !template_name) {
        return res.status(400).json({ status: 'error', message: 'সব প্রয়োজনীয় ফিল্ড পূরণ করুন।' });
      }

      await DB.query(
        `INSERT INTO ${table} (shop_id, category_id, template_name, amount) VALUES (?, ?, ?, ?)`,
        [shop_id, category_id, template_name.trim(), parseFloat(amount) || 0]
      );

      return res.status(201).json({
        status: 'success',
        message: 'টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to create template:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to create template' });
    }
  }

  /**
   * Update an existing template
   */
  static async update(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const id = req.params.id;
      const type = req.query.type || 'expense';
      const table = TemplateController.getTable(type);
      const { shop_id, category_id, template_name, amount } = req.body;

      if (!shop_id || !category_id || !template_name) {
        return res.status(400).json({ status: 'error', message: 'সব প্রয়োজনীয় ফিল্ড পূরণ করুন।' });
      }

      await DB.query(
        `UPDATE ${table} SET shop_id = ?, category_id = ?, template_name = ?, amount = ? WHERE template_id = ?`,
        [shop_id, category_id, template_name.trim(), parseFloat(amount) || 0, id]
      );

      return res.status(200).json({
        status: 'success',
        message: 'টেমপ্লেট সফলভাবে আপডেট হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to update template:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to update template' });
    }
  }

  /**
   * Delete a template
   */
  static async destroy(req, res) {
    try {
      const role = req.user.get('role');
      if (role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'এই অ্যাক্সেস শুধুমাত্র অ্যাডমিনের জন্য সীমাবদ্ধ।' });
      }

      const id = req.params.id;
      const type = req.query.type || 'expense';
      const table = TemplateController.getTable(type);

      await DB.query(`DELETE FROM ${table} WHERE template_id = ?`, [id]);

      return res.status(200).json({
        status: 'success',
        message: 'টেমপ্লেট সফলভাবে মুছে ফেলা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to delete template:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to delete template' });
    }
  }
}

module.exports = TemplateController;
