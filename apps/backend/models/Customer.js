/**
 * Customer Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class Customer extends Model {
  static table = 'customers';
  static primaryKey = 'id';
  static fillable = [
    'name', 'email', 'phone', 'alternate_phone',
    'billing_address', 'shipping_address', 'city', 'state',
    'postal_code', 'country', 'credit_limit', 'current_balance',
    'is_active', 'customer_type', 'meta_data'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

  /**
   * Get orders relationship
   */
  orders() {
    return this.hasMany(Order, 'customer_id', 'id');
  }

  /**
   * Get payment transactions relationship
   */
  paymentTransactions() {
    return this.hasMany(PaymentTransaction, 'customer_id', 'id');
  }

  /**
   * Get total order count
   */
  async getOrderCount() {
    const Order = require('./Order');
    return await Order.query()
      .where('customer_id', this.get('id'))
      .count();
  }

  /**
   * Get total spent amount
   */
  async getTotalSpent() {
    const Order = require('./Order');
    const orders = await Order.query()
      .where('customer_id', this.get('id'))
      .where('status', '!=', 'cancelled')
      .get();
    
    return orders.reduce((total, order) => {
      return total + (parseFloat(order.get('total_amount')) || 0);
    }, 0);
  }

  /**
   * Check if customer is wholesale
   */
  isWholesale() {
    return this.get('customer_type') === 'wholesale';
  }

  /**
   * Check if customer is corporate
   */
  isCorporate() {
    return this.get('customer_type') === 'corporate';
  }

  /**
   * Update customer balance
   */
  async updateBalance(amount, type = 'debit') {
    const currentBalance = parseFloat(this.get('current_balance')) || 0;
    const newBalance = type === 'debit' 
      ? currentBalance + parseFloat(amount)
      : currentBalance - parseFloat(amount);

    await this.constructor.update(this.get('id'), {
      current_balance: newBalance
    });

    this._attributes.current_balance = newBalance;
    return newBalance;
  }

  /**
   * Get full customer data with recent orders
   */
  async loadWithOrders(limit = 5) {
    const Order = require('./Order');
    const orders = await Order.query()
      .where('customer_id', this.get('id'))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
    
    const customerData = this.toJSON();
    customerData.recent_orders = orders.map(o => o.toJSON());
    
    return customerData;
  }
}

module.exports = Customer;
