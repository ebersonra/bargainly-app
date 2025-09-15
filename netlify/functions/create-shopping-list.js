if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const controller = require('../../src/controllers/shoppingListController');

function buildHandler(ctrl = controller) {
  return async function(event) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
      const data = JSON.parse(event.body);
      const result = await ctrl.createShoppingList(data);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
