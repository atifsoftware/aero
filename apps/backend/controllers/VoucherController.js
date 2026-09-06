const DB = require('../config/db');

class VoucherController {
  /**
   * Fetch active expense/income categories
   */
  static async getCategories(req, res) {
    try {
      const type = req.query.type; // 'expense' or 'income'
      let sql = 'SELECT category_id, category_name, category_type, is_salary_type, is_active, sort_order FROM tbl_expense_categories WHERE is_active = 1';
      const params = [];

      if (type) {
        sql += ' AND category_type = ?';
        params.push(type);
        if (type === 'expense') {
          sql += ' AND is_salary_type = 0';
        }
      }

      sql += ' ORDER BY sort_order ASC, category_name ASC';
      const categories = await DB.query(sql, params);

      return res.status(200).json({
        status: 'success',
        data: categories
      });
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
    }
  }

  /**
   * Fetch active cash/bank accounts
   */
  static async getAccounts(req, res) {
    try {
      const accounts = await DB.query(
        'SELECT account_id, account_name, account_type, current_balance, is_active FROM tbl_accounts WHERE is_active = 1 ORDER BY account_name ASC'
      );

      return res.status(200).json({
        status: 'success',
        data: accounts
      });
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch accounts' });
    }
  }

  /**
   * Fetch expense templates
   */
  static async getExpenseTemplates(req, res) {
    try {
      const shopId = req.query.shop_id;
      let sql = `
        SELECT t.template_id, t.shop_id, t.category_id, t.template_name, t.amount,
               s.shop_name, c.category_name
        FROM tbl_expense_templates t
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
      console.error('Failed to fetch expense templates:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch expense templates' });
    }
  }

  /**
   * Fetch expense vouchers list
   */
  static async getExpenses(req, res) {
    try {
      const role = req.user.get('role');
      const assignedShopIds = [];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        assignedShopIds.push(...userShops.map(s => s.shop_id));
        if (assignedShopIds.length === 0) {
          return res.status(200).json({
            status: 'success',
            data: [],
            totalAmount: 0,
            pagination: { total: 0, pages: 0, page: 1 }
          });
        }
      }

      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let where = 'ev.voucher_date BETWEEN ? AND ?';
      const params = [from, to];

      if (shopId) {
        if (role === 'manager' && !assignedShopIds.includes(shopId)) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার প্রবেশাধিকার নেই।' });
        }
        where += ' AND ev.shop_id = ?';
        params.push(shopId);
      } else if (role === 'manager') {
        where += ` AND ev.shop_id IN (${assignedShopIds.join(',')})`;
      }

      // Total records count
      const countRows = await DB.query(`SELECT COUNT(DISTINCT ev.voucher_id) AS total FROM tbl_expense_vouchers ev WHERE ${where}`, params);
      const totalRecords = countRows[0]?.total || 0;
      const totalPages = Math.ceil(totalRecords / limit);

      // Total amount summary
      const sumRows = await DB.query(`SELECT SUM(ev.total_amount) AS total_amount FROM tbl_expense_vouchers ev WHERE ${where}`, params);
      const totalAmount = parseFloat(sumRows[0]?.total_amount || 0);

      // Main Query
      const vouchers = await DB.query(`
        SELECT ev.*, s.shop_name, a.account_name,
               GROUP_CONCAT(ec.category_name ORDER BY evd.detail_id SEPARATOR ', ') AS categories
        FROM tbl_expense_vouchers ev
        JOIN tbl_shops s ON ev.shop_id = s.shop_id
        LEFT JOIN tbl_accounts a ON ev.account_id = a.account_id
        LEFT JOIN tbl_expense_voucher_details evd ON ev.voucher_id = evd.voucher_id
        LEFT JOIN tbl_expense_categories ec ON evd.category_id = ec.category_id
        WHERE ${where}
        GROUP BY ev.voucher_id
        ORDER BY ev.voucher_date DESC, ev.voucher_id DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return res.status(200).json({
        status: 'success',
        data: vouchers,
        totalAmount,
        pagination: {
          total: totalRecords,
          pages: totalPages,
          page
        }
      });
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch expense list' });
    }
  }

  /**
   * View single expense voucher with details
   */
  static async getExpenseDetail(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const voucher = await DB.table('tbl_expense_vouchers').where('voucher_id', id).first();
      if (!voucher) {
        return res.status(404).json({ status: 'error', message: 'খরচ ভাউচারটি পাওয়া যায়নি।' });
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          voucher.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ভাউচার দেখার অনুমতি আপনার নেই।' });
        }
      }

      const details = await DB.query(`
        SELECT evd.*, ec.category_name
        FROM tbl_expense_voucher_details evd
        JOIN tbl_expense_categories ec ON evd.category_id = ec.category_id
        WHERE evd.voucher_id = ?
      `, [id]);

      return res.status(200).json({
        status: 'success',
        data: {
          ...voucher,
          details
        }
      });
    } catch (err) {
      console.error('Failed to fetch expense details:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch details' });
    }
  }

  /**
   * Create expense voucher
   */
  static async createExpense(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const accountId = parseInt(req.body.account_id);
      const voucherDate = req.body.voucher_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';
      const items = req.body.details || []; // [{ category_id, amount, description }]

      if (!shopId || !accountId) {
        throw new Error('দোকান এবং ক্যাশ/ব্যাংক অ্যাকাউন্ট দুটিই নির্বাচন করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার এন্ট্রি দেওয়ার অনুমতি নেই।' });
        }
      }

      let total = 0;
      for (const item of items) {
        total += parseFloat(item.amount || 0);
      }

      if (total <= 0) {
        throw new Error('কমপক্ষে একটি খরচের আইটেম যোগ করুন এবং পরিমাণ শূন্যের বেশি হতে হবে।');
      }

      // Generate voucher number
      const year = new Date(voucherDate).getFullYear();
      const prefix = `EXP-${year}-%`;
      const lastVouchers = await q(
        'SELECT voucher_no FROM tbl_expense_vouchers WHERE voucher_no LIKE ? ORDER BY voucher_no DESC LIMIT 1',
        [prefix]
      );

      let nextSeq = 1;
      if (lastVouchers.length > 0) {
        const parts = lastVouchers[0].voucher_no.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        nextSeq = lastSeq + 1;
      }
      const voucherNo = `EXP-${year}-${String(nextSeq).padStart(4, '0')}`;

      // Insert master
      const result = await q(
        'INSERT INTO tbl_expense_vouchers (voucher_no, shop_id, voucher_date, total_amount, account_id, remarks) VALUES (?, ?, ?, ?, ?, ?)',
        [voucherNo, shopId, voucherDate, total, accountId, remarks]
      );
      const voucherId = result.insertId;

      // Insert details
      for (const item of items) {
        if (item.category_id && parseFloat(item.amount) > 0) {
          await q(
            'INSERT INTO tbl_expense_voucher_details (voucher_id, category_id, amount, description) VALUES (?, ?, ?, ?)',
            [voucherId, parseInt(item.category_id), parseFloat(item.amount), item.description || '']
          );
        }
      }

      // Deduct account balance
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [total, accountId]);
      const balanceAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balanceAfter = parseFloat(balanceAfterRows[0]?.current_balance || 0);

      // Insert transaction log
      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'debit', ?, 'expense', ?, ?, ?, ?)`,
        [
          accountId,
          shopId,
          voucherDate,
          total,
          voucherId,
          `খরচ ভাউচার ${voucherNo}`,
          balanceAfter,
          req.user.get('user_id')
        ]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: `খরচ ভাউচার ${voucherNo} সফলভাবে তৈরি হয়েছে।`,
        voucher_id: voucherId
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create expense:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার তৈরিতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Delete expense voucher
   */
  static async deleteExpense(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const voucherRows = await q('SELECT * FROM tbl_expense_vouchers WHERE voucher_id = ?', [id]);
      const voucher = voucherRows[0];

      if (!voucher) {
        throw new Error('ভাউচারটি পাওয়া যায়নি।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          voucher.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ভাউচার ডিলিট করার অনুমতি আপনার নেই।' });
        }
      }

      // Reverse cash/bank account balance
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [
        parseFloat(voucher.total_amount),
        voucher.account_id
      ]);

      // Delete transactions, details & voucher
      await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'expense' AND ref_id = ?", [id]);
      await q('DELETE FROM tbl_expense_voucher_details WHERE voucher_id = ?', [id]);
      await q('DELETE FROM tbl_expense_vouchers WHERE voucher_id = ?', [id]);

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'খরচ ভাউচারটি সফলভাবে ডিলিট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to delete expense:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার ডিলিট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Fetch income vouchers list
   */
  static async getIncomes(req, res) {
    try {
      const role = req.user.get('role');
      const assignedShopIds = [];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        assignedShopIds.push(...userShops.map(s => s.shop_id));
        if (assignedShopIds.length === 0) {
          return res.status(200).json({
            status: 'success',
            data: [],
            totalAmount: 0,
            pagination: { total: 0, pages: 0, page: 1 }
          });
        }
      }

      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let where = 'iv.income_date BETWEEN ? AND ?';
      const params = [from, to];

      if (shopId) {
        if (role === 'manager' && !assignedShopIds.includes(shopId)) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার প্রবেশাধিকার নেই।' });
        }
        where += ' AND iv.shop_id = ?';
        params.push(shopId);
      } else if (role === 'manager') {
        where += ` AND iv.shop_id IN (${assignedShopIds.join(',')})`;
      }

      const countRows = await DB.query(`SELECT COUNT(*) AS total FROM tbl_income_vouchers iv WHERE ${where}`, params);
      const totalRecords = countRows[0]?.total || 0;
      const totalPages = Math.ceil(totalRecords / limit);

      const sumRows = await DB.query(`SELECT SUM(amount) AS total_amount FROM tbl_income_vouchers iv WHERE ${where}`, params);
      const totalAmount = parseFloat(sumRows[0]?.total_amount || 0);

      const vouchers = await DB.query(`
        SELECT iv.*, s.shop_name, a.account_name, ec.category_name
        FROM tbl_income_vouchers iv
        JOIN tbl_shops s ON iv.shop_id = s.shop_id
        LEFT JOIN tbl_accounts a ON iv.account_id = a.account_id
        LEFT JOIN tbl_expense_categories ec ON iv.category_id = ec.category_id
        WHERE ${where}
        ORDER BY iv.income_date DESC, iv.income_id DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return res.status(200).json({
        status: 'success',
        data: vouchers,
        totalAmount,
        pagination: {
          total: totalRecords,
          pages: totalPages,
          page
        }
      });
    } catch (err) {
      console.error('Failed to fetch incomes:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch income list' });
    }
  }

  /**
   * Create income voucher
   */
  static async createIncome(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const accountId = parseInt(req.body.account_id);
      const categoryId = parseInt(req.body.category_id);
      const amount = parseFloat(req.body.amount || 0);
      const incomeDate = req.body.income_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';

      if (!shopId || !accountId || !categoryId || amount <= 0) {
        throw new Error('দোকান, অ্যাকাউন্ট, ক্যাটাগরি এবং সঠিক পরিমাণ প্রদান করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার এন্ট্রি দেওয়ার অনুমতি নেই।' });
        }
      }

      // Generate voucher number
      const year = new Date(incomeDate).getFullYear();
      const prefix = `INC-${year}-%`;
      const lastVouchers = await q(
        'SELECT voucher_no FROM tbl_income_vouchers WHERE voucher_no LIKE ? ORDER BY voucher_no DESC LIMIT 1',
        [prefix]
      );

      let nextSeq = 1;
      if (lastVouchers.length > 0) {
        const parts = lastVouchers[0].voucher_no.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        nextSeq = lastSeq + 1;
      }
      const voucherNo = `INC-${year}-${String(nextSeq).padStart(4, '0')}`;

      // Insert voucher
      const result = await q(
        'INSERT INTO tbl_income_vouchers (voucher_no, shop_id, income_date, category_id, amount, account_id, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [voucherNo, shopId, incomeDate, categoryId, amount, accountId, remarks]
      );
      const incomeId = result.insertId;

      // Credit/add to cash balance
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [amount, accountId]);
      const balanceAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balanceAfter = parseFloat(balanceAfterRows[0]?.current_balance || 0);

      // Insert transaction log
      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'credit', ?, 'income', ?, ?, ?, ?)`,
        [
          accountId,
          shopId,
          incomeDate,
          amount,
          incomeId,
          `ইনকাম ${voucherNo}`,
          balanceAfter,
          req.user.get('user_id')
        ]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: `ইনকাম ভাউচার ${voucherNo} সফলভাবে তৈরি হয়েছে।`,
        income_id: incomeId
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create income:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার তৈরিতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Delete income voucher
   */
  static async deleteIncome(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const voucherRows = await q('SELECT * FROM tbl_income_vouchers WHERE income_id = ?', [id]);
      const voucher = voucherRows[0];

      if (!voucher) {
        throw new Error('ভাউচারটি পাওয়া যায়নি।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          voucher.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ভাউচার ডিলিট করার অনুমতি আপনার নেই।' });
        }
      }

      // Reverse cash/bank balance
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [
        parseFloat(voucher.amount),
        voucher.account_id
      ]);

      // Delete transactions & voucher
      await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'income' AND ref_id = ?", [id]);
      await q('DELETE FROM tbl_income_vouchers WHERE income_id = ?', [id]);

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'ইনকাম ভাউচারটি সফলভাবে ডিলিট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to delete income:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার ডিলিট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update income voucher
   */
  static async updateIncome(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const accountId = parseInt(req.body.account_id);
      const categoryId = parseInt(req.body.category_id);
      const amount = parseFloat(req.body.amount || 0);
      const incomeDate = req.body.income_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || req.body.description || '';

      if (!shopId || !accountId || !categoryId || amount <= 0) {
        throw new Error('দোকান, অ্যাকাউন্ট, ক্যাটাগরি এবং সঠিক পরিমাণ প্রদান করুন।');
      }

      // Fetch existing voucher
      const voucherRows = await q('SELECT * FROM tbl_income_vouchers WHERE income_id = ?', [id]);
      const voucher = voucherRows[0];
      if (!voucher) {
        throw new Error('ইনকাম ভাউচারটি পাওয়া যায়নি।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          voucher.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ভাউচার এডিট করার অনুমতি আপনার নেই।' });
        }
      }

      const oldAmount = parseFloat(voucher.amount);
      const oldAccountId = parseInt(voucher.account_id);

      // 1. Revert old account balance (subtract since it was an income)
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [oldAmount, oldAccountId]);

      // 2. Add new account balance (add since it is an income)
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [amount, accountId]);

      // 3. Update voucher record
      await q(
        'UPDATE tbl_income_vouchers SET shop_id = ?, income_date = ?, category_id = ?, amount = ?, account_id = ?, remarks = ? WHERE income_id = ?',
        [shopId, incomeDate, categoryId, amount, accountId, remarks, id]
      );

      // 4. Delete old transaction log
      await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'income' AND ref_id = ?", [id]);

      // 5. Insert new transaction log
      const balanceAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balanceAfter = parseFloat(balanceAfterRows[0]?.current_balance || 0);

      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'credit', ?, 'income', ?, ?, ?, ?)`,
        [
          accountId,
          shopId,
          incomeDate,
          amount,
          id,
          `ইনকাম ${voucher.voucher_no} (সংশোধিত)`,
          balanceAfter,
          req.user.get('user_id')
        ]
      );

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: `ইনকাম ভাউচার ${voucher.voucher_no} সফলভাবে আপডেট হয়েছে।`
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update income:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার আপডেট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update expense voucher
   */
  static async updateExpense(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const accountId = parseInt(req.body.account_id);
      const voucherDate = req.body.voucher_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';
      const items = req.body.details || []; // [{ category_id, amount, description }]

      if (!shopId || !accountId) {
        throw new Error('দোকান এবং ক্যাশ/ব্যাংক অ্যাকাউন্ট দুটিই নির্বাচন করুন।');
      }

      // Fetch existing voucher
      const voucherRows = await q('SELECT * FROM tbl_expense_vouchers WHERE voucher_id = ?', [id]);
      const voucher = voucherRows[0];
      if (!voucher) {
        throw new Error('খরচ ভাউচারটি পাওয়া যায়নি।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          voucher.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই ভাউচার এডিট করার অনুমতি আপনার নেই।' });
        }
      }

      let total = 0;
      for (const item of items) {
        total += parseFloat(item.amount || 0);
      }

      if (total <= 0) {
        throw new Error('কমপক্ষে একটি খরচের আইটেম যোগ করুন এবং পরিমাণ শূন্যের বেশি হতে হবে।');
      }

      const oldTotal = parseFloat(voucher.total_amount);
      const oldAccountId = parseInt(voucher.account_id);

      // 1. Revert old account balance (add back since it was debited)
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [oldTotal, oldAccountId]);

      // 2. Deduct new account balance (subtract since it is an expense)
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [total, accountId]);

      // 3. Update master voucher
      await q(
        'UPDATE tbl_expense_vouchers SET shop_id = ?, voucher_date = ?, total_amount = ?, account_id = ?, remarks = ? WHERE voucher_id = ?',
        [shopId, voucherDate, total, accountId, remarks, id]
      );

      // 4. Delete old details
      await q('DELETE FROM tbl_expense_voucher_details WHERE voucher_id = ?', [id]);

      // 5. Insert new details
      for (const item of items) {
        if (item.category_id && parseFloat(item.amount) > 0) {
          await q(
            'INSERT INTO tbl_expense_voucher_details (voucher_id, category_id, amount, description) VALUES (?, ?, ?, ?)',
            [id, parseInt(item.category_id), parseFloat(item.amount), item.description || '']
          );
        }
      }

      // 6. Delete old transaction log
      await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'expense' AND ref_id = ?", [id]);

      // 7. Insert new transaction log
      const balanceAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balanceAfter = parseFloat(balanceAfterRows[0]?.current_balance || 0);

      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'debit', ?, 'expense', ?, ?, ?, ?)`,
        [
          accountId,
          shopId,
          voucherDate,
          total,
          id,
          `খরচ ভাউচার ${voucher.voucher_no} (সংশোধিত)`,
          balanceAfter,
          req.user.get('user_id')
        ]
      );

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: `খরচ ভাউচার ${voucher.voucher_no} সফলভাবে আপডেট হয়েছে।`
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update expense:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ভাউচার আপডেট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }
}

module.exports = VoucherController;
