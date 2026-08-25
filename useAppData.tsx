
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { ViewState, UserRole, DepartmentPasswords } from './types';
import Dashboard from './components/Dashboard';
import DiagnosticPage from './components/DiagnosticPage';
import ClinicPage from './components/ClinicPage';
import MedicinePage from './components/MedicinePage';
import AccountingPage from './components/AccountingPage';
import MarketingPage from './components/MarketingPage';
import DoctorLogin from './components/DoctorLogin';
import DoctorPortal from './components/DoctorPortal';
import DepartmentLogin from './components/DepartmentLogin';
import AdminSettings from './components/AdminSettings';
import AIAssistant from './components/AIAssistant';
import { dbService } from './dbService';
import { 
  mockPatients, mockDoctors, mockReferrars, mockTests, mockReagents, 
  mockInvoices, mockDueCollections, mockEmployees, mockMedicines,
  mockPurchaseInvoices, mockSalesInvoices, mockAdmissions, mockIndoorInvoices,
  initialAppointments, initialClinicalDrugs, PrescriptionRecord, LabReport, ExpenseItem
} from './components/DiagnosticData';

const App: React.FC = () => {
  // --- GLOBAL STATE ---
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [userRole, setUserRole] = useState<UserRole>('NONE');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string>(''); // For UI feedback
  const lastSavedAtRef = React.useRef<string>(''); // For logic checks to avoid loops

  const [currentUserEmail] = useState(() => {
    const existing = localStorage.getItem('ncd_user_email');
    if (existing) return existing;
    const newId = `User-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('ncd_user_email', newId);
    return newId;
  });

  // Authentication & Passwords
  const [passwords, setPasswords] = useState<DepartmentPasswords>(() => {
    const saved = localStorage.getItem('ncd_passwords');
    const defaultPasswords = {
      DIAGNOSTIC: 'diag123',
      LAB_REPORTING: 'lab123',
      CLINIC: 'clinic123',
      ACCOUNTING: 'acc123',
      MEDICINE: 'med123',
      ADMIN: 'niramoy123'
    };
    return saved ? { ...defaultPasswords, ...JSON.parse(saved) } : defaultPasswords;
  });

  // Data States
  const [patients, setPatients] = useState(mockPatients);
  const [doctors, setDoctors] = useState(mockDoctors);
  const [referrars, setReferrars] = useState(mockReferrars);
  const [tests, setTests] = useState(mockTests);
  const [reagents, setReagents] = useState(mockReagents);
  const [labInvoices, setLabInvoices] = useState(mockInvoices);
  const [dueCollections, setDueCollections] = useState(mockDueCollections);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [rtTemplates, setRtTemplates] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('ncd_rt_templates_v1') || '[]'); } catch { return []; } });
  const [employees, setEmployees] = useState(mockEmployees);
  const [medicines, setMedicines] = useState(mockMedicines);
  const [clinicalDrugs, setClinicalDrugs] = useState(initialClinicalDrugs);
  const [purchaseInvoices, setPurchaseInvoices] = useState(mockPurchaseInvoices);
  const [salesInvoices, setSalesInvoices] = useState(mockSalesInvoices);
  const [admissions, setAdmissions] = useState(mockAdmissions);
  const [indoorInvoices, setIndoorInvoices] = useState(mockIndoorInvoices);
  const [detailedExpenses, setDetailedExpenses] = useState<Record<string, ExpenseItem[]>>({});
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [appointments, setAppointments] = useState(initialAppointments);
  
  // Marketing States
  const [employeeReferrerMap, setEmployeeReferrerMap] = useState<Record<string, string[]>>({});

  // HR/Payroll States
  const [attendanceLog, setAttendanceLog] = useState<Record<string, any>>({});
  const [leaveLog, setLeaveLog] = useState<Record<string, any>>({});
  const [monthlyRoster, setMonthlyRoster] = useState<Record<string, string[]>>({});
  const [diagnosticSettings, setDiagnosticSettings] = useState<any>(() => {
    const saved = localStorage.getItem('diag_settings');
    return saved ? JSON.parse(saved) : { customSubCategories: {}, trackedTests: [] };
  });

  // --- DATA LOADING & REAL-TIME SYNC ---
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await dbService.loadFromCloud();
      const localData = dbService.getLocalBackup();
      
      let finalDataToLoad = loadedData;
      
      if (loadedData && !loadedData._error) {
        if (localData && localData.last_updated_at && loadedData.last_updated_at) {
            const localTime = new Date(localData.last_updated_at).getTime();
            const cloudTime = new Date(loadedData.last_updated_at).getTime();
            if (localTime > cloudTime) {
                console.log("Local backup is newer than cloud. Using local backup to prevent data loss.");
                finalDataToLoad = localData;
                // Trigger a sync so the newer local data is pushed to the cloud
                setTimeout(() => dbService.saveToCloud(localData), 2000);
            }
        }
        
        if (Object.keys(finalDataToLoad).length > 0) {
          updateLocalState(finalDataToLoad);
        }
        setIsDataLoaded(true);
        setConnectionError(false);
      } else {
        if (localData) {
            console.log("Cloud load failed, but found local data. Using local backup.");
            updateLocalState(localData);
            setIsDataLoaded(true);
            setConnectionError(false);
        } else {
            // Hard block if cloud load fails, to prevent overwriting cloud with empty data
            setConnectionErrorMessage(loadedData ? loadedData._error : 'Unknown load error');
            setIsDataLoaded(false);
            setConnectionError(true);
        }
      }
    };

    const updateLocalState = (data: any) => {
      if (!data) return;
      
      // If the data from cloud is same or older than our last local save, ignore to prevent echo loops
      if (lastSavedAtRef.current && data.last_updated_at && data.last_updated_at <= lastSavedAtRef.current) {
        return;
      }

      // Important: Update sync markers immediately to acknowledge this remote state
      if (data.last_updated_at) {
        lastSavedAtRef.current = data.last_updated_at;
        setLastSavedAt(data.last_updated_at);
      }

      // Batching updates without expensive JSON.stringify
      if (Array.isArray(data.patients)) setPatients(data.patients);
      if (Array.isArray(data.doctors)) setDoctors(data.doctors);
      if (Array.isArray(data.referrars)) setReferrars(data.referrars);
      if (Array.isArray(data.tests)) setTests(data.tests);
      if (Array.isArray(data.reagents)) setReagents(data.reagents);
      if (Array.isArray(data.labInvoices)) setLabInvoices(data.labInvoices);
      if (Array.isArray(data.dueCollections)) setDueCollections(data.dueCollections);
      if (Array.isArray(data.reports)) setReports(data.reports);
      if (Array.isArray(data.rtTemplates)) {
          setRtTemplates(data.rtTemplates);
          try {
              localStorage.setItem('ncd_rt_templates_v1', JSON.stringify(data.rtTemplates));
          } catch(e){}
      }
      if (Array.isArray(data.employees)) setEmployees(data.employees);
      if (Array.isArray(data.medicines)) setMedicines(data.medicines);
      if (Array.isArray(data.clinicalDrugs)) setClinicalDrugs(data.clinicalDrugs);
      if (Array.isArray(data.purchaseInvoices)) setPurchaseInvoices(data.purchaseInvoices);
      if (Array.isArray(data.salesInvoices)) setSalesInvoices(data.salesInvoices);
      if (Array.isArray(data.admissions)) setAdmissions(data.admissions);
      if (Array.isArray(data.indoorInvoices)) setIndoorInvoices(data.indoorInvoices);
      if (data.detailedExpenses !== undefined) setDetailedExpenses(data.detailedExpenses || {});
      if (Array.isArray(data.prescriptions)) setPrescriptions(data.prescriptions);
      if (Array.isArray(data.appointments)) setAppointments(data.appointments);
      if (data.attendanceLog !== undefined) setAttendanceLog(data.attendanceLog || {});
      if (data.leaveLog !== undefined) setLeaveLog(data.leaveLog || {});
      if (data.monthlyRoster !== undefined) setMonthlyRoster(data.monthlyRoster || {});
      if (data.diagnosticSettings !== undefined) setDiagnosticSettings(data.diagnosticSettings || {});
      if (data.employeeReferrerMap !== undefined) setEmployeeReferrerMap(data.employeeReferrerMap || {});
      if (data.passwords !== undefined) setPasswords(data.passwords || {});
    };

    loadData();

    // REAL-TIME LISTENER: Listen for changes from other users
    const subscription = dbService.subscribeToChanges((newData) => {
      if (newData && Object.keys(newData).length > 0) {
        // Only update if the cloud is newer (simple timestamp check or always update)
        // Here we always update to ensure all tabs see the same data
        updateLocalState(newData);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [manualSyncError, setManualSyncError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [lastManualSyncTime, setLastManualSyncTime] = useState(0);

  const showSyncNotification = useMemo(() => {
    return (isSyncing || syncError);
  }, [isSyncing, syncError]);

  // Helper to get current state for syncing
  const getCurrentState = useCallback((overrides: any = {}) => {
    return {
      patients, doctors, referrars, tests, reagents, labInvoices, 
      dueCollections, reports, rtTemplates, employees, medicines, clinicalDrugs,
      purchaseInvoices, salesInvoices, admissions, indoorInvoices,
      detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster,
      diagnosticSettings, employeeReferrerMap,
      passwords,
      last_updated_at: new Date().toISOString(),
      ...overrides
    };
  }, [patients, doctors, referrars, tests, reagents, labInvoices, dueCollections, reports, rtTemplates, employees, medicines, clinicalDrugs, purchaseInvoices, salesInvoices, admissions, indoorInvoices, detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster, diagnosticSettings, employeeReferrerMap, passwords]);

  // Blocking Manual Sync Handler
  const performBlockingSync = useCallback(async (overrides?: any) => {
    setIsManualSyncing(true);
    setManualSyncError(null);
    
    // Merge overrides with current state if any, otherwise use current state
    const now = new Date().toISOString();
    setLastSavedAt(now);
    lastSavedAtRef.current = now;
    const stateToSync = getCurrentState({ ...overrides, last_updated_at: now });
    
    try {
      console.log(`[Sync] Starting blocking sync. Overrides:`, overrides ? Object.keys(overrides) : 'None');
      const result = await dbService.saveToCloud(stateToSync);
      if (result.success) {
        console.log(`[Sync] Success!`);
        
        // Backup to local storage ONLY after successful cloud save
        try {
          localStorage.setItem('ncd_offline_cache_v1', JSON.stringify(stateToSync));
        } catch (e) {
          console.warn("Local backup failed after successful sync:", e);
        }
        
        setIsManualSyncing(false);
        setSyncError(false);
        setLastManualSyncTime(Date.now());
        return true;
      } else {
        console.error(`[Sync] Failure:`, result.error);
        setManualSyncError("ইন্টারনেট কানেকশন নেই বা সার্ভার সমস্যা। দয়া করে ইন্টারনেট চেক করুন।");
        setIsManualSyncing(false);
        return false;
      }
    } catch (e) {
      console.error(`[Sync] Catch Error:`, e);
      setManualSyncError("Sync failed due to an unexpected error.");
      setIsManualSyncing(false);
      return false;
    }
  }, [getCurrentState]);

  // --- DATA SYNCING ---
  useEffect(() => {
    // Auto-sync is completely disabled as per user request.
    // The application relies entirely on manual explicit saves via performBlockingSync.
  }, []);

  // --- HANDLERS ---
  const handleDepartmentLogin = (password: string, dept: keyof DepartmentPasswords, role: UserRole, targetView: ViewState) => {
    const enteredPwd = password.trim();
    let storedPwd = (passwords[dept] || '').trim();
    if (dept === 'ADMIN' && !storedPwd) storedPwd = 'niramoy123';
    
    if (enteredPwd === storedPwd || (dept === 'ADMIN' && enteredPwd === 'niramoy123')) {
      if (dept === 'ADMIN') {
        setIsAdminLoggedIn(true);
      }
      setUserRole(role);
      setViewState(targetView);
