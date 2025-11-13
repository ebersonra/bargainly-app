/**
 * Shopping List Service
 * Business logic layer for shopping lists
 * Following the Controller → Service → Repository pattern
 */

const repository = require('../repositories/shoppingListRepository');

/**
 * Validate shopping list data
 * @param {Object} data - Shopping list data
 * @throws {Error} - If validation fails
 */
function validateShoppingList(data) {
  const required = ['user_id', 'title', 'shopping_date'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Additional business validations
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error('Title must be a non-empty string');
  }
  
  if (data.title.trim().length > 100) {
    throw new Error('Title must be 100 characters or less');
  }
  
  if (data.description && data.description.length > 500) {
    throw new Error('Description must be 500 characters or less');
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.shopping_date)) {
    throw new Error('Shopping date must be in YYYY-MM-DD format');
  }
  
  // Check if date is not in the past (optional business rule)
  const shoppingDate = new Date(data.shopping_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates
  
  if (shoppingDate < today) {
    console.warn('Shopping date is in the past:', data.shopping_date);
    // Allow past dates but log a warning
  }
}

/**
 * Validate shopping list item data
 * @param {Object} data - Shopping list item data
 * @throws {Error} - If validation fails
 */
function validateShoppingListItem(data) {
  const required = ['product_name', 'category', 'quantity', 'unit'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Additional business validations
  if (typeof data.product_name !== 'string' || data.product_name.trim().length === 0) {
    throw new Error('Product name must be a non-empty string');
  }
  
  if (data.product_name.trim().length > 100) {
    throw new Error('Product name must be 100 characters or less');
  }
  
  if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    throw new Error('Category must be a non-empty string');
  }
  
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }
  
  if (data.unit_price !== undefined && data.unit_price < 0) {
    throw new Error('Price cannot be negative');
  }
  
  // Validate unit
  const validUnits = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'];
  if (!validUnits.includes(data.unit)) {
    throw new Error(`Unit must be one of: ${validUnits.join(', ')}`);
  }
  
  if (data.notes && data.notes.length > 200) {
    throw new Error('Notes must be 200 characters or less');
  }
}

/**
 * Create a new shopping list with items
 * @param {Object} listData - Shopping list data
 * @param {Array} items - Array of shopping list items
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Created shopping list with items
 */
async function createShoppingList(listData, items = [], repo = repository) {
  // Validate main list data
  validateShoppingList(listData);
  
  // Validate all items
  items.forEach((item, index) => {
    try {
      validateShoppingListItem(item);
    } catch (error) {
      throw new Error(`Item ${index + 1}: ${error.message}`);
    }
  });
  
  // Additional business logic
  if (items.length === 0) {
    throw new Error('Shopping list must have at least one item');
  }
  
  if (items.length > 100) {
    throw new Error('Shopping list cannot have more than 100 items');
  }
  
  // Normalize data
  const normalizedListData = {
    ...listData,
    title: listData.title.trim(),
    description: listData.description ? listData.description.trim() : null
  };
  
  const normalizedItems = items.map(item => ({
    ...item,
    product_name: item.product_name ? item.product_name.trim() : '',
    category: item.category ? item.category.trim() : '',
    quantity: parseFloat(item.quantity),
    unit_price: item.unit_price ? parseFloat(item.unit_price) : 0,
    notes: item.notes ? item.notes.trim() : null
  }));
  
  return repo.createShoppingList(normalizedListData, normalizedItems);
}

/**
 * Get shopping lists for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Array} - Array of shopping lists with metadata
 */
async function getShoppingLists(user_id, options = {}, repo = repository) {
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  const lists = await repo.getShoppingLists(user_id, options);
  
  // Add business logic calculations
  return lists.map(list => ({
    ...list,
    // Add completion percentage
    completion_percentage: list.items_count > 0 
      ? Math.round((list.checked_items_count / list.items_count) * 100)
      : 0,
    // Add status based on date
    status: getListStatus(list),
    // Format dates for display
    formatted_date: formatDate(list.shopping_date),
    // Add summary info
    summary: {
      total_items: list.items_count,
      checked_items: list.checked_items_count,
      remaining_items: list.items_count - list.checked_items_count,
      estimated_total: list.total_amount
    }
  }));
}

/**
 * Get shopping list by ID with full details
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object|null} - Shopping list with items and calculations
 */
async function getShoppingListById(id, user_id, repo = repository) {
  if (!id || !user_id) {
    throw new Error('List ID and User ID are required');
  }
  
  const list = await repo.getShoppingListById(id, user_id);
  
  if (!list) {
    return null;
  }
  
  // Add business calculations
  const itemsByCategory = groupItemsByCategory(list.items);
  const totals = calculateTotals(list.items);
  
  return {
    ...list,
    status: getListStatus(list),
    formatted_date: formatDate(list.shopping_date),
    items_by_category: itemsByCategory,
    summary: {
      total_items: list.items.length,
      checked_items: list.items.filter(item => item.is_checked).length,
      categories_count: Object.keys(itemsByCategory).length,
      ...totals
    }
  };
}

/**
 * Get shopping list by share code
 * @param {string} shareCode - 4-digit share code
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object|null} - Shopping list with items (read-only view)
 */
async function getShoppingListByShareCode(shareCode, repo = repository) {
  if (!shareCode || shareCode.length !== 4) {
    throw new Error('Share code must be 4 digits');
  }
  
  if (!/^\d{4}$/.test(shareCode)) {
    throw new Error('Share code must contain only numbers');
  }
  
  const list = await repo.getShoppingListByShareCode(shareCode);
  
  if (!list) {
    return null;
  }
  
  // Add read-only business calculations
  const itemsByCategory = groupItemsByCategory(list.items);
  const totals = calculateTotals(list.items);
  
  return {
    ...list,
    status: getListStatus(list),
    formatted_date: formatDate(list.shopping_date),
    items_by_category: itemsByCategory,
    summary: {
      total_items: list.items.length,
      checked_items: list.items.filter(item => item.is_checked).length,
      categories_count: Object.keys(itemsByCategory).length,
      ...totals
    },
    // Mark as shared/read-only
    is_shared_view: true
  };
}

/**
 * Update shopping list
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Updated shopping list
 */
async function updateShoppingList(id, user_id, updates, repo = repository) {
  if (!id || !user_id) {
    throw new Error('List ID and User ID are required');
  }
  
  // Validate updates if they contain list data
  if (updates.title || updates.description || updates.shopping_date) {
    const updateData = {
      user_id,
      title: updates.title || 'Temp Title', // Temporary for validation
      shopping_date: updates.shopping_date || '2025-01-01' // Temporary for validation
    };
    
    // Only validate fields that are being updated
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        throw new Error('Title must be a non-empty string');
      }
      if (updates.title.trim().length > 100) {
        throw new Error('Title must be 100 characters or less');
      }
    }
    
    if (updates.description !== undefined && updates.description && updates.description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }
    
    if (updates.shopping_date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(updates.shopping_date)) {
        throw new Error('Shopping date must be in YYYY-MM-DD format');
      }
    }
  }
  
  // Normalize string fields
  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.title) {
    normalizedUpdates.title = normalizedUpdates.title.trim();
  }
  if (normalizedUpdates.description) {
    normalizedUpdates.description = normalizedUpdates.description.trim();
  }
  
  return repo.updateShoppingList(id, user_id, normalizedUpdates);
}

/**
 * Delete shopping list
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} repo - Repository dependency (for testing)
 * @returns {Object} - Deleted shopping list
 */
async function deleteShoppingList(id, user_id, repo = repository) {
  if (!id || !user_id) {
    throw new Error('List ID and User ID are required');
  }
  
  return repo.deleteShoppingList(id, user_id);
}

// Helper functions

/**
 * Get list status based on date and completion
 * @param {Object} list - Shopping list
 * @returns {string} - Status: 'upcoming', 'today', 'overdue', 'completed'
 */
function getListStatus(list) {
  if (list.is_completed) {
    return 'completed';
  }
  
  const today = new Date();
  const shoppingDate = new Date(list.shopping_date);
  
  today.setHours(0, 0, 0, 0);
  shoppingDate.setHours(0, 0, 0, 0);
  
  if (shoppingDate.getTime() === today.getTime()) {
    return 'today';
  } else if (shoppingDate < today) {
    return 'overdue';
  } else {
    return 'upcoming';
  }
}

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Group items by category
 * @param {Array} items - Shopping list items
 * @returns {Object} - Items grouped by category
 */
function groupItemsByCategory(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
}

/**
 * Calculate totals for shopping list
 * @param {Array} items - Shopping list items
 * @returns {Object} - Calculated totals
 */
function calculateTotals(items) {
  const totalValue = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const checkedValue = items
    .filter(item => item.is_checked)
    .reduce((sum, item) => sum + (item.total_price || 0), 0);
  
  return {
    total_value: totalValue,
    checked_value: checkedValue,
    remaining_value: totalValue - checkedValue,
    average_item_price: items.length > 0 ? totalValue / items.length : 0
  };
}

module.exports = {
  createShoppingList,
  getShoppingLists,
  getShoppingListById,
  getShoppingListByShareCode,
  updateShoppingList,
  deleteShoppingList,
  validateShoppingList,
  validateShoppingListItem
};
