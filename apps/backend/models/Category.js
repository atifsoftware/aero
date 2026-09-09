/**
 * Category Model for E-commerce ERP
 * Extends Aero Base Model with soft deletes and relationships
 */
const Model = require('../core/Model');

class Category extends Model {
  static table = 'categories';
  static primaryKey = 'id';
  static fillable = [
    'name', 'slug', 'description', 'parent_id',
    'sort_order', 'is_active', 'image', 'meta_data'
  ];
  static hidden = ['deleted_at'];
  static softDeletes = true;

  /**
   * Get parent category relationship
   */
  parent() {
    return this.belongsTo(Category, 'parent_id', 'id');
  }

  /**
   * Get child categories relationship
   */
  children() {
    return this.hasMany(Category, 'parent_id', 'id');
  }

  /**
   * Get products relationship
   */
  products() {
    const Product = require('./Product');
    return this.hasMany(Product, 'category_id', 'id');
  }

  /**
   * Check if category has children
   */
  hasChildren() {
    // This would need to be loaded separately or via query
    return this.get('children') && this.get('children').length > 0;
  }

  /**
   * Get full category tree with children
   */
  async loadWithChildren() {
    return await this.constructor.query()
      .where(this.constructor.primaryKey, this.get('id'))
      .with('children')
      .first();
  }

  /**
   * Get all ancestors of a category
   */
  async getAncestors() {
    const ancestors = [];
    let parentId = this.get('parent_id');
    
    while (parentId) {
      const parent = await Category.find(parentId);
      if (!parent) break;
      
      ancestors.push(parent);
      parentId = parent.get('parent_id');
    }
    
    return ancestors;
  }
}

module.exports = Category;
