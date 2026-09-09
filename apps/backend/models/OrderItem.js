/**
 * OrderItem Model for E-commerce ERP
 * Extends Aero Base Model
 */
const Model = require('../core/Model');

class OrderItem extends Model {
  static table = 'order_items';
  static primaryKey = 'id';
  static fillable = [
    'order_id', 'product_id', 'product_name', 'product_sku',
    'unit_price', 'quantity', 'discount_amount', 'tax_amount',
    'subtotal', 'total', 'product_options'
  ];
  static softDeletes = false;

  /**
   * Get order relationship
   */
  order() {
    const Order = require('./Order');
    return this.belongsTo(Order, 'order_id', 'id');
  }

  /**
   * Get product relationship
   */
  product() {
    const Product = require('./Product');
    return this.belongsTo(Product, 'product_id', 'id');
  }

  /**
   * Calculate item total
   */
  calculateTotal() {
    const unitPrice = parseFloat(this.get('unit_price')) || 0;
    const quantity = parseInt(this.get('quantity')) || 1;
    const discount = parseFloat(this.get('discount_amount')) || 0;
    const tax = parseFloat(this.get('tax_amount')) || 0;
    
    const subtotal = unitPrice * quantity;
    const total = subtotal - discount + tax;
    
    return { subtotal, total };
  }

  /**
   * Update item quantity and recalculate totals
   */
  async updateQuantity(newQuantity) {
    if (newQuantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const totals = this.calculateTotal();
    const unitPrice = parseFloat(this.get('unit_price')) || 0;
    const discount = parseFloat(this.get('discount_amount')) || 0;
    const tax = parseFloat(this.get('tax_amount')) || 0;
    
    const newSubtotal = unitPrice * newQuantity;
    const newTotal = newSubtotal - discount + tax;

    await this.constructor.update(this.get('id'), {
      quantity: newQuantity,
      subtotal: newSubtotal,
      total: newTotal
    });

    this._attributes.quantity = newQuantity;
    this._attributes.subtotal = newSubtotal;
    this._attributes.total = newTotal;

    return { quantity: newQuantity, subtotal: newSubtotal, total: newTotal };
  }
}

module.exports = OrderItem;
