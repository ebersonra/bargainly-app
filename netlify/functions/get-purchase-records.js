const purchaseRecordController = require('../../src/controllers/purchaseRecordController');

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

function buildHandler(ctrl = purchaseRecordController) {
    return async function(event) {
        // Only allow GET requests
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        try {
            const { user_id, limit = 10, offset = 0 } = event.queryStringParameters || {};

            // Validate required parameters
            if (!user_id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'user_id is required' })
                };
            }

            // Validate limit parameter
            const limitNum = parseInt(limit);
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'limit must be a number between 1 and 100' })
                };
            }

            // Validate offset parameter
            const offsetNum = parseInt(offset);
            if (isNaN(offsetNum) || offsetNum < 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'offset must be a non-negative number' })
                };
            }

            // Call controller to get purchase records
            const records = await ctrl.getPurchaseRecords({
                user_id,
                limit: limitNum,
                offset: offsetNum
            });

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS'
                },
                body: JSON.stringify(records)
            };

        } catch (error) {
            console.error('Error in get-purchase-records function:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Internal server error',
                    message: error.message 
                })
            };
        }
    };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
