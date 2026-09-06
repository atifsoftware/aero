// @ts-check
const Queue = require('./Queue');

/**
 * @typedef {Object} SendSmsOptions
 * @property {string} to Recipient phone number in E.164 format (e.g. +8801700000000 or +1234567890)
 * @property {string} message SMS text message body
 * @property {string} [from] Sender identifier or phone number override
 * @property {'twilio'|'webhook'|'mock'} [provider] Target SMS provider override
 */

/**
 * @typedef {Object} SmsResult
 * @property {boolean} success
 * @property {string} [messageId]
 * @property {boolean} [sandbox]
 * @property {string} [provider]
 * @property {string} [error]
 */

/**
 * Enterprise SMS Gateway Service for Aero MVC
 * Supports Twilio, generic Webhook providers, queue dispatching,
 * and resilient development sandbox fallback.
 */
class Sms {
  /**
   * Send an SMS message
   * @param {SendSmsOptions} options
   * @returns {Promise<SmsResult>}
   */
  static async send(options) {
    const provider = options.provider || process.env.SMS_PROVIDER || 'mock';
    const to = options.to;
    const message = options.message;

    if (!to || !message) {
      return {
        success: false,
        error: 'Recipient phone number and message body are required.',
        provider
      };
    }

    // 1. Twilio Provider
    if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await this._sendTwilio(options);
    }

    // 2. Generic HTTP Webhook Provider (e.g. local SMS gateways, Onnorokom, Infobip)
    if (provider === 'webhook' && process.env.SMS_WEBHOOK_URL) {
      return await this._sendWebhook(options);
    }

    // 3. Mock / Sandbox Mode (Default dev & test behavior)
    const simulatedId = 'sms_sandbox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    console.log(`\x1b[35m[SMS SANDBOX] 📱 To: ${to} | Message: "${message}"\x1b[0m`);

    return {
      success: true,
      messageId: simulatedId,
      sandbox: true,
      provider: 'mock'
    };
  }

  /**
   * Internal Twilio REST API sender using standard fetch
   * @param {SendSmsOptions} options
   * @private
   */
  static async _sendTwilio(options) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = options.from || process.env.TWILIO_PHONE_NUMBER;

    if (!from) {
      return {
        success: false,
        error: 'TWILIO_PHONE_NUMBER is not configured.',
        provider: 'twilio'
      };
    }

    try {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const params = new URLSearchParams({
        To: options.to,
        From: from,
        Body: options.message
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Twilio SMS sending failed',
          provider: 'twilio'
        };
      }

      return {
        success: true,
        messageId: data.sid,
        sandbox: false,
        provider: 'twilio'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: 'twilio'
      };
    }
  }

  /**
   * Internal generic Webhook SMS sender
   * @param {SendSmsOptions} options
   * @private
   */
  static async _sendWebhook(options) {
    const url = process.env.SMS_WEBHOOK_URL;
    const apiKey = process.env.SMS_API_KEY;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-Api-Key'] = apiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: options.to,
          message: options.message,
          from: options.from || process.env.SMS_FROM
        })
      });

      const data = await response.json().catch(() => ({}));
      return {
        success: response.ok,
        messageId: data.id || data.messageId || 'webhook_' + Date.now(),
        sandbox: false,
        provider: 'webhook'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: 'webhook'
      };
    }
  }

  /**
   * Push an SMS to the background queue for asynchronous dispatch
   * @param {SendSmsOptions} options
   * @param {string} [queue='sms']
   * @param {number} [delay=0]
   * @returns {Promise<number>} Inserted Job ID
   */
  static async sendQueued(options, queue = 'sms', delay = 0) {
    return await Queue.push({
      name: 'SendSmsJob',
      options,
      dispatched_at: Date.now()
    }, queue, delay);
  }
}

module.exports = Sms;
