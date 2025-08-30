require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_API_KEY);

async function testConnection() {
  console.log('=== Testing Supabase Connection ===');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_API_KEY);
  
  try {
    // Test 1: Basic table access
    console.log('\n--- Test 1: Basic table query ---');
    const { data: tables, error: tablesError } = await supabase
      .from('purchase_categories')
      .select('*')
      .limit(1);
    
    console.log('Tables query:', { data: tables, error: tablesError });
    
    // Test 2: User-specific query
    console.log('\n--- Test 2: User-specific query ---');
    const { data: userCategories, error: userError } = await supabase
      .from('purchase_categories')
      .select('id, name')
      .eq('user_id', 'test_user')
      .order('name');
    
    console.log('User categories:', { data: userCategories, error: userError });
    
    // Test 3: Seed categories function test
    console.log('\n--- Test 3: Seed categories test ---');
    const repo = require('./src/repositories/purchaseRecordRepository');
    const seeded = await repo.seedDefaultCategories('test_user');
    console.log('Seeded categories:', seeded);
    
  } catch (err) {
    console.error('Connection test error:', err);
  }
}

testConnection().then(() => {
  console.log('\n=== Test completed ===');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
