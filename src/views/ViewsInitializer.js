/**
 * Views Initializer
 * Loads and initializes all view components
 */
class ViewsInitializer {
  constructor() {
    this.viewEngine = null;
    this.navigationController = null;
  }

  async init() {
    try {
      // Initialize view engine
      if (typeof window !== 'undefined' && window.ViewEngine) {
        this.viewEngine = new window.ViewEngine();
        window.viewEngine = this.viewEngine;
      }

      // Initialize navigation
      if (typeof window !== 'undefined' && window.NavigationController) {
        this.navigationController = new window.NavigationController(this.viewEngine);
      }

    } catch (error) {
      console.error('Error initializing views:', error);
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const viewsInit = new ViewsInitializer();
  await viewsInit.init();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewsInitializer;
}
