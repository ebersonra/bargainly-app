// Carrega variáveis do .env em dev
if (process.env.NODE_ENV !== 'production') {
    try { require('dotenv').config(); } catch (e) {}
}
  
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
exports.handler = async function(event) {

    const codigoBarras = event.queryStringParameters.codigo;

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {

        const apiKey = process.env.COSMOS_API_TOKEN;

        if (!apiKey) {
            return { statusCode: 500, body: 'API Key não configurada no ambiente.' };
        }

        // Buscar na API Cosmos Bluesoft
        const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${codigoBarras}.json`,{
            method: 'GET',
            headers: {
                'X-Cosmos-Token': apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'Cosmos-API-Request'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}