// Initialize Supabase client for both browser and Netlify/Node environments
(function (global) {
  let url = global.SUPABASE_URL;
  let anonKey = global.SUPABASE_ANON_KEY;

  if ((!url || !anonKey) && typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV !== 'production') {
      try { require('dotenv').config(); } catch (e) {}
    }
    url = url || process.env.SUPABASE_URL;
    anonKey = anonKey || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY;
  }

  if (!url || !anonKey) {
    console.error('Supabase credentials are missing.');
    return;
  }

  let createClient = global.supabase?.createClient;
  if (!createClient && typeof require === 'function') {
    try { ({ createClient } = require('@supabase/supabase-js')); } catch (e) {}
  }

  if (!createClient) {
    console.error('Supabase library not loaded.');
    return;
  }

  const client = createClient(url, anonKey);

  if (global.window) {
    global.supabase = client;
  } else {
    module.exports = client;
  }
})(typeof window !== 'undefined' ? window : globalThis);
