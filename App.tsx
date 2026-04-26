
import React, { useState, useEffect, useCallback } from 'react';
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

    // Helper to batch state updates
    const updateLocalState = (data: any) => {
      if (data.patients) setPatients(data.patients);
      if (data.doctors) setDoctors(data.doctors);
      if (data.referrars) setReferrars(data.referrars);
      if (data.tests) setTests(data.tests);
      if (data.reagents) setReagents(data.reagents);
      if (data.labInvoices) setLabInvoices(data.labInvoices);
      if (data.dueCollections) setDueCollections(data.dueCollections);
      if (data.reports) setReports(data.reports);
      if (data.employees) setEmployees(data.employees);
      if (data.medicines) setMedicines(data.medicines);
      if (data.clinicalDrugs) setClinicalDrugs(data.clinicalDrugs);
      if (data.purchaseInvoices) setPurchaseInvoices(data.purchaseInvoices);
      if (data.salesInvoices) setSalesInvoices(data.salesInvoices);
      if (data.admissions) setAdmissions(data.admissions);
      if (data.indoorInvoices) setIndoorInvoices(data.indoorInvoices);
      if (data.detailedExpenses) setDetailedExpenses(data.detailedExpenses);
      if (data.prescriptions) setPrescriptions(data.prescriptions);
      if (data.appointments) setAppointments(data.appointments);
      if (data.attendanceLog) setAttendanceLog(data.attendanceLog);
      if (data.leaveLog) setLeaveLog(data.leaveLog);
      if (data.monthlyRoster) setMonthlyRoster(data.monthlyRoster);
      if (data.diagnosticSettings) setDiagnosticSettings(data.diagnosticSettings);
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

  // Helper to get current state for syncing
  const getCurrentState = useCallback((overrides: any = {}) => {
    return {
      patients, doctors, referrars, tests, reagents, labInvoices, 
      dueCollections, reports, employees, medicines, clinicalDrugs,
      purchaseInvoices, salesInvoices, admissions, indoorInvoices,
      detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster,
      diagnosticSettings,
      last_updated_at: new Date().toISOString(),
      ...overrides
    };
  }, [patients, doctors, referrars, tests, reagents, labInvoices, dueCollections, reports, employees, medicines, clinicalDrugs, purchaseInvoices, salesInvoices, admissions, indoorInvoices, detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster, diagnosticSettings]);

  // Blocking Manual Sync Handler
  const performBlockingSync = useCallback(async (overrides?: any) => {
    setIsManualSyncing(true);
    setManualSyncError(null);
    
    // Merge overrides with current state if any, otherwise use current state
    const stateToSync = getCurrentState(overrides);
    
    try {
      const result = await dbService.saveToCloud(stateToSync);
      if (result.success) {
        setIsManualSyncing(false);
        setSyncError(false);
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
      setIsSyncing(true);
      const result = await dbService.saveToCloud(getCurrentState());
      setIsSyncing(false);
      setSyncError(!result.success);
    };

    const syncInterval = setTimeout(syncData, 500);
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

      {/* BLOCKING MANUAL SYNC OVERLAY */}
      {isManualSyncing && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <h2 className="text-2xl font-black uppercase tracking-[0.2em] animate-pulse">ডাটা সেভ হচ্ছে...</h2>
           <p className="mt-2 text-slate-400 font-medium">অনুগ্রহ করে অপেক্ষা করুন, সার্ভারে ডাটা পাঠানো হচ্ছে।</p>
           <p className="mt-1 text-xs text-blue-400 opacity-70 italic">Saving to cloud, please do not close the window...</p>
        </div>
      )}

      {/* MANUAL SYNC ERROR MODAL */}
      {manualSyncError && (
        <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
           <div className="bg-slate-800 border-2 border-red-500 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-4xl mb-6">⚠️</div>
             <h3 className="text-2xl font-black text-white uppercase mb-2">সেভ ব্যর্থ হয়েছে!</h3>
             <p className="text-slate-300 mb-8 leading-relaxed font-medium">
               আপনার ইন্টারনেট কানেকশন চেক করুন। সার্ভারে ডাটা পাঠাতে ব্যর্থ হয়েছে। 
               <br/>
               <span className="text-red-400 text-sm mt-2 block italic">{manualSyncError}</span>
             </p>
             <button 
               onClick={() => setManualSyncError(null)}
               className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95"
             >
               আবার চেষ্টা করুন (Retry)
             </button>
           </div>
        </div>
      )}

      {/* Cloud Sync Indicator */}
      {(isSyncing || syncError) && (
        <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border ${syncError ? 'border-red-500/50' : 'border-cyan-500/50'} px-4 py-2 rounded-full shadow-lg ${!syncError ? 'animate-pulse' : ''}`}>
          <div className={`w-2 h-2 ${syncError ? 'bg-red-500' : 'bg-cyan-500'} rounded-full ${!syncError ? 'animate-ping' : ''}`}></div>
          <span className={`text-[10px] font-bold ${syncError ? 'text-red-400' : 'text-cyan-400'} uppercase tracking-widest`}>
            {syncError ? 'Sync Failed (Offline)' : 'Syncing to Cloud...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
