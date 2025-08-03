// Carrega variáveis do .env em dev
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event) {
    // Verifica se o método HTTP é GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const url = `${process.env.RECEITA_WS_URL}/${event.queryStringParameters.cnpj}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    }catch(error){
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Erro ao buscar empresa' }) 
        };
    }
};