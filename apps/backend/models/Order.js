/**
 * Order Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class Order extends Model {
  static table = 'orders';
  static primaryKey = 'id';
  static fillable = [
    'order_number', 'customer_id', 'user_id', 'subtotal',
    'discount_amount', 'tax_amount', 'shipping_cost', 'total_amount',
    'paid_amount', 'due_amount', 'status', 'payment_status',
    'payment_method', 'shipping_address', 'billing_address',
    'customer_name', 'customer_phone', 'customer_email',
    'notes', 'internal_notes', 'meta_data'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

  /**
   * Get customer relationship
   */
  customer() {
    return this.belongsTo(Customer, 'customer_id', 'id');
  }

  /**
   * Get user (sales person) relationship
   */
  user() {
    return this.belongsTo(User, 'user_id', 'id');
  }

  /**
   * Get order items relationship
   */
  items() {
    return this.hasMany(OrderItem, 'order_id', 'id');
  }

  /**
   * Get payment transactions relationship
   */
  paymentTransactions() {
    return this.hasMany(PaymentTransaction, 'order_id', 'id');
  }

  /**
   * Check if order is pending
   */
  isPending() {
    return this.get('status') === 'pending';
  }

  /**
   * Check if order is completed/delivered
   */
  isCompleted() {
    return this.get('status') === 'delivered';
  }

  /**
   * Check if order is cancelled
   */
  isCancelled() {
    return this.get('status') === 'cancelled';
  }

  /**
   * Check if order is fully paid
   */
  isPaid() {
    return this.get('payment_status') === 'paid';
  }

  /**
   * Update order status
   */
  async updateStatus(newStatus) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }

    const updateData = { status: newStatus };
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Set appropriate timestamp based on status
    if (newStatus === 'confirmed') updateData.confirmed_at = now;
    if (newStatus === 'shipped') updateData.shipped_at = now;
    if (newStatus === 'delivered') updateData.delivered_at = now;
    if (newStatus === 'cancelled') updateData.cancelled_at = now;

    await this.constructor.update(this.get('id'), updateData);
    this._attributes.status = newStatus;
    
    return newStatus;
  }

  /**
   * Add payment to order
   */
  async addPayment(amount, paymentMethod = 'cash', options = {}) {
    const PaymentTransaction = require('./PaymentTransaction');
    
    const currentPaid = parseFloat(this.get('paid_amount')) || 0;
    const currentDue = parseFloat(this.get('due_amount')) || 0;
    const totalAmount = parseFloat(this.get('total_amount')) || 0;
    
    const newPaid = currentPaid + parseFloat(amount);
    const newDue = Math.max(0, totalAmount - newPaid);
    
    // Create payment transaction
    await PaymentTransaction.create({
      transaction_number: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_id: this.get('id'),
      customer_id: this.get('customer_id'),
      user_id: options.userId || null,
      payment_type: 'receive',
      payment_method: paymentMethod,
      amount: amount,
      currency: 'BDT',
      status: 'completed',
      reference_number: options.referenceNumber || null,
      notes: options.notes || null,
      paid_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    // Update order payment info
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
   * Get full order data with items and customer
   */
  async loadWithDetails() {
    return await this.constructor.query()
      .where(this.constructor.primaryKey, this.get('id'))
      .with('customer')
      .with('items')
      .first();
  }
}

module.exports = Order;
