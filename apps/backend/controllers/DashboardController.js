const DB = require('../config/db');

class DashboardController {
  /**
   * Get main dashboard statistics summary
   */
  static async summary(req, res) {
    try {
      const user = req.user;
      const role = user.get('role');
      
      let allowedShops = [];
      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [user.get('user_id')]);
        allowedShops = userShops.map(s => s.shop_id);
        if (allowedShops.length === 0) {
          // No shops assigned, return zero summary
          return res.status(200).json({
            status: 'success',
            data: {
              totalExpense: 0,
              totalIncome: 0,
              totalSalary: 0,
              totalAdvanceBalance: 0,
              totalCash: 0,
              totalBank: 0,
              totalEmployees: 0,
              totalShops: 0
            }
          });
        }
      }

      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      
      let shopFilter = '';
      let params = [];

      if (shopId) {
        if (role === 'manager' && !allowedShops.includes(shopId)) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানের তথ্য দেখার অনুমতি আপনার নেই।' });
        }
        shopFilter = 'AND shop_id = ?';
        params = [shopId];
      } else if (role === 'manager') {
        shopFilter = `AND shop_id IN (${allowedShops.join(',')})`;
      }

      // 1. Total Expense (Current Month)
      const totalExpenseRows = await DB.query(`
        SELECT COALESCE(SUM(total_amount), 0) AS val
        FROM tbl_expense_vouchers
        WHERE MONTH(voucher_date) = MONTH(CURDATE())
          AND YEAR(voucher_date)  = YEAR(CURDATE())
          ${shopFilter}
      `, params);
      const totalExpense = parseFloat(totalExpenseRows[0]?.val || 0);

      // 2. Total Income/Withdrawal (Current Month)
      const totalIncomeRows = await DB.query(`
        SELECT COALESCE(SUM(amount), 0) AS val
        FROM tbl_income_vouchers
        WHERE MONTH(income_date) = MONTH(CURDATE())
          AND YEAR(income_date)  = YEAR(CURDATE())
          ${shopFilter}
      `, params);
      const totalIncome = parseFloat(totalIncomeRows[0]?.val || 0);

      // 3. Total Salary Paid (Current Month)
      const totalSalaryRows = await DB.query(`
        SELECT COALESCE(SUM(paid_amount), 0) AS val
        FROM tbl_salary_records
        WHERE MONTH(payment_date) = MONTH(CURDATE())
          AND YEAR(payment_date)  = YEAR(CURDATE())
          ${shopFilter}
      `, params);
      const totalSalary = parseFloat(totalSalaryRows[0]?.val || 0);

      // 4. Total Employee Outstanding Advances/Loans
      const totalAdvanceRows = await DB.query(`
        SELECT COALESCE(SUM(balance_amount), 0) AS val
        FROM tbl_employee_advances
        WHERE status = 'active'
          ${shopFilter}
      `, params);
      const totalAdvanceBalance = parseFloat(totalAdvanceRows[0]?.val || 0);

      // 5. Central Account Balances (Cash & Bank)
      const totalCashRows = await DB.query(`
        SELECT COALESCE(SUM(current_balance), 0) AS val
        FROM tbl_accounts
        WHERE is_active = 1 AND account_type = 'cash'
      `);
      const totalCash = parseFloat(totalCashRows[0]?.val || 0);

      const totalBankRows = await DB.query(`
        SELECT COALESCE(SUM(current_balance), 0) AS val
        FROM tbl_accounts
        WHERE is_active = 1 AND account_type = 'bank'
      `);
      const totalBank = parseFloat(totalBankRows[0]?.val || 0);

      // 6. Total Active Employees Count (Filtered by shop for manager)
      let totalEmployees = 0;
      if (role === 'manager') {
        const totalEmployeeRows = await DB.query(`
          SELECT COUNT(DISTINCT e.employee_id) AS val 
          FROM tbl_employees e
          JOIN tbl_employee_shop es ON e.employee_id = es.employee_id
          WHERE e.is_active = 1 AND es.shop_id IN (${allowedShops.join(',')})
        `);
        totalEmployees = parseInt(totalEmployeeRows[0]?.val || 0);
      } else {
        const totalEmployeeRows = await DB.query(`
          SELECT COUNT(*) AS val FROM tbl_employees WHERE is_active = 1
        `);
        totalEmployees = parseInt(totalEmployeeRows[0]?.val || 0);
      }

      // 7. Total Active Shops Count (Manager only sees assigned ones)
      const totalShops = role === 'admin' ? 
        parseInt((await DB.query(`SELECT COUNT(*) AS val FROM tbl_shops WHERE is_active = 1`))[0]?.val || 0) : 
        allowedShops.length;

      return res.status(200).json({
        status: 'success',
        data: {
          totalExpense,
          totalIncome,
          totalSalary,
          totalAdvanceBalance,
          totalCash,
          totalBank,
          totalEmployees,
          totalShops
        }
      });
    } catch (err) {
      console.error('Failed to generate dashboard summary:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to generate summary statistics' });
    }
  }

  /**
   * Get recent expense vouchers
   */
  static async recentExpenses(req, res) {
    try {
      const user = req.user;
      const role = user.get('role');
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      
      let shopFilter = '';
      let params = [limit];

      if (role !== 'admin') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [user.get('user_id')]);
        const allowedShops = userShops.map(s => s.shop_id);
        if (allowedShops.length === 0) {
          return res.status(200).json({ status: 'success', data: [] });
        }
        shopFilter = `AND ev.shop_id IN (${allowedShops.join(',')})`;
      }

      const recentExpenses = await DB.query(`
        SELECT ev.voucher_id, ev.voucher_no, ev.voucher_date, ev.total_amount,
               s.shop_name
        FROM tbl_expense_vouchers ev
        JOIN tbl_shops s ON ev.shop_id = s.shop_id
        WHERE 1=1 ${shopFilter}
        ORDER BY ev.voucher_date DESC, ev.voucher_id DESC
        LIMIT ?
      `, params);

      return res.status(200).json({
        status: 'success',
        data: recentExpenses
      });
    } catch (err) {
      console.error('Failed to fetch recent expenses:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch recent expenses' });
    }
  }

  /**
   * Get recent salary payments
   */
  static async recentSalaries(req, res) {
    try {
      const user = req.user;
      const role = user.get('role');
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      
      let shopFilter = '';
      let params = [limit];

      if (role !== 'admin') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [user.get('user_id')]);
        const allowedShops = userShops.map(s => s.shop_id);
        if (allowedShops.length === 0) {
          return res.status(200).json({ status: 'success', data: [] });
        }
        shopFilter = `AND sr.shop_id IN (${allowedShops.join(',')})`;
      }

      const recentSalaries = await DB.query(`
        SELECT sr.salary_id, sr.salary_month, sr.paid_amount, sr.status,
               e.emp_name, s.shop_name
        FROM tbl_salary_records sr
        JOIN tbl_employees e ON sr.employee_id = e.employee_id
        JOIN tbl_shops     s ON sr.shop_id     = s.shop_id
        WHERE 1=1 ${shopFilter}
        ORDER BY sr.payment_date DESC, sr.salary_id DESC
        LIMIT ?
      `, params);

      return res.status(200).json({
        status: 'success',
        data: recentSalaries
      });
    } catch (err) {
      console.error('Failed to fetch recent salaries:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch recent salaries' });
    }
  }

  /**
   * Get shop wise consolidated summary (from SQL View)
   */
  static async shopSummary(req, res) {
    try {
      const user = req.user;
      const role = user.get('role');
      
      let shopFilter = '';

      if (role !== 'admin') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [user.get('user_id')]);
        const allowedShops = userShops.map(s => s.shop_id);
        if (allowedShops.length === 0) {
          return res.status(200).json({ status: 'success', data: [] });
        }
        shopFilter = `WHERE shop_id IN (${allowedShops.join(',')})`;
      }

      const shopWiseSummary = await DB.query(`
        SELECT * FROM v_shop_income_expense_summary
        ${shopFilter}
        ORDER BY sort_order ASC, shop_name ASC
      `);

      return res.status(200).json({
        status: 'success',
        data: shopWiseSummary
      });
    } catch (err) {
      console.error('Failed to fetch shop-wise summary:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch shop-wise summary' });
    }
  }
}

module.exports = DashboardController;
