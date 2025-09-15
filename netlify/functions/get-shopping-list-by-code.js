if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const controller = require('../../src/controllers/shoppingListController');

function buildHandler(ctrl = controller) {
  return async function(event) {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
      const shareCode = event.queryStringParameters?.code;
      
      if (!shareCode) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'Share code is required' }) 
        };
      }
      
      const result = await ctrl.getShoppingListByShareCode(shareCode);
      
      if (!result) {
        return { 
          statusCode: 404, 
          body: JSON.stringify({ error: 'List not found' }) 
        };
      }
      
      return { 
        statusCode: 200, 
        body: JSON.stringify(result) 
      };
    } catch (e) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: e.message }) 
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
