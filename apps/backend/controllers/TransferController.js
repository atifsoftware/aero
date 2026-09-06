const DB = require('../config/db');

class TransferController {
  /**
   * Fetch fund transfers list within a date range
   */
  static async index(req, res) {
    try {
      const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
      const to = req.query.to || new Date().toISOString().substring(0, 10);

      const transfers = await DB.query(`
        SELECT t.*, a1.account_name AS from_account, a2.account_name AS to_account, u.full_name AS creator
        FROM tbl_transfers t
        JOIN tbl_accounts a1 ON t.from_account_id = a1.account_id
        JOIN tbl_accounts a2 ON t.to_account_id = a2.account_id
        LEFT JOIN tbl_users u ON t.created_by = u.user_id
        WHERE t.transfer_date BETWEEN ? AND ?
        ORDER BY t.transfer_date DESC, t.transfer_id DESC
      `, [from, to]);

      return res.status(200).json({
        status: 'success',
        data: transfers
      });
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch transfers' });
    }
  }

  /**
   * Create fund transfer
   */
  static async create(req, res) {
    const connection = await DB.beginTransaction();
    const q = async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };

    try {
      const fromAccountId = parseInt(req.body.from_account_id);
      const toAccountId = parseInt(req.body.to_account_id);
      const amount = parseFloat(req.body.amount || 0);
      const date = req.body.transfer_date || new Date().toISOString().substring(0, 10);
      const remarks = req.body.remarks || '';

      if (!fromAccountId || !toAccountId || amount <= 0) {
        throw new Error('উৎস অ্যাকাউন্ট, গন্তব্য অ্যাকাউন্ট এবং সঠিক পরিমাণ দিন।');
      }

      if (fromAccountId === toAccountId) {
        throw new Error('একই অ্যাকাউন্টের মধ্যে স্থানান্তর সম্ভব নয়।');
      }

      // Check source account balance
      const fromAccRows = await q('SELECT current_balance, account_name FROM tbl_accounts WHERE account_id = ?', [fromAccountId]);
      if (fromAccRows.length === 0) {
        throw new Error('উৎস অ্যাকাউন্ট পাওয়া যায়নি।');
      }
      const fromAcc = fromAccRows[0];
      const fromBalance = parseFloat(fromAcc.current_balance || 0);

      if (fromBalance < amount) {
        throw new Error(`উৎস অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${fromBalance}`);
      }

      const toAccRows = await q('SELECT account_name FROM tbl_accounts WHERE account_id = ?', [toAccountId]);
      if (toAccRows.length === 0) {
        throw new Error('গন্তব্য অ্যাকাউন্ট পাওয়া যায়নি।');
      }
      const toAccName = toAccRows[0].account_name;

      // 1. Record transfer master
      const result = await q(
        'INSERT INTO tbl_transfers (from_account_id, to_account_id, amount, transfer_date, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [fromAccountId, toAccountId, amount, date, remarks, req.user.get('user_id')]
      );
      const transferId = result.insertId;

      // 2. Deduct from Source (Debit)
      await q('UPDATE tbl_accounts SET current_balance = current_balance - ? WHERE account_id = ?', [amount, fromAccountId]);
      const balAfterFrom = fromBalance - amount;

      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, 'debit', ?, 'transfer', ?, ?, ?, ?)`,
        [
          fromAccountId,
          date,
          amount,
          transferId,
          `তহবিল স্থানান্তর (আউট) -> ${toAccName}`,
          balAfterFrom,
          req.user.get('user_id')
        ]
      );

      // 3. Add to Destination (Credit)
      await q('UPDATE tbl_accounts SET current_balance = current_balance + ? WHERE account_id = ?', [amount, toAccountId]);
      const toAccBalRows = await q('SELECT current_balance FROM tbl_accounts WHERE account_id = ?', [toAccountId]);
      const balAfterTo = parseFloat(toAccBalRows[0]?.current_balance || 0);

      await q(
        `INSERT INTO tbl_account_transactions 
         (account_id, trans_date, trans_type, amount, ref_type, ref_id, description, balance_after, created_by) 
         VALUES (?, ?, 'credit', ?, 'transfer', ?, ?, ?, ?)`,
        [
          toAccountId,
          date,
          amount,
          transferId,
          `তহবিল স্থানান্তর (ইন) <- ${fromAcc.account_name}`,
          balAfterTo,
          req.user.get('user_id')
        ]
      );

      await connection.commit();
      return res.status(201).json({
        status: 'success',
        message: 'তহবিল স্থানান্তর সফলভাবে সম্পন্ন হয়েছে।'
      });
    } catch (err) {
      await connection.rollback();
      console.error('Failed to create transfer:', err);
      return res.status(400).json({ status: 'error', message: err.message || 'তহবিল স্থানান্তরে ব্যর্থতা' });
    } finally {
      connection.release();
    }
  }
}

module.exports = TransferController;
