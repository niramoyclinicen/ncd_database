import { createClient } from '@supabase/supabase-js';

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

const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';
const MASTER_RECORD_ID = 1;

export const dbService = {
  saveToCloud: async (appState: any) => {
    try {
      if (!supabase) {
        throw new Error("Supabase is not connected.");
      }
      const { error } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: MASTER_RECORD_ID, 
          data: appState,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      return { success: false, error };
    }
  },
  loadFromCloud: async () => {
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
  },
  fetchAllCloudRows: async () => {
    try {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('ncd_state')
        .select('*');
      if (error) {
        console.error("fetchAllCloudRows error:", error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("fetchAllCloudRows exception:", e);
      return [];
    }
  },
    smartMergeByDate: async (localData: any, targetDate: string, onProgress?: (p: number) => void) => {
    try {
      if (!supabase) return false;
      onProgress?.(5);

      // Fetch latest cloud state
      const { data: cloudRecord } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', 1)
        .single();
        
      let mergedData = (cloudRecord?.data && typeof cloudRecord.data === 'object' && !Array.isArray(cloudRecord.data)) 
        ? { ...cloudRecord.data } 
        : {};

      let totalAdded = 0;

      // Iterate and merge
      Object.keys(localData).forEach(key => {
        const localArray = localData[key];
        if (!Array.isArray(localArray)) return;

        if (!mergedData[key]) mergedData[key] = [];
        const cloudArray = mergedData[key];
        
        // Build a Set of existing IDs in cloud
        const existingIds = new Set();
        cloudArray.forEach((item: any) => {
            const id = item.id || item.pt_id || item.invoice_id || item.test_id || item.emp_id || item.reagent_id;
            if (id) existingIds.add(String(id));
        });

        // Filter local data by date and add if missing
        localArray.forEach((item: any) => {
            // Determine item's date
            let itemDate = item.date || item.invoice_date || item.createdAt || item.payment_date || item.expense_date || item.usageStartDate;
            if (itemDate && typeof itemDate === 'string') {
                itemDate = itemDate.split('T')[0];
            }

            // If a targetDate is provided, skip items that don't match
            if (targetDate && itemDate !== targetDate) return;

            const id = item.id || item.pt_id || item.invoice_id || item.test_id || item.emp_id || item.reagent_id;
            if (id && !existingIds.has(String(id))) {
                cloudArray.push(item);
                existingIds.add(String(id));
                totalAdded++;
            }
        });
      });

      if (totalAdded === 0) {
          return { success: true, message: "নতুন কোনো ডাটা পাওয়া যায়নি যা অনলাইনে নেই!" };
      }

      onProgress?.(50);

      // Save back to cloud
      const { error } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: 1, 
          data: mergedData, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) throw error;
      onProgress?.(100);
      return { success: true, message: `সফলভাবে ${totalAdded} টি নতুন রেকর্ড অনলাইনে যুক্ত করা হয়েছে!` };

    } catch (e: any) {
      console.error('Smart merge failed:', e);
      return { success: false, message: e.message };
    }
  },

  saveInChunks: async (appState: any, onProgress?: (p: number) => void) => {
    try {
      if (!supabase) return false;
      
      const keys = Object.keys(appState).filter(k => {
          const val = appState[k];
          return Array.isArray(val) ? val.length > 0 : (val && typeof val === 'object' && Object.keys(val).length > 0);
      });

      if (keys.length === 0) {
          onProgress?.(100);
          return true;
      }

      // 1. Start progress
      onProgress?.(1);
      
      // 2. Fetch latest state to merge (Prevention of overwriting others' data)
      const { data: cloudRecord } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', 1)
        .single();
      
      const mergedData = (cloudRecord?.data && typeof cloudRecord.data === 'object' && !Array.isArray(cloudRecord.data)) 
        ? { ...cloudRecord.data } 
        : {};

      // 3. Batch and Push
      const totalKeys = keys.length;
      
      for (let i = 0; i < totalKeys; i++) {
        const key = keys[i];
        mergedData[key] = appState[key];
        
        const currentProgress = Math.round(((i + 1) / totalKeys) * 100);
        
        // Save intermediate state to handle disconnection
        const { error } = await supabase
          .from('ncd_state')
          .upsert({ 
            id: 1, 
            data: mergedData, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });

        if (!error) {
          // localStorage removed from the loop; will save at the end or use saveToCloud logic
          onProgress?.(currentProgress);
        } else {
            console.error(`Step ${i} failed:`, error);
        }
      }

      onProgress?.(100);
      return true;
    } catch (e) {
      console.error("Advanced Sync Error:", e);
      return false;
    }
  },

  getLocalBackup: () => {
    try {
      const data = localStorage.getItem('ncd_offline_cache_v1');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Local backup parse error:", e);
    }
    return null;
  },
  isSupabaseConnected: () => {
    return !!supabase;
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
      try { recoveredState = JSON.parse(mainCache); } catch(e) { /* ignore */ }
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
          try { recoveredState[stateKey] = JSON.parse(val); } catch(e) { /* ignore */ }
        }
      }
    });

    return Object.keys(recoveredState).length > 0 ? recoveredState : null;
  },

  // NEW: Normalize data from various sources (Raw LocalStorage, Sub-keys, or Full State)
  normalizeRecoveredData: (raw: any) => {
    const normalized: any = {};

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

  // NEW: Concurrency Locking Mechanism (To prevent multiple users from editing same module)
  acquireLock: async (moduleName: string, userId: string) => {
    if (!supabase) return { success: true }; // Offline bypass
    
    try {
      // 1. Get current cloud state
      const { data: record } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', MASTER_RECORD_ID)
        .single();
      
      const currentData = record?.data || {};
      const locks = currentData._locks || {};
      const now = Date.now();
      
      // If lock exists and hasn't expired (5 min timeout)
      if (locks[moduleName] && locks[moduleName].userId !== userId && (now - locks[moduleName].timestamp < 300000)) {
        return { success: false, owner: locks[moduleName].userId };
      }
      
      // Set/Refresh lock
      locks[moduleName] = { userId, timestamp: now };
      currentData._locks = locks;
      
      await supabase.from('ncd_state').upsert({ id: MASTER_RECORD_ID, data: currentData }, { onConflict: 'id' });
      return { success: true };
    } catch {
      return { success: true }; // Fallback to allow work if cloud fails
    }
  },

  releaseLock: async (moduleName: string, userId: string) => {
    if (!supabase) return;
    try {
      const { data: record } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', MASTER_RECORD_ID)
        .single();
      
      const currentData = record?.data || {};
      const locks = currentData._locks || {};
      
      if (locks[moduleName] && locks[moduleName].userId === userId) {
        delete locks[moduleName];
        currentData._locks = locks;
        await supabase.from('ncd_state').upsert({ id: MASTER_RECORD_ID, data: currentData }, { onConflict: 'id' });
      }
    } catch (e) {
      console.error("Release lock fail:", e);
    }
  },

  // Enable Real-time listener for multi-user sync
  subscribeToChanges: (callback: (data: any) => void) => {
    if (!supabase) return null;

    return supabase
      .channel('public:ncd_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ncd_state', filter: `id=eq.${MASTER_RECORD_ID}` }, (payload) => {
        if (payload.new && payload.new.data) {
          callback(payload.new.data);
        }
      })
      .subscribe();
  }
};
