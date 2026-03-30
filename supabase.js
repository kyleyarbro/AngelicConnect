(function initSupabaseClient() {
  const SUPABASE_URL = "https://wzjbbyehsbqvhwpaaotw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_lBVCBDN1nPZ_ESTexCuS4g_iJwkgaNJ";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN is not loaded. Expected window.supabase.createClient.");
    return;
  }

  if (!window.__SUPABASE_CLIENT__) {
    window.__SUPABASE_CLIENT__ = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  window.__SUPABASE__ = {
    url: SUPABASE_URL,
    key: SUPABASE_KEY,
    client: window.__SUPABASE_CLIENT__
  };
  window.supabaseClient = window.__SUPABASE_CLIENT__;

  console.log("Supabase initialized:", window.__SUPABASE_CLIENT__);
})();
