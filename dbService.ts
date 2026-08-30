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
        'patients', 'doctors', 'referrars', 'tests', 'employees', 'medicines',
        'lab_invoices', 'indoor_invoices', 'sales_invoices', 'detailed_expenses',
        'lab_reports', 'prescriptions', 'appointments', 'due_collections'
      ];

      for (const t of tableNames) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
          counts[t] = count;
        }
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
      
      // 1. Primary Source: Fetch master state from ncd_state
      let state: any = null;
      try {
        const { data: records, error } = await supabase
          .from('ncd_state')
          .select('id, data, updated_at')
          .order('updated_at', { ascending: false });
          
        if (!error && records && records.length > 0) {
          // Prefer master record with MASTER_RECORD_ID (id: 1) or the most recently updated record
          const masterRecord = records.find(r => r.id === MASTER_RECORD_ID) || records[0];
          if (masterRecord && masterRecord.data && typeof masterRecord.data === 'object') {
            state = { ...masterRecord.data };
          }
        }
      } catch (err) {
        console.warn("Notice fetching ncd_state:", err);
      }

      // If state is not found or empty, initialize with localState or empty object
      if (!state || typeof state !== 'object') {
        state = localState ? { ...localState } : {};
      }

      // Ensure historical detailedExpenses is preserved as an object Record<string, ExpenseItem[]>
      if (!state.detailedExpenses || typeof state.detailedExpenses !== 'object' || Array.isArray(state.detailedExpenses)) {
        state.detailedExpenses = {};
      }

      // 2. Query individual tables in Supabase to non-destructively append any new records
      try {
        const [
          dbPatients,
          dbDoctors,
          dbReferrars,
          dbTests,
          dbEmployees,
          dbMedicines,
          dbLabInvoices,
          dbIndoorInvoices,
          dbSalesInvoices,
          dbExpenses,
          dbReports,
          dbPrescriptions,
          dbAppointments,
          dbDueCollections
        ] = await Promise.all([
          fetchTableSafe(supabase, 'patients'),
          fetchTableSafe(supabase, 'doctors'),
          fetchTableSafe(supabase, 'referrars'),
          fetchTableSafe(supabase, 'tests'),
          fetchTableSafe(supabase, 'employees'),
          fetchTableSafe(supabase, 'medicines'),
          fetchTableSafe(supabase, 'lab_invoices'),
          fetchTableSafe(supabase, 'indoor_invoices'),
          fetchTableSafe(supabase, 'sales_invoices'),
          fetchTableSafe(supabase, 'detailed_expenses'),
          fetchTableSafe(supabase, 'lab_reports'),
          fetchTableSafe(supabase, 'prescriptions'),
          fetchTableSafe(supabase, 'appointments'),
          fetchTableSafe(supabase, 'due_collections')
        ]);

        // Safely append ONLY newly added patients without overwriting existing
        if (dbPatients && dbPatients.length > 0) {
          const currentPatients = Array.isArray(state.patients) ? [...state.patients] : [];
          const existingIds = new Set(currentPatients.map((p: any) => p.pt_id || p.id));
          dbPatients.forEach((p: any) => {
            const pId = p.id || p.pt_id;
            if (pId && !existingIds.has(pId)) {
              currentPatients.push({
                pt_id: pId,
                pt_name: p.name || p.pt_name || '',
                ageY: p.age || p.ageY || '',
                ageM: p.ageM || '',
                ageD: p.ageD || '',
                gender: p.gender || '',
                mobile: p.phone || p.mobile || '',
                address: p.address || '',
                co_pref: p.co_pref || 'S/O',
                co_name: p.co_name || '',
                dobY: p.dobY || '',
                dobM: p.dobM || '',
                dobD: p.dobD || '',
                thana: p.thana || '',
                district: p.district || 'Sirajganj',
                date_modified: p.createdAt || p.created_at || ''
              });
              existingIds.add(pId);
            }
          });
          state.patients = currentPatients;
        }

        // Safely append ONLY newly added doctors without overwriting existing
        if (dbDoctors && dbDoctors.length > 0) {
          const currentDocs = Array.isArray(state.doctors) ? [...state.doctors] : [];
          const existingIds = new Set(currentDocs.map((d: any) => d.doctor_id || d.id));
          dbDoctors.forEach((d: any) => {
            const dId = d.id || d.doctor_id;
            if (dId && !existingIds.has(dId)) {
              currentDocs.push({
                doctor_id: dId,
                doctor_name: d.name || d.doctor_name || '',
                degree: d.designation || d.degree || '',
                gender: d.gender || '',
                mobile: d.phone || d.mobile || '',
                email: d.email || '',
                photo: d.photo || ''
              });
              existingIds.add(dId);
            }
          });
          state.doctors = currentDocs;
        }

        // Safely append ONLY newly added referrars without overwriting existing
        if (dbReferrars && dbReferrars.length > 0) {
          const currentRefs = Array.isArray(state.referrars) ? [...state.referrars] : [];
          const existingIds = new Set(currentRefs.map((r: any) => r.ref_id || r.id));
          dbReferrars.forEach((r: any) => {
            const rId = r.id || r.ref_id;
            if (rId && !existingIds.has(rId)) {
              currentRefs.push({
                ref_id: rId,
                ref_name: r.name || r.ref_name || '',
                ref_degrees: r.designation || r.ref_degrees || '',
                ref_gender: r.gender || r.ref_gender || '',
                ref_mobile: r.phone || r.ref_mobile || '',
                address: r.hospital || r.address || '',
                area: r.district || r.area || ''
              });
              existingIds.add(rId);
            }
          });
          state.referrars = currentRefs;
        }

        // Safely append ONLY newly added employees without overwriting existing
        if (dbEmployees && dbEmployees.length > 0) {
          const currentEmps = Array.isArray(state.employees) ? [...state.employees] : [];
          const existingIds = new Set(currentEmps.map((e: any) => e.emp_id || e.id));
          dbEmployees.forEach((e: any) => {
            const eId = e.id || e.emp_id;
            if (eId && !existingIds.has(eId)) {
              currentEmps.push({
                emp_id: eId,
                emp_name: e.name || e.emp_name || '',
                machine_id: e.machine_id || '',
                gender: e.gender || '',
                job_position: e.designation || e.job_position || '',
                department: e.department || '',
                salary: e.salary || e.basic_salary || 0,
                mobile: e.phone || e.mobile || '',
                address: e.address || '',
                joining_date: e.join_date || e.joining_date || '',
                status: (e.status as any) || 'Active',
                is_current_month: false
              });
              existingIds.add(eId);
            }
          });
          state.employees = currentEmps;
        }

        // Safely append ONLY newly added tests without overwriting existing
        if (dbTests && dbTests.length > 0) {
          const currentTests = Array.isArray(state.tests) ? [...state.tests] : [];
          const existingIds = new Set(currentTests.map((t: any) => t.test_id || t.id));
          dbTests.forEach((t: any) => {
            const tId = t.id || t.test_id;
            if (tId && !existingIds.has(tId)) {
              currentTests.push({
                test_id: tId,
                test_name: t.name || t.test_name || '',
                category: t.department || t.category || '',
                price: t.price || 0,
                test_commission: t.commission || t.test_commission || 0,
                is_group_test: !!t.is_group_test,
                sub_tests: t.sub_tests || [],
                usg_exam_charge: t.usg_exam_charge || 0,
                extra_lab_fee: t.extra_lab_fee || 0,
                reagents_required: t.reagents_required || [],
                availability: t.availability !== false
              });
              existingIds.add(tId);
            }
          });
          state.tests = currentTests;
        }

        // Safely append ONLY newly added medicines without overwriting existing
        if (dbMedicines && dbMedicines.length > 0) {
          const currentMeds = Array.isArray(state.medicines) ? [...state.medicines] : [];
          const existingIds = new Set(currentMeds.map((m: any) => m.id || m.med_id));
          dbMedicines.forEach((m: any) => {
            const mId = m.id || m.med_id;
            if (mId && !existingIds.has(mId)) {
              currentMeds.push({
                id: mId,
                tradeName: m.name || m.tradeName || m.brand_name || '',
                genericName: m.generic_name || m.genericName || '',
                formulation: m.category || m.formulation || '',
                strength: m.strength || '',
                stock: m.stock || 0,
                unitPriceBuy: m.purchase_price || m.unitPriceBuy || 0,
                unitPriceSell: m.selling_price || m.unitPriceSell || m.mrp || 0,
                expiryDate: m.expiry_date || m.expiryDate || ''
              });
              existingIds.add(mId);
            }
          });
          state.medicines = currentMeds;
        }

        // Safely append ONLY newly added lab invoices without overwriting existing rich history
        if (dbLabInvoices && dbLabInvoices.length > 0) {
          const currentInvoices = Array.isArray(state.labInvoices) ? [...state.labInvoices] : [];
          const existingIds = new Set(currentInvoices.map((i: any) => i.invoice_id || i.id || i.invoice_no));
          
          dbLabInvoices.forEach((i: any) => {
            const invId = i.id || i.invoice_id || i.invoice_no;
            if (invId && !existingIds.has(invId)) {
              currentInvoices.push({
                invoice_id: invId,
                patient_id: i.patient_id || i.pt_id || '',
                patient_name: i.patient_name || i.pt_name || '',
                doctor_id: i.doctor_id || i.ref_by || '',
                doctor_name: i.doctor_name || '',
                referrar_id: i.referrer_id || i.referrar_id || '',
                referrar_name: i.referrar_name || '',
                invoice_date: (i.date || i.invoice_date || '').split('T')[0],
                total_amount: Number(i.subtotal || i.total_amount || 0),
                discount_percentage: Number(i.discount_percentage || 0),
                discount_amount: Number(i.discount || i.discount_amount || 0),
                net_payable: Number(i.total || i.net_payable || i.net_amount || 0),
                paid_amount: Number(i.paid || i.paid_amount || 0),
                due_amount: Number(i.due || i.due_amount || 0),
                status: i.status || 'Paid',
                payment_method: i.payment_method || 'Cash',
                special_commission: i.special_commission || 0,
                commission_paid: i.commission_paid || 0,
                notes: i.notes || '',
                date_created: i.date_created || i.created_at || (i.date ? i.date.split('T')[0] : ''),
                last_modified: i.last_modified || '',
                sample_collection_time: i.sample_collection_time || '',
                expected_delivery_time: i.expected_delivery_time || '',
                items: Array.isArray(i.items) ? i.items : (Array.isArray(i.tests) ? i.tests : [])
              });
              existingIds.add(invId);
            }
          });
          state.labInvoices = currentInvoices;
        }

        // Safely append ONLY newly added due collections
        if (dbDueCollections && dbDueCollections.length > 0) {
          const currentDueCols = Array.isArray(state.dueCollections) ? [...state.dueCollections] : [];
          const existingIds = new Set(currentDueCols.map((c: any) => c.collection_id || c.id));
          dbDueCollections.forEach((c: any) => {
            const colId = c.collection_id || c.id;
            if (colId && !existingIds.has(colId)) {
              currentDueCols.push({
                collection_id: colId,
                invoice_id: c.invoice_id || '',
                amount_collected: Number(c.amount_collected || c.amount || 0),
                collection_date: (c.collection_date || c.date || '').split('T')[0],
                collected_by: c.collected_by || '',
                payment_method: c.payment_method || 'Cash',
                notes: c.notes || ''
              });
              existingIds.add(colId);
            }
          });
          state.dueCollections = currentDueCols;
        }

        // Safely merge expenses: preserve complete detailedExpenses structure from master state
        // CRITICAL: For dates before the cutoff date (default: 2026-08-01), strictly use ONLY the master ncd_state table!
        // The separate detailed_expenses table is ONLY merged for dates on or after the cutoff date.
        const cutoffDate = getTableSplitCutoffDate();
        const expenseObj: Record<string, any[]> = { ...(state.detailedExpenses || {}) };

        if (dbExpenses && dbExpenses.length > 0) {
          // Filter ONLY expenses on or after the cutoff date
          const validDbExpenses = dbExpenses.filter((e: any) => {
            const d = (e.date || '').split('T')[0];
            return d && d >= cutoffDate;
          });

          validDbExpenses.forEach((e: any) => {
            const dateKey = (e.date || '').split('T')[0];
            if (!dateKey) return;
            if (!expenseObj[dateKey]) expenseObj[dateKey] = [];
            const existingList = expenseObj[dateKey];
            const eAmount = Number(e.amount || e.paidAmount || e.billAmount || 0);
            const eSub = (e.subCategory || e.sub_category || '').trim().toLowerCase();
            const eDesc = (e.description || '').trim().toLowerCase();
            const eCat = (e.category || '').trim().toLowerCase();

            const exists = existingList.some((x: any) => {
              if (x.id && e.id && String(x.id) === String(e.id)) return true;
              const xAmount = Number(x.paidAmount || x.billAmount || 0);
              const xSub = (x.subCategory || '').trim().toLowerCase();
              const xDesc = (x.description || '').trim().toLowerCase();
              const xCat = (x.category || '').trim().toLowerCase();

              const sameCategory = xCat === eCat;
              const sameAmount = Math.abs(xAmount - eAmount) < 0.01;
              const sameSubOrDesc = (xSub && xSub === eSub) || (xDesc && xDesc === eDesc) || (!xSub && !eSub && !xDesc && !eDesc);
              return sameCategory && sameAmount && sameSubOrDesc;
            });

            if (!exists) {
              existingList.push({
                id: e.id || Date.now() + Math.random(),
                category: e.category || 'General',
                subCategory: e.subCategory || e.sub_category || '',
                description: e.description || '',
                billAmount: Number(e.amount || e.billAmount || 0),
                paidAmount: Number(e.amount || e.paidAmount || 0),
                dept: (e.dept || e.entered_by === 'Clinic' ? 'Clinic' : 'Diagnostic') as 'Clinic' | 'Diagnostic'
              });
            }
          });
        }

        // Automatic in-memory deduplication across all dates to ensure pristine presentation
        Object.keys(expenseObj).forEach((dKey) => {
          if (!Array.isArray(expenseObj[dKey])) return;
          const seen = new Set<string>();
          const deduped: any[] = [];
          expenseObj[dKey].forEach((item: any) => {
            if (!item || item.isDeleted) return;
            const cat = (item.category || '').trim().toLowerCase();
            const sub = (item.subCategory || '').trim().toLowerCase();
            const desc = (item.description || '').trim().toLowerCase();
            const amt = Number(item.paidAmount || item.billAmount || 0);
            
            // Normalize salary entries to match by employee keyword/name
            let key = `${cat}_${sub}_${desc}_${amt}`;
            if (cat === 'stuff salary' || cat === 'staff salary') {
              const empTag = desc || sub || '';
              key = `salary_${empTag}_${amt}`;
            }

            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(item);
            }
          });
          expenseObj[dKey] = deduped;
        });

        state.detailedExpenses = expenseObj;

        // Safely append ONLY newly added reports
        if (dbReports && dbReports.length > 0) {
          const currentReports = Array.isArray(state.reports) ? [...state.reports] : [];
          const existingIds = new Set(currentReports.map((r: any) => r.report_id || r.id));
          dbReports.forEach((r: any) => {
            const repId = r.report_id || r.id;
            if (repId && !existingIds.has(repId)) {
              currentReports.push({
                report_id: repId,
                invoice_id: r.invoice_id || r.invoice_no || '',
                test_name: r.test_name || r.test_id || '',
                patient_id: r.patient_id || r.pt_id || '',
                report_date: (r.date || r.report_date || '').split('T')[0],
                status: r.status || 'Ready',
                data: r.results || r.data || {},
                technologistId: r.prepared_by || r.technologistId || '',
                technologistName: r.technologistName || '',
                consultantId: r.consultantId || '',
                consultantName: r.consultantName || ''
              });
              existingIds.add(repId);
            }
          });
          state.reports = currentReports;
        }

        // Safely append appointments
        if (dbAppointments && dbAppointments.length > 0) {
          const currentApts = Array.isArray(state.appointments) ? [...state.appointments] : [];
          const existingIds = new Set(currentApts.map((a: any) => a.apt_id || a.id));
          dbAppointments.forEach((a: any) => {
            const aptId = a.apt_id || a.id;
            if (aptId && !existingIds.has(aptId)) {
              currentApts.push({
                apt_id: aptId,
                patient_id: a.patient_id || '',
                patient_name: a.patient_name || '',
                doctor_id: a.doctor_id || '',
                doctor_name: a.doctor_name || '',
                date: (a.date || '').split('T')[0],
                time: a.time || '',
                serial_no: a.serial_no || 0,
                status: a.status || 'Confirmed',
                fee: a.fee || 0
              });
              existingIds.add(aptId);
            }
          });
          state.appointments = currentApts;
        }
      } catch (tableErr) {
        console.warn("Individual tables load notice:", tableErr);
      }

      // Ensure detailedExpenses is always an object Record<string, ExpenseItem[]>
      if (!state.detailedExpenses || typeof state.detailedExpenses !== 'object' || Array.isArray(state.detailedExpenses)) {
        state.detailedExpenses = {};
      }

      // Ensure arrays are initialized and safe
      if (!Array.isArray(state.patients)) state.patients = [];
      if (!Array.isArray(state.doctors)) state.doctors = [];
      if (!Array.isArray(state.referrars)) state.referrars = [];
      if (!Array.isArray(state.tests)) state.tests = [];
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
      // 1. Always update local storage cache immediately
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
      } catch (e) {
        console.warn("Local cache save error:", e);
      }

      if (!supabase) {
        console.warn("Supabase not connected. Saved to local storage.");
        return { success: true, mocked: true };
      }
      
      // 2. Save Master Monolithic State
      const { error: monoError } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: MASTER_RECORD_ID, 
          data: appState,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
        
      if (monoError) {
        console.error("Monolith save error:", monoError);
        // Do not abort completely; continue to sync individual tables
      }

      // 3. Sync Individual Tables safely in background without blocking
      try {
        const { 
          patients, doctors, referrars, employees, tests, medicines,
          labInvoices, indoorInvoices, salesInvoices, detailedExpenses,
          reports, prescriptions, appointments 
        } = appState;
        
        const upsertTable = async (table: string, data: any[]) => {
          if (!data || data.length === 0 || !supabase) return;
          const chunkSize = 100;
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            try {
              await supabase.from(table).upsert(chunk, { onConflict: 'id' });
            } catch (err) {
              console.warn(`Sync table notice for ${table}:`, err);
            }
          }
        };

        const mappedPatients = (patients || []).map((p: any) => ({
          id: p.pt_id || `PT-${Date.now()}`,
          name: p.pt_name || '',
          age: p.ageY || '',
          gender: p.gender || '',
          phone: p.mobile || '',
          address: p.address || ''
        }));
        
        const mappedDoctors = (doctors || []).map((d: any) => ({
          id: d.doctor_id || `DOC-${Date.now()}`,
          name: d.doctor_name || '',
          designation: d.degree || '',
          specialty: d.specialty || '',
          phone: d.mobile || '',
          fee: d.fee || 0,
          department: d.department || ''
        }));
        
        const mappedReferrars = (referrars || []).map((r: any) => ({
          id: r.ref_id || `REF-${Date.now()}`,
          name: r.ref_name || '',
          phone: r.ref_mobile || '',
          hospital: r.address || '',
          district: r.area || '',
          commission_rate: r.commission || 0
        }));
        
        const mappedEmployees = (employees || []).map((e: any) => ({
          id: e.emp_id || `EMP-${Date.now()}`,
          name: e.emp_name || '',
          designation: e.job_position || '',
          department: e.department || '',
          salary: e.basic_salary || e.salary || 0,
          phone: e.phone || e.mobile || '',
          join_date: e.joining_date || ''
        }));
        
        const mappedTests = (tests || []).map((t: any) => ({
          id: t.test_id || `TST-${Date.now()}`,
          name: t.test_name || '',
          department: t.category || '',
          price: t.price || 0,
          room_no: t.room_no || ''
        }));
        
        const mappedMedicines = (medicines || []).map((m: any) => ({
          id: m.id || `MED-${Date.now()}`,
          name: m.tradeName || m.brand_name || m.name || '',
          generic_name: m.genericName || m.generic_name || '',
          category: m.formulation || m.category || '',
          stock: m.stock || 0,
          purchase_price: m.unitPriceBuy || m.purchase_price || 0,
          selling_price: m.unitPriceSell || m.mrp || 0,
          supplier: m.company || '',
          expiry_date: m.expiryDate || m.expiry_date || ''
        }));
        
        const mappedLabInvoices = (labInvoices || []).map((i: any) => ({
          id: i.invoice_id || i.invoice_no || `INV-${Date.now()}`,
          patient_id: i.patient_id || i.pt_id || '',
          patient_name: i.patient_name || i.pt_name || '',
          doctor_id: i.doctor_id || i.ref_by || '',
          referrer_id: i.referrar_id || i.ref_by || '',
          date: safeIsoDate(i.invoice_date || i.date),
          subtotal: i.total_amount || 0,
          discount: i.discount_amount || i.discount || 0,
          total: i.net_payable || i.net_amount || 0,
          paid: i.paid_amount || 0,
          due: i.due_amount || 0,
          status: i.status || '',
          items: i.items || i.tests || []
        }));
        
        const mappedIndoorInvoices = (indoorInvoices || []).map((i: any) => ({
          id: i.daily_id || i.invoice_id || `IND-${Date.now()}`,
          patient_id: i.patient_id || '',
          patient_name: i.patient_name || '',
          admission_date: safeIsoDate(i.admission_date || i.invoice_date),
          discharge_date: safeIsoDate(i.discharge_date),
          total_bill: i.total_bill || 0,
          paid: i.paid_amount || i.paid || 0,
          due: i.due_bill || i.due || 0,
          status: i.status || '',
          items: i.items || i.services || []
        }));
        
        const mappedSalesInvoices = (salesInvoices || []).map((i: any) => ({
          id: i.invoiceId || i.invoice_id || `SALE-${Date.now()}`,
          customer_name: i.customerName || i.customer_name || '',
          date: safeIsoDate(i.invoiceDate || i.date),
          total: i.netPayable || i.totalAmount || 0,
          paid: i.paidAmount || i.paid_amount || 0,
          due: i.dueAmount || i.due_amount || 0,
          items: i.items || []
        }));
        
        const cutoffDate = getTableSplitCutoffDate();
        const mappedExpenses: any[] = [];
        const deletedExpenseIds: string[] = [];
        if (detailedExpenses && typeof detailedExpenses === 'object' && !Array.isArray(detailedExpenses)) {
          Object.entries(detailedExpenses).forEach(([dateKey, items]) => {
            if (Array.isArray(items)) {
              items.forEach((e: any, idx: number) => {
                if (e && e.isDeleted && e.id) {
                  deletedExpenseIds.push(String(e.id));
                } else if (e && !e.isDeleted) {
                  // ONLY sync to separate detailed_expenses table for dates on or after the cutoff date
                  if (dateKey >= cutoffDate) {
                    mappedExpenses.push({
                      id: e.id ? String(e.id) : `EXP-${dateKey}-${idx}`,
                      category: e.category || 'General',
                      amount: e.paidAmount || e.billAmount || 0,
                      date: safeIsoDate(dateKey),
                      description: e.description || e.subCategory || '',
                      entered_by: e.dept || ''
                    });
                  }
                }
              });
            }
          });
        }

        // Delete any soft-deleted expense IDs from Supabase detailed_expenses table
        if (deletedExpenseIds.length > 0 && supabase) {
          try {
            await supabase.from('detailed_expenses').delete().in('id', deletedExpenseIds);
          } catch (delErr) {
            console.warn("Notice deleting soft-deleted expenses from detailed_expenses:", delErr);
          }
        }
        
        // Ensure no pre-cutoff rows exist in the separate detailed_expenses table
        if (supabase) {
          try {
            await supabase.from('detailed_expenses').delete().lt('date', cutoffDate);
          } catch (delCutoffErr) {
            console.warn("Notice deleting pre-cutoff expenses from detailed_expenses:", delCutoffErr);
          }
        }
        
        const mappedReports = (reports || []).map((r: any) => ({
          id: r.report_id || `REP-${Date.now()}`,
          invoice_id: r.invoice_id || r.invoice_no || '',
          test_id: r.test_id || r.test_name || '',
          patient_id: r.patient_id || r.pt_id || '',
          date: safeIsoDate(r.report_date || r.date),
          results: r.results || r.data || [],
          status: r.status || '',
          prepared_by: r.prepared_by || r.technologistId || ''
        }));
        
        const mappedPrescriptions = (prescriptions || []).map((p: any) => ({
          id: p.id || `RX-${Date.now()}`,
          patient_id: p.patient_id || '',
          doctor_id: p.doctor_id || '',
          date: safeIsoDate(p.date),
          complaints: p.complaints || [],
          diagnoses: p.diagnoses || [],
          medicines: p.medicines || [],
          tests: p.tests || [],
          advice: p.advice || '',
          next_visit: p.next_visit || ''
        }));
        
        const mappedAppointments = (appointments || []).map((a: any) => ({
          id: a.apt_id || `APT-${Date.now()}`,
          patient_id: a.patient_id || '',
          patient_name: a.patient_name || '',
          doctor_id: a.doctor_id || '',
          date: a.date || '',
          time: a.time || '',
          serial_no: a.serial_no || 0,
          status: a.status || '',
          fee: a.fee || 0
        }));

        Promise.allSettled([
          upsertTable('patients', mappedPatients),
          upsertTable('doctors', mappedDoctors),
          upsertTable('referrars', mappedReferrars),
          upsertTable('employees', mappedEmployees),
          upsertTable('tests', mappedTests),
          upsertTable('medicines', mappedMedicines),
          upsertTable('lab_invoices', mappedLabInvoices),
          upsertTable('indoor_invoices', mappedIndoorInvoices),
          upsertTable('sales_invoices', mappedSalesInvoices),
          upsertTable('detailed_expenses', mappedExpenses),
          upsertTable('lab_reports', mappedReports),
          upsertTable('prescriptions', mappedPrescriptions),
          upsertTable('appointments', mappedAppointments)
        ]).catch(e => console.warn("Background tables sync warning:", e));
      } catch (err) {
        console.warn("Background tables mapping warning:", err);
      }

      return { success: true };
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      return { success: false, error };
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
      const cutoffDate = getTableSplitCutoffDate();

      let state: any = null;
      try {
        state = await dbService.loadFromCloud();
      } catch (err) {
        console.warn("Cloud load error during deduplication:", err);
      }

      if (!state || state._error) {
        // Fallback to local storage if cloud load didn't work
        try {
          const localStr = localStorage.getItem('ncd_state');
          if (localStr) {
            state = JSON.parse(localStr);
          }
        } catch (e) {
          console.warn("Local storage state load error:", e);
        }
      }

      if (!state) {
        state = {};
      }

      onProgress?.(40);
      let totalCleaned = 0;
      
      // Get detailedExpenses from state or localStorage
      let rawDetailed = state.detailedExpenses;
      if (!rawDetailed || typeof rawDetailed !== 'object') {
        try {
          const localDetailedStr = localStorage.getItem('ncd_detailed_expenses');
          if (localDetailedStr) {
            rawDetailed = JSON.parse(localDetailedStr);
          }
        } catch (e) {
          console.warn("Failed to parse ncd_detailed_expenses:", e);
        }
      }

      rawDetailed = rawDetailed || {};
      const cleanedDetailed: Record<string, any[]> = {};

      Object.entries(rawDetailed).forEach(([dateKey, items]: any) => {
        if (!Array.isArray(items)) {
          cleanedDetailed[dateKey] = items;
          return;
        }

        const uniqueItems: any[] = [];
        const seenKeys = new Set<string>();

        items.forEach((it: any) => {
          if (!it || it.isDeleted) {
            totalCleaned++;
            return;
          }
          const cat = (it.category || '').trim().toLowerCase();
          const sub = (it.subCategory || '').trim().toLowerCase();
          const desc = (it.description || '').trim().toLowerCase();
          const paid = Number(it.paidAmount || it.billAmount || 0);
          const dept = (it.dept || '').trim().toLowerCase();

          // Standardize salary signature to prevent double salary logging for the same staff/month
          let signature = `${cat}__${sub}__${desc}__${paid}__${dept}`;
          if (cat === 'stuff salary' || cat === 'staff salary') {
            const empTag = desc || sub || '';
            signature = `salary__${empTag}__${paid}`;
          }

          if (seenKeys.has(signature)) {
            totalCleaned++;
          } else {
            seenKeys.add(signature);
            uniqueItems.push(it);
          }
        });

        cleanedDetailed[dateKey] = uniqueItems;
      });

      state.detailedExpenses = cleanedDetailed;
      
      // Update local storage immediately
      try {
        localStorage.setItem('ncd_detailed_expenses', JSON.stringify(cleanedDetailed));
        localStorage.setItem('ncd_state', JSON.stringify(state));
      } catch (lsErr) {
        console.warn("Error updating local storage:", lsErr);
      }

      onProgress?.(65);

      // Purge and synchronize separate detailed_expenses table in Supabase
      if (supabase && dbService.getSupabaseConfig().isConnected) {
        try {
          // 1. Purge all pre-cutoff records from detailed_expenses (pre-cutoff is strictly stored in ncd_state only)
          await supabase.from('detailed_expenses').delete().lt('date', cutoffDate);
          
          // 2. Wipe existing post-cutoff records from detailed_expenses so duplicate zombie rows are eradicated
          await supabase.from('detailed_expenses').delete().gte('date', cutoffDate);

          // 3. Re-insert only the freshly deduplicated post-cutoff records
          const mappedCleanExpenses: any[] = [];
          Object.entries(cleanedDetailed).forEach(([dateKey, items]) => {
            if (dateKey >= cutoffDate && Array.isArray(items)) {
              items.forEach((e: any, idx: number) => {
                if (e && !e.isDeleted) {
                  mappedCleanExpenses.push({
                    id: e.id ? String(e.id) : `EXP-${dateKey}-${idx}`,
                    category: e.category || 'General',
                    amount: e.paidAmount || e.billAmount || 0,
                    date: safeIsoDate(dateKey),
                    description: e.description || e.subCategory || '',
                    entered_by: e.dept || ''
                  });
                }
              });
            }
          });

          if (mappedCleanExpenses.length > 0) {
            const chunkSize = 100;
            for (let i = 0; i < mappedCleanExpenses.length; i += chunkSize) {
              const chunk = mappedCleanExpenses.slice(i, i + chunkSize);
              await supabase.from('detailed_expenses').insert(chunk);
            }
          }
        } catch (purgeErr) {
          console.warn("Notice: could not complete detailed_expenses table purge/reinsert:", purgeErr);
        }
      }

      onProgress?.(80);

      // Save the cleaned unified master state to Supabase Cloud
      try {
        if (dbService.getSupabaseConfig().isConnected && supabase) {
          await supabase.from('ncd_state').upsert({
            id: MASTER_RECORD_ID,
            data: state,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }
      } catch (saveErr) {
        console.warn("Cloud save warning during deduplication:", saveErr);
      }

      onProgress?.(100);
      return { success: true, cleanedCount: totalCleaned };
    } catch (e: any) {
      return { success: false, message: e.message || "ত্রুটি ঘটেছে।" };
    }
  },
  
  deleteExpense: async (date: string, id: number | string) => {
    try {
      // 1. Remove from local storage
      try {
        const localStateStr = localStorage.getItem('ncd_state') || localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localStateStr) {
          const localState = JSON.parse(localStateStr);
          if (localState.detailedExpenses && Array.isArray(localState.detailedExpenses[date])) {
            localState.detailedExpenses[date] = localState.detailedExpenses[date].filter((it: any) => String(it.id) !== String(id));
            localStorage.setItem('ncd_state', JSON.stringify(localState));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localState));
            localStorage.setItem('ncd_detailed_expenses', JSON.stringify(localState.detailedExpenses));
          }
        }
      } catch (lsErr) {
        console.warn("Local storage delete warning:", lsErr);
      }

      // 2. Delete from Supabase detailed_expenses table if connected
      if (supabase && dbService.getSupabaseConfig().isConnected) {
        try {
          await supabase.from('detailed_expenses').delete().eq('id', String(id));
        } catch (delErr) {
          console.warn("Supabase detailed_expenses delete warning:", delErr);
        }
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
