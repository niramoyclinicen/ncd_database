
import { createClient } from '@supabase/supabase-js';

/**
 * NCD Cloud Database Service
 * Manages real-time sync with Supabase and LocalStorage fallback.
 * Configured to match user's actual Supabase table: 'ncd_state'
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';
const MASTER_RECORD_ID = 1; // Matching the int8 ID in your screenshot

export const dbService = {
  // Save all application data to Supabase
  saveToCloud: async (appState: any) => {
    try {
      // 1. Update LocalStorage immediately for speed and offline resilience
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));

      // 2. Sync to Supabase cloud
      if (supabase) {
        const { error } = await supabase
          .from('ncd_state') // Updated table name
          .upsert({ 
            id: MASTER_RECORD_ID, 
            data: appState, // Updated column name to 'data'
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });
          
        if (error) throw error;
      }
      return { success: true };
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      return { success: false, error };
    }
  },

  // Load all application data from Supabase or local fallback
  loadFromCloud: async (defaultData: any) => {
    try {
      // 1. Try fetching from Supabase cloud first
      if (supabase) {
        const { data: record, error } = await supabase
          .from('ncd_state') // Updated table name
          .select('data')    // Updated column name to 'data'
          .eq('id', MASTER_RECORD_ID)
          .single();
        
        if (record && record.data) {
          // Sync local storage with cloud data
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(record.data));
          return record.data;
        }
      }

      // 2. Fallback to LocalStorage if cloud is unavailable
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      
      return defaultData;
    } catch (error) {
      console.error("Cloud Fetch Error:", error);
      
      // Secondary fallback on error
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultData;
    }
  }
};
