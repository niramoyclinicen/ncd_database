import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BackIcon, UsersIcon, ClipboardIcon, BeakerIcon, StethoscopeIcon, UserPlusIcon,
  CalendarIcon, MoneyIcon, FileTextIcon, ChartIcon, SettingsIcon, Activity, DiagnosticIcon,
  TestTubeIcon, DnaIcon
} from './Icons';
import PatientInfoPage from './PatientInfoPage';
import DoctorInfoPage from './DoctorInfoPage';
import ReferrerInfoPage from './ReferrerInfoPage';
import ReagentInfoPage from './ReagentInfoPage';
import TestInfoPage from './TestInfoPage';
import DoctorAppointmentPage from './DoctorAppointmentPage';
import LabInvoicingPage from './LabInvoicingPage';
import PrevDueCollectionPage from './PrevDueCollectionPage';
import LabReportingPage from './LabReportingPage';
import EmployeeInfoPage from './EmployeeInfoPage';
import { Patient, Doctor, Referrar, Reagent, Test, LabInvoice, Employee, DueCollection, DiagnosticSubPage, ExpenseItem, LabReport, Appointment } from './DiagnosticData';
import { UserRole } from '../types';
import { dbService } from '../dbService';

interface DiagnosticPageProps {
  onBack: () => void;
  userRole?: UserRole;
  doctors?: Doctor[];
  setDoctors?: React.Dispatch<React.SetStateAction<Doctor[]>>;
  referrars?: Referrar[];
  setReferrars?: React.Dispatch<React.SetStateAction<Referrar[]>>;
  reagents?: Reagent[];
  setReagents?: React.Dispatch<React.SetStateAction<Reagent[]>>;
  tests?: Test[];
  setTests?: React.Dispatch<React.SetStateAction<Test[]>>;
  labInvoices?: LabInvoice[];
  invoices?: LabInvoice[];
  setLabInvoices?: React.Dispatch<React.SetStateAction<LabInvoice[]>>;
  dueCollections?: DueCollection[];
  setDueCollections?: React.Dispatch<React.SetStateAction<DueCollection[]>>;
  reports?: LabReport[];
  setReports?: React.Dispatch<React.SetStateAction<LabReport[]>>;
  rtTemplates?: any[];
  setRtTemplates?: React.Dispatch<React.SetStateAction<any[]>>;
  diagnosticSettings?: any;
  setDiagnosticSettings?: React.Dispatch<React.SetStateAction<any>>;
  employees?: Employee[];
  setEmployees?: React.Dispatch<React.SetStateAction<Employee[]>>;
  patients?: Patient[];
  setPatients?: React.Dispatch<React.SetStateAction<Patient[]>>;
  detailedExpenses?: Record<string, ExpenseItem[]>;
  setDetailedExpenses?: React.Dispatch<React.SetStateAction<Record<string, ExpenseItem[]>>>;
  attendanceLog?: Record<string, any>;
  setAttendanceLog?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  leaveLog?: Record<string, any>;
  setLeaveLog?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  appointments?: Appointment[];
  setAppointments?: React.Dispatch<React.SetStateAction<Appointment[]>>;
  monthlyRoster?: Record<string, string[]>;
  setMonthlyRoster?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  employeeReferrerMap?: Record<string, string[]>;
  setEmployeeReferrerMap?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  performBlockingSync?: (stateOverride?: any) => Promise<boolean>;
  currentUserEmail?: string;
}

// Standard Error Boundary to catch render crashes in sub-pages
class DiagnosticErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Diagnostic Page Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-950/20 border border-red-500/30 rounded-[2rem] text-red-200">
          <h2 className="text-2xl font-black mb-4">Module Error</h2>
          <p className="mb-6 opacity-80">This module encountered a technical error: {this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/40"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TopBarButton: React.FC<{ label: string; icon?: React.ReactNode; isActive: boolean; onClick: () => void; disabled?: boolean }> = ({ label, icon, isActive, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      relative group overflow-hidden
      flex flex-col md:flex-row items-center justify-center w-full px-3 py-2 shrink-0 min-w-[120px] md:min-w-0 md:shrink 
      rounded-xl font-bold text-xs md:text-sm tracking-wide
      transition-all duration-300 ease-out
      border
      ${isActive 
        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-400 text-white shadow-lg shadow-cyan-500/40 translate-y-0.5' 
        : disabled 
          ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed opacity-50'
          : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:shadow-md hover:shadow-cyan-900/20 hover:-translate-y-0.5'}
    `}
  >
    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full ${(!isActive && !disabled) ? 'group-hover:animate-shimmer' : ''}`} />
    {icon && <span className={`mb-1 md:mb-0 md:mr-2 ${isActive ? 'text-white' : disabled ? 'text-slate-800' : 'text-slate-500 group-hover:text-cyan-400'}`}>{icon}</span>}
    <span className="text-center z-10">{label}</span>
    {disabled && (
      <div className="absolute top-1 right-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    )}
  </button>
);

const SidebarItem: React.FC<{ label: string; icon: React.ReactNode; id: DiagnosticSubPage; activeTab: string; onClick: (id: DiagnosticSubPage) => void; disabled?: boolean; isSidebarOpen?: boolean }> = ({ label, icon, id, activeTab, onClick, disabled = false, isSidebarOpen = true }) => (
  <button
    title={label}
    onClick={() => !disabled && onClick(id)}
    disabled={disabled}
    className={`
      w-full flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4
      ${activeTab === id 
        ? 'bg-slate-800 text-cyan-400 border-cyan-500 shadow-[inset_0_2px_10_rgba(0,0,0,0.3)]' 
        : disabled 
          ? 'opacity-30 cursor-not-allowed border-transparent grayscale'
          : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-600'}
    `}
  >
    <span className={`mr-3 shrink-0 ${activeTab === id ? 'text-cyan-400' : 'text-slate-500'}`}>{icon}</span>
    {isSidebarOpen && <span className="whitespace-nowrap">{label}</span>}
  </button>
);

const DiagnosticPage: React.FC<DiagnosticPageProps> = ({ 
  onBack, userRole = 'ADMIN', 
  doctors = [], setDoctors = () => {}, 
  referrars = [], setReferrars = () => {},
  reagents = [], setReagents = () => {},
  tests = [], setTests = () => {},
  labInvoices, invoices, setLabInvoices = () => {},
  dueCollections = [], setDueCollections = () => {},
  reports = [], setReports = () => {}, 
  rtTemplates = [], setRtTemplates = () => {}, 
  diagnosticSettings = {}, setDiagnosticSettings = () => {},
  employees = [],
  setEmployees = () => {},
  patients = [], 
  setPatients = () => {},
  detailedExpenses = {}, setDetailedExpenses = () => {},
  attendanceLog = {}, setAttendanceLog = () => {}, 
  leaveLog = {}, setLeaveLog = () => {},
  appointments = [], setAppointments = () => {},
  monthlyRoster = {}, setMonthlyRoster = () => {},
  employeeReferrerMap = {}, setEmployeeReferrerMap = () => {},
  performBlockingSync,
  currentUserEmail = 'Anonymous'
}) => {
  const currentInvoices = useMemo(() => {
    return Array.isArray(labInvoices) ? labInvoices : (Array.isArray(invoices) ? invoices : []);
  }, [labInvoices, invoices]);

  const isLabReporter = userRole === 'LAB_REPORTER';
  const isDiagAdmin = userRole === 'DIAGNOSTIC_ADMIN';
  
  const [activeTab, setActiveTab] = useState<DiagnosticSubPage>(() => {
    if (isLabReporter) return 'lab_reporting';
    const saved = sessionStorage.getItem('ncd_diag_active_tab') as DiagnosticSubPage;
    if (saved && ['doctor_appointment', 'lab_invoice', 'due_collection', 'lab_reporting', 'report_delivery', 'test_info', 'reagent_info', 'diagnostic_accounts', 'marketing_overview'].includes(saved)) {
      return saved;
    }
    return 'doctor_appointment';
  });
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    try {
      sessionStorage.setItem('ncd_diag_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preSelectedInvoiceId, setPreSelectedInvoiceId] = useState<string | null>(null);
  const [moduleLock, setModuleLock] = useState<{isLocked: boolean, owner: string | null}>({isLocked: false, owner: null});

  // Handle Tab Switching with Concurrency Lock
  const handleTabChange = useCallback((tab: DiagnosticSubPage) => {
    const previousTab = activeTabRef.current;
    setActiveTab(tab);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    
    const syncLocks = async () => {
      try {
        if (previousTab === 'lab_invoice' && tab !== 'lab_invoice') {
          await dbService.releaseLock('lab_invoice', currentUserEmail);
        }
        if (tab === 'lab_invoice') {
          const lockResult = await dbService.acquireLock('lab_invoice', currentUserEmail);
          setModuleLock({ 
            isLocked: !lockResult.success, 
            owner: lockResult.success ? null : (lockResult.owner || 'Another user') 
          });
        } else {
          setModuleLock({ isLocked: false, owner: null });
        }
      } catch (err) {
        console.error("Lock sync error:", err);
      }
    };
    syncLocks();
  }, [currentUserEmail]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (activeTabRef.current === 'lab_invoice') {
        dbService.releaseLock('lab_invoice', currentUserEmail);
      }
    };
  }, [currentUserEmail]); // Dependencies adjusted to run mainly on true unmount or email change
  
  const renderContent = () => {
    try {
      if (!activeTab) return <div className="p-8 text-slate-500 font-bold">Initializing...</div>;

      switch (activeTab) {
        case 'doctor_appointment':
        return (
          <div className="animate-fade-in relative h-full flex flex-col">
            {isLabReporter && (
              <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                  Access Restriction: View Only Mode
                </div>
              </div>
            )}
            <DoctorAppointmentPage 
                patients={patients}
                setPatients={setPatients}
                doctors={doctors}
                setDoctors={setDoctors}
                referrars={referrars}
                setReferrars={setReferrars}
                invoices={currentInvoices}
                appointments={appointments}
                setAppointments={setAppointments}
                performBlockingSync={performBlockingSync}
            />
          </div>
        );
      case 'lab_invoice':
        return (
          <div className="animate-fade-in relative h-full flex flex-col">
             {isLabReporter && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                   Access Restriction: View Only Mode
                 </div>
               </div>
             )}
             
             {moduleLock.isLocked && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-500 text-black px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-3 border-2 border-amber-300 animate-bounce">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                 <span>সতর্কতা: "{moduleLock.owner}" বর্তমানে ল্যাব ইনভয়েস এ ডাটা এন্ট্রি করছেন। আপনি একই সাথে এন্ট্রি করতে পারবেন না।</span>
               </div>
             )}

            <LabInvoicingPage 
                patients={patients}
                setPatients={setPatients}
                doctors={doctors}
                setDoctors={setDoctors}
                referrars={referrars}
                setReferrars={setReferrars}
                tests={tests}
                setTests={setTests}
                reagents={reagents}
                setReagents={setReagents}
                employees={employees}
                onNavigateSubPage={handleTabChange}
                invoices={currentInvoices}
                setInvoices={setLabInvoices}
                monthlyRoster={monthlyRoster}
                initialInvoiceId={preSelectedInvoiceId}
                onClearInitialInvoice={() => setPreSelectedInvoiceId(null)}
                performBlockingSync={performBlockingSync}
                readOnly={moduleLock.isLocked}
            />
          </div>
        );
      case 'due_collection':
        return (
          <div className="animate-fade-in relative h-full flex flex-col">
             {isLabReporter && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                   Access Restriction: View Only Mode
                 </div>
               </div>
             )}
            <PrevDueCollectionPage 
                patients={patients}
                invoices={currentInvoices}
                setInvoices={setLabInvoices}
                dueCollections={dueCollections}
                setDueCollections={setDueCollections}
                employees={employees}
                onViewInvoice={(id) => {
                  setPreSelectedInvoiceId(id);
                  handleTabChange('lab_invoice');
                }}
                performBlockingSync={performBlockingSync}
            />
          </div>
        );
      case 'lab_reporting':
        return (
          <div className="animate-fade-in h-full relative flex flex-col">
             {isDiagAdmin && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[2px] flex items-center justify-center text-center p-6">
                 <div className="bg-slate-800 p-8 rounded-[2.5rem] border-2 border-rose-500/50 text-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.3)] max-w-md">
                   <Activity className="w-12 h-12 mx-auto mb-4" />
                   <h3 className="text-xl font-black uppercase mb-2">প্রবেশাধিকার সংরক্ষিত</h3>
                   <p className="text-sm font-bold text-slate-400">রিপোর্ট তৈরি করতে চাইলে দয়া করে ল্যাব রিপোর্টিং পোর্টাল (Lab Reporting Portal) ব্যবহার করে প্রবেশ করুন।</p>
                 </div>
               </div>
             )}
             <LabReportingPage 
                invoices={currentInvoices}
                setInvoices={setLabInvoices}
                reports={reports}
                setReports={setReports}
                rtTemplates={rtTemplates}
                setRtTemplates={setRtTemplates}
                diagnosticSettings={diagnosticSettings}
                setDiagnosticSettings={setDiagnosticSettings}
                patients={patients}
                employees={employees}
                tests={tests}
                doctors={doctors}
                referrars={referrars}
                performBlockingSync={performBlockingSync}
             />
          </div>
        );
      case 'patient_info':
        return <div className="animate-fade-in h-full flex flex-col"><PatientInfoPage patients={patients} setPatients={setPatients} performBlockingSync={performBlockingSync} /></div>;
      case 'doctor_info':
        return <div className="animate-fade-in h-full flex flex-col"><DoctorInfoPage doctors={doctors} setDoctors={setDoctors} performBlockingSync={performBlockingSync} /></div>;
      case 'referrer_info':
        return <div className="animate-fade-in h-full flex flex-col"><ReferrerInfoPage referrars={referrars} setReferrars={setReferrars} performBlockingSync={performBlockingSync} /></div>;
      case 'test_info':
        return <div className="animate-fade-in h-full flex flex-col"><TestInfoPage tests={tests} setTests={setTests} reagents={reagents} performBlockingSync={performBlockingSync} /></div>;
      case 'reagent_info':
        return <div className="animate-fade-in h-full flex flex-col"><ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} setDetailedExpenses={setDetailedExpenses} labInvoices={currentInvoices} tests={tests} performBlockingSync={performBlockingSync} /></div>;
      case 'employee_info':
        return (
            <div className="animate-fade-in h-full flex flex-col">
                {setEmployees ? (
                    <EmployeeInfoPage 
                      employees={employees} 
                      setEmployees={setEmployees} 
                      detailedExpenses={detailedExpenses} 
                      attendanceLog={attendanceLog}
                      setAttendanceLog={setAttendanceLog}
                      leaveLog={leaveLog}
                      setLeaveLog={setLeaveLog}
                      monthlyRoster={monthlyRoster}
                      setMonthlyRoster={setMonthlyRoster}
                      performBlockingSync={performBlockingSync}
                    />
                ) : (
                    <div className="text-center p-8 text-slate-500">Employee management is currently unavailable in this view.</div>
                )}
            </div>
        );
      default:
        return <div className="p-8 text-slate-500">Select a module from the sidebar.</div>;
      }
    } catch (error) {
      console.error("Diagnostic Shell Error:", error);
      return (
        <div className="p-10 bg-red-950/20 border border-red-500/30 rounded-[2rem] text-red-200">
          <h2 className="text-2xl font-black mb-4">Navigation Error</h2>
          <p className="mb-6 opacity-80">An unexpected error occurred while switching modules.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 rounded-xl font-bold">Reload Application</button>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">


      {/* Mobile Menu Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`
        absolute md:relative inset-y-0 left-0 z-40
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-16'} 
        bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-hidden pt-4
      `}>
        <div className="flex-1 overflow-y-auto py-4">
            <div className={`px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${!isSidebarOpen ? 'md:opacity-0' : 'opacity-100'}`}>
              Data Entry / Setup
            </div>
            <div className="space-y-1">
              <SidebarItem id="patient_info" label="Patient Information" isSidebarOpen={isSidebarOpen} icon={<UsersIcon className="w-5 h-5" />} activeTab={activeTab} onClick={handleTabChange} disabled={isLabReporter} />
              <SidebarItem id="doctor_info" label="Doctor Information" isSidebarOpen={isSidebarOpen} icon={<StethoscopeIcon className="w-5 h-5" />} activeTab={activeTab} onClick={handleTabChange} disabled={isLabReporter} />
              <SidebarItem id="referrer_info" label="Referrer Information" isSidebarOpen={isSidebarOpen} icon={<UserPlusIcon className="w-5 h-5" />} activeTab={activeTab} onClick={handleTabChange} disabled={isLabReporter} />
              <SidebarItem id="test_info" label="Test Information" isSidebarOpen={isSidebarOpen} icon={<DnaIcon className="w-5 h-5" />} activeTab={activeTab} onClick={handleTabChange} disabled={isLabReporter} />
              <SidebarItem id="reagent_info" label="Reagent Information" isSidebarOpen={isSidebarOpen} icon={<TestTubeIcon className="w-5 h-5" />} activeTab={activeTab} onClick={handleTabChange} disabled={isLabReporter} />
            </div>

            <div className={`mt-8 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${!isSidebarOpen ? 'md:opacity-0' : 'opacity-100'}`}>
              System
            </div>
            <div className="space-y-1">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Collapse Menu" : "Expand Menu"} className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent transition-colors">
                  <BackIcon className={`w-5 h-5 shrink-0 mr-3 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">Collapse Menu</span>}
               </button>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto">
           <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isLabReporter ? 'bg-blue-900 text-blue-300' : 'bg-cyan-900 text-cyan-300'}`}>
                {isLabReporter ? 'LR' : 'AD'}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 overflow-hidden">
                   <p className="text-sm font-medium text-slate-200 truncate">{isLabReporter ? 'Lab Reporter' : 'Admin'}</p>
                   <p className="text-xs text-slate-500 truncate">Diagnostic Dept</p>
                </div>
              )}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shrink-0 shadow-sm z-20 relative">
          <div className="flex flex-col md:flex-row items-center justify-between relative w-full px-2 sm:px-4">
             
             {/* Top Row for Mobile (Hamburger + Diagnostic Title) */}
             <div className="w-full flex items-center justify-between md:hidden mb-2">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2.5 rounded-lg bg-cyan-900/50 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-800 transition-all border border-cyan-800/50 flex items-center gap-2"
                  title="Menu"
                >
                  <span className="text-xl leading-none">☰</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Menu</span>
                </button>
                <div className="flex items-center">
                    <DiagnosticIcon className="w-6 h-6 text-cyan-400 mr-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                    <h2 className="text-lg font-bold text-cyan-400 font-bengali drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] leading-none whitespace-nowrap">
                        ডায়াগনস্টিক ডিপার্টমেন্ট
                    </h2>
                </div>
             </div>

             <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-center md:justify-start">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all hidden md:block"
                  title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  <SettingsIcon className={`w-5 h-5 transition-transform duration-500 ${isSidebarOpen ? 'rotate-90' : ''}`} />
                </button>
                <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
                  <h1 className="text-[1.1rem] sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 leading-tight tracking-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    Niramoy Clinic and Diagnostic
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-400 font-medium">Enayetpur, Sirajgonj | Ph: 01730 923007</p>
                </div>
             </div>
             
             {/* Desktop Diagnostic Title */}
             <div className="hidden md:flex items-center mt-3 md:mt-0 z-10">
                <DiagnosticIcon className="w-8 h-8 text-cyan-400 mr-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <div className="flex flex-col items-end">
                   <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 font-bengali drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] leading-none text-right">
                     ডায়াগনস্টিক ডিপার্টমেন্ট
                   </h2>
                   <p className="text-[10px] md:text-xs font-bold text-slate-500 font-bengali tracking-tight mt-1">
                     গভমেন্ট লাইসেন্স: HSM41671
                   </p>
                </div>
             </div>
          </div>
        </header>

        <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 z-20 p-2">
           <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-2 md:gap-4 w-full px-2 pb-2 scrollbar-hide">
              <TopBarButton 
                label="Doctor Appointment" 
                icon={<CalendarIcon className="w-5 h-5" />} 
                isActive={activeTab === 'doctor_appointment'} 
                onClick={() => handleTabChange('doctor_appointment')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Lab Invoice" 
                icon={<MoneyIcon className="w-5 h-5" />} 
                isActive={activeTab === 'lab_invoice'} 
                onClick={() => handleTabChange('lab_invoice')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Previous Due Collection" 
                icon={<Activity className="w-5 h-5" />} 
                isActive={activeTab === 'due_collection'} 
                onClick={() => handleTabChange('due_collection')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Lab Reporting" 
                icon={<FileTextIcon className="w-5 h-5" />} 
                isActive={activeTab === 'lab_reporting'} 
                onClick={() => handleTabChange('lab_reporting')} 
                disabled={isDiagAdmin}
              />
           </div>
        </div>

        <div className={`flex-1 flex flex-col min-h-0 ${activeTab === 'lab_reporting' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'} bg-slate-900/50 relative`}>
          <DiagnosticErrorBoundary key={activeTab}>
            <div className="w-full flex-1 flex flex-col min-h-0">
              {renderContent()}
            </div>
          </DiagnosticErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default DiagnosticPage;