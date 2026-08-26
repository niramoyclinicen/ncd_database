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
      
      // 1. Try to fetch master monolithic state from ncd_state
      let state: any = null;
      try {
        const { data: records, error } = await supabase
          .from('ncd_state')
          .select('id, data, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (!error && records && records.length > 0 && records[0].data) {
          state = records[0].data;
        }
      } catch (err) {
        console.warn("Notice fetching ncd_state:", err);
      }

      // If state is not found or empty, initialize empty object
      if (!state || typeof state !== 'object') {
        state = localState ? { ...localState } : {};
      }

      // 2. Query individual tables in Supabase to guarantee all prior data is loaded!
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

        // Map patients if found in table and more complete
        if (dbPatients && dbPatients.length > 0) {
          const mapped = dbPatients.map((p: any) => ({
            pt_id: p.id || p.pt_id,
            pt_name: p.name || p.pt_name || '',
            ageY: p.age || p.ageY || '',
            gender: p.gender || '',
            mobile: p.phone || p.mobile || '',
            address: p.address || '',
            createdAt: p.createdAt || p.created_at || ''
          }));
          if (!state.patients || state.patients.length < mapped.length) {
            state.patients = mapped;
          }
        }

        // Map doctors
        if (dbDoctors && dbDoctors.length > 0) {
          const mapped = dbDoctors.map((d: any) => ({
            doctor_id: d.id || d.doctor_id,
            doctor_name: d.name || d.doctor_name || '',
            degree: d.designation || d.degree || '',
            specialty: d.specialty || '',
            mobile: d.phone || d.mobile || '',
            fee: d.fee || 0,
            department: d.department || ''
          }));
          if (!state.doctors || state.doctors.length < mapped.length) {
            state.doctors = mapped;
          }
        }

        // Map referrars
        if (dbReferrars && dbReferrars.length > 0) {
          const mapped = dbReferrars.map((r: any) => ({
            ref_id: r.id || r.ref_id,
            ref_name: r.name || r.ref_name || '',
            ref_mobile: r.phone || r.ref_mobile || '',
            address: r.hospital || r.address || '',
            area: r.district || r.area || '',
            commission: r.commission_rate || r.commission || 0
          }));
          if (!state.referrars || state.referrars.length < mapped.length) {
            state.referrars = mapped;
          }
        }

        // Map employees
        if (dbEmployees && dbEmployees.length > 0) {
          const mapped = dbEmployees.map((e: any) => ({
            emp_id: e.id || e.emp_id,
            emp_name: e.name || e.emp_name || '',
            job_position: e.designation || e.job_position || '',
            department: e.department || '',
            basic_salary: e.salary || e.basic_salary || 0,
            phone: e.phone || e.mobile || '',
            joining_date: e.join_date || e.joining_date || '',
            machine_id: e.machine_id || ''
          }));
          if (!state.employees || state.employees.length < mapped.length) {
            state.employees = mapped;
          }
        }

        // Map tests
        if (dbTests && dbTests.length > 0) {
          const mapped = dbTests.map((t: any) => ({
            test_id: t.id || t.test_id,
            test_name: t.name || t.test_name || '',
            category: t.department || t.category || '',
            price: t.price || 0,
            room_no: t.room_no || ''
          }));
          if (!state.tests || state.tests.length < mapped.length) {
            state.tests = mapped;
          }
        }

        // Map medicines
        if (dbMedicines && dbMedicines.length > 0) {
          const mapped = dbMedicines.map((m: any) => ({
            id: m.id || m.med_id,
            tradeName: m.name || m.tradeName || m.brand_name || '',
            genericName: m.generic_name || m.genericName || '',
            formulation: m.category || m.formulation || '',
            stock: m.stock || 0,
            unitPriceBuy: m.purchase_price || m.unitPriceBuy || 0,
            unitPriceSell: m.selling_price || m.unitPriceSell || m.mrp || 0,
            company: m.supplier || m.company || '',
            expiryDate: m.expiry_date || m.expiryDate || ''
          }));
          if (!state.medicines || state.medicines.length < mapped.length) {
            state.medicines = mapped;
          }
        }

        // Map lab invoices
        if (dbLabInvoices && dbLabInvoices.length > 0) {
          const mapped = dbLabInvoices.map((i: any) => ({
            invoice_id: i.id || i.invoice_id || i.invoice_no,
            patient_id: i.patient_id || i.pt_id || '',
            patient_name: i.patient_name || i.pt_name || '',
            doctor_id: i.doctor_id || i.ref_by || '',
            referrar_id: i.referrer_id || i.referrar_id || '',
            invoice_date: i.date || i.invoice_date || '',
            total_amount: i.subtotal || i.total_amount || 0,
            discount_amount: i.discount || i.discount_amount || 0,
            net_payable: i.total || i.net_payable || i.net_amount || 0,
            paid_amount: i.paid || i.paid_amount || 0,
            due_amount: i.due || i.due_amount || 0,
            status: i.status || '',
            items: i.items || i.tests || []
          }));
          if (!state.labInvoices || state.labInvoices.length < mapped.length) {
            state.labInvoices = mapped;
          }
        }

        // Map indoor invoices
        if (dbIndoorInvoices && dbIndoorInvoices.length > 0) {
          const mapped = dbIndoorInvoices.map((i: any) => ({
            daily_id: i.id || i.daily_id || i.invoice_id,
            patient_id: i.patient_id || '',
            patient_name: i.patient_name || '',
            admission_date: i.admission_date || i.date || '',
            discharge_date: i.discharge_date || '',
            total_bill: i.total_bill || 0,
            paid_amount: i.paid || i.paid_amount || 0,
            due_bill: i.due || i.due_bill || 0,
            status: i.status || '',
            items: i.items || i.services || []
          }));
          if (!state.indoorInvoices || state.indoorInvoices.length < mapped.length) {
            state.indoorInvoices = mapped;
          }
        }

        // Map sales invoices
        if (dbSalesInvoices && dbSalesInvoices.length > 0) {
          const mapped = dbSalesInvoices.map((i: any) => ({
            invoiceId: i.id || i.invoiceId || i.invoice_id,
            customerName: i.customer_name || i.customerName || '',
            invoiceDate: i.date || i.invoiceDate || '',
            netPayable: i.total || i.netPayable || i.totalAmount || 0,
            paidAmount: i.paid || i.paidAmount || i.paid_amount || 0,
            dueAmount: i.due || i.dueAmount || i.due_amount || 0,
            items: i.items || []
          }));
          if (!state.salesInvoices || state.salesInvoices.length < mapped.length) {
            state.salesInvoices = mapped;
          }
        }

        // Map expenses
        if (dbExpenses && dbExpenses.length > 0) {
          const expenseObj: Record<string, any[]> = state.detailedExpenses || {};
          dbExpenses.forEach((e: any) => {
            const dateKey = (e.date || '').split('T')[0] || new Date().toISOString().split('T')[0];
            if (!expenseObj[dateKey]) expenseObj[dateKey] = [];
            const exists = expenseObj[dateKey].some((x: any) => x.id === e.id);
            if (!exists) {
              expenseObj[dateKey].push({
                id: e.id,
                category: e.category || 'General',
                paidAmount: e.amount || e.paidAmount || 0,
                billAmount: e.amount || e.billAmount || 0,
                description: e.description || '',
                dept: e.entered_by || e.dept || '',
                date: dateKey
              });
            }
          });
          state.detailedExpenses = expenseObj;
        }

        // Map reports
        if (dbReports && dbReports.length > 0) {
          const mapped = dbReports.map((r: any) => ({
            report_id: r.id || r.report_id,
            invoice_id: r.invoice_id || r.invoice_no || '',
            test_id: r.test_id || r.test_name || '',
            patient_id: r.patient_id || r.pt_id || '',
            report_date: r.date || r.report_date || '',
            results: r.results || r.data || [],
            status: r.status || '',
            prepared_by: r.prepared_by || ''
          }));
          if (!state.reports || state.reports.length < mapped.length) {
            state.reports = mapped;
          }
        }

        // Map prescriptions
        if (dbPrescriptions && dbPrescriptions.length > 0) {
          if (!state.prescriptions || state.prescriptions.length < dbPrescriptions.length) {
            state.prescriptions = dbPrescriptions;
          }
        }

        // Map appointments
        if (dbAppointments && dbAppointments.length > 0) {
          const mapped = dbAppointments.map((a: any) => ({
            apt_id: a.id || a.apt_id,
            patient_id: a.patient_id || '',
            patient_name: a.patient_name || '',
            doctor_id: a.doctor_id || '',
            date: a.date || '',
            time: a.time || '',
            serial_no: a.serial_no || 0,
            status: a.status || '',
            fee: a.fee || 0
          }));
          if (!state.appointments || state.appointments.length < mapped.length) {
            state.appointments = mapped;
          }
        }

        // Map due collections
        if (dbDueCollections && dbDueCollections.length > 0) {
          if (!state.dueCollections || state.dueCollections.length < dbDueCollections.length) {
            state.dueCollections = dbDueCollections;
          }
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
        
        const mappedExpenses: any[] = [];
        if (detailedExpenses && typeof detailedExpenses === 'object' && !Array.isArray(detailedExpenses)) {
          Object.entries(detailedExpenses).forEach(([dateKey, items]) => {
            if (Array.isArray(items)) {
              items.forEach((e: any, idx: number) => {
                if (e && !e.isDeleted) {
                  mappedExpenses.push({
                    id: e.id || `EXP-${dateKey}-${idx}`,
                    category: e.category || 'General',
                    amount: e.paidAmount || e.billAmount || 0,
                    date: safeIsoDate(dateKey),
                    description: e.description || '',
                    entered_by: e.dept || ''
                  });
                }
              });
            }
          });
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
