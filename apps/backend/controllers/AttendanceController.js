const DB = require('../config/db');

class AttendanceController {
  /**
   * Fetch daily attendance logs for a shop and date (for marking)
   */
  static async index(req, res) {
    try {
      const role = req.user.get('role');
      const shopId = parseInt(req.query.shop_id);
      const date = req.query.date || new Date().toISOString().substring(0, 10);

      if (!shopId) {
        throw new Error('দোকান আইডি প্রদান করুন।');
      }

      if (role === 'manager') {
        const userShops = await DB.query('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে আপনার হাজিরা দেখার অনুমতি নেই।' });
        }
      }

      const employees = await DB.query(`
        SELECT e.employee_id, e.emp_name, e.emp_code,
               att.status AS current_status, att.remarks AS current_remarks
        FROM tbl_employee_shop es
        JOIN tbl_employees e ON es.employee_id = e.employee_id
        LEFT JOIN tbl_attendance att ON e.employee_id = att.employee_id AND att.attendance_date = ?
        WHERE es.shop_id = ? AND es.is_active = 1 AND e.is_active = 1
        ORDER BY e.emp_name
      `, [date, shopId]);

      return res.status(200).json({
        status: 'success',
        data: employees
      });
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'হাজিরা তালিকা লোড করতে ব্যর্থতা' });
    }
  }

  /**
   * Store/Update daily attendance logs
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
      const date = req.body.date || new Date().toISOString().substring(0, 10);
      const attendanceList = req.body.attendance || []; // [{ employee_id, status, remarks }]

      if (!shopId || attendanceList.length === 0) {
        throw new Error('দোকান এবং হাজিরা ডেটা সরবরাহ করুন।');
      }

      if (role === 'manager') {
        const userShops = await q('SELECT us_id FROM tbl_user_shops WHERE user_id = ? AND shop_id = ?', [
          req.user.get('user_id'),
          shopId
        ]);
        if (userShops.length === 0) {
          return res.status(403).json({ status: 'error', message: 'এই দোকানে হাজিরা নিশ্চিত করার অনুমতি নেই।' });
        }
      }

      for (const att of attendanceList) {
        const empId = parseInt(att.employee_id);
        const status = att.status || 'present';
        const remarks = att.remarks || '';

        const exists = await q('SELECT COUNT(*) AS count FROM tbl_attendance WHERE employee_id = ? AND attendance_date = ?', [empId, date]);
        
        if (exists[0]?.count > 0) {
          await q(
            'UPDATE tbl_attendance SET status = ?, remarks = ?, shop_id = ?, created_by = ? WHERE employee_id = ? AND attendance_date = ?',
            [status, remarks, shopId, req.user.get('user_id'), empId, date]
          );
        } else {
          await q(
            'INSERT INTO tbl_attendance (employee_id, shop_id, attendance_date, status, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [empId, shopId, date, status, remarks, req.user.get('user_id')]
          );
        }
      }

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'হাজিরা সফলভাবে সংরক্ষিত হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to save attendance:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'হাজিরা সংরক্ষণে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }

  /**
   * Get monthly attendance report for a shop
   */
  static async report(req, res) {
    try {
      const month = req.query.month || new Date().toISOString().substring(0, 7); // YYYY-MM
      const shopId = parseInt(req.query.shop_id);

      if (!shopId) {
        throw new Error('দোকান আইডি প্রদান করুন।');
      }

      const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();

      const employees = await DB.query(`
        SELECT e.employee_id, e.emp_name
        FROM tbl_employee_shop es
        JOIN tbl_employees e ON es.employee_id = e.employee_id
        WHERE es.shop_id = ? AND es.is_active = 1
        ORDER BY e.emp_name
      `, [shopId]);

      const records = [];
      for (const emp of employees) {
        const attLogs = await DB.query(`
          SELECT DAY(attendance_date) AS day, status 
          FROM tbl_attendance 
          WHERE employee_id = ? AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
        `, [emp.employee_id, month]);

        const mappedDays = {};
        for (const log of attLogs) {
          mappedDays[log.day] = log.status;
        }

        records.push({
          emp_id: emp.employee_id,
          name: emp.emp_name,
          days: mappedDays
        });
      }

      return res.status(200).json({
        status: 'success',
        month,
        daysInMonth,
        data: records
      });
    } catch (err) {
      console.error('Failed to generate attendance report:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'রিপোর্ট তৈরিতে ব্যর্থতা' });
    }
  }
}

module.exports = AttendanceController;
