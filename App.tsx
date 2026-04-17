
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

  // Authentication & Passwords
  const [passwords, setPasswords] = useState<DepartmentPasswords>(() => {
    const saved = localStorage.getItem('ncd_passwords');
    return saved ? JSON.parse(saved) : {
      DIAGNOSTIC: 'diag123',
      LAB_REPORTING: 'lab123',
      CLINIC: 'clinic123',
      ACCOUNTING: 'acc123',
      MEDICINE: 'med123',
      ADMIN: 'admin123'
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

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await dbService.loadFromCloud();
      
      if (loadedData) {
        if (Object.keys(loadedData).length > 0) {
          if (loadedData.patients) setPatients(loadedData.patients);
          if (loadedData.doctors) setDoctors(loadedData.doctors);
          if (loadedData.referrars) setReferrars(loadedData.referrars);
          if (loadedData.tests) setTests(loadedData.tests);
          if (loadedData.reagents) setReagents(loadedData.reagents);
          if (loadedData.labInvoices) setLabInvoices(loadedData.labInvoices);
          if (loadedData.dueCollections) setDueCollections(loadedData.dueCollections);
          if (loadedData.reports) setReports(loadedData.reports);
          if (loadedData.employees) setEmployees(loadedData.employees);
          if (loadedData.medicines) setMedicines(loadedData.medicines);
          if (loadedData.clinicalDrugs) setClinicalDrugs(loadedData.clinicalDrugs);
          if (loadedData.purchaseInvoices) setPurchaseInvoices(loadedData.purchaseInvoices);
          if (loadedData.salesInvoices) setSalesInvoices(loadedData.salesInvoices);
          if (loadedData.admissions) setAdmissions(loadedData.admissions);
          if (loadedData.indoorInvoices) setIndoorInvoices(loadedData.indoorInvoices);
          if (loadedData.detailedExpenses) setDetailedExpenses(loadedData.detailedExpenses);
          if (loadedData.prescriptions) setPrescriptions(loadedData.prescriptions);
          if (loadedData.appointments) setAppointments(loadedData.appointments);
          if (loadedData.attendanceLog) setAttendanceLog(loadedData.attendanceLog);
          if (loadedData.leaveLog) setLeaveLog(loadedData.leaveLog);
          if (loadedData.monthlyRoster) setMonthlyRoster(loadedData.monthlyRoster);
        }
        
        setIsDataLoaded(true);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    };
    loadData();
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  // --- DATA SYNCING ---
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const currentState = {
      patients, doctors, referrars, tests, reagents, labInvoices, 
      dueCollections, reports, employees, medicines, clinicalDrugs,
      purchaseInvoices, salesInvoices, admissions, indoorInvoices,
      detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster,
      last_updated_at: new Date().toISOString()
    };
    
    const syncData = async () => {
      setIsSyncing(true);
      const result = await dbService.saveToCloud(currentState);
      setIsSyncing(false);
      setSyncError(!result.success);
    };

    const syncInterval = setTimeout(syncData, 300);
    return () => clearTimeout(syncInterval);
  }, [
    patients, doctors, referrars, tests, reagents, labInvoices, 
    dueCollections, reports, employees, medicines, clinicalDrugs,
    purchaseInvoices, salesInvoices, admissions, indoorInvoices,
    detailedExpenses, prescriptions, appointments, attendanceLog, leaveLog, monthlyRoster, employeeReferrerMap, isDataLoaded
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

  if (connectionError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border-2 border-red-500/50 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-4">ইন্টারনেট কানেকশন নেই!</h2>
          <p className="text-slate-400 mb-8">সফটওয়্যারটি এখন সরাসরি অনলাইন মোডে কাজ করছে। ডাটা দেখার জন্য আপনার ইন্টারনেট কানেকশন প্রয়োজন। দয়া করে ইন্টারনেট চেক করে আবার চেষ্টা করুন।</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest"
          >
            আবার চেষ্টা করুন (Retry)
          </button>
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
            setReagents={setReagents}
            attendanceLog={attendanceLog} setAttendanceLog={setAttendanceLog}
            leaveLog={leaveLog} setLeaveLog={setLeaveLog}
            monthlyRoster={monthlyRoster} setMonthlyRoster={setMonthlyRoster}
            patients={patients}
            doctors={doctors}
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
