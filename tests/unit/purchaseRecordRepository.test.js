const test = require('node:test');
const assert = require('node:assert');

// Mock Supabase client for testing
const mockSupabaseClient = {
  rpc: async (functionName, params) => {
    if (functionName === 'insert_purchase_record') {
      return { data: { id: 1, ...params }, error: null };
    }
    return { data: null, error: { message: 'Unknown function' } };
  },
  from: (table) => ({
    select: (fields) => ({
      eq: (field, value) => ({
        eq: (field2, value2) => ({
          single: async () => {
            if (table === 'purchase_categories' && field === 'name') {
              return { data: { id: 1 }, error: null };
            }
            return { data: null, error: { message: 'Not found' } };
          }
        }),
        single: async () => {
          if (table === 'purchase_categories' && field === 'name') {
            return { data: { id: 1 }, error: null };
          }
          return { data: null, error: { message: 'Not found' } };
        },
        async then(resolve) {
          if (table === 'budget_goals') {
            return resolve([{ category: 'food', target_value: 100, purchase_categories: { name: 'food' } }]);
          }
          if (table === 'purchase_records') {
            return resolve([{ value: 50, purchase_categories: { name: 'food' } }]);
          }
          return resolve([]);
        }
      })
    }),
    upsert: (data) => ({
      select: async () => ({ data: [{ id: 1, ...data }], error: null })
    })
  })
};

// Mock the createClient function
const originalCreateClient = require('@supabase/supabase-js').createClient;
const mockCreateClient = () => mockSupabaseClient;

// Replace createClient for testing
require('@supabase/supabase-js').createClient = mockCreateClient;

// Set required environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_API_KEY = 'test-key';

const repository = require('../../src/repositories/purchaseRecordRepository');

test('insertPurchaseRecord calls supabase RPC correctly', async () => {
  const record = {
    user_id: 1,
    amount: 50,
    category: 'food',
    source: 'test',
    purchase_date: '2024-01-01'
  };
  
  const result = await repository.insertPurchaseRecord(record);
  assert.equal(result.id, 1);
  assert.equal(result.p_user_id, 1);
  assert.equal(result.p_value, 50);
  assert.equal(result.p_category, 'food');
});

test('fetchBudgets returns formatted budget data', async () => {
  const result = await repository.fetchBudgets('user1');
  assert(Array.isArray(result));
  if (result.length > 0) {
    assert.equal(result[0].category, 'food');
    assert.equal(result[0].limit, 100);
  }
});

test('fetchTotalSpent returns formatted spending data', async () => {
  const result = await repository.fetchTotalSpent('user1');
  assert(Array.isArray(result));
  if (result.length > 0) {
    assert.equal(result[0].category, 'food');
    assert.equal(result[0].amount, 50);
  }
});

test('upsertBudget handles budget creation/update', async () => {
  const budget = {
    user_id: 'user1',
    category: 'food',
    limit: 200,
    month: '2024-01'
  };
  
  const result = await repository.upsertBudget(budget);
  assert.equal(result.id, 1);
  assert.equal(result.category, 'food');
  assert.equal(result.limit, 200);
});

test('getClient function works with valid credentials', async () => {
  // Test that the module loads successfully with valid credentials
  const repo = require('../../src/repositories/purchaseRecordRepository');
  assert(typeof repo.insertPurchaseRecord === 'function');
  assert(typeof repo.fetchBudgets === 'function');
  assert(typeof repo.fetchTotalSpent === 'function');
  assert(typeof repo.upsertBudget === 'function');
});

// Restore original createClient after tests
test.after(() => {
  require('@supabase/supabase-js').createClient = originalCreateClient;
});