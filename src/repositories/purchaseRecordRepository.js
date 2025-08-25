const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_API_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are required');
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function insertPurchaseRecord(record) {
  const supabase = getClient();
  const { user_id, amount, category, source, purchase_date, description } = record;
  const { data, error } = await supabase.rpc('insert_purchase_record', {
    p_user_id: user_id,
    p_category: category,
    p_value: amount,
    p_source: source || null,
    p_date: purchase_date || new Date().toISOString().slice(0, 10),
    p_description: description || null // Map description to description
  });
  if (error) throw new Error(error.message);
  return data;
}

async function fetchBudgets(user_id) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('budget_goals')
    .select('target_value, purchase_categories(name)')
    .eq('user_id', user_id);
  if (error) throw new Error(error.message);
  return (data || []).map(b => ({
    category: b.purchase_categories?.name,
    limit: b.target_value
  }));
}

async function upsertBudget(budget) {
  const supabase = getClient();
  const { data: cat, error: catError } = await supabase
    .from('purchase_categories')
    .select('id')
    .eq('name', budget.category)
    .eq('user_id', budget.user_id)
    .single();
  if (catError) throw new Error(catError.message);
  const payload = {
    user_id: budget.user_id,
    month: budget.month || new Date().toISOString().slice(0, 7),
    category_id: cat.id,
    target_value: budget.limit
  };
  const { data, error } = await supabase
    .from('budget_goals')
    .upsert(payload)
    .select();
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  return { ...result, category: budget.category, limit: result?.target_value };
}

async function fetchTotalSpent(user_id) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('purchase_records')
    .select('value, purchase_categories(name)')
    .eq('user_id', user_id);
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    category: r.purchase_categories?.name,
    amount: r.value
  }));
}

async function fetchPurchaseCategories(user_id) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('purchase_categories')
    .select('id, name')
    .eq('user_id', user_id)
    .order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

async function seedDefaultCategories(user_id) {
  const supabase = getClient();
  
  // Check if user already has categories
  const existing = await fetchPurchaseCategories(user_id);
  if (existing.length > 0) {
    return existing;
  }
  
  // Default categories to seed
  const defaultCategories = [
    'Alimentação',
    'Limpeza', 
    'Higiene',
    'Bebidas',
    'Padaria',
    'Açougue',
    'Hortifruti',
    'Outros'
  ];
  
  const categoriesToInsert = defaultCategories.map(name => ({
    name,
    user_id
  }));
  
  const { data, error } = await supabase
    .from('purchase_categories')
    .insert(categoriesToInsert)
    .select('id, name');
  
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchPurchaseRecords(params) {
  const supabase = getClient();
  const { user_id, limit = 10, offset = 0 } = params;
  
  const { data, error } = await supabase
    .from('purchase_records')
    .select(`
      id,
      value,
      source,
      purchase_date,
      description,
      created_at,
      purchase_categories(name)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw new Error(error.message);
  
  // Format the response to match frontend expectations
  return (data || []).map(record => ({
    id: record.id,
    amount: record.value,
    value: record.value, // Keep both for compatibility
    category: record.purchase_categories?.name || 'Sem categoria',
    market: record.source, // Use source as market for now
    source: record.source,
    purchase_date: record.purchase_date,
    date: record.purchase_date, // Keep both for compatibility
    description: record.description, // Description field from database
    created_at: record.created_at
  }));
}

module.exports = { 
  insertPurchaseRecord, 
  fetchBudgets, 
  fetchTotalSpent, 
  upsertBudget, 
  fetchPurchaseCategories, 
  seedDefaultCategories,
  fetchPurchaseRecords
};
