/**
 * Remove Shopping List Item
 * Netlify Function to remove an item from a shopping list
 */

// Load env vars only in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const repository = require('../../src/repositories/shoppingListRepository');

/**
 * Build handler function for dependency injection
 * @param {Object} repo - Repository to inject
 * @returns {Function} - Handler function
 */
function buildHandler(repo = repository) {
  return async function(event) {
    // Only allow DELETE requests
    if (event.httpMethod !== 'DELETE') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const { itemId } = event.queryStringParameters || {};

      if (!itemId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing item ID parameter' })
        };
      }

      // Remove the item
      const deletedItem = await repo.deleteShoppingListItem(itemId);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          message: 'Item removed successfully',
          item: deletedItem 
        })
      };

    } catch (error) {
      console.error('Error removing item from shopping list:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
