/**
 * PurchaseRecord Model
 * Represents a purchase record with validation
 */
class PurchaseRecord {
  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.amount = data.amount || 0;
    this.category = data.category || '';
    this.purchase_date = data.purchase_date || new Date().toISOString().slice(0, 10);
    this.market = data.market || null;
    this.description = data.description || null;
    this.source = data.source || null;
  }

  /**
   * Validate purchase record data
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.user_id) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!this.amount || this.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Categoria é obrigatória');
    }

    if (!this.purchase_date) {
      errors.push('Data da compra é obrigatória');
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(this.purchase_date)) {
        errors.push('Data deve estar no formato YYYY-MM-DD');
      }
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
      amount: parseFloat(this.amount),
      category: this.category.trim(),
      purchase_date: this.purchase_date,
      market: this.market ? this.market.trim() : null,
      description: this.description ? this.description.trim() : null,
      source: this.source
    };
  }

  /**
   * Create from form data
   * @param {FormData|Object} formData 
   * @param {string} user_id 
   * @returns {PurchaseRecord}
   */
  static fromFormData(formData, user_id) {
    const data = {};
    
    if (formData instanceof FormData) {
      data.amount = formData.get('amount');
      data.category = formData.get('category');
      data.purchase_date = formData.get('date') || formData.get('purchase_date');
      data.market = formData.get('market');
      data.description = formData.get('description');
    } else {
      Object.assign(data, formData);
    }

    data.user_id = user_id;
    return new PurchaseRecord(data);
  }

  /**
   * Format currency for display
   * @returns {string}
   */
  getFormattedAmount() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.amount);
  }

  /**
   * Format date for display
   * @returns {string}
   */
  getFormattedDate() {
    const date = new Date(this.purchase_date + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PurchaseRecord;
} else if (typeof window !== 'undefined') {
  window.PurchaseRecord = PurchaseRecord;
}
