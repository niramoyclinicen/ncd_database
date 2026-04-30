
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    return saved ? JSON.parse(saved) : {
      DIAGNOSTIC: 'diag123',
      LAB_REPORTING: 'lab123',
      CLINIC: 'clinic123',
      ACCOUNTING: 'acc123',
      MEDICINE: 'med123',
      ADMIN: 'niramoy123'
    };
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
      
      if (loadedData) {
        if (Object.keys(loadedData).length > 0) {
          updateLocalState(loadedData);
        }
        setIsDataLoaded(true);
        // Show indicator if offline, but don't block
        setConnectionError(!dbService.isSupabaseConnected());
      } else {
        // Fallback to local backup to ensure app opens
        const localBackup = dbService.getLocalBackup();
        if (localBackup) updateLocalState(localBackup);
        setIsDataLoaded(true);
        setConnectionError(true);
      }
    };

    const updateLocalState = (data: any) => {
      if (!data) return;
      
      // If the data from cloud is same or older than our last local save, ignore to prevent echo loops
      if (lastSavedAtRef.current && data.last_updated_at && data.last_updated_at <= lastSavedAtRef.current) {
        return;
      }

      // Batching updates without expensive JSON.stringify
      if (data.patients !== undefined) setPatients(data.patients);
      if (data.doctors !== undefined) setDoctors(data.doctors);
      if (data.referrars !== undefined) setReferrars(data.referrars);
      if (data.tests !== undefined) setTests(data.tests);
      if (data.reagents !== undefined) setReagents(data.reagents);
      if (data.labInvoices !== undefined) setLabInvoices(data.labInvoices);
      if (data.dueCollections !== undefined) setDueCollections(data.dueCollections);
      if (data.reports !== undefined) setReports(data.reports);
      if (data.employees !== undefined) setEmployees(data.employees);
      if (data.medicines !== undefined) setMedicines(data.medicines);
      if (data.clinicalDrugs !== undefined) setClinicalDrugs(data.clinicalDrugs);
      if (data.purchaseInvoices !== undefined) setPurchaseInvoices(data.purchaseInvoices);
      if (data.salesInvoices !== undefined) setSalesInvoices(data.salesInvoices);
      if (data.admissions !== undefined) setAdmissions(data.admissions);
      if (data.indoorInvoices !== undefined) setIndoorInvoices(data.indoorInvoices);
      if (data.detailedExpenses !== undefined) setDetailedExpenses(data.detailedExpenses);
      if (data.prescriptions !== undefined) setPrescriptions(data.prescriptions);
      if (data.appointments !== undefined) setAppointments(data.appointments);
      if (data.attendanceLog !== undefined) setAttendanceLog(data.attendanceLog);
      if (data.leaveLog !== undefined) setLeaveLog(data.leaveLog);
      if (data.monthlyRoster !== undefined) setMonthlyRoster(data.monthlyRoster);
      if (data.diagnosticSettings !== undefined) setDiagnosticSettings(data.diagnosticSettings);
      if (data.employeeReferrerMap !== undefined) setEmployeeReferrerMap(data.employeeReferrerMap);
      if (data.passwords !== undefined) setPasswords(data.passwords);
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
    return (isSyncing || syncError) && (Date.now() - lastManualSyncTime > 1500);
  }, [isSyncing, syncError, lastManualSyncTime]);

  // Helper to get current state for syncing
  const getCurrentState = useCallback((overrides: any = {}) => {
    return {
      patients, doctors, referrars, tests, reagents, labInvoices, 
      dueCollections, reports, employees, medicines, clinicalDrugs,
      purchaseInvoices, salesInvoices, admissions, indoorInvoices,
      detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster,
      diagnosticSettings, employeeReferrerMap,
      passwords,
      last_updated_at: new Date().toISOString(),
      ...overrides
    };
  }, [patients, doctors, referrars, tests, reagents, labInvoices, dueCollections, reports, employees, medicines, clinicalDrugs, purchaseInvoices, salesInvoices, admissions, indoorInvoices, detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster, diagnosticSettings, employeeReferrerMap, passwords]);

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
      const result = await dbService.saveToCloud(stateToSync);
      if (result.success) {
        setIsManualSyncing(false);
        setSyncError(false);
        setLastManualSyncTime(Date.now());
        return true;
      } else {
        setManualSyncError("Internet Connection Failure. Please check your connection and try again.");
        setIsManualSyncing(false);
        return false;
      }
    } catch (e) {
      setManualSyncError("Sync failed due to an unexpected error.");
      setIsManualSyncing(false);
      return false;
    }
  }, [getCurrentState]);

  // --- DATA SYNCING ---
  useEffect(() => {
    if (!isDataLoaded || isManualSyncing) return;
    
    const syncData = async () => {
      // Small safety delay to ensure all states are updated
      setIsSyncing(true);
      const now = new Date().toISOString();
      // Important: Update ref immediately to prevent incoming cloud updates from triggering during this process
      setLastSavedAt(now);
      lastSavedAtRef.current = now;
      
      const result = await dbService.saveToCloud(getCurrentState({ last_updated_at: now }));
      
      setIsSyncing(false);
      setSyncError(!result.success);
    };

    const syncInterval = setTimeout(syncData, 5000); // Increased interval to 5s for auto-sync to reduce load
    return () => clearTimeout(syncInterval);
  }, [
    patients, doctors, referrars, tests, reagents, labInvoices, 
    dueCollections, reports, employees, medicines, clinicalDrugs,
    purchaseInvoices, salesInvoices, admissions, indoorInvoices,
    detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster, diagnosticSettings, isDataLoaded, getCurrentState, isManualSyncing
  ]);

  // --- HANDLERS ---
  const handleDepartmentLogin = (password: string, dept: keyof DepartmentPasswords, role: UserRole, targetView: ViewState) => {
    const enteredPwd = password.trim();
    const storedPwd = (passwords[dept] || '').trim();
    
    if (enteredPwd === storedPwd) {
      if (dept === 'ADMIN') {
        setIsAdminLoggedIn(true);
      }
      setUserRole(role);
      setViewState(targetView);
      setPendingDeptLogin(null);
    } else {
      alert("ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  const [pendingDeptLogin, setPendingDeptLogin] = useState<{dept: keyof DepartmentPasswords, role: UserRole, view: ViewState} | null>(null);

  const navigateToDepartment = (view: ViewState) => {
    if (isAdminLoggedIn) {
      setViewState(view);
      return;
    }
    
    switch (view) {
      case ViewState.DIAGNOSTIC:
        setPendingDeptLogin({ dept: 'DIAGNOSTIC', role: 'DIAGNOSTIC_ADMIN', view });
        break;
      case ViewState.CLINIC:
        setPendingDeptLogin({ dept: 'CLINIC', role: 'CLINIC_ADMIN', view });
        break;
      case ViewState.MEDICINE:
        setPendingDeptLogin({ dept: 'MEDICINE', role: 'MEDICINE_ADMIN', view });
        break;
      case ViewState.ACCOUNTING:
        setPendingDeptLogin({ dept: 'ACCOUNTING', role: 'ACCOUNTING_ADMIN', view });
        break;
      case ViewState.MARKETING:
        setPendingDeptLogin({ dept: 'DIAGNOSTIC', role: 'DIAGNOSTIC_ADMIN', view });
        break;
      case ViewState.ADMIN_SETTINGS:
        setPendingDeptLogin({ dept: 'ADMIN', role: 'ADMIN', view });
        break;
      default:
        setViewState(view);
    }
  };

  if (connectionError && !isDataLoaded) {
    // We only show this if it's the absolute first time and no local backup
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border-2 border-red-500/50 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-4">ক্লাউড কানেকশন সমস্যা</h2>
          <p className="text-slate-400 mb-8">ইন্টারনেট কানেকশন চেক করুন। প্রথমবারের মত ডাটা লোড করার জন্য কানেকশন প্রয়োজন।</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 py-4 rounded-2xl text-white font-bold">RETRY</button>
        </div>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin-slow"></div>
          </div>
        </div>
        <p className="mt-8 text-sky-400 font-black tracking-[0.3em] uppercase text-sm animate-pulse">Connecting to Cloud...</p>
      </div>
    );
  }

  if (pendingDeptLogin) {
    return (
      <DepartmentLogin 
        department={pendingDeptLogin.dept} 
        onLogin={(pwd) => handleDepartmentLogin(pwd, pendingDeptLogin.dept, pendingDeptLogin.role, pendingDeptLogin.view)} 
        onBack={() => setPendingDeptLogin(null)} 
      />
    );
  }

  const renderContent = () => {
    switch (viewState) {
      case ViewState.DASHBOARD:
        return <Dashboard onLogout={() => {setIsAdminLoggedIn(false); setUserRole('NONE');}} onNavigate={navigateToDepartment} />;
      
      case ViewState.DIAGNOSTIC:
        return (
          <DiagnosticPage 
            onBack={() => setViewState(ViewState.DASHBOARD)} 
            userRole={userRole}
            patients={patients} setPatients={setPatients}
            doctors={doctors} setDoctors={setDoctors}
            referrars={referrars} setReferrars={setReferrars}
            tests={tests} setTests={setTests}
            reagents={reagents} setReagents={setReagents}
            labInvoices={labInvoices} setLabInvoices={setLabInvoices}
            dueCollections={dueCollections} setDueCollections={setDueCollections}
            reports={reports} setReports={setReports}
            employees={employees} setEmployees={setEmployees}
            detailedExpenses={detailedExpenses}
            attendanceLog={attendanceLog} setAttendanceLog={setAttendanceLog}
            leaveLog={leaveLog} setLeaveLog={setLeaveLog}
            appointments={appointments} setAppointments={setAppointments}
            monthlyRoster={monthlyRoster} setMonthlyRoster={setMonthlyRoster}
            employeeReferrerMap={employeeReferrerMap} setEmployeeReferrerMap={setEmployeeReferrerMap}
            performBlockingSync={performBlockingSync}
            currentUserEmail={currentUserEmail}
          />
        );

      case ViewState.CLINIC:
        return (
          <ClinicPage 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            patients={patients} setPatients={setPatients}
            doctors={doctors} setDoctors={setDoctors}
            referrars={referrars} setReferrars={setReferrars}
            employees={employees}
            medicines={medicines} setMedicines={setMedicines}
            admissions={admissions} setAdmissions={setAdmissions}
            indoorInvoices={indoorInvoices} setIndoorInvoices={setIndoorInvoices}
            detailedExpenses={detailedExpenses}
            performBlockingSync={performBlockingSync}
          />
        );

      case ViewState.MEDICINE:
        return (
          <MedicinePage 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            medicines={medicines} setMedicines={setMedicines}
            clinicalDrugs={clinicalDrugs} setClinicalDrugs={setClinicalDrugs}
            employees={employees}
            doctors={doctors}
            invoices={purchaseInvoices} setInvoices={setPurchaseInvoices}
            salesInvoices={salesInvoices} setSalesInvoices={setSalesInvoices}
            indoorInvoices={indoorInvoices}
            performBlockingSync={performBlockingSync}
          />
        );

      case ViewState.ACCOUNTING:
        return (
          <AccountingPage 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            invoices={labInvoices}
            dueCollections={dueCollections}
            detailedExpenses={detailedExpenses} setDetailedExpenses={setDetailedExpenses}
            employees={employees} setEmployees={setEmployees}
            purchaseInvoices={purchaseInvoices}
            salesInvoices={salesInvoices}
            indoorInvoices={indoorInvoices}
            medicines={medicines}
            tests={tests}
            setReagents={setReagents}
            attendanceLog={attendanceLog} setAttendanceLog={setAttendanceLog}
            leaveLog={leaveLog} setLeaveLog={setLeaveLog}
            monthlyRoster={monthlyRoster} setMonthlyRoster={setMonthlyRoster}
            patients={patients}
            doctors={doctors}
            diagnosticSettings={diagnosticSettings}
            setDiagnosticSettings={setDiagnosticSettings}
            performBlockingSync={performBlockingSync}
            currentUserEmail={currentUserEmail}
          />
        );

      case ViewState.MARKETING:
        return (
          <MarketingPage 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            referrars={referrars}
            labInvoices={labInvoices}
            indoorInvoices={indoorInvoices}
            patients={patients}
            employees={employees}
            employeeReferrerMap={employeeReferrerMap}
            setEmployeeReferrerMap={setEmployeeReferrerMap}
            performBlockingSync={performBlockingSync}
          />
        );

      case ViewState.ADMIN_SETTINGS:
        return (
          <AdminSettings 
            passwords={passwords} 
            onSave={(newPwds) => {setPasswords(newPwds); localStorage.setItem('ncd_passwords', JSON.stringify(newPwds));}} 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            performBlockingSync={performBlockingSync}
          />
        );

      case ViewState.DOCTOR_LOGIN:
        return <DoctorLogin doctors={doctors} onLogin={(doc) => {setUserRole('DOCTOR'); setViewState(ViewState.DOCTOR_PORTAL);}} onBack={() => setViewState(ViewState.DASHBOARD)} />;

      case ViewState.DOCTOR_PORTAL:
        return (
          <DoctorPortal 
            doctor={doctors[0]} 
            appointments={appointments}
            patients={patients}
            prescriptions={prescriptions}
            setPrescriptions={setPrescriptions}
            onLogout={() => setViewState(ViewState.DASHBOARD)}
            drugDatabase={clinicalDrugs}
            availableTests={tests}
            performBlockingSync={performBlockingSync}
          />
        );

      case ViewState.LAB_LOGIN:
        return (
          <DepartmentLogin 
            department="LAB_REPORTING" 
            onLogin={(pwd) => handleDepartmentLogin(pwd, 'LAB_REPORTING', 'LAB_REPORTER', ViewState.DIAGNOSTIC)} 
            onBack={() => setViewState(ViewState.DASHBOARD)} 
          />
        );

      default:
        return <Dashboard onLogout={() => setIsAdminLoggedIn(false)} onNavigate={navigateToDepartment} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {renderContent()}
      
      {(isAdminLoggedIn || userRole !== 'NONE') && (
        <AIAssistant 
          detailedExpenses={detailedExpenses}
          setDetailedExpenses={setDetailedExpenses}
          employees={employees}
          medicines={medicines}
          purchaseInvoices={purchaseInvoices}
          salesInvoices={salesInvoices}
          labInvoices={labInvoices}
          indoorInvoices={indoorInvoices}
        />
      )}

      {/* CLOUD SAVE SUCCESS MESSAGE - Temporary Toast */}
      {/* (Sub-pages show their own persistent success messages often, but we could add a central toast here if needed) */}

      {/* BLOCKING MANUAL SYNC OVERLAY */}
      {isManualSyncing && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white">
           <div className="relative mb-8">
             <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
             </div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 font-['Hind_Siliguri']">অনলাইনে সেভ হচ্ছে...</h2>
           <p className="text-blue-400 font-bold uppercase tracking-widest text-xs animate-pulse">Saving to Online Cloud Portal</p>
           <div className="mt-8 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
             <span className="text-[10px] text-blue-300 font-medium italic whitespace-nowrap">অপেক্ষ করুন, ডাটা ক্লাউড সার্ভারে নিরাপদে সংরক্ষিত হচ্ছে।</span>
           </div>
        </div>
      )}

      {/* MANUAL SYNC ERROR MODAL */}
      {manualSyncError && (
        <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
           <div className="bg-slate-800 border-2 border-red-500 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-4xl mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">⚠️</div>
             <h3 className="text-2xl font-black text-white uppercase mb-2 font-['Hind_Siliguri']">সেভ ব্যর্থ হয়েছে!</h3>
             <p className="text-slate-300 mb-8 leading-relaxed font-medium">
               আপনার ইন্টারনেট কানেকশন চেক করুন। ক্লাউড সার্ভারে ডাটা পাঠাতে ব্যর্থ হয়েছে। 
               <br/>
               <span className="text-red-400 text-sm mt-3 block italic bg-red-900/20 py-2 px-4 rounded-xl border border-red-500/20">{manualSyncError}</span>
             </p>
             <button 
               onClick={() => setManualSyncError(null)}
               className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-lg"
             >
               আবার চেষ্টা করুন (Retry)
             </button>
           </div>
        </div>
      )}

      {/* Cloud Sync Indicator (Background) - Suppressed if manual sync was recent */}
      {showSyncNotification && (
        <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 bg-slate-800/95 backdrop-blur-md border ${syncError ? 'border-red-500/50' : 'border-cyan-500/50'} px-5 py-2.5 rounded-full shadow-2xl transition-all duration-500 ${!syncError ? 'animate-pulse' : ''}`}>
          <div className={`w-2 h-2 ${syncError ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]'} rounded-full ${!syncError ? 'animate-ping' : ''}`}></div>
          <span className={`text-[10px] font-black ${syncError ? 'text-red-400' : 'text-cyan-400'} uppercase tracking-[0.2em]`}>
            {syncError ? 'Sync Failed (Offline)' : 'Update Synced'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
