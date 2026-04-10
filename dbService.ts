import { createClient } from '@supabase/supabase-js';

/**
 * NCD Cloud Database Service
 * Manages real-time sync with Supabase and LocalStorage fallback.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// URL validation to prevent Supabase Client from throwing a fatal error
const isValidSupabaseConfig = (url: string, key: string) => {
  try {
    return url && key && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

// Initialize only if valid credentials exist, otherwise keep as null to prevent crash
const supabase = isValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';
const MASTER_RECORD_ID = 1;

export const dbService = {
  saveToCloud: async (appState: any) => {
    try {
      // Primary local backup
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));

      if (supabase) {
        const { error } = await supabase
          .from('ncd_state')
          .upsert({ 
            id: MASTER_RECORD_ID, 
            data: appState,
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });
          
        if (error) throw error;
      }
      return { success: true };
    } catch (error) {
      console.warn("Database Sync Status: Local storage only.", error);
      return { success: false, error };
    }
  },

  loadFromCloud: async () => {
    try {
      if (supabase) {
        const { data: record, error } = await supabase
          .from('ncd_state')
          .select('data')
          .eq('id', MASTER_RECORD_ID)
          .single();
        
        if (error) {
          // PGRST116 means no rows found - this is normal for a new app
          if (error.code === 'PGRST116') {
            return {}; 
          }
          throw error;
        }

        if (record && record.data) {
          // Still keep a local copy for emergency, but loadFromCloud will only return cloud data
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(record.data));
          return record.data;
        }
      }
      return null; // Return null if no cloud data or no connection
    } catch (error) {
      console.error("Cloud Connection Error:", error);
      return null; // Strictly return null on error as per user request
    }
  }
};