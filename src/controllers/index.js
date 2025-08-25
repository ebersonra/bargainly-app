/**
 * Controllers Index
 * Central export point for all controllers
 */

const purchaseRecordController = require('./purchaseRecordController');
const ocrController = require('./ocrController');
const productController = require('./productController');
const marketController = require('./marketController');

module.exports = {
  purchaseRecordController,
  ocrController,
  productController,
  marketController
};
