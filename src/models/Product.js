/**
 * Product Model
 * Represents a product with validation
 */
class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || '';
    this.barcode = data.barcode || '';
    this.brand = data.brand || '';
    this.unit = data.unit || 'unidade';
    this.image_url = data.image_url || null;
    this.user_id = data.user_id || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate product data
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Nome do produto é obrigatório');
    }

    if (!this.category || this.category.trim() === '') {
      errors.push('Categoria é obrigatória');
    }

    if (!this.user_id) {
      errors.push('ID do usuário é obrigatório');
    }

    // Validate barcode format if provided
    if (this.barcode && this.barcode.trim() !== '') {
      const barcodeRegex = /^\d{8,14}$/;
      if (!barcodeRegex.test(this.barcode.trim())) {
        errors.push('Código de barras deve conter apenas números (8-14 dígitos)');
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
      name: this.name.trim(),
      description: this.description ? this.description.trim() : null,
      category: this.category.trim(),
      barcode: this.barcode ? this.barcode.trim() : null,
      brand: this.brand ? this.brand.trim() : null,
      unit: this.unit || 'unidade',
      image_url: this.image_url,
      user_id: this.user_id
    };
  }

  /**
   * Create from form data
   * @param {FormData|Object} formData 
   * @param {string} user_id 
   * @returns {Product}
   */
  static fromFormData(formData, user_id) {
    const data = {};
    
    if (formData instanceof FormData) {
      data.name = formData.get('name');
      data.description = formData.get('description');
      data.category = formData.get('category');
      data.barcode = formData.get('barcode');
      data.brand = formData.get('brand');
      data.unit = formData.get('unit');
      data.image_url = formData.get('image_url');
    } else {
      Object.assign(data, formData);
    }

    data.user_id = user_id;
    return new Product(data);
  }

  /**
   * Create from barcode API response
   * @param {Object} apiData 
   * @param {string} user_id 
   * @returns {Product}
   */
  static fromBarcodeApi(apiData, user_id) {
    return new Product({
      name: apiData.description || apiData.product_name || '',
      description: apiData.full_description || '',
      category: apiData.category || '',
      barcode: apiData.gtin || apiData.barcode || '',
      brand: apiData.brand || '',
      image_url: apiData.thumbnail || apiData.image_url || null,
      user_id
    });
  }

  /**
   * Get display name (name + brand if available)
   * @returns {string}
   */
  getDisplayName() {
    if (this.brand && this.brand.trim() !== '') {
      return `${this.name} - ${this.brand}`;
    }
    return this.name;
  }

  /**
   * Get short description for lists
   * @param {number} maxLength 
   * @returns {string}
   */
  getShortDescription(maxLength = 100) {
    if (!this.description || this.description.length <= maxLength) {
      return this.description || '';
    }
    return this.description.substring(0, maxLength) + '...';
  }

  /**
   * Check if product has image
   * @returns {boolean}
   */
  hasImage() {
    return this.image_url && this.image_url.trim() !== '';
  }

  /**
   * Get image URL or placeholder
   * @returns {string}
   */
  getImageUrl() {
    return this.hasImage() ? this.image_url : '/static/img/products/placeholder.png';
  }

  /**
   * Check if product has barcode
   * @returns {boolean}
   */
  hasBarcode() {
    return this.barcode && this.barcode.trim() !== '';
  }

  /**
   * Format created date for display
   * @returns {string}
   */
  getFormattedCreatedDate() {
    if (!this.created_at) return '';
    const date = new Date(this.created_at);
    return date.toLocaleDateString('pt-BR');
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Product;
} else if (typeof window !== 'undefined') {
  window.Product = Product;
}
