import React, { useState, useEffect, useMemo } from 'react';
import { dbService, DailyConsolidatedEntry, ClinicProfile } from '../../dbService';
import { BackIcon, PrinterIcon, PlusIcon, TrashIcon, SearchIcon, Activity } from '../Icons';
import { Save, RefreshCw, Layers, Calendar, Clock, DollarSign, UserCheck, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface DailyConsolidatedEntryPageProps {
  onBack?: () => void;
  performBlockingSync?: (stateOverride?: any) => Promise<boolean>;
  currentUserEmail?: string;
  onPostToAccounts?: (entry: DailyConsolidatedEntry) => void;
}

export const DailyConsolidatedEntryPage: React.FC<DailyConsolidatedEntryPageProps> = ({
  onBack,
  performBlockingSync,
  currentUserEmail = 'Admin'
}) => {
  const [entries, setEntries] = useState<DailyConsolidatedEntry[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>(dbService.getClinicProfile());
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'new_entry' | 'history'>('new_entry');
  const [searchDate, setSearchDate] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [printingEntry, setPrintingEntry] = useState<DailyConsolidatedEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<DailyConsolidatedEntry>>({
    date: new Date().toISOString().split('T')[0],
    shift: 'Full Day',
    entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    operatorName: currentUserEmail || 'Cashier',
    totalPatients: 0,
    totalTests: 0,
    grossAmount: 0,
    discountAmount: 0,
    netPayable: 0,
    cashCollected: 0,
    dueAmount: 0,
    doctorCommissionPaid: 0,
    usgDoctorFeePaid: 0,
    breakdown: {
      pathology: 0,
      usg: 0,
      xray: 0,
      ecg: 0,
      hormone: 0,
      others: 0
    },
    notes: ''
  });

  const [useDepartmentBreakdown, setUseDepartmentBreakdown] = useState(true);

  // Load existing entries
  useEffect(() => {
    setEntries(dbService.getConsolidatedEntries());
    setClinicProfile(dbService.getClinicProfile());
  }, []);

  // Show temporary success banner
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Live Calculations
  const breakdownSum = useMemo(() => {
    const b = formData.breakdown || { pathology: 0, usg: 0, xray: 0, ecg: 0, hormone: 0, others: 0 };
    return (Number(b.pathology) || 0) + 
           (Number(b.usg) || 0) + 
           (Number(b.xray) || 0) + 
           (Number(b.ecg) || 0) + 
           (Number(b.hormone) || 0) + 
           (Number(b.others) || 0);
  }, [formData.breakdown]);

  // When breakdown sum changes and useDepartmentBreakdown is on, auto-update gross
  useEffect(() => {
    if (useDepartmentBreakdown && breakdownSum > 0) {
      setFormData(prev => {
        const gross = breakdownSum;
        const discount = Number(prev.discountAmount) || 0;
        const net = Math.max(0, gross - discount);
        const cash = Number(prev.cashCollected) || 0;
        const due = Math.max(0, net - cash);
        return {
          ...prev,
          grossAmount: gross,
          netPayable: net,
          dueAmount: due
        };
      });
    }
  }, [breakdownSum, useDepartmentBreakdown]);

  // Recalculate Net & Due on direct field changes
  const handleGrossOrDiscountChange = (gross: number, discount: number, cash: number) => {
    const g = Number(gross) || 0;
    const d = Number(discount) || 0;
    const net = Math.max(0, g - d);
    const c = Number(cash) || 0;
    const due = Math.max(0, net - c);
    setFormData(prev => ({
      ...prev,
      grossAmount: g,
      discountAmount: d,
      netPayable: net,
      cashCollected: c,
      dueAmount: due
    }));
  };

  const handleBreakdownField = (field: keyof NonNullable<DailyConsolidatedEntry['breakdown']>, val: number) => {
    const updatedBreakdown = {
      ...(formData.breakdown || { pathology: 0, usg: 0, xray: 0, ecg: 0, hormone: 0, others: 0 }),
      [field]: val
    };
    const sum = Object.values(updatedBreakdown).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    const discount = Number(formData.discountAmount) || 0;
    const net = Math.max(0, sum - discount);
    const cash = Number(formData.cashCollected) || 0;
    const due = Math.max(0, net - cash);

    setFormData(prev => ({
      ...prev,
      breakdown: updatedBreakdown,
      grossAmount: sum,
      netPayable: net,
      dueAmount: due
    }));
  };

  // Center net income calculation
  const calculatedNetCenterIncome = useMemo(() => {
    const cash = Number(formData.cashCollected) || 0;
    const docPC = Number(formData.doctorCommissionPaid) || 0;
    const usgFee = Number(formData.usgDoctorFeePaid) || 0;
    return cash - docPC - usgFee;
  }, [formData.cashCollected, formData.doctorCommissionPaid, formData.usgDoctorFeePaid]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      alert('অনুগ্রহ করে তারিখ নির্বাচন করুন!');
      return;
    }
    if ((Number(formData.grossAmount) || 0) <= 0) {
      alert('মোট গ্রস বিল এর পরিমাণ ০ এর চেয়ে বেশি হতে হবে!');
      return;
    }

    setIsSaving(true);
    try {
      const newRecord: DailyConsolidatedEntry = {
        id: 'DCE-' + Date.now(),
        date: formData.date || new Date().toISOString().split('T')[0],
        shift: (formData.shift as any) || 'Full Day',
        entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operatorName: formData.operatorName || 'Cashier',
        totalPatients: Number(formData.totalPatients) || 0,
        totalTests: Number(formData.totalTests) || 0,
        grossAmount: Number(formData.grossAmount) || 0,
        discountAmount: Number(formData.discountAmount) || 0,
        netPayable: Number(formData.netPayable) || 0,
        cashCollected: Number(formData.cashCollected) || 0,
        dueAmount: Number(formData.dueAmount) || 0,
        doctorCommissionPaid: Number(formData.doctorCommissionPaid) || 0,
        usgDoctorFeePaid: Number(formData.usgDoctorFeePaid) || 0,
        breakdown: formData.breakdown || { pathology: 0, usg: 0, xray: 0, ecg: 0, hormone: 0, others: 0 },
        notes: formData.notes || '',
        createdAt: new Date().toISOString()
      };

      dbService.saveSingleConsolidatedEntry(newRecord);
      const updatedList = dbService.getConsolidatedEntries();
      setEntries(updatedList);

      if (performBlockingSync) {
        await performBlockingSync({ consolidatedLabEntries: updatedList });
      }

      triggerSuccess('ডেইলি কনসোলিডেটেড ভাউচার সফলভাবে সংরক্ষিত হয়েছে!');

      // Reset form to fresh
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'Full Day',
        entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operatorName: currentUserEmail || 'Cashier',
        totalPatients: 0,
        totalTests: 0,
        grossAmount: 0,
        discountAmount: 0,
        netPayable: 0,
        cashCollected: 0,
        dueAmount: 0,
        doctorCommissionPaid: 0,
        usgDoctorFeePaid: 0,
        breakdown: {
          pathology: 0,
          usg: 0,
          xray: 0,
          ecg: 0,
          hormone: 0,
          others: 0
        },
        notes: ''
      });

      // Switch to history or prompt print
      setPrintingEntry(newRecord);
    } catch (err) {
      console.error(err);
      alert('সংরক্ষণে ত্রুটি হয়েছে!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই কনসোলিডেটেড রেকর্ডটি মুছে ফেলতে চান?')) return;
    dbService.deleteConsolidatedEntry(id);
    const updatedList = dbService.getConsolidatedEntries();
    setEntries(updatedList);
    if (performBlockingSync) {
      await performBlockingSync({ consolidatedLabEntries: updatedList });
    }
    triggerSuccess('রেকর্ডটি মুছে ফেলা হয়েছে।');
  };

  // Filtered Entries for History
  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const matchDate = searchDate ? item.date === searchDate : true;
      const matchShift = filterShift === 'all' ? true : item.shift === filterShift;
      return matchDate && matchShift;
    });
  }, [entries, searchDate, filterShift]);

  // History Stats
  const historyStats = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      acc.patients += curr.totalPatients || 0;
      acc.gross += curr.grossAmount || 0;
      acc.discount += curr.discountAmount || 0;
      acc.net += curr.netPayable || 0;
      acc.cash += curr.cashCollected || 0;
      acc.due += curr.dueAmount || 0;
      acc.commission += (curr.doctorCommissionPaid || 0) + (curr.usgDoctorFeePaid || 0);
      acc.centerNet += (curr.cashCollected || 0) - (curr.doctorCommissionPaid || 0) - (curr.usgDoctorFeePaid || 0);
      return acc;
    }, { patients: 0, gross: 0, discount: 0, net: 0, cash: 0, due: 0, commission: 0, centerNet: 0 });
  }, [filteredEntries]);

  // Print Consolidated Voucher
  const handlePrintVoucher = (entry: DailyConsolidatedEntry) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Consolidated Lab Voucher - ${entry.date}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; }
          .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; }
          .header p { margin: 3px 0; font-size: 12px; color: #475569; }
          .voucher-tag { display: inline-block; background: #0f172a; color: white; padding: 4px 14px; font-size: 11px; font-weight: 900; text-transform: uppercase; border-radius: 4px; margin-top: 8px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .info-table td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 12px; }
          .info-table td.label { font-weight: bold; background: #f8fafc; width: 25%; color: #334155; }
          .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 16px 0 8px 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          .data-table th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; font-weight: 900; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .grand-total-row { background: #f8fafc; font-weight: 900; font-size: 14px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { border-top: 1.5px solid #0f172a; width: 180px; text-align: center; padding-top: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        </style>
      </head>
      <body onload="window.print();">
        <div class="header">
          <h1>${clinicProfile.name || 'Niramoy Clinic & Diagnostic'}</h1>
          <p>${clinicProfile.nameBn || ''} - ${clinicProfile.tagline || ''}</p>
          <p>${clinicProfile.address} | হটলাইন: ${clinicProfile.mobile} | লাইসেন্স: ${clinicProfile.licenseNo}</p>
          <div class="voucher-tag">ডেইলি কনসোলিডেটেড ল্যাব সামারি ভাউচার (Daily Consolidated Voucher)</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">ভাউচার আইডি:</td>
            <td><b>${entry.id}</b></td>
            <td class="label">তারিখ ও সময়:</td>
            <td><b>${entry.date} (${entry.entryTime})</b></td>
          </tr>
          <tr>
            <td class="label">শিফট / সেশন:</td>
            <td><b>${entry.shift}</b></td>
            <td class="label">হিসাব গ্রহণকারী:</td>
            <td><b>${entry.operatorName}</b></td>
          </tr>
          <tr>
            <td class="label">মোট রোগী সংখ্যা:</td>
            <td><b>${entry.totalPatients} জন</b></td>
            <td class="label">মোট টেস্ট সংখ্যা:</td>
            <td><b>${entry.totalTests} টি</b></td>
          </tr>
        </table>

        <div class="section-title">১. বিভাগভিত্তিক কালেকশন বিবরণী (Department Breakdown)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>বিভাগ (Department)</th>
              <th class="text-right">মোট পরিমাণ (Amount ৳)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>প্যাথলজি (Pathology & Bio-chemistry)</td><td class="text-right">৳${(entry.breakdown?.pathology || 0).toLocaleString()}</td></tr>
            <tr><td>আল্ট্রাসনোগ্রাফি (USG)</td><td class="text-right">৳${(entry.breakdown?.usg || 0).toLocaleString()}</td></tr>
            <tr><td>ডিজিটাল এক্স-রে (Digital X-Ray)</td><td class="text-right">৳${(entry.breakdown?.xray || 0).toLocaleString()}</td></tr>
            <tr><td>ইসিজি (ECG)</td><td class="text-right">৳${(entry.breakdown?.ecg || 0).toLocaleString()}</td></tr>
            <tr><td>হরমোন টেস্ট (Hormone)</td><td class="text-right">৳${(entry.breakdown?.hormone || 0).toLocaleString()}</td></tr>
            <tr><td>অন্যান্য ও বিশেষ টেস্ট (Others)</td><td class="text-right">৳${(entry.breakdown?.others || 0).toLocaleString()}</td></tr>
          </tbody>
          <tfoot>
            <tr class="grand-total-row">
              <td>মোট গ্রস বিল (Gross Total):</td>
              <td class="text-right">৳${entry.grossAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">২. আর্থিক সারসংক্ষেপ (Financial Summary)</div>
        <table class="data-table">
          <tr>
            <td>মোট গ্রস বিল (Gross Total)</td>
            <td class="text-right font-bold">৳${entry.grossAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>প্রদত্ত মোট ছাড় (Special Discount)</td>
            <td class="text-right" style="color: #dc2626;">-৳${entry.discountAmount.toLocaleString()}</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td>নিট প্রদেয় বিল (Net Payable)</td>
            <td class="text-right">৳${entry.netPayable.toLocaleString()}</td>
          </tr>
          <tr style="background: #ecfdf5; font-weight: 900; color: #065f46;">
            <td>মোট নগদ ক্যাশ আদায় (Cash Collected)</td>
            <td class="text-right">৳${entry.cashCollected.toLocaleString()}</td>
          </tr>
          <tr>
            <td>বকেয়া / ডিউ (Due Balance)</td>
            <td class="text-right" style="color: #ea580c; font-weight: bold;">৳${entry.dueAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>ডাক্তার / রেফারেল পিসি কমিশন প্রদান (Doctor PC)</td>
            <td class="text-right" style="color: #7c2d12;">-৳${(entry.doctorCommissionPaid || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>ইউএসজি ডাক্তার অনারিয়াম ফি প্রদান (USG Doctor Fee)</td>
            <td class="text-right" style="color: #7c2d12;">-৳${(entry.usgDoctorFeePaid || 0).toLocaleString()}</td>
          </tr>
          <tr class="grand-total-row" style="background: #f0fdf4; border-top: 2px solid #0f172a;">
            <td>নিট ক্যাশ ব্যালেন্স / ক্লিনিক জমা (Net Cash-in-Hand):</td>
            <td class="text-right" style="color: #15803d;">৳${((entry.cashCollected || 0) - (entry.doctorCommissionPaid || 0) - (entry.usgDoctorFeePaid || 0)).toLocaleString()}</td>
          </tr>
        </table>

        ${entry.notes ? `<p><b>মন্তব্য (Notes):</b> ${entry.notes}</p>` : ''}

        <div class="footer">
          <div class="sig-box">ক্যাশিয়ার / ডাটা এন্ট্রি অপারেটর</div>
          <div class="sig-box">প্রধান হিসাবরক্ষক</div>
          <div class="sig-box">ব্যবস্থাপনা পরিচালক</div>
        </div>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all";
  const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl no-print">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 active:scale-95 transition-all text-white shadow-md">
              <BackIcon className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Layers className="text-sky-400" /> ডেইলি কনসোলিডেটেড ল্যাব এন্ট্রি (Daily Consolidated Entry)
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              ব্যস্ত দিনে বা অফলাইন হিসেব শেষে এক ক্লিকে সারাদিনের মোট রোগী, টেস্ট, বিল ও ক্যাশ কালেকশন এন্ট্রি করুন।
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveSubTab('new_entry')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'new_entry' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusIcon size={16} /> নতুন এন্ট্রি ভাউচার
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'history' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={16} /> ভাউচার হিস্ট্রি ({entries.length})
          </button>
        </div>
      </header>

      {/* Success Notification */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-emerald-400 text-xs uppercase tracking-wide">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 container mx-auto max-w-7xl overflow-y-auto">
        {activeSubTab === 'new_entry' && (
          <form onSubmit={handleSaveEntry} className="space-y-8 animate-fade-in">
            {/* Top Config Row */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className={labelClass}>📅 তারিখ (Voucher Date)</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>⏱️ শিফট / সেশন (Shift)</label>
                <select
                  value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="Full Day">সারাদিন (Full Day)</option>
                  <option value="Morning">সকাল শিফট (Morning)</option>
                  <option value="Evening">সন্ধ্যা শিফট (Evening)</option>
                  <option value="Night">রাত শিফট (Night)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>👤 ক্যাশিয়ার / অপারেটর (Operator)</label>
                <input
                  type="text"
                  value={formData.operatorName}
                  onChange={e => setFormData({ ...formData, operatorName: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Cashier 1"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>👥 মোট রোগী সংখ্যা (Patients)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalPatients || ''}
                  onChange={e => setFormData({ ...formData, totalPatients: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            {/* Department Breakdown vs Direct Entry Toggle */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="text-emerald-400" size={20} /> ১. বিভাগভিত্তিক কালেকশন এন্ট্রি (Department Breakdown)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    প্রতিটি বিভাগের মোট বিল লিখুন। সিস্টেম স্বয়ংক্রিয়ভাবে গ্রস বিল ও নিট হিসেব তৈরি করবে।
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 pl-2">বিভাগীয় ভাগ:</span>
                  <button
                    type="button"
                    onClick={() => setUseDepartmentBreakdown(!useDepartmentBreakdown)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                      useDepartmentBreakdown ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {useDepartmentBreakdown ? 'সক্রিয় (Active)' : 'সরাসরি গ্রস এন্ট্রি'}
                  </button>
                </div>
              </div>

              {useDepartmentBreakdown ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">🧪 প্যাথলজি</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.pathology || ''}
                      onChange={e => handleBreakdownField('pathology', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-sky-400 uppercase block mb-1">👶 আল্ট্রাসনোগ্রাফি</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.usg || ''}
                      onChange={e => handleBreakdownField('usg', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-emerald-400 uppercase block mb-1">🩻 ডিজিটাল এক্স-রে</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.xray || ''}
                      onChange={e => handleBreakdownField('xray', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-amber-400 uppercase block mb-1">📈 ইসিজি (ECG)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.ecg || ''}
                      onChange={e => handleBreakdownField('ecg', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-rose-400 uppercase block mb-1">🧬 হরমোন টেস্ট</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.hormone || ''}
                      onChange={e => handleBreakdownField('hormone', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-purple-400 uppercase block mb-1">🔬 অন্যান্য টেস্ট</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.others || ''}
                      onChange={e => handleBreakdownField('others', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-black text-sm text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className={labelClass}>মোট গ্রস ল্যাব টেস্ট বিল (Gross Total Amount ৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.grossAmount || ''}
                    onChange={e => handleGrossOrDiscountChange(parseFloat(e.target.value) || 0, Number(formData.discountAmount) || 0, Number(formData.cashCollected) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-lg text-right"
                    placeholder="0"
                    required
                  />
                </div>
              )}
            </div>

            {/* Financial Summary & Calculations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Adjustments & Doctor Commissions */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
                <h3 className="text-sm font-black text-white uppercase tracking-wide border-b border-slate-800 pb-3 flex items-center gap-2">
                  <UserCheck className="text-sky-400" size={18} /> ২. নগদ আদায়, ছাড় ও কমিশন প্রদান
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>🎁 মোট বিশেষ ছাড় (Total Discount ৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountAmount || ''}
                      onChange={e => handleGrossOrDiscountChange(Number(formData.grossAmount) || 0, parseFloat(e.target.value) || 0, Number(formData.cashCollected) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-rose-400 font-black text-base text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>💵 মোট নগদ আদায় (Cash Collected ৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cashCollected || ''}
                      onChange={e => handleGrossOrDiscountChange(Number(formData.grossAmount) || 0, Number(formData.discountAmount) || 0, parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border-2 border-emerald-500/80 rounded-xl p-3 text-emerald-400 font-black text-lg text-right outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className={labelClass}>👨‍⚕️ ডাক্তার পিসি কমিশন প্রদান (Doctor PC ৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.doctorCommissionPaid || ''}
                      onChange={e => setFormData({ ...formData, doctorCommissionPaid: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-black text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>🩺 ইউএসজি ডাক্তার অনারিয়াম ফি (USG Doctor ৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usgDoctorFeePaid || ''}
                      onChange={e => setFormData({ ...formData, usgDoctorFeePaid: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-black text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>📝 বিবরণী বা নোট (Remarks / Notes)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs font-bold outline-none"
                    placeholder="ব্যস্ত দিনের নোট বা অতিরিক্ত তথ্য লিখুন..."
                  />
                </div>
              </div>

              {/* Right Column: Live Calculated Voucher Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/30 p-6 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-sky-400">লাইভ ভাউচার সামারি</span>
                    <span className="text-[11px] font-mono text-slate-400">{formData.date} | {formData.shift}</span>
                  </div>

                  <div className="space-y-3 mt-4 text-sm font-bold">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>মোট গ্রস বিল (Gross Total):</span>
                      <span className="font-mono text-base font-black text-white">৳{(Number(formData.grossAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>মোট ছাড় (Total Discount):</span>
                      <span className="font-mono text-rose-400 font-black">-৳{(Number(formData.discountAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-100 border-t border-slate-800 pt-2 text-base">
                      <span>নিট প্রদেয় বিল (Net Payable):</span>
                      <span className="font-mono text-sky-300 font-black">৳{(Number(formData.netPayable) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                      <span>মোট নগদ ক্যাশ আদায় (Cash In):</span>
                      <span className="font-mono text-lg font-black">৳{(Number(formData.cashCollected) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-amber-400">
                      <span>মোট বকেয়া / বাকি (Due Balance):</span>
                      <span className="font-mono text-base font-black">৳{(Number(formData.dueAmount) || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 text-xs border-t border-slate-800 pt-2">
                      <span>মোট ডাক্তার কমিশন ও অনারিয়াম ফি:</span>
                      <span className="font-mono text-rose-300">-৳{((Number(formData.doctorCommissionPaid) || 0) + (Number(formData.usgDoctorFeePaid) || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income Callout */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/50 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">ক্লিনিকের দিন শেষের নিট ক্যাশ জমা</span>
                    <span className="text-xs text-emerald-400 font-bold">(ক্যাশ আদায় - কমিশন)</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ৳{calculatedNetCenterIncome.toLocaleString()}
                  </span>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Save size={18} /> {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ভাউচার সেভ করুন ও স্লিপ প্রিন্ট করুন'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* History Tab */}
        {activeSubTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">তারিখ অনুযায়ী ফিল্টার</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">শিফট ফিল্টার</label>
                  <select
                    value={filterShift}
                    onChange={e => setFilterShift(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold text-xs outline-none"
                  >
                    <option value="all">সকল শিফট</option>
                    <option value="Full Day">সারাদিন</option>
                    <option value="Morning">সকাল</option>
                    <option value="Evening">সন্ধ্যা</option>
                    <option value="Night">রাত</option>
                  </select>
                </div>

                {searchDate && (
                  <button
                    onClick={() => setSearchDate('')}
                    className="mt-4 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white"
                  >
                    রিসেট
                  </button>
                )}
              </div>

              {/* Summary Stats Pill */}
              <div className="flex items-center gap-4 text-xs font-bold bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">মোট রোগী:</span>
                  <span className="text-white font-mono font-black">{historyStats.patients} জন</span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">মোট ক্যাশ আদায়:</span>
                  <span className="text-emerald-400 font-mono font-black">৳{historyStats.cash.toLocaleString()}</span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">মোট বকেয়া:</span>
                  <span className="text-rose-400 font-mono font-black">৳{historyStats.due.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Records Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">তারিখ ও সময়</th>
                      <th className="p-4">শিফট</th>
                      <th className="p-4">অপারেটর</th>
                      <th className="p-4 text-center">রোগী সংখ্যা</th>
                      <th className="p-4 text-right">গ্রস বিল</th>
                      <th className="p-4 text-right">ছাড়</th>
                      <th className="p-4 text-right">নিট বিল</th>
                      <th className="p-4 text-right text-emerald-400">ক্যাশ আদায়</th>
                      <th className="p-4 text-right text-amber-400">বাকি (Due)</th>
                      <th className="p-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-bold">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500 font-bold">
                          কোনো কনসোলিডেটেড রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map(row => (
                        <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-mono text-slate-200">
                            {row.date} <span className="text-[10px] text-slate-400">({row.entryTime})</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 text-[10px] font-black uppercase">
                              {row.shift}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">{row.operatorName}</td>
                          <td className="p-4 text-center font-mono">{row.totalPatients}</td>
                          <td className="p-4 text-right font-mono">৳{row.grossAmount.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-rose-400">-৳{row.discountAmount.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-sky-300">৳{row.netPayable.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-emerald-400 font-black">৳{row.cashCollected.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono text-amber-400">৳{row.dueAmount.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handlePrintVoucher(row)}
                                className="p-2 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white rounded-xl transition-all shadow"
                                title="প্রিন্ট ভাউচার"
                              >
                                <PrinterIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all shadow"
                                title="মুছে ফেলুন"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auto-Prompt Print Modal after save */}
      {printingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase">ভাউচার সংরক্ষিত হয়েছে!</h3>
              <p className="text-xs text-slate-400 mt-1">
                ভাউচার নং: <span className="font-mono text-sky-400 font-bold">{printingEntry.id}</span> | তারিখ: {printingEntry.date}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPrintingEntry(null)}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => {
                  handlePrintVoucher(printingEntry);
                  setPrintingEntry(null);
                }}
                className="py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2"
              >
                <PrinterIcon size={16} /> প্রিন্ট ভাউচার
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
