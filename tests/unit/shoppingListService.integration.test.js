// tests/unit/shoppingListService.integration.test.js
const test = require('node:test');
const assert = require('node:assert');
const shoppingListService = require('../../src/services/shoppingListService');

// Mock repository
const mockRepo = {
  createShoppingList: (list, items) => ({ id: 'list1', ...list, items }),
  getShoppingLists: () => [
    { id: 'list1', user_id: '1', title: 'Test', shopping_date: '2025-01-01', items_count: 2, checked_items_count: 1, total_amount: 10, is_completed: false },
  ],
  getShoppingListById: () => ({
    id: 'list1', user_id: '1', title: 'Test', shopping_date: '2025-01-01', items: [
      { product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg', is_checked: true, total_price: 5 },
      { product_name: 'Feijão', category: 'Alimentos', quantity: 1, unit: 'kg', is_checked: false, total_price: 5 },
    ], is_completed: false
  }),
  getShoppingListByShareCode: () => null,
  updateShoppingList: (id, user_id, updates) => ({ id, user_id, ...updates }),
  deleteShoppingList: (id, user_id) => ({ id, user_id, deleted: true }),
};

test('should create a shopping list with valid data', async () => {
  const listData = { user_id: '1', title: 'Test', shopping_date: '2025-01-01' };
  const items = [
    { product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg' },
    { product_name: 'Feijão', category: 'Alimentos', quantity: 1, unit: 'kg' }
  ];
  const result = await shoppingListService.createShoppingList(listData, items, mockRepo);
  assert.strictEqual(result.id, 'list1');
});

test('should get shopping lists for a user', async () => {
  const lists = await shoppingListService.getShoppingLists('1', {}, mockRepo);
  assert.ok(Array.isArray(lists));
  assert.strictEqual(lists[0].completion_percentage, 50);
  assert.ok(['upcoming', 'overdue', 'today'].includes(lists[0].status));
});

test('should get shopping list by id with summary', async () => {
  const list = await shoppingListService.getShoppingListById('list1', '1', mockRepo);
  assert.strictEqual(list.summary.total_items, 2);
  assert.strictEqual(list.summary.checked_items, 1);
  assert.strictEqual(list.items_by_category['Alimentos'].length, 2);
});

test('should update a shopping list', async () => {
  const updated = await shoppingListService.updateShoppingList('list1', '1', { title: 'Updated' }, mockRepo);
  assert.strictEqual(updated.title, 'Updated');
});

test('should delete a shopping list', async () => {
  const deleted = await shoppingListService.deleteShoppingList('list1', '1', mockRepo);
  assert.strictEqual(deleted.deleted, true);
});

test('should throw if creating a list with no items', async () => {
  const listData = { user_id: '1', title: 'Test', shopping_date: '2025-01-01' };
  await assert.rejects(
    shoppingListService.createShoppingList(listData, [], mockRepo),
    /Shopping list must have at least one item/
  );
});

test('should throw if share code is invalid', async () => {
  await assert.rejects(
    shoppingListService.getShoppingListByShareCode('12', mockRepo),
    /Share code must be 4 digits/
  );
  await assert.rejects(
    shoppingListService.getShoppingListByShareCode('abcd', mockRepo),
    /Share code must contain only numbers/
  );
});
