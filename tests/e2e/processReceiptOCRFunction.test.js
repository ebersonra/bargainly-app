const test = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../../netlify/functions/process-receipt-ocr');
const service = require('../../src/services/ocrService');

const mockPurchaseService = {
  insertPurchaseRecord: async (rec) => ({ id: 1, ...rec })
};

test('process-receipt-ocr handler returns records', async () => {
  const mockController = {
    processReceipt: (data) => service.processReceipt(data, mockPurchaseService)
  };
  const handler = buildHandler(mockController);
  const event = { httpMethod: 'POST', body: JSON.stringify({ user_id: 1, vendor: 'Mercado', text: 'Banana 5\nCarne 10' }) };
  const res = await handler(event);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.records.length, 2);
});
