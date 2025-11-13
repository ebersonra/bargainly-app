/**
 * Market Controller
 * Handles market-related HTTP requests and delegates to services
 * Following the Controller → Service → Repository pattern
 */

const { Market } = require('../models');

/**
 * Create a new market
 * @param {Object} data - Market data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created market
 */
async function createMarket(data, srv) {
  // Create and validate model
  const market = new Market(data);
  const validation = market.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Delegate to service with validated data
  if (!srv || typeof srv.createMarket !== 'function') {
    throw new Error('Market service not available');
  }
  
  return srv.createMarket(market.toDbFormat());
}

/**
 * Get markets for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options (filters, pagination)
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of markets
 */
async function getMarkets(user_id, options = {}, srv) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.getMarkets !== 'function') {
    throw new Error('Market service not available');
  }
  
  const markets = await srv.getMarkets(user_id, options);
  
  // Convert to Market models
  return markets.map(data => new Market(data));
}

/**
 * Get market by ID
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Market
 */
async function getMarketById(id, user_id, srv) {
  if (!id) {
    throw new Error('Market ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.getMarketById !== 'function') {
    throw new Error('Market service not available');
  }
  
  const marketData = await srv.getMarketById(id, user_id);
  
  if (!marketData) {
    throw new Error('Market not found');
  }
  
  return new Market(marketData);
}

/**
 * Update a market
 * @param {string} id - Market ID
 * @param {Object} data - Updated market data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Updated market
 */
async function updateMarket(id, data, srv) {
  if (!id) {
    throw new Error('Market ID is required');
  }
  
  // Create and validate model
  const market = new Market({ ...data, id });
  const validation = market.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  if (!srv || typeof srv.updateMarket !== 'function') {
    throw new Error('Market service not available');
  }
  
  return srv.updateMarket(id, market.toDbFormat());
}

/**
 * Delete a market
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {boolean} - Success status
 */
async function deleteMarket(id, user_id, srv) {
  if (!id) {
    throw new Error('Market ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!srv || typeof srv.deleteMarket !== 'function') {
    throw new Error('Market service not available');
  }
  
  return srv.deleteMarket(id, user_id);
}

/**
 * Search market by CNPJ
 * @param {string} cnpj - Market CNPJ
 * @param {string} user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Market data from external API
 */
async function searchByCnpj(cnpj, user_id, srv) {
  if (!cnpj) {
    throw new Error('CNPJ is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // Validate and clean CNPJ
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ must have exactly 14 digits');
  }
  
  if (!srv || typeof srv.searchByCnpj !== 'function') {
    throw new Error('Market service not available');
  }
  
  const marketData = await srv.searchByCnpj(cleanCnpj, user_id);
  
  if (marketData) {
    return new Market(marketData);
  }
  
  return null;
}

/**
 * Validate CNPJ format
 * @param {string} cnpj - CNPJ to validate
 * @returns {Object} - Validation result
 */
function validateCnpj(cnpj) {
  if (!cnpj) {
    return { isValid: false, error: 'CNPJ is required' };
  }
  
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) {
    return { isValid: false, error: 'CNPJ must have exactly 14 digits' };
  }
  
  // Basic CNPJ validation algorithm
  if (!/^\d{14}$/.test(cleanCnpj)) {
    return { isValid: false, error: 'CNPJ must contain only numbers' };
  }
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return { isValid: false, error: 'CNPJ cannot have all identical digits' };
  }
  
  return { isValid: true, cleanCnpj };
}

module.exports = {
  createMarket,
  getMarkets,
  getMarketById,
  updateMarket,
  deleteMarket,
  searchByCnpj,
  validateCnpj
};
