/**
 * Services Index
 * Central export point for all services
 */

const purchaseRecordService = require('./purchaseRecordService');
const ocrService = require('./ocrService');
const productService = require('./productService');
const marketService = require('./marketService');

module.exports = {
  purchaseRecordService,
  ocrService,
  productService,
  marketService
};
