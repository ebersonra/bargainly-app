const test = require('node:test');
const assert = require('node:assert');
const service = require('../../src/services/purchaseRecordService');

test('insertPurchaseRecord throws on missing fields', async () => {
  await assert.rejects(
    service.insertPurchaseRecord({ amount: 10, category: 'food' }, { insertPurchaseRecord: async () => ({}) }),
    /Missing field: user_id/
  );
});

test('getBudgetStatus calculates percentages and alerts', async () => {
  const mockRepo = {
    fetchBudgets: async () => [{ category: 'food', limit: 100 }],
    fetchTotalSpent: async () => [{ category: 'food', amount: 90 }]
  };
  const result = await service.getBudgetStatus(mockRepo);
  assert.deepStrictEqual(result, [
    { category: 'food', limit: 100, spent: 90, percentage: 90, alert: 'near limit' }
  ]);
});
