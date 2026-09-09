/**
 * InventoryMovement Model for E-commerce ERP
 * Extends Aero Base Model for tracking stock movements
 */
const Model = require('../core/Model');

class InventoryMovement extends Model {
  static table = 'inventory_movements';
  static primaryKey = 'id';
  static fillable = [
    'product_id', 'quantity_change', 'movement_type',
    'reference_id', 'reference_type', 'user_id', 'notes',
    'cost_price', 'stock_before', 'stock_after'
  ];
  static softDeletes = false;

  // Valid movement types
  static MOVEMENT_TYPES = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer',
    DAMAGE: 'damage',
    RESTOCK: 'restock'
  };

  /**
   * Get product relationship
   */
  product() {
    return this.belongsTo(Product, 'product_id', 'id');
  }

  /**
   * Get user relationship
   */
  user() {
    return this.belongsTo(User, 'user_id', 'id');
  }

  /**
   * Check if movement is inbound (adds stock)
   */
  isInbound() {
    const inboundTypes = ['purchase', 'return', 'restock', 'adjustment'];
    return inboundTypes.includes(this.get('movement_type')) && this.get('quantity_change') > 0;
  }

  /**
   * Check if movement is outbound (reduces stock)
   */
  isOutbound() {
    const outboundTypes = ['sale', 'damage', 'transfer', 'adjustment'];
    return outboundTypes.includes(this.get('movement_type')) && this.get('quantity_change') < 0;
  }

  /**
   * Create a new inventory movement with automatic stock calculation
   */
  static async createMovement(productId, quantityChange, movementType, options = {}) {
    const Product = require('./Product');
    
    const product = await Product.find(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const currentStock = product.get('stock_quantity') || 0;
    const newStock = currentStock + parseInt(quantityChange);

    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${Math.abs(quantityChange)}`);
    }

    return await this.create({
      product_id: productId,
      quantity_change: parseInt(quantityChange),
      movement_type: movementType,
      reference_id: options.referenceId || null,
      reference_type: options.referenceType || null,
      user_id: options.userId || null,
      notes: options.notes || null,
      cost_price: options.costPrice || product.get('cost_price'),
      stock_before: currentStock,
      stock_after: newStock
    });
  }

  /**
   * Get movements by product
   */
  static async getByProduct(productId, limit = 50) {
    return await this.query()
      .where('product_id', productId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
  }

  /**
   * Get movements by date range
   */
  static async getByDateRange(startDate, endDate, options = {}) {
    let query = this.query()
      .whereBetween('created_at', [startDate, endDate]);

    if (options.movementType) {
      query = query.where('movement_type', options.movementType);
    }

    if (options.productId) {
      query = query.where('product_id', options.productId);
    }

    return await query.orderBy('created_at', 'desc').get();
  }
}

module.exports = InventoryMovement;
