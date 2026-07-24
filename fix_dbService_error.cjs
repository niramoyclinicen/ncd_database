const fs = require('fs');
let code = fs.readFileSync('dbService.ts', 'utf8');

const target = `  loadFromCloud: async () => {
    try {
      if (!supabase) {
        return null;
      }
      const { data: record, error } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', MASTER_RECORD_ID)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return {};
        return null;
      }
      return (record && record.data) ? record.data : {};
    } catch (error) {
      console.error("Cloud Connection Error:", error);
      return null;
    }
  },`;

const replacement = `  loadFromCloud: async () => {
    try {
      if (!supabase) {
        return { _error: "Supabase not initialized. Check ENV variables." };
      }
      const { data: record, error } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', MASTER_RECORD_ID)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return {};
        return { _error: "Supabase Query Error: " + error.message };
      }
      return (record && record.data) ? record.data : {};
    } catch (error: any) {
      console.error("Cloud Connection Error:", error);
      return { _error: "Exception: " + error.message };
    }
  },`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('dbService.ts', code);
  console.log('Fixed dbService to return error object');
} else {
  console.log('Target not found in dbService.ts');
}
