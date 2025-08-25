/**
 * Product Repository
 * Data access layer for products
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
 * Create a new product
 * @param {Object} product - Product data
 * @returns {Object} - Created product
 */
async function createProduct(product) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get products for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @returns {Array} - Array of products
 */
async function getProducts(user_id, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', user_id);
  
  // Apply filters
  if (options.category) {
    query = query.eq('category', options.category);
  }
  
  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%,brand.ilike.%${options.search}%`);
  }
  
  // Apply ordering
  const orderBy = options.orderBy || 'created_at';
  const orderDirection = options.orderDirection || 'desc';
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });
  
  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Product or null if not found
 */
async function getProductById(id, user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Get product by barcode
 * @param {string} barcode - Product barcode
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Product or null if not found
 */
async function getProductByBarcode(barcode, user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('user_id', user_id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Update a product
 * @param {string} id - Product ID
 * @param {Object} updates - Product updates
 * @returns {Object} - Updated product
 */
async function updateProduct(id, updates) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a product
 * @param {string} id - Product ID
 * @param {string} user_id - User ID for authorization
 * @returns {boolean} - Success status
 */
async function deleteProduct(id, user_id) {
  const supabase = getClient();
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Get product categories for a user
 * @param {string} user_id - User ID
 * @returns {Array} - Array of unique categories
 */
async function getProductCategories(user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('user_id', user_id)
    .not('category', 'is', null);
  
  if (error) throw new Error(error.message);
  
  // Extract unique categories
  const categories = [...new Set((data || []).map(item => item.category))];
  return categories.sort();
}

/**
 * Search products by name or description
 * @param {string} user_id - User ID
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional options
 * @returns {Array} - Array of matching products
 */
async function searchProducts(user_id, searchTerm, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', user_id)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get products by category
 * @param {string} user_id - User ID
 * @param {string} category - Product category
 * @param {Object} options - Additional options
 * @returns {Array} - Array of products in category
 */
async function getProductsByCategory(user_id, category, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', user_id)
    .eq('category', category);
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get product count for a user
 * @param {string} user_id - User ID
 * @param {Object} filters - Optional filters
 * @returns {number} - Product count
 */
async function getProductCount(user_id, filters = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id);
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  const { count, error } = await query;
  
  if (error) throw new Error(error.message);
  return count || 0;
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  getProductCategories,
  searchProducts,
  getProductsByCategory,
  getProductCount
};
