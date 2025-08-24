/**
 * Purchase Record Service
 * Business logic layer for purchase records and budgets
 * Following the Controller → Service → Repository pattern
 */

const repository = require('../repositories/purchaseRecordRepository');

/**
 * Validate purchase record data
 * @param {Object} data - Purchase record data
 * @throws {Error} - If validation fails
 */
function validateRecord(data) {
  const required = ['user_id', 'amount', 'category'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Additional business validations
  if (data.amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  
  if (typeof data.category !== 'string' || data.category.trim() === '') {
    throw new Error('Category must be a non-empty string');
  }
}

/**
 * Validate budget data
 * @param {Object} data - Budget data
 * @throws {Error} - If validation fails
 */
function validateBudget(data) {
  const required = ['user_id', 'category', 'limit'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Additional business validations
  if (data.limit <= 0) {
    throw new Error('Budget limit must be greater than zero');
  }
  
  if (typeof data.category !== 'string' || data.category.trim() === '') {
    throw new Error('Category must be a non-empty string');
  }
}

/**
 * Insert a new purchase record
 * @param {Object} data - Purchase record data
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Created purchase record
 */
async function insertPurchaseRecord(data, repo = repository) {
  validateRecord(data);
  
  // Additional business logic can be added here
  // e.g., category normalization, fraud detection, etc.
  
  return repo.insertPurchaseRecord(data);
}

/**
 * Set or update a budget
 * @param {Object} data - Budget data
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Created/updated budget
 */
async function setBudget(data, repo = repository) {
  validateBudget(data);
  
  // Additional business logic can be added here
  // e.g., budget approval workflows, notifications, etc.
  
  return repo.upsertBudget(data);
}

/**
 * Get budget status with calculations
 * @param {string} user_id - User ID
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Array} - Array of budget status objects with calculations
 */
async function getBudgetStatus(user_id, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // Fetch data from repository
  const [budgets, spent] = await Promise.all([
    repo.fetchBudgets(user_id),
    repo.fetchTotalSpent(user_id)
  ]);

  // Aggregate spent amounts by category
  const totals = spent.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + rec.amount;
    return acc;
  }, {});
  
  // Calculate status for each budget
  return budgets.map(budget => {
    const spentAmount = totals[budget.category] || 0;
    const percentage = budget.limit > 0 ? (spentAmount / budget.limit) * 100 : 0;
    
    let alert = null;
    
    if (percentage >= 100) {
      alert = 'limit exceeded';
    } else if (percentage >= 80) {
      alert = 'near limit';
    }
    
    return {
      category: budget.category,
      limit: budget.limit,
      spent: spentAmount,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      alert,
      remaining: Math.max(0, budget.limit - spentAmount)
    };
  });
}

/**
 * Get purchase categories for a user
 * @param {string} user_id - User ID
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Array} - Array of category objects
 */
async function getPurchaseCategories(user_id, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // First try to get existing categories
  let categories = await repo.fetchPurchaseCategories(user_id);
  
  // If none exist, seed with defaults
  if (categories.length === 0) {
    categories = await repo.seedDefaultCategories(user_id);
  }
  
  return categories;
}

/**
 * Get spending summary for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options (date range, category filter)
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Spending summary with totals and breakdowns
 */
async function getSpendingSummary(user_id, options = {}, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  const spent = await repo.fetchTotalSpent(user_id, options);
  
  // Calculate totals and breakdowns
  const categoryTotals = spent.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + rec.amount;
    return acc;
  }, {});
  
  const totalSpent = spent.reduce((total, rec) => total + rec.amount, 0);
  
  return {
    totalSpent,
    categoryTotals,
    transactionCount: spent.length,
    averageTransaction: spent.length > 0 ? totalSpent / spent.length : 0
  };
}

/**
 * Get purchase records for a user
 * @param {Object} params - Query parameters
 * @param {string} params.user_id - User ID
 * @param {number} params.limit - Number of records to return
 * @param {number} params.offset - Number of records to skip
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Array} - Array of purchase record objects
 */
async function getPurchaseRecords(params, repo = repository) {
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
  
  return repo.fetchPurchaseRecords({ user_id, limit, offset });
}

module.exports = { 
  insertPurchaseRecord, 
  getBudgetStatus, 
  setBudget, 
  getPurchaseCategories,
  getSpendingSummary,
  getPurchaseRecords,
  validateRecord,
  validateBudget
};
