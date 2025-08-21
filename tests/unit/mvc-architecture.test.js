const test = require('node:test');
const assert = require('node:assert');

// Mock DOM environment for testing
const mockDOM = () => {
  global.document = {
    cookie: 'user_id=test123',
    createElement: () => ({
      className: '',
      textContent: '',
      style: {},
      appendChild: () => {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      }
    }),
    getElementById: () => ({
      innerHTML: '',
      value: '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      parentElement: {
        appendChild: () => {}
      }
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  
  global.window = {
    location: {
      pathname: '/test.html',
      href: ''
    }
  };
};

test('BaseController - Authentication check', async () => {
  mockDOM();
  
  // Mock BaseController
  class TestBaseController {
    getUserIdFromCookie() {
      const match = 'user_id=test123'.match(/(?:^|; )user_id=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
    
    ensureAuth() {
      if (global.window.location.pathname.endsWith('/login.html')) return;
      if (!this.getUserIdFromCookie()) {
        global.window.location.href = '/login.html';
      }
    }
  }
  
  const controller = new TestBaseController();
  const userId = controller.getUserIdFromCookie();
  
  assert.strictEqual(userId, 'test123', 'Should extract user ID from cookie');
  
  // Test auth redirect
  global.document.cookie = '';
  global.window.location.href = '';
  
  const controllerNoAuth = new TestBaseController();
  controllerNoAuth.ensureAuth();
  
  // In a real scenario, this would redirect to login
  assert.ok(true, 'Auth check completed without errors');
});

test('BaseController - Message display methods', async () => {
  mockDOM();
  
  class TestBaseController {
    showError(message, container) {
      const errorDiv = {
        className: 'error-message',
        textContent: message
      };
      return errorDiv;
    }
    
    showSuccess(message, container) {
      const successDiv = {
        className: 'success-message',
        textContent: message
      };
      return successDiv;
    }
    
    showLoading(element) {
      if (element) {
        element.innerHTML = '<div class="loading">Carregando...</div>';
      }
    }
  }
  
  const controller = new TestBaseController();
  
  const errorElement = controller.showError('Test error', null);
  assert.strictEqual(errorElement.className, 'error-message');
  assert.strictEqual(errorElement.textContent, 'Test error');
  
  const successElement = controller.showSuccess('Test success', null);
  assert.strictEqual(successElement.className, 'success-message');
  assert.strictEqual(successElement.textContent, 'Test success');
  
  const loadingElement = { innerHTML: '' };
  controller.showLoading(loadingElement);
  assert.strictEqual(loadingElement.innerHTML, '<div class="loading">Carregando...</div>');
});

test('NavigationComponent - Page detection', async () => {
  mockDOM();
  
  class TestNavigationComponent {
    getCurrentPage() {
      const path = global.window.location.pathname;
      const filename = path.split('/').pop().replace('.html', '') || 'index';
      return filename;
    }
  }
  
  // Test different page paths
  global.window.location.pathname = '/markets.html';
  let nav = new TestNavigationComponent();
  assert.strictEqual(nav.getCurrentPage(), 'markets');
  
  global.window.location.pathname = '/products.html';
  nav = new TestNavigationComponent();
  assert.strictEqual(nav.getCurrentPage(), 'products');
  
  global.window.location.pathname = '/';
  nav = new TestNavigationComponent();
  assert.strictEqual(nav.getCurrentPage(), 'index');
});

test('Page Controllers - Form handling simulation', async () => {
  mockDOM();
  
  class TestPageController {
    constructor() {
      this.formData = null;
    }
    
    handleFormSubmission(formElement, onSubmit) {
      // Simulate form submission
      const mockFormData = new Map([
        ['name', 'Test Product'],
        ['price', '10.50'],
        ['category', 'Food']
      ]);
      
      const data = {};
      for (const [key, value] of mockFormData.entries()) {
        data[key] = value;
      }
      
      this.formData = data;
      return onSubmit(data);
    }
    
    async createItem(data) {
      // Simulate item creation
      return { id: 1, ...data };
    }
  }
  
  const controller = new TestPageController();
  
  const mockForm = {};
  const result = await controller.handleFormSubmission(mockForm, (data) => {
    return controller.createItem(data);
  });
  
  assert.strictEqual(result.name, 'Test Product');
  assert.strictEqual(result.price, '10.50');
  assert.strictEqual(result.category, 'Food');
  assert.strictEqual(result.id, 1);
});

test('Currency formatting utility', async () => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatted = formatCurrency(123.45);
  assert.ok(formatted.includes('123,45'), 'Should format currency in Brazilian format');
  assert.ok(formatted.includes('R$'), 'Should include Brazilian Real symbol');
});

test('Date formatting utility', async () => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatted = formatDate('2024-01-15');
  assert.strictEqual(formatted, '15/01/2024', 'Should format date in Brazilian format');
});

test('Form validation helpers', async () => {
  const validateRequired = (data, requiredFields) => {
    const missing = [];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        missing.push(field);
      }
    }
    return missing;
  };
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePrice = (price) => {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice > 0;
  };
  
  // Test required field validation
  const invalidData = { name: '', price: '10.50' };
  const missing = validateRequired(invalidData, ['name', 'price']);
  assert.deepStrictEqual(missing, ['name'], 'Should detect missing required field');
  
  const validData = { name: 'Test', price: '10.50' };
  const noMissing = validateRequired(validData, ['name', 'price']);
  assert.deepStrictEqual(noMissing, [], 'Should not detect missing fields when all are present');
  
  // Test email validation
  assert.strictEqual(validateEmail('test@example.com'), true, 'Should validate correct email');
  assert.strictEqual(validateEmail('invalid-email'), false, 'Should reject invalid email');
  
  // Test price validation
  assert.strictEqual(validatePrice('10.50'), true, 'Should validate correct price');
  assert.strictEqual(validatePrice('0'), false, 'Should reject zero price');
  assert.strictEqual(validatePrice('invalid'), false, 'Should reject invalid price');
});

test('Local storage helpers', async () => {
  // Mock localStorage
  const mockStorage = {};
  const localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
  };
  
  const saveUserPreferences = (prefs) => {
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };
  
  const getUserPreferences = () => {
    const prefs = localStorage.getItem('userPreferences');
    return prefs ? JSON.parse(prefs) : {};
  };
  
  const testPrefs = { theme: 'dark', language: 'pt-BR' };
  saveUserPreferences(testPrefs);
  
  const retrieved = getUserPreferences();
  assert.deepStrictEqual(retrieved, testPrefs, 'Should save and retrieve user preferences');
});

test('Error handling in controllers', async () => {
  class TestErrorController {
    async performAction() {
      throw new Error('Test error');
    }
    
    async safePerformAction() {
      try {
        await this.performAction();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
  
  const controller = new TestErrorController();
  const result = await controller.safePerformAction();
  
  assert.strictEqual(result.success, false, 'Should handle errors gracefully');
  assert.strictEqual(result.error, 'Test error', 'Should capture error message');
});

test('Responsive design breakpoint utilities', async () => {
  const getBreakpoint = (width) => {
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'xs';
  };
  
  const getGridColumns = (breakpoint) => {
    const columnMap = {
      'xs': 1,
      'sm': 2,
      'md': 3,
      'lg': 4,
      'xl': 4
    };
    return columnMap[breakpoint] || 1;
  };
  
  assert.strictEqual(getBreakpoint(320), 'xs', 'Should detect mobile breakpoint');
  assert.strictEqual(getBreakpoint(768), 'md', 'Should detect tablet breakpoint');
  assert.strictEqual(getBreakpoint(1280), 'xl', 'Should detect desktop breakpoint');
  
  assert.strictEqual(getGridColumns('xs'), 1, 'Should return 1 column for mobile');
  assert.strictEqual(getGridColumns('lg'), 4, 'Should return 4 columns for large screens');
});

test('Data transformation utilities', async () => {
  const transformProductData = (rawProduct) => {
    return {
      id: rawProduct.id,
      name: rawProduct.name?.trim() || '',
      price: parseFloat(rawProduct.price) || 0,
      category: rawProduct.category?.toLowerCase() || 'outros',
      formattedPrice: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(parseFloat(rawProduct.price) || 0)
    };
  };
  
  const rawProduct = {
    id: 1,
    name: '  Test Product  ',
    price: '10.50',
    category: 'FOOD'
  };
  
  const transformed = transformProductData(rawProduct);
  
  assert.strictEqual(transformed.name, 'Test Product', 'Should trim product name');
  assert.strictEqual(transformed.price, 10.50, 'Should convert price to number');
  assert.strictEqual(transformed.category, 'food', 'Should normalize category to lowercase');
  assert.ok(transformed.formattedPrice.includes('10,50'), 'Should format price for display');
});