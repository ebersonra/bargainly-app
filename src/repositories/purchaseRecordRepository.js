const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are required');
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function insertPurchaseRecord(record) {
  const supabase = getClient();
  const { user_id, amount, category, source, purchase_date } = record;
  const { data, error } = await supabase.rpc('insert_purchase_record', {
    p_user_id: user_id,
    p_category: category,
    p_value: amount,
    p_source: source || null,
    p_date: purchase_date || new Date().toISOString().slice(0, 10)
  });
  if (error) throw new Error(error.message);
  return data;
}

async function fetchBudgets() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('budget_goals')
    .select('target_value, purchase_categories(name)');
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
    .single();
  if (catError) throw new Error(catError.message);
  const payload = {
    user_id: budget.user_id || null,
    month: budget.month || new Date().toISOString().slice(0, 7),
    category_id: cat.id,
    target_value: budget.limit
  };
  const { data, error } = await supabase
    .from('budget_goals')
    .upsert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...data, category: budget.category, limit: data.target_value };
}

async function fetchTotalSpent() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('purchase_records')
    .select('value, purchase_categories(name)');
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    category: r.purchase_categories?.name,
    amount: r.value
  }));
}

module.exports = { insertPurchaseRecord, fetchBudgets, fetchTotalSpent, upsertBudget };
