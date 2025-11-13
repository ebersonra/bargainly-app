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
      const { user_id, startDate, endDate, category } = event.queryStringParameters || {};
      
      if (!user_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id' }) };
      }

      // Build options object from query parameters
      const options = {};
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;
      if (category) options.category = category;

      const result = await ctrl.getBudgetStatus(user_id, options);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
