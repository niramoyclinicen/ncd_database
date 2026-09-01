import React from 'react';
import DashboardButton from './DashboardButton';
import { 
  DiagnosticIcon, ClinicIcon, MedicineIcon, AccountingIcon, MapPinIcon, 
  StethoscopeIcon, SyringeIcon, WheelchairIcon, PhoneIcon, UsersIcon, FileTextIcon, SettingsIcon,
  TrendingUpIcon
} from './Icons';
import { ViewState } from '../types';

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
}

const HexCell = ({ content, isCenter = false, hexStyle }: { content: React.ReactNode, isCenter?: boolean, hexStyle: React.CSSProperties }) => (
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
  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center origin-left scale-75 md:scale-90 lg:scale-100">
      <div className="absolute bottom-4 w-40 h-20 bg-[radial-gradient(circle,rgba(0,150,255,0.4),transparent)] rounded-[100%_100%_40%_40%] blur-xl animate-pulse" /> 
      
      <svg viewBox="0 0 100 60" className="absolute bottom-8 w-40 h-24 opacity-80 pointer-events-none z-0">
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
           <HexCell content={<span className="text-2xl font-bold font-sans tracking-tight">NcD</span>} isCenter hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<StethoscopeIcon className="w-7 h-7" />} hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '31%', left: '83%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<MedicineIcon className="w-7 h-7" />} hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '69%', left: '83%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<WheelchairIcon className="w-7 h-7" />} hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '88%', left: '50%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<ClinicIcon className="w-7 h-7" />} hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '69%', left: '17%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<SyringeIcon className="w-7 h-7" />} hexStyle={hexStyle} />
        </div>
        <div style={{ position: 'absolute', top: '31%', left: '17%', transform: 'translate(-50%, -50%)' }}>
           <HexCell content={<DiagnosticIcon className="w-7 h-7" />} hexStyle={hexStyle} />
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
    <div className="min-h-[100dvh] w-full flex flex-col relative overflow-x-hidden overflow-y-auto bg-slate-950">
      
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/40 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-transparent to-transparent blur-3xl" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent blur-3xl" />
          <BackgroundRose />
      </div>

      {/* Main Content Wrapper (Uses flex to stretch and center within viewport - No Scroll) */}
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-2 sm:py-3 md:px-6 md:py-3 z-10 justify-between h-[100dvh] max-h-[100dvh] overflow-hidden">
          
          {/* HEADER - Compact margins to keep it high up */}
          <header className="flex-none flex flex-col lg:flex-row items-center justify-between gap-1 lg:gap-6 w-full animate-fade-in-down">
              <div className="flex-shrink-0 hover:scale-105 transition-transform duration-500 origin-center lg:origin-left">
                 <MedicalHexLogo />
              </div>
              <div className="flex flex-col items-center lg:items-end justify-center text-center lg:text-right w-full">
                  <h1 className="text-[1.2rem] sm:text-2xl md:text-3xl lg:text-[2.2rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-200 to-blue-500 mb-0.5 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] font-sans tracking-tight">
                      Niramoy Clinic & Diagnostic
                  </h1>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-1.5 sm:gap-3 lg:gap-4 text-teal-100 text-xs sm:text-sm md:text-base font-medium tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-4 h-4 text-teal-400" />
                        <span>এনায়েতপুর মন্ডলপাড়া, সিরাজগঞ্জ</span>
                      </div>
                      <div className="hidden sm:block text-teal-500/50">|</div>
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold tracking-[0.15em] lg:tracking-[0.2em]">
                        <PhoneIcon className="w-4 h-4 text-cyan-400" />
                        <span>০১৩২৪-৪১৪০৯৯</span>
                      </div>
                  </div>
                  <div className="hidden lg:block w-full max-w-2xl h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-1.5 opacity-70 ml-auto"></div>
              </div>
          </header>

          {/* GRID SECTION - Centered vertically in static view, stretched outwards horizontally and vertically */}
          <main className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto relative my-auto py-1">
              
              {/* 2x2 Grid Container with Dead-Center Floating Marketing Management Badge */}
              <div className="relative w-full px-1 sm:px-2 md:px-4">
                
                {/* 2x2 Grid with balanced spacing so center badge does not cover card contents and boxes stretch wide and tall */}
                <div className="grid grid-cols-2 gap-x-8 sm:gap-x-16 md:gap-x-24 lg:gap-x-32 gap-y-8 sm:gap-y-12 md:gap-y-16 lg:gap-y-20 w-full relative z-10">
                  <DashboardButton 
                    label={
                        <>
                            <span className="block text-base sm:text-xl lg:text-2xl font-extrabold text-white mb-0.5 drop-shadow-sm tracking-normal">ডায়াগনস্টিক ম্যানেজমেন্ট</span>
                            <span className="block text-[9px] sm:text-xs lg:text-sm font-semibold text-cyan-200 mt-0.5 lg:mt-1 tracking-widest uppercase">Diagnostic Management</span>
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
                            <span className="block text-base sm:text-xl lg:text-2xl font-extrabold text-white mb-0.5 drop-shadow-sm tracking-normal">ক্লিনিক ম্যানেজমেন্ট</span>
                            <span className="block text-[9px] sm:text-xs lg:text-sm font-semibold text-emerald-200 mt-0.5 lg:mt-1 tracking-widest uppercase">Clinic Management</span>
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
                            <span className="block text-base sm:text-xl lg:text-2xl font-extrabold text-white mb-0.5 drop-shadow-sm tracking-normal">মেডিসিন ম্যানেজমেন্ট</span>
                            <span className="block text-[9px] sm:text-xs lg:text-sm font-semibold text-rose-200 mt-0.5 lg:mt-1 tracking-widest uppercase">Medicine Management</span>
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
                            <span className="block text-base sm:text-xl lg:text-2xl font-extrabold text-white mb-0.5 drop-shadow-sm tracking-normal">অ্যাকাউন্টিং ম্যানেজমেন্ট</span>
                            <span className="block text-[9px] sm:text-xs lg:text-sm font-semibold text-amber-200 mt-0.5 lg:mt-1 tracking-widest uppercase">Accounting Management</span>
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

                {/* Exact Dead-Center Badge placed right in the intersection of the 4 boxes, sized up so it floats gracefully overlapping edges */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                  <button 
                    onClick={() => onNavigate(ViewState.MARKETING)}
                    className="pointer-events-auto group relative flex items-center justify-center gap-2.5 sm:gap-4 md:gap-5 px-5 py-2.5 sm:px-8 sm:py-4 md:px-11 md:py-5 rounded-full border-2 border-purple-400/90 hover:border-purple-300 bg-gradient-to-r from-slate-950/95 via-purple-950/95 to-slate-950/95 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.8),0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_55px_rgba(168,85,247,1),0_15px_40px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                    title="মার্কেটিং ম্যানেজমেন্ট (Marketing Management)"
                  >
                    <div className="p-2 sm:p-3 md:p-3.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/60 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-inner">
                      <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left">
                      <span className="block text-base sm:text-lg md:text-2xl font-extrabold text-white tracking-wide drop-shadow-md group-hover:text-purple-200 transition-colors whitespace-nowrap">
                        মার্কেটিং ম্যানেজমেন্ট
                      </span>
                      <span className="block text-[9px] sm:text-xs md:text-sm font-bold text-purple-300 tracking-wider uppercase whitespace-nowrap">
                        Marketing Management
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center pl-1.5 text-purple-400 group-hover:translate-x-1 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>

              </div>
          </main>

          {/* FOOTER BAR (Buttons & Settings align properly at the bottom) */}
          <footer className="flex-none flex flex-col items-center justify-center pt-2 pb-1 z-20 w-full relative">
              
              <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 md:gap-5 animate-fade-in-up w-full px-2" style={{ animationDelay: '550ms' }}>
                <button onClick={() => onNavigate(ViewState.DOCTOR_LOGIN)} className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 rounded-full bg-slate-900/80 border border-blue-500/50 text-blue-300 font-bold transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/20 hover:text-white shadow-md active:scale-95 backdrop-blur-md">
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base whitespace-nowrap"><StethoscopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />Doctor Portal</span>
                </button>
                
                <button onClick={() => onNavigate(ViewState.LAB_LOGIN)} className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 rounded-full bg-slate-900/80 border border-cyan-500/50 text-cyan-300 font-bold transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500/20 hover:text-white shadow-md active:scale-95 backdrop-blur-md">
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base whitespace-nowrap"><FileTextIcon className="h-4 w-4 sm:h-5 sm:w-5" />Lab Reporting</span>
                </button>

                <button onClick={() => onNavigate(ViewState.ADMIN_SETTINGS)} className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-bold transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-indigo-400 shadow-md active:scale-95 backdrop-blur-md">
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                      <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      Settings
                  </span>
                </button>
                <button onClick={onLogout} className="group relative px-4 py-2 sm:px-5 sm:py-2.5 lg:px-7 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-bold transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-400 shadow-md active:scale-95 backdrop-blur-md">
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Admin Logout
                  </span>
                </button>
              </div>

              <div className="mt-3 md:mt-4 text-center text-slate-500/60 text-[10px] md:text-xs font-medium tracking-wide">
                 &copy; 2024 NiramoyClinic. All rights reserved.
              </div>
          </footer>
      </div>
    </div>
  );
};

export default Dashboard;
