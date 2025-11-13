/**
 * Models Index
 * Central export point for all models
 */

// Import all models
const PurchaseRecord = require('./PurchaseRecord');
const Budget = require('./Budget');
const Product = require('./Product');
const Market = require('./Market');

// Export all models
module.exports = {
  PurchaseRecord,
  Budget,
  Product,
  Market
};

// Browser support - attach to window if in browser environment
if (typeof window !== 'undefined') {
  window.Models = {
    PurchaseRecord,
    Budget,
    Product,
    Market
  };
}
