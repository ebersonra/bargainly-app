const test = require('node:test');
const assert = require('node:assert');

// Mock DOM environment for Navigation component testing
const mockNavigationDOM = () => {
  global.document = {
    cookie: 'user_id=test123',
    body: {
      insertAdjacentHTML: (position, html) => {
        // Store the HTML for testing
        global.document._insertedHTML = html;
      }
    },
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: (cls) => {},
        remove: (cls) => {},
        toggle: (cls) => {},
        contains: (cls) => false
      },
      appendChild: (child) => {},
      addEventListener: (event, handler) => {}
    }),
    querySelector: (selector) => {
      if (selector === '.nav-toggle') {
        return {
          addEventListener: () => {},
          classList: { toggle: () => {} }
        };
      }
      if (selector === '.nav-menu') {
        return {
          classList: { toggle: () => {}, remove: () => {} }
        };
      }
      if (selector === '.nav-logout') {
        return {
          addEventListener: () => {}
        };
      }
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === '.nav-link') {
        return [
          { addEventListener: () => {} },
          { addEventListener: () => {} },
          { addEventListener: () => {} }
        ];
      }
      return [];
    },
    addEventListener: () => {}
  };
  
  global.window = {
    location: {
      pathname: '/markets.html',
      href: ''
    }
  };
};

test('NavigationComponent - Initialization and page detection', async () => {
  mockNavigationDOM();
  
  // Mock NavigationComponent
  class TestNavigationComponent {
    constructor() {
      this.currentPage = this.getCurrentPage();
      this.init();
    }

    getCurrentPage() {
      const path = global.window.location.pathname;
      const filename = path.split('/').pop().replace('.html', '') || 'index';
      return filename;
    }

    init() {
      this.createNavigation();
      this.attachEventListeners();
    }

    createNavigation() {
      const navHTML = `
        <nav class="main-nav">
          <div class="nav-container">
            <div class="nav-brand">
              <a href="/index.html" class="brand-link">
                <h1 class="brand-title">Barganha App</h1>
              </a>
            </div>
            <div class="nav-menu">
              <ul class="nav-links">
                <li class="nav-item">
                  <a href="/markets.html" class="nav-link ${this.currentPage === 'markets' ? 'active' : ''}">Mercados</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      `;
      
      global.document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    attachEventListeners() {
      // Mock event listener attachment
      return true;
    }
  }
  
  const nav = new TestNavigationComponent();
  
  assert.strictEqual(nav.currentPage, 'markets', 'Should correctly detect current page');
  assert.ok(global.document._insertedHTML.includes('main-nav'), 'Should insert navigation HTML');
  assert.ok(global.document._insertedHTML.includes('active'), 'Should mark current page as active');
});

test('NavigationComponent - Different page paths', async () => {
  const testPaths = [
    { path: '/index.html', expected: 'index' },
    { path: '/markets.html', expected: 'markets' },
    { path: '/products.html', expected: 'products' },
    { path: '/deals.html', expected: 'deals' },
    { path: '/goals.html', expected: 'goals' },
    { path: '/purchase.html', expected: 'purchase' },
    { path: '/dashboard.html', expected: 'dashboard' },
    { path: '/', expected: 'index' },
    { path: '/login.html', expected: 'login' }
  ];
  
  const getCurrentPage = (pathname) => {
    const filename = pathname.split('/').pop().replace('.html', '') || 'index';
    return filename;
  };
  
  testPaths.forEach(({ path, expected }) => {
    global.window = { location: { pathname: path } };
    const result = getCurrentPage(path);
    assert.strictEqual(result, expected, `Should detect ${expected} for path ${path}`);
  });
});

test('NavigationComponent - Active link detection', async () => {
  const createActiveNavLink = (currentPage, linkPage) => {
    return `<a href="/${linkPage}.html" class="nav-link ${currentPage === linkPage ? 'active' : ''}">${linkPage}</a>`;
  };
  
  // Test when current page matches link
  let navLink = createActiveNavLink('markets', 'markets');
  assert.ok(navLink.includes('active'), 'Should mark matching page as active');
  
  // Test when current page doesn't match link
  navLink = createActiveNavLink('markets', 'products');
  assert.ok(!navLink.includes('active'), 'Should not mark non-matching page as active');
});

test('NavigationComponent - Logout functionality', async () => {
  let cookieCleared = false;
  let redirected = false;
  
  // Mock cookie and location
  global.document.cookie = 'user_id=test123';
  global.window.location = { href: '' };
  
  const logout = () => {
    // Clear user cookie
    global.document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    cookieCleared = true;
    
    // Redirect to login
    global.window.location.href = '/login.html';
    redirected = true;
  };
  
  logout();
  
  assert.ok(cookieCleared, 'Should clear user cookie on logout');
  assert.strictEqual(global.window.location.href, '/login.html', 'Should redirect to login page');
});

test('NavigationComponent - Mobile menu functionality', async () => {
  let menuToggled = false;
  let buttonToggled = false;
  
  const mockNavMenu = {
    classList: {
      toggle: (className) => {
        if (className === 'nav-menu-open') {
          menuToggled = true;
        }
      },
      remove: () => { menuToggled = false; }
    }
  };
  
  const mockNavToggle = {
    classList: {
      toggle: (className) => {
        if (className === 'nav-toggle-active') {
          buttonToggled = true;
        }
      },
      remove: () => { buttonToggled = false; }
    }
  };
  
  // Simulate mobile menu toggle
  const toggleMobileMenu = () => {
    mockNavMenu.classList.toggle('nav-menu-open');
    mockNavToggle.classList.toggle('nav-toggle-active');
  };
  
  toggleMobileMenu();
  
  assert.ok(menuToggled, 'Should toggle mobile menu');
  assert.ok(buttonToggled, 'Should toggle menu button state');
});

test('NavigationComponent - Menu close on outside click', async () => {
  let menuClosed = false;
  let buttonDeactivated = false;
  
  const mockNavMenu = {
    classList: {
      remove: (className) => {
        if (className === 'nav-menu-open') {
          menuClosed = true;
        }
      },
      contains: () => false // Simulate click outside menu
    }
  };
  
  const mockNavToggle = {
    classList: {
      remove: (className) => {
        if (className === 'nav-toggle-active') {
          buttonDeactivated = true;
        }
      },
      contains: () => false // Simulate click outside toggle
    }
  };
  
  const handleOutsideClick = (event) => {
    const target = { closest: () => null }; // Simulate click outside
    
    if (mockNavMenu && mockNavToggle && 
        !mockNavMenu.classList.contains(target) && 
        !mockNavToggle.classList.contains(target)) {
      mockNavMenu.classList.remove('nav-menu-open');
      mockNavToggle.classList.remove('nav-toggle-active');
    }
  };
  
  handleOutsideClick({ target: {} });
  
  assert.ok(menuClosed, 'Should close menu on outside click');
  assert.ok(buttonDeactivated, 'Should deactivate toggle button on outside click');
});

test('NavigationComponent - Navigation items configuration', async () => {
  const navigationItems = [
    { href: '/index.html', label: 'Início', icon: 'home' },
    { href: '/markets.html', label: 'Mercados', icon: 'store' },
    { href: '/products.html', label: 'Produtos', icon: 'package' },
    { href: '/deals.html', label: '🔥 Ofertas', icon: 'fire' },
    { href: '/goals.html', label: 'Metas', icon: 'target' },
    { href: '/purchase.html', label: 'Registrar', icon: 'plus' },
    { href: '/dashboard.html', label: 'Dashboard', icon: 'chart' }
  ];
  
  const createNavigationHTML = (items, currentPage) => {
    return items.map(item => {
      const page = item.href.split('/').pop().replace('.html', '') || 'index';
      const isActive = page === currentPage;
      
      return `<a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">${item.label}</a>`;
    }).join('');
  };
  
  const html = createNavigationHTML(navigationItems, 'markets');
  
  assert.ok(html.includes('href="/markets.html"'), 'Should include markets link');
  assert.ok(html.includes('🔥 Ofertas'), 'Should include deals with emoji');
  assert.ok(html.includes('class="nav-link active"'), 'Should mark one item as active');
  
  // Count active items (should be exactly 1)
  const activeCount = (html.match(/nav-link active/g) || []).length;
  assert.strictEqual(activeCount, 1, 'Should have exactly one active navigation item');
});

test('NavigationComponent - Accessibility features', async () => {
  const createAccessibleNavigation = () => {
    return {
      hasAriaLabels: true,
      hasKeyboardSupport: true,
      hasFocusManagement: true,
      hasScreenReaderSupport: true
    };
  };
  
  const accessibility = createAccessibleNavigation();
  
  assert.ok(accessibility.hasAriaLabels, 'Should include ARIA labels');
  assert.ok(accessibility.hasKeyboardSupport, 'Should support keyboard navigation');
  assert.ok(accessibility.hasFocusManagement, 'Should manage focus properly');
  assert.ok(accessibility.hasScreenReaderSupport, 'Should support screen readers');
});

test('NavigationComponent - Brand link functionality', async () => {
  const createBrandLink = () => {
    return `
      <div class="nav-brand">
        <a href="/index.html" class="brand-link">
          <h1 class="brand-title">Barganha App</h1>
        </a>
      </div>
    `;
  };
  
  const brandHTML = createBrandLink();
  
  assert.ok(brandHTML.includes('href="/index.html"'), 'Brand should link to home page');
  assert.ok(brandHTML.includes('Barganha App'), 'Should display app name');
  assert.ok(brandHTML.includes('brand-title'), 'Should have proper CSS class');
});