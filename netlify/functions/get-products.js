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
        const user_id = event.queryStringParameters?.user_id;
        let url = `${process.env.SUPABASE_URL}/rest/v1/products`;
        if (user_id) {
            url += `?user_id=eq.${user_id}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.SUPABASE_API_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_API_KEY}`,
                'Prefer': 'return=representation'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Erro do Supabase:', text);
            throw new Error(text);
        }

        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    }catch(error){
        console.error('Erro ao buscar produtos:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar produtos' })
        };
    }
};