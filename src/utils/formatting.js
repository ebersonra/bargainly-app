/**
 * Formatting Utilities
 * Common formatting functions used across the application
 */

/**
 * Format currency value to Brazilian Real
 * @param {number} value - Numeric value
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted cu// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  // Browser environment - add to window object
  window.formatUtils = {
    formatCurrency,
    formatCnpj,
    formatPhone,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercentage,
    truncateText,
    capitalizeWords,
    formatFileSize,
    formatBarcode,
    removeNonNumeric
  };
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    formatCurrency,
    formatCnpj,
    formatPhone,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercentage,
    truncateText,
    capitalizeWords,
    formatFileSize,
    formatBarcode,
    removeNonNumeric
  };
} */
function formatCurrency(value, options = {}) {
  const { 
    currency = 'BRL', 
    locale = 'pt-BR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Format CNPJ for display
 * @param {string} cnpj - Clean CNPJ (14 digits) or formatted CNPJ
 * @returns {string} - Formatted CNPJ (XX.XXX.XXX/XXXX-XX)
 */
function formatCnpj(cnpj) {
  if (!cnpj) return '';
  
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

/**
 * Format phone number for display
 * @param {string} phone - Clean phone number or formatted phone
 * @returns {string} - Formatted phone number
 */
function formatPhone(phone) {
  if (!phone) return '';
  
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
function formatDate(date, options = {}) {
  const { 
    locale = 'pt-BR',
    dateStyle = 'short',
    timeZone = 'America/Sao_Paulo'
  } = options;
  
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateObj = new Date(date + 'T00:00:00');
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeZone
  }).format(dateObj);
}

/**
 * Format date and time for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date and time string
 */
function formatDateTime(date, options = {}) {
  const { 
    locale = 'pt-BR',
    dateStyle = 'short',
    timeStyle = 'short',
    timeZone = 'America/Sao_Paulo'
  } = options;
  
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone
  }).format(dateObj);
}

/**
 * Format number for display
 * @param {number} value - Number to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted number string
 */
function formatNumber(value, options = {}) {
  const { 
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;
  
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Format percentage for display
 * @param {number} value - Percentage value (0-100 or 0-1)
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted percentage string
 */
function formatPercentage(value, options = {}) {
  const { 
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    normalizeFromDecimal = false
  } = options;
  
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  // If value is between 0-1, convert to percentage
  const percentValue = normalizeFromDecimal && value <= 1 ? value * 100 : value;
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(percentValue / 100);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
function capitalizeWords(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format barcode for display (add spaces for readability)
 * @param {string} barcode - Barcode to format
 * @returns {string} - Formatted barcode
 */
function formatBarcode(barcode) {
  if (!barcode) return '';
  
  const clean = barcode.replace(/\D/g, '');
  
  // Format common barcode lengths
  if (clean.length === 13) {
    // EAN-13: X XXXXXX XXXXXX X
    return clean.replace(/(\d{1})(\d{6})(\d{6})(\d{1})/, '$1 $2 $3 $4');
  } else if (clean.length === 12) {
    // UPC-A: XXX XXX XXX XXX
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  } else if (clean.length === 8) {
    // EAN-8: XXXX XXXX
    return clean.replace(/(\d{4})(\d{4})/, '$1 $2');
  }
  
  return clean;
}

/**
 * Remove formatting from string (keep only numbers)
 * @param {string} str - String to clean
 * @returns {string} - Clean string with only numbers
 */
function removeNonNumeric(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\D/g, '');
}
