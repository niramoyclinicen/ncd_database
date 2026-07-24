const fs = require('fs');
let code = fs.readFileSync('dbService.ts', 'utf8');

// We know the file starts with:
// import { createClient } from '@supabase/supabase-js';
// /** ... */
// // Safely get env vars ...
// // Use process.env ...
// const SUPABASE_URL = ...
// const SUPABASE_ANON_KEY = ...

const newCode = `import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
    // Try Vite's import.meta.env first (statically replaced by Vite)
    // @ts-ignore
    if (import.meta && import.meta.env) {
        // @ts-ignore
        SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
        // @ts-ignore
        SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
    }
} catch (e) {
    // Ignore
}

if (!SUPABASE_URL && typeof process !== 'undefined' && process.env) {
    SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

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

// Replace everything from the top of the file up to `const LOCAL_STORAGE_KEY` with newCode
const localIndex = code.indexOf(`const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';`);
if (localIndex !== -1) {
    code = newCode + '\n' + code.substring(localIndex);
    fs.writeFileSync('dbService.ts', code);
    console.log('Successfully updated dbService.ts');
} else {
    console.log('Could not find LOCAL_STORAGE_KEY');
}
