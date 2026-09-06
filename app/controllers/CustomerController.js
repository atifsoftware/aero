const DB = require('../../config/db');

class CustomerController {
  /**
   * Helper to recalculate running balance and current due of a customer
   */
  static async recalculateLedger(customerId, connection) {
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    const customerRows = await q('SELECT opening_balance FROM tbl_customers WHERE customer_id = ?', [customerId]);
    if (customerRows.length === 0) return;

    let runningBalance = parseFloat(customerRows[0].opening_balance || 0);

    const transactions = await q(
      'SELECT ledger_id, debit_amount, credit_amount FROM tbl_customer_ledger WHERE customer_id = ? ORDER BY trans_date ASC, ledger_id ASC',
      [customerId]
    );

    for (const t of transactions) {
      runningBalance += parseFloat(t.debit_amount || 0) - parseFloat(t.credit_amount || 0);
      await q('UPDATE tbl_customer_ledger SET balance_after = ? WHERE ledger_id = ?', [runningBalance, t.ledger_id]);
    }

    await q('UPDATE tbl_customers SET current_due = ? WHERE customer_id = ?', [runningBalance, customerId]);
  }

  /**
   * Fetch customer list
   */
  static async index(req, res) {
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
            totalDue: 0,
            pagination: { total: 0, pages: 0, page: 1 }
          });
        }
      }

      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const search = (req.query.search || '').trim();
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

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

      if (search !== '') {
        where += ' AND (c.customer_name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ?)';
        const searchVal = `%${search}%`;
        params.push(searchVal, searchVal, searchVal);
      }

      // Counts
      const countRows = await DB.query(`SELECT COUNT(*) AS total FROM tbl_customers c WHERE ${where}`, params);
      const totalRecords = countRows[0]?.total || 0;
      const totalPages = Math.ceil(totalRecords / limit);

      const sumRows = await DB.query(`SELECT SUM(current_due) AS total_due FROM tbl_customers c WHERE ${where}`, params);
      const totalDue = parseFloat(sumRows[0]?.total_due || 0);

      const customers = await DB.query(`
        SELECT c.*, s.shop_name
        FROM tbl_customers c
        JOIN tbl_shops s ON c.shop_id = s.shop_id
        WHERE ${where}
        ORDER BY c.customer_name ASC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return res.status(200).json({
        status: 'success',
        data: customers,
        totalDue,
        pagination: {
          total: totalRecords,
          pages: totalPages,
          page
        }
      });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch customer list' });
    }
  }

  /**
   * View customer profile details
   */
  static async show(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const customer = await DB.query(`
        SELECT c.*, s.shop_name
        FROM tbl_customers c
        JOIN tbl_shops s ON c.shop_id = s.shop_id
        WHERE c.customer_id = ?
      `, [id]);

      if (customer.length === 0) {
        return res.status(404).json({ status: 'error', message: 'কাস্টমার পাওয়া যায়নি।' });
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          customer[0].shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই কাস্টমারের তথ্য দেখার অনুমতি নেই।' });
        }
      }

      return res.status(200).json({
        status: 'success',
        data: customer[0]
      });
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch details' });
    }
  }

  /**
   * Create customer
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
      const name = (req.body.customer_name || '').trim();
      const phone = (req.body.phone || '').trim();
      const address = (req.body.address || '').trim();
      const openingBalance = parseFloat(req.body.opening_balance || 0);

      if (!shopId || !name) {
        throw new Error('দোকান এবং কাস্টমারের নাম প্রদান করা আবশ্যক।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে কাস্টমার যুক্ত করার অনুমতি নেই।' });
        }
      }

      // Insert customer with temporary code
      const result = await q(
        'INSERT INTO tbl_customers (shop_id, customer_name, phone, address, opening_balance, current_due) VALUES (?, ?, ?, ?, ?, ?)',
        [shopId, name, phone, address, openingBalance, openingBalance]
      );
      const customerId = result.insertId;
      const code = `CUST-${String(customerId).padStart(4, '0')}`;

      // Update code
      await q('UPDATE tbl_customers SET customer_code = ? WHERE customer_id = ?', [code, customerId]);

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'কাস্টমার সফলভাবে তৈরি করা হয়েছে।',
        customer_id: customerId,
        customer_code: code
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create customer:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'কাস্টমার তৈরিতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update customer profile
   */
  static async update(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const name = (req.body.customer_name || '').trim();
      const phone = (req.body.phone || '').trim();
      const address = (req.body.address || '').trim();
      const openingBalance = parseFloat(req.body.opening_balance || 0);

      if (!shopId || !name) {
        throw new Error('দোকান এবং কাস্টমারের নাম প্রদান করা আবশ্যক।');
      }

      const customerRows = await q('SELECT * FROM tbl_customers WHERE customer_id = ?', [id]);
      if (customerRows.length === 0) {
        throw new Error('কাস্টমারটি পাওয়া যায়নি।');
      }
      const customer = customerRows[0];

      if (role === 'manager') {
        // Check access to old shop
        const oldAccess = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [req.user.get('user_id'), customer.shop_id]);
        // Check access to new shop
        const newAccess = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [req.user.get('user_id'), shopId]);
        if (oldAccess.length === 0 || newAccess.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে কাস্টমার পরিবর্তনের অনুমতি নেই।' });
        }
      }

      await q(
        'UPDATE tbl_customers SET shop_id = ?, customer_name = ?, phone = ?, address = ?, opening_balance = ? WHERE customer_id = ?',
        [shopId, name, phone, address, openingBalance, id]
      );

      // Recalculate ledger if opening balance has changed
      if (parseFloat(customer.opening_balance) !== openingBalance) {
        await CustomerController.recalculateLedger(id, connection);
      } else {
        await CustomerController.recalculateLedger(id, connection);
      }

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'কাস্টমার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update customer:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'আপডেট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Fetch customer ledger transactions
   */
  static async getLedger(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const customerRows = await DB.query('SELECT * FROM tbl_customers WHERE customer_id = ?', [id]);
      if (customerRows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'কাস্টমার পাওয়া যায়নি।' });
      }
      const customer = customerRows[0];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          customer.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই কাস্টমারের লেজার দেখার অনুমতি নেই।' });
        }
      }

      const transactions = await DB.query(`
        SELECT cl.*, a.account_name
        FROM tbl_customer_ledger cl
        LEFT JOIN tbl_accounts a ON cl.account_id = a.account_id
        WHERE cl.customer_id = ?
        ORDER BY cl.trans_date ASC, cl.ledger_id ASC
      `, [id]);

      return res.status(200).json({
        status: 'success',
        customer,
        data: transactions
      });
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch ledger entries' });
    }
  }

  /**
   * Add transaction to customer ledger
   */
  static async addTransaction(req, res) {
    const id = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const customerRows = await q('SELECT * FROM tbl_customers WHERE customer_id = ?', [id]);
      if (customerRows.length === 0) {
        throw new Error('কাস্টমার ইনভ্যালিড।');
      }
      const customer = customerRows[0];
      const shopId = customer.shop_id;

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে লেনদেন যোগ করার অনুমতি নেই।' });
        }
      }

      const transDate = req.body.trans_date || new Date().toISOString().substring(0, 10);
      const particulars = (req.body.particulars || '').trim();
      const type = req.body.type; // 'debit' = sale/due, 'credit' = payment received
      const amount = parseFloat(req.body.amount || 0);
      const accountId = req.body.account_id ? parseInt(req.body.account_id) : null;

      if (amount <= 0 || !particulars || !type) {
        throw new Error('টাকার পরিমাণ, বিবরণ এবং ধরণ প্রদান করুন।');
      }

      let debit = 0;
      let credit = 0;

      if (type === 'debit') {
        debit = amount;
      } else {
        credit = amount;
        if (!accountId) {
          throw new Error('টাকা জমার জন্য ক্যাশ বা ব্যাংক হিসাব সিলেক্ট করুন।');
        }
      }

      const currentDue = parseFloat(customer.current_due || 0);
      const balanceAfter = currentDue + debit - credit;

      // Insert Ledger Row
      const result = await q(
        `INSERT INTO tbl_customer_ledger 
         (customer_id, shop_id, trans_date, particulars, debit_amount, credit_amount, balance_after, account_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, shopId, transDate, particulars, debit, credit, balanceAfter, accountId, req.user.get('user_id')]
      );
      const ledgerId = result.insertId;

      // Update customer due directly (or run recalculate for safety)
      await q('UPDATE tbl_customers SET current_due = ? WHERE customer_id = ?', [balanceAfter, id]);

      // If credit/received payment, update accounts
      if (type === 'credit' && accountId) {
        await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [amount, accountId]);
        const balanceAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
        const accBalanceAfter = parseFloat(balanceAfterRows[0]?.current_balance || 0);

        await q(
          `INSERT INTO tbl_account_transactions 
           (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
           VALUES (?, ?, ?, 'credit', ?, 'customer_payment', ?, ?, ?, ?)`,
          [
            accountId,
            shopId,
            transDate,
            amount,
            ledgerId,
            `কাস্টমার পেমেন্ট: ${customer.customer_name}`,
            accBalanceAfter,
            req.user.get('user_id')
          ]
        );
      }

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'লেনদেন সফলভাবে যোগ করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to add customer transaction:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'লেনদেন যোগ করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Delete customer ledger transaction
   */
  static async deleteTransaction(req, res) {
    const ledgerId = parseInt(req.params.ledgerId);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const transactionRows = await q('SELECT * FROM tbl_customer_ledger WHERE ledger_id = ?', [ledgerId]);
      if (transactionRows.length === 0) {
        throw new Error('লেনদেন পাওয়া যায়নি।');
      }
      const transaction = transactionRows[0];
      const customerId = transaction.customer_id;
      const shopId = transaction.shop_id;

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে লেনদেন ডিলিট করার অনুমতি নেই।' });
        }
      }

      // If it was payment (credit), reverse central account balance & transaction
      if (parseFloat(transaction.credit_amount) > 0 && transaction.account_id) {
        const accountId = transaction.account_id;
        const amt = parseFloat(transaction.credit_amount);

        await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [amt, accountId]);
        await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'customer_payment' AND ref_id = ?", [ledgerId]);
      }

      // Delete ledger entry
      await q('DELETE FROM tbl_customer_ledger WHERE ledger_id = ?', [ledgerId]);

      // Recalculate
      await CustomerController.recalculateLedger(customerId, connection);

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'লেনদেনটি সফলভাবে ডিলিট করা হয়েছে এবং ব্যালেন্স রিক্যালকুলেট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to delete customer transaction:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'লেনদেন ডিলিট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }
}

module.exports = CustomerController;
