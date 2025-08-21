if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const controller = require('../../src/controllers/ocrController');

function buildHandler(ctrl = controller) {
  return async function(event) {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
      // Check if body is FormData (multipart) or JSON
      let data;
      if (event.headers['content-type'] && event.headers['content-type'].includes('multipart/form-data')) {
        // Handle FormData for file uploads
        const base64Body = event.isBase64Encoded ? event.body : Buffer.from(event.body, 'binary').toString('base64');
        data = { image: base64Body, contentType: event.headers['content-type'] };
      } else {
        // Handle JSON data
        data = JSON.parse(event.body);
      }
      
      const result = await ctrl.processReceipt(data);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
    }
  };
}

exports.handler = buildHandler();
exports.buildHandler = buildHandler;
