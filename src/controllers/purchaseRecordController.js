/**
 * Purchase Record Controller
 * Handles HTTP requests and delegates to services
 * Following the Controller → Service → Repository pattern
 */

const service = require('../services/purchaseRecordService');
const { PurchaseRecord, Budget } = require('../models');

/**
 * Insert a new purchase record
 * @param {Object} data - Purchase record data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created purchase record
 */
async function insertPurchaseRecord(data, srv = service) {
  // Create and validate model
  const purchaseRecord = new PurchaseRecord(data);
  const validation = purchaseRecord.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Delegate to service with validated data
  return srv.insertPurchaseRecord(purchaseRecord.toDbFormat());
}

/**
 * Get budget status for a user
 * @param {string} user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of budget status objects
 */
async function getBudgetStatus(user_id, srv = service) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  const budgetData = await srv.getBudgetStatus(user_id);
  
  // Convert to Budget models for additional methods
  return budgetData.map(data => {
    const budget = new Budget(data);
    budget.calculateStatus(); // Ensure status is calculated
    return budget;
  });
}

/**
 * Set or update a budget
 * @param {Object} data - Budget data
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created/updated budget
 */
async function setBudget(data, srv = service) {
  // Create and validate model
  const budget = new Budget(data);
  const validation = budget.validate();
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Delegate to service with validated data
  return srv.setBudget(budget.toDbFormat());
}

/**
 * Get purchase categories for a user
 * @param {string} user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of category objects
 */
async function getPurchaseCategories(user_id, srv = service) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  return srv.getPurchaseCategories(user_id);
}

/**
 * Get purchase records for a user
 * @param {Object} params - Query parameters
 * @param {string} params.user_id - User ID
 * @param {number} params.limit - Number of records to return (default: 10)
 * @param {number} params.offset - Number of records to skip (default: 0)
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of purchase record objects
 */
async function getPurchaseRecords(params, srv = service) {
  const { user_id, limit = 10, offset = 0 } = params || {};
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    throw new Error('Limit must be a number between 1 and 100');
  }
  
  if (typeof offset !== 'number' || offset < 0) {
    throw new Error('Offset must be a non-negative number');
  }
  
  return srv.getPurchaseRecords({ user_id, limit, offset });
}

module.exports = { 
  insertPurchaseRecord, 
  getBudgetStatus, 
  setBudget, 
  getPurchaseCategories,
  getPurchaseRecords
};
