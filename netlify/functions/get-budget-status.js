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
      const user_id = event.queryStringParameters?.user_id;
      if (!user_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id' }) };
      }
      const result = await ctrl.getBudgetStatus(user_id);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
