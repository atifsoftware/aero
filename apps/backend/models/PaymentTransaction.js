/**
 * PaymentTransaction Model for E-commerce ERP
 * Extends Aero Base Model for tracking payments
 */
const Model = require('../core/Model');

class PaymentTransaction extends Model {
  static table = 'payment_transactions';
  static primaryKey = 'id';
  static fillable = [
    'transaction_number', 'order_id', 'purchase_order_id',
    'customer_id', 'supplier_id', 'user_id', 'payment_type',
    'payment_method', 'amount', 'currency', 'status',
    'reference_number', 'notes', 'meta_data', 'paid_at'
  ];
  static softDeletes = false;

  // Payment types
  static PAYMENT_TYPES = {
    RECEIVE: 'receive', // Customer payment received
    PAYMENT: 'payment'  // Supplier payment made
  };

  // Payment methods
  static PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    BKCASH: 'bkcash',
    NAGAD: 'nagad',
    ROCKET: 'rocket',
    BANK_TRANSFER: 'bank_transfer',
    CHEQUE: 'cheque'
  };

  /**
   * Get order relationship
   */
  order() {
    return this.belongsTo(Order, 'order_id', 'id');
  }

  /**
   * Get purchase order relationship
   */
  purchaseOrder() {
    return this.belongsTo(PurchaseOrder, 'purchase_order_id', 'id');
  }

  /**
   * Get customer relationship
   */
  customer() {
    return this.belongsTo(Customer, 'customer_id', 'id');
  }

  /**
   * Get supplier relationship
   */
  supplier() {
    return this.belongsTo(Supplier, 'supplier_id', 'id');
  }

  /**
   * Get user relationship
   */
  user() {
    return this.belongsTo(User, 'user_id', 'id');
  }

  /**
   * Check if transaction is completed
   */
  isCompleted() {
    return this.get('status') === 'completed';
  }

  /**
   * Check if transaction is pending
   */
  isPending() {
    return this.get('status') === 'pending';
  }

  /**
   * Check if transaction is for receiving payment
   */
  isReceive() {
    return this.get('payment_type') === 'receive';
  }

  /**
   * Check if transaction is for making payment
   */
  isPayment() {
    return this.get('payment_type') === 'payment';
  }

  /**
   * Generate unique transaction number
   */
  static generateTransactionNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Create a new payment transaction
   */
  static async createPayment(data) {
    const transactionNumber = data.transaction_number || this.generateTransactionNumber();
    
    // Check for duplicate transaction number
    const existing = await this.query()
      .where('transaction_number', transactionNumber)
      .first();
    
    if (existing) {
      throw new Error(`Transaction number ${transactionNumber} already exists`);
    }

    return await this.create({
      ...data,
      transaction_number: transactionNumber,
      currency: data.currency || 'BDT',
      status: data.status || 'completed',
      paid_at: data.paid_at || new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  }

  /**
   * Get transactions by date range
   */
  static async getByDateRange(startDate, endDate, options = {}) {
    let query = this.query()
      .whereBetween('created_at', [startDate, endDate]);

    if (options.paymentType) {
      query = query.where('payment_type', options.paymentType);
    }

    if (options.paymentMethod) {
      query = query.where('payment_method', options.paymentMethod);
    }

    if (options.status) {
      query = query.where('status', options.status);
    }

    return await query.orderBy('created_at', 'desc').get();
  }

  /**
   * Get total amount by criteria
   */
  static async getTotalAmount(criteria = {}) {
    let query = this.query().where('status', 'completed');

    if (criteria.paymentType) {
      query = query.where('payment_type', criteria.paymentType);
    }

    if (criteria.startDate && criteria.endDate) {
      query = query.whereBetween('created_at', [criteria.startDate, criteria.endDate]);
    }

    const transactions = await query.get();
    
    return transactions.reduce((total, t) => {
      return total + (parseFloat(t.get('amount')) || 0);
    }, 0);
  }
}

module.exports = PaymentTransaction;
