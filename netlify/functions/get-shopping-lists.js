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
      const params = event.queryStringParameters || {};
      
      if (!params.user_id) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'User ID is required' }) 
        };
      }
      
      console.log('Getting shopping lists for user:', params.user_id);
      console.log('Request params:', params);
      
      const result = await ctrl.getShoppingLists(params);
      
      console.log('Shopping lists result:', result);
      
      return { 
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify(result) 
      };
    } catch (e) {
      console.error('Error in get-shopping-lists:', e);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: e.message }) 
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
