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
      // Always save a local backup first
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
      console.error("Cloud Sync Error:", error);
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
          if (error.code === 'PGRST116') {
            return null; // Explicitly return null if no cloud data
          }
          throw error;
        }

        if (record && record.data) {
          // If we got cloud data, update local backup
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(record.data));
          return record.data;
        }
      }
      return null; 
    } catch (error) {
      console.error("Cloud Connection Error:", error);
      // Fallback to local storage if cloud fails
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          return JSON.parse(localData);
        } catch {
          return null;
        }
      }
      return null; 
    }
  },

  getLocalBackup: () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  // NEW: Deep scan of all potential legacy localStorage keys to recover lost data
  deepScanRecovery: () => {
    const keysMapping: Record<string, string> = {
      'patients': 'patients',
      'doctors': 'doctors',
      'referrars': 'referrars',
      'tests': 'tests',
      'reagents': 'reagents',
      'labInvoices': 'labInvoices',
      'dueCollections': 'dueCollections',
      'reports': 'reports',
      'employees': 'employees',
      'medicines': 'medicines',
      'clinicalDrugs': 'clinicalDrugs',
      'purchaseInvoices': 'purchaseInvoices',
      'salesInvoices': 'salesInvoices',
      'admissions': 'admissions',
      'indoorInvoices': 'indoorInvoices',
      'detailedExpenses': 'detailedExpenses',
      'prescriptions': 'prescriptions',
      'appointments': 'appointments',
      'attendanceLog': 'attendanceLog',
      'leaveLog': 'leaveLog',
      'monthlyRoster': 'monthlyRoster',
      'diagnosticSettings': 'diagnosticSettings'
    };

    let recoveredState: any = {};
    
    // First check common legacy keys from previous versions
    const mainCache = localStorage.getItem('ncd_offline_cache_v1');
    if (mainCache) {
      try { recoveredState = JSON.parse(mainCache); } catch(e) {}
    }

    // Then try specific storage keys seen in logs
    const legacyKeysMap: Record<string, string> = {
      'ncd_monthly_adjustments': 'monthlyAdjustments',
      'ncd_ot_details_library': 'otDetailsLibrary',
      'ncd_shareholders': 'shareholders',
      'ncd_company_collections': 'companyCollections',
      'ncd_future_plans': 'futurePlans',
      'ncd_loan_repayments': 'loanRepayments',
      'ncd_loans': 'loans',
      'ncd_job_positions': 'jobPositions',
      'ncd_machine_config': 'machineConfig',
      'ncd_mkt_mapping': 'marketingMapping',
      'ncd_mkt_payments': 'marketingPayments',
      'ncd_mkt_targets_v2': 'marketingTargets',
      'ncd_mkt_visits': 'marketingVisits',
      'ncd_monthly_roster': 'monthlyRoster'
    };

    Object.entries(legacyKeysMap).forEach(([storageKey, stateKey]) => {
      if (!recoveredState[stateKey]) {
        const val = localStorage.getItem(storageKey);
        if (val) {
          try { recoveredState[stateKey] = JSON.parse(val); } catch(e) {}
        }
      }
    });

    return Object.keys(recoveredState).length > 0 ? recoveredState : null;
  }
};
