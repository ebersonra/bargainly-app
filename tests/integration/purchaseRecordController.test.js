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
    getBudgetStatus: () => service.getBudgetStatus(mockRepo)
  };
  const result = await controller.getBudgetStatus(mockService);
  assert.deepStrictEqual(result, [
    { category: 'food', limit: 100, spent: 50, percentage: 50, alert: null }
  ]);
});
