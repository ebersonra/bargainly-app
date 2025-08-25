const test = require('node:test');
const assert = require('node:assert');
const controller = require('../../src/controllers/purchaseRecordController');
const service = require('../../src/services/purchaseRecordService');

test('controller integrates with service to insert record', async () => {
  const mockRepo = {
    insertPurchaseRecord: async (rec) => ({ id: 1, ...rec })
  };
  const mockService = {
    insertPurchaseRecord: (data) => service.insertPurchaseRecord(data, mockRepo)
  };
  const result = await controller.insertPurchaseRecord({ user_id: 1, amount: 5, category: 'food' }, mockService);
  assert.equal(result.id, 1);
});

test('controller integrates with service to get budget status', async () => {
  const mockRepo = {
    fetchBudgets: async () => [{ category: 'food', limit: 100 }],
    fetchTotalSpent: async () => [{ category: 'food', amount: 50 }]
  };
  const mockService = {
    getBudgetStatus: (user_id) => service.getBudgetStatus(user_id, mockRepo)
  };
  const result = await controller.getBudgetStatus('user1', mockService);
  // Controller returns Budget instances, so check if the data structure matches
  assert.equal(result.length, 1);
  assert.equal(result[0].category, 'food');
  assert.equal(result[0].limit, 100);
  assert.equal(result[0].spent, 50);
  assert.equal(result[0].percentage, 50);
  assert.equal(result[0].alert, null);
  assert.equal(typeof result[0].month, 'string'); // Budget instance adds month
  assert.equal(result[0].user_id, null); // Budget instance adds user_id
});

test('controller integrates with service to set budget', async () => {
  const mockRepo = { upsertBudget: async (data) => ({ id: 1, ...data }) };
  const mockService = {
    setBudget: (data) => service.setBudget(data, mockRepo)
  };
  const result = await controller.setBudget({ user_id: 'u1', category: 'travel', limit: 300 }, mockService);
  assert.equal(result.id, 1);
});
