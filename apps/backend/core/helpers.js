// @ts-check
const crypto = require('crypto');
const requestContext = require('./RequestContext');
const Flash = require('./Flash');

// Core Service Singletons
const DB = require('../config/db');
const Cache = require('./Cache');
const Logger = require('./Logger');
const Gate = require('./Gate');
const ApiResource = require('./ApiResource');
const Queue = require('./Queue');
const Throttle = require('./Throttle');
const Mailer = require('./Mailer');
const Sms = require('./Sms');
const Notification = require('./Notification');
const Money = require('./Money');
const NumberToWords = require('./NumberToWords');
const PdfEngine = require('./Pdf');
const DocNumber = require('./DocNumber');
const Audit = require('./Audit');
const Export = require('./Export');
const Backup = require('./Backup');

/**
 * Helper to sanitize HTML characters to prevent XSS attacks
 * @param {any} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 1. env helper
 * @param {string} key
 * @param {any} [defaultValue=null]
 */
function env(key, defaultValue = null) {
  return process.env[key] !== undefined ? process.env[key] : defaultValue;
}

/**
 * 2. base_url, url, and asset helpers
 */
function base_url(path = '') {
  const base = process.env.BASE_URL || '';
  return base + '/' + String(path).replace(/^\/+/, '');
}

function url(path = '') {
  return '/' + String(path).replace(/^\/+/, '');
}

function asset(path = '') {
  return '/assets/' + String(path).replace(/^\/+/, '');
}

/**
 * 3. Dump and Die (dd) helper
 * Safely halts the active request, rendering a styled debug dump box.
 */
function dd(...vars) {
  const store = requestContext.getStore();
  if (store && store.res) {
    const res = store.res;
    let html = `
      <div style="background: #18171B; color: #FFF; padding: 25px; border-radius: 12px; margin: 20px; font-family: 'Consolas', 'Courier New', monospace; font-size: 14px; overflow: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h4 style="margin-top:0; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:10px; color:#0ea5e9; display:flex; align-items:center; gap:8px;">
          <span style="background:#0ea5e9; color:#18171b; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">DD</span>
          Aero Dump & Die
        </h4>
    `;

    vars.forEach(v => {
      const type = typeof v;
      let stringified = '';
      try {
        stringified = JSON.stringify(v, null, 2);
      } catch (e) {
        stringified = String(v);
      }

      html += `
        <div style="margin-bottom: 20px;">
          <span style="color: #6edc5f; font-weight: bold;">Type: ${type}</span>
          <pre style="background: #232226; padding: 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); overflow-x: auto; color: #f8fafc; margin-top: 8px;">${escapeHtml(stringified)}</pre>
        </div>
      `;
    });

    html += `</div>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(html);
  } else {
    // CLI fallback
    console.log('\x1b[35m=== DUMP ===\x1b[0m');
    vars.forEach(v => console.dir(v, { depth: null, colors: true }));
    process.exit(1);
  }
}

/**
 * 4. flash helper (sets message, or outputs Alert HTML if retrieved)
 */
function flash(name = '', message = '', className = 'alert alert-success') {
  const store = requestContext.getStore();
  if (!store || !store.req) return '';

  const req = store.req;

  if (name !== '') {
    if (message !== '') {
      // Set flash
      Flash.set(name, message, className);
    } else {
      // Get flash & output HTML alert
      const flashMsgKey = `flash_${name}`;
      const flashClassKey = `flash_${name}_class`;

      // Check session or res.locals (middleware maps session to locals)
      const msg = req.session[flashMsgKey] || (store.res.locals && store.res.locals[flashMsgKey]);
      const cssClass = req.session[flashClassKey] || (store.res.locals && store.res.locals[flashClassKey]) || className;

      // Consume session keys
      delete req.session[flashMsgKey];
      delete req.session[flashClassKey];

      if (!msg) return '';

      const isError = name === 'error' || cssClass.includes('danger');
      const icon = isError ? 'fa-exclamation-circle' : 'fa-check-circle';

      return `
        <div class="${escapeHtml(cssClass)} alert-dismissible fade show shadow-sm border-0 rounded-3 mb-3" role="alert" id="msg-flash">
            <div class="d-flex align-items-center">
                <i class="fas ${icon} me-2"></i>
                <div>${escapeHtml(msg)}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `.trim();
    }
  }
  return '';
}

/**
 * 5. str_random helper (cryptographically secure)
 * @param {number} [length=16]
 * @returns {string}
 */
function str_random(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charLen = chars.length;
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % charLen];
  }
  return result;
}

/**
 * 6. slugify helper
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 7. formatDate helper
 * @param {string|Date} dateStr
 * @param {string} [formatPattern='YYYY-MM-DD']
 * @returns {string}
 */
function formatDate(dateStr, formatPattern = 'YYYY-MM-DD') {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return formatPattern
    .replace('YYYY', String(yyyy))
    .replace('MM', mm)
    .replace('DD', dd)
    .replace('HH', hh)
    .replace('mm', min)
    .replace('ss', ss);
}

/**
 * 8. formatCurrency helper
 * @param {number|string} amount
 * @param {string} [currencySymbol='৳']
 * @returns {string}
 */
function formatCurrency(amount, currencySymbol = '৳') {
  const val = parseFloat(String(amount)) || 0;
  return `${currencySymbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 9. numberToWords helper
 * @param {number|string} num
 * @returns {string}
 */
function numberToWords(num) {
  const hyphen = '-';
  const conjunction = ' and ';
  const separator = ', ';
  const negative = 'negative ';
  const dictionary = {
    0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine',
    10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen',
    17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty', 30: 'Thirty', 40: 'Forty', 50: 'Fifty',
    60: 'Sixty', 70: 'Seventy', 80: 'Eighty', 90: 'Ninety', 100: 'Hundred', 1000: 'Thousand',
    1000000: 'Million', 1000000000: 'Billion', 1000000000000: 'Trillion'
  };

  if (isNaN(Number(num))) return '';
  let n = parseFloat(String(num));
  if (n < 0) return negative + numberToWords(Math.abs(n));

  let str = '';

  if (n < 21) {
    str = dictionary[n];
  } else if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;
    str = dictionary[tens];
    if (units) str += hyphen + dictionary[units];
  } else if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    str = dictionary[hundreds] + ' ' + dictionary[100];
    if (remainder) str += conjunction + numberToWords(remainder);
  } else {
    const baseUnit = Math.pow(1000, Math.floor(Math.log(n) / Math.log(1000)));
    const numBaseUnits = Math.floor(n / baseUnit);
    const remainder = n % baseUnit;
    str = numberToWords(numBaseUnits) + ' ' + dictionary[baseUnit];
    if (remainder) {
      str += remainder < 100 ? conjunction : separator;
      str += numberToWords(remainder);
    }
  }

  return str;
}

/**
 * 10. Vite Dev Server status probe and viteAsset helper
 */
let viteDevServerActive = false;
const CHECK_INTERVAL = 10000;

function checkViteDevServer() {
  try {
    const net = require('net');
    const client = net.connect({ port: 5173, host: '127.0.0.1', timeout: 300 }, () => {
      viteDevServerActive = true;
      client.destroy();
    });

    client.on('error', () => {
      viteDevServerActive = false;
      client.destroy();
    });

    client.on('timeout', () => {
      viteDevServerActive = false;
      client.destroy();
    });
  } catch (e) {
    viteDevServerActive = false;
  }
}

// Initial probe during bootup
checkViteDevServer();

// Periodically probe status in the background (development mode only)
if (process.env.NODE_ENV !== 'production') {
  const timer = setInterval(checkViteDevServer, CHECK_INTERVAL);
  if (timer.unref) {
    timer.unref(); // Prevent timer from keeping the process alive
  }
}

function isViteDevActive() {
  return viteDevServerActive;
}

let manifestCache = null;
function viteAsset(path = '') {
  const cleanPath = String(path).replace(/^\/+/, '');
  
  if (isViteDevActive()) {
    return `http://localhost:5173/${cleanPath}`;
  }
  
  if (!manifestCache) {
    try {
      const fs = require('fs');
      const pathLib = require('path');
      let manifestPath = pathLib.join(__dirname, '../public/dist/.vite/manifest.json');
      if (!fs.existsSync(manifestPath)) {
        manifestPath = pathLib.join(__dirname, '../public/dist/manifest.json');
      }
      if (fs.existsSync(manifestPath)) {
        manifestCache = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } else {
        manifestCache = {};
      }
    } catch (e) {
      manifestCache = {};
    }
  }
  
  const mapped = manifestCache[cleanPath];
  const file = mapped ? mapped.file : cleanPath;
  return `/dist/${file}`;
}

/**
 * 11. Quick Mail Sender Helper
 * @param {string|string[]} to
 * @param {string} subject
 * @param {string} [html]
 * @param {string} [text]
 */
async function sendMail(to, subject, html = '', text = '') {
  return await Mailer.send({ to, subject, html, text });
}

/**
 * 12. Quick SMS Sender Helper
 * @param {string} to
 * @param {string} message
 * @param {'twilio'|'webhook'|'mock'} [provider]
 */
async function sendSms(to, message, provider) {
  return await Sms.send({ to, message, provider });
}

/**
 * 13. Multi-Channel Notification Helper
 * @param {any} notifiable
 * @param {import('./Notification').BaseNotification} notification
 */
async function notify(notifiable, notification) {
  return await Notification.send(notifiable, notification);
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Aero Application Container
// Consolidates all services and helpers into an organized, enterprise namespace
// ─────────────────────────────────────────────────────────────────────────────
const Aero = {
  // Core Services
  DB,
  Cache,
  Logger,
  Flash,
  Gate,
  ApiResource,
  Queue,
  Throttle,
  Mailer,
  Sms,
  Notification,
  Money,
  NumberToWords,
  Pdf: PdfEngine,
  DocNumber,
  Audit,
  Export,
  Backup,

  // Helper Functions
  escapeHtml,
  e: escapeHtml,
  env,
  base_url,
  url,
  asset,
  dd,
  flash,
  str_random,
  slugify,
  formatDate,
  formatCurrency,
  numberToWords,
  numberToBangla: (num) => NumberToWords.toBangla(num),
  currencyWords: (amount, opts) => NumberToWords.toCurrencyWords(amount, opts),
  money: (amount, currency) => new Money(amount, currency),
  docNumber: (type, opts) => DocNumber.next(type, opts),
  audit: (entry) => Audit.log(entry),
  isViteDevActive,
  viteAsset,
  sendMail,
  sendSms,
  notify,

  /**
   * Bind view helpers cleanly to Express app.locals
   * (Standard Node.js best-practice: keeps template helpers isolated from Node process globals)
   * 
   * @param {import('express').Application} app
   */
  bindLocals(app) {
    if (app && app.locals) {
      Object.assign(app.locals, {
        e: escapeHtml,
        escapeHtml,
        env,
        base_url,
        url,
        asset,
        flash,
        formatDate,
        formatCurrency,
        numberToWords,
        numberToBangla: (num) => NumberToWords.toBangla(num),
        currencyWords: (amount, opts) => NumberToWords.toCurrencyWords(amount, opts),
        money: (amount, currency) => new Money(amount, currency),
        isViteDevActive,
        viteAsset
      });
    }
  }
};

// Bind the primary container namespace
global.Aero = Aero;

// Register non-enumerable backward-compatibility bridges on global
// This preserves existing tests and controllers while keeping Object.keys(global) clean
const compatKeys = Object.keys(Aero).filter(k => k !== 'bindLocals');
compatKeys.forEach((key) => {
  if (!(key in global)) {
    Object.defineProperty(global, key, {
      value: Aero[key],
      writable: true,
      configurable: true,
      enumerable: false // Prevents global namespace enumeration and pollution
    });
  }
});

// Export unified container as standard module
module.exports = Aero;
