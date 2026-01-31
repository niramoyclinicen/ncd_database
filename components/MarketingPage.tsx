
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UsersIcon, SearchIcon, ChartIcon, MapPinIcon, BackIcon, DiagnosticIcon, 
  ClinicIcon, PhoneIcon, Activity, TrendingUpIcon, PieChartIcon, MoneyIcon, SaveIcon, PlusIcon, ClipboardIcon
} from './Icons';
// Importing IndoorInvoice from its correct source: DiagnosticData.ts
import { Referrar, LabInvoice, Patient, Employee, MarketingTarget, CommissionPayment, FieldVisitLog, IndoorInvoice } from './DiagnosticData';

interface MarketingPageProps {
  onBack: () => void;
  referrars: Referrar[];
  labInvoices: LabInvoice[];
  indoorInvoices: IndoorInvoice[];
  patients: Patient[];
  employees: Employee[];
}

const MarketingPage: React.FC<MarketingPageProps> = ({ 
  onBack, referrars, labInvoices, indoorInvoices, patients, employees 
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'commission' | 'targets' | 'visits'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- PERSISTED STATE ---
  const [targets, setTargets] = useState<MarketingTarget[]>(() => JSON.parse(localStorage.getItem('ncd_mkt_targets') || '[]'));
  const [payments, setPayments] = useState<CommissionPayment[]>(() => JSON.parse(localStorage.getItem('ncd_mkt_payments') || '[]'));
  const [visits, setVisits] = useState<FieldVisitLog[]>(() => JSON.parse(localStorage.getItem('ncd_mkt_visits') || '[]'));

  useEffect(() => localStorage.setItem('ncd_mkt_targets', JSON.stringify(targets)), [targets]);
  useEffect(() => localStorage.setItem('ncd_mkt_payments', JSON.stringify(payments)), [payments]);
  useEffect(() => localStorage.setItem('ncd_mkt_visits', JSON.stringify(visits)), [visits]);

  // UI state for forms
  const [newTarget, setNewTarget] = useState<Partial<MarketingTarget>>({ staff_id: '', month: new Date().getMonth(), year: new Date().getFullYear(), pt_count_target: 100, revenue_target: 50000 });
  const [newPayment, setNewPayment] = useState<Partial<CommissionPayment>>({ ref_id: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' });
  const [newVisit, setNewVisit] = useState<Partial<FieldVisitLog>>({ staff_id: '', date: new Date().toISOString().split('T')[0], location: '', objective: '', outcomes: '' });

  const marketingStaff = useMemo(() => employees.filter(e => e.job_position.toLowerCase().includes('marketing')), [employees]);

  // --- ANALYTICS CALCULATIONS ---
  const areaStats = useMemo(() => {
    const data: Record<string, { count: number, collection: number }> = {};
    const allInvoices = [...labInvoices.map(i => ({...i, dept: 'Diag'})), ...indoorInvoices.map(i => ({...i, dept: 'Clinic'}))];
    
    allInvoices.forEach(inv => {
      if (inv.referrar_id) {
        const ref = referrars.find(r => r.ref_id === inv.referrar_id);
        const area = ref?.area || 'Unknown';
        if (!data[area]) data[area] = { count: 0, collection: 0 };
        data[area].count += 1;
        data[area].collection += ('paid_amount' in inv ? inv.paid_amount : 0);
      }
    });
    return Object.entries(data).map(([area, s]) => ({ area, ...s })).sort((a,b) => b.count - a.count);
  }, [labInvoices, indoorInvoices, referrars]);

  const referrerLedger = useMemo(() => {
    return referrars.map(ref => {
      const generated = labInvoices.filter(i => i.referrar_id === ref.ref_id).reduce((s, i) => s + i.special_commission, 0);
      const paid = payments.filter(p => p.ref_id === ref.ref_id).reduce((s, p) => s + p.amount, 0);
      return { ...ref, generated, paid, balance: generated - paid };
    });
  }, [referrars, labInvoices, payments]);

  // --- RENDERERS ---
  const renderAnalytics = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800">
                <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPinIcon size={18}/> Area-wise Business Distribution</h4>
                <div className="space-y-4">
                    {areaStats.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center font-black text-white text-lg">{i+1}</div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-white uppercase">{s.area}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{s.count} Patients brought so far</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-emerald-400">৳{s.collection.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800">
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUpIcon size={18}/> Top 5 Referrer Performance</h4>
                <div className="h-64 flex items-end justify-between gap-2 px-4 pb-10">
                    {referrerLedger.slice(0, 5).map((r, i) => {
                        const max = Math.max(...referrerLedger.map(x => x.generated), 1);
                        const height = (r.generated / max) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 text-white text-[10px] p-2 rounded-lg font-black whitespace-nowrap shadow-2xl">৳{r.generated.toLocaleString()}</div>
                                <div className="w-full bg-cyan-600/20 rounded-t-xl group-hover:bg-cyan-500 transition-all relative overflow-hidden" style={{ height: `${height}%` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase rotate-45 mt-4 origin-left truncate w-20">{r.ref_name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );

  const renderCommissionLedger = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black text-emerald-400 uppercase mb-6 flex items-center gap-3"><MoneyIcon size={24}/> Pay Referrer Commission</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Referrer Name</label>
                    <select value={newPayment.ref_id} onChange={e=>setNewPayment({...newPayment, ref_id: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500">
                        <option value="">Select PC...</option>
                        {referrars.map(r => <option key={r.ref_id} value={r.ref_id}>{r.ref_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Amount</label>
                    <input type="number" value={newPayment.amount} onChange={e=>setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-black outline-none focus:border-emerald-500"/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Method</label>
                    <select value={newPayment.method} onChange={e=>setNewPayment({...newPayment, method: e.target.value})} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold">
                        <option>Cash</option><option>bKash</option><option>Bank</option>
                    </select>
                </div>
                <button onClick={()=>{setPayments([{...newPayment, payment_id: `CP-${Date.now()}`} as CommissionPayment, ...payments]); setSuccessMessage("Payment Logged!");}} className="bg-emerald-600 text-white font-black uppercase text-xs p-4 rounded-xl shadow-xl hover:bg-emerald-500 transition-all">Submit Pay</button>
            </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-800 shadow-2xl bg-slate-900/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                    <tr><th className="p-5">Referrer</th><th className="p-5">Generated Comm.</th><th className="p-5">Paid Total</th><th className="p-5 text-right">Net Balance</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {referrerLedger.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-5">
                                <p className="font-black text-white text-sm uppercase">{r.ref_name}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{r.area || 'General Area'}</p>
                            </td>
                            <td className="p-5 font-bold text-slate-300">৳{r.generated.toLocaleString()}</td>
                            <td className="p-5 font-bold text-emerald-400">৳{r.paid.toLocaleString()}</td>
                            <td className="p-5 text-right font-black text-rose-500 text-xl">৳{r.balance.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderTargetSystem = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 h-fit">
            <h3 className="text-lg font-black text-blue-400 uppercase mb-6 flex items-center gap-3"><PlusIcon size={20}/> Set New Target</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Marketing Officer</label>
                    <select value={newTarget.staff_id} onChange={e=>setNewTarget({...newTarget, staff_id: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                        <option value="">Select Staff...</option>
                        {marketingStaff.map(s => <option key={s.emp_id} value={s.emp_id}>{s.emp_name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Patient Count</label><input type="number" value={newTarget.pt_count_target} onChange={e=>setNewTarget({...newTarget, pt_count_target: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black"/></div>
                    <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Revenue (৳)</label><input type="number" value={newTarget.revenue_target} onChange={e=>setNewTarget({...newTarget, revenue_target: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black"/></div>
                </div>
                <button onClick={()=>{setTargets([...targets, {...newTarget, id: `TG-${Date.now()}`} as MarketingTarget]); setSuccessMessage("Target Set!");}} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-white font-black uppercase text-xs shadow-xl active:scale-95 transition-all mt-4">Assign Goal</button>
            </div>
        </div>
        <div className="lg:col-span-8 bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
            <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center gap-3"><Activity size={20}/> Monthly Performance Radar</h3>
            <div className="space-y-8">
                {targets.map(tg => {
                    const staff = employees.find(e => e.emp_id === tg.staff_id);
                    // Mock calculation for demo
                    const currentPts = Math.floor(Math.random() * tg.pt_count_target);
                    const progress = (currentPts / tg.pt_count_target) * 100;
                    return (
                        <div key={tg.id} className="bg-slate-800/40 p-6 rounded-[2rem] border border-slate-700/50 group hover:border-blue-500/30 transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-black">{staff?.emp_name?.charAt(0)}</div>
                                    <div><p className="text-white font-black uppercase text-sm">{staff?.emp_name}</p><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{monthOptions[tg.month].name} {tg.year} Goal</p></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-blue-400">{Math.round(progress)}% Complete</p>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">{currentPts} / {tg.pt_count_target} Patients</p>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    );
                })}
                {targets.length === 0 && <div className="py-20 text-center text-slate-700 italic font-black uppercase opacity-20 text-xl tracking-[0.2em]">No Targets Defined Yet</div>}
            </div>
        </div>
    </div>
  );

  const renderVisitLogs = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black text-indigo-400 uppercase mb-6 flex items-center gap-3"><ClipboardIcon size={24}/> Log Field Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Marketing Person</label><select value={newVisit.staff_id} onChange={e=>setNewVisit({...newVisit, staff_id: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">{marketingStaff.map(s => <option key={s.emp_id} value={s.emp_id}>{s.emp_name}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Location / Area</label><input value={newVisit.location} onChange={e=>setNewVisit({...newVisit, location: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" placeholder="e.g. Village Market"/></div>
                <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 ml-2">Objective & Result</label><input value={newVisit.objective} onChange={e=>setNewVisit({...newVisit, objective: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" placeholder="e.g. Visited Dr. Rahim to discuss USG referral fee"/></div>
                <button onClick={()=>{setVisits([{...newVisit, visit_id: `VT-${Date.now()}`} as FieldVisitLog, ...visits]); setSuccessMessage("Visit Logged!");}} className="md:col-span-4 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-white font-black uppercase text-xs">Save Field Report</button>
            </div>
        </div>

        <div className="space-y-4">
            {visits.map(v => {
                const staff = employees.find(e => e.emp_id === v.staff_id);
                return (
                    <div key={v.visit_id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex gap-6 items-start hover:bg-slate-800/30 transition-all">
                        <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center min-w-[80px] border border-slate-700 shadow-inner">
                            <span className="text-xl font-black text-white">{v.date.split('-')[2]}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase">{monthOptions[parseInt(v.date.split('-')[1])-1].name.substring(0,3)}</span>
                        </div>
                        <div className="flex-1">
                            <h5 className="font-black text-indigo-100 uppercase tracking-tighter text-lg">{staff?.emp_name} @ {v.location}</h5>
                            <p className="text-slate-400 mt-2 text-sm leading-relaxed">{v.objective}</p>
                            {v.outcomes && <p className="text-emerald-500/80 text-xs font-bold mt-2 italic flex items-center gap-1"><Activity size={12}/> Result: {v.outcomes}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );

  const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {successMessage && <div className="fixed top-24 right-8 z-[150] bg-emerald-600 border-2 border-emerald-400 text-white px-10 py-4 rounded-2xl shadow-2xl font-black text-lg animate-fade-in-down">✅ {successMessage}</div>}
      
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700">
              <BackIcon className="w-6 h-6 text-cyan-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 uppercase tracking-tighter">Marketing Intelligence</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Institutional Growth & Referrer Ops</p>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-700 shadow-inner">
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'analytics' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}>Analytics</button>
            <button onClick={() => setActiveTab('commission')} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'commission' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Commission</button>
            <button onClick={() => setActiveTab('targets')} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'targets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Targets</button>
            <button onClick={() => setActiveTab('visits')} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase transition-all ${activeTab === 'visits' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Visit Logs</button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'commission' && renderCommissionLedger()}
        {activeTab === 'targets' && renderTargetSystem()}
        {activeTab === 'visits' && renderVisitLogs()}
      </main>

      <footer className="p-10 bg-slate-900 border-t border-slate-800 text-center mt-20 relative overflow-hidden">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] relative z-10">NCD Intelligence Module • Growth Dashboard v2.0</p>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-sm"></div>
      </footer>
    </div>
  );
};

export default MarketingPage;
