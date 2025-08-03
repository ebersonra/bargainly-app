// Carrega variáveis do .env em dev
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

const CACHE_EXPIRATION_MINUTES = 1440; // 24h

exports.handler = async function (event) {
  const cnpj = event.queryStringParameters?.cnpj;

  if (!cnpj || cnpj.length < 14) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "CNPJ inválido" }),
    };
  }

  // Buscar no cache
  const { data: cache, error } = await supabase
    .from("company_cache")
    .select("*")
    .eq("cnpj", cnpj)
    .single();

  const now = new Date();
  const isValid = cache && cache.updated_at &&
    now - new Date(cache.updated_at) < CACHE_EXPIRATION_MINUTES * 60 * 1000;

  if (isValid) {
    return {
      statusCode: 200,
      body: JSON.stringify(cache.data),
    };
  }

  // Buscar na API pública (BrasilAPI)
  const res = await fetch(`${process.env.BRASIL_API_URL}/api/cnpj/v1/${cnpj}`);
  if (!res.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Erro ao consultar API externa" }),
    };
  }

  const companyData = await res.json();

  // Atualizar ou inserir no cache
  await supabase
    .from("company_cache")
    .upsert({
      cnpj,
      data: companyData,
      updated_at: new Date().toISOString(),
    });

  return {
    statusCode: 200,
    body: JSON.stringify(companyData),
  };
};
