/**
 * Add Shopping List Item
 * Netlify Function to add a new item to an existing shopping list
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
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    try {
      const { listId } = event.queryStringParameters || {};
      const requestBody = JSON.parse(event.body || '{}');

      if (!listId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing list ID parameter' })
        };
      }

      // Validate required fields for the item
      const { product_name, category, quantity, unit, unit_price, notes } = requestBody;

      if (!product_name || !category || !quantity || !unit) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required fields: product_name, category, quantity, unit' })
        };
      }

      // Prepare item data
      const itemData = {
        product_name: product_name.trim(),
        category: category.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        unit_price: unit_price ? parseFloat(unit_price) : 0.00,
        notes: notes ? notes.trim() : null
      };

      // Validate data
      if (itemData.quantity <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Quantity must be greater than zero' })
        };
      }

      if (itemData.unit_price < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Price cannot be negative' })
        };
      }

      // Add item to the list
      const newItem = await repo.addItemToList(listId, itemData);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify(newItem)
      };

    } catch (error) {
      console.error('Error adding item to shopping list:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || 'Internal server error' })
      };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
