const DB = require('../config/db');

class DailySheetController {
  /**
   * Fetch daily sheets list
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
      const date = req.query.date; // YYYY-MM-DD

      let where = '1 = 1';
      const params = [];

      if (shopId) {
        if (role === 'manager' && !assignedShopIds.includes(shopId)) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার প্রবেশাধিকার নেই।' });
        }
        where += ' AND ds.shop_id = ?';
        params.push(shopId);
      } else if (role === 'manager') {
        where += ` AND ds.shop_id IN (${assignedShopIds.join(',')})`;
      }

      if (date) {
        where += ' AND ds.sheet_date = ?';
        params.push(date);
      }

      const sheets = await DB.query(`
        SELECT ds.*, s.shop_name
        FROM tbl_daily_sheets ds
        JOIN tbl_shops s ON ds.shop_id = s.shop_id
        WHERE ${where}
        ORDER BY ds.sheet_date DESC
        LIMIT 50
      `, params);

      return res.status(200).json({
        status: 'success',
        data: sheets
      });
    } catch (err) {
      console.error('Failed to fetch daily sheets:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch daily sheets' });
    }
  }

  /**
   * View single daily sheet with details
   */
  static async show(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const sheet = await DB.query(`
        SELECT ds.*, s.shop_name
        FROM tbl_daily_sheets ds
        JOIN tbl_shops s ON ds.shop_id = s.shop_id
        WHERE ds.sheet_id = ?
      `, [id]);

      if (sheet.length === 0) {
        return res.status(404).json({ status: 'error', message: 'দৈনিক হিসাব শীটটি পাওয়া যায়নি।' });
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          sheet[0].shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই হিসাব শীট দেখার অনুমতি নেই।' });
        }
      }

      const details = await DB.query('SELECT * FROM tbl_daily_sheet_details WHERE sheet_id = ?', [id]);

      return res.status(200).json({
        status: 'success',
        data: {
          ...sheet[0],
          details
        }
      });
    } catch (err) {
      console.error('Failed to fetch daily sheet details:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch details' });
    }
  }

  /**
   * Fetch external data (total expense and withdrawal) for a shop and date
   */
  static async getExternalData(req, res) {
    try {
      const shopId = parseInt(req.query.shop_id);
      const date = req.query.date;

      if (!shopId || !date) {
        return res.status(200).json({ status: 'success', expense: 0, withdrawal: 0 });
      }

      const expenseRows = await DB.query(
        'SELECT SUM(total_amount) AS total FROM tbl_expense_vouchers WHERE shop_id = ? AND voucher_date = ?',
        [shopId, date]
      );
      const totalExpense = parseFloat(expenseRows[0]?.total || 0);

      const withdrawalRows = await DB.query(
        'SELECT SUM(amount) AS total FROM tbl_income_vouchers WHERE shop_id = ? AND income_date = ? AND category_id = 1',
        [shopId, date]
      );
      const totalWithdrawal = parseFloat(withdrawalRows[0]?.total || 0);

      // Get Opening Balance (Closing balance of previous day)
      const openingRows = await DB.query(
        'SELECT closing_balance FROM tbl_daily_sheets WHERE shop_id = ? AND sheet_date < ? ORDER BY sheet_date DESC LIMIT 1',
        [shopId, date]
      );
      const openingBalance = parseFloat(openingRows[0]?.closing_balance || 0);

      return res.status(200).json({
        status: 'success',
        expense: totalExpense,
        withdrawal: totalWithdrawal,
        opening_balance: openingBalance
      });
    } catch (err) {
      console.error('Failed to fetch external data:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch opening/external stats' });
    }
  }

  /**
   * Save Daily Sheet
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
      const date = req.body.sheet_date || new Date().toISOString().substring(0, 10);
      const openingBalance = parseFloat(req.body.opening_balance || 0);
      const entries = req.body.entries || []; // [{ entry_type, payment_type, amount, note }]

      if (!shopId || !date) {
        throw new Error('দোকান এবং তারিখ প্রদান করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে দৈনিক হিসাব লেখার অনুমতি নেই।' });
        }
      }

      // Check if sheet already exists
      const existing = await q('SELECT sheet_id FROM tbl_daily_sheets WHERE shop_id = ? AND sheet_date = ?', [shopId, date]);
      if (existing.length > 0) {
        throw new Error('এই তারিখের হিসাব ইতিমধ্যে তৈরি করা আছে।');
      }

      // Fetch fresh totals from external tables (Expenses and Owner Withdrawals)
      const expenseRows = await q(
        'SELECT SUM(total_amount) AS total FROM tbl_expense_vouchers WHERE shop_id = ? AND voucher_date = ?',
        [shopId, date]
      );
      const totalExpense = parseFloat(expenseRows[0]?.total || 0);

      const withdrawalRows = await q(
        'SELECT SUM(amount) AS total FROM tbl_income_vouchers WHERE shop_id = ? AND income_date = ? AND category_id = 1',
        [shopId, date]
      );
      const totalWithdrawal = parseFloat(withdrawalRows[0]?.total || 0);

      // Save master record draft
      const result = await q(
        'INSERT INTO tbl_daily_sheets (shop_id, sheet_date, opening_balance, total_expense, owner_withdrawal, status) VALUES (?, ?, ?, ?, ?, ?)',
        [shopId, date, openingBalance, totalExpense, totalWithdrawal, 'draft']
      );
      const sheetId = result.insertId;

      let totalCashSale = 0;
      let totalDueSale = 0;
      let totalCashPurchase = 0;
      let totalDuePurchase = 0;

      // Save Details
      for (const entry of entries) {
        const amount = parseFloat(entry.amount || 0);
        if (amount <= 0) continue;

        const type = entry.entry_type; // 'sale' or 'purchase'
        const payType = entry.payment_type || 'cash'; // 'cash' or 'due'
        const note = entry.note || '';

        await q(
          'INSERT INTO tbl_daily_sheet_details (sheet_id, entry_type, payment_type, amount, note) VALUES (?, ?, ?, ?, ?)',
          [sheetId, type, payType, amount, note]
        );

        if (type === 'sale') {
          if (payType === 'cash') totalCashSale += amount;
          else totalDueSale += amount;
        } else if (type === 'purchase') {
          if (payType === 'cash') totalCashPurchase += amount;
          else totalDuePurchase += amount;
        }
      }

      // Calculate Closing Balance
      const closingBalance = openingBalance + totalCashSale - (totalCashPurchase + totalExpense + totalWithdrawal);

      // Update Master with totals & status
      await q(
        `UPDATE tbl_daily_sheets SET 
          total_cash_sale = ?, total_due_sale = ?,
          total_cash_purchase = ?, total_due_purchase = ?,
          closing_balance = ?, status = 'finalized'
         WHERE sheet_id = ?`,
        [totalCashSale, totalDueSale, totalCashPurchase, totalDuePurchase, closingBalance, sheetId]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'দৈনিক হিসাব সফলভাবে সংরক্ষিত হয়েছে।',
        sheet_id: sheetId,
        closing_balance: closingBalance
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create daily sheet:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'দৈনিক হিসাব সংরক্ষণে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update Daily Sheet
   */
  static async update(req, res) {
    const sheetId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const sheetRows = await q('SELECT * FROM tbl_daily_sheets WHERE sheet_id = ?', [sheetId]);
      if (sheetRows.length === 0) {
        throw new Error('দৈনিক হিসাব শীট পাওয়া যায়নি।');
      }
      const sheet = sheetRows[0];
      const shopId = sheet.shop_id;
      const date = sheet.sheet_date;
      const openingBalance = parseFloat(sheet.opening_balance || 0);
      const entries = req.body.entries || [];

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে হিসাব শীট পরিবর্তনের অনুমতি নেই।' });
        }
      }

      // Fetch fresh totals from external tables
      const expenseRows = await q(
        'SELECT SUM(total_amount) AS total FROM tbl_expense_vouchers WHERE shop_id = ? AND voucher_date = ?',
        [shopId, date]
      );
      const totalExpense = parseFloat(expenseRows[0]?.total || 0);

      const withdrawalRows = await q(
        'SELECT SUM(amount) AS total FROM tbl_income_vouchers WHERE shop_id = ? AND income_date = ? AND category_id = 1',
        [shopId, date]
      );
      const totalWithdrawal = parseFloat(withdrawalRows[0]?.total || 0);

      // Delete old details
      await q('DELETE FROM tbl_daily_sheet_details WHERE sheet_id = ?', [sheetId]);

      let totalCashSale = 0;
      let totalDueSale = 0;
      let totalCashPurchase = 0;
      let totalDuePurchase = 0;

      // Insert new details
      for (const entry of entries) {
        const amount = parseFloat(entry.amount || 0);
        if (amount <= 0) continue;

        const type = entry.entry_type;
        const payType = entry.payment_type || 'cash';
        const note = entry.note || '';

        await q(
          'INSERT INTO tbl_daily_sheet_details (sheet_id, entry_type, payment_type, amount, note) VALUES (?, ?, ?, ?, ?)',
          [sheetId, type, payType, amount, note]
        );

        if (type === 'sale') {
          if (payType === 'cash') totalCashSale += amount;
          else totalDueSale += amount;
        } else if (type === 'purchase') {
          if (payType === 'cash') totalCashPurchase += amount;
          else totalDuePurchase += amount;
        }
      }

      // Recalculate
      const closingBalance = openingBalance + totalCashSale - (totalCashPurchase + totalExpense + totalWithdrawal);

      // Update Master Record
      await q(
        `UPDATE tbl_daily_sheets SET 
          total_cash_sale = ?, total_due_sale = ?,
          total_cash_purchase = ?, total_due_purchase = ?,
          total_expense = ?, owner_withdrawal = ?,
          closing_balance = ?, updated_at = CURRENT_TIMESTAMP
         WHERE sheet_id = ?`,
        [totalCashSale, totalDueSale, totalCashPurchase, totalDuePurchase, totalExpense, totalWithdrawal, closingBalance, sheetId]
      );

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'দৈনিক হিসাব সফলভাবে আপডেট করা হয়েছে।',
        closing_balance: closingBalance
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update daily sheet:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'দৈনিক হিসাব আপডেটে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }
}

module.exports = DailySheetController;
