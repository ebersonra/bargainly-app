const { test, mock } = require('node:test');
const assert = require('node:assert');
const { buildHandler } = require('../../netlify/functions/get-purchase-categories');

test('get-purchase-categories function', async (t) => {
  await t.test('returns 405 for non-GET methods', async () => {
    const handler = buildHandler();
    const event = { httpMethod: 'POST' };
    const result = await handler(event);
    
    assert.strictEqual(result.statusCode, 405);
    assert.strictEqual(result.body, 'Method Not Allowed');
  });

  await t.test('returns 400 when user_id is missing', async () => {
    const handler = buildHandler();
    const event = { 
      httpMethod: 'GET',
      queryStringParameters: {}
    };
    const result = await handler(event);
    
    assert.strictEqual(result.statusCode, 400);
    const body = JSON.parse(result.body);
    assert.strictEqual(body.error, 'user_id is required');
  });

  await t.test('returns categories for valid user_id', async () => {
    const mockController = {
      getPurchaseCategories: mock.fn(async (user_id) => {
        return [
          { id: '1', name: 'Alimentação' },
          { id: '2', name: 'Bebidas' }
        ];
      })
    };

    const handler = buildHandler(mockController);
    const event = { 
      httpMethod: 'GET',
      queryStringParameters: { user_id: 'test-user-id' }
    };
    const result = await handler(event);
    
    assert.strictEqual(result.statusCode, 200);
    const body = JSON.parse(result.body);
    assert.strictEqual(Array.isArray(body), true);
    assert.strictEqual(body.length, 2);
    assert.strictEqual(body[0].name, 'Alimentação');
    assert.strictEqual(mockController.getPurchaseCategories.mock.calls.length, 1);
    assert.strictEqual(mockController.getPurchaseCategories.mock.calls[0].arguments[0], 'test-user-id');
  });

  await t.test('handles controller errors', async () => {
    const mockController = {
      getPurchaseCategories: mock.fn(async () => {
        throw new Error('Database connection failed');
      })
    };

    const handler = buildHandler(mockController);
    const event = { 
      httpMethod: 'GET',
      queryStringParameters: { user_id: 'test-user-id' }
    };
    const result = await handler(event);
    
    assert.strictEqual(result.statusCode, 400);
    const body = JSON.parse(result.body);
    assert.strictEqual(body.error, 'Database connection failed');
  });
});