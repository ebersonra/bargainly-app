const test = require('node:test');
const assert = require('node:assert');
const controller = require('../../src/controllers/ocrController');
const service = require('../../src/services/ocrService');

const mockPurchaseService = {
  insertPurchaseRecord: async (rec) => ({ id: 1, ...rec })
};

test('controller processes receipt via service', async () => {
  const mockService = {
    processReceipt: (data) => service.processReceipt(data, mockPurchaseService)
  };
  const result = await controller.processReceipt({ user_id: 1, vendor: 'Mercado', text: 'Banana 5' }, mockService);
  assert.equal(result.records[0].category, 'produce');
});
