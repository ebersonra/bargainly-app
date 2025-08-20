const service = require('../services/ocrService');

async function processReceipt(data, srv = service) {
  return srv.processReceipt(data);
}

module.exports = { processReceipt };
