// @ts-check
const nodemailer = require('nodemailer');
const Queue = require('./Queue');

/**
 * @typedef {Object} MailAttachment
 * @property {string} [filename]
 * @property {string|Buffer} [content]
 * @property {string} [path]
 * @property {string} [contentType]
 */

/**
 * @typedef {Object} SendMailOptions
 * @property {string|string[]} to Recipient email address(es)
 * @property {string} subject Email subject line
 * @property {string} [html] HTML formatted body
 * @property {string} [text] Plain text fallback body
 * @property {string} [from] Sender address override
 * @property {MailAttachment[]} [attachments] Optional attachments
 */

/**
 * @typedef {Object} MailResult
 * @property {boolean} success
 * @property {string} [messageId]
 * @property {string[]} [accepted]
 * @property {string[]} [rejected]
 * @property {boolean} [sandbox]
 * @property {string} [error]
 */

/**
 * Enterprise Email Delivery Service for Aero MVC
 * Wraps Nodemailer with SMTP pooling, queue support,
 * and resilient development sandbox fallback.
 */
class Mailer {
  /** @type {import('nodemailer').Transporter|null} */
  static _transporter = null;
  static _initialized = false;

  /**
   * Initialize transporter from environment configuration
   */
  static getTransporter() {
    if (this._initialized) return this._transporter;
    this._initialized = true;

    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host || !user || !pass) {
      // Unconfigured SMTP -> fallback to safe sandbox logger
      this._transporter = null;
      return null;
    }

    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const secure = process.env.MAIL_SECURE === 'true' || port === 465;

    try {
      this._transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });
    } catch (e) {
      console.error('[Mailer] Transporter initialization failed, using sandbox fallback:', e);
      this._transporter = null;
    }

    return this._transporter;
  }

  /**
   * Send an email immediately
   * @param {SendMailOptions} options
   * @returns {Promise<MailResult>}
   */
  static async send(options) {
    const fromAddress = options.from || process.env.MAIL_FROM_ADDRESS || 'noreply@aeromvc.local';
    const fromName = process.env.MAIL_FROM_NAME || 'Aero MVC Engine';
    const from = `"${fromName}" <${fromAddress}>`;

    const transporter = this.getTransporter();

    // Development / Test Sandbox Mode
    if (!transporter) {
      const simulatedId = 'sandbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const recipient = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      console.log(`\x1b[36m[MAIL SANDBOX] 📨 To: ${recipient} | Subject: "${options.subject}"\x1b[0m`);
      if (options.text) console.log(`\x1b[36m[MAIL SANDBOX] Content: ${options.text.substring(0, 100)}...\x1b[0m`);
      
      return {
        success: true,
        messageId: simulatedId,
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        sandbox: true
      };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: (info.accepted || []).map(String),
        rejected: (info.rejected || []).map(String),
        sandbox: false
      };
    } catch (err) {
      console.error('[Mailer] Send error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        accepted: [],
        rejected: Array.isArray(options.to) ? options.to : [options.to],
        sandbox: false
      };
    }
  }

  /**
   * Push an email to the background queue for asynchronous dispatch
   * @param {SendMailOptions} options
   * @param {string} [queue='emails']
   * @param {number} [delay=0]
   * @returns {Promise<number>} Inserted Job ID
   */
  static async sendQueued(options, queue = 'emails', delay = 0) {
    return await Queue.push({
      name: 'SendEmailJob',
      options,
      dispatched_at: Date.now()
    }, queue, delay);
  }

  /**
   * Verify SMTP connection status
   * @returns {Promise<boolean>}
   */
  static async verify() {
    const transporter = this.getTransporter();
    if (!transporter) return false;
    try {
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Mailer;
