const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Helper function to get UI utilities in Node.js environment
const getUIUtils = () => {
  // Ensure Node.js environment
  delete global.window;
  global.module = { exports: {} };
  
  // Clear require cache and require UI utilities
  const uiPath = path.resolve(__dirname, '../../src/utils/ui.js');
  delete require.cache[uiPath];
  return require(uiPath);
};

// Mock console to capture warnings and errors
const mockConsole = () => {
  const logs = [];
  const originalConsole = { ...console };
  
  console.log = (...args) => logs.push({ level: 'log', args });
  console.warn = (...args) => logs.push({ level: 'warn', args });
  console.error = (...args) => logs.push({ level: 'error', args });
  
  return {
    logs,
    restore: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  };
};

test('UI Utils - Module exports and initialization', async () => {
  const uiUtils = getUIUtils();
  
  assert.ok(typeof uiUtils.loadUserCategories === 'function', 'Should export loadUserCategories function');
  assert.ok(typeof uiUtils.loadMarkets === 'function', 'Should export loadMarkets function');
  assert.ok(typeof uiUtils.showNotification === 'function', 'Should export showNotification function');
  assert.ok(Array.isArray(uiUtils.predefinedCategories), 'Should export predefinedCategories array');
});

test('UI Utils - loadUserCategories graceful fallback when getUserId unavailable', async () => {
  const consoleMock = mockConsole();
  
  const uiUtils = getUIUtils();
  
  // Test that it falls back to predefined categories when getUserId fails
  const categories = await uiUtils.loadUserCategories();
  
  assert.ok(Array.isArray(categories), 'Should return an array');
  assert.ok(categories.includes('Alimentação'), 'Should include predefined categories');
  assert.ok(categories.includes('Transporte'), 'Should include predefined categories');
  assert.strictEqual(categories.length, 8, 'Should return predefined categories count');
  
  // Check that error was logged about getUserId issues
  const errorLogs = consoleMock.logs.filter(log => log.level === 'error');
  assert.ok(errorLogs.length > 0, 'Should log error about getUserId issues');
  
  consoleMock.restore();
});

test('UI Utils - predefinedCategories content', async () => {
  const uiUtils = getUIUtils();
  
  const expectedCategories = [
    'Alimentação',
    'Transporte', 
    'Saúde',
    'Educação',
    'Entretenimento',
    'Roupas',
    'Casa',
    'Outros'
  ];
  
  assert.ok(Array.isArray(uiUtils.predefinedCategories), 'Should be an array');
  assert.strictEqual(uiUtils.predefinedCategories.length, expectedCategories.length, 'Should have correct number of categories');
  
  expectedCategories.forEach(category => {
    assert.ok(uiUtils.predefinedCategories.includes(category), `Should include ${category}`);
  });
});

test('UI Utils - Product utilities', async () => {
  const uiUtils = getUIUtils();
  
  // Test extrairDadosGTINs
  const gtins = [
    { code: '7891234567890', type_packaging: 'un' },
    { code: '7891234567891', type_packaging: 'kg' }
  ];
  
  const extractedData = uiUtils.extrairDadosGTINs(gtins);
  assert.ok(Array.isArray(extractedData), 'Should return array');
  assert.strictEqual(extractedData.length, 2, 'Should return all GTINs');
  assert.strictEqual(extractedData[0].code, '7891234567890', 'Should have correct code');
  
  // Test buscarPorGTIN
  const foundGtin = uiUtils.buscarPorGTIN(gtins, '7891234567891');
  assert.ok(foundGtin, 'Should find GTIN');
  assert.strictEqual(foundGtin.type_packaging, 'kg', 'Should return correct GTIN');
  
  // Test determinarUnidade
  assert.strictEqual(uiUtils.determinarUnidade('kg'), 'kg', 'Should map kg correctly');
  assert.strictEqual(uiUtils.determinarUnidade('un'), 'unidade', 'Should map un to unidade');
  assert.strictEqual(uiUtils.determinarUnidade('unknown'), 'unidade', 'Should default to unidade');
  
  // Test determinarCategoria
  const categoria = uiUtils.determinarCategoria(null, 'leite integral');
  assert.strictEqual(categoria, 'Alimentação', 'Should categorize food items correctly');
});

test('UI Utils - Browser environment compatibility', async () => {
  // Mock browser environment
  global.window = {
    getUserId: async () => 'browser-user-123'
  };
  
  // Re-require to test browser environment
  const uiPath = path.resolve(__dirname, '../../src/utils/ui.js');
  delete require.cache[uiPath];
  const uiUtils = require(uiPath);
  
  // In browser environment, functions should be attached to window
  assert.ok(typeof global.window.showNotification === 'function', 'Should attach showNotification to window');
  assert.ok(typeof global.window.loadMarkets === 'function', 'Should attach loadMarkets to window');
  assert.ok(typeof global.window.loadUserCategories === 'function', 'Should attach loadUserCategories to window');
  
  // Clean up
  delete global.window;
});

test('UI Utils - Error handling in extrairDadosGTINs', async () => {
  const uiUtils = getUIUtils();
  
  // Test with null input
  assert.strictEqual(uiUtils.extrairDadosGTINs(null), null, 'Should return null for null input');
  
  // Test with empty array
  assert.strictEqual(uiUtils.extrairDadosGTINs([]), null, 'Should return null for empty array');
  
  // Test with undefined
  assert.strictEqual(uiUtils.extrairDadosGTINs(undefined), null, 'Should return null for undefined');
});

test('UI Utils - Error handling in buscarPorGTIN', async () => {
  const uiUtils = getUIUtils();
  
  // Test with null GTINs
  assert.strictEqual(uiUtils.buscarPorGTIN(null, '123'), null, 'Should return null for null GTINs');
  
  // Test with non-array GTINs
  assert.strictEqual(uiUtils.buscarPorGTIN('not-array', '123'), null, 'Should return null for non-array GTINs');
  
  // Test with GTIN not found
  const gtins = [{ code: '111' }, { code: '222' }];
  assert.strictEqual(uiUtils.buscarPorGTIN(gtins, '333'), undefined, 'Should return undefined for GTIN not found');
});
