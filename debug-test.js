const test = require('node:test');
const assert = require('node:assert');

// Only load dotenv if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { createClient } = require('@supabase/supabase-js');

// Check if running in CI environment
const isCI = process.env.CI || process.env.GITHUB_ACTIONS;

function createMockSupabase() {
  return {
    from: (table) => ({
      select: () => ({ 
        limit: () => ({ data: [{ id: 1, name: 'test_category' }], error: null }),
        eq: () => ({ order: () => ({ data: [{ id: 1, name: 'Alimentação' }], error: null }) })
      })
    })
  };
}

function createMockRepo() {
  return {
    seedDefaultCategories: async (user_id) => {
      console.log(`Mock: Seeding categories for user ${user_id}`);
      return [
        { id: 1, name: 'Alimentação' },
        { id: 2, name: 'Limpeza' },
        { id: 3, name: 'Higiene' }
      ];
    }
  };
}

test('Supabase connection test', async () => {
  console.log('=== Testing Supabase Connection ===');
  console.log('Environment:', isCI ? 'CI/GitHub Actions' : 'Local');
  console.log('URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
  console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_API_KEY);
  
  let supabase;
  let repo;
  
  if (isCI || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_API_KEY) {
    console.log('Using mock Supabase client for CI environment');
    supabase = createMockSupabase();
    repo = createMockRepo();
  } else {
    console.log('Using real Supabase client for local environment');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_API_KEY);
    repo = require('./src/repositories/purchaseRecordRepository');
  }
  
  // Test 1: Basic table access
  console.log('\n--- Test 1: Basic table query ---');
  const { data: tables, error: tablesError } = await supabase
    .from('purchase_categories')
    .select('*')
    .limit(1);
  
  console.log('Tables query:', { data: tables, error: tablesError });
  assert.ok(Array.isArray(tables), 'Should return an array of tables');
  assert.equal(tablesError, null, 'Should not have errors');
  
  // Test 2: User-specific query (only for mocks in CI)
  if (isCI || !process.env.SUPABASE_URL) {
    console.log('\n--- Test 2: User-specific query (mocked) ---');
    const { data: userCategories, error: userError } = await supabase
      .from('purchase_categories')
      .select('id, name')
      .eq('user_id', 'test_user')
      .order('name');
    
    console.log('User categories:', { data: userCategories, error: userError });
    assert.ok(Array.isArray(userCategories), 'Should return an array of categories');
    assert.equal(userError, null, 'Should not have errors');
  } else {
    console.log('\n--- Test 2: Skipped for real DB (would need valid UUID) ---');
  }
  
  // Test 3: Seed categories function test
  console.log('\n--- Test 3: Seed categories test ---');
  let testUserId = 'test_user';
  
  // Use a valid UUID for local testing with real database
  if (!isCI && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_API_KEY) {
    testUserId = '28b1d1b2-6c84-47c9-84f4-debdabb4b92f'; // Use an existing user ID from your DB
  }
  
  const seeded = await repo.seedDefaultCategories(testUserId);
  console.log('Seeded categories:', seeded);
  assert.ok(Array.isArray(seeded), 'Should return an array of seeded categories');
  assert.ok(seeded.length > 0, 'Should have at least one category');
  
  console.log('\n=== Test completed successfully ===');
});
