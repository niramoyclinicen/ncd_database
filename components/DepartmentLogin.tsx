
import React, { useState } from 'react';
import { BackIcon, TestTubeIcon, DiagnosticIcon, ClinicIcon, MedicineIcon, AccountingIcon, SettingsIcon } from './Icons';

interface DepartmentLoginProps {
  department: string;
  onLogin: (password: string) => void;
  onBack: () => void;
  errorMsg?: string;
}

const DepartmentLogin: React.FC<DepartmentLoginProps> = ({ department, onLogin, onBack, errorMsg }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(errorMsg || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  const getIcon = () => {
    switch (department) {
      case 'DIAGNOSTIC': return <DiagnosticIcon className="w-12 h-12 text-cyan-400" />;
      case 'LAB_REPORTING': return <TestTubeIcon className="w-12 h-12 text-blue-400" />;
      case 'CLINIC': return <ClinicIcon className="w-12 h-12 text-emerald-400" />;
      case 'MEDICINE': return <MedicineIcon className="w-12 h-12 text-rose-400" />;
      case 'ACCOUNTING': return <AccountingIcon className="w-12 h-12 text-amber-400" />;
      default: return <SettingsIcon className="w-12 h-12 text-slate-400" />;
    }
  };

  const getTitle = () => {
    if (department === 'ADMIN') return "Admin Settings Access";
    return `${department.replace('_', ' ')} Access`;
  };

  const getColor = () => {
    switch (department) {
      case 'DIAGNOSTIC': return 'from-cyan-600 to-blue-600';
      case 'LAB_REPORTING': return 'from-blue-600 to-cyan-500';
      case 'CLINIC': return 'from-emerald-600 to-teal-500';
      case 'MEDICINE': return 'from-rose-600 to-pink-500';
      case 'ACCOUNTING': return 'from-amber-600 to-orange-500';
      default: return 'from-slate-600 to-slate-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border-2 border-slate-800 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getColor()}`}></div>
        
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 transition-colors font-bold uppercase text-xs tracking-widest">
          <BackIcon className="w-4 h-4" /> Back to Dashboard
        </button>
        
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
            {getIcon()}
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{getTitle()}</h2>
          <p className="text-slate-500 mt-2 text-sm font-bold uppercase tracking-widest">প্রবেশ করতে পাসওয়ার্ড দিন</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-2xl mb-8 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-2">Secure Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white text-xl text-center focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-gradient-to-r ${getColor()} text-white font-black py-4 rounded-2xl shadow-xl transform transition-all active:scale-95 uppercase tracking-widest text-sm`}
          >
            Verify & Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentLogin;
