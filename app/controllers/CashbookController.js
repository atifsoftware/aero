const DB = require('../../config/db');

class CashbookController {
  /**
   * Fetch list of daily closings (daybook entries)
   */
  static async index(req, res) {
    try {
      const role = req.user.get('role');
      const assignedShopIds = [];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        assignedShopIds.push(...userShops.map(s => s.shop_id));
        if (assignedShopIds.length === 0) {
          return res.status(200).json({ status: 'success', data: [] });
        }
      }

      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      let where = '1 = 1';
      const params = [];

      if (shopId) {
        if (role === 'manager' && !assignedShopIds.includes(shopId)) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার প্রবেশাধিকার নেই।' });
        }
        where += ' AND c.shop_id = ?';
        params.push(shopId);
      } else if (role === 'manager') {
        where += ` AND c.shop_id IN (${assignedShopIds.join(',')})`;
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const closings = await DB.query(`
        SELECT c.*, s.shop_name
        FROM tbl_daily_closing c
        JOIN tbl_shops s ON c.shop_id = s.shop_id
        WHERE ${where}
        ORDER BY c.closing_date DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return res.status(200).json({
        status: 'success',
        data: closings
      });
    } catch (err) {
      console.error('Failed to fetch daily closings:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch daily closing reports' });
    }
  }

  /**
   * Calculate closing parameters for a shop and date (Daybook)
   */
  static async calculate(req, res) {
    try {
      const shopId = parseInt(req.query.shop_id);
      const date = req.query.date || new Date().toISOString().substring(0, 10);

      if (!shopId) {
        throw new Error('দোকান আইডি প্রদান করুন।');
      }

      // Check if already closed
      const existing = await DB.query('SELECT * FROM tbl_daily_closing WHERE shop_id = ? AND closing_date = ?', [shopId, date]);
      if (existing.length > 0) {
        return res.status(200).json({
          status: 'success',
          is_closed: true,
          data: existing[0]
        });
      }

      // Calculate Opening: Physical closing of last closed day
      const lastClosingRows = await DB.query(
        'SELECT physical_closing_balance FROM tbl_daily_closing WHERE shop_id = ? AND closing_date < ? ORDER BY closing_date DESC LIMIT 1',
        [shopId, date]
      );
      const openingBalance = parseFloat(lastClosingRows[0]?.physical_closing_balance || 0);

      // Today's Cash Inflows (credits in tbl_account_transactions)
      const incomeRows = await DB.query(
        "SELECT SUM(amount) AS total FROM tbl_account_transactions WHERE shop_id = ? AND trans_date = ? AND trans_type = 'credit'",
        [shopId, date]
      );
      const totalIncome = parseFloat(incomeRows[0]?.total || 0);

      // Today's Cash Outflows (debits in tbl_account_transactions)
      const expenseRows = await DB.query(
        "SELECT SUM(amount) AS total FROM tbl_account_transactions WHERE shop_id = ? AND trans_date = ? AND trans_type = 'debit'",
        [shopId, date]
      );
      const totalExpense = parseFloat(expenseRows[0]?.total || 0);

      const systemClosing = openingBalance + totalIncome - totalExpense;

      // Transactions list
      const transactions = await DB.query(
        'SELECT at.*, a.account_name FROM tbl_account_transactions at JOIN tbl_accounts a ON at.account_id = a.account_id WHERE at.shop_id = ? AND at.trans_date = ? ORDER BY at.trans_id ASC',
        [shopId, date]
      );

      return res.status(200).json({
        status: 'success',
        is_closed: false,
        data: {
          opening_balance: openingBalance,
          total_income: totalIncome,
          total_expense: totalExpense,
          system_closing: systemClosing,
          transactions
        }
      });
    } catch (err) {
      console.error('Failed to calculate closing:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ক্লোজিং হিসাব করতে ব্যর্থতা' });
    }
  }

  /**
   * Finalize Day Closing
   */
  static async create(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const date = req.body.closing_date;
      const opening = parseFloat(req.body.opening_balance || 0);
      const income = parseFloat(req.body.total_income || 0);
      const expense = parseFloat(req.body.total_expense || 0);
      const system = parseFloat(req.body.system_closing_balance || 0);
      const physical = parseFloat(req.body.physical_closing_balance || 0);
      const remarks = req.body.remarks || '';

      if (!shopId || !date) {
        throw new Error('দোকান এবং তারিখ প্রদান করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে হিসাব ক্লোজ করার অনুমতি নেই।' });
        }
      }

      // Duplicate check
      const duplicate = await q('SELECT closing_id FROM tbl_daily_closing WHERE shop_id = ? AND closing_date = ?', [shopId, date]);
      if (duplicate.length > 0) {
        throw new Error('এই তারিখের হিসাব ইতিমধ্যে ক্লোজ করা হয়েছে।');
      }

      const discrepancy = physical - system;

      await q(
        `INSERT INTO tbl_daily_closing 
         (shop_id, closing_date, opening_balance, total_income, total_expense, system_closing_balance, physical_closing_balance, discrepancy, remarks, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shopId, date, opening, income, expense, system, physical, discrepancy, remarks, req.user.get('user_id')]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'সারাদিনের হিসাব সফলভাবে ক্লোজ করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to save closing:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ক্লোজিং সংরক্ষণে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Delete day closing
   */
  static async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const closingRows = await DB.query('SELECT * FROM tbl_daily_closing WHERE closing_id = ?', [id]);
      if (closingRows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'ক্লোজিং রেকর্ড পাওয়া যায়নি।' });
      }
      const closing = closingRows[0];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          closing.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ক্লোজিং মুছে ফেলার অনুমতি নেই।' });
        }
      }

      await DB.query('DELETE FROM tbl_daily_closing WHERE closing_id = ?', [id]);

      return res.status(200).json({
        status: 'success',
        message: 'ক্লোজিং রেকর্ড সফলভাবে ডিলিট করা হয়েছে।'
      });
    } catch (err) {
      console.error('Failed to delete closing:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to delete closing' });
    }
  }
}

module.exports = CashbookController;
