/**
 * Market Model
 * Represents a market/store with validation
 */
class Market {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.address = data.address || '';
    this.cnpj = data.cnpj || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.website = data.website || '';
    this.user_id = data.user_id || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate market data
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('Nome do mercado é obrigatório');
    }

    if (!this.user_id) {
      errors.push('ID do usuário é obrigatório');
    }

    // Validate CNPJ format if provided
    if (this.cnpj && this.cnpj.trim() !== '') {
      const cleanCnpj = this.cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) {
        errors.push('CNPJ deve conter 14 dígitos');
      }
    }

    // Validate email format if provided
    if (this.email && this.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email.trim())) {
        errors.push('Email deve ter um formato válido');
      }
    }

    // Validate website format if provided
    if (this.website && this.website.trim() !== '') {
      try {
        new URL(this.website.trim());
      } catch {
        errors.push('Website deve ter um formato válido (ex: https://example.com)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format CNPJ for display
   * @returns {string}
   */
  getFormattedCnpj() {
    if (!this.cnpj) return '';
    const clean = this.cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return this.cnpj;
  }

  /**
   * Format phone for display
   * @returns {string}
   */
  getFormattedPhone() {
    if (!this.phone) return '';
    const clean = this.phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return this.phone;
  }

  /**
   * Convert to database format
   * @returns {Object}
   */
  toDbFormat() {
    return {
      name: this.name.trim(),
      address: this.address ? this.address.trim() : null,
      cnpj: this.cnpj ? this.cnpj.replace(/\D/g, '') : null,
      phone: this.phone ? this.phone.replace(/\D/g, '') : null,
      email: this.email ? this.email.trim().toLowerCase() : null,
      website: this.website ? this.website.trim() : null,
      user_id: this.user_id
    };
  }

  /**
   * Create from form data
   * @param {FormData|Object} formData 
   * @param {string} user_id 
   * @returns {Market}
   */
  static fromFormData(formData, user_id) {
    const data = {};
    
    if (formData instanceof FormData) {
      data.name = formData.get('name');
      data.address = formData.get('address');
      data.cnpj = formData.get('cnpj');
      data.phone = formData.get('phone');
      data.email = formData.get('email');
      data.website = formData.get('website');
    } else {
      Object.assign(data, formData);
    }

    data.user_id = user_id;
    return new Market(data);
  }

  /**
   * Create from CNPJ API response
   * @param {Object} apiData 
   * @param {string} user_id 
   * @returns {Market}
   */
  static fromCnpjApi(apiData, user_id) {
    return new Market({
      name: apiData.nome || apiData.fantasia || '',
      address: Market.formatAddressFromApi(apiData),
      cnpj: apiData.cnpj || '',
      phone: apiData.telefone || '',
      email: apiData.email || '',
      user_id
    });
  }

  /**
   * Format address from CNPJ API data
   * @param {Object} apiData 
   * @returns {string}
   */
  static formatAddressFromApi(apiData) {
    const parts = [];
    
    if (apiData.logradouro) parts.push(apiData.logradouro);
    if (apiData.numero) parts.push(apiData.numero);
    if (apiData.bairro) parts.push(apiData.bairro);
    if (apiData.municipio) parts.push(apiData.municipio);
    if (apiData.uf) parts.push(apiData.uf);
    if (apiData.cep) parts.push(`CEP: ${apiData.cep}`);
    
    return parts.join(', ');
  }

  /**
   * Get short address for lists
   * @param {number} maxLength 
   * @returns {string}
   */
  getShortAddress(maxLength = 50) {
    if (!this.address || this.address.length <= maxLength) {
      return this.address || '';
    }
    return this.address.substring(0, maxLength) + '...';
  }

  /**
   * Check if market has contact info
   * @returns {boolean}
   */
  hasContactInfo() {
    return !!(this.phone || this.email || this.website);
  }

  /**
   * Get contact info as formatted string
   * @returns {string}
   */
  getContactInfo() {
    const contacts = [];
    
    if (this.phone) contacts.push(`Tel: ${this.getFormattedPhone()}`);
    if (this.email) contacts.push(`Email: ${this.email}`);
    if (this.website) contacts.push(`Site: ${this.website}`);
    
    return contacts.join(' | ');
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
  module.exports = Market;
} else if (typeof window !== 'undefined') {
  window.Market = Market;
}
