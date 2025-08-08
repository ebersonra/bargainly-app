const service = require('../services/purchaseRecordService');

async function insertPurchaseRecord(data, srv = service) {
  return srv.insertPurchaseRecord(data);
}

async function getBudgetStatus(srv = service) {
  return srv.getBudgetStatus();
}

module.exports = { insertPurchaseRecord, getBudgetStatus };
