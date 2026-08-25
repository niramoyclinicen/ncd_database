
import { createClient } from '@supabase/supabase-js';

let fallbackUrl = '';
try { fallbackUrl = process.env.SUPABASE_URL || ''; } catch (e) { console.error(e); }
let fallbackKey = '';
try { fallbackKey = process.env.SUPABASE_ANON_KEY || ''; } catch (e) { console.error(e); }

// @ts-expect-error import.meta is available in Vite environment
const envSupabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : '';
// @ts-expect-error import.meta is available in Vite environment
const envSupabaseKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

const SUPABASE_URL = envSupabaseUrl || fallbackUrl || '';
const SUPABASE_ANON_KEY = envSupabaseKey || fallbackKey || '';

const isValidSupabaseConfig = (url: string, key: string) => {
  try {
    return url && key && (url.startsWith('http://') || url.startsWith('https://'));
  } catch { return false; }
};

const supabase = isValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const MASTER_RECORD_ID = 1;
const LOCAL_STORAGE_KEY = 'ncd_offline_cache_v1';

// Helper to safely parse JSONB
const safeParse = (data: any) => {
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return []; }
    }
    return data || [];
};

export const dbService = {
  loadFromCloud: async () => {
    try {
      if (!supabase) {
        return { _error: "Supabase not initialized. Check ENV variables." };
      }
      
      // 1. Fetch monolithic state (acts as fallback/base)
      const { data: record, error } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', MASTER_RECORD_ID)
        .single();
        
      let state = (record && record.data) ? { ...record.data } : {};

      // 2. Fetch from individual tables to override/merge (supports manual DB entries)
      const fetchTable = async (table: string) => {
          const { data } = await supabase.from(table).select('*').limit(1000);
          return data || [];
      };

      const [
          dbPatients, dbDoctors, dbReferrars, dbEmployees, dbTests, dbMedicines,
          dbLabInvoices, dbIndoorInvoices, dbSalesInvoices, dbExpenses,
          dbLabReports, dbPrescriptions, dbAppointments
      ] = await Promise.all([
          fetchTable('patients'), fetchTable('doctors'), fetchTable('referrars'),
          fetchTable('employees'), fetchTable('tests'), fetchTable('medicines'),
          fetchTable('lab_invoices'), fetchTable('indoor_invoices'), fetchTable('sales_invoices'),
          fetchTable('detailed_expenses'), fetchTable('lab_reports'), fetchTable('prescriptions'),
          fetchTable('appointments')
      ]);

      // Merge Patients
      if (dbPatients.length > 0) {
          const current = state.patients || [];
          const currentMap = new Map(current.map((item: any) => [item.pt_id, item]));
          dbPatients.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  pt_id: row.id, pt_name: row.name || '', ageY: row.age || '', gender: row.gender || '', mobile: row.phone || '', address: row.address || ''
              });
          });
          state.patients = Array.from(currentMap.values());
      }

      // Merge Doctors
      if (dbDoctors.length > 0) {
          const current = state.doctors || [];
          const currentMap = new Map(current.map((item: any) => [item.doctor_id, item]));
          dbDoctors.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  doctor_id: row.id, doctor_name: row.name || '', degree: row.designation || '', specialty: row.specialty || '', mobile: row.phone || '', fee: row.fee || 0, department: row.department || ''
              });
          });
          state.doctors = Array.from(currentMap.values());
      }

      // Merge Referrars
      if (dbReferrars.length > 0) {
          const current = state.referrars || [];
          const currentMap = new Map(current.map((item: any) => [item.ref_id, item]));
          dbReferrars.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  ref_id: row.id, ref_name: row.name || '', ref_mobile: row.phone || '', address: row.hospital || '', area: row.district || '', commission: row.commission_rate || 0
              });
          });
          state.referrars = Array.from(currentMap.values());
      }
      
      // Merge Employees
      if (dbEmployees.length > 0) {
          const current = state.employees || [];
          const currentMap = new Map(current.map((item: any) => [item.emp_id, item]));
          dbEmployees.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  emp_id: row.id, emp_name: row.name || '', job_position: row.designation || '', department: row.department || '', basic_salary: row.salary || 0, phone: row.phone || '', joining_date: row.join_date || ''
              });
          });
          state.employees = Array.from(currentMap.values());
      }

      // Merge Tests
      if (dbTests.length > 0) {
          const current = state.tests || [];
          const currentMap = new Map(current.map((item: any) => [item.test_id, item]));
          dbTests.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  test_id: row.id, test_name: row.name || '', category: row.department || '', price: row.price || 0, room_no: row.room_no || ''
              });
          });
          state.tests = Array.from(currentMap.values());
      }

      // Merge Medicines
      if (dbMedicines.length > 0) {
          const current = state.medicines || [];
          const currentMap = new Map(current.map((item: any) => [item.id, item]));
          dbMedicines.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  id: row.id, brand_name: row.name || '', generic_name: row.generic_name || '', category: row.category || '', stock: row.stock || 0, purchase_price: row.purchase_price || 0, mrp: row.selling_price || 0, company: row.supplier || '', expiry_date: row.expiry_date || ''
              });
          });
          state.medicines = Array.from(currentMap.values());
      }
      
      // Merge Lab Invoices
      if (dbLabInvoices.length > 0) {
          const current = state.labInvoices || [];
          const currentMap = new Map(current.map((item: any) => [item.invoice_no, item]));
          dbLabInvoices.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  invoice_no: row.id, pt_id: row.patient_id || '', pt_name: row.patient_name || '', ref_by: row.referrer_id || row.doctor_id || '', date: row.date || '', total_amount: row.subtotal || 0, discount: row.discount || 0, net_amount: row.total || 0, paid_amount: row.paid || 0, due_amount: row.due || 0, status: row.status || '', tests: safeParse(row.items)
              });
          });
          state.labInvoices = Array.from(currentMap.values());
      }
      
      // Merge Indoor Invoices
      if (dbIndoorInvoices.length > 0) {
          const current = state.indoorInvoices || [];
          const currentMap = new Map(current.map((item: any) => [item.daily_id, item]));
          dbIndoorInvoices.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  daily_id: row.id, patient_id: row.patient_id || '', patient_name: row.patient_name || '', admission_date: row.admission_date || '', discharge_date: row.discharge_date || '', total_bill: row.total_bill || 0, paid: row.paid || 0, due: row.due || 0, status: row.status || '', services: safeParse(row.items)
              });
          });
          state.indoorInvoices = Array.from(currentMap.values());
      }
      
      // Merge Sales Invoices
      if (dbSalesInvoices.length > 0) {
          const current = state.salesInvoices || [];
          const currentMap = new Map(current.map((item: any) => [item.invoice_id, item]));
          dbSalesInvoices.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  invoice_id: row.id, customer_name: row.customer_name || '', date: row.date || '', total_amount: row.total || 0, paid_amount: row.paid || 0, due_amount: row.due || 0, items: safeParse(row.items)
              });
          });
          state.salesInvoices = Array.from(currentMap.values());
      }
      
      // Merge Detailed Expenses
      if (dbExpenses.length > 0) {
          const current = state.detailedExpenses || [];
          const currentMap = new Map(current.map((item: any) => [item.id, item]));
          dbExpenses.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  id: row.id, category: row.category || '', amount: row.amount || 0, date: row.date || '', description: row.description || '', entered_by: row.entered_by || ''
              });
          });
          state.detailedExpenses = Array.from(currentMap.values());
      }
      
      // Merge Lab Reports
      if (dbLabReports.length > 0) {
          const current = state.reports || [];
          const currentMap = new Map(current.map((item: any) => [item.report_id, item]));
          dbLabReports.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  report_id: row.id, invoice_no: row.invoice_id || '', test_id: row.test_id || '', pt_id: row.patient_id || '', report_date: row.date || '', results: safeParse(row.results), status: row.status || '', prepared_by: row.prepared_by || ''
              });
          });
          state.reports = Array.from(currentMap.values());
      }
      
      // Merge Prescriptions
      if (dbPrescriptions.length > 0) {
          const current = state.prescriptions || [];
          const currentMap = new Map(current.map((item: any) => [item.id, item]));
          dbPrescriptions.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  id: row.id, patient_id: row.patient_id || '', doctor_id: row.doctor_id || '', date: row.date || '', complaints: safeParse(row.complaints), diagnoses: safeParse(row.diagnoses), medicines: safeParse(row.medicines), tests: safeParse(row.tests), advice: row.advice || '', next_visit: row.next_visit || ''
              });
          });
          state.prescriptions = Array.from(currentMap.values());
      }
      
      // Merge Appointments
      if (dbAppointments.length > 0) {
          const current = state.appointments || [];
          const currentMap = new Map(current.map((item: any) => [item.apt_id, item]));
          dbAppointments.forEach((row: any) => {
              currentMap.set(row.id, {
                  ...(currentMap.get(row.id) || {}),
                  apt_id: row.id, patient_id: row.patient_id || '', patient_name: row.patient_name || '', doctor_id: row.doctor_id || '', date: row.date || '', time: row.time || '', serial_no: row.serial_no || 0, status: row.status || '', fee: row.fee || 0
              });
          });
          state.appointments = Array.from(currentMap.values());
      }

      return state;
    } catch (error: any) {
      console.error("Cloud Connection Error:", error);
      return { _error: "Exception: " + error.message };
    }
  },

  saveToCloud: async (appState: any) => {
    try {
      if (!supabase) {
        console.warn("Supabase not connected. Mocking cloud save for local testing.");
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
        return { success: true, mocked: true };
      }
      
      // 1. Save Monolith State
      const { error: monoError } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: MASTER_RECORD_ID, 
          data: appState,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
        
      if (monoError) console.error("Monolith save error:", monoError);

      // 2. Sync Individual Tables (Fire and forget, or await to ensure data integrity)
      // Extract lists
      const { 
          patients, doctors, referrars, employees, tests, medicines,
          labInvoices, indoorInvoices, salesInvoices, detailedExpenses,
          reports, prescriptions, appointments 
      } = appState;
      
      const upsertTable = async (table: string, data: any[]) => {
          if (!data || data.length === 0) return;
          // Chunking to avoid payload too large
          const chunkSize = 100;
          for (let i = 0; i < data.length; i += chunkSize) {
              const chunk = data.slice(i, i + chunkSize);
              const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
              if (error) console.error(`Sync error ${table}:`, error);
          }
      };

      // Map data to match DB schemas
      const mappedPatients = (patients || []).map((p: any) => ({
          id: p.pt_id, name: p.pt_name || '', age: p.ageY || '', gender: p.gender || '', phone: p.mobile || '', address: p.address || ''
      }));
      
      const mappedDoctors = (doctors || []).map((d: any) => ({
          id: d.doctor_id, name: d.doctor_name || '', designation: d.degree || '', specialty: d.specialty || '', phone: d.mobile || '', fee: d.fee || 0, department: d.department || ''
      }));
      
      const mappedReferrars = (referrars || []).map((r: any) => ({
          id: r.ref_id, name: r.ref_name || '', phone: r.ref_mobile || '', hospital: r.address || '', district: r.area || '', commission_rate: r.commission || 0
      }));
      
      const mappedEmployees = (employees || []).map((e: any) => ({
          id: e.emp_id, name: e.emp_name || '', designation: e.job_position || '', department: e.department || '', salary: e.basic_salary || 0, phone: e.phone || '', join_date: e.joining_date || ''
      }));
      
      const mappedTests = (tests || []).map((t: any) => ({
          id: t.test_id, name: t.test_name || '', department: t.category || '', price: t.price || 0, room_no: t.room_no || ''
      }));
      
      const mappedMedicines = (medicines || []).map((m: any) => ({
          id: m.id, name: m.brand_name || m.name || '', generic_name: m.generic_name || '', category: m.category || '', stock: m.stock || 0, purchase_price: m.purchase_price || 0, selling_price: m.mrp || 0, supplier: m.company || '', expiry_date: m.expiry_date || ''
      }));
      
      const mappedLabInvoices = (labInvoices || []).map((i: any) => ({
          id: i.invoice_no, patient_id: i.pt_id || '', patient_name: i.pt_name || '', doctor_id: i.ref_by || '', referrer_id: i.ref_by || '', date: i.date ? new Date(i.date).toISOString() : null, subtotal: i.total_amount || 0, discount: i.discount || 0, total: i.net_amount || 0, paid: i.paid_amount || 0, due: i.due_amount || 0, status: i.status || '', items: i.tests || []
      }));
      
      const mappedIndoorInvoices = (indoorInvoices || []).map((i: any) => ({
          id: i.daily_id, patient_id: i.patient_id || '', patient_name: i.patient_name || '', admission_date: i.admission_date ? new Date(i.admission_date).toISOString() : null, discharge_date: i.discharge_date ? new Date(i.discharge_date).toISOString() : null, total_bill: i.total_bill || 0, paid: i.paid || 0, due: i.due || 0, status: i.status || '', items: i.services || []
      }));
      
      const mappedSalesInvoices = (salesInvoices || []).map((i: any) => ({
          id: i.invoice_id, customer_name: i.customer_name || '', date: i.date ? new Date(i.date).toISOString() : null, total: i.total_amount || 0, paid: i.paid_amount || 0, due: i.due_amount || 0, items: i.items || []
      }));
      
      const mappedExpenses = (detailedExpenses || []).map((e: any) => ({
          id: e.id, category: e.category || '', amount: e.amount || 0, date: e.date ? new Date(e.date).toISOString() : null, description: e.description || '', entered_by: e.entered_by || ''
      }));
      
      const mappedReports = (reports || []).map((r: any) => ({
          id: r.report_id, invoice_id: r.invoice_no || '', test_id: r.test_id || '', patient_id: r.pt_id || '', date: r.report_date ? new Date(r.report_date).toISOString() : null, results: r.results || [], status: r.status || '', prepared_by: r.prepared_by || ''
      }));
      
      const mappedPrescriptions = (prescriptions || []).map((p: any) => ({
          id: p.id, patient_id: p.patient_id || '', doctor_id: p.doctor_id || '', date: p.date ? new Date(p.date).toISOString() : null, complaints: p.complaints || [], diagnoses: p.diagnoses || [], medicines: p.medicines || [], tests: p.tests || [], advice: p.advice || '', next_visit: p.next_visit || ''
      }));
      
      const mappedAppointments = (appointments || []).map((a: any) => ({
          id: a.apt_id, patient_id: a.patient_id || '', patient_name: a.patient_name || '', doctor_id: a.doctor_id || '', date: a.date || '', time: a.time || '', serial_no: a.serial_no || 0, status: a.status || '', fee: a.fee || 0
      }));

      // Async write to all tables
      await Promise.all([
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
      ]);

      return { success: true };
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      return { success: false, error };
    }
  },

  // ... (keep the rest of the file methods exactly as they were for compatibility)
  fetchAllCloudRows: async () => {
    try {
      if (!supabase) return [];
      const { data, error } = await supabase.from('ncd_state').select('*');
      if (error) { console.error("fetchAllCloudRows error:", error); return []; }
      return data || [];
    } catch { return []; }
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

  isSupabaseConnected: () => !!supabase,
  deepScanRecovery: () => null,
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
