const service = require('../services/purchaseRecordService');

async function insertPurchaseRecord(data, srv = service) {
  return srv.insertPurchaseRecord(data);
}

async function getBudgetStatus(user_id, srv = service) {
  return srv.getBudgetStatus(user_id);
}

async function setBudget(data, srv = service) {
  return srv.setBudget(data);
}

async function getPurchaseCategories(user_id, srv = service) {
  return srv.getPurchaseCategories(user_id);
}

module.exports = { insertPurchaseRecord, getBudgetStatus, setBudget, getPurchaseCategories };
