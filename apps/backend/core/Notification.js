// @ts-check
const Mailer = require('./Mailer');
const Sms = require('./Sms');
const DB = require('../config/db');
const Queue = require('./Queue');

/**
 * @typedef {'mail'|'sms'|'database'} NotificationChannel
 */

/**
 * @typedef {Object} BaseNotification
 * @property {function(any): NotificationChannel[]} via Channels to deliver through
 * @property {function(any): import('./Mailer').SendMailOptions} [toMail] Mail payload builder
 * @property {function(any): import('./Sms').SendSmsOptions} [toSms] SMS payload builder
 * @property {function(any): Object} [toArray] Database payload builder
 * @property {boolean} [queued] Whether this notification should be sent asynchronously
 */

/**
 * Enterprise Notification Engine for NodeFlow
 * Dispatches notifications across multiple channels (Mail, SMS, Database)
 * with sync and async queue support.
 */
class Notification {
  static dbTable = 'notifications';
  static tableChecked = false;

  /**
   * Ensure database notifications table exists
   */
  static async ensureTable() {
    if (this.tableChecked) return;
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS \`${this.dbTable}\` (
          \`id\` VARCHAR(36) PRIMARY KEY,
          \`type\` VARCHAR(255) NOT NULL,
          \`notifiable_type\` VARCHAR(255) NOT NULL,
          \`notifiable_id\` BIGINT NOT NULL,
          \`data\` TEXT NOT NULL,
          \`read_at\` TIMESTAMP NULL DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX notifiable_index (\`notifiable_type\`, \`notifiable_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      await DB.query(sql);
      this.tableChecked = true;
    } catch {
      this.tableChecked = true;
    }
  }

  /**
   * Dispatch a notification to a notifiable entity (e.g. User model or custom recipient)
   * @param {any} notifiable User instance or recipient object
   * @param {BaseNotification} notification Notification instance
   * @returns {Promise<{ [key: string]: any }>}
   */
  static async send(notifiable, notification) {
    if (!notification || typeof notification.via !== 'function') {
      throw new Error('Invalid notification: must define a via(notifiable) method.');
    }

    const channels = notification.via(notifiable) || [];
    const results = {};

    for (const channel of channels) {
      try {
        if (channel === 'mail') {
          results.mail = await this._sendMail(notifiable, notification);
        } else if (channel === 'sms') {
          results.sms = await this._sendSms(notifiable, notification);
        } else if (channel === 'database') {
          results.database = await this._sendDatabase(notifiable, notification);
        }
      } catch (err) {
        console.error(`[Notification] Error delivering through channel "${channel}":`, err);
        results[channel] = { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    return results;
  }

  /**
   * Deliver email channel
   * @private
   */
  static async _sendMail(notifiable, notification) {
    if (typeof notification.toMail !== 'function') return null;

    const mailOptions = notification.toMail(notifiable);
    if (!mailOptions.to) {
      const recipientEmail = typeof notifiable.get === 'function'
        ? (notifiable.get('email') || notifiable.get('username'))
        : (notifiable.email || notifiable.username);
      mailOptions.to = recipientEmail;
    }

    if (notification.queued) {
      const jobId = await Mailer.sendQueued(mailOptions);
      return { success: true, queued: true, jobId };
    }

    return await Mailer.send(mailOptions);
  }

  /**
   * Deliver SMS channel
   * @private
   */
  static async _sendSms(notifiable, notification) {
    if (typeof notification.toSms !== 'function') return null;

    const smsOptions = notification.toSms(notifiable);
    if (!smsOptions.to) {
      const recipientPhone = typeof notifiable.get === 'function'
        ? (notifiable.get('phone') || notifiable.get('mobile'))
        : (notifiable.phone || notifiable.mobile);
      smsOptions.to = recipientPhone;
    }

    if (notification.queued) {
      const jobId = await Sms.sendQueued(smsOptions);
      return { success: true, queued: true, jobId };
    }

    return await Sms.send(smsOptions);
  }

  /**
   * Deliver database notification
   * @private
   */
  static async _sendDatabase(notifiable, notification) {
    if (typeof notification.toArray !== 'function') return null;

    await this.ensureTable();

    const crypto = require('crypto');
    const id = crypto.randomUUID();
    const type = notification.constructor ? notification.constructor.name : 'CustomNotification';
    const pk = notifiable.constructor?.primaryKey || 'id';
    const notifiableId = typeof notifiable.get === 'function'
      ? notifiable.get(pk)
      : (notifiable[pk] || notifiable.id || notifiable.user_id || 1);
    const data = JSON.stringify(notification.toArray(notifiable));

    await DB.table(this.dbTable).insert({
      id,
      type,
      notifiable_type: notifiable.constructor ? notifiable.constructor.name : 'User',
      notifiable_id: notifiableId,
      data
    });

    return { success: true, id };
  }

  /**
   * Route on-demand notification to a specific channel
   * @param {NotificationChannel} channel
   * @param {string} target Destination (email address, phone number, etc.)
   */
  static route(channel, target) {
    return {
      notify: async (notification) => {
        const notifiable = channel === 'mail'
          ? { email: target }
          : { phone: target };
        return await Notification.send(notifiable, notification);
      }
    };
  }
}

module.exports = Notification;
