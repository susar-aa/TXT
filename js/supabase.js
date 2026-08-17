// supabase.js
// Initialize Supabase Client
if (!window.APP_CONFIG.SUPABASE_URL || !window.APP_CONFIG.SUPABASE_ANON_KEY || window.APP_CONFIG.SUPABASE_URL.includes('your-project-id')) {
    console.warn("Supabase is not configured properly. Please update js/config.js with your project credentials.");
}

// Initialize the Supabase client
window.supabase = window.supabaseClient || window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
);
