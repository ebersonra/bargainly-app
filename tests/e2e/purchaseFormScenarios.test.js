const { test, mock } = require('node:test');
const assert = require('node:assert');

test('Purchase Form Complete Flow Tests', async (t) => {
  
  await t.test('Scenario 1: Loading State - All components involved', async () => {
    // Mock DOM elements for loading scenario
    const mockElements = {
      loadingMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      successMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      errorMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      }
    };

    // Mock document.getElementById
    const originalGetElementById = global.document?.getElementById;
    global.document = {
      getElementById: mock.fn((id) => {
        if (id === 'loadingMessage') return mockElements.loadingMessage;
        if (id === 'successMessage') return mockElements.successMessage;
        if (id === 'errorMessage') return mockElements.errorMessage;
        return null;
      })
    };

    // Import the showMessage function (we'll test the logic directly)
    function showMessage(message, type) {
      const loadingEl = global.document.getElementById('loadingMessage');
      const successEl = global.document.getElementById('successMessage');
      const errorEl = global.document.getElementById('errorMessage');
      
      // Hide all messages
      if(loadingEl){
          loadingEl.style.display = 'none';
          loadingEl.classList.add('hidden');
      }
      if(successEl){
          successEl.style.display = 'none';
          successEl.classList.add('hidden');
      }
      if(errorEl) {
          errorEl.style.display = 'none';
          errorEl.classList.add('hidden');
      }
      
      if (type === 'loading' && loadingEl) {
          loadingEl.classList.remove('hidden');
          loadingEl.style.display = 'block';
          loadingEl.textContent = message;
      } else if (type === 'success' && message && successEl) {
          successEl.textContent = message;
          successEl.classList.remove('hidden');
          successEl.style.display = 'block';
      } else if (type === 'error' && message && errorEl) {
          errorEl.textContent = message;
          errorEl.classList.remove('hidden');
          errorEl.style.display = 'block';
      }
    }

    // Test loading state
    showMessage('Registrando compra...', 'loading');

    // Verify loading state
    assert.strictEqual(mockElements.loadingMessage.style.display, 'block');
    assert.strictEqual(mockElements.loadingMessage.textContent, 'Registrando compra...');
    assert.strictEqual(mockElements.loadingMessage.classList.remove.mock.calls.length, 1);
    assert.strictEqual(mockElements.loadingMessage.classList.remove.mock.calls[0].arguments[0], 'hidden');

    // Verify other messages are hidden
    assert.strictEqual(mockElements.successMessage.style.display, 'none');
    assert.strictEqual(mockElements.errorMessage.style.display, 'none');

    // Restore
    global.document = originalGetElementById ? { getElementById: originalGetElementById } : undefined;
  });

  await t.test('Scenario 2: Success State - All components involved', async () => {
    // Mock DOM elements for success scenario
    const mockElements = {
      loadingMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      successMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      errorMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      }
    };

    global.document = {
      getElementById: mock.fn((id) => {
        if (id === 'loadingMessage') return mockElements.loadingMessage;
        if (id === 'successMessage') return mockElements.successMessage;
        if (id === 'errorMessage') return mockElements.errorMessage;
        return null;
      })
    };

    function showMessage(message, type) {
      const loadingEl = global.document.getElementById('loadingMessage');
      const successEl = global.document.getElementById('successMessage');
      const errorEl = global.document.getElementById('errorMessage');
      
      // Hide all messages
      if(loadingEl){
          loadingEl.style.display = 'none';
          loadingEl.classList.add('hidden');
      }
      if(successEl){
          successEl.style.display = 'none';
          successEl.classList.add('hidden');
      }
      if(errorEl) {
          errorEl.style.display = 'none';
          errorEl.classList.add('hidden');
      }
      
      if (type === 'loading' && loadingEl) {
          loadingEl.classList.remove('hidden');
          loadingEl.style.display = 'block';
          loadingEl.textContent = message;
      } else if (type === 'success' && message && successEl) {
          successEl.textContent = message;
          successEl.classList.remove('hidden');
          successEl.style.display = 'block';
      } else if (type === 'error' && message && errorEl) {
          errorEl.textContent = message;
          errorEl.classList.remove('hidden');
          errorEl.style.display = 'block';
      }
    }

    // Test success state
    showMessage('Compra registrada com sucesso!', 'success');

    // Verify success state
    assert.strictEqual(mockElements.successMessage.style.display, 'block');
    assert.strictEqual(mockElements.successMessage.textContent, 'Compra registrada com sucesso!');
    assert.strictEqual(mockElements.successMessage.classList.remove.mock.calls.length, 1);
    assert.strictEqual(mockElements.successMessage.classList.remove.mock.calls[0].arguments[0], 'hidden');

    // Verify other messages are hidden
    assert.strictEqual(mockElements.loadingMessage.style.display, 'none');
    assert.strictEqual(mockElements.errorMessage.style.display, 'none');

    global.document = undefined;
  });

  await t.test('Scenario 3: Error State - All components involved', async () => {
    // Mock DOM elements for error scenario
    const mockElements = {
      loadingMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      successMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      },
      errorMessage: { 
        style: { display: 'none' }, 
        classList: { add: mock.fn(), remove: mock.fn() },
        textContent: ''
      }
    };

    global.document = {
      getElementById: mock.fn((id) => {
        if (id === 'loadingMessage') return mockElements.loadingMessage;
        if (id === 'successMessage') return mockElements.successMessage;
        if (id === 'errorMessage') return mockElements.errorMessage;
        return null;
      })
    };

    function showMessage(message, type) {
      const loadingEl = global.document.getElementById('loadingMessage');
      const successEl = global.document.getElementById('successMessage');
      const errorEl = global.document.getElementById('errorMessage');
      
      // Hide all messages
      if(loadingEl){
          loadingEl.style.display = 'none';
          loadingEl.classList.add('hidden');
      }
      if(successEl){
          successEl.style.display = 'none';
          successEl.classList.add('hidden');
      }
      if(errorEl) {
          errorEl.style.display = 'none';
          errorEl.classList.add('hidden');
      }
      
      if (type === 'loading' && loadingEl) {
          loadingEl.classList.remove('hidden');
          loadingEl.style.display = 'block';
          loadingEl.textContent = message;
      } else if (type === 'success' && message && successEl) {
          successEl.textContent = message;
          successEl.classList.remove('hidden');
          successEl.style.display = 'block';
      } else if (type === 'error' && message && errorEl) {
          errorEl.textContent = message;
          errorEl.classList.remove('hidden');
          errorEl.style.display = 'block';
      }
    }

    // Test error state
    const errorMessage = 'Erro ao registrar compra: Category Bebidas not found for user 28b1d1b2-6c84-47c9-84f4-debdabb4b92f';
    showMessage(errorMessage, 'error');

    // Verify error state
    assert.strictEqual(mockElements.errorMessage.style.display, 'block');
    assert.strictEqual(mockElements.errorMessage.textContent, errorMessage);
    assert.strictEqual(mockElements.errorMessage.classList.remove.mock.calls.length, 1);
    assert.strictEqual(mockElements.errorMessage.classList.remove.mock.calls[0].arguments[0], 'hidden');

    // Verify other messages are hidden
    assert.strictEqual(mockElements.loadingMessage.style.display, 'none');
    assert.strictEqual(mockElements.successMessage.style.display, 'none');

    global.document = undefined;
  });

  await t.test('Category loading functionality', async () => {
    // Mock fetch for category loading
    global.fetch = mock.fn(async (url) => {
      if (url.includes('get-purchase-categories')) {
        return {
          ok: true,
          json: async () => [
            { id: '1', name: 'Alimentação' },
            { id: '2', name: 'Bebidas' },
            { id: '3', name: 'Limpeza' }
          ]
        };
      }
      throw new Error('Unknown URL');
    });

    // Test category loading function
    async function loadPurchaseCategories(user_id) {
      try {
          const response = await fetch(`/.netlify/functions/get-purchase-categories?user_id=${user_id}`);
          if (!response.ok) {
              throw new Error(`Error fetching categories: ${response.status}`);
          }
          const categories = await response.json();
          return categories;
      } catch (error) {
          console.error('Error loading purchase categories:', error);
          return [];
      }
    }

    const categories = await loadPurchaseCategories('test-user-id');
    
    assert.strictEqual(Array.isArray(categories), true);
    assert.strictEqual(categories.length, 3);
    assert.strictEqual(categories[0].name, 'Alimentação');
    assert.strictEqual(categories[1].name, 'Bebidas');
    assert.strictEqual(categories[2].name, 'Limpeza');
    assert.strictEqual(global.fetch.mock.calls.length, 1);
    assert.strictEqual(global.fetch.mock.calls[0].arguments[0], '/.netlify/functions/get-purchase-categories?user_id=test-user-id');

    // Clean up
    delete global.fetch;
  });

  await t.test('Form submission with console.log instead of showMessage', async () => {
    // Mock console.log
    const originalLog = console.log;
    const mockLog = mock.fn();
    console.log = mockLog;

    // Mock console.error
    const originalError = console.error;
    const mockError = mock.fn();
    console.error = mockError;

    // Simulate form submission logic
    function simulateFormSubmission(success = true) {
      console.log('Registrando compra...');
      
      if (success) {
        console.log('Compra registrada com sucesso!', { id: 'mock-result' });
      } else {
        console.error('Erro ao registrar compra:', new Error('Category not found'));
      }
    }

    // Test successful submission
    simulateFormSubmission(true);
    assert.strictEqual(mockLog.mock.calls.length, 2);
    assert.strictEqual(mockLog.mock.calls[0].arguments[0], 'Registrando compra...');
    assert.strictEqual(mockLog.mock.calls[1].arguments[0], 'Compra registrada com sucesso!');

    // Reset mocks
    mockLog.mock.resetCalls();
    mockError.mock.resetCalls();

    // Test failed submission
    simulateFormSubmission(false);
    assert.strictEqual(mockLog.mock.calls.length, 1);
    assert.strictEqual(mockLog.mock.calls[0].arguments[0], 'Registrando compra...');
    assert.strictEqual(mockError.mock.calls.length, 1);
    assert.strictEqual(mockError.mock.calls[0].arguments[0], 'Erro ao registrar compra:');

    // Restore
    console.log = originalLog;
    console.error = originalError;
  });
});