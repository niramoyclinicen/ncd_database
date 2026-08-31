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
      // Scan all possible local storage keys for offline recovery
      try {
        const primaryCache = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('ncd_offline_cache_v1');
        if (primaryCache) localState = JSON.parse(primaryCache);
      } catch (e) {
        console.warn("Could not read local cache:", e);
      }

      if (!supabase) {
        return localState || { _error: "Supabase not initialized. Check Supabase URL & Key." };
      }
      
      const cutoffDate = getTableSplitCutoffDate(); // '2026-08-01'

      // Helper for robust ID extraction
      const getItemId = (it: any, idFields: string[]): string => {
        if (!it || typeof it !== 'object') return '';
        for (const f of idFields) {
          const val = it[f];
          if (val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== 'undefined' && String(val) !== 'null') {
            return String(val).trim();
          }
        }
        return '';
      };

      // Helper to merge two lists without losing records or fields
      const mergeEntityList = (baseList: any[], extraList: any[], idFields: string[]) => {
        const result: any[] = Array.isArray(baseList) ? [...baseList] : [];
        if (!Array.isArray(extraList) || extraList.length === 0) return result;

        const map = new Map<string, number>();
        result.forEach((item, index) => {
          const id = getItemId(item, idFields);
          if (id) map.set(id, index);
        });

        extraList.forEach(item => {
          if (!item) return;
          const id = getItemId(item, idFields);
          if (id && map.has(id)) {
            const existingIdx = map.get(id)!;
            result[existingIdx] = { ...item, ...result[existingIdx] }; // base has priority, fill missing from extra
          } else {
            result.push(item);
            if (id) map.set(id, result.length - 1);
          }
        });

        return result;
      };

      // 1. Primary Source: Fetch master state records from single table ncd_state
      let state: any = {};
      const extractDataObj = (raw: any) => {
        if (!raw) return null;
        if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return null;
      };

      try {
        const { data: records, error } = await supabase
          .from('ncd_state')
          .select('id, data, updated_at')
          .order('updated_at', { ascending: false });
          
        if (!error && records && records.length > 0) {
          // Find master record or the richest snapshot
          const masterRecord = records.find(r => r.id === MASTER_RECORD_ID) || records[0];
          const masterData = masterRecord ? extractDataObj(masterRecord.data) : null;
          if (masterData) {
            state = { ...masterData };
          }
          
          // Also check other records in ncd_state to rescue any historical data
          records.forEach(rec => {
            if (rec && rec.data) {
              const d = extractDataObj(rec.data);
              if (d) {
                const recInvs = d.labInvoices || d.invoices || d.lab_invoices || d.diagnostic_invoices;
                if (Array.isArray(recInvs) && recInvs.length > 0) {
                  state.labInvoices = mergeEntityList(state.labInvoices || [], recInvs, ['invoice_id', 'id', 'invoice_no', 'invoiceId']);
                }
                const recDues = d.dueCollections || d.due_collections || d.dues || d.collections;
                if (Array.isArray(recDues) && recDues.length > 0) {
                  state.dueCollections = mergeEntityList(state.dueCollections || [], recDues, ['collection_id', 'id', 'collectionId']);
                }
                const recIndoor = d.indoorInvoices || d.indoor_invoices || d.clinicInvoices;
                if (Array.isArray(recIndoor) && recIndoor.length > 0) {
                  state.indoorInvoices = mergeEntityList(state.indoorInvoices || [], recIndoor, ['invoice_id', 'daily_id', 'id']);
                }
                if (Array.isArray(d.patients) && d.patients.length > 0) {
                  state.patients = mergeEntityList(state.patients || [], d.patients, ['pt_id', 'patient_id', 'id']);
                }
                if (Array.isArray(d.doctors) && d.doctors.length > 0) {
                  state.doctors = mergeEntityList(state.doctors || [], d.doctors, ['doctor_id', 'id']);
                }
                if (Array.isArray(d.referrars) && d.referrars.length > 0) {
                  state.referrars = mergeEntityList(state.referrars || [], d.referrars, ['ref_id', 'referrer_id', 'id']);
                }
                if (Array.isArray(d.tests) && d.tests.length > 0) {
                  state.tests = mergeEntityList(state.tests || [], d.tests, ['test_id', 'id']);
                }
                if (Array.isArray(d.reagents) && d.reagents.length > 0) {
                  state.reagents = mergeEntityList(state.reagents || [], d.reagents, ['reagent_id', 'id']);
                }
                if (Array.isArray(d.employees) && d.employees.length > 0) {
                  state.employees = mergeEntityList(state.employees || [], d.employees, ['emp_id', 'id']);
                }
                if (Array.isArray(d.medicines) && d.medicines.length > 0) {
                  state.medicines = mergeEntityList(state.medicines || [], d.medicines, ['id']);
                }
                if (d.detailedExpenses && typeof d.detailedExpenses === 'object') {
                  state.detailedExpenses = { ...(state.detailedExpenses || {}), ...d.detailedExpenses };
                }
              }
            }
          });
        }
      } catch (err) {
        console.warn("Notice fetching ncd_state:", err);
      }

      if (!state || typeof state !== 'object') {
        state = localState ? { ...localState } : {};
      }

      // Normalization of alternate keys in state
      if (!Array.isArray(state.labInvoices)) {
        state.labInvoices = Array.isArray(state.invoices) ? state.invoices : (Array.isArray(state.lab_invoices) ? state.lab_invoices : (Array.isArray(state.diagnostic_invoices) ? state.diagnostic_invoices : []));
      }
      if (!Array.isArray(state.dueCollections)) {
        state.dueCollections = Array.isArray(state.due_collections) ? state.due_collections : (Array.isArray(state.dues) ? state.dues : []);
      }
      if (!Array.isArray(state.indoorInvoices)) {
        state.indoorInvoices = Array.isArray(state.indoor_invoices) ? state.indoor_invoices : [];
      }

      // 2. Fetch modular tables concurrently from Supabase (lab_invoices, due_collections, detailed_expenses, etc.)
      try {
        const [
          expRows,
          labInvRows,
          altInvRows,
          dueColRows,
          altDueRows,
          indoorInvRows,
          patientRows,
          doctorRows,
          referrerRows,
          testRows,
          reagentRows,
          empRows,
          medRows,
          salesInvRows,
          purchaseInvRows,
          repRows,
          prescRows,
          apptRows,
          admRows
        ] = await Promise.all([
          fetchTableSafe(supabase, 'detailed_expenses'),
          fetchTableSafe(supabase, 'lab_invoices'),
          fetchTableSafe(supabase, 'invoices'),
          fetchTableSafe(supabase, 'due_collections'),
          fetchTableSafe(supabase, 'dues'),
          fetchTableSafe(supabase, 'indoor_invoices'),
          fetchTableSafe(supabase, 'patients'),
          fetchTableSafe(supabase, 'doctors'),
          fetchTableSafe(supabase, 'referrars'),
          fetchTableSafe(supabase, 'tests'),
          fetchTableSafe(supabase, 'reagents'),
          fetchTableSafe(supabase, 'employees'),
          fetchTableSafe(supabase, 'medicines'),
          fetchTableSafe(supabase, 'sales_invoices'),
          fetchTableSafe(supabase, 'purchase_invoices'),
          fetchTableSafe(supabase, 'reports'),
          fetchTableSafe(supabase, 'prescriptions'),
          fetchTableSafe(supabase, 'appointments'),
          fetchTableSafe(supabase, 'admissions')
        ]);

        // Merge Lab Invoices from modular table(s)
        const combinedLabRows = [...(labInvRows || []), ...(altInvRows || [])];
        if (combinedLabRows.length > 0) {
          const parsedLabInvs = combinedLabRows.map((r: any) => {
            let items = r.items;
            if (typeof items === 'string') {
              try { items = JSON.parse(items); } catch { items = []; }
            }
            return {
              ...r,
              invoice_id: String(r.invoice_id || r.id || r.invoice_no || r.invoiceId || '').trim(),
              invoice_date: r.invoice_date || r.date || r.created_at || '',
              patient_id: r.patient_id || r.pt_id || '',
              patient_name: r.patient_name || r.pt_name || '',
              doctor_id: r.doctor_id || '',
              doctor_name: r.doctor_name || '',
              referrar_id: r.referrar_id || r.ref_id || '',
              referrar_name: r.referrar_name || r.ref_name || '',
              items: Array.isArray(items) ? items : [],
              total_amount: Number(r.total_amount || r.totalAmount || r.total || 0),
              paid_amount: Number(r.paid_amount || r.paidAmount || r.paid || 0),
              due_amount: Number(r.due_amount || r.dueAmount || r.due || 0),
              discount_amount: Number(r.discount_amount || r.discountAmount || r.discount || 0),
              commission_paid: Number(r.commission_paid || r.commissionPaid || 0),
              special_commission: Number(r.special_commission || r.specialCommission || 0),
              status: r.status || (Number(r.due_amount || 0) > 0 ? 'Due' : 'Paid')
            };
          }).filter(r => r.invoice_id);
          state.labInvoices = mergeEntityList(state.labInvoices, parsedLabInvs, ['invoice_id', 'id', 'invoice_no', 'invoiceId']);
        }

        // Merge Due Collections from modular table(s)
        const combinedDueRows = [...(dueColRows || []), ...(altDueRows || [])];
        if (combinedDueRows.length > 0) {
          const parsedDues = combinedDueRows.map((r: any) => ({
            ...r,
            collection_id: String(r.collection_id || r.id || r.collectionId || '').trim(),
            invoice_id: String(r.invoice_id || r.invoice_no || r.invoiceId || '').trim(),
            amount_collected: Number(r.amount_collected || r.amount || r.paid_amount || 0),
            collection_date: r.collection_date || r.date || r.created_at || ''
          })).filter(r => r.collection_id || r.invoice_id);
          state.dueCollections = mergeEntityList(state.dueCollections, parsedDues, ['collection_id', 'id', 'collectionId']);
        }

        // Merge Indoor Invoices from modular table
        if (indoorInvRows && indoorInvRows.length > 0) {
          const parsedIndoor = indoorInvRows.map((r: any) => {
            let items = r.items;
            if (typeof items === 'string') {
              try { items = JSON.parse(items); } catch { items = []; }
            }
            return {
              ...r,
              invoice_id: String(r.invoice_id || r.daily_id || r.id || '').trim(),
              invoice_date: r.invoice_date || r.admission_date || r.date || '',
              items: Array.isArray(items) ? items : [],
              paid_amount: Number(r.paid_amount || r.paidAmount || 0)
            };
          });
          state.indoorInvoices = mergeEntityList(state.indoorInvoices, parsedIndoor, ['invoice_id', 'daily_id', 'id']);
        }

        // Merge other entity collections
        if (patientRows && patientRows.length > 0) state.patients = mergeEntityList(state.patients, patientRows, ['pt_id', 'patient_id', 'id']);
        if (doctorRows && doctorRows.length > 0) state.doctors = mergeEntityList(state.doctors, doctorRows, ['doctor_id', 'id']);
        if (referrerRows && referrerRows.length > 0) state.referrars = mergeEntityList(state.referrars, referrerRows, ['ref_id', 'referrer_id', 'id']);
        if (testRows && testRows.length > 0) state.tests = mergeEntityList(state.tests, testRows, ['test_id', 'id']);
        if (reagentRows && reagentRows.length > 0) state.reagents = mergeEntityList(state.reagents, reagentRows, ['reagent_id', 'id']);
        if (empRows && empRows.length > 0) state.employees = mergeEntityList(state.employees, empRows, ['emp_id', 'id']);
        if (medRows && medRows.length > 0) state.medicines = mergeEntityList(state.medicines, medRows, ['id']);
        if (salesInvRows && salesInvRows.length > 0) state.salesInvoices = mergeEntityList(state.salesInvoices, salesInvRows, ['invoiceId', 'invoice_id', 'id']);
        if (purchaseInvRows && purchaseInvRows.length > 0) state.purchaseInvoices = mergeEntityList(state.purchaseInvoices, purchaseInvRows, ['invoiceId', 'invoice_id', 'id']);
        if (repRows && repRows.length > 0) state.reports = mergeEntityList(state.reports, repRows, ['report_id', 'id']);
        if (prescRows && prescRows.length > 0) state.prescriptions = mergeEntityList(state.prescriptions, prescRows, ['id']);
        if (apptRows && apptRows.length > 0) state.appointments = mergeEntityList(state.appointments, apptRows, ['appointment_id', 'id']);
        if (admRows && admRows.length > 0) state.admissions = mergeEntityList(state.admissions, admRows, ['admission_id', 'id']);

        // Detailed Expenses Dual-Partition:
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
      } catch (modularErr) {
        console.warn("Modular table load notice:", modularErr);
      }

      // 3. Safety check with local cache: Never lose offline collections
      if (localState) {
        if (Array.isArray(localState.labInvoices) && localState.labInvoices.length > 0) {
          state.labInvoices = mergeEntityList(state.labInvoices || [], localState.labInvoices, ['invoice_id', 'id', 'invoice_no']);
        }
        if (Array.isArray(localState.dueCollections) && localState.dueCollections.length > 0) {
          state.dueCollections = mergeEntityList(state.dueCollections || [], localState.dueCollections, ['collection_id', 'id']);
        }
        if (Array.isArray(localState.indoorInvoices) && localState.indoorInvoices.length > 0) {
          state.indoorInvoices = mergeEntityList(state.indoorInvoices || [], localState.indoorInvoices, ['invoice_id', 'daily_id', 'id']);
        }
        if (Array.isArray(localState.patients) && localState.patients.length > 0) {
          state.patients = mergeEntityList(state.patients || [], localState.patients, ['pt_id', 'patient_id', 'id']);
        }
        if (Array.isArray(localState.doctors) && localState.doctors.length > 0) {
          state.doctors = mergeEntityList(state.doctors || [], localState.doctors, ['doctor_id', 'id']);
        }
        if (Array.isArray(localState.referrars) && localState.referrars.length > 0) {
          state.referrars = mergeEntityList(state.referrars || [], localState.referrars, ['ref_id', 'referrer_id', 'id']);
        }
      }

      // 4. Strict Deduplication & Guaranteed Unique ID normalization for detailedExpenses
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

      // Ensure all collections are safe arrays
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
        localStorage.setItem('ncd_offline_cache_v1', JSON.stringify(state));
      } catch (e) {}

      return state;
    } catch (error) {
      console.error("Cloud load error:", error);
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('ncd_offline_cache_v1');
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
        localStorage.setItem('ncd_offline_cache_v1', JSON.stringify(appState));
      } catch (e) {
        console.warn("Local cache save error:", e);
      }

      if (!supabase) {
        console.warn("Supabase not connected. Saved to local storage.");
        return { success: true, mocked: true };
      }
      
      const cutoffDate = getTableSplitCutoffDate(); // '2026-08-01'
      const now = new Date().toISOString();

      // 2. Fast Save to Master ncd_state single table (< 200ms latency)
      const { error: masterErr } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: MASTER_RECORD_ID, 
          data: appState,
          updated_at: now 
        }, { onConflict: 'id' });

      if (masterErr) {
        console.error("Master state save error:", masterErr);
        return { success: false, error: masterErr.message || "Cloud save failed." };
      }

      // 3. Asynchronously sync modern detailed_expenses (August 1st onwards) without blocking the UI
      try {
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
          upsertTableSafe(supabase, 'detailed_expenses', expenseRows).catch(e => {
            console.warn("Background detailed_expenses sync notice:", e);
          });
        }
      } catch (e) {
        console.warn("Async expense sync warning:", e);
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
  
  getClinicProfile: (): ClinicProfile => {
    try {
      const saved = localStorage.getItem('ncd_clinic_profile');
      if (saved) return { ...defaultClinicProfile, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultClinicProfile;
  },

  saveClinicProfile: (profile: ClinicProfile) => {
    try {
      localStorage.setItem('ncd_clinic_profile', JSON.stringify(profile));
      return true;
    } catch (e) {
      return false;
    }
  },

  getPrintSettings: (): PrintSettings => {
    try {
      const saved = localStorage.getItem('ncd_print_settings');
      if (saved) return { ...defaultPrintSettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultPrintSettings;
  },

  savePrintSettings: (settings: PrintSettings) => {
    try {
      localStorage.setItem('ncd_print_settings', JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  },

  getStaffAccounts: (): StaffAccount[] => {
    try {
      const saved = localStorage.getItem('ncd_staff_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultStaffAccounts;
  },

  saveStaffAccounts: (accounts: StaffAccount[]) => {
    try {
      localStorage.setItem('ncd_staff_accounts', JSON.stringify(accounts));
      return true;
    } catch (e) {
      return false;
    }
  },

  getSMSGatewaySettings: (): SMSGatewaySettings => {
    try {
      const saved = localStorage.getItem('ncd_sms_settings');
      if (saved) return { ...defaultSMSGatewaySettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultSMSGatewaySettings;
  },

  saveSMSGatewaySettings: (settings: SMSGatewaySettings) => {
    try {
      localStorage.setItem('ncd_sms_settings', JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  },

  getConsolidatedEntries: (): DailyConsolidatedEntry[] => {
    try {
      const saved = localStorage.getItem('ncd_consolidated_lab_entries');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  saveConsolidatedEntries: (entries: DailyConsolidatedEntry[]) => {
    try {
      localStorage.setItem('ncd_consolidated_lab_entries', JSON.stringify(entries));
      return true;
    } catch (e) {
      return false;
    }
  },

  saveSingleConsolidatedEntry: (entry: DailyConsolidatedEntry) => {
    try {
      const existing = dbService.getConsolidatedEntries();
      const updated = [entry, ...existing.filter(e => e.id !== entry.id)];
      dbService.saveConsolidatedEntries(updated);
      return true;
    } catch (e) {
      return false;
    }
  },

  deleteConsolidatedEntry: (id: string) => {
    try {
      const existing = dbService.getConsolidatedEntries();
      const updated = existing.filter(e => e.id !== id);
      dbService.saveConsolidatedEntries(updated);
      return true;
    } catch (e) {
      return false;
    }
  },

  getAutoBackupSettings: (): AutoBackupSettings => {
    try {
      const saved = localStorage.getItem('ncd_auto_backup_settings');
      if (saved) return { ...defaultAutoBackupSettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultAutoBackupSettings;
  },

  saveAutoBackupSettings: (settings: AutoBackupSettings) => {
    try {
      localStorage.setItem('ncd_auto_backup_settings', JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  },

  getLocalSnapshots: (): { id: string; timestamp: string; title: string; recordCount: number; sizeKb: number; data: any }[] => {
    try {
      const saved = localStorage.getItem('ncd_local_snapshots_vault');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  saveLocalSnapshot: (title: string, data: any) => {
    try {
      const snapshots = dbService.getLocalSnapshots();
      const jsonStr = JSON.stringify(data);
      const sizeKb = Math.round(jsonStr.length / 1024);
      let recordCount = 0;
      if (typeof data === 'object' && data !== null) {
        Object.values(data).forEach(val => {
          if (Array.isArray(val)) recordCount += val.length;
        });
      }
      const newSnapshot = {
        id: 'SNP-' + Date.now(),
        timestamp: new Date().toISOString(),
        title: title || `Auto Snapshot ${new Date().toLocaleDateString()}`,
        recordCount,
        sizeKb,
        data
      };
      const settings = dbService.getAutoBackupSettings();
      const updated = [newSnapshot, ...snapshots].slice(0, settings.maxSnapshots || 10);
      localStorage.setItem('ncd_local_snapshots_vault', JSON.stringify(updated));
      return true;
    } catch (e) {
      return false;
    }
  },

  deleteLocalSnapshot: (id: string) => {
    try {
      const snapshots = dbService.getLocalSnapshots();
      const updated = snapshots.filter(s => s.id !== id);
      localStorage.setItem('ncd_local_snapshots_vault', JSON.stringify(updated));
      return true;
    } catch (e) {
      return false;
    }
  },

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

export interface ClinicProfile {
  name: string;
  nameBn: string;
  tagline: string;
  address: string;
  mobile: string;
  email: string;
  website: string;
  licenseNo: string;
  regNo: string;
  emergencyHotline: string;
}

export const defaultClinicProfile: ClinicProfile = {
  name: 'Niramoy Clinic & Diagnostic',
  nameBn: 'নিরাময় ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার',
  tagline: 'বিশ্বস্ত চিকিৎসা ও নির্ভুল ডায়াগনস্টিক সেবা',
  address: 'Enayetpur, Chouhali, Sirajganj',
  mobile: '01730 923007',
  email: 'niramoyclinic@gmail.com',
  website: 'www.niramoyclinic.com',
  licenseNo: 'HSM41671',
  regNo: 'REG-2024-SRJ-881',
  emergencyHotline: '01730 923007'
};

export interface PrintSettings {
  paperSize: 'A4_landscape' | 'A4_portrait' | 'A5_portrait' | 'POS_80mm';
  headerTitle: string;
  footerNote: string;
  authorizedSign: string;
  showBarcode: boolean;
  showQrCode: boolean;
}

export const defaultPrintSettings: PrintSettings = {
  paperSize: 'A4_landscape',
  headerTitle: 'Niramoy Clinic & Diagnostic',
  footerNote: '* জরুরি প্রয়োজনে হেল্পলাইনে যোগাযোগ করুন | রিপোর্ট ডেলিভারির সময় মূল রসিদ প্রদর্শন করুন।',
  authorizedSign: 'Authorized Sign / প্রধান হিসাবরক্ষক',
  showBarcode: true,
  showQrCode: true
};

export interface StaffAccount {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'LAB_TECHNOLOGIST' | 'DOCTOR' | 'ACCOUNTANT';
  dept: string;
  mobile: string;
  status: 'Active' | 'Inactive';
}

export const defaultStaffAccounts: StaffAccount[] = [
  { id: 'STF-01', name: 'Super Admin', username: 'admin', role: 'ADMIN', dept: 'System Admin', mobile: '01730 923007', status: 'Active' },
  { id: 'STF-02', name: 'Lab Cashier / Receptionist', username: 'reception', role: 'RECEPTIONIST', dept: 'Diagnostic & Billing', mobile: '01711 000001', status: 'Active' },
  { id: 'STF-03', name: 'Senior Medical Technologist', username: 'labtech', role: 'LAB_TECHNOLOGIST', dept: 'Pathology & Lab', mobile: '01711 000002', status: 'Active' },
  { id: 'STF-04', name: 'Head of Accounts', username: 'accountant', role: 'ACCOUNTANT', dept: 'Accounts & Finance', mobile: '01711 000003', status: 'Active' }
];

export interface SMSGatewaySettings {
  provider: 'greenweb' | 'bulksmsbd' | 'onnorokom' | 'alphasms' | 'custom';
  apiKey: string;
  senderId: string;
  clientId: string;
  enabled: boolean;
  autoSendOnInvoice: boolean;
  autoSendOnReportReady: boolean;
  templates: {
    invoiceCreated: string;
    reportReady: string;
    dueReminder: string;
  };
}

export const defaultSMSGatewaySettings: SMSGatewaySettings = {
  provider: 'bulksmsbd',
  apiKey: '',
  senderId: 'NIRAMOY',
  clientId: '',
  enabled: false,
  autoSendOnInvoice: true,
  autoSendOnReportReady: true,
  templates: {
    invoiceCreated: 'Dear {patient_name}, thanks for visiting {clinic_name}. Inv #{invoice_id}, Total: ৳{total}, Paid: ৳{paid}, Due: ৳{due}. Hotline: {hotline}',
    reportReady: 'Dear {patient_name}, your lab test reports (Inv #{invoice_id}) are ready for delivery at {clinic_name}. Hotline: {hotline}',
    dueReminder: 'Dear {patient_name}, your due balance for Inv #{invoice_id} is ৳{due} at {clinic_name}. Please settle soon.'
  }
};

export interface DailyConsolidatedEntry {
  id: string;
  date: string;
  shift: 'Full Day' | 'Morning' | 'Evening' | 'Night';
  entryTime: string;
  operatorName: string;
  totalPatients: number;
  totalTests: number;
  grossAmount: number;
  discountAmount: number;
  netPayable: number;
  cashCollected: number;
  dueAmount: number;
  doctorCommissionPaid: number;
  usgDoctorFeePaid: number;
  breakdown: {
    pathology: number;
    usg: number;
    xray: number;
    ecg: number;
    hormone: number;
    others: number;
  };
  notes: string;
  createdAt: string;
}

export interface AutoBackupSettings {
  autoBackupEnabled: boolean;
  frequency: 'daily' | 'weekly';
  maxSnapshots: number;
  lastAutoBackupDate: string;
}

export const defaultAutoBackupSettings: AutoBackupSettings = {
  autoBackupEnabled: true,
  frequency: 'daily',
  maxSnapshots: 10,
  lastAutoBackupDate: ''
};

