/**
 * Source Index
 * Central export point for the entire src structure
 * Following MVC architecture patterns
 */

// Import all layers
const models = require('./models');
const controllers = require('./controllers');
const services = require('./services');
const repositories = require('./repositories');
const utils = require('./utils');

// Export organized structure
module.exports = {
  // Models (Data structures with validation)
  models,
  
  // Controllers (Handle HTTP requests, delegate to services)
  controllers,
  
  // Services (Business logic layer)
  services,
  
  // Repositories (Data access layer)
  repositories,
  
  // Utilities (Common helper functions)
  utils
};

// Individual exports for convenience
module.exports.PurchaseRecord = models.PurchaseRecord;
module.exports.Budget = models.Budget;
module.exports.Product = models.Product;
module.exports.Market = models.Market;

// Browser support - attach to window if in browser environment
if (typeof window !== 'undefined') {
  window.BargainlyMVC = module.exports;
}
