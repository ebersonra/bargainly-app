const test = require('node:test');
const assert = require('node:assert');
const service = require('../../src/services/ocrService');

const mockPurchaseService = {
  insertPurchaseRecord: async (rec) => ({ id: Math.random(), ...rec })
};

test('processReceipt categorizes items and inserts records', async () => {
  const text = 'Banana 5\nCarne 10';
  const result = await service.processReceipt({ user_id: 1, vendor: 'Mercado Central', text }, mockPurchaseService);
  assert.equal(result.manualEntry, false);
  assert.equal(result.records.length, 2);
  const categories = result.records.map(r => r.category).sort();
  assert.deepStrictEqual(categories, ['butcher', 'produce']);
});

test('processReceipt falls back to manual on parse error', async () => {
  const result = await service.processReceipt({ user_id: 1, vendor: '', text: 'invalid line' }, mockPurchaseService);
  assert.equal(result.manualEntry, true);
});
