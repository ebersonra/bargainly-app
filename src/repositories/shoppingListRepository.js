/**
 * Shopping List Repository
 * Data access layer for shopping lists
 * Following the Controller → Service → Repository pattern
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Get Supabase client
 * @returns {Object} - Supabase client instance
 */
function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are required');
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Create a new shopping list with items
 * @param {Object} listData - Shopping list data
 * @param {Array} items - Array of shopping list items
 * @returns {Object} - Created shopping list with items
 */
async function createShoppingList(listData, items = []) {
  const supabase = getClient();
  
  // Create the shopping list using stored procedure
  const { data: list, error: listError } = await supabase.rpc('create_shopping_list', {
    p_user_id: listData.user_id,
    p_title: listData.title,
    p_description: listData.description || null,
    p_shopping_date: listData.shopping_date,
    p_market_id: listData.market_id || null
  });
  
  if (listError) throw new Error(listError.message);
  
  // Add items if provided
  if (items.length > 0) {
    const itemPromises = items.map(item => 
      supabase.rpc('add_shopping_list_item', {
        p_list_id: list.id,
        p_product_name: item.product_name,
        p_category: item.category,
        p_quantity: item.quantity,
        p_unit: item.unit,
        p_unit_price: item.unit_price,
        p_notes: item.notes || null
      })
    );
    
    const itemResults = await Promise.all(itemPromises);
    
    // Check for errors in item creation
    const itemErrors = itemResults.filter(result => result.error);
    if (itemErrors.length > 0) {
      throw new Error(`Failed to create items: ${itemErrors.map(e => e.error.message).join(', ')}`);
    }
    
    // Extract item data
    const createdItems = itemResults.map(result => result.data);
    
    return {
      ...list,
      items: createdItems
    };
  }
  
  return {
    ...list,
    items: []
  };
}

/**
 * Get shopping lists for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @returns {Array} - Array of shopping lists
 */
async function getShoppingLists(user_id, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('active_shopping_lists')
    .select('*')
    .eq('user_id', user_id);
  
  // Apply filters
  if (options.is_completed !== undefined) {
    query = query.eq('is_completed', options.is_completed);
  }
  
  if (options.market_id) {
    query = query.eq('market_id', options.market_id);
  }
  
  // Apply ordering
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });
  
  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
    if (options.offset) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get shopping list by ID
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListById(id, user_id) {
  const supabase = getClient();
  
  // Get the list
  const { data: list, error: listError } = await supabase
    .from('active_shopping_lists')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();
  
  if (listError) {
    if (listError.code === 'PGRST116') return null; // Not found
    throw new Error(listError.message);
  }
  
  // Get the items
  const { data: items, error: itemsError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('list_id', id)
    .order('category', { ascending: true })
    .order('unit_price', { ascending: true });
  
  if (itemsError) throw new Error(itemsError.message);
  
  return {
    ...list,
    items: items || []
  };
}

/**
 * Get shopping list by share code
 * @param {string} shareCode - 4-digit share code
 * @returns {Object|null} - Shopping list with items or null if not found
 */
async function getShoppingListByShareCode(shareCode) {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('get_shopping_list_by_code', {
    p_share_code: shareCode
  });
  
  if (error) throw new Error(error.message);
  
  if (!data || data.length === 0) return null;
  
  const result = data[0];
  return {
    ...result.list_data,
    items: result.items_data || []
  };
}

/**
 * Update shopping list
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated shopping list
 */
async function updateShoppingList(id, user_id, updates) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete shopping list (soft delete)
 * @param {string} id - Shopping list ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object} - Deleted shopping list
 */
async function deleteShoppingList(id, user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Add item to shopping list
 * @param {string} listId - Shopping list ID
 * @param {Object} itemData - Item data
 * @returns {Object} - Created item
 */
async function addItemToList(listId, itemData) {
  const supabase = getClient();
  
  const { data, error } = await supabase.rpc('add_shopping_list_item', {
    p_list_id: listId,
    p_product_name: itemData.product_name,
    p_category: itemData.category,
    p_quantity: itemData.quantity,
    p_unit: itemData.unit,
    p_unit_price: itemData.unit_price,
    p_notes: itemData.notes || null
  });
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update shopping list item
 * @param {string} itemId - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated item
 */
async function updateShoppingListItem(itemId, updates) {
  const supabase = getClient();
  
  // Calculate total_price if quantity or unit_price changed
  if (updates.quantity !== undefined || updates.unit_price !== undefined) {
    // Get current item data to calculate total
    const { data: currentItem, error: currentError } = await supabase
      .from('shopping_list_items')
      .select('quantity, unit_price')
      .eq('id', itemId)
      .single();
    
    if (currentError) throw new Error(currentError.message);
    
    const quantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity;
    const unitPrice = updates.unit_price !== undefined ? updates.unit_price : currentItem.unit_price;
    updates.total_price = quantity * unitPrice;
  }
  
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete shopping list item
 * @param {string} itemId - Item ID
 * @returns {Object} - Deleted item
 */
async function deleteShoppingListItem(itemId) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  createShoppingList,
  getShoppingLists,
  getShoppingListById,
  getShoppingListByShareCode,
  updateShoppingList,
  deleteShoppingList,
  addItemToList,
  updateShoppingListItem,
  deleteShoppingListItem
};
