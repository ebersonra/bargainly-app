/**
 * Get Shopping List by ID
 * Netlify Function to retrieve a specific shopping list with items
 */

// Load env vars only in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const controller = require('../../src/controllers/shoppingListController');

/**
 * Build handler function for dependency injection
 * @param {Object} ctrl - Controller to inject
 * @returns {Function} - Handler function
 */
function buildHandler(ctrl = controller) {
  return async function(event) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const { id, user_id } = event.queryStringParameters || {};

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing list ID parameter' })
        };
      }

      if (!user_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing user_id parameter' })
        };
      }

      // Get shopping list by ID
      const list = await ctrl.getShoppingListById(id, user_id);

      if (!list) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Shopping list not found' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify(list)
      };

    } catch (error) {
      console.error('Error getting shopping list:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
