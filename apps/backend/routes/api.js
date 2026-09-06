const express = require('express');
const router = express.Router();
const apiTokenAuth = require('../app/middlewares/apiTokenAuth');
const apiCan = require('../app/middlewares/apiCan');
const ApiAuthController = require('../app/controllers/ApiAuthController');
const ApiUserController = require('../app/controllers/ApiUserController');
const ShopController = require('../app/controllers/ShopController');
const DashboardController = require('../app/controllers/DashboardController');
const VoucherController = require('../app/controllers/VoucherController');
const CustomerController = require('../app/controllers/CustomerController');
const SupplierController = require('../app/controllers/SupplierController');
const DailySheetController = require('../app/controllers/DailySheetController');
const EmployeeController = require('../app/controllers/EmployeeController');
const TransferController = require('../app/controllers/TransferController');
const CashbookController = require('../app/controllers/CashbookController');
const AttendanceController = require('../app/controllers/AttendanceController');
const ReportController = require('../app/controllers/ReportController');
const TemplateController = require('../app/controllers/TemplateController');

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get API server status
 *     description: Retrieve system status, message, and current server time.
 *     tags:
 *       - System Status
 *     responses:
 *       200:
 *         description: Server is online and operating correctly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: NodeFlow API Server is running successfully.
 *                 timestamp:
 *                   type: string
 *                   example: 2026-06-15T15:30:22.299Z
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'NodeFlow API Server is running successfully.',
    timestamp: new Date().toISOString()
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/settings
 * Fetch public site settings map
 */
router.get('/settings', (req, res) => {
  res.json({
    status: 'success',
    settings: global.cachedSettingsMap || {}
  });
});

/**
 * GET /api/dashboard/framework-stats
 * Diagnostics and framework stats for React Admin Dashboard
 */
router.get('/dashboard/framework-stats', async (req, res, next) => {
  try {
    const os = require('os');
    const DB = require('../config/db');

    let totalUsers = 0;
    try {
      const totalUsersRes = await DB.query("SELECT COUNT(*) as count FROM tbl_users");
      totalUsers = totalUsersRes[0]?.count || 0;
    } catch (e) {}

    let totalLogs = 0;
    try {
      const totalLogsRes = await DB.query("SELECT COUNT(*) as count FROM activity_logs");
      totalLogs = totalLogsRes[0]?.count || 0;
    } catch (e) {}

    let totalTokens = 0;
    try {
      const totalTokensRes = await DB.query("SELECT COUNT(*) as count FROM personal_access_tokens");
      totalTokens = totalTokensRes[0]?.count || 0;
    } catch (e) {}

    const freeMemGb = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const totalMemGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const sysUptimeHr = (os.uptime() / 3600).toFixed(1);

    const systemStats = {
      usersCount: totalUsers,
      logsCount: totalLogs,
      tokensCount: totalTokens,
      osType: os.type(),
      osRelease: os.release(),
      cpuModel: os.cpus()[0]?.model || 'Generic CPU',
      cpuCores: os.cpus().length,
      memoryUsage: `${freeMemGb} GB Free / ${totalMemGb} GB Total`,
      uptime: `${sysUptimeHr} Hours`,
      nodeVersion: process.version
    };

    let recentLogs = [];
    try {
      recentLogs = await DB.table('activity_logs').orderBy('id', 'DESC').limit(5).get();
    } catch (e) {}

    res.json({
      status: 'success',
      stats: systemStats,
      logs: recentLogs
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/login
 * Issue a Personal Access Token for authentication
 */
router.post('/login', ApiAuthController.issueToken);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Retrieve authorized user profile
 *     description: Fetch profile details and permission abilities of the currently authorized client token.
 *     tags:
 *       - Profile Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Admin
 *                     email:
 *                       type: string
 *                       example: admin@nodeflow.com
 *                     role:
 *                       type: string
 *                       example: admin
 *                 abilities:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["create_user", "edit_user"]
 *       401:
 *         description: Unauthorized. Missing or invalid Bearer token.
 */
router.get('/user', apiTokenAuth, (req, res) => {
  let permissions = [];
  const rawPerms = req.user.get('permissions');
  if (rawPerms) {
    try {
      permissions = JSON.parse(rawPerms);
    } catch (e) {
      console.error('Failed to parse user permissions:', e);
    }
  }
  res.json({
    status: 'success',
    user: {
      id: req.user.get('user_id'),
      name: req.user.get('full_name'),
      username: req.user.get('username'),
      role: req.user.get('role'),
      permissions: permissions
    },
    abilities: req.tokenAbilities
  });
});

// Shop Management APIs
router.get('/shops', apiTokenAuth, ShopController.index);
router.post('/shops', apiTokenAuth, ShopController.store);
router.put('/shops/:id', apiTokenAuth, ShopController.update);
router.delete('/shops/:id', apiTokenAuth, ShopController.destroy);
router.post('/shops/reorder', apiTokenAuth, ShopController.reorder);
router.post('/shops/select', apiTokenAuth, ShopController.select);

// Dashboard APIs
router.get('/dashboard/summary', apiTokenAuth, DashboardController.summary);
router.get('/dashboard/recent-expenses', apiTokenAuth, DashboardController.recentExpenses);
router.get('/dashboard/recent-salaries', apiTokenAuth, DashboardController.recentSalaries);
router.get('/dashboard/shop-summary', apiTokenAuth, DashboardController.shopSummary);

// Voucher lookup APIs
router.get('/categories', apiTokenAuth, VoucherController.getCategories);
router.get('/accounts', apiTokenAuth, VoucherController.getAccounts);
router.get('/expense-templates', apiTokenAuth, VoucherController.getExpenseTemplates);

// Expense Voucher CRUD
router.get('/expenses', apiTokenAuth, VoucherController.getExpenses);
router.get('/expenses/:id', apiTokenAuth, VoucherController.getExpenseDetail);
router.post('/expenses', apiTokenAuth, VoucherController.createExpense);
router.put('/expenses/:id', apiTokenAuth, apiCan('edit_expense'), VoucherController.updateExpense);
router.delete('/expenses/:id', apiTokenAuth, apiCan('delete_expense'), VoucherController.deleteExpense);

// Income Voucher CRUD
router.get('/incomes', apiTokenAuth, VoucherController.getIncomes);
router.post('/incomes', apiTokenAuth, VoucherController.createIncome);
router.put('/incomes/:id', apiTokenAuth, apiCan('edit_income'), VoucherController.updateIncome);
router.delete('/incomes/:id', apiTokenAuth, apiCan('delete_income'), VoucherController.deleteIncome);

// Customer Tally Khata CRUD
router.get('/customers', apiTokenAuth, CustomerController.index);
router.get('/customers/:id', apiTokenAuth, CustomerController.show);
router.post('/customers', apiTokenAuth, CustomerController.create);
router.put('/customers/:id', apiTokenAuth, CustomerController.update);
router.get('/customers/:id/ledger', apiTokenAuth, CustomerController.getLedger);
router.post('/customers/:id/transaction', apiTokenAuth, CustomerController.addTransaction);
router.delete('/customers/ledger/:ledgerId', apiTokenAuth, apiCan('delete_tally'), CustomerController.deleteTransaction);

// Supplier Mahajon Khata CRUD
router.get('/suppliers', apiTokenAuth, SupplierController.index);
router.get('/suppliers/:id', apiTokenAuth, SupplierController.show);
router.post('/suppliers', apiTokenAuth, SupplierController.create);
router.put('/suppliers/:id', apiTokenAuth, SupplierController.update);
router.get('/suppliers/:id/ledger', apiTokenAuth, SupplierController.getLedger);
router.post('/suppliers/:id/transaction', apiTokenAuth, SupplierController.addTransaction);
router.delete('/suppliers/ledger/:ledgerId', apiTokenAuth, apiCan('delete_tally'), SupplierController.deleteTransaction);

// Daily Sheet CRUD
router.get('/daily-sheets', apiTokenAuth, DailySheetController.index);
router.get('/daily-sheets/external-data', apiTokenAuth, DailySheetController.getExternalData);
router.get('/daily-sheets/:id', apiTokenAuth, DailySheetController.show);
router.post('/daily-sheets', apiTokenAuth, DailySheetController.create);
router.put('/daily-sheets/:id', apiTokenAuth, DailySheetController.update);

// Employee & Salaries management
router.get('/employees', apiTokenAuth, EmployeeController.index);
router.get('/employees/advances/all', apiTokenAuth, EmployeeController.getAllAdvances);
router.get('/employees/:id', apiTokenAuth, EmployeeController.show);
router.post('/employees', apiTokenAuth, EmployeeController.create);
router.put('/employees/:id', apiTokenAuth, EmployeeController.update);
router.get('/employees/:id/pending-advances', apiTokenAuth, EmployeeController.getPendingAdvances);
router.post('/employees/:id/advance', apiTokenAuth, EmployeeController.addAdvance);
router.post('/employees/:id/salary', apiTokenAuth, EmployeeController.addSalary);

// Salary Records
router.get('/salaries', apiTokenAuth, EmployeeController.getSalaries);
router.delete('/salaries/:id', apiTokenAuth, apiCan('delete_salary'), EmployeeController.deleteSalary);

// Employee Loan Repayment
router.post('/employees/loans/:advanceId/repay', apiTokenAuth, EmployeeController.repayLoan);

// Fund Transfers
router.get('/transfers', apiTokenAuth, TransferController.index);
router.post('/transfers', apiTokenAuth, TransferController.create);

// Daily Closings (Day End)
router.get('/daily-closings', apiTokenAuth, CashbookController.index);
router.get('/daily-closings/calculate', apiTokenAuth, CashbookController.calculate);
router.post('/daily-closings', apiTokenAuth, CashbookController.create);
router.delete('/daily-closings/:id', apiTokenAuth, apiCan('delete_cashbook'), CashbookController.delete);

// Attendance Sheet & Reports
router.get('/attendance', apiTokenAuth, AttendanceController.index);
router.post('/attendance', apiTokenAuth, AttendanceController.create);
router.get('/attendance/report', apiTokenAuth, AttendanceController.report);

// Financial Reports (Ledger & Cashbook & Others)
router.get('/reports/ledger', apiTokenAuth, ReportController.getLedger);
router.get('/reports/daily-cashbook', apiTokenAuth, ReportController.getDailyCashBook);
router.get('/reports/expense', apiTokenAuth, ReportController.getExpenseReport);
router.get('/reports/income', apiTokenAuth, ReportController.getIncomeReport);
router.get('/reports/salary-sheet', apiTokenAuth, ReportController.getSalarySheetReport);
router.get('/reports/advance', apiTokenAuth, ReportController.getAdvanceReport);
router.get('/reports/annual-expense', apiTokenAuth, ReportController.getAnnualExpenseReport);

// User Management APIs
router.get('/users', apiTokenAuth, ApiUserController.index);
router.post('/users', apiTokenAuth, ApiUserController.store);
router.put('/users/:id', apiTokenAuth, ApiUserController.update);
router.delete('/users/:id', apiTokenAuth, ApiUserController.destroy);
router.post('/user/change-password', apiTokenAuth, ApiUserController.changePassword);

// Template Management APIs
router.get('/templates', apiTokenAuth, TemplateController.index);
router.post('/templates', apiTokenAuth, TemplateController.store);
router.put('/templates/:id', apiTokenAuth, TemplateController.update);
router.delete('/templates/:id', apiTokenAuth, TemplateController.destroy);

// AI Intelligence APIs
const AiController = require('../app/controllers/AiController');
router.post('/ai/ask', apiTokenAuth, AiController.ask);
router.post('/ai/summarize', apiTokenAuth, AiController.summarize);

module.exports = router;
