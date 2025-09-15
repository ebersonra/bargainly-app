// tests/unit/shoppingListService.test.js
const test = require('node:test');
const assert = require('node:assert');
const shoppingListService = require('../../src/services/shoppingListService');

test('validateShoppingList - should throw if required fields are missing', () => {
  assert.throws(() => shoppingListService.validateShoppingList({}), /Missing field: user_id/);
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1' }), /Missing field: title/);
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1', title: 'Test' }), /Missing field: shopping_date/);
});

test('validateShoppingList - should throw if title is empty or too long', () => {
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1', title: '', shopping_date: '2025-01-01' }), /Missing field: title/);
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1', title: 'a'.repeat(101), shopping_date: '2025-01-01' }), /Title must be 100 characters or less/);
});

test('validateShoppingList - should throw if description is too long', () => {
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1', title: 'Test', shopping_date: '2025-01-01', description: 'a'.repeat(501) }), /Description must be 500 characters or less/);
});

test('validateShoppingList - should throw if shopping_date is invalid', () => {
  assert.throws(() => shoppingListService.validateShoppingList({ user_id: '1', title: 'Test', shopping_date: '01-01-2025' }), /Shopping date must be in YYYY-MM-DD format/);
});

test('validateShoppingList - should not throw for valid data', () => {
  assert.doesNotThrow(() => shoppingListService.validateShoppingList({ user_id: '1', title: 'Test', shopping_date: '2025-01-01' }));
});

test('validateShoppingListItem - should throw if required fields are missing', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({}), /Missing field: product_name/);
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz' }), /Missing field: category/);
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos' }), /Missing field: quantity/);
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 1 }), /Missing field: unit/);
});

test('validateShoppingListItem - should throw if product_name is empty or too long', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: '', category: 'Alimentos', quantity: 1, unit: 'kg' }), /Missing field: product_name/);
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'a'.repeat(101), category: 'Alimentos', quantity: 1, unit: 'kg' }), /Product name must be 100 characters or less/);
});

test('validateShoppingListItem - should throw if category is empty', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: '', quantity: 1, unit: 'kg' }), /Missing field: category/);
});

test('validateShoppingListItem - should throw if quantity is not positive', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 0, unit: 'kg' }), /Quantity must be greater than zero/);
});

test('validateShoppingListItem - should throw if unit_price is negative', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg', unit_price: -1 }), /Price cannot be negative/);
});

test('validateShoppingListItem - should throw if unit is invalid', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'invalid' }), /Unit must be one of: un, kg, g, l, ml, cx, pct/);
});

test('validateShoppingListItem - should throw if notes is too long', () => {
  assert.throws(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg', notes: 'a'.repeat(201) }), /Notes must be 200 characters or less/);
});

test('validateShoppingListItem - should not throw for valid item', () => {
  assert.doesNotThrow(() => shoppingListService.validateShoppingListItem({ product_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg' }));
});
