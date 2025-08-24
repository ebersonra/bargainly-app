/**
 * Navigation Controller
 * Handles navigation logic and user interactions
 */
class NavigationController {
  constructor(viewEngine) {
    this.viewEngine = viewEngine || window.viewEngine;
    this.currentPage = this.getCurrentPage();
    this.navItems = this.getNavItems();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '') || 'index';
    return filename;
  }

  getNavItems() {
    return [
      {
        href: '/index.html',
        label: 'Início',
        icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        page: 'index'
      },
      {
        href: '/markets.html',
        label: 'Mercados',
        icon: 'M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z',
        page: 'markets'
      },
      {
        href: '/products.html',
        label: 'Produtos',
        icon: 'M7 4V2a1 1 0 0 1 2 0v2h6V2a1 1 0 0 1 2 0v2h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1zm0 2H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1v1a1 1 0 0 1-2 0V6H9v1a1 1 0 0 1-2 0V6z',
        page: 'products'
      },
      {
        href: '/deals.html',
        label: '🔥 Ofertas',
        isSpecial: true,
        page: 'deals'
      },
      {
        href: '/goals.html',
        label: 'Metas',
        icon: 'M9 11H7v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9h-2v9H9v-9z M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l.8 1.67c.67-1.25 1.01-2.65 1.01-4.21 0-4.39-3.21-8.06-7.33-8.95zM9.37 5.28C7.16 6.91 5.5 9.62 5.5 12.75c0 1.56.34 2.96 1.01 4.21l.8-1.67c-.3-.79-.48-1.64-.48-2.54 0-3.53 2.61-6.43 6-6.92V2.05c-4.12.89-7.33 4.56-7.33 8.95z',
        page: 'goals'
      },
      {
        href: '/purchase.html',
        label: 'Registrar',
        icon: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
        page: 'purchase'
      },
      {
        href: '/dashboard.html',
        label: 'Dashboard',
        icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
        page: 'dashboard'
      }
    ].map(item => ({
      ...item,
      isActive: item.page === this.currentPage
    }));
  }

  async init() {
    await this.render();
    this.attachEventListeners();
  }

  async render() {
    try {
      console.log('NavigationController render - navItems:', this.navItems);
      
      const navHTML = await this.viewEngine.renderView('components/navigation', {
        navItems: this.navItems
      });
      
      console.log('NavigationController render - HTML gerado:', navHTML);
      
      // Try to find nav-menu element first
      const navContainer = document.getElementById('nav-menu');
      if (navContainer) {
        navContainer.innerHTML = navHTML;
        console.log('NavigationController render - HTML inserido no #nav-menu');
      } else {
        // Fallback: Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        console.log('NavigationController render - HTML inserido no body');
      }
    } catch (error) {
      console.error('Error rendering navigation:', error);
      // Fallback to basic navigation
      this.renderFallback();
    }
  }

  renderFallback() {
    const basicNav = `
      <nav class="main-nav">
        <div class="nav-container">
          <div class="nav-brand">
            <a href="/index.html">Barganhα</a>
          </div>
          <div class="nav-menu">
            <ul class="nav-links">
              ${this.navItems.map(item => `
                <li><a href="${item.href}" class="${item.isActive ? 'active' : ''}">${item.label}</a></li>
              `).join('')}
            </ul>
          </div>
        </div>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', basicNav);
  }

  attachEventListeners() {
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('nav-menu-open');
        navToggle.classList.toggle('nav-toggle-active');
      });
    }

    // Logout functionality
    const logoutBtn = document.querySelector('.nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Close menu on link click (mobile)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu) {
          navMenu.classList.remove('nav-menu-open');
        }
        if (navToggle) {
          navToggle.classList.remove('nav-toggle-active');
        }
      });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (navMenu && navToggle && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('nav-menu-open');
        navToggle.classList.remove('nav-toggle-active');
      }
    });
  }

  logout() {
    // Clear user cookie
    document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login
    window.location.href = '/login.html';
  }
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
  window.NavigationController = NavigationController;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationController;
}
