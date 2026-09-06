const DB = require('../../config/db');

class EmployeeController {
  /**
   * Fetch employees list
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
        where += ' AND e.employee_id IN (SELECT employee_id FROM tbl_employee_shop WHERE shop_id = ? AND is_active = 1)';
        params.push(shopId);
      } else if (role === 'manager') {
        where += ` AND e.employee_id IN (SELECT employee_id FROM tbl_employee_shop WHERE shop_id IN (${assignedShopIds.join(',')}) AND is_active = 1)`;
      }

      const employees = await DB.query(`
        SELECT e.*,
               GROUP_CONCAT(DISTINCT s.shop_name ORDER BY s.shop_name SEPARATOR ', ') AS shop_names,
               GROUP_CONCAT(DISTINCT es.shop_id SEPARATOR ',') AS shop_ids,
               COALESCE(adv.balance_amount, 0) AS advance_balance
        FROM tbl_employees e
        LEFT JOIN tbl_employee_shop es ON e.employee_id = es.employee_id AND es.is_active = 1
        LEFT JOIN tbl_shops s ON es.shop_id = s.shop_id
        LEFT JOIN (
            SELECT employee_id, SUM(balance_amount) AS balance_amount
            FROM tbl_employee_advances WHERE status = 'active'
            GROUP BY employee_id
        ) adv ON e.employee_id = adv.employee_id
        WHERE ${where}
        GROUP BY e.employee_id
        ORDER BY e.is_active DESC, e.emp_name ASC
      `, params);

      return res.status(200).json({
        status: 'success',
        data: employees
      });
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch employee list' });
    }
  }

  /**
   * Fetch single employee profile and details
   */
  static async show(req, res) {
    try {
      const id = parseInt(req.params.id);
      const role = req.user.get('role');

      const employeeRows = await DB.query('SELECT * FROM tbl_employees WHERE employee_id = ?', [id]);
      if (employeeRows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'কর্মচারী পাওয়া যায়নি।' });
      }
      const employee = employeeRows[0];

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);

        const hasAccess = await DB.query(
          `SELECT COUNT(*) AS count FROM tbl_employee_shop WHERE employee_id = ? AND shop_id IN (${assignedIds.join(',')}) AND is_active = 1`,
          [id]
        );
        if (hasAccess[0]?.count === 0) {
          return res.status(403).json({ status: 'error', message: 'এই কর্মচারীর তথ্য দেখার অনুমতি নেই।' });
        }
      }

      const assignments = await DB.query(`
        SELECT es.*, s.shop_name
        FROM tbl_employee_shop es
        JOIN tbl_shops s ON es.shop_id = s.shop_id
        WHERE es.employee_id = ? AND es.is_active = 1
      `, [id]);

      const salaryHistory = await DB.query(`
        SELECT sr.*, s.shop_name
        FROM tbl_salary_records sr
        JOIN tbl_shops s ON sr.shop_id = s.shop_id
        WHERE sr.employee_id = ?
        ORDER BY sr.salary_month DESC LIMIT 12
      `, [id]);

      const advances = await DB.query(`
        SELECT ea.*, s.shop_name
        FROM tbl_employee_advances ea
        JOIN tbl_shops s ON ea.shop_id = s.shop_id
        WHERE ea.employee_id = ?
        ORDER BY ea.advance_date DESC
      `, [id]);

      const salaryAdvances = await DB.query(`
        SELECT sa.*, s.shop_name
        FROM tbl_salary_advances sa
        JOIN tbl_shops s ON sa.shop_id = s.shop_id
        WHERE sa.employee_id = ?
        ORDER BY sa.advance_date DESC
      `, [id]);

      return res.status(200).json({
        status: 'success',
        data: {
          ...employee,
          assignments,
          salaryHistory,
          advances,
          salaryAdvances
        }
      });
    } catch (err) {
      console.error('Failed to fetch employee details:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch details' });
    }
  }

  /**
   * Create employee
   */
  static async create(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const name = (req.body.emp_name || '').trim();
      const code = (req.body.emp_code || '').trim().toUpperCase();
      const phone = (req.body.phone || '').trim();
      const nid = (req.body.nid || '').trim();
      const designation = (req.body.designation || '').trim();
      const joinDate = req.body.join_date || null;
      const monthlySalary = parseFloat(req.body.monthly_salary || 0);
      const shopAssignments = req.body.assignments || []; // [{ shop_id, allocated_salary }]

      if (!name || !code) {
        throw new Error('কর্মচারীর নাম এবং কোড প্রদান করা আবশ্যক।');
      }

      // Check code uniqueness
      const existing = await q('SELECT employee_id FROM tbl_employees WHERE emp_code = ?', [code]);
      if (existing.length > 0) {
        throw new Error('এই কোডের কর্মচারী ইতিমধ্যে বিদ্যমান রয়েছে।');
      }

      const result = await q(
        `INSERT INTO tbl_employees 
         (emp_name, emp_code, phone, nid, designation, join_date, monthly_salary, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, code, phone, nid, designation, joinDate, monthlySalary]
      );
      const empId = result.insertId;

      // Assign shops
      for (const assign of shopAssignments) {
        const sid = parseInt(assign.shop_id);
        const sal = parseFloat(assign.allocated_salary || 0);
        if (sid) {
          await q(
            'INSERT INTO tbl_employee_shop (employee_id, shop_id, allocated_salary, assign_date, is_active) VALUES (?, ?, ?, CURDATE(), 1)',
            [empId, sid, sal]
          );
        }
      }

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'কর্মচারী সফলভাবে যোগ করা হয়েছে।',
        employee_id: empId
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create employee:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'কর্মচারী যোগ করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Update employee
   */
  static async update(req, res) {
    const empId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const name = (req.body.emp_name || '').trim();
      const code = (req.body.emp_code || '').trim().toUpperCase();
      const phone = (req.body.phone || '').trim();
      const nid = (req.body.nid || '').trim();
      const designation = (req.body.designation || '').trim();
      const joinDate = req.body.join_date || null;
      const monthlySalary = parseFloat(req.body.monthly_salary || 0);
      const shopAssignments = req.body.assignments || []; // [{ shop_id, allocated_salary }]

      if (!name || !code) {
        throw new Error('কর্মচারীর নাম এবং কোড প্রদান করা আবশ্যক।');
      }

      // Check code uniqueness
      const existing = await q('SELECT employee_id FROM tbl_employees WHERE emp_code = ? AND employee_id != ?', [code, empId]);
      if (existing.length > 0) {
        throw new Error('এই কোডের কর্মচারী ইতিমধ্যে বিদ্যমান রয়েছে।');
      }

      await q(
        `UPDATE tbl_employees 
         SET emp_name = ?, emp_code = ?, phone = ?, nid = ?, designation = ?, join_date = ?, monthly_salary = ?
         WHERE employee_id = ?`,
        [name, code, phone, nid, designation, joinDate, monthlySalary, empId]
      );

      // Remove existing active assignments
      await q('UPDATE tbl_employee_shop SET is_active = 0 WHERE employee_id = ?', [empId]);

      // Assign shops
      for (const assign of shopAssignments) {
        const sid = parseInt(assign.shop_id);
        const sal = parseFloat(assign.allocated_salary || 0);
        if (sid) {
          const exists = await q('SELECT es_id FROM tbl_employee_shop WHERE employee_id = ? AND shop_id = ?', [empId, sid]);
          if (exists.length > 0) {
            await q('UPDATE tbl_employee_shop SET is_active = 1, allocated_salary = ? WHERE employee_id = ? AND shop_id = ?', [sal, empId, sid]);
          } else {
            await q(
              'INSERT INTO tbl_employee_shop (employee_id, shop_id, allocated_salary, assign_date, is_active) VALUES (?, ?, ?, CURDATE(), 1)',
              [empId, sid, sal]
            );
          }
        }
      }

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'কর্মচারী তথ্য সফলভাবে আপডেট করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to update employee:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'কর্মচারী আপডেট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Fetch pending advances and loan balance
   */
  static async getPendingAdvances(req, res) {
    try {
      const empId = parseInt(req.params.id);
      const monthStr = req.query.salary_month; // YYYY-MM

      if (!empId || !monthStr) {
        return res.status(200).json({ status: 'success', salary_advance: 0, loan_balance: 0, processed_gross: 0 });
      }

      const month = `${monthStr}-01`;

      const advRows = await DB.query(`
        SELECT COALESCE(SUM(advance_amount), 0) AS total
        FROM tbl_salary_advances
        WHERE employee_id = ? AND advance_month <= ? AND is_deducted = 0
      `, [empId, month]);
      const salaryAdvance = parseFloat(advRows[0]?.total || 0);

      const loanRows = await DB.query(`
        SELECT COALESCE(SUM(balance_amount), 0) AS total
        FROM tbl_employee_advances
        WHERE employee_id = ? AND status = 'active'
      `, [empId]);
      const loanBalance = parseFloat(loanRows[0]?.total || 0);

      const processedRows = await DB.query(`
        SELECT COALESCE(SUM(gross_salary), 0) AS total
        FROM tbl_salary_records
        WHERE employee_id = ? AND DATE_FORMAT(salary_month, '%Y-%m') = ?
      `, [empId, monthStr]);
      const processedGross = parseFloat(processedRows[0]?.total || 0);

      return res.status(200).json({
        status: 'success',
        salary_advance: salaryAdvance,
        loan_balance: loanBalance,
        processed_gross: processedGross
      });
    } catch (err) {
      console.error('Failed to fetch pending advances:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch pending advances' });
    }
  }

  /**
   * Give salary advance or loan to employee
   */
  static async addAdvance(req, res) {
    const empId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const accountId = parseInt(req.body.account_id);
      const amount = parseFloat(req.body.advance_amount || 0);
      const date = req.body.advance_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';
      const advanceType = req.body.advance_type; // 'loan' or 'salary_advance'

      if (!shopId || !accountId || amount <= 0 || !advanceType) {
        throw new Error('দোকান, একাউন্ট, পরিমাণ এবং অগ্রিমের ধরণ দিন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে এন্ট্রি দেওয়ার অনুমতি নেই।' });
        }
      }

      const empRows = await q('SELECT emp_name FROM tbl_employees WHERE employee_id = ?', [empId]);
      if (empRows.length === 0) {
        throw new Error('কর্মচারী পাওয়া যায়নি।');
      }
      const empName = empRows[0].emp_name;

      if (advanceType === 'loan') {
        // Loan type (tbl_employee_advances)
        const result = await q(
          `INSERT INTO tbl_employee_advances 
           (employee_id, shop_id, advance_date, advance_amount, total_repaid, balance_amount, account_id, remarks, status, created_by) 
           VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'active', ?)`,
          [empId, shopId, date, amount, amount, accountId, remarks, req.user.get('user_id')]
        );
        const advId = result.insertId;

        // Deduct Account current_balance
        await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [amount, accountId]);
        const balAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
        const balAfter = parseFloat(balAfterRows[0]?.current_balance || 0);

        // Transaction log
        await q(
          `INSERT INTO tbl_account_transactions 
           (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
           VALUES (?, ?, ?, 'debit', ?, 'advance', ?, ?, ?, ?)`,
          [accountId, shopId, date, amount, advId, `কর্মচারী লোন - ${empName}`, balAfter, req.user.get('user_id')]
        );
      } else {
        // Salary advance type (tbl_salary_advances)
        const advanceMonth = req.body.advance_month ? `${req.body.advance_month}-01` : `${date.substring(0, 7)}-01`;

        const result = await q(
          `INSERT INTO tbl_salary_advances 
           (employee_id, shop_id, advance_date, advance_month, advance_amount, is_deducted, account_id, remarks, created_by) 
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          [empId, shopId, date, advanceMonth, amount, accountId, remarks, req.user.get('user_id')]
        );
        const advId = result.insertId;

        // Deduct Account current_balance
        await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [amount, accountId]);
        const balAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
        const balAfter = parseFloat(balAfterRows[0]?.current_balance || 0);

        // Transaction log
        await q(
          `INSERT INTO tbl_account_transactions 
           (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
           VALUES (?, ?, ?, 'debit', ?, 'salary_advance', ?, ?, ?, ?)`,
          [accountId, shopId, date, amount, advId, `বেতন অগ্রিম - ${empName}`, balAfter, req.user.get('user_id')]
        );
      }

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'অগ্রিম লোন/বেতন অগ্রিম সফলভাবে প্রদান করা হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to disburse advance:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'অগ্রিম প্রদানে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Disburse/Pay Salary
   */
  static async addSalary(req, res) {
    const empId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.body.shop_id);
      const salaryMonthStr = req.body.salary_month; // YYYY-MM
      const grossSalary = parseFloat(req.body.gross_salary || 0);
      const bonusAmount = parseFloat(req.body.bonus_amount || 0);
      const salaryAdvDeduction = parseFloat(req.body.salary_adv_deduction || 0);
      const loanDeduction = parseFloat(req.body.loan_deduction || 0);
      const paidAmount = parseFloat(req.body.paid_amount || 0);
      const accountId = parseInt(req.body.account_id);
      const paymentDate = req.body.payment_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';

      if (!shopId || !salaryMonthStr || !accountId || paidAmount < 0) {
        throw new Error('প্রয়োজনীয় ফিল্ডগুলো সঠিকভাবে পূরণ করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে এন্ট্রি দেওয়ার অনুমতি নেই।' });
        }
      }

      const empRows = await q('SELECT emp_name FROM tbl_employees WHERE employee_id = ?', [empId]);
      if (empRows.length === 0) {
        throw new Error('কর্মচারী পাওয়া যায়নি।');
      }
      const empName = empRows[0].emp_name;

      const salaryMonth = `${salaryMonthStr}-01`;
      const netPayable = grossSalary + bonusAmount - salaryAdvDeduction - loanDeduction;

      // Status flag
      const status = paidAmount >= netPayable ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending');

      // Check if salary record already exists for this employee+shop+month
      const existingRows = await q(
        'SELECT salary_id, paid_amount, account_id FROM tbl_salary_records WHERE employee_id = ? AND shop_id = ? AND salary_month = ?',
        [empId, shopId, salaryMonth]
      );

      let salaryId;
      if (existingRows.length > 0) {
        // UPDATE existing record
        const existing = existingRows[0];
        salaryId = existing.salary_id;
        const oldPaidAmount = parseFloat(existing.paid_amount || 0);
        const oldAccountId = parseInt(existing.account_id);

        await q(
          `UPDATE tbl_salary_records SET 
           gross_salary = ?, bonus_amount = ?, salary_adv_deduction = ?, loan_deduction = ?,
           net_payable = ?, paid_amount = ?, payment_date = ?, account_id = ?, remarks = ?, status = ?
           WHERE salary_id = ?`,
          [grossSalary, bonusAmount, salaryAdvDeduction, loanDeduction,
           netPayable, paidAmount, paymentDate, accountId, remarks, status, salaryId]
        );

        // Reverse old account balance and apply new
        if (oldAccountId === accountId) {
          const diff = paidAmount - oldPaidAmount;
          await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [diff, accountId]);
        } else {
          await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [oldPaidAmount, oldAccountId]);
          await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [paidAmount, accountId]);
        }

        // Delete old transaction log for this salary
        await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'salary' AND ref_id = ?", [salaryId]);
      } else {
        // INSERT new record
        const result = await q(
          `INSERT INTO tbl_salary_records 
           (employee_id, shop_id, salary_month, gross_salary, bonus_amount, salary_adv_deduction, loan_deduction, net_payable, paid_amount, payment_date, account_id, remarks, status, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [empId, shopId, salaryMonth, grossSalary, bonusAmount, salaryAdvDeduction, loanDeduction,
           netPayable, paidAmount, paymentDate, accountId, remarks, status, req.user.get('user_id')]
        );
        salaryId = result.insertId;
      }

      // Mark salary advances as deducted
      if (salaryAdvDeduction > 0) {
        await q(
          `UPDATE tbl_salary_advances 
           SET is_deducted = 0, salary_id = NULL 
           WHERE salary_id = ?`,
          [salaryId]
        );
        await q(
          `UPDATE tbl_salary_advances 
           SET is_deducted = 1, salary_id = ? 
           WHERE employee_id = ? AND advance_month <= ? AND is_deducted = 0`,
          [salaryId, empId, salaryMonth]
        );
      }

      // Deduct from Accounts
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [paidAmount, accountId]);
      const balAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balAfter = parseFloat(balAfterRows[0]?.current_balance || 0);

      // Log central account transactions
      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'debit', ?, 'salary', ?, ?, ?, ?)`,
        [accountId, shopId, paymentDate, paidAmount, salaryId, `বেতন পরিশোধ - ${empName}`, balAfter, req.user.get('user_id')]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'বেতন পরিশোধ সফলভাবে রেকর্ড করা হয়েছে।',
        salary_id: salaryId
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to pay salary:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'বেতন পরিশোধে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Repay Employee active loan/advance (from cash repayment)
   */
  static async repayLoan(req, res) {
    const advanceId = parseInt(req.params.advanceId);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const role = req.user.get('role');
      const amount = parseFloat(req.body.repayment_amount || 0);
      const accountId = parseInt(req.body.account_id);
      const date = req.body.repayment_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';

      if (!advanceId || !accountId || amount <= 0) {
        throw new Error('লোন আইডি, ক্যাশ/ব্যাংক হিসাব এবং সঠিক পরিমাণ দিন।');
      }

      const advRows = await q('SELECT * FROM tbl_employee_advances WHERE advance_id = ?', [advanceId]);
      if (advRows.length === 0) {
        throw new Error('লোন রেকর্ড পাওয়া যায়নি।');
      }
      const advance = advRows[0];

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          advance.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই লোন রি-পেমেন্ট এন্ট্রি দেওয়ার অনুমতি আপনার নেই।' });
        }
      }

      const balanceAmount = parseFloat(advance.balance_amount || 0);
      if (amount > balanceAmount) {
        throw new Error(`ফেরত পরিমাণ বর্তমান বকেয়ার চেয়ে বেশি হতে পারবে না। বকেয়া: ৳${balanceAmount}`);
      }

      const empRows = await q('SELECT emp_name FROM tbl_employees WHERE employee_id = ?', [advance.employee_id]);
      const empName = empRows[0]?.emp_name || 'কর্মচারী';

      // 1. Insert into repayments log
      await q(
        `INSERT INTO tbl_advance_repayments 
         (advance_id, employee_id, repayment_date, repayment_amount, repayment_type, account_id, remarks, created_by) 
         VALUES (?, ?, ?, ?, 'cash', ?, ?, ?)`,
        [advanceId, advance.employee_id, date, amount, accountId, remarks, req.user.get('user_id')]
      );

      // 2. Update Employee Advance record
      const newBalance = balanceAmount - amount;
      const status = newBalance <= 0 ? 'closed' : 'active';
      await q(
        'UPDATE tbl_employee_advances SET total_repaid = total_repaid + ?, balance_amount = ?, status = ? WHERE advance_id = ?',
        [amount, newBalance, status, advanceId]
      );

      // 3. Add to central cash/bank account balance (credit)
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [amount, accountId]);
      const balAfterRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [accountId]);
      const balAfter = parseFloat(balAfterRows[0]?.current_balance || 0);

      // 4. Log central account transaction
      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, shop_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, ?, 'credit', ?, 'loan_repayment', ?, ?, ?, ?)`,
        [accountId, advance.shop_id, date, amount, advanceId, `লোন ফেরত - ${empName}`, balAfter, req.user.get('user_id')]
      );

      await connection.commit();
      return res.status(200).json({
        status: 'success',
        message: 'লোন ফেরত সফলভাবে সম্পন্ন হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to repay loan:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'লোন ফেরত নিতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Fetch all active employee advances and salary advances (grouped/filtered)
   */
  static async getAllAdvances(req, res) {
    try {
      const role = req.user.get('role');
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      let where = '1 = 1';
      const params = [];

      if (shopId) {
        where += ' AND shop_id = ?';
        params.push(shopId);
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          where += ` AND shop_id IN (${assignedIds.join(',')})`;
        } else {
          where += ' AND 1 = 0';
        }
      }

      const advances = await DB.query(`SELECT * FROM v_employee_advance_summary WHERE ${where} ORDER BY emp_name, advance_date DESC`, params);
      const pendingSalaryAdvances = await DB.query(`SELECT * FROM v_pending_salary_advances WHERE ${where} ORDER BY advance_date DESC`, params);

      return res.status(200).json({
        status: 'success',
        advances,
        pendingSalaryAdvances
      });
    } catch (err) {
      console.error('Failed to fetch all advances:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch advances list' });
    }
  }

  /**
   * Fetch salary records list (with month & shop filter)
   */
  static async getSalaries(req, res) {
    try {
      const role = req.user.get('role');
      const monthStr = req.query.month; // YYYY-MM
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;

      let where = '1 = 1';
      const params = [];

      if (monthStr) {
        where += " AND DATE_FORMAT(sr.salary_month, '%Y-%m') = ?";
        params.push(monthStr);
      }

      if (shopId) {
        where += ' AND sr.shop_id = ?';
        params.push(shopId);
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT shop_id FROM tbl_user_shops WHERE user_id = ?', [req.user.get('user_id')]);
        const assignedIds = userShops.map(s => s.shop_id);
        if (assignedIds.length > 0) {
          where += ` AND sr.shop_id IN (${assignedIds.join(',')})`;
        } else {
          return res.status(200).json({ status: 'success', data: [] });
        }
      }

      const rows = await DB.query(
        `SELECT sr.salary_id, sr.employee_id, sr.shop_id, 
                e.emp_name, e.emp_code,
                sh.shop_name,
                DATE_FORMAT(sr.salary_month, '%Y-%m') AS salary_month,
                sr.gross_salary, sr.bonus_amount, sr.salary_adv_deduction, sr.loan_deduction,
                sr.net_payable, sr.paid_amount, sr.payment_date,
                sr.account_id, a.account_name,
                sr.status, sr.remarks
         FROM tbl_salary_records sr
         JOIN tbl_employees e ON sr.employee_id = e.employee_id
         JOIN tbl_shops sh ON sr.shop_id = sh.shop_id
         LEFT JOIN tbl_accounts a ON sr.account_id = a.account_id
         WHERE ${where}
         ORDER BY sr.salary_month DESC, e.emp_name ASC`,
        params
      );

      return res.status(200).json({
        status: 'success',
        data: rows
      });
    } catch (err) {
      console.error('Failed to fetch salaries:', err);
      return res.status(500).json({ status: 'error', message: 'বেতন তালিকা লোড করতে ব্যর্থতা' });
    }
  }

  /**
   * Delete salary record and reverse account balance
   */
  static async deleteSalary(req, res) {
    const salaryId = parseInt(req.params.id);
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const rows = await q('SELECT * FROM tbl_salary_records WHERE salary_id = ?', [salaryId]);
      if (rows.length === 0) throw new Error('বেতন রেকর্ড পাওয়া যায়নি।');
      const sal = rows[0];

      const role = req.user.get('role');
      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'), sal.shop_id
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই রেকর্ড ডিলিট করার অনুমতি নেই।' });
        }
      }

      // Reverse account balance
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [
        parseFloat(sal.paid_amount), sal.account_id
      ]);

      // Delete transaction log and record
      await q("DELETE FROM tbl_account_transactions WHERE ref_type = 'salary' AND ref_id = ?", [salaryId]);
      await q('DELETE FROM tbl_salary_records WHERE salary_id = ?', [salaryId]);

      await connection.commit();
      return res.status(200).json({ status: 'success', message: 'বেতন রেকর্ড মুছে ফেলা হয়েছে।' });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to delete salary:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'ডিলিট করতে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }
}

module.exports = EmployeeController;
