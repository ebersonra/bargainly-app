/**
 * Shopping List Controller
 * Handles HTTP requests and delegates to services
 * Following the Controller → Service → Repository pattern
 */

const service = require('../services/shoppingListService');
const { ShoppingList, ShoppingListItem } = require('../models');

/**
 * Create a new shopping list with items
 * @param {Object} data - Shopping list data with items
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Created shopping list with items
 */
async function createShoppingList(data, srv = service) {
  if (!data || typeof data !== 'object') {
    throw new Error('Request data is required');
  }
  
  // Extract list data and items from request
  const { title, description, shopping_date, market_id, user_id, items } = data;
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }
  
  // Create and validate shopping list model
  const shoppingList = new ShoppingList({
    user_id,
    title,
    description,
    shopping_date,
    market_id
  });
  
  const listValidation = shoppingList.validate();
  if (!listValidation.isValid) {
    throw new Error(`List validation failed: ${listValidation.errors.join(', ')}`);
  }
  
  // Validate all items
  const validatedItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = new ShoppingListItem(items[i]);
    const itemValidation = item.validate();
    
    if (!itemValidation.isValid) {
      throw new Error(`Item ${i + 1} validation failed: ${itemValidation.errors.join(', ')}`);
    }
    
    validatedItems.push(item.toDbFormat());
  }
  
  // Delegate to service with validated data
  return srv.createShoppingList(shoppingList.toDbFormat(), validatedItems);
}

/**
 * Get shopping lists for a user
 * @param {Object} params - Query parameters
 * @param {string} params.user_id - User ID
 * @param {boolean} params.is_completed - Filter by completion status
 * @param {string} params.market_id - Filter by market
 * @param {number} params.limit - Number of records to return
 * @param {number} params.offset - Number of records to skip
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDirection - Order direction (asc/desc)
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Array} - Array of shopping lists
 */
async function getShoppingLists(params, srv = service) {
  const { user_id, is_completed, market_id, orderBy, orderDirection } = params || {};
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // Convert string parameters to numbers with validation
  let limit = parseInt(params.limit) || 50;
  let offset = parseInt(params.offset) || 0;
  
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be a number between 1 and 100');
  }
  
  if (offset < 0) {
    throw new Error('Offset must be a non-negative number');
  }
  
  const options = {
    is_completed,
    market_id,
    limit,
    offset,
    orderBy,
    orderDirection
  };
  
  return srv.getShoppingLists(user_id, options);
}

/**
 * Get shopping list by ID
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListById(id, user_id, srv = service) {
  if (!id) {
    throw new Error('Shopping list ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  return srv.getShoppingListById(id, user_id);
}

/**
 * Get shopping list by share code (public access)
 * @param {string} shareCode - 4-digit share code
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListByShareCode(shareCode, srv = service) {
  if (!shareCode) {
    throw new Error('Share code is required');
  }
  
  return srv.getShoppingListByShareCode(shareCode);
}

/**
 * Update shopping list
 * @param {Object} data - Update data
 * @param {string} data.id - Shopping list ID
 * @param {string} data.user_id - User ID for authorization
 * @param {Object} data.updates - Fields to update
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Updated shopping list
 */
async function updateShoppingList(data, srv = service) {
  const { id, user_id, updates } = data || {};
  
  if (!id) {
    throw new Error('Shopping list ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }
  
  return srv.updateShoppingList(id, user_id, updates);
}

/**
 * Delete shopping list
 * @param {Object} params - Request parameters
 * @param {string} params.id - Shopping list ID
 * @param {string} params.user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Deleted shopping list
 */
async function deleteShoppingList(params, srv = service) {
  const { id, user_id } = params || {};
  
  if (!id) {
    throw new Error('Shopping list ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  return srv.deleteShoppingList(id, user_id);
}

/**
 * Complete shopping list (mark as completed)
 * @param {Object} params - Request parameters
 * @param {string} params.id - Shopping list ID
 * @param {string} params.user_id - User ID for authorization
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Updated shopping list
 */
async function completeShoppingList(params, srv = service) {
  const { id, user_id } = params || {};
  
  if (!id) {
    throw new Error('Shopping list ID is required');
  }
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  const updates = {
    is_completed: true
  };
  
  return srv.updateShoppingList(id, user_id, updates);
}

/**
 * Get user's shopping list statistics
 * @param {Object} params - Request parameters
 * @param {string} params.user_id - User ID
 * @param {Object} srv - Service dependency (for testing)
 * @returns {Object} - Shopping list statistics
 */
async function getShoppingListStats(params, srv = service) {
  const { user_id } = params || {};
  
  if (!user_id) {
    throw new Error('User ID is required');
  }
  
  // Get all lists for the user
  const allLists = await srv.getShoppingLists(user_id, { limit: 1000 });
  
  // Calculate statistics
  const totalLists = allLists.length;
  const completedLists = allLists.filter(list => list.is_completed).length;
  const activeLists = totalLists - completedLists;
  const overdueLists = allLists.filter(list => list.status === 'overdue' && !list.is_completed).length;
  const todayLists = allLists.filter(list => list.status === 'today' && !list.is_completed).length;
  
  const totalValue = allLists.reduce((sum, list) => sum + (list.total_amount || 0), 0);
  const averageValue = totalLists > 0 ? totalValue / totalLists : 0;
  
  const totalItems = allLists.reduce((sum, list) => sum + (list.items_count || 0), 0);
  const averageItemsPerList = totalLists > 0 ? totalItems / totalLists : 0;
  
  return {
    summary: {
      total_lists: totalLists,
      active_lists: activeLists,
      completed_lists: completedLists,
      overdue_lists: overdueLists,
      today_lists: todayLists
    },
    financial: {
      total_value: totalValue,
      average_list_value: averageValue,
      completed_value: allLists
        .filter(list => list.is_completed)
        .reduce((sum, list) => sum + (list.total_amount || 0), 0)
    },
    items: {
      total_items: totalItems,
      average_items_per_list: averageItemsPerList
    },
    completion_rate: totalLists > 0 ? (completedLists / totalLists) * 100 : 0
  };
}

module.exports = {
  createShoppingList,
  getShoppingLists,
  getShoppingListById,
  getShoppingListByShareCode,
  updateShoppingList,
  deleteShoppingList,
  completeShoppingList,
  getShoppingListStats
};
