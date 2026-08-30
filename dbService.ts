import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get URL and Key from env or localStorage
const getStoredConfig = () => {
  let url = '';
  let key = '';

  try {
    if (typeof localStorage !== 'undefined') {
      url = localStorage.getItem('ncd_supabase_url') || '';
      key = localStorage.getItem('ncd_supabase_anon_key') || '';
    }
  } catch (e) {}

  if (!url) {
    try {
      // @ts-expect-error import.meta is available in Vite environment
      url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    } catch (e) {}
  }
  if (!url) {
    try {
      url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    } catch (e) {}
  }

  if (!key) {
    try {
      // @ts-expect-error import.meta is available in Vite environment
      key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
    } catch (e) {}
  }
  if (!key) {
    try {
      key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    } catch (e) {}
  }

  return { url: url.trim(), key: key.trim() };
};

const isValidSupabaseConfig = (url: string, key: string) => {
  try {
    return !!(url && key && (url.startsWith('http://') || url.startsWith('https://')));
  } catch {
    return false;
  }
};

let currentConfig = getStoredConfig();
let supabase: SupabaseClient | null = isValidSupabaseConfig(currentConfig.url, currentConfig.key)
  ? createClient(currentConfig.url, currentConfig.key)
  : null;

export const initSupabaseClient = (url: string, key: string) => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (isValidSupabaseConfig(cleanUrl, cleanKey)) {
    try {
      supabase = createClient(cleanUrl, cleanKey);
      try {
        localStorage.setItem('ncd_supabase_url', cleanUrl);
        localStorage.setItem('ncd_supabase_anon_key', cleanKey);
      } catch (e) {}
      currentConfig = { url: cleanUrl, key: cleanKey };
      return true;
    } catch (e) {
      console.error("Supabase client init error:", e);
      return false;
    }
  }
  return false;
};

const MASTER_RECORD_ID = 1;
const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';

// Helper to safely parse ISO dates without throwing RangeError
const safeIsoDate = (d: any): string | null => {
  if (!d) return null;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  } catch {
    return null;
  }
};

// Default cutoff date for separate individual tables (e.g. detailed_expenses)
export const DEFAULT_SEPARATE_TABLES_CUTOFF_DATE = '2026-08-01';

export const getTableSplitCutoffDate = (): string => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ncd_table_split_cutoff_date') || DEFAULT_SEPARATE_TABLES_CUTOFF_DATE;
    }
  } catch (e) {}
  return DEFAULT_SEPARATE_TABLES_CUTOFF_DATE;
};

export const setTableSplitCutoffDate = (dateStr: string) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ncd_table_split_cutoff_date', dateStr);
    }
  } catch (e) {}
};

// Safe helper to fetch all rows from a table
const fetchTableSafe = async (client: SupabaseClient, tableName: string) => {
  try {
    const { data, error } = await client.from(tableName).select('*').limit(5000);
    if (error) {
      console.warn(`Notice reading table ${tableName}:`, error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn(`Error reading table ${tableName}:`, err);
    return null;
  }
};

// Safe helper to upsert rows to a table in batches
const upsertTableSafe = async (client: SupabaseClient, tableName: string, rows: any[]) => {
  if (!rows || rows.length === 0) return true;
  try {
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await client.from(tableName).upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn(`Upsert notice for table ${tableName}:`, error.message);
      }
    }
    return true;
  } catch (err) {
    console.warn(`Upsert error for table ${tableName}:`, err);
    return false;
  }
};

export const dbService = {
  getSupabaseConfig: () => {
    return {
      url: currentConfig.url,
      key: currentConfig.key,
      isConnected: !!supabase && isValidSupabaseConfig(currentConfig.url, currentConfig.key)
    };
  },

  setSupabaseConfig: (url: string, key: string) => {
    return initSupabaseClient(url, key);
  },

  testConnection: async (): Promise<{ success: boolean; message: string; tablesFound?: Record<string, number> }> => {
    if (!supabase) {
      return { 
        success: false, 
        message: "Supabase URL বা Anon Key সেট করা নেই। দয়া করে সেটিংস থেকে Supabase ক্রেডেনশিয়াল দিন।" 
      };
    }
    try {
      const counts: Record<string, number> = {};
      
      // Test ncd_state
      const { data: ncdState, error: ncdErr } = await supabase.from('ncd_state').select('id').limit(10);
      if (!ncdErr && ncdState) {
        counts['ncd_state'] = ncdState.length;
      }

      // Test individual tables
      const tableNames = [
        'patients', 'doctors', 'referrars', 'tests', 'employees', 'medicines', 'reagents',
        'lab_invoices', 'indoor_invoices', 'sales_invoices', 'purchase_invoices', 'detailed_expenses',
        'reports', 'prescriptions', 'appointments', 'due_collections', 'admissions'
      ];

      for (const t of tableNames) {
        try {
          const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
          if (!error && count !== null) {
            counts[t] = count;
          }
        } catch {}
      }

      return {
        success: true,
        message: "Supabase ক্লাউড ডাটাবেজে সফলভাবে কানেক্ট হয়েছে!",
        tablesFound: counts
      };
    } catch (e: any) {
      return {
        success: false,
        message: "কানেকশন ব্যর্থ: " + (e?.message || "Unknown error")
      };
    }
  },

  loadFromCloud: async () => {
    try {
      let localState: any = null;
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) localState = JSON.parse(cached);
      } catch (e) {
        console.warn("Could not read local cache:", e);
      }

      if (!supabase) {
        return localState || { _error: "Supabase not initialized. Check Supabase URL & Key." };
      }
      
      const cutoffDate = getTableSplitCutoffDate(); // '2026-08-01'

      // 1. Primary Source: Fetch master state from single table ncd_state (houses full pre-August data)
      let state: any = null;
      try {
        const { data: records, error } = await supabase
          .from('ncd_state')
          .select('id, data, updated_at')
          .order('updated_at', { ascending: false });
          
        if (!error && records && records.length > 0) {
          const masterRecord = records.find(r => r.id === MASTER_RECORD_ID) || records[0];
          if (masterRecord && masterRecord.data && typeof masterRecord.data === 'object') {
            state = { ...masterRecord.data };
          }
        }
      } catch (err) {
        console.warn("Notice fetching ncd_state:", err);
      }

      if (!state || typeof state !== 'object') {
        state = localState ? { ...localState } : {};
      }

      // 2. Fetch modern records from modular tables concurrently (August 1st onwards)
      try {
        const [
          expRows,
          patientRows,
          doctorRows,
          referrerRows,
          testRows,
          reagentRows,
          empRows,
          medRows,
          labInvRows,
          indoorInvRows,
          salesInvRows,
          purchaseInvRows,
          dueColRows,
          repRows,
          prescRows,
          apptRows,
          admRows
        ] = await Promise.all([
          fetchTableSafe(supabase, 'detailed_expenses'),
          fetchTableSafe(supabase, 'patients'),
          fetchTableSafe(supabase, 'doctors'),
          fetchTableSafe(supabase, 'referrars'),
          fetchTableSafe(supabase, 'tests'),
          fetchTableSafe(supabase, 'reagents'),
          fetchTableSafe(supabase, 'employees'),
          fetchTableSafe(supabase, 'medicines'),
          fetchTableSafe(supabase, 'lab_invoices'),
          fetchTableSafe(supabase, 'indoor_invoices'),
          fetchTableSafe(supabase, 'sales_invoices'),
          fetchTableSafe(supabase, 'purchase_invoices'),
          fetchTableSafe(supabase, 'due_collections'),
          fetchTableSafe(supabase, 'reports'),
          fetchTableSafe(supabase, 'prescriptions'),
          fetchTableSafe(supabase, 'appointments'),
          fetchTableSafe(supabase, 'admissions')
        ]);

        // Detailed Expenses Dual-Partition:
        // Dates < cutoffDate (July and earlier): strictly preserved from ncd_state
        // Dates >= cutoffDate (August 1st onwards): loaded from detailed_expenses modular table
        const rawExpenses = state.detailedExpenses || {};
        const mergedExpenses: Record<string, any[]> = {};

        // 2a. Pre-cutoff legacy expenses from ncd_state
        Object.entries(rawExpenses).forEach(([d, items]: any) => {
          if (d < cutoffDate && Array.isArray(items)) {
            mergedExpenses[d] = items;
          }
        });

        // 2b. Modern expenses from detailed_expenses table
        if (expRows && expRows.length > 0) {
          const modernGrouped: Record<string, any[]> = {};
          expRows.forEach((row: any) => {
            const rowDate = (row.date || '').split('T')[0];
            if (!rowDate) return;
            if (rowDate >= cutoffDate) {
              if (!modernGrouped[rowDate]) modernGrouped[rowDate] = [];
              modernGrouped[rowDate].push({
                id: row.id,
                date: rowDate,
                category: row.category || 'General',
                subCategory: row.sub_category || row.subCategory || '',
                description: row.description || '',
                billAmount: Number(row.bill_amount || row.billAmount || 0),
                paidAmount: Number(row.paid_amount || row.paidAmount || 0),
                dept: row.dept || 'Diagnostic'
              });
            }
          });

          Object.entries(modernGrouped).forEach(([d, items]) => {
            mergedExpenses[d] = items;
          });
        } else {
          // If modular table is empty for modern dates, keep what was in ncd_state
          Object.entries(rawExpenses).forEach(([d, items]: any) => {
            if (d >= cutoffDate && Array.isArray(items)) {
              if (!mergedExpenses[d]) mergedExpenses[d] = items;
            }
          });
        }

        state.detailedExpenses = mergedExpenses;

        // Merge entity collections from modular tables with priority
        const mergeEntityList = (masterList: any[], separateRows: any[] | null, idField: string) => {
          if (!separateRows || separateRows.length === 0) return masterList || [];
          const base = Array.isArray(masterList) ? [...masterList] : [];
          const map = new Map<string, any>();
          base.forEach(item => {
            const idVal = String(item[idField] || item.id || '').trim();
            if (idVal) map.set(idVal, item);
          });
          separateRows.forEach(item => {
            const idVal = String(item[idField] || item.id || '').trim();
            if (idVal) {
              map.set(idVal, { ...map.get(idVal), ...item });
            } else {
              base.push(item);
            }
          });
          return Array.from(map.values());
        };

        if (patientRows && patientRows.length > 0) state.patients = mergeEntityList(state.patients, patientRows, 'patient_id');
        if (doctorRows && doctorRows.length > 0) state.doctors = mergeEntityList(state.doctors, doctorRows, 'doctor_id');
        if (referrerRows && referrerRows.length > 0) state.referrars = mergeEntityList(state.referrars, referrerRows, 'ref_id');
        if (testRows && testRows.length > 0) state.tests = mergeEntityList(state.tests, testRows, 'test_id');
        if (reagentRows && reagentRows.length > 0) state.reagents = mergeEntityList(state.reagents, reagentRows, 'id');
        if (empRows && empRows.length > 0) state.employees = mergeEntityList(state.employees, empRows, 'emp_id');
        if (medRows && medRows.length > 0) state.medicines = mergeEntityList(state.medicines, medRows, 'id');
        if (labInvRows && labInvRows.length > 0) state.labInvoices = mergeEntityList(state.labInvoices, labInvRows, 'invoice_no');
        if (indoorInvRows && indoorInvRows.length > 0) state.indoorInvoices = mergeEntityList(state.indoorInvoices, indoorInvRows, 'invoice_no');
        if (salesInvRows && salesInvRows.length > 0) state.salesInvoices = mergeEntityList(state.salesInvoices, salesInvRows, 'invoice_no');
        if (purchaseInvRows && purchaseInvRows.length > 0) state.purchaseInvoices = mergeEntityList(state.purchaseInvoices, purchaseInvRows, 'invoice_no');
        if (dueColRows && dueColRows.length > 0) state.dueCollections = mergeEntityList(state.dueCollections, dueColRows, 'id');
        if (repRows && repRows.length > 0) state.reports = mergeEntityList(state.reports, repRows, 'report_id');
        if (prescRows && prescRows.length > 0) state.prescriptions = mergeEntityList(state.prescriptions, prescRows, 'id');
        if (apptRows && apptRows.length > 0) state.appointments = mergeEntityList(state.appointments, apptRows, 'id');
        if (admRows && admRows.length > 0) state.admissions = mergeEntityList(state.admissions, admRows, 'id');

      } catch (modularErr) {
        console.warn("Modular table load notice:", modularErr);
      }

      // 3. Strict Deduplication & Guaranteed Unique ID normalization for detailedExpenses
      const rawExpenses = state.detailedExpenses || {};
      const cleanExpenses: Record<string, any[]> = {};

      if (typeof rawExpenses === 'object' && !Array.isArray(rawExpenses)) {
        Object.entries(rawExpenses).forEach(([dateKey, items]) => {
          if (Array.isArray(items)) {
            const seen = new Set<string>();
            const deduped: any[] = [];

            items.forEach((item: any, idx: number) => {
              if (!item || item.isDeleted) return;
              
              const cat = String(item.category || 'General').trim();
              const sub = String(item.subCategory || item.sub_category || '').trim();
              const desc = String(item.description || '').trim();
              const paidAmt = Number(item.paidAmount || item.billAmount || item.paid_amount || 0);
              const billAmt = Number(item.billAmount || item.paidAmount || item.bill_amount || 0);
              const dept = item.dept || 'Diagnostic';

              // Unique signature for detecting duplicates on the exact same date
              const sig = `${cat.toLowerCase()}|${sub.toLowerCase()}|${desc.toLowerCase()}|${paidAmt}|${billAmt}|${dept.toLowerCase()}`;

              if (!seen.has(sig)) {
                seen.add(sig);
                const validId = item.id !== undefined && item.id !== null && String(item.id).trim() !== '' && String(item.id) !== 'undefined'
                  ? String(item.id)
                  : `exp_${dateKey.replace(/-/g, '')}_${idx}_${Date.now()}`;

                deduped.push({
                  ...item,
                  id: validId,
                  category: cat,
                  subCategory: sub,
                  description: desc,
                  paidAmount: paidAmt,
                  billAmount: billAmt,
                  dept
                });
              }
            });

            cleanExpenses[dateKey] = deduped;
          } else {
            cleanExpenses[dateKey] = [];
          }
        });
      }

      state.detailedExpenses = cleanExpenses;

      // Ensure all other collections are safe arrays
      if (!Array.isArray(state.patients)) state.patients = [];
      if (!Array.isArray(state.doctors)) state.doctors = [];
      if (!Array.isArray(state.referrars)) state.referrars = [];
      if (!Array.isArray(state.tests)) state.tests = [];
      if (!Array.isArray(state.reagents)) state.reagents = [];
      if (!Array.isArray(state.labInvoices)) state.labInvoices = [];
      if (!Array.isArray(state.indoorInvoices)) state.indoorInvoices = [];
      if (!Array.isArray(state.salesInvoices)) state.salesInvoices = [];
      if (!Array.isArray(state.purchaseInvoices)) state.purchaseInvoices = [];
      if (!Array.isArray(state.employees)) state.employees = [];
      if (!Array.isArray(state.medicines)) state.medicines = [];
      if (!Array.isArray(state.dueCollections)) state.dueCollections = [];
      if (!Array.isArray(state.reports)) state.reports = [];
      if (!Array.isArray(state.admissions)) state.admissions = [];
      if (!Array.isArray(state.appointments)) state.appointments = [];

      // Save fresh state to local cache
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}

      return state;
    } catch (error) {
      console.error("Cloud load error:", error);
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return { _error: "Failed to load state from cloud." };
    }
  },

  saveToCloud: async (appState: any) => {
    try {
      // 1. Always update local storage cache immediately (0ms latency local safety)
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
      } catch (e) {
        console.warn("Local cache save error:", e);
      }

      if (!supabase) {
        console.warn("Supabase not connected. Saved to local storage.");
        return { success: true, mocked: true };
      }
      
      const cutoffDate = getTableSplitCutoffDate(); // '2026-08-01'
      const now = new Date().toISOString();

      // 2. Concurrently save to:
      // a) Master ncd_state single table (keeps complete historical archive and backup)
      // b) Modular tables (detailed_expenses for dates >= 2026-08-01, plus entity tables)
      const savePromises: Promise<any>[] = [];

      // Task A: Master State
      savePromises.push(
        supabase
          .from('ncd_state')
          .upsert({ 
            id: MASTER_RECORD_ID, 
            data: appState,
            updated_at: now 
          }, { onConflict: 'id' })
      );

      // Task B: Modular detailed_expenses for dates >= cutoffDate (August 1st onwards)
      const expenseRows: any[] = [];
      Object.entries(appState.detailedExpenses || {}).forEach(([dateKey, items]) => {
        if (dateKey >= cutoffDate && Array.isArray(items)) {
          items.forEach((it: any, idx: number) => {
            if (!it || it.isDeleted) return;
            const rowId = String(it.id || `exp_${dateKey.replace(/-/g, '')}_${idx}_${Date.now()}`);
            expenseRows.push({
              id: rowId,
              date: dateKey,
              category: it.category || 'General',
              sub_category: it.subCategory || it.sub_category || '',
              description: it.description || '',
              bill_amount: Number(it.billAmount || it.paidAmount || 0),
              paid_amount: Number(it.paidAmount || it.billAmount || 0),
              dept: it.dept || 'Diagnostic',
              updated_at: now
            });
          });
        }
      });

      if (expenseRows.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'detailed_expenses', expenseRows));
      }

      // Task C: Modular entities (upserting concurrently with safe error handling)
      if (Array.isArray(appState.patients) && appState.patients.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'patients', appState.patients));
      }
      if (Array.isArray(appState.doctors) && appState.doctors.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'doctors', appState.doctors));
      }
      if (Array.isArray(appState.referrars) && appState.referrars.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'referrars', appState.referrars));
      }
      if (Array.isArray(appState.tests) && appState.tests.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'tests', appState.tests));
      }
      if (Array.isArray(appState.reagents) && appState.reagents.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'reagents', appState.reagents));
      }
      if (Array.isArray(appState.employees) && appState.employees.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'employees', appState.employees));
      }
      if (Array.isArray(appState.medicines) && appState.medicines.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'medicines', appState.medicines));
      }
      if (Array.isArray(appState.labInvoices) && appState.labInvoices.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'lab_invoices', appState.labInvoices));
      }
      if (Array.isArray(appState.indoorInvoices) && appState.indoorInvoices.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'indoor_invoices', appState.indoorInvoices));
      }
      if (Array.isArray(appState.salesInvoices) && appState.salesInvoices.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'sales_invoices', appState.salesInvoices));
      }
      if (Array.isArray(appState.purchaseInvoices) && appState.purchaseInvoices.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'purchase_invoices', appState.purchaseInvoices));
      }
      if (Array.isArray(appState.dueCollections) && appState.dueCollections.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'due_collections', appState.dueCollections));
      }
      if (Array.isArray(appState.reports) && appState.reports.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'reports', appState.reports));
      }
      if (Array.isArray(appState.prescriptions) && appState.prescriptions.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'prescriptions', appState.prescriptions));
      }
      if (Array.isArray(appState.appointments) && appState.appointments.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'appointments', appState.appointments));
      }
      if (Array.isArray(appState.admissions) && appState.admissions.length > 0) {
        savePromises.push(upsertTableSafe(supabase, 'admissions', appState.admissions));
      }

      const results = await Promise.allSettled(savePromises);
      
      const masterResult = results[0];
      if (masterResult.status === 'rejected' || (masterResult.value && masterResult.value.error)) {
        const err = masterResult.status === 'rejected' ? masterResult.reason : masterResult.value.error;
        console.error("Master state save error:", err);
        return { success: false, error: err.message || "Cloud save failed." };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Cloud save critical error:", error);
      return { success: false, error: error?.message || "Cloud save failed." };
    }
  },

  fetchAllCloudRows: async () => {
    try {
      if (!supabase) return [];
      const { data, error } = await supabase.from('ncd_state').select('*');
      if (error) { console.error("fetchAllCloudRows error:", error); return []; }
      return data || [];
    } catch { return []; }
  },

  smartMergeByDate: async (incomingData: any, targetDate: string, onProgress?: (p: number) => void) => {
    try {
      onProgress?.(20);
      const current = await dbService.loadFromCloud();
      onProgress?.(50);
      
      const merged = { ...current };
      
      Object.keys(incomingData).forEach(key => {
        const incomingList = incomingData[key];
        if (Array.isArray(incomingList)) {
          const currentList = Array.isArray(merged[key]) ? [...merged[key]] : [];
          
          incomingList.forEach(item => {
            if (!item) return;
            // If targetDate provided, filter by item date
            if (targetDate) {
              const d = (item.date || item.invoice_date || item.createdAt || item.payment_date || item.report_date || '').split('T')[0];
              if (d !== targetDate) return;
            }

            const itemId = item.id || item.invoice_id || item.invoice_no || item.pt_id || item.patient_id || item.emp_id || item.doctor_id || item.ref_id || item.test_id;
            const existingIdx = itemId 
              ? currentList.findIndex(x => (x.id || x.invoice_id || x.invoice_no || x.pt_id || x.patient_id || x.emp_id || x.doctor_id || x.ref_id || x.test_id) === itemId)
              : -1;
              
            if (existingIdx >= 0) {
              currentList[existingIdx] = { ...currentList[existingIdx], ...item };
            } else {
              currentList.push(item);
            }
          });
          
          merged[key] = currentList;
        } else if (key === 'detailedExpenses' && typeof incomingList === 'object') {
          merged.detailedExpenses = { ...(merged.detailedExpenses || {}), ...incomingList };
        }
      });

      onProgress?.(80);
      const saveRes = await dbService.saveToCloud(merged);
      onProgress?.(100);
      
      return { success: saveRes.success, message: "মার্চ সফল হয়েছে!" };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  saveInChunks: async (backupData: any, onProgress?: (progress: number) => void) => {
    try {
      onProgress?.(30);
      const res = await dbService.saveToCloud(backupData);
      onProgress?.(100);
      return res.success;
    } catch {
      return false;
    }
  },

  advancedSync: async (localState: any, onProgress?: (progress: number) => void) => {
    try {
      onProgress?.(10);
      const res = await dbService.saveToCloud(localState);
      onProgress?.(100);
      return res.success;
    } catch { return false; }
  },

  getLocalBackup: () => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  isSupabaseConnected: () => !!supabase && isValidSupabaseConfig(currentConfig.url, currentConfig.key),
  
  deepScanRecovery: () => {
    try {
      const backup = dbService.getLocalBackup();
      return backup || null;
    } catch {
      return null;
    }
  },
  
  normalizeRecoveredData: (raw: any) => raw,
  
  getTableSplitCutoffDate,
  setTableSplitCutoffDate,

  cleanDuplicateExpenses: async (onProgress?: (progress: number) => void) => {
    try {
      onProgress?.(15);

      let state: any = null;
      try {
        state = await dbService.loadFromCloud();
      } catch (err) {
        console.warn("Cloud load error during deduplication:", err);
      }

      if (!state || state._error) {
        try {
          const localStr = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('ncd_state');
          if (localStr) {
            state = JSON.parse(localStr);
          }
        } catch (e) {
          console.warn("Local storage state load error:", e);
        }
      }

      if (!state || typeof state !== 'object') {
        state = {};
      }

      onProgress?.(40);
      let totalCleaned = 0;
      
      const rawDetailed = state.detailedExpenses || {};
      const cleanedDetailed: Record<string, any[]> = {};

      Object.entries(rawDetailed).forEach(([dateKey, items]: any) => {
        if (!Array.isArray(items)) {
          cleanedDetailed[dateKey] = [];
          return;
        }

        const uniqueItems: any[] = [];
        const seenSignatures = new Set<string>();
        const seenIds = new Set<string>();

        items.forEach((it: any, idx: number) => {
          if (!it || it.isDeleted) {
            totalCleaned++;
            return;
          }
          const itId = it.id !== undefined && it.id !== null ? String(it.id).trim() : '';
          const cat = (it.category || '').trim().toLowerCase();
          const sub = (it.subCategory || '').trim().toLowerCase();
          const desc = (it.description || '').trim().toLowerCase();
          const paid = Number(it.paidAmount || it.billAmount || 0);
          const bill = Number(it.billAmount || it.paidAmount || 0);
          const dept = (it.dept || 'Diagnostic').trim().toLowerCase();

          // Signature to catch identical duplicates
          let signature = `${cat}__${sub}__${desc}__${paid}__${bill}__${dept}`;
          if (cat === 'stuff salary' || cat === 'staff salary') {
            const empTag = desc || sub || '';
            signature = `salary__${empTag}__${paid}`;
          }

          const hasIdConflict = itId && seenIds.has(itId);
          const hasSignatureConflict = seenSignatures.has(signature);

          if (hasIdConflict || hasSignatureConflict) {
            totalCleaned++;
          } else {
            if (itId) seenIds.add(itId);
            seenSignatures.add(signature);
            const validId = itId || `exp_${dateKey.replace(/-/g, '')}_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            uniqueItems.push({
              ...it,
              id: validId,
              dept: it.dept || 'Diagnostic'
            });
          }
        });

        cleanedDetailed[dateKey] = uniqueItems;
      });

      state.detailedExpenses = cleanedDetailed;
      state.last_updated_at = new Date().toISOString();

      onProgress?.(80);
      const saveRes = await dbService.saveToCloud(state);

      onProgress?.(100);
      return { success: saveRes.success, cleanedCount: totalCleaned, newExpenses: cleanedDetailed };
    } catch (e: any) {
      return { success: false, message: e.message || "ত্রুটি ঘটেছে।" };
    }
  },
  
  deleteExpense: async (date: string, id: number | string) => {
    try {
      const targetIdStr = String(id).trim();
      const cutoffDate = getTableSplitCutoffDate();

      // 1. If date is >= cutoffDate and Supabase is connected, delete from detailed_expenses modular table
      if (supabase && (!date || date >= cutoffDate)) {
        try {
          await supabase.from('detailed_expenses').delete().eq('id', targetIdStr);
        } catch (cloudDelErr) {
          console.warn("Supabase detailed_expenses delete notice:", cloudDelErr);
        }
      }

      // 2. Update local state and ncd_state
      try {
        const localStateStr = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('ncd_state');
        if (localStateStr) {
          const localState = JSON.parse(localStateStr);
          if (localState.detailedExpenses && typeof localState.detailedExpenses === 'object') {
            Object.keys(localState.detailedExpenses).forEach(d => {
              if (Array.isArray(localState.detailedExpenses[d])) {
                localState.detailedExpenses[d] = localState.detailedExpenses[d].filter((it: any) => String(it.id).trim() !== targetIdStr);
              }
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localState));
          }
        }
      } catch (lsErr) {
        console.warn("Local storage delete warning:", lsErr);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
  
  acquireLock: async (moduleName: string, userId: string) => { return { success: true }; },
  releaseLock: async (moduleName: string, userId: string) => { },
  
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
