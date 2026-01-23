
import React from 'react';
import DashboardButton from './DashboardButton';
import { 
  DiagnosticIcon, ClinicIcon, MedicineIcon, AccountingIcon, MapPinIcon,
  StethoscopeIcon, SyringeIcon, WheelchairIcon, PhoneIcon, UsersIcon, FileTextIcon, SettingsIcon
} from './Icons';
import { ViewState } from '../types';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
}

const MedicalHexLogo = () => {
  const hexStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: '0.3s',
  };

  const HexCell = ({ content, isCenter = false }: { content: React.ReactNode, isCenter?: boolean }) => (
    <div 
      className={`
        relative flex justify-center items-center
        ${isCenter 
          ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-[0_0_25px_rgba(34,211,238,0.6)] z-20 border border-white/20' 
          : 'bg-cyan-900/30 border border-cyan-400/50 backdrop-blur-md hover:bg-cyan-500/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,200,255,0.4)] hover:z-20'
        }
      `}
      style={{
        ...hexStyle,
        width: isCenter ? '70px' : '60px',
        height: isCenter ? '70px' : '60px',
      }}
    >
      <div className={isCenter ? 'text-white drop-shadow-md animate-pulse' : 'text-cyan-400 drop-shadow'}>
        {content}
      </div>
    </div>
  );

  return (
    <div className="relative w-56 h-64 flex flex-col items-center justify-center -ml-12">
      <div className="absolute bottom-0 w-48 h-24 bg-[radial-gradient(circle,rgba(0,150,255,0.5),transparent)] rounded-[100%_100%_40%_40%] blur-xl animate-pulse" />
       <svg viewBox="0 0 100 60" className="absolute bottom-4 w-48 h-28 opacity-80 pointer-events-none z-0">
          <defs>
            <linearGradient id="wirehand" x1="0" y1="1" x2="0" y2="0">
               <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
               <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.5" />
               <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path d="M10,60 Q30,50 50,45 Q70,50 90,60" fill="url(#wirehand)" />
          <path d="M10,60 Q20,30 30,20 Q40,30 50,45" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
          <path d="M90,60 Q80,30 70,20 Q60,30 50,45" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
       </svg>
      <div className="relative w-48 h-48 z-10">
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<span className="text-2xl font-bold font-sans tracking-tight">NcD</span>} isCenter />
        </div>
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<StethoscopeIcon className="w-7 h-7" />} />
        </div>
        <div style={{ position: 'absolute', top: '31%', left: '83%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<MedicineIcon className="w-7 h-7" />} />
        </div>
        <div style={{ position: 'absolute', top: '69%', left: '83%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<WheelchairIcon className="w-7 h-7" />} />
        </div>
        <div style={{ position: 'absolute', top: '88%', left: '50%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<ClinicIcon className="w-7 h-7" />} />
        </div>
        <div style={{ position: 'absolute', top: '69%', left: '17%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<SyringeIcon className="w-7 h-7" />} />
        </div>
        <div style={{ position: 'absolute', top: '31%', left: '17%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<DiagnosticIcon className="w-7 h-7" />} />
        </div>
      </div>
    </div>
  );
};

const BackgroundRose = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10">
    <svg viewBox="0 0 500 500" className="w-[150%] h-[150%] text-rose-500 animate-spin-slow-reverse" style={{ animationDuration: '60s' }}>
      <g transform="translate(250,250)">
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(0) translate(20,0)" />
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(60) translate(20,0)" />
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(120) translate(20,0)" />
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(180) translate(20,0)" />
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(240) translate(20,0)" />
        <path d="M0,0 C50,-50 100,-50 150,0 C100,50 50,50 0,0" fill="currentColor" transform="rotate(300) translate(20,0)" />
        <circle cx="0" cy="0" r="30" fill="currentColor" opacity="0.5" />
      </g>
    </svg>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/40 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-transparent to-transparent blur-3xl" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent blur-3xl" />
          <BackgroundRose />
      </div>

      <div className="z-10 w-full max-w-7xl relative">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in-down mx-auto w-full max-w-5xl transition-transform duration-500">
            <div className="flex-shrink-0 hover:scale-105 transition-transform duration-500">
               <MedicalHexLogo />
            </div>
            <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right">
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-200 to-blue-500 mb-2 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] font-sans tracking-tight whitespace-nowrap">
                    Niramoy Clinic & Diagnostic
                </h1>
                <div className="flex items-center justify-center md:justify-end gap-2 text-teal-100 text-lg md:text-xl font-medium tracking-wider whitespace-nowrap mb-1">
                    <MapPinIcon className="w-5 h-5 text-teal-400" />
                    <span>এনায়েতপুর মন্ডলপাড়া, এনায়েতপুর, সিরাজগঞ্জ</span>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 text-cyan-300 font-bold text-lg md:text-xl tracking-[0.25em]">
                    <PhoneIcon className="w-5 h-5 text-cyan-400" />
                    <span>Mobile: 01730 923007</span>
                </div>
                <div className="w-full max-w-3xl h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4 opacity-70 md:ml-auto"></div>
            </div>
        </header>

        <div className="relative w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
              <DashboardButton 
                label={
                    <>
                        <span className="block text-3xl font-extrabold text-white mb-1 drop-shadow-sm">ডায়াগনস্টিক ডিপার্টমেন্ট</span>
                        <span className="block text-sm font-semibold text-cyan-200 mt-2 tracking-wider">Diagnostic Department</span>
                    </>
                } 
                icon={<DiagnosticIcon />} 
                onClick={() => onNavigate(ViewState.DIAGNOSTIC)} 
                colorFrom="from-cyan-500/40"
                colorTo="to-blue-600/40"
                borderColor="border-slate-700 hover:border-cyan-400"
                delay="100ms"
              />
              <DashboardButton 
                label={
                    <>
                        <span className="block text-3xl font-extrabold text-white mb-1 drop-shadow-sm">ক্লিনিক ডিপার্টমেন্ট</span>
                        <span className="block text-sm font-semibold text-emerald-200 mt-2 tracking-wider">Clinic Department</span>
                    </>
                } 
                icon={<ClinicIcon />} 
                onClick={() => onNavigate(ViewState.CLINIC)} 
                colorFrom="from-emerald-500/40"
                colorTo="to-teal-600/40"
                borderColor="border-slate-700 hover:border-emerald-400"
                delay="200ms"
              />
              <DashboardButton 
                label={
                    <>
                        <span className="block text-3xl font-extrabold text-white mb-1 drop-shadow-sm">মেডিসিন ডিপার্টমেন্ট</span>
                        <span className="block text-sm font-semibold text-rose-200 mt-2 tracking-wider">Medicine Department</span>
                    </>
                }
                icon={<MedicineIcon />} 
                onClick={() => onNavigate(ViewState.MEDICINE)} 
                colorFrom="from-rose-500/40"
                colorTo="to-pink-600/40"
                borderColor="border-slate-700 hover:border-rose-400"
                delay="300ms"
              />
              <DashboardButton 
                label={
                    <>
                        <span className="block text-3xl font-extrabold text-white mb-1 drop-shadow-sm">একাউন্টিং</span>
                        <span className="block text-sm font-semibold text-amber-200 mt-2 tracking-wider">Accounting</span>
                    </>
                }
                icon={<AccountingIcon />} 
                onClick={() => onNavigate(ViewState.ACCOUNTING)} 
                colorFrom="from-amber-500/30"
                colorTo="to-orange-600/30"
                borderColor="border-slate-700 hover:border-amber-400"
                delay="400ms"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] hidden md:flex">
                <div className="pointer-events-auto animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                    <button
                        onClick={() => onNavigate(ViewState.MARKETING)}
                        className="group relative w-80 h-36 rounded-[50%] bg-[#0f172a] border-2 border-cyan-500/60 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.9)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] hover:border-cyan-500 backdrop-blur-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[50%]" />
                        <div className="p-2 rounded-full text-cyan-400 group-hover:scale-110 transition-transform">
                            <UsersIcon size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white font-bengali tracking-wider drop-shadow-sm">মার্কেটিং ম্যানেজমেন্ট</span>
                            <span className="block text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] opacity-80">Marketing Management</span>
                        </div>
                        <div className="absolute -inset-1 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                    </button>
                </div>
            </div>
        </div>

        <div className="md:hidden mt-6 animate-fade-in-up">
             <button
                onClick={() => onNavigate(ViewState.MARKETING)}
                className="w-full bg-slate-800 p-6 rounded-2xl border border-cyan-500/50 flex items-center justify-center gap-4 shadow-md"
            >
                <UsersIcon className="text-cyan-400" size={24} />
                <span className="text-xl font-black text-white font-bengali">মার্কেটিং ম্যানেজমেন্ট</span>
            </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-16 animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <button onClick={() => onNavigate(ViewState.DOCTOR_LOGIN)} className="group relative px-8 py-3 rounded-full bg-slate-900/60 border border-blue-500/50 text-blue-300 font-bold transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/10 hover:text-white shadow-md active:scale-95 backdrop-blur-sm">
            <span className="relative z-10 flex items-center gap-2 text-lg"><StethoscopeIcon className="h-5 w-5" />Doctor Portal</span>
          </button>
          
          <button onClick={() => onNavigate(ViewState.LAB_LOGIN)} className="group relative px-8 py-3 rounded-full bg-slate-900/60 border border-cyan-500/50 text-cyan-300 font-bold transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-white shadow-md active:scale-95 backdrop-blur-sm">
            <span className="relative z-10 flex items-center gap-2 text-lg"><FileTextIcon className="h-5 w-5" />Lab Reporting</span>
          </button>

          <button onClick={onLogout} className="group relative px-8 py-3 rounded-full bg-slate-900/60 border border-slate-700 text-slate-300 font-bold transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 shadow-md active:scale-95 backdrop-blur-sm">
            <span className="relative z-10 flex items-center gap-2 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Admin Logout
            </span>
          </button>
        </div>

        <div className="fixed bottom-6 right-6 z-[100] animate-fade-in-up" style={{ animationDelay: '700ms' }}>
            <button 
                onClick={() => onNavigate(ViewState.ADMIN_SETTINGS)}
                className="w-14 h-14 bg-slate-800/80 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500 hover:scale-110 hover:rotate-90 transition-all duration-500 shadow-2xl backdrop-blur-xl"
                title="System Password Control"
            >
                <SettingsIcon size={28} />
            </button>
        </div>

        <div className="text-center mt-12 text-slate-500/60 text-sm font-medium tracking-wide">&copy; 2024 NiramoyClinic. All rights reserved.</div>
      </div>
    </div>
  );
};

export default Dashboard;
