/**
 * Enterprise Number-to-Words & Invoice Amount-in-Words Engine for Aero MVC
 * 
 * Supports:
 * - English (International: Million/Billion & South Asian: Lakh/Crore)
 * - Bangla (বাংলা: ১-১০০, শত, হাজার, লক্ষ, কোটি)
 * - Currency Words for Invoices, Cheques, and Receipts (টাকা ও পয়সা মাত্র / Taka & Paisa Only)
 */

const BANGLA_WORDS_0_TO_99 = [
  'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
  'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
  'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ', 'ত্রিশ',
  'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
  'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
  'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
  'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
  'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
  'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
  'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
];

const ENGLISH_UNITS = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const ENGLISH_TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

class NumberToWords {
  /**
   * Convert integer or float to English words
   * @param {number|string} number 
   * @param {Object} [options]
   * @param {boolean} [options.useLakhCrore=true] Whether to use South Asian Lakh/Crore system
   */
  static toEnglish(number, options = {}) {
    const num = Math.floor(Math.abs(parseFloat(number) || 0));
    if (num === 0) return 'Zero';

    const useLakhCrore = options.useLakhCrore !== false;
    if (useLakhCrore) {
      return NumberToWords._englishLakhCrore(num).trim();
    }
    return NumberToWords._englishMillionBillion(num).trim();
  }

  static _englishBelowThousand(n) {
    let str = '';
    if (n >= 100) {
      str += ENGLISH_UNITS[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += ENGLISH_TENS[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ENGLISH_UNITS[n] + ' ';
    }
    return str.trim();
  }

  static _englishLakhCrore(n) {
    if (n === 0) return '';
    if (n >= 10000000) {
      return this._englishLakhCrore(Math.floor(n / 10000000)) + ' Crore ' + this._englishLakhCrore(n % 10000000);
    }
    if (n >= 100000) {
      return this._englishLakhCrore(Math.floor(n / 100000)) + ' Lakh ' + this._englishLakhCrore(n % 100000);
    }
    if (n >= 1000) {
      return this._englishLakhCrore(Math.floor(n / 1000)) + ' Thousand ' + this._englishLakhCrore(n % 1000);
    }
    return this._englishBelowThousand(n);
  }

  static _englishMillionBillion(n) {
    if (n === 0) return '';
    if (n >= 1000000000) {
      return this._englishMillionBillion(Math.floor(n / 1000000000)) + ' Billion ' + this._englishMillionBillion(n % 1000000000);
    }
    if (n >= 1000000) {
      return this._englishMillionBillion(Math.floor(n / 1000000)) + ' Million ' + this._englishMillionBillion(n % 1000000);
    }
    if (n >= 1000) {
      return this._englishMillionBillion(Math.floor(n / 1000)) + ' Thousand ' + this._englishMillionBillion(n % 1000);
    }
    return this._englishBelowThousand(n);
  }

  /**
   * Convert number to Bangla words (বাংলা সংখ্যা কথায় রূপান্তর)
   * @param {number|string} number 
   */
  static toBangla(number) {
    const num = Math.floor(Math.abs(parseFloat(number) || 0));
    if (num === 0) return 'শূন্য';
    return NumberToWords._banglaConvert(num).trim();
  }

  static _banglaConvert(n) {
    if (n === 0) return '';
    if (n >= 10000000) { // কোটি
      return this._banglaConvert(Math.floor(n / 10000000)) + ' কোটি ' + this._banglaConvert(n % 10000000);
    }
    if (n >= 100000) { // লক্ষ
      return this._banglaConvert(Math.floor(n / 100000)) + ' লক্ষ ' + this._banglaConvert(n % 100000);
    }
    if (n >= 1000) { // হাজার
      return this._banglaConvert(Math.floor(n / 1000)) + ' হাজার ' + this._banglaConvert(n % 1000);
    }
    if (n >= 100) { // শত
      return BANGLA_WORDS_0_TO_99[Math.floor(n / 100)] + ' শত ' + this._banglaConvert(n % 100);
    }
    return BANGLA_WORDS_0_TO_99[n] || '';
  }

  /**
   * Convert amount to In-Words format for invoices, receipts, and cheques
   * 
   * @param {number|string} amount Amount (supports decimals)
   * @param {Object} [options]
   * @param {'bn'|'en'} [options.language='bn'] Language code ('bn' or 'en')
   * @param {string} [options.currency='BDT'] Currency code ('BDT', 'USD', etc.)
   * @returns {string} E.g. "এক হাজার পাঁচশত টাকা পঞ্চাশ পয়সা মাত্র" or "One Thousand ... Taka and Fifty Paisa Only"
   */
  static toCurrencyWords(amount, options = {}) {
    const lang = (options.language || 'bn').toLowerCase();
    const currency = (options.currency || 'BDT').toUpperCase();

    const val = parseFloat(amount) || 0;
    const isNegative = val < 0;
    const absVal = Math.abs(val);

    const integerPart = Math.floor(absVal);
    const decimalPart = Math.round((absVal - integerPart) * 100);

    const currencyConfig = {
      BDT: {
        en: { unit: 'Taka', subUnit: 'Paisa' },
        bn: { unit: 'টাকা', subUnit: 'পয়সা' }
      },
      USD: {
        en: { unit: 'Dollars', subUnit: 'Cents' },
        bn: { unit: 'ডলার', subUnit: 'সেন্ট' }
      },
      EUR: {
        en: { unit: 'Euros', subUnit: 'Cents' },
        bn: { unit: 'ইউরো', subUnit: 'সেন্ট' }
      },
      INR: {
        en: { unit: 'Rupees', subUnit: 'Paisa' },
        bn: { unit: 'রুপি', subUnit: 'পয়সা' }
      }
    };

    const cfg = (currencyConfig[currency] && currencyConfig[currency][lang]) 
      || (lang === 'bn' ? { unit: currency, subUnit: 'পয়সা' } : { unit: currency, subUnit: 'Cents' });

    if (lang === 'bn') {
      let text = '';
      if (integerPart > 0 || decimalPart === 0) {
        text += this.toBangla(integerPart) + ' ' + cfg.unit;
      }
      if (decimalPart > 0) {
        if (text.length > 0) text += ' ';
        text += this.toBangla(decimalPart) + ' ' + cfg.subUnit;
      }
      text += ' মাত্র';
      return (isNegative ? 'ঋণাত্মক ' : '') + text.trim();
    } else {
      let text = '';
      if (integerPart > 0 || decimalPart === 0) {
        text += this.toEnglish(integerPart, options) + ' ' + cfg.unit;
      }
      if (decimalPart > 0) {
        if (text.length > 0) text += ' and ';
        text += this.toEnglish(decimalPart, options) + ' ' + cfg.subUnit;
      }
      text += ' Only';
      return (isNegative ? 'Negative ' : '') + text.trim();
    }
  }
}

module.exports = NumberToWords;
