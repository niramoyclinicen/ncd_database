const fs = require('fs');
let code = fs.readFileSync('dbService.ts', 'utf8');

const newCode = `import { createClient } from '@supabase/supabase-js';

let fallbackUrl = '';
try { fallbackUrl = process.env.SUPABASE_URL || ''; } catch (e) {}

let fallbackKey = '';
try { fallbackKey = process.env.SUPABASE_ANON_KEY || ''; } catch (e) {}

// @ts-ignore
const envSupabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : '';
// @ts-ignore
const envSupabaseKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

const SUPABASE_URL = envSupabaseUrl || fallbackUrl || '';
const SUPABASE_ANON_KEY = envSupabaseKey || fallbackKey || '';

// URL validation to prevent Supabase Client from throwing a fatal error
const isValidSupabaseConfig = (url: string, key: string) => {
  try {
    return url && key && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

const supabase = isValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
`;

const localIndex = code.indexOf(`const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';`);
if (localIndex !== -1) {
    code = newCode + '\n' + code.substring(localIndex);
    fs.writeFileSync('dbService.ts', code);
    console.log('Successfully updated dbService.ts');
} else {
    console.log('Could not find LOCAL_STORAGE_KEY');
}
