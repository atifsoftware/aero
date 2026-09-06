const DB = require('../../config/db');

class ReportController {
  /**
   * Fetch Account Ledger transaction statement
   */
  static async getLedger(req, res) {
    try {
      const role = req.user.get('role');
      const accountId = parseInt(req.query.account_id);
      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);

      if (!accountId) {
        throw new Error('অ্যাকাউন্ট আইডি প্রদান করুন।');
      }

      let sql = `
        SELECT at.*, s.shop_name
        FROM tbl_account_transactions at
        LEFT JOIN tbl_shops s ON at.shop_id = s.shop_id
        WHERE at.account_id = ? AND at.trans_date BETWEEN ? AND ?
      `;
      const params = [accountId, from, to];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          sql += ` AND at.shop_id IN (${assignedIds.join(',')})`;
        } else {
          sql += ' AND 1 = 0';
        }
      }

      sql += ' ORDER BY at.trans_date DESC, at.trans_id DESC';
      const transactions = await DB.query(sql, params);

      return res.status(200).json({
        status: 'success',
        data: transactions
      });
    } catch (err) {
      console.error('Failed to generate ledger report:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'লেজার স্টেটমেন্ট লোড করতে ব্যর্থতা' });
    }
  }

  /**
   * Fetch Daily Cash and Bank Book summary for all accounts
   */
  static async getDailyCashBook(req, res) {
    try {
      const date = req.query.date || new Date().toISOString().substring(0, 10);
      const accounts = await DB.query('SELECT account_id, account_name, account_type FROM tbl_accounts WHERE is_active = 1');

      const reportData = [];
      for (const acc of accounts) {
        const accId = acc.account_id;

        // Opening Balance: Last transaction balance before this date
        const openingRows = await DB.query(
          'SELECT balance_after FROM tbl_account_transactions WHERE account_id = ? AND trans_date < ? ORDER BY trans_date DESC, trans_id DESC LIMIT 1',
          [accId, date]
        );
        const openingBalance = parseFloat(openingRows[0]?.balance_after || 0);

        // Daily Transactions
        const transactions = await DB.query(`
          SELECT at.*, s.shop_name
          FROM tbl_account_transactions at
          LEFT JOIN tbl_shops s ON at.shop_id = s.shop_id
          WHERE at.account_id = ? AND at.trans_date = ?
          ORDER BY at.trans_id ASC
        `, [accId, date]);

        let totalIn = 0;
        let totalOut = 0;
        for (const t of transactions) {
          if (t.trans_type === 'credit') totalIn += parseFloat(t.amount || 0);
          else totalOut += parseFloat(t.amount || 0);
        }

        reportData.push({
          account: acc,
          opening: openingBalance,
          transactions,
          total_in: totalIn,
          total_out: totalOut,
          closing: openingBalance + totalIn - totalOut
        });
      }

      return res.status(200).json({
        status: 'success',
        date,
        data: reportData
      });
    } catch (err) {
      console.error('Failed to generate daily cash book:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to generate cashbook report' });
    }
  }

  /**
   * Monthly category-wise and employee-wise expense report
   */
  static async getExpenseReport(req, res) {
    try {
      const role = req.user.get('role');
      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);

      let shopsSql = "SELECT shop_id, shop_name FROM tbl_shops WHERE is_active=1";
      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          shopsSql += ` AND shop_id IN (${assignedIds.join(',')})`;
        } else {
          shopsSql += ` AND 1 = 0`;
        }
      }
      shopsSql += " ORDER BY sort_order ASC, shop_name ASC";
      const shops = await DB.query(shopsSql);

      const reportData = [];
      for (const shop of shops) {
        const shopId = shop.shop_id;
        const items = [];

        // 1. Salaries
        const employees = await DB.query(`
          SELECT e.employee_id, e.emp_name, es.allocated_salary as monthly_salary,
                 COALESCE(SUM(sr.paid_amount), 0) as actual_paid
          FROM tbl_employees e
          JOIN tbl_employee_shop es ON e.employee_id = es.employee_id
          LEFT JOIN tbl_salary_records sr ON e.employee_id = sr.employee_id 
               AND sr.shop_id = ?
               AND sr.payment_date BETWEEN ? AND ?
          WHERE e.is_active = 1 AND es.shop_id = ? AND es.is_active = 1
          GROUP BY e.employee_id
        `, [shopId, from, to, shopId]);

        for (const emp of employees) {
          items.push({
            subject: emp.emp_name,
            potential: parseFloat(emp.monthly_salary || 0),
            actual: parseFloat(emp.actual_paid || 0)
          });
        }

        // 2. Fixed Expenses (Templates)
        const templates = await DB.query(`
          SELECT t.template_name, t.amount as budget_amount,
                 COALESCE(SUM(evd.amount), 0) as actual_spent
          FROM tbl_expense_templates t
          LEFT JOIN tbl_expense_vouchers ev ON t.shop_id = ev.shop_id AND ev.voucher_date BETWEEN ? AND ?
          LEFT JOIN tbl_expense_voucher_details evd ON ev.voucher_id = evd.voucher_id 
               AND evd.category_id = t.category_id AND evd.description = t.template_name
          WHERE t.shop_id = ?
          GROUP BY t.template_id
        `, [from, to, shopId]);

        for (const tmpl of templates) {
          items.push({
            subject: tmpl.template_name,
            potential: parseFloat(tmpl.budget_amount || 0),
            actual: parseFloat(tmpl.actual_spent || 0)
          });
        }

        // 3. Other Expenses
        const others = await DB.query(`
          SELECT ec.category_name, SUM(evd.amount) as actual_spent
          FROM tbl_expense_voucher_details evd
          JOIN tbl_expense_vouchers ev ON evd.voucher_id = ev.voucher_id
          JOIN tbl_expense_categories ec ON evd.category_id = ec.category_id
          WHERE ev.shop_id = ? AND ev.voucher_date BETWEEN ? AND ?
          AND ec.is_salary_type = 0
          AND evd.description NOT IN (SELECT template_name FROM tbl_expense_templates WHERE shop_id = ?)
          GROUP BY ec.category_id
        `, [shopId, from, to, shopId]);

        for (const other of others) {
          items.push({
            subject: other.category_name,
            potential: 0,
            actual: parseFloat(other.actual_spent || 0)
          });
        }

        reportData.push({
          shop,
          items,
          total: items.reduce((acc, item) => acc + item.actual, 0)
        });
      }

      return res.status(200).json({
        status: 'success',
        from,
        to,
        data: reportData
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Failed to generate expense report' });
    }
  }

  /**
   * Monthly category-wise and template-wise income report
   */
  static async getIncomeReport(req, res) {
    try {
      const role = req.user.get('role');
      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);

      let shopsSql = "SELECT shop_id, shop_name FROM tbl_shops WHERE is_active=1";
      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          shopsSql += ` AND shop_id IN (${assignedIds.join(',')})`;
        } else {
          shopsSql += ` AND 1 = 0`;
        }
      }
      shopsSql += " ORDER BY sort_order ASC, shop_name ASC";
      const shops = await DB.query(shopsSql);

      const reportData = [];
      for (const shop of shops) {
        const shopId = shop.shop_id;
        const items = [];

        // 1. Income Templates
        const templates = await DB.query(`
          SELECT t.template_name, t.amount as budget_amount,
                 COALESCE(SUM(iv.amount), 0) as actual_received
          FROM tbl_income_templates t
          LEFT JOIN tbl_income_vouchers iv ON t.shop_id = iv.shop_id 
               AND iv.income_date BETWEEN ? AND ?
               AND iv.remarks = t.template_name
          WHERE t.shop_id = ?
          GROUP BY t.template_id
        `, [from, to, shopId]);

        for (const tmpl of templates) {
          items.push({
            subject: tmpl.template_name,
            potential: parseFloat(tmpl.budget_amount || 0),
            actual: parseFloat(tmpl.actual_received || 0)
          });
        }

        // 2. Other Incomes
        const others = await DB.query(`
          SELECT ec.category_name, SUM(iv.amount) as actual_received
          FROM tbl_income_vouchers iv
          JOIN tbl_expense_categories ec ON iv.category_id = ec.category_id
          WHERE iv.shop_id = ? AND iv.income_date BETWEEN ? AND ?
          AND (iv.remarks IS NULL OR iv.remarks NOT IN (SELECT template_name FROM tbl_income_templates WHERE shop_id = ?))
          GROUP BY ec.category_id
        `, [shopId, from, to, shopId]);

        for (const other of others) {
          items.push({
            subject: other.category_name,
            potential: 0,
            actual: parseFloat(other.actual_received || 0)
          });
        }

        reportData.push({
          shop,
          items,
          total: items.reduce((acc, item) => acc + item.actual, 0)
        });
      }

      return res.status(200).json({
        status: 'success',
        from,
        to,
        data: reportData
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Failed to generate income report' });
    }
  }

  /**
   * Monthly salary sheet status report for employees
   */
  static async getSalarySheetReport(req, res) {
    try {
      const role = req.user.get('role');
      const month = req.query.month || new Date().toISOString().substring(0, 7);
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;

      let sql = `
        SELECT e.employee_id, e.emp_name, e.emp_code, s.shop_name,
               e.monthly_salary as fixed_salary,
               COALESCE(sr.gross_salary, e.monthly_salary) as gross_salary,
               COALESCE(sr.bonus_amount, 0) as bonus_amount,
               COALESCE(sr.salary_adv_deduction, (
                   SELECT COALESCE(SUM(advance_amount), 0)
                   FROM tbl_salary_advances
                   WHERE employee_id = e.employee_id
                     AND advance_month = ?
                     AND is_deducted = 0
               )) as advance_deduction,
               COALESCE(sr.loan_deduction, 0) as loan_deduction, 
               sr.net_payable, sr.paid_amount, sr.payment_date,
               sr.salary_id
        FROM tbl_employees e
        JOIN tbl_employee_shop es ON e.employee_id = es.employee_id AND es.is_active = 1
        JOIN tbl_shops s ON es.shop_id = s.shop_id
        LEFT JOIN tbl_salary_records sr ON e.employee_id = sr.employee_id 
             AND sr.shop_id = es.shop_id
             AND sr.salary_month = ?
        WHERE e.is_active = 1
      `;

      const monthStart = month + '-01';
      const params = [monthStart, monthStart];

      if (shopId) {
        sql += ` AND es.shop_id = ?`;
        params.push(shopId);
      } else if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          sql += ` AND es.shop_id IN (${assignedIds.join(',')})`;
        } else {
          sql += ` AND 1 = 0`;
        }
      }

      sql += ` ORDER BY s.sort_order ASC, s.shop_name ASC, e.emp_name ASC`;
      const records = await DB.query(sql, params);

      return res.status(200).json({
        status: 'success',
        month,
        data: records
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Failed to generate salary sheet report' });
    }
  }

  /**
   * Employee advance and loan reports
   */
  static async getAdvanceReport(req, res) {
    try {
      const role = req.user.get('role');
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id) : null;

      let advances = [];
      if (employeeId) {
        advances = await DB.query(`
          SELECT ea.*, s.shop_name, ea.advance_amount as amount
          FROM tbl_employee_advances ea
          JOIN tbl_shops s ON ea.shop_id = s.shop_id
          WHERE ea.employee_id = ?
          ORDER BY ea.advance_date DESC
        `, [employeeId]);
      } else {
        let sql = `
          SELECT e.emp_name, e.emp_code, s.shop_name,
                 SUM(ea.advance_amount) as total_taken,
                 SUM(ea.total_repaid) as total_repaid
          FROM tbl_employee_advances ea
          JOIN tbl_employees e ON ea.employee_id = e.employee_id
          JOIN tbl_shops s ON ea.shop_id = s.shop_id
        `;
        if (role === 'manager') {
          const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
          const assignedIds = userShops.map(s => s.shop_id);
          if (assignedIds.length > 0) {
            sql += ` WHERE ea.shop_id IN (${assignedIds.join(',')})`;
          } else {
            sql += ` WHERE 1 = 0`;
          }
        }
        sql += ` GROUP BY e.employee_id, s.shop_id ORDER BY e.emp_name ASC`;
        advances = await DB.query(sql);
      }

      return res.status(200).json({
        status: 'success',
        data: advances
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Failed to load loan report data' });
    }
  }

  /**
   * Annual category-wise expense matrix analysis
   */
  static async getAnnualExpenseReport(req, res) {
    try {
      const role = req.user.get('role');
      const year = req.query.year || new Date().getFullYear().toString();
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;

      const categories = await DB.query("SELECT category_id, category_name FROM tbl_expense_categories WHERE category_type='expense' AND is_active=1 ORDER BY sort_order ASC");

      const reportData = [];
      // 1. Expense Categories
      for (const cat of categories) {
        const catId = cat.category_id;
        const monthlyData = {};
        for (let m = 1; m <= 12; m++) {
          let sql = `
            SELECT SUM(evd.amount) as amt
            FROM tbl_expense_voucher_details evd
            JOIN tbl_expense_vouchers ev ON evd.voucher_id = ev.voucher_id
            WHERE evd.category_id = ? AND YEAR(ev.voucher_date) = ? AND MONTH(ev.voucher_date) = ?
          `;
          const params = [catId, year, m];
          if (shopId) {
            sql += " AND ev.shop_id = ?";
            params.push(shopId);
          } else if (role === 'manager') {
            const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
            const assignedIds = userShops.map(s => s.shop_id);
            if (assignedIds.length > 0) {
              sql += ` AND ev.shop_id IN (${assignedIds.join(',')})`;
            } else {
              sql += ` AND 1 = 0`;
            }
          }

          const rows = await DB.query(sql, params);
          monthlyData[m] = parseFloat(rows[0]?.amt || 0);
        }

        const values = Object.values(monthlyData);
        reportData.push({
          name: cat.category_name,
          months: monthlyData,
          total: values.reduce((sum, v) => sum + v, 0),
          is_salary: false
        });
      }

      // 2. Salaries
      const salaryData = {};
      for (let m = 1; m <= 12; m++) {
        let sql = `SELECT SUM(paid_amount) as amt FROM tbl_salary_records WHERE YEAR(payment_date) = ? AND MONTH(payment_date) = ?`;
        const params = [year, m];
        if (shopId) {
          sql += " AND shop_id = ?";
          params.push(shopId);
        } else if (role === 'manager') {
          const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
          const assignedIds = userShops.map(s => s.shop_id);
          if (assignedIds.length > 0) {
            sql += ` AND shop_id IN (${assignedIds.join(',')})`;
          } else {
            sql += ` AND 1 = 0`;
          }
        }
        const rows = await DB.query(sql, params);
        salaryData[m] = parseFloat(rows[0]?.amt || 0);
      }

      const values = Object.values(salaryData);
      reportData.push({
        name: 'কর্মচারী বেতন',
        months: salaryData,
        total: values.reduce((sum, v) => sum + v, 0),
        is_salary: true
      });

      return res.status(200).json({
        status: 'success',
        year,
        data: reportData
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Failed to load annual expense report' });
    }
  }
}

module.exports = ReportController;
