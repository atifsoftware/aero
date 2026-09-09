/**
 * PurchaseOrderItem Model for E-commerce ERP
 * Extends Aero Base Model
 */
const Model = require('../core/Model');

class PurchaseOrderItem extends Model {
  static table = 'purchase_order_items';
  static primaryKey = 'id';
  static fillable = [
    'purchase_order_id', 'product_id', 'product_name', 'product_sku',
    'unit_cost', 'quantity_ordered', 'quantity_received',
    'discount_amount', 'tax_amount', 'subtotal', 'total'
  ];
  static softDeletes = false;

  /**
   * Get purchase order relationship
   */
  purchaseOrder() {
    const PurchaseOrder = require('./PurchaseOrder');
    return this.belongsTo(PurchaseOrder, 'purchase_order_id', 'id');
  }

  /**
   * Get product relationship
   */
  product() {
    const Product = require('./Product');
    return this.belongsTo(Product, 'product_id', 'id');
  }
}

module.exports = PurchaseOrderItem;
