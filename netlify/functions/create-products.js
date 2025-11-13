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
    const {
      user_id,
      mercadoId,
      nome,
      unidade,
      valor,
      categoria,
      gtin,
      thumbnail,
      barcode
    } = JSON.parse(event.body);

    if (!user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id' }) };
    }

    const url = `${process.env.SUPABASE_URL}/rest/v1/products`;
    const body = JSON.stringify([
      {
        user_id,
        market_id: mercadoId,
        name: nome,
        unit: unidade,
        price: valor,
        category: categoria,
        gtin: gtin,
        thumbnail: thumbnail,
        barcode: barcode
      }
    ]);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_API_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_API_KEY}`,
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
    console.error('Erro ao inserir produto:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
