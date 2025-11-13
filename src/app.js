// Main application initialization file
class BargainlyApp {
    constructor() {
        this.controllers = {};
        this.services = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize core utilities first
            await this.initializeCore();
            
            // Initialize services
            await this.initializeServices();
            
            // Initialize controllers based on current page
            await this.initializeControllers();
            
            this.initialized = true;
            console.log('Bargainly App initialized successfully');
        } catch (error) {
            console.error('Error initializing Bargainly App:', error);
        }
    }

    async initializeCore() {
        // Auth utilities are already available globally
        // UI utilities are already available globally
        // Validation utilities are already available globally
        console.log('Core utilities initialized');
    }

    async initializeServices() {
        // Services are already loaded as modules
        // They will be instantiated by controllers as needed
        console.log('Services ready');
    }

    async initializeControllers() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'dashboard':
                if (window.DashboardController) {
                    this.controllers.dashboard = new window.DashboardController();
                }
                break;
                
            case 'markets':
                if (window.MarketController) {
                    this.controllers.market = new window.MarketController();
                }
                break;
                
            case 'products':
                if (window.ProductController) {
                    this.controllers.product = new window.ProductController();
                }
                break;
                
            case 'purchase':
                if (window.PurchaseController) {
                    this.controllers.purchase = new window.PurchaseController();
                }
                break;
                
            case 'goals':
                if (window.BudgetController) {
                    this.controllers.budget = new window.BudgetController();
                }
                break;
                
            case 'login':
                if (window.LoginController) {
                    this.controllers.login = new window.LoginController();
                }
                break;
                
            default:
                // Initialize common controllers for index page
                this.initializeTabController();
                break;
        }
        
        console.log(`Controllers initialized for page: ${currentPage}`);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename.includes('dashboard')) return 'dashboard';
        if (filename.includes('markets')) return 'markets';
        if (filename.includes('products')) return 'products';
        if (filename.includes('purchase')) return 'purchase';
        if (filename.includes('goals')) return 'goals';
        if (filename.includes('login')) return 'login';
        
        return 'index';
    }

    initializeTabController() {
        // Tab navigation for main application
        const tabButtons = document.querySelectorAll('[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (tabButtons.length === 0) return;
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab, tabButtons, tabContents);
            });
        });
        
        // Initialize first tab
        const firstTab = tabButtons[0]?.getAttribute('data-tab');
        if (firstTab) {
            this.switchTab(firstTab, tabButtons, tabContents);
        }
    }

    switchTab(targetTab, tabButtons, tabContents) {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected button and content
        const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
        const activeContent = document.getElementById(targetTab);
        
        if (activeButton) activeButton.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        
        // Initialize controller for the active tab if needed
        this.initializeTabController(targetTab);
        
        console.log(`Switched to tab: ${targetTab}`);
    }

    initializeTabController(tabName) {
        // Initialize specific controllers when tabs are activated
        switch (tabName) {
            case 'markets':
                if (!this.controllers.market && window.MarketController) {
                    this.controllers.market = new window.MarketController();
                }
                break;
                
            case 'products':
                if (!this.controllers.product && window.ProductController) {
                    this.controllers.product = new window.ProductController();
                }
                break;
                
            case 'purchase':
                if (!this.controllers.purchase && window.PurchaseController) {
                    this.controllers.purchase = new window.PurchaseController();
                }
                break;
                
            case 'budgets':
                if (!this.controllers.budget && window.BudgetController) {
                    this.controllers.budget = new window.BudgetController();
                }
                break;
        }
    }

    // Utility methods for global access
    getController(name) {
        return this.controllers[name];
    }

    getAllControllers() {
        return this.controllers;
    }

    isInitialized() {
        return this.initialized;
    }
}

// Create global app instance
const bargainlyApp = new BargainlyApp();

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { BargainlyApp, bargainlyApp };
} else {
    window.BargainlyApp = BargainlyApp;
    window.bargainlyApp = bargainlyApp;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            bargainlyApp.init();
        });
    } else {
        bargainlyApp.init();
    }
}
