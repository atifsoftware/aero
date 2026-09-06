const DB = require('../../config/db');

/**
 * Enterprise Queue Manager for NodeFlow
 * Interfaces MySQL as a robust, persistent background task broker.
 */
class Queue {
  static table = 'jobs';
  static failedTable = 'failed_jobs';

  /**
   * Ensure jobs and failed_jobs tracking tables exist
   */
  static async ensureTableExists() {
    const jobsSql = `
      CREATE TABLE IF NOT EXISTS \`${this.table}\` (
        \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
        \`queue\` VARCHAR(255) NOT NULL DEFAULT 'default',
        \`payload\` LONGTEXT NOT NULL,
        \`attempts\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
        \`reserved_at\` TIMESTAMP NULL DEFAULT NULL,
        \`available_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const failedSql = `
      CREATE TABLE IF NOT EXISTS \`${this.failedTable}\` (
        \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
        \`queue\` VARCHAR(255) NOT NULL DEFAULT 'default',
        \`display_name\` VARCHAR(255) NOT NULL,
        \`payload\` LONGTEXT NOT NULL,
        \`exception\` LONGTEXT NOT NULL,
        \`failed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await DB.query(jobsSql);
    await DB.query(failedSql);
  }

  /**
   * Push a new job onto the queue
   * @param {object} job - Job instance or data object
   * @param {string} [queue='default']
   * @param {number} [delay=0] - Delay in seconds
   * @returns {Promise<number>} Inserted job ID
   */
  static async push(job, queue = 'default', delay = 0) {
    await this.ensureTableExists();

    const displayName = job.constructor ? job.constructor.name : (job.name || 'Job');
    const payload = {
      display_name: displayName,
      data: { ...job },
      tries: job.tries || 3,
      created_at: Date.now()
    };

    const jobDelay = delay || job.delay || 0;
    const availableAt = new Date(Date.now() + (jobDelay * 1000));
    const formatTimestamp = (d) => d.toISOString().replace('T', ' ').substring(0, 19);

    return await DB.table(this.table).insert({
      queue,
      payload: JSON.stringify(payload),
      attempts: 0,
      available_at: formatTimestamp(availableAt),
      created_at: formatTimestamp(new Date())
    });
  }

  /**
   * Alias for push()
   */
  static async dispatch(job, queue = 'default', delay = 0) {
    return await this.push(job, queue, delay);
  }

  /**
   * Pop the next available job from the queue
   * @param {string} [queue='default']
   * @returns {Promise<object|null>}
   */
  static async pop(queue = 'default') {
    await this.ensureTableExists();

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const job = await DB.table(this.table)
      .where('queue', queue)
      .whereRaw('reserved_at IS NULL')
      .whereRaw('available_at <= ?', [now])
      .orderBy('id', 'ASC')
      .first();

    if (job) {
      await DB.table(this.table)
        .where('id', job.id)
        .update({ reserved_at: now });
      return job;
    }

    return null;
  }

  /**
   * Delete a job after successful execution
   */
  static async delete(id) {
    return await DB.table(this.table).where('id', id).delete();
  }

  /**
   * Release a job back to the queue with exponential backoff delay
   */
  static async release(id, delay = 60) {
    const availableAt = new Date(Date.now() + (delay * 1000));
    const formatTimestamp = (d) => d.toISOString().replace('T', ' ').substring(0, 19);

    return await DB.query(
      `UPDATE \`${this.table}\` SET reserved_at = NULL, available_at = ?, attempts = attempts + 1 WHERE id = ?`,
      [formatTimestamp(availableAt), id]
    );
  }

  /**
   * Record a failed job into failed_jobs table before deleting from queue
   */
  static async logFailed(jobRecord, error) {
    await this.ensureTableExists();

    let displayName = 'UnknownJob';
    try {
      const payloadObj = JSON.parse(jobRecord.payload);
      displayName = payloadObj.display_name || displayName;
    } catch {}

    const exceptionDetails = JSON.stringify({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    await DB.table(this.failedTable).insert({
      queue: jobRecord.queue || 'default',
      display_name: displayName,
      payload: jobRecord.payload,
      exception: exceptionDetails,
      failed_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    await this.delete(jobRecord.id);
  }

  /**
   * Get all failed jobs
   */
  static async getFailed() {
    await this.ensureTableExists();
    return await DB.table(this.failedTable).orderBy('id', 'DESC').get();
  }

  /**
   * Retry a failed job by ID
   */
  static async retry(failedJobId) {
    await this.ensureTableExists();
    const failedJob = await DB.table(this.failedTable).where('id', failedJobId).first();
    if (!failedJob) return false;

    // Push back into active jobs
    await DB.table(this.table).insert({
      queue: failedJob.queue,
      payload: failedJob.payload,
      attempts: 0,
      available_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    // Delete from failed table
    await DB.table(this.failedTable).where('id', failedJobId).delete();
    return true;
  }

  /**
   * Clear all failed jobs
   */
  static async flushFailed() {
    await this.ensureTableExists();
    return await DB.table(this.failedTable).delete();
  }

  /**
   * Get queue statistics
   */
  static async stats() {
    await this.ensureTableExists();
    const pending = await DB.table(this.table).whereRaw('reserved_at IS NULL').count();
    const reserved = await DB.table(this.table).whereRaw('reserved_at IS NOT NULL').count();
    const failed = await DB.table(this.failedTable).count();

    return { pending, reserved, failed };
  }
}

module.exports = Queue;
