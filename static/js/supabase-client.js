// Initialize Supabase client for both browser and Netlify/Node environments
(function (global) {
  let url;
  let anonKey;

  // 1) Try environment variables (Netlify provides them at build/runtime)
  if (typeof process !== 'undefined' && process.env) {
    // Load from .env during local development
    if (process.env.NODE_ENV !== 'production') {
      try { require('dotenv').config(); } catch (e) {}
    }
    url = process.env.SUPABASE_URL;
    // Netlify can expose either SUPABASE_ANON_KEY or SUPABASE_API_KEY
    anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY;
  }

  // 2) Fallback to env.js injected values when running in the browser
  if (!url || !anonKey) {
    url = global?.env?.SUPABASE_URL;
    anonKey = global?.env?.SUPABASE_ANON_KEY || global?.env?.SUPABASE_API_KEY;
  }

  if (!url || !anonKey) {
    console.error('Supabase credentials are missing.');
    return;
  }

  // Determine how to access createClient
  let createClient = global.supabase?.createClient;
  if (!createClient && typeof require === 'function') {
    try { ({ createClient } = require('@supabase/supabase-js')); } catch (e) {}
  }

  if (!createClient) {
    console.error('Supabase library not loaded.');
    return;
  }

  const client = createClient(url, anonKey);

  // Expose the client appropriately
  if (global.window) {
    global.supabase = client;
  } else {
    module.exports = client;
  }
})(typeof window !== 'undefined' ? window : globalThis);
