/**
 * Repositories Index
 * Central export point for all repositories
 */

const purchaseRecordRepository = require('./purchaseRecordRepository');
const productRepository = require('./productRepository');
const marketRepository = require('./marketRepository');

module.exports = {
  purchaseRecordRepository,
  productRepository,
  marketRepository
};
