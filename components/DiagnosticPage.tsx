import React, { useState, useEffect } from 'react';
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
import ContributionReportPage from './ContributionReportPage';
import EmployeeInfoPage from './EmployeeInfoPage';
import { Patient, Doctor, Referrar, Reagent, Test, LabInvoice, Employee, DueCollection, DiagnosticSubPage, ExpenseItem, LabReport, Appointment } from './DiagnosticData';
import { UserRole } from '../types';

interface DiagnosticPageProps {
  onBack: () => void;
  userRole?: UserRole;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  referrars: Referrar[];
  setReferrars: React.Dispatch<React.SetStateAction<Referrar[]>>;
  reagents: Reagent[];
  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;
  tests: Test[];
  setTests: React.Dispatch<React.SetStateAction<Test[]>>;
  labInvoices: LabInvoice[];
  setLabInvoices: React.Dispatch<React.SetStateAction<LabInvoice[]>>;
  dueCollections: DueCollection[];
  setDueCollections: React.Dispatch<React.SetStateAction<DueCollection[]>>;
  reports: LabReport[];
  setReports: React.Dispatch<React.SetStateAction<LabReport[]>>;
  employees: Employee[];
  setEmployees?: React.Dispatch<React.SetStateAction<Employee[]>>;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  detailedExpenses?: Record<string, ExpenseItem[]>;
  attendanceLog: Record<string, any>;
  setAttendanceLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  leaveLog: Record<string, any>;
  setLeaveLog: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  monthlyRoster: Record<string, string[]>;
  setMonthlyRoster: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const DiagnosticPage: React.FC<DiagnosticPageProps> = ({ 
  onBack, userRole = 'ADMIN', doctors, setDoctors, 
  referrars, setReferrars,
  reagents, setReagents,
  tests, setTests,
  labInvoices, setLabInvoices,
  dueCollections, setDueCollections,
  reports, setReports,
  employees,
  setEmployees,
  patients, 
  setPatients,
  detailedExpenses,
  attendanceLog, setAttendanceLog, leaveLog, setLeaveLog,
  appointments, setAppointments,
  monthlyRoster, setMonthlyRoster
}) => {
  const isLabReporter = userRole === 'LAB_REPORTER';
  const isDiagAdmin = userRole === 'DIAGNOSTIC_ADMIN';
  
  const [activeTab, setActiveTab] = useState<DiagnosticSubPage>(isLabReporter ? 'lab_reporting' : 'doctor_appointment');
  const [employeeReferrerMap, setEmployeeReferrerMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isLabReporter) {
        setActiveTab('lab_reporting');
    }
  }, [isLabReporter]);

  const renderContent = () => {
    switch (activeTab) {
      case 'doctor_appointment':
        return (
          <div className="animate-fade-in relative h-full">
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
                invoices={labInvoices}
                appointments={appointments}
                setAppointments={setAppointments}
            />
          </div>
        );
      case 'lab_invoice':
        return (
          <div className="animate-fade-in relative h-full">
             {isLabReporter && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                   Access Restriction: View Only Mode
                 </div>
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
                employees={employees}
                onNavigateSubPage={setActiveTab}
                invoices={labInvoices}
                setInvoices={setLabInvoices}
                monthlyRoster={monthlyRoster}
            />
          </div>
        );
      case 'due_collection':
        return (
          <div className="animate-fade-in relative h-full">
             {isLabReporter && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                   Access Restriction: View Only Mode
                 </div>
               </div>
             )}
            <PrevDueCollectionPage 
                invoices={labInvoices}
                setInvoices={setLabInvoices}
                dueCollections={dueCollections}
                setDueCollections={setDueCollections}
                employees={employees}
            />
          </div>
        );
      case 'lab_reporting':
        return (
          <div className="animate-fade-in h-full relative">
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
                invoices={labInvoices}
                setInvoices={setLabInvoices}
                reports={reports}
                setReports={setReports}
                patients={patients}
                employees={employees}
                tests={tests}
                doctors={doctors}
                referrars={referrars}
             />
          </div>
        );
      case 'contribution_report':
        return (
          <div className="animate-fade-in h-full relative">
             {isLabReporter && (
               <div className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="bg-slate-800 p-6 rounded-3xl border border-blue-500/30 text-blue-400 font-bold shadow-2xl">
                   Access Restriction: View Only Mode
                 </div>
               </div>
             )}
            <ContributionReportPage 
                employees={employees}
                referrars={referrars}
                invoices={labInvoices}
                employeeReferrerMap={employeeReferrerMap}
                setEmployeeReferrerMap={setEmployeeReferrerMap}
            />
          </div>
        );
      case 'patient_info':
        return <div className="animate-fade-in"><PatientInfoPage patients={patients} setPatients={setPatients} /></div>;
      case 'doctor_info':
        return <div className="animate-fade-in"><DoctorInfoPage doctors={doctors} setDoctors={setDoctors} /></div>;
      case 'referrer_info':
        return <div className="animate-fade-in"><ReferrerInfoPage referrars={referrars} setReferrars={setReferrars} /></div>;
      case 'test_info':
        return <div className="animate-fade-in"><TestInfoPage tests={tests} setTests={setTests} reagents={reagents} /></div>;
      case 'reagent_info':
        return <div className="animate-fade-in"><ReagentInfoPage reagents={reagents} setReagents={setReagents} /></div>;
      case 'employee_info':
        return (
            <div className="animate-fade-in">
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
                    />
                ) : (
                    <div className="text-center p-8 text-slate-500">Employee management is currently unavailable in this view.</div>
                )}
            </div>
        );
      default:
        return null;
    }
  };

  const TopBarButton: React.FC<{ label: string; icon?: React.ReactNode; isActive: boolean; onClick: () => void; disabled?: boolean }> = ({ label, icon, isActive, onClick, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group overflow-hidden
        flex flex-col md:flex-row items-center justify-center w-full px-3 py-2 
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

  const SidebarItem: React.FC<{ label: string; icon: React.ReactNode; id: DiagnosticSubPage; disabled?: boolean }> = ({ label, icon, id, disabled = false }) => (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      className={`
        w-full flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4
        ${activeTab === id 
          ? 'bg-slate-800 text-cyan-400 border-cyan-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]' 
          : disabled 
            ? 'opacity-30 cursor-not-allowed border-transparent grayscale'
            : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-600'}
      `}
    >
      <span className={`mr-3 ${activeTab === id ? 'text-cyan-400' : 'text-slate-500'}`}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-20 shadow-2xl hidden md:flex pt-48">
        <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Data Entry / Setup
            </div>
            <div className="space-y-1">
              <SidebarItem id="patient_info" label="Patient Information" icon={<UsersIcon className="w-5 h-5" />} disabled={isLabReporter} />
              <SidebarItem id="doctor_info" label="Doctor Information" icon={<StethoscopeIcon className="w-5 h-5" />} disabled={isLabReporter} />
              <SidebarItem id="referrer_info" label="Referrer Information" icon={<UserPlusIcon className="w-5 h-5" />} disabled={isLabReporter} />
              <SidebarItem id="test_info" label="Test Information" icon={<DnaIcon className="w-5 h-5" />} disabled={isLabReporter} />
              <SidebarItem id="reagent_info" label="Reagent Information" icon={<TestTubeIcon className="w-5 h-5" />} disabled={isLabReporter} />
            </div>

            <div className="mt-8 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System
            </div>
            <div className="space-y-1">
               <button onClick={onBack} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 border-l-4 border-transparent transition-colors">
                  <BackIcon className="w-5 h-5 mr-3" />
                  Logout / Exit
               </button>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto">
           <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isLabReporter ? 'bg-blue-900 text-blue-300' : 'bg-cyan-900 text-cyan-300'}`}>
                {isLabReporter ? 'LR' : 'AD'}
              </div>
              <div className="ml-3">
                 <p className="text-sm font-medium text-slate-200">{isLabReporter ? 'Lab Reporter' : 'Admin'}</p>
                 <p className="text-xs text-slate-500">Diagnostic Dept</p>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shrink-0 shadow-sm z-20 relative">
          <div className="flex flex-col md:flex-row items-center justify-between relative w-full px-4">
             <div className="flex flex-col items-center md:items-start z-10">
                <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-100 leading-tight tracking-tight mb-1">
                  Niramoy Clinic and Diagnostic
                </h1>
                <p className="text-sm md:text-base text-slate-400 font-medium">Enayetpur, Sirajgonj | Phone: 01730 923007</p>
             </div>
             <div className="flex items-center mt-3 md:mt-0 z-10">
                <DiagnosticIcon className="w-8 h-8 text-cyan-400 mr-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <div className="flex flex-col items-end">
                   <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 font-bengali drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] leading-none">
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
           <div className="grid grid-cols-5 gap-2 md:gap-4 w-full px-2">
              <TopBarButton 
                label="Doctor Appointment" 
                icon={<CalendarIcon className="w-5 h-5" />} 
                isActive={activeTab === 'doctor_appointment'} 
                onClick={() => setActiveTab('doctor_appointment')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Lab Invoice" 
                icon={<MoneyIcon className="w-5 h-5" />} 
                isActive={activeTab === 'lab_invoice'} 
                onClick={() => setActiveTab('lab_invoice')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Previous Due Collection" 
                icon={<Activity className="w-5 h-5" />} 
                isActive={activeTab === 'due_collection'} 
                onClick={() => setActiveTab('due_collection')} 
                disabled={isLabReporter}
              />
              <TopBarButton 
                label="Lab Reporting" 
                icon={<FileTextIcon className="w-5 h-5" />} 
                isActive={activeTab === 'lab_reporting'} 
                onClick={() => setActiveTab('lab_reporting')} 
                disabled={isDiagAdmin}
              />
              <TopBarButton 
                label="Contribution Report" 
                icon={<ChartIcon className="w-5 h-5" />} 
                isActive={activeTab === 'contribution_report'} 
                onClick={() => setActiveTab('contribution_report')} 
                disabled={isLabReporter}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/50 relative z-10">
          <div className="w-full h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiagnosticPage;