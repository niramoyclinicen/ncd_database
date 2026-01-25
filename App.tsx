
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
  initialAppointments, initialClinicalDrugs, PrescriptionRecord, LabReport
} from './components/DiagnosticData';

const App: React.FC = () => {
  // --- GLOBAL STATE ---
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [userRole, setUserRole] = useState<UserRole>('NONE');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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
  const [detailedExpenses, setDetailedExpenses] = useState<Record<string, any[]>>({});
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [appointments, setAppointments] = useState(initialAppointments);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      const defaultData = {
        patients, doctors, referrars, tests, reagents, labInvoices, 
        dueCollections, reports, employees, medicines, clinicalDrugs,
        purchaseInvoices, salesInvoices, admissions, indoorInvoices,
        detailedExpenses, prescriptions, appointments
      };
      
      const loadedData = await dbService.loadFromCloud(defaultData);
      
      if (loadedData) {
        setPatients(loadedData.patients || []);
        setDoctors(loadedData.doctors || []);
        setReferrars(loadedData.referrars || []);
        setTests(loadedData.tests || []);
        setReagents(loadedData.reagents || []);
        setLabInvoices(loadedData.labInvoices || []);
        setDueCollections(loadedData.dueCollections || []);
        setReports(loadedData.reports || []);
        setEmployees(loadedData.employees || []);
        setMedicines(loadedData.medicines || []);
        setClinicalDrugs(loadedData.clinicalDrugs || []);
        setPurchaseInvoices(loadedData.purchaseInvoices || []);
        setSalesInvoices(loadedData.salesInvoices || []);
        setAdmissions(loadedData.admissions || []);
        setIndoorInvoices(loadedData.indoorInvoices || []);
        setDetailedExpenses(loadedData.detailedExpenses || {});
        setPrescriptions(loadedData.prescriptions || []);
        setAppointments(loadedData.appointments || []);
      }
      setIsDataLoaded(true);
    };
    loadData();
  }, []);

  // --- DATA SYNCING ---
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const syncData = async () => {
      const currentState = {
        patients, doctors, referrars, tests, reagents, labInvoices, 
        dueCollections, reports, employees, medicines, clinicalDrugs,
        purchaseInvoices, salesInvoices, admissions, indoorInvoices,
        detailedExpenses, prescriptions, appointments
      };
      await dbService.saveToCloud(currentState);
    };

    const debounceTimer = setTimeout(syncData, 2000);
    return () => clearTimeout(debounceTimer);
  }, [
    patients, doctors, referrars, tests, reagents, labInvoices, 
    dueCollections, reports, employees, medicines, clinicalDrugs,
    purchaseInvoices, salesInvoices, admissions, indoorInvoices,
    detailedExpenses, prescriptions, appointments, isDataLoaded
  ]);

  // --- HANDLERS ---
  const handleDepartmentLogin = (password: string, dept: keyof DepartmentPasswords, role: UserRole, targetView: ViewState) => {
    if (password === passwords[dept]) {
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
    
    // Set up department login requirements
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

  // --- RENDER LOGIC ---

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
    </div>
  );
};

export default App;
