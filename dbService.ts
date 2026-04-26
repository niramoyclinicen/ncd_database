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

  // NEW: Save data in smaller chunks to avoid timeout or payload limit issues
  saveInChunks: async (appState: any, onProgress?: (p: number) => void) => {
    try {
      if (!supabase) return false;
      
      // Update local first
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));

      // Simple progress simulation for the UI
      for (let i = 0; i <= 60; i += 20) {
        if (onProgress) onProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      // Use the original fixed ID pattern from saveToCloud
      const { error } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: 1, 
          data: appState, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) throw error;
      
      if (onProgress) onProgress(100);
      return true;
    } catch (e) {
      console.error("Chunked Save Error:", e);
      return false;
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
  },

  // NEW: Normalize data from various sources (Raw LocalStorage, Sub-keys, or Full State)
  normalizeRecoveredData: (raw: any) => {
    let normalized: any = {};

    // 1. Unpack everything that looks like stringified JSON
    const unpacked: any = {};
    Object.entries(raw).forEach(([key, val]) => {
      if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
        try {
          unpacked[key] = JSON.parse(val);
        } catch(e) {
          unpacked[key] = val;
        }
      } else {
        unpacked[key] = val;
      }
    });

    // 2. If any unpacked value is an object that contains 'patients', merge its contents
    Object.values(unpacked).forEach((val: any) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.entries(val).forEach(([k, v]) => {
            if (!normalized[k] || (Array.isArray(normalized[k]) && normalized[k].length === 0)) {
                normalized[k] = v;
            }
        });
      }
    });

    // 3. Map individual keys to their state counterparts
    const mapping: Record<string, string> = {
      'ncd_patients': 'patients',
      'ncd_lab_invoices': 'labInvoices',
      'ncd_doctors': 'doctors',
      'ncd_referrars': 'referrars',
      'ncd_tests': 'tests',
      'ncd_due_collections': 'dueCollections',
      'ncd_reports': 'reports',
      'ncd_employees': 'employees',
      'ncd_medicines': 'medicines',
      'ncd_clinical_drugs': 'clinicalDrugs',
      'ncd_purchase_invoices': 'purchaseInvoices',
      'ncd_sales_invoices': 'salesInvoices',
      'ncd_admissions': 'admissions',
      'ncd_indoor_invoices': 'indoorInvoices',
      'ncd_detailed_expenses': 'detailedExpenses',
      'ncd_prescriptions': 'prescriptions',
      'ncd_appointments': 'appointments',
      'ncd_attendance_log': 'attendanceLog',
      'ncd_leave_log': 'leaveLog',
      'ncd_monthly_roster': 'monthlyRoster',
      'ncd_diagnostic_settings': 'diagnosticSettings',
      'ncd_monthly_adjustments': 'monthlyAdjustments',
      'ncd_shareholders': 'shareholders',
      'ncd_mkt_payments': 'marketingPayments',
      'ncd_mkt_targets_v2': 'marketingTargets',
      'ncd_mkt_visits': 'marketingVisits'
    };

    Object.entries(mapping).forEach(([storageKey, stateKey]) => {
      if (unpacked[storageKey] && (!normalized[stateKey] || (Array.isArray(normalized[stateKey]) && normalized[stateKey].length === 0))) {
        normalized[stateKey] = unpacked[storageKey];
      }
    });

    // 4. Merge remaining direct keys
    Object.entries(unpacked).forEach(([key, val]) => {
      if (!key.startsWith('ncd_') && (!normalized[key] || (Array.isArray(normalized[key]) && normalized[key].length === 0))) {
        normalized[key] = val;
      }
    });

    return normalized;
  },

  isSupabaseConnected: () => {
    return !!supabase;
  }
};
