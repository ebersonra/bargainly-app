/**
 * Budget Model
 * Represents a budget with validation and calculation methods
 */
class Budget {
  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.category = data.category || '';
    this.limit = data.limit || 0;
    this.month = data.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    this.spent = data.spent || 0;
    this.percentage = data.percentage || 0;
    this.alert = data.alert || null;
  }

  /**
   * Validate budget data
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.user_id) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Categoria é obrigatória');
    }

    if (!this.limit || this.limit <= 0) {
      errors.push('Limite deve ser maior que zero');
    }

    if (!this.month) {
      errors.push('Mês é obrigatório');
    } else {
      // Validate month format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(this.month)) {
        errors.push('Mês deve estar no formato YYYY-MM');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate percentage and alert status based on spent amount
   */
  calculateStatus() {
    this.percentage = this.limit > 0 ? (this.spent / this.limit) * 100 : 0;
    
    if (this.percentage >= 100) {
      this.alert = 'limit exceeded';
    } else if (this.percentage >= 80) {
      this.alert = 'near limit';
    } else {
      this.alert = null;
    }
  }

  /**
   * Get remaining budget amount
   * @returns {number}
   */
  getRemainingAmount() {
    return Math.max(0, this.limit - this.spent);
  }

  /**
   * Check if budget is exceeded
   * @returns {boolean}
   */
  isExceeded() {
    return this.spent > this.limit;
  }

  /**
   * Check if budget is near limit (80% or more)
   * @returns {boolean}
   */
  isNearLimit() {
    return this.percentage >= 80 && !this.isExceeded();
  }

  /**
   * Get alert message based on status
   * @returns {string|null}
   */
  getAlertMessage() {
    if (this.alert === 'limit exceeded') {
      return `Limite excedido em ${this.getFormattedAmount(this.spent - this.limit)}`;
    } else if (this.alert === 'near limit') {
      return `Próximo do limite. Restam ${this.getFormattedAmount(this.getRemainingAmount())}`;
    }
    return null;
  }

  /**
   * Format currency for display
   * @param {number} value 
   * @returns {string}
   */
  getFormattedAmount(value = this.limit) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Get formatted spent amount
   * @returns {string}
   */
  getFormattedSpent() {
    return this.getFormattedAmount(this.spent);
  }

  /**
   * Get formatted limit amount
   * @returns {string}
   */
  getFormattedLimit() {
    return this.getFormattedAmount(this.limit);
  }

  /**
   * Get formatted remaining amount
   * @returns {string}
   */
  getFormattedRemaining() {
    return this.getFormattedAmount(this.getRemainingAmount());
  }

  /**
   * Convert to database format
   * @returns {Object}
   */
  toDbFormat() {
    return {
      user_id: this.user_id,
      category: this.category.trim(),
      limit: parseFloat(this.limit),
      month: this.month
    };
  }

  /**
   * Create from form data
   * @param {FormData|Object} formData 
   * @param {string} user_id 
   * @returns {Budget}
   */
  static fromFormData(formData, user_id) {
    const data = {};
    
    if (formData instanceof FormData) {
      data.category = formData.get('category');
      data.limit = formData.get('limit');
      data.month = formData.get('month');
    } else {
      Object.assign(data, formData);
    }

    data.user_id = user_id;
    return new Budget(data);
  }

  /**
   * Get CSS class for budget bar based on status
   * @returns {string}
   */
  getBarCssClass() {
    if (this.alert === 'limit exceeded') {
      return 'budget-bar budget-bar-exceeded';
    } else if (this.alert === 'near limit') {
      return 'budget-bar budget-bar-warning';
    }
    return 'budget-bar budget-bar-normal';
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Budget;
} else if (typeof window !== 'undefined') {
  window.Budget = Budget;
}
