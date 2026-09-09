/**
 * Enterprise Task Scheduler (Cron Engine) for Aero MVC
 * 
 * Manages periodic ERP background tasks:
 * - Canceling stale/unpaid orders
 * - Inventory snapshot & low-stock alerts
 * - Database backup & report generation
 */

let _logger = null;
function getLogger() {
  if (!_logger) {
    try {
      _logger = require('./Logger');
    } catch {
      _logger = null;
    }
  }
  return _logger;
}

class ScheduledTask {
  constructor(name, action) {
    this.name = name;
    this.action = action; // Function or string command
    this._cronExpression = '* * * * *';
    this._withoutOverlapping = false;
    this._isRunning = false;
    this._lastRun = null;
  }

  cron(expression) {
    this._cronExpression = expression.trim();
    return this;
  }

  everyMinute() {
    return this.cron('* * * * *');
  }

  everyMinutes(n = 5) {
    return this.cron(`*/${Math.max(1, parseInt(n))} * * * *`);
  }

  hourly() {
    return this.cron('0 * * * *');
  }

  hourlyAt(minute = 0) {
    return this.cron(`${minute} * * * *`);
  }

  daily() {
    return this.cron('0 0 * * *');
  }

  dailyAt(time = '00:00') {
    const [hour, minute] = time.split(':').map(Number);
    return this.cron(`${minute || 0} ${hour || 0} * * *`);
  }

  weekly() {
    return this.cron('0 0 * * 0'); // Sunday midnight
  }

  monthly() {
    return this.cron('0 0 1 * *'); // 1st of month
  }

  withoutOverlapping() {
    this._withoutOverlapping = true;
    return this;
  }

  /**
   * Check if task is due at given date
   */
  isDue(date = new Date()) {
    const parts = this._cronExpression.split(/\s+/);
    if (parts.length !== 5) return false;

    const [cMin, cHour, cDayMonth, cMonth, cDayWeek] = parts;

    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayWeek = date.getDay(); // 0 is Sunday

    const matchPart = (current, expr) => {
      if (expr === '*') return true;
      if (expr.startsWith('*/')) {
        const step = parseInt(expr.substring(2));
        return current % step === 0;
      }
      if (expr.includes(',')) {
        return expr.split(',').map(Number).includes(current);
      }
      if (expr.includes('-')) {
        const [start, end] = expr.split('-').map(Number);
        return current >= start && current <= end;
      }
      return parseInt(expr) === current;
    };

    return (
      matchPart(minute, cMin) &&
      matchPart(hour, cHour) &&
      matchPart(dayMonth, cDayMonth) &&
      matchPart(month, cMonth) &&
      matchPart(dayWeek, cDayWeek)
    );
  }

  /**
   * Execute the scheduled task
   */
  async run() {
    if (this._withoutOverlapping && this._isRunning) {
      const logger = getLogger();
      if (logger) logger.warning(`[Scheduler] Skipped overlapping execution for task: ${this.name}`);
      return { status: 'skipped', reason: 'overlapping' };
    }

    this._isRunning = true;
    const start = Date.now();

    try {
      let result;
      if (typeof this.action === 'function') {
        result = await this.action();
      } else {
        // Run CLI command
        const { exec } = require('child_process');
        result = await new Promise((resolve, reject) => {
          exec(this.action, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout || stderr);
          });
        });
      }

      const durationMs = Date.now() - start;
      this._lastRun = new Date();
      return { status: 'success', durationMs, result };
    } catch (err) {
      const durationMs = Date.now() - start;
      const logger = getLogger();
      if (logger) logger.error(`[Scheduler] Task '${this.name}' failed: ${err.message}`, { error: err.stack });
      return { status: 'failed', durationMs, error: err.message };
    } finally {
      this._isRunning = false;
    }
  }
}

class Scheduler {
  constructor() {
    this._tasks = [];
  }

  /**
   * Schedule a function callback
   */
  call(name, callback) {
    const task = new ScheduledTask(name, callback);
    this._tasks.push(task);
    return task;
  }

  /**
   * Schedule a CLI command
   */
  command(name, commandString) {
    const cmd = commandString || name;
    const task = new ScheduledTask(name, cmd);
    this._tasks.push(task);
    return task;
  }

  /**
   * Get all registered scheduled tasks
   */
  getTasks() {
    return [...this._tasks];
  }

  /**
   * Clear all tasks
   */
  clear() {
    this._tasks = [];
  }

  /**
   * Run all tasks that are currently due
   */
  async runDue(date = new Date()) {
    const dueTasks = this._tasks.filter(t => t.isDue(date));
    const results = [];

    for (const task of dueTasks) {
      console.log(`\x1b[36m[Scheduler] Running:\x1b[0m ${task.name}`);
      const res = await task.run();
      const statusIcon = res.status === 'success' ? '\x1b[32m✓' : '\x1b[31m✗';
      console.log(`${statusIcon} [Scheduler] Finished:\x1b[0m ${task.name} (${res.durationMs || 0}ms)`);
      results.push({ name: task.name, ...res });
    }

    return {
      time: date.toISOString(),
      ran: results.length,
      results
    };
  }
}

const schedulerSingleton = new Scheduler();

module.exports = schedulerSingleton;
