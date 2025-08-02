// Carrega variáveis do .env em dev
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { nome, endereco } = JSON.parse(event.body);
    if (!nome || !endereco) {
      return { statusCode: 400, body: 'Dados inválidos' };
    }

    const url = `${process.env.SUPABASE_URL}/rest/v1/markets`;
    const body = JSON.stringify([{ name: nome, address: endereco }]);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_API_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_API_KEY}`,
        'Prefer': 'return=representation'
      },
      body
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data[0]) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
