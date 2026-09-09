/**
 * Product Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class Product extends Model {
  static table = 'products';
  static primaryKey = 'id';
  static fillable = [
    'name', 'sku', 'description', 'price', 'cost_price',
    'stock_quantity', 'low_stock_threshold', 'category_id',
    'brand_id', 'unit', 'is_active', 'is_featured',
    'images', 'attributes'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

  /**
   * Get category relationship
   */
  category() {
    const Category = require('./Category');
    return this.belongsTo(Category, 'category_id', 'id');
  }

  /**
   * Get order items relationship
   */
  orderItems() {
    const OrderItem = require('./OrderItem');
    return this.hasMany(OrderItem, 'product_id', 'id');
  }

  /**
   * Get inventory movements relationship
   */
  inventoryMovements() {
    const InventoryMovement = require('./InventoryMovement');
    return this.hasMany(InventoryMovement, 'product_id', 'id');
  }

  /**
   * Check if product is in stock
   */
  isInStock() {
    return this.get('stock_quantity') > 0;
  }

  /**
   * Check if product is low on stock
   */
  isLowStock() {
    const threshold = this.get('low_stock_threshold') || 10;
    return this.get('stock_quantity') <= threshold;
  }

  /**
   * Update stock quantity with automatic inventory movement logging
   */
  async updateStock(quantityChange, movementType = 'adjustment', options = {}) {
    const currentStock = this.get('stock_quantity') || 0;
    const newStock = currentStock + parseInt(quantityChange);
    
    if (newStock < 0) {
      throw new Error('Insufficient stock quantity');
    }

    // Create inventory movement record
    const InventoryMovement = require('./InventoryMovement');
    await InventoryMovement.create({
      product_id: this.get('id'),
      quantity_change: parseInt(quantityChange),
      movement_type: movementType,
      reference_id: options.referenceId || null,
      reference_type: options.referenceType || null,
      user_id: options.userId || null,
      notes: options.notes || null,
      cost_price: options.costPrice || this.get('cost_price'),
      stock_before: currentStock,
      stock_after: newStock
    });

    // Update product stock
    await this.constructor.update(this.get('id'), {
      stock_quantity: newStock
    });

    this._attributes.stock_quantity = newStock;
    return newStock;
  }

  /**
   * Get full product data with category
   */
  async loadWithCategory() {
    return await this.constructor.query()
      .where(this.constructor.primaryKey, this.get('id'))
      .with('category')
      .first();
  }
}

module.exports = Product;
