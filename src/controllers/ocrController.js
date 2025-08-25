/**
 * OCR Controller
 * Handles OCR-related HTTP requests and delegates to services
 * Following the Controller → Service → Repository pattern
 */

const ocrService = require('../services/ocrService');

/**
 * Process receipt image/data with OCR
 * @param {Object|Buffer|File} data - Receipt data to process
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - OCR results with extracted items
 */
async function processReceipt(data, srv = ocrService) {
  if (!data) {
    throw new Error('Receipt data is required');
  }
  
  // Delegate to service
  return srv.processReceipt(data);
}

/**
 * Process receipt image with OCR
 * @param {Buffer|File} imageData - Image data to process
 * @param {Object} options - Processing options
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - OCR results with extracted items
 */
async function processReceiptOcr(imageData, options = {}, srv = ocrService) {
  if (!imageData) {
    throw new Error('Image data is required');
  }
  
  // Validate image format/size if needed
  if (options.maxSize && imageData.length > options.maxSize) {
    throw new Error(`Image size exceeds maximum allowed (${options.maxSize} bytes)`);
  }
  
  // Delegate to service
  return srv.processReceiptOcr ? srv.processReceiptOcr(imageData, options) : srv.processReceipt(imageData);
}

/**
 * Process receipt text with AI extraction
 * @param {string} text - Raw text from OCR
 * @param {Object} options - Processing options
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Extracted and structured purchase data
 */
async function extractPurchaseData(text, options = {}, srv = ocrService) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }
  
  if (text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  
  // Delegate to service
  return srv.extractPurchaseData ? srv.extractPurchaseData(text, options) : srv.processReceipt(text);
}

/**
 * Validate OCR extracted items
 * @param {Array} items - Array of extracted items
 * @returns {Object} - Validation result with valid/invalid items
 */
function validateExtractedItems(items) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }
  
  const validItems = [];
  const invalidItems = [];
  
  items.forEach((item, index) => {
    const errors = [];
    
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      errors.push('Nome do item é obrigatório');
    }
    
    if (!item.price || isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0) {
      errors.push('Preço deve ser um número válido maior que zero');
    }
    
    if (errors.length === 0) {
      validItems.push({
        ...item,
        name: item.name.trim(),
        price: parseFloat(item.price),
        category: item.category || 'Outros',
        quantity: item.quantity || 1
      });
    } else {
      invalidItems.push({
        index,
        item,
        errors
      });
    }
  });
  
  return {
    valid: validItems,
    invalid: invalidItems,
    hasErrors: invalidItems.length > 0
  };
}

module.exports = { 
  processReceipt,
  processReceiptOcr, 
  extractPurchaseData, 
  validateExtractedItems 
};
