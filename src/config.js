// Main configuration and module loader for the browser
// This file should be loaded in HTML files to initialize the MVC architecture

// Load order is important - utilities first, then services, then controllers
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        baseUrl: window.location.origin,
        apiPath: '/.netlify/functions',
        assetsPath: '/static',
        srcPath: '/src'
    };
    
    // Make config globally available
    window.BARGAINLY_CONFIG = CONFIG;
    
    // Module loader utility
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    function loadStylesheet(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
    
    // Initialize function
    async function initializeBargainlyApp() {
        try {
            console.log('Loading Bargainly App modules...');
            
            // Load utilities first (these make functions globally available)
            await loadScript(`${CONFIG.srcPath}/utils/validation.js`);
            await loadScript(`${CONFIG.srcPath}/utils/formatting.js`);
            await loadScript(`${CONFIG.srcPath}/utils/auth.js`);
            await loadScript(`${CONFIG.srcPath}/utils/ui.js`);
            
            // Load services
            await loadScript(`${CONFIG.srcPath}/services/barcodeService.js`);
            
            // Load models (these are also available as modules)
            await loadScript(`${CONFIG.srcPath}/models/PurchaseRecord.js`);
            await loadScript(`${CONFIG.srcPath}/models/Budget.js`);
            await loadScript(`${CONFIG.srcPath}/models/Product.js`);
            await loadScript(`${CONFIG.srcPath}/models/Market.js`);
            
            // Load services that depend on models
            await loadScript(`${CONFIG.srcPath}/services/purchaseRecordService.js`);
            await loadScript(`${CONFIG.srcPath}/services/budgetService.js`);
            await loadScript(`${CONFIG.srcPath}/services/productService.js`);
            await loadScript(`${CONFIG.srcPath}/services/marketService.js`);
            
            // Load controllers
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/marketController.js`);
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/productController.js`);
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/purchaseController.js`);
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/budgetController.js`);
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/dashboardController.js`);
            await loadScript(`${CONFIG.srcPath}/controllers/frontend/loginController.js`);
            
            // Load main app controller last
            await loadScript(`${CONFIG.srcPath}/app.js`);
            
            console.log('Bargainly App modules loaded successfully');
            
        } catch (error) {
            console.error('Error loading Bargainly App modules:', error);
        }
    }
    
    // Check for required dependencies
    function checkDependencies() {
        const requiredGlobals = ['fetch', 'Promise'];
        const missing = requiredGlobals.filter(dep => typeof window[dep] === 'undefined');
        
        if (missing.length > 0) {
            console.error('Missing required dependencies:', missing);
            return false;
        }
        
        return true;
    }
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (checkDependencies()) {
                initializeBargainlyApp();
            }
        });
    } else {
        if (checkDependencies()) {
            initializeBargainlyApp();
        }
    }
    
    // Export for manual initialization if needed
    window.initializeBargainlyApp = initializeBargainlyApp;
    
})();
