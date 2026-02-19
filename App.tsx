
import React, { useState } from 'react';
/* Added Activity to the imports from ./Icons */
import { BackIcon, SettingsIcon, SaveIcon, DownloadIcon, TrashIcon, DatabaseIcon, RefreshIcon, Activity } from './Icons';
import { DepartmentPasswords } from '../types';

interface AdminSettingsProps {
  passwords: DepartmentPasswords;
  onSave: (newPasswords: DepartmentPasswords) => void;
  onBack: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ passwords, onSave, onBack }) => {
  const [localPasswords, setLocalPasswords] = useState<DepartmentPasswords>(passwords);
  const [success, setSuccess] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: None, 1: Confirm, 2: Backup Prompt, 3: Final Type Check
  const [finalConfirmText, setFinalConfirmText] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localPasswords);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ncd_')) {
            try {
                allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                allData[key] = localStorage.getItem(key);
            }
        }
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCD_Master_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (resetStep === 2) setResetStep(3); // Proceed to final step if in reset flow
  };

  const executeFullReset = () => {
      if (finalConfirmText !== 'RESET') {
          alert("ভুল টাইপ করেছেন! পুনরায় চেষ্টা করুন।");
          return;
      }
      
      // Clear all keys starting with ncd_
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('ncd_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      alert("সফলভাবে পুরো সিস্টেম রিসেট করা হয়েছে। পেজটি রিলোড হবে।");
      window.location.reload();
  };

  const inputClass = "w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-4xl rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col mb-10">
        <div className="p-8 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                    <SettingsIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Control Panel</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Configuration & Security</p>
                </div>
            </div>
            <button onClick={onBack} className="p-3 bg-slate-800 rounded-2xl hover:bg-rose-600 transition-all group shadow-xl">
                <BackIcon className="w-6 h-6 text-slate-400 group-hover:text-white"/>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* PASSWORDS SECTION */}
            <form onSubmit={handleSave} className="lg:col-span-7 p-10 space-y-8 border-r border-slate-800">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><RefreshIcon size={14}/> Access Security Keys</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Admin Panel Key</label><input type="text" value={localPasswords.ADMIN} onChange={e=>setLocalPasswords({...localPasswords, ADMIN: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Diagnostic Key</label><input type="text" value={localPasswords.DIAGNOSTIC} onChange={e=>setLocalPasswords({...localPasswords, DIAGNOSTIC: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Lab Reporting Key</label><input type="text" value={localPasswords.LAB_REPORTING} onChange={e=>setLocalPasswords({...localPasswords, LAB_REPORTING: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Clinic Key</label><input type="text" value={localPasswords.CLINIC} onChange={e=>setLocalPasswords({...localPasswords, CLINIC: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Medicine Key</label><input type="text" value={localPasswords.MEDICINE} onChange={e=>setLocalPasswords({...localPasswords, MEDICINE: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>Accounting Key</label><input type="text" value={localPasswords.ACCOUNTING} onChange={e=>setLocalPasswords({...localPasswords, ACCOUNTING: e.target.value})} className={inputClass} /></div>
                </div>
                <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                    {success && <span className="text-emerald-400 font-bold animate-pulse text-xs">✓ Passwords Updated!</span>}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center gap-2 transition-all">
                        <SaveIcon size={14}/> Save Settings
                    </button>
                </div>
            </form>

            {/* MAINTENANCE SECTION */}
            <div className="lg:col-span-5 p-10 bg-slate-950/30 space-y-8">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><DatabaseIcon size={14}/> System Maintenance</h3>
                
                <div className="space-y-4">
                    <button onClick={handleDownloadBackup} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-5 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="text-left">
                            <span className="block text-white font-black text-sm uppercase">Export Backup</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Download all data as JSON</span>
                        </div>
                        <DownloadIcon size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="relative">
                        {resetStep === 0 ? (
                            <button onClick={() => setResetStep(1)} className="w-full bg-rose-900/20 hover:bg-rose-600 border border-rose-900/50 p-5 rounded-2xl flex items-center justify-between group transition-all">
                                <div className="text-left">
                                    <span className="block text-rose-500 group-hover:text-white font-black text-sm uppercase">Factory Reset</span>
                                    <span className="text-[9px] text-rose-900 group-hover:text-rose-200 font-bold uppercase">Wipe all records permanently</span>
                                </div>
                                <TrashIcon size={24} className="text-rose-600 group-hover:text-white group-hover:rotate-12 transition-all" />
                            </button>
                        ) : (
                            <div className="bg-slate-800 p-6 rounded-3xl border-2 border-rose-500 shadow-2xl animate-fade-in space-y-4">
                                {resetStep === 1 && (
                                    <>
                                        <p className="text-xs font-black text-white uppercase text-center">আপনি কি নিশ্চিত যে আপনি সব ডাটা ডিলিট করতে চান?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(0)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold">বাতিল</button>
                                            <button onClick={() => setResetStep(2)} className="py-2 bg-rose-600 rounded-xl text-xs font-black">হ্যাঁ, চাই</button>
                                        </div>
                                    </>
                                )}
                                {resetStep === 2 && (
                                    <>
                                        <p className="text-xs font-black text-amber-400 uppercase text-center">রিসেট করার আগে ব্যাকআপ নিতে চান?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(3)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold italic">না, প্রয়োজন নেই</button>
                                            <button onClick={handleDownloadBackup} className="py-2 bg-blue-600 rounded-xl text-xs font-black">হ্যাঁ, ব্যাকআপ দিন</button>
                                        </div>
                                    </>
                                )}
                                {resetStep === 3 && (
                                    <>
                                        <p className="text-[10px] font-black text-rose-500 uppercase text-center">চূড়ান্ত ধাপ: নিচের বক্সে 'RESET' লিখুন</p>
                                        <input 
                                            value={finalConfirmText} 
                                            onChange={e=>setFinalConfirmText(e.target.value)} 
                                            className="w-full bg-slate-900 border border-rose-500 p-2 text-center text-white font-black rounded-lg outline-none"
                                            placeholder="RESET টাইপ করুন"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setResetStep(0)} className="py-2 bg-slate-700 rounded-xl text-xs font-bold">বাতিল</button>
                                            <button onClick={executeFullReset} className="py-2 bg-rose-600 rounded-xl text-xs font-black shadow-lg shadow-rose-900/50">RESET NOW</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-inner">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Database Integrity</span>
                    </div>
                    <p className="text-[9px] text-slate-600 leading-relaxed italic">The system automatically saves data to your local browser storage. For maximum security, we recommend downloading a master backup every week.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
