/**
 * Supplier Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class Supplier extends Model {
  static table = 'suppliers';
  static primaryKey = 'id';
  static fillable = [
    'name', 'company_name', 'email', 'phone', 'alternate_phone',
    'address', 'city', 'state', 'postal_code', 'country',
    'contact_person', 'credit_limit', 'current_balance',
    'is_active', 'notes', 'meta_data'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

  /**
   * Get purchase orders relationship
   */
  purchaseOrders() {
    return this.hasMany(PurchaseOrder, 'supplier_id', 'id');
  }

  /**
   * Get payment transactions relationship
   */
  paymentTransactions() {
    return this.hasMany(PaymentTransaction, 'supplier_id', 'id');
  }

  /**
   * Get total purchase order count
   */
  async getOrderCount() {
    const PurchaseOrder = require('./PurchaseOrder');
    return await PurchaseOrder.query()
      .where('supplier_id', this.get('id'))
      .count();
  }

  /**
   * Get total purchased amount
   */
  async getTotalPurchased() {
    const PurchaseOrder = require('./PurchaseOrder');
    const orders = await PurchaseOrder.query()
      .where('supplier_id', this.get('id'))
      .where('status', '!=', 'cancelled')
      .get();
    
    return orders.reduce((total, order) => {
      return total + (parseFloat(order.get('total_amount')) || 0);
    }, 0);
  }

  /**
   * Update supplier balance
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
   * Get full supplier data with recent orders
   */
  async loadWithOrders(limit = 5) {
    const PurchaseOrder = require('./PurchaseOrder');
    const orders = await PurchaseOrder.query()
      .where('supplier_id', this.get('id'))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
    
    const supplierData = this.toJSON();
    supplierData.recent_orders = orders.map(o => o.toJSON());
    
    return supplierData;
  }
}

module.exports = Supplier;
