if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const controller = require('../../src/controllers/purchaseRecordController');

function buildHandler(ctrl = controller) {
  return async function(event) {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
      const result = await ctrl.getBudgetStatus();
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
