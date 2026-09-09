/**
 * PurchaseOrder Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class PurchaseOrder extends Model {
  static table = 'purchase_orders';
  static primaryKey = 'id';
  static fillable = [
    'purchase_number', 'supplier_id', 'user_id', 'subtotal',
    'discount_amount', 'tax_amount', 'shipping_cost', 'total_amount',
    'paid_amount', 'due_amount', 'status', 'payment_status',
    'payment_method', 'expected_date', 'received_date',
    'notes', 'internal_notes', 'meta_data'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

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
   * Get purchase order items relationship
   */
  items() {
    return this.hasMany(PurchaseOrderItem, 'purchase_order_id', 'id');
  }

  /**
   * Get payment transactions relationship
   */
  paymentTransactions() {
    return this.hasMany(PaymentTransaction, 'purchase_order_id', 'id');
  }

  /**
   * Check if purchase order is draft
   */
  isDraft() {
    return this.get('status') === 'draft';
  }

  /**
   * Check if purchase order is received/completed
   */
  isReceived() {
    return this.get('status') === 'received';
  }

  /**
   * Check if purchase order is cancelled
   */
  isCancelled() {
    return this.get('status') === 'cancelled';
  }

  /**
   * Update purchase order status
   */
  async updateStatus(newStatus) {
    const validStatuses = ['draft', 'ordered', 'received', 'partial', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid purchase order status: ${newStatus}`);
    }

    const updateData = { status: newStatus };
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (newStatus === 'received') {
      updateData.received_date = now;
    }

    await this.constructor.update(this.get('id'), updateData);
    this._attributes.status = newStatus;
    
    return newStatus;
  }

  /**
   * Add payment to purchase order
   */
  async addPayment(amount, paymentMethod = 'cash', options = {}) {
    const PaymentTransaction = require('./PaymentTransaction');
    
    const currentPaid = parseFloat(this.get('paid_amount')) || 0;
    const currentDue = parseFloat(this.get('due_amount')) || 0;
    const totalAmount = parseFloat(this.get('total_amount')) || 0;
    
    const newPaid = currentPaid + parseFloat(amount);
    const newDue = Math.max(0, totalAmount - newPaid);
    
    await PaymentTransaction.create({
      transaction_number: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchase_order_id: this.get('id'),
      supplier_id: this.get('supplier_id'),
      user_id: options.userId || null,
      payment_type: 'payment',
      payment_method: paymentMethod,
      amount: amount,
      currency: 'BDT',
      status: 'completed',
      reference_number: options.referenceNumber || null,
      notes: options.notes || null,
      paid_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    await this.constructor.update(this.get('id'), {
      paid_amount: newPaid,
      due_amount: newDue,
      payment_status: newDue === 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid')
    });

    this._attributes.paid_amount = newPaid;
    this._attributes.due_amount = newDue;
    
    return { paid: newPaid, due: newDue };
  }

  /**
   * Get full purchase order data with items and supplier
   */
  async loadWithDetails() {
    return await this.constructor.query()
      .where(this.constructor.primaryKey, this.get('id'))
      .with('supplier')
      .with('items')
      .first();
  }
}

module.exports = PurchaseOrder;
