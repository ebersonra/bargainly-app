const test = require('node:test');
const assert = require('node:assert');
const { buildHandler: buildInsert } = require('../../netlify/functions/insert-purchase-record');
const { buildHandler: buildGet } = require('../../netlify/functions/get-budget-status');
const { buildHandler: buildSet } = require('../../netlify/functions/set-budget');
const service = require('../../src/services/purchaseRecordService');

test('insert-purchase-record handler returns 200', async () => {
  const mockRepo = { insertPurchaseRecord: async (rec) => ({ id: 1, ...rec }) };
  const mockController = {
    insertPurchaseRecord: (data) => service.insertPurchaseRecord(data, mockRepo)
  };
  const handler = buildInsert(mockController);
  const event = { httpMethod: 'POST', body: JSON.stringify({ user_id: 1, amount: 5, category: 'food' }) };
  const res = await handler(event);
  assert.equal(res.statusCode, 200);
});

test('get-budget-status handler returns data with percentages', async () => {
  const mockRepo = {
    fetchBudgets: async () => [{ category: 'food', limit: 100 }],
    fetchTotalSpent: async () => [{ category: 'food', amount: 40 }]
  };
  const mockController = {
    getBudgetStatus: () => service.getBudgetStatus(mockRepo)
  };
  const handler = buildGet(mockController);
  const event = { httpMethod: 'GET' };
  const res = await handler(event);
  const body = JSON.parse(res.body);
  assert.equal(body[0].percentage, 40);
});

test('set-budget handler returns 200', async () => {
  const mockRepo = { upsertBudget: async (data) => ({ id: 1, ...data }) };
  const mockController = {
    setBudget: (data) => service.setBudget(data, mockRepo)
  };
  const handler = buildSet(mockController);
  const event = { httpMethod: 'POST', body: JSON.stringify({ category: 'food', limit: 100 }) };
  const res = await handler(event);
  assert.equal(res.statusCode, 200);
});
