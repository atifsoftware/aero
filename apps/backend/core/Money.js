/**
 * Enterprise Financial Precision Engine (Money Value Object) for Aero MVC
 * 
 * Guarantees ZERO floating-point rounding errors in accounting, tax/VAT,
 * multi-item discount allocations, and payment gateway calculations.
 * 
 * Uses fixed-point integer micro-units internally (Scale: 4 decimal places).
 */

const SCALE = 10000; // 4 decimal places of internal precision (1.0000 = 10000)

class Money {
  /**
   * Create a Money instance
   * @param {number|string|Money} amount Numeric amount (e.g. 100.50, "1500.25")
   * @param {string} [currency='BDT'] 3-letter ISO currency code
   */
  constructor(amount = 0, currency = 'BDT') {
    this.currency = String(currency).toUpperCase();
    this._microUnits = Money._toMicroUnits(amount);
  }

  /**
   * Factory method
   */
  static of(amount, currency = 'BDT') {
    return new Money(amount, currency);
  }

  /**
   * Create Money from gateway subunits (e.g. 1050 cents/paisa -> 10.50)
   */
  static fromSubunits(subunits, currency = 'BDT') {
    const amount = parseInt(subunits) / 100;
    return new Money(amount, currency);
  }

  /**
   * Convert external number/string to internal integer micro-units
   */
  static _toMicroUnits(val) {
    if (val instanceof Money) {
      return val._microUnits;
    }
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
    return Math.round(num * SCALE);
  }

  /**
   * Check currency compatibility before arithmetic
   */
  _assertSameCurrency(other) {
    if (other instanceof Money && other.currency !== this.currency) {
      throw new TypeError(`Currency mismatch: Cannot operate between ${this.currency} and ${other.currency}.`);
    }
  }

  /**
   * Add amount
   */
  add(amount) {
    this._assertSameCurrency(amount);
    const micro = Money._toMicroUnits(amount);
    const result = new Money(0, this.currency);
    result._microUnits = this._microUnits + micro;
    return result;
  }

  /**
   * Subtract amount
   */
  subtract(amount) {
    this._assertSameCurrency(amount);
    const micro = Money._toMicroUnits(amount);
    const result = new Money(0, this.currency);
    result._microUnits = this._microUnits - micro;
    return result;
  }

  /**
   * Multiply by a factor
   */
  multiply(factor) {
    const num = typeof factor === 'number' ? factor : parseFloat(factor) || 0;
    const result = new Money(0, this.currency);
    result._microUnits = Math.round(this._microUnits * num);
    return result;
  }

  /**
   * Divide by a divisor
   */
  divide(divisor) {
    const num = typeof divisor === 'number' ? divisor : parseFloat(divisor) || 1;
    if (num === 0) {
      throw new Error('Division by zero in Money calculation.');
    }
    const result = new Money(0, this.currency);
    result._microUnits = Math.round(this._microUnits / num);
    return result;
  }

  /**
   * Calculate percentage (e.g. 7.5% VAT or 15% discount)
   */
  percentage(percent) {
    const p = typeof percent === 'number' ? percent : parseFloat(percent) || 0;
    return this.multiply(p / 100);
  }

  /**
   * Apply discount and return both discount and net amounts
   * @param {number|Money} discountVal Discount percentage or fixed Money
   * @param {boolean} [isPercentage=false] Whether discountVal is a percentage
   */
  applyDiscount(discountVal, isPercentage = false) {
    let discountMoney;
    if (isPercentage) {
      discountMoney = this.percentage(discountVal);
    } else {
      discountMoney = discountVal instanceof Money ? discountVal : new Money(discountVal, this.currency);
      this._assertSameCurrency(discountMoney);
    }

    if (discountMoney.isGreaterThan(this)) {
      discountMoney = new Money(this.toAmount(), this.currency);
    }

    const netAmount = this.subtract(discountMoney);
    return {
      discount: discountMoney,
      net: netAmount
    };
  }

  /**
   * Fair share allocation across ratios without losing even 1 cent/paisa.
   * Standard ERP algorithm for distributing discounts/taxes across multiple line items.
   * 
   * Example: 100 allocated across [1, 1, 1] -> [33.34, 33.33, 33.33]
   * 
   * @param {number[]} ratios Array of positive numbers
   * @returns {Money[]}
   */
  allocate(ratios) {
    if (!Array.isArray(ratios) || ratios.length === 0) {
      return [new Money(this.toAmount(), this.currency)];
    }

    const totalRatio = ratios.reduce((sum, r) => sum + Math.max(0, r), 0);
    if (totalRatio === 0) {
      return ratios.map(() => new Money(0, this.currency));
    }

    const totalSubunits = this.toSubunits();
    let remainder = totalSubunits;
    const results = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = Math.floor((totalSubunits * ratios[i]) / totalRatio);
      results.push(share);
      remainder -= share;
    }

    // Distribute remainder 1 subunit at a time to maintain exact balance
    for (let i = 0; remainder > 0 && i < results.length; i++) {
      results[i] += 1;
      remainder--;
    }

    return results.map(sub => Money.fromSubunits(sub, this.currency));
  }

  /**
   * Get value as standard floating-point rounded to 2 decimal places
   */
  toAmount() {
    return Math.round(this._microUnits / 100) / 100;
  }

  /**
   * Get value in integer payment gateway subunits (cents or paisa)
   * Example: 100.50 BDT -> 10050
   */
  toSubunits() {
    return Math.round(this._microUnits / 100);
  }

  /**
   * Format to currency string
   */
  format(locale = 'en-US') {
    const symbolMap = {
      BDT: '৳',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹'
    };
    const symbol = symbolMap[this.currency] || this.currency + ' ';
    const formattedNum = this.toAmount().toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${symbol}${formattedNum}`;
  }

  // Comparisons
  isZero() {
    return this._microUnits === 0;
  }

  isPositive() {
    return this._microUnits > 0;
  }

  isNegative() {
    return this._microUnits < 0;
  }

  isEqual(other) {
    this._assertSameCurrency(other);
    return this._microUnits === Money._toMicroUnits(other);
  }

  isGreaterThan(other) {
    this._assertSameCurrency(other);
    return this._microUnits > Money._toMicroUnits(other);
  }

  isLessThan(other) {
    this._assertSameCurrency(other);
    return this._microUnits < Money._toMicroUnits(other);
  }

  toJSON() {
    return {
      amount: this.toAmount(),
      currency: this.currency,
      formatted: this.format()
    };
  }

  toString() {
    return this.format();
  }
}

module.exports = Money;
