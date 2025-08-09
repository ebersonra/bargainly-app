// Initialize Supabase client for front-end scripts
(function(){
  const url = window?.env?.SUPABASE_URL || '';
  const anonKey = window?.env?.SUPABASE_ANON_KEY || '';
  if(!url || !anonKey){
    console.error('Supabase credentials are missing.');
  }
  // window.supabase is provided by the CDN script
  window.supabaseClient = window.supabase.createClient(url, anonKey);
  // expose client as global `supabase`
  window.supabase = window.supabaseClient;
})();
