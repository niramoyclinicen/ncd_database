const SUPABASE_URL = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : '') || '';
console.log("SUPABASE_URL:", SUPABASE_URL);
