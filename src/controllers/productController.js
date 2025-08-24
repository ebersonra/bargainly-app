/**
 * Product Controller
 * Handles product-related HTTP requests and delegates to services
 * Following the Controller → Service → Repository pattern
 */

const { Product } = require('../models');

/**
 * Create a new product
 * @param {Object} data - Product data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created product
 */
async function createProduct(data, srv) {
  // Create and validate model
  const product = new Product(data);
  const validation = product.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Delegate to service with validated data
  if (!srv || typeof srv.createProduct !== 'function') {
    throw new Error('Product service not available');
  }
  
  return srv.createProduct(product.toDbFormat());
}

/**
 * Get products for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options (filters, pagination)
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of products
 */
async function getProducts(user_id, options = {}, srv) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.getProducts !== 'function') {
    throw new Error('Product service not available');
  }
  
  const products = await srv.getProducts(user_id, options);
  
  // Convert to Product models
  return products.map(data => new Product(data));
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Product
 */
async function getProductById(id, user_id, srv) {
  if (!id) {
    throw new Error('Product ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.getProductById !== 'function') {
    throw new Error('Product service not available');
  }
  
  const productData = await srv.getProductById(id, user_id);
  
  if (!productData) {
    throw new Error('Product not found');
  }
  
  return new Product(productData);
}

/**
 * Update a product
 * @param {string} id - Product ID
 * @param {Object} data - Updated product data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Updated product
 */
async function updateProduct(id, data, srv) {
  if (!id) {
    throw new Error('Product ID is required');
  }
  
  // Create and validate model
  const product = new Product({ ...data, id });
  const validation = product.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  if (!srv || typeof srv.updateProduct !== 'function') {
    throw new Error('Product service not available');
  }
  
  return srv.updateProduct(id, product.toDbFormat());
}

/**
 * Delete a product
 * @param {string} id - Product ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {boolean} - Success status
 */
async function deleteProduct(id, user_id, srv) {
  if (!id) {
    throw new Error('Product ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.deleteProduct !== 'function') {
    throw new Error('Product service not available');
  }
  
  return srv.deleteProduct(id, user_id);
}

/**
 * Search products by barcode
 * @param {string} barcode - Product barcode
 * @param {string} user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Product data from external API or local database
 */
async function searchByBarcode(barcode, user_id, srv) {
  if (!barcode) {
    throw new Error('Barcode is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // Validate barcode format
  const cleanBarcode = barcode.replace(/\D/g, '');
  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    throw new Error('Invalid barcode format');
  }
  
  if (!srv || typeof srv.searchByBarcode !== 'function') {
    throw new Error('Product service not available');
  }
  
  const productData = await srv.searchByBarcode(cleanBarcode, user_id);
  
  if (productData) {
    return new Product(productData);
  }
  
  return null;
}

/**
 * Get product categories for a user
 * @param {string} user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of category strings
 */
async function getProductCategories(user_id, srv) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.getProductCategories !== 'function') {
    throw new Error('Product service not available');
  }
  
  return srv.getProductCategories(user_id);
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchByBarcode,
  getProductCategories
};
