const fs = require('fs');
let code = fs.readFileSync('dbService.ts', 'utf8');

const target1 = `const _envSupabaseUrl = typeof import.meta !== 'undefined' ? (import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') : '';\nconst SUPABASE_URL = _envSupabaseUrl || process.env.SUPABASE_URL || '';`;
const target2 = `const _envSupabaseKey = typeof import.meta !== 'undefined' ? (import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') : '';\nconst SUPABASE_ANON_KEY = _envSupabaseKey || process.env.SUPABASE_ANON_KEY || '';`;

// Fallback to simple variable reading for Vite.
// Vite statically replaces process.env.SUPABASE_URL directly based on vite.config.ts
// Vite statically replaces import.meta.env.VITE_SUPABASE_URL automatically.
const replacement1 = `const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';`;
const replacement2 = `const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('dbService.ts', code);
