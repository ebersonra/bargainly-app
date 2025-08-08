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
  const { data, error } = await supabase
    .from('purchase_records')
    .insert(record)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchBudgets() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('category, limit');
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchTotalSpent() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('purchase_records')
    .select('category, amount');
  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = { insertPurchaseRecord, fetchBudgets, fetchTotalSpent };
