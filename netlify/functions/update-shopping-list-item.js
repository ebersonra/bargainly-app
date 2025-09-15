/**
 * Update Shopping List Item
 * Netlify Function to update an item in a shopping list (e.g., toggle checked status)
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
    // Only allow PUT/PATCH requests
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const { itemId } = event.queryStringParameters || {};
      const requestBody = JSON.parse(event.body || '{}');

      if (!itemId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing item ID parameter' })
        };
      }

      // Extract updates from request body
      const allowedUpdates = ['is_checked', 'quantity', 'unit_price', 'notes'];
      const updates = {};
      
      for (const field of allowedUpdates) {
        if (requestBody[field] !== undefined) {
          updates[field] = requestBody[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No valid updates provided' })
        };
      }

      // Validate numeric fields
      if (updates.quantity !== undefined && updates.quantity <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Quantity must be greater than zero' })
        };
      }

      if (updates.unit_price !== undefined && updates.unit_price < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Price cannot be negative' })
        };
      }

      // Update the item
      const updatedItem = await repo.updateShoppingListItem(itemId, updates);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS'
        },
        body: JSON.stringify(updatedItem)
      };

    } catch (error) {
      console.error('Error updating shopping list item:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
