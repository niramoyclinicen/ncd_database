import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Stethoscope, Building2, Pill, Calculator, TrendingUp, Settings, LogOut, Menu, X } from 'lucide-react';
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
import { useAppData } from './useAppData';

const SidebarLayout = ({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/diagnostic', icon: <Stethoscope size={20} />, label: 'Diagnostic' },
    { path: '/clinic', icon: <Building2 size={20} />, label: 'Clinic' },
    { path: '/medicine', icon: <Pill size={20} />, label: 'Pharmacy' },
    { path: '/accounting', icon: <Calculator size={20} />, label: 'Accounts' },
    { path: '/marketing', icon: <TrendingUp size={20} />, label: 'Marketing' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 overflow-hidden">
      {/* Mobile Menu Button */}
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 rounded-lg text-slate-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
            Niramoy Clinic
          </h1>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
              Niramoy Clinic
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => {
                onLogout();
                handleNavigate('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const data = useAppData();
  
  // Pending Dept Login State inside the layout so we don't reload the entire app
    const navigate = useNavigate();

  const RequireAuth = ({ children, requiredRole, dept, targetPath }: { children: React.ReactNode, requiredRole: UserRole, dept: keyof DepartmentPasswords, targetPath: string }) => {
    if (data.userRole !== requiredRole && data.userRole !== 'ADMIN') {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
           <DepartmentLogin 
             department={dept} 
             onLogin={(pwd) => handleDepartmentLogin(pwd, dept, requiredRole, targetPath)} 
             onBack={() => navigate('/')} 
           />
        </div>
      );
    }
    return <>{children}</>;
  };

  const handleDepartmentLogin = (password: string, dept: keyof DepartmentPasswords, role: UserRole, targetPath: string) => {
    const enteredPwd = password.trim();
    let storedPwd = (data.passwords[dept] || '').trim();
    if (dept === 'ADMIN' && !storedPwd) storedPwd = 'niramoy123';
    
    if (enteredPwd === storedPwd) {
      data.setUserRole(role);
      if (role === 'ADMIN') data.setIsAdminLoggedIn(true);
      navigate(targetPath);
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  if (data.connectionError && !data.isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border-2 border-red-500 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 text-4xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-white mb-4 font-['Hind_Siliguri']">সার্ভার কানেকশন সমস্যা</h2>
          <p className="text-slate-300 mb-4 font-medium">ইন্টারনেট কানেকশন চেক করুন। অনলাইনে ডাটা লোড না হওয়া পর্যন্ত সফটওয়্যারটি ব্যবহার করা যাবে না।</p>
          <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 transition-all py-4 rounded-2xl text-white font-bold text-xl shadow-lg mb-4">পুনরায় চেষ্টা করুন (RETRY)</button>
        </div>
      </div>
    );
  }

  if (!data.isDataLoaded) {
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


  return (
    <SidebarLayout onLogout={() => { data.setIsAdminLoggedIn(false); data.setUserRole('NONE'); }}>
      <Routes>
        <Route path="/" element={
          <Dashboard 
            onLogout={() => { data.setIsAdminLoggedIn(false); data.setUserRole('NONE'); }} 
            onNavigate={(view) => {
              // Map old view states to routes
              const routes: any = {
                'DIAGNOSTIC': '/diagnostic',
                'CLINIC': '/clinic',
                'MEDICINE': '/medicine',
                'ACCOUNTING': '/accounting',
                'MARKETING': '/marketing',
                'ADMIN_SETTINGS': '/settings',
                'DOCTOR_PORTAL': '/doctor-login'
              };
              navigate(routes[view] || '/');
            }} 
          />
        } />
        
        <Route path="/diagnostic" element={
          <RequireAuth requiredRole="DIAGNOSTIC_ADMIN" dept="DIAGNOSTIC" targetPath="/diagnostic">
            <DiagnosticPage 
              onBack={() => navigate('/')} 
              userRole={data.userRole}
              patients={data.patients} setPatients={data.setPatients}
              doctors={data.doctors} setDoctors={data.setDoctors}
              referrars={data.referrars} setReferrars={data.setReferrars}
              tests={data.tests} setTests={data.setTests}
              reagents={data.reagents} setReagents={data.setReagents}
              labInvoices={data.labInvoices} setLabInvoices={data.setLabInvoices}
              dueCollections={data.dueCollections} setDueCollections={data.setDueCollections}
              reports={data.reports} setReports={data.setReports} rtTemplates={data.rtTemplates} setRtTemplates={data.setRtTemplates}
              employees={data.employees} setEmployees={data.setEmployees}
              detailedExpenses={data.detailedExpenses}
              attendanceLog={data.attendanceLog} setAttendanceLog={data.setAttendanceLog}
              leaveLog={data.leaveLog} setLeaveLog={data.setLeaveLog}
              appointments={data.appointments} setAppointments={data.setAppointments}
              diagnosticSettings={data.diagnosticSettings} setDiagnosticSettings={data.setDiagnosticSettings}
              monthlyRoster={data.monthlyRoster} setMonthlyRoster={data.setMonthlyRoster}
              employeeReferrerMap={data.employeeReferrerMap} setEmployeeReferrerMap={data.setEmployeeReferrerMap}
              performBlockingSync={data.performBlockingSync}
              currentUserEmail={data.currentUserEmail}
            />
          </RequireAuth>
        } />

        <Route path="/clinic" element={
          <RequireAuth requiredRole="CLINIC_ADMIN" dept="CLINIC" targetPath="/clinic">
            <ClinicPage 
              onBack={() => navigate('/')}
              patients={data.patients} setPatients={data.setPatients}
              doctors={data.doctors} setDoctors={data.setDoctors}
              referrars={data.referrars} setReferrars={data.setReferrars}
              employees={data.employees}
              medicines={data.medicines} setMedicines={data.setMedicines}
              admissions={data.admissions} setAdmissions={data.setAdmissions}
              indoorInvoices={data.indoorInvoices} setIndoorInvoices={data.setIndoorInvoices}
              detailedExpenses={data.detailedExpenses}
              performBlockingSync={data.performBlockingSync}
            />
          </RequireAuth>
        } />

        <Route path="/medicine" element={
          <RequireAuth requiredRole="MEDICINE_ADMIN" dept="MEDICINE" targetPath="/medicine">
            <MedicinePage 
              onBack={() => navigate('/')}
              medicines={data.medicines} setMedicines={data.setMedicines}
              patients={data.patients} setPatients={data.setPatients}
              doctors={data.doctors} setDoctors={data.setDoctors}
              clinicalDrugs={data.clinicalDrugs} setClinicalDrugs={data.setClinicalDrugs}
              purchaseInvoices={data.purchaseInvoices} setPurchaseInvoices={data.setPurchaseInvoices}
              salesInvoices={data.salesInvoices} setSalesInvoices={data.setSalesInvoices}
              detailedExpenses={data.detailedExpenses} setDetailedExpenses={data.setDetailedExpenses}
              performBlockingSync={data.performBlockingSync}
            />
          </RequireAuth>
        } />

        <Route path="/accounting" element={
          <RequireAuth requiredRole="ACCOUNTING_ADMIN" dept="ACCOUNTING" targetPath="/accounting">
            <AccountingPage 
              onBack={() => navigate('/')}
              labInvoices={data.labInvoices}
              indoorInvoices={data.indoorInvoices}
              salesInvoices={data.salesInvoices}
              purchaseInvoices={data.purchaseInvoices}
              dueCollections={data.dueCollections}
              detailedExpenses={data.detailedExpenses}
              reagents={data.reagents}
              medicines={data.medicines}
              employees={data.employees}
              attendanceLog={data.attendanceLog}
            />
          </RequireAuth>
        } />

        <Route path="/marketing" element={
          <RequireAuth requiredRole="DIAGNOSTIC_ADMIN" dept="DIAGNOSTIC" targetPath="/marketing">
            <MarketingPage 
              onBack={() => navigate('/')}
              employees={data.employees}
              referrars={data.referrars}
              labInvoices={data.labInvoices}
              indoorInvoices={data.indoorInvoices}
              patients={data.patients}
              employeeReferrerMap={data.employeeReferrerMap}
              setEmployeeReferrerMap={data.setEmployeeReferrerMap}
              performBlockingSync={data.performBlockingSync}
            />
          </RequireAuth>
        } />

        <Route path="/settings" element={
          <RequireAuth requiredRole="ADMIN" dept="ADMIN" targetPath="/settings">
            <AdminSettings 
              onBack={() => navigate('/')}
              passwords={data.passwords}
              setPasswords={data.setPasswords}
              performBlockingSync={data.performBlockingSync}
              isManualSyncing={data.isManualSyncing}
              manualSyncError={data.manualSyncError}
            />
          </RequireAuth>
        } />

        <Route path="/doctor-login" element={
          <DoctorLogin 
            doctors={data.doctors} 
            onLogin={(doc) => navigate(`/doctor-portal/${doc.id}`)} 
            onBack={() => navigate('/')} 
          />
        } />

        <Route path="/doctor-portal/:doctorId" element={
          <DoctorPortal 
            doctors={data.doctors} 
            patients={data.patients} 
            prescriptions={data.prescriptions} 
            setPrescriptions={data.setPrescriptions} 
            clinicalDrugs={data.clinicalDrugs} 
            tests={data.tests} 
            appointments={data.appointments} 
            setAppointments={data.setAppointments}
            onBack={() => navigate('/')} 
            performBlockingSync={data.performBlockingSync} 
          />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
            {!['/', '/doctor-login', '/lab-login', '/settings'].includes(location.pathname) && <AIAssistant />}
    </SidebarLayout>
  );
};

const App = () => {
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const isIframe = new URLSearchParams(window.location.search).has('mobile_preview');

  return (
    <Router>
      <div className={isMobilePreview && !isIframe ? "fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[100000]" : "h-screen w-full"}>
         <div className={isMobilePreview && !isIframe ? "w-[375px] h-[812px] bg-slate-950 rounded-[3rem] border-[14px] border-black overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20 after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-32 after:h-6 after:bg-black after:rounded-b-3xl" : "h-full w-full"}>
           {isMobilePreview && !isIframe ? (
             <iframe src={`${window.location.pathname}?mobile_preview=1`} className="w-full h-full border-0 bg-slate-950" title="Mobile Preview" />
           ) : (
             <AppContent />
           )}
         </div>
      </div>
      
      {/* Floating Toggle Button - hidden inside iframe */}
      {!isIframe && (
        <button
          onClick={() => setIsMobilePreview(!isMobilePreview)}
          className="fixed top-4 right-4 z-[999999] bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-105 transition-all border-2 border-indigo-400 flex items-center gap-2 uppercase tracking-widest"
        >
          {isMobilePreview ? "📱 Exit Mobile View" : "📱 Test Mobile View"}
        </button>
      )}
    </Router>
  );
};

export default App;
