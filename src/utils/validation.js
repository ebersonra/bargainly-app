/**
 * Validation Utilities
 * Common validation functions used across the application
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate CNPJ format and checksum
 * @param {string} cnpj - CNPJ to validate
 * @returns {Object} - Validation result with isValid and cleanCnpj
 */
function validateCnpj(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') {
    return { isValid: false, error: 'CNPJ is required' };
  }
  
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) {
    return { isValid: false, error: 'CNPJ must have exactly 14 digits' };
  }
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return { isValid: false, error: 'CNPJ cannot have all identical digits' };
  }
  
  // Validate checksum
  if (!validateCnpjChecksum(cleanCnpj)) {
    return { isValid: false, error: 'CNPJ checksum is invalid' };
  }
  
  return { isValid: true, cleanCnpj };
}

/**
 * Validate CNPJ checksum algorithm
 * @param {string} cnpj - Clean CNPJ (14 digits)
 * @returns {boolean} - True if valid
 */
function validateCnpjChecksum(cnpj) {
  // Calculate first check digit
  let sum = 0;
  let weight = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let checkDigit1 = sum % 11;
  checkDigit1 = checkDigit1 < 2 ? 0 : 11 - checkDigit1;
  
  if (parseInt(cnpj[12]) !== checkDigit1) {
    return false;
  }
  
  // Calculate second check digit
  sum = 0;
  weight = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let checkDigit2 = sum % 11;
  checkDigit2 = checkDigit2 < 2 ? 0 : 11 - checkDigit2;
  
  return parseInt(cnpj[13]) === checkDigit2;
}

/**
 * Validate barcode format
 * @param {string} barcode - Barcode to validate
 * @returns {Object} - Validation result
 */
function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, error: 'Barcode is required' };
  }
  
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    return { isValid: false, error: 'Barcode must be between 8 and 14 digits' };
  }
  
  return { isValid: true, cleanBarcode };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} - Validation result
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return { isValid: false, error: 'Phone number must have 10 or 11 digits' };
  }
  
  return { isValid: true, cleanPhone };
}

/**
 * Validate required fields in an object
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {Object} - Validation result
 */
function validateDate(date) {
  if (!date || typeof date !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const parsedDate = new Date(date + 'T00:00:00');
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true, parsedDate };
}

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options (min, max, required)
 * @returns {Object} - Validation result
 */
function validateNumber(value, options = {}) {
  const { min, max, required = true } = options;
  
  if (required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: 'Value is required' };
  }
  
  if (!required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Value must be a valid number' };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }
  
  return { isValid: true, numValue };
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {Object} options - Validation options (min, max, required)
 * @returns {Object} - Validation result
 */
function validateStringLength(str, options = {}) {
  const { min, max, required = true } = options;
  
  if (required && (!str || typeof str !== 'string' || str.trim() === '')) {
    return { isValid: false, error: 'Value is required' };
  }
  
  if (!required && (!str || typeof str !== 'string')) {
    return { isValid: true };
  }
  
  const trimmed = str.trim();
  
  if (min !== undefined && trimmed.length < min) {
    return { isValid: false, error: `Value must be at least ${min} characters` };
  }
  
  if (max !== undefined && trimmed.length > max) {
    return { isValid: false, error: `Value must be at most ${max} characters` };
  }
  
  return { isValid: true, trimmed };
}

module.exports = {
  isValidEmail,
  isValidUrl,
  validateCnpj,
  validateCnpjChecksum,
  validateBarcode,
  validatePhone,
  validateRequiredFields,
  validateDate,
  validateNumber,
  validateStringLength
};
