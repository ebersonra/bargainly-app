/**
 * Market Repository
 * Data access layer for markets
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
 * Create a new market
 * @param {Object} market - Market data
 * @returns {Object} - Created market
 */
async function createMarket(market) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('markets')
    .insert(market)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get markets for a user
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @returns {Array} - Array of markets
 */
async function getMarkets(user_id, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('markets')
    .select('*')
    .eq('user_id', user_id);
  
  // Apply filters
  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,address.ilike.%${options.search}%`);
  }
  
  // Apply ordering
  const orderBy = options.orderBy || 'name';
  const orderDirection = options.orderDirection || 'asc';
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
 * Get market by ID
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Market or null if not found
 */
async function getMarketById(id, user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('markets')
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
 * Get market by CNPJ
 * @param {string} cnpj - Market CNPJ
 * @param {string} user_id - User ID for authorization
 * @returns {Object|null} - Market or null if not found
 */
async function getMarketByCnpj(cnpj, user_id) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('cnpj', cnpj)
    .eq('user_id', user_id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Update a market
 * @param {string} id - Market ID
 * @param {Object} updates - Market updates
 * @returns {Object} - Updated market
 */
async function updateMarket(id, updates) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('markets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a market
 * @param {string} id - Market ID
 * @param {string} user_id - User ID for authorization
 * @returns {boolean} - Success status
 */
async function deleteMarket(id, user_id) {
  const supabase = getClient();
  
  const { error } = await supabase
    .from('markets')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Search markets by name or address
 * @param {string} user_id - User ID
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional options
 * @returns {Array} - Array of matching markets
 */
async function searchMarkets(user_id, searchTerm, options = {}) {
  const supabase = getClient();
  
  let query = supabase
    .from('markets')
    .select('*')
    .eq('user_id', user_id)
    .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get market count for a user
 * @param {string} user_id - User ID
 * @returns {number} - Market count
 */
async function getMarketCount(user_id) {
  const supabase = getClient();
  
  const { count, error } = await supabase
    .from('markets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id);
  
  if (error) throw new Error(error.message);
  return count || 0;
}

/**
 * Get markets with recent purchase activity
 * @param {string} user_id - User ID
 * @param {number} days - Number of days to look back
 * @returns {Array} - Array of markets with purchase activity
 */
async function getMarketsWithActivity(user_id, days = 30) {
  const supabase = getClient();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      source,
      markets (
        id,
        name,
        address
      )
    `)
    .eq('user_id', user_id)
    .gte('created_at', cutoffDate.toISOString())
    .not('source', 'is', null);
  
  if (error) throw new Error(error.message);
  
  // Extract unique markets
  const marketsMap = new Map();
  (data || []).forEach(record => {
    if (record.markets) {
      marketsMap.set(record.markets.id, record.markets);
    }
  });
  
  return Array.from(marketsMap.values());
}

/**
 * Get popular markets (most used by user)
 * @param {string} user_id - User ID
 * @param {number} limit - Limit number of results
 * @returns {Array} - Array of popular markets with usage count
 */
async function getPopularMarkets(user_id, limit = 5) {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      source,
      markets (
        id,
        name,
        address
      )
    `)
    .eq('user_id', user_id)
    .not('source', 'is', null);
  
  if (error) throw new Error(error.message);
  
  // Count usage by market
  const marketCounts = new Map();
  (data || []).forEach(record => {
    if (record.markets) {
      const market = record.markets;
      const count = marketCounts.get(market.id) || { ...market, count: 0 };
      count.count++;
      marketCounts.set(market.id, count);
    }
  });
  
  // Sort by count and limit results
  return Array.from(marketCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

module.exports = {
  createMarket,
  getMarkets,
  getMarketById,
  getMarketByCnpj,
  updateMarket,
  deleteMarket,
  searchMarkets,
  getMarketCount,
  getMarketsWithActivity,
  getPopularMarkets
};
