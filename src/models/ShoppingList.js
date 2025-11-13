/**
 * Shopping List Model
 * Represents a shopping list with validation
 */
class ShoppingList {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.title = data.title || '';
    this.description = data.description || null;
    this.shopping_date = data.shopping_date || null;
    this.market_id = data.market_id || null;
    this.total_amount = data.total_amount || 0;
    this.share_code = data.share_code || null;
    this.is_completed = data.is_completed || false;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.deleted_at = data.deleted_at || null;
    
    // Additional fields from views/joins
    this.market_name = data.market_name || null;
    this.market_address = data.market_address || null;
    this.items_count = data.items_count || 0;
    this.checked_items_count = data.checked_items_count || 0;
    
    // Business logic fields
    this.items = data.items || [];
    this.status = data.status || null;
    this.completion_percentage = data.completion_percentage || 0;
  }

  /**
   * Validate shopping list data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.user_id) {
      errors.push('User ID is required');
    }

    if (!this.title || this.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!this.shopping_date) {
      errors.push('Shopping date is required');
    }

    // Field format validations
    if (this.title && this.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    // Date format validation
    if (this.shopping_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(this.shopping_date)) {
        errors.push('Shopping date must be in YYYY-MM-DD format');
      }
    }

    // Numeric validations
    if (this.total_amount !== null && this.total_amount < 0) {
      errors.push('Total amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to database format
   * @returns {Object}
   */
  toDbFormat() {
    return {
      user_id: this.user_id,
      title: this.title ? this.title.trim() : '',
      description: this.description ? this.description.trim() : null,
      shopping_date: this.shopping_date,
      market_id: this.market_id || null,
      total_amount: parseFloat(this.total_amount) || 0,
      is_completed: Boolean(this.is_completed)
    };
  }

  /**
   * Calculate completion percentage
   * @returns {number} - Completion percentage (0-100)
   */
  calculateCompletion() {
    if (this.items_count === 0) {
      return 0;
    }
    return Math.round((this.checked_items_count / this.items_count) * 100);
  }

  /**
   * Get list status based on date and completion
   * @returns {string} - Status: 'upcoming', 'today', 'overdue', 'completed'
   */
  getStatus() {
    if (this.is_completed) {
      return 'completed';
    }

    const today = new Date();
    const shoppingDate = new Date(this.shopping_date);

    today.setHours(0, 0, 0, 0);
    shoppingDate.setHours(0, 0, 0, 0);

    if (shoppingDate.getTime() === today.getTime()) {
      return 'today';
    } else if (shoppingDate < today) {
      return 'overdue';
    } else {
      return 'upcoming';
    }
  }

  /**
   * Check if list can be edited
   * @returns {boolean}
   */
  canEdit() {
    return !this.is_completed && !this.deleted_at;
  }

  /**
   * Check if list can be shared
   * @returns {boolean}
   */
  canShare() {
    return !this.deleted_at && this.share_code;
  }

  /**
   * Get formatted shopping date
   * @returns {string} - Formatted date in Portuguese
   */
  getFormattedDate() {
    if (!this.shopping_date) return '';
    
    const date = new Date(this.shopping_date);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Get time until shopping date
   * @returns {string} - Human readable time difference
   */
  getTimeUntilShopping() {
    if (!this.shopping_date) return '';

    const today = new Date();
    const shoppingDate = new Date(this.shopping_date);
    const diffTime = shoppingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Amanhã';
    } else if (diffDays === -1) {
      return 'Ontem';
    } else if (diffDays > 1) {
      return `Em ${diffDays} dias`;
    } else {
      return `${Math.abs(diffDays)} dias atrás`;
    }
  }
}

/**
 * Shopping List Item Model
 * Represents an item in a shopping list
 */
class ShoppingListItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.list_id = data.list_id || null;
    this.product_name = data.product_name || '';
    this.category = data.category || '';
    this.quantity = data.quantity || 1;
    this.unit = data.unit || 'un';
    this.unit_price = data.unit_price || 0;
    this.total_price = data.total_price || 0;
    this.is_checked = data.is_checked || false;
    this.notes = data.notes || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate shopping list item data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.product_name || this.product_name.trim() === '') {
      errors.push('Product name is required');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Category is required');
    }

    if (!this.unit || this.unit.trim() === '') {
      errors.push('Unit is required');
    }

    // Field format validations
    if (this.product_name && this.product_name.length > 100) {
      errors.push('Product name must be 100 characters or less');
    }

    if (this.notes && this.notes.length > 200) {
      errors.push('Notes must be 200 characters or less');
    }

    // Numeric validations
    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than zero');
    }

    if (this.unit_price < 0) {
      errors.push('Unit price cannot be negative');
    }

    if (this.total_price < 0) {
      errors.push('Total price cannot be negative');
    }

    // Unit validation
    const validUnits = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'];
    if (this.unit && !validUnits.includes(this.unit)) {
      errors.push(`Unit must be one of: ${validUnits.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to database format
   * @returns {Object}
   */
  toDbFormat() {
    return {
      list_id: this.list_id,
      product_name: this.product_name ? this.product_name.trim() : '',
      category: this.category ? this.category.trim() : '',
      quantity: parseFloat(this.quantity) || 1,
      unit: this.unit || 'un',
      unit_price: parseFloat(this.unit_price) || 0,
      total_price: parseFloat(this.total_price) || 0,
      is_checked: Boolean(this.is_checked),
      notes: this.notes ? this.notes.trim() : null
    };
  }

  /**
   * Calculate total price based on quantity and unit price
   * @returns {number} - Calculated total price
   */
  calculateTotal() {
    return this.quantity * this.unit_price;
  }

  /**
   * Update total price
   */
  updateTotal() {
    this.total_price = this.calculateTotal();
  }

  /**
   * Get formatted quantity with unit
   * @returns {string} - Formatted quantity
   */
  getFormattedQuantity() {
    const units = {
      'un': 'unidade',
      'kg': 'kg',
      'g': 'g',
      'l': 'litro',
      'ml': 'ml',
      'cx': 'caixa',
      'pct': 'pacote'
    };

    const unitLabel = units[this.unit] || this.unit;
    return `${this.quantity} ${unitLabel}${this.quantity > 1 && unitLabel === 'unidade' ? 's' : ''}`;
  }

  /**
   * Get formatted unit price
   * @returns {string} - Formatted unit price
   */
  getFormattedUnitPrice() {
    return `R$ ${this.unit_price.toFixed(2)}`;
  }

  /**
   * Get formatted total price
   * @returns {string} - Formatted total price
   */
  getFormattedTotalPrice() {
    return `R$ ${this.total_price.toFixed(2)}`;
  }
}

module.exports = { ShoppingList, ShoppingListItem };
