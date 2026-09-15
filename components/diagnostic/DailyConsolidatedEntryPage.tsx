import React, { useState, useEffect, useMemo } from 'react';
import { dbService, DailyConsolidatedEntry, ClinicProfile } from '../../dbService';
import { BackIcon, PrinterIcon, PlusIcon, TrashIcon, SearchIcon, Activity } from '../Icons';
import { Save, RefreshCw, Layers, Calendar, Clock, DollarSign, UserCheck, FileSpreadsheet, CheckCircle2, AlertCircle, CalendarRange } from 'lucide-react';

export const BENGALI_MONTHS = [
  { value: 0, bn: 'জানুয়ারি', en: 'January' },
  { value: 1, bn: 'ফেব্রুয়ারি', en: 'February' },
  { value: 2, bn: 'মার্চ', en: 'March' },
  { value: 3, bn: 'এপ্রিল', en: 'April' },
  { value: 4, bn: 'মে', en: 'May' },
  { value: 5, bn: 'জুন', en: 'June' },
  { value: 6, bn: 'জুলাই', en: 'July' },
  { value: 7, bn: 'আগস্ট', en: 'August' },
  { value: 8, bn: 'সেপ্টেম্বর', en: 'September' },
  { value: 9, bn: 'অক্টোবর', en: 'October' },
  { value: 10, bn: 'নভেম্বর', en: 'November' },
  { value: 11, bn: 'ডিসেম্বর', en: 'December' },
];

export const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

interface DailyConsolidatedEntryPageProps {
  onBack?: () => void;
  performBlockingSync?: (stateOverride?: any) => Promise<boolean>;
  currentUserEmail?: string;
  onPostToAccounts?: (entry: DailyConsolidatedEntry) => void;
  consolidatedLabEntries?: DailyConsolidatedEntry[];
  setConsolidatedLabEntries?: React.Dispatch<React.SetStateAction<DailyConsolidatedEntry[]>>;
}

export const DailyConsolidatedEntryPage: React.FC<DailyConsolidatedEntryPageProps> = ({
  onBack,
  performBlockingSync,
  currentUserEmail = 'Admin',
  consolidatedLabEntries,
  setConsolidatedLabEntries
}) => {
  const [entries, setEntries] = useState<DailyConsolidatedEntry[]>(() => {
    return (consolidatedLabEntries && consolidatedLabEntries.length > 0)
      ? consolidatedLabEntries
      : dbService.getConsolidatedEntries();
  });
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>(dbService.getClinicProfile());
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'new_entry' | 'history'>('new_entry');
  const [searchDate, setSearchDate] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [printingEntry, setPrintingEntry] = useState<DailyConsolidatedEntry | null>(null);

  // Entry Mode: 'daily' (দিনভিত্তিক) or 'monthly' (মাসভিত্তিক একবারে)
  const [entryMode, setEntryMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // History filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'daily' | 'monthly'>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('all');
  const [historyYearFilter, setHistoryYearFilter] = useState<string>('all');

  // Sync entries if parent prop updates
  useEffect(() => {
    if (consolidatedLabEntries && consolidatedLabEntries.length > 0) {
      setEntries(consolidatedLabEntries);
    } else {
      setEntries(dbService.getConsolidatedEntries());
    }
  }, [consolidatedLabEntries]);

  // Form State
  const [formData, setFormData] = useState<Partial<DailyConsolidatedEntry>>({
    date: new Date().toISOString().split('T')[0],
    shift: 'Full Day',
    entryType: 'daily',
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

  // Handle switching between Daily and Monthly entry modes
  const handleModeChange = (mode: 'daily' | 'monthly') => {
    setEntryMode(mode);
    if (mode === 'monthly') {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        entryType: 'monthly',
        date: `${selectedYear}-${monthStr}-01`,
        shift: 'Monthly',
        month: selectedMonth,
        year: selectedYear,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        entryType: 'daily',
        date: new Date().toISOString().split('T')[0],
        shift: 'Full Day',
        month: undefined,
        year: undefined,
      }));
    }
  };

  const handleMonthYearChange = (m: number, y: number) => {
    setSelectedMonth(m);
    setSelectedYear(y);
    const monthStr = String(m + 1).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      date: `${y}-${monthStr}-01`,
      entryType: 'monthly',
      shift: 'Monthly',
      month: m,
      year: y,
    }));
  };

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
        const cash = prev.cashCollected !== undefined && prev.cashCollected !== 0 ? Number(prev.cashCollected) : net;
        const due = Math.max(0, net - cash);
        return {
          ...prev,
          grossAmount: gross,
          netPayable: net,
          cashCollected: cash,
          dueAmount: due
        };
      });
    }
  }, [breakdownSum, useDepartmentBreakdown]);

  // Recalculate Net & Due on direct field changes
  const handleGrossOrDiscountChange = (gross: number, discount: number, cash?: number) => {
    const g = Number(gross) || 0;
    const d = Number(discount) || 0;
    const net = Math.max(0, g - d);
    const c = cash !== undefined ? Number(cash) : net;
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
    const cash = formData.cashCollected !== undefined && formData.cashCollected !== 0 ? Number(formData.cashCollected) : net;
    const due = Math.max(0, net - cash);

    setFormData(prev => ({
      ...prev,
      breakdown: updatedBreakdown,
      grossAmount: sum,
      netPayable: net,
      cashCollected: cash,
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
    const isMonthly = entryMode === 'monthly';

    const computedDate = isMonthly
      ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
      : (formData.date || new Date().toISOString().split('T')[0]);

    if (!computedDate) {
      alert('অনুগ্রহ করে তারিখ বা মাস-বছর নির্বাচন করুন!');
      return;
    }
    const gross = Number(formData.grossAmount) || 0;
    if (gross <= 0) {
      alert('মোট গ্রস বিল এর পরিমাণ ০ এর চেয়ে বেশি হতে হবে!');
      return;
    }

    const discount = Number(formData.discountAmount) || 0;
    const net = Number(formData.netPayable) || Math.max(0, gross - discount);
    let cash = Number(formData.cashCollected) || 0;
    let due = Number(formData.dueAmount) || 0;

    if (cash === 0 && due === 0 && net > 0) {
      cash = net;
      due = 0;
    } else if (cash > 0 && due === 0 && cash < net) {
      due = net - cash;
    }

    setIsSaving(true);
    try {
      const monthBn = BENGALI_MONTHS[selectedMonth]?.bn || '';
      const newRecord: DailyConsolidatedEntry = {
        id: (isMonthly ? 'MCE-' : 'DCE-') + Date.now(),
        date: computedDate,
        shift: isMonthly ? 'Monthly' : ((formData.shift as any) || 'Full Day'),
        entryType: isMonthly ? 'monthly' : 'daily',
        month: isMonthly ? selectedMonth : (computedDate ? parseInt(computedDate.split('-')[1]) - 1 : new Date().getMonth()),
        year: isMonthly ? selectedYear : (computedDate ? parseInt(computedDate.split('-')[0]) : new Date().getFullYear()),
        entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operatorName: formData.operatorName || 'Cashier',
        totalPatients: Number(formData.totalPatients) || 0,
        totalTests: Number(formData.totalTests) || 0,
        grossAmount: gross,
        discountAmount: discount,
        netPayable: net,
        cashCollected: cash,
        dueAmount: due,
        doctorCommissionPaid: Number(formData.doctorCommissionPaid) || 0,
        usgDoctorFeePaid: Number(formData.usgDoctorFeePaid) || 0,
        breakdown: formData.breakdown || { pathology: 0, usg: 0, xray: 0, ecg: 0, hormone: 0, others: 0 },
        notes: formData.notes || (isMonthly ? `মাসিক এককালীন এন্ট্রি: ${monthBn} ${selectedYear}` : ''),
        createdAt: new Date().toISOString()
      };

      dbService.saveSingleConsolidatedEntry(newRecord);
      const updatedList = dbService.getConsolidatedEntries();
      setEntries(updatedList);
      if (setConsolidatedLabEntries) {
        setConsolidatedLabEntries(updatedList);
      }

      if (performBlockingSync) {
        await performBlockingSync({ consolidatedLabEntries: updatedList });
      }

      triggerSuccess(isMonthly ? `মাসিক কনসোলিডেটেড ভাউচার (${monthBn} ${selectedYear}) সফলভাবে সংরক্ষিত হয়েছে!` : 'ডেইলি কনসোলিডেটেড ভাউচার সফলভাবে সংরক্ষিত হয়েছে!');

      // Reset form
      setFormData({
        date: isMonthly ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01` : new Date().toISOString().split('T')[0],
        shift: isMonthly ? 'Monthly' : 'Full Day',
        entryType: isMonthly ? 'monthly' : 'daily',
        month: isMonthly ? selectedMonth : undefined,
        year: isMonthly ? selectedYear : undefined,
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

      // Switch to prompt print
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
    if (setConsolidatedLabEntries) {
      setConsolidatedLabEntries(updatedList);
    }
    if (performBlockingSync) {
      await performBlockingSync({ consolidatedLabEntries: updatedList });
    }
    triggerSuccess('রেকর্ডটি মুছে ফেলা হয়েছে।');
  };

  // Filtered Entries for History
  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      if (!item) return false;
      const isItemMonthly = item.entryType === 'monthly' || item.shift === 'Monthly';

      if (historyTypeFilter === 'daily' && isItemMonthly) return false;
      if (historyTypeFilter === 'monthly' && !isItemMonthly) return false;

      if (searchDate && item.date !== searchDate) return false;
      if (filterShift !== 'all' && item.shift !== filterShift) return false;

      if (historyYearFilter !== 'all') {
        const itemYear = item.year !== undefined ? item.year : (item.date ? parseInt(item.date.split('-')[0]) : null);
        if (String(itemYear) !== historyYearFilter) return false;
      }
      if (historyMonthFilter !== 'all') {
        const itemMonth = item.month !== undefined ? item.month : (item.date ? parseInt(item.date.split('-')[1]) - 1 : null);
        if (String(itemMonth) !== historyMonthFilter) return false;
      }

      return true;
    });
  }, [entries, historyTypeFilter, searchDate, filterShift, historyYearFilter, historyMonthFilter]);

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

    const isMonthly = entry.entryType === 'monthly' || entry.shift === 'Monthly';
    const entryMonth = entry.month !== undefined ? entry.month : (entry.date ? parseInt(entry.date.split('-')[1]) - 1 : 0);
    const entryYear = entry.year !== undefined ? entry.year : (entry.date ? entry.date.split('-')[0] : '');
    const monthBn = BENGALI_MONTHS[entryMonth]?.bn || '';
    const monthEn = BENGALI_MONTHS[entryMonth]?.en || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isMonthly ? `Monthly Consolidated Lab Voucher - ${monthEn} ${entryYear}` : `Daily Consolidated Lab Voucher - ${entry.date}`}</title>
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
          <div class="voucher-tag">${isMonthly ? `মাসিক কনসোলিডেটেড ল্যাব ভাউচার (Monthly Consolidated Lab Voucher) - ${monthBn} ${entryYear}` : 'ডেইলি কনসোলিডেটেড ল্যাব সামারি ভাউচার (Daily Consolidated Voucher)'}</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="label">ভাউচার আইডি:</td>
            <td><b>${entry.id}</b></td>
            <td class="label">${isMonthly ? 'মাস ও বৎসর:' : 'তারিখ ও সময়:'}</td>
            <td><b>${isMonthly ? `${monthBn} ${entryYear} (${monthEn} ${entryYear})` : `${entry.date} (${entry.entryTime})`}</b></td>
          </tr>
          <tr>
            <td class="label">এন্ট্রি ধরন ও শিফট:</td>
            <td><b>${isMonthly ? 'মাসিক এককালীন জমা (সারামাস)' : `${entry.shift}`}</b></td>
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
            <tr><td>🧪 প্যাথলজি (Pathology & Bio-chemistry)</td><td class="text-right">৳${(entry.breakdown?.pathology || 0).toLocaleString()}</td></tr>
            <tr><td>🩺 আল্ট্রাসনোগ্রাফি (USG)</td><td class="text-right">৳${(entry.breakdown?.usg || 0).toLocaleString()}</td></tr>
            <tr><td>☢️ ডিজিটাল এক্স-রে (Digital X-Ray)</td><td class="text-right">৳${(entry.breakdown?.xray || 0).toLocaleString()}</td></tr>
            <tr><td>📈 ইসিজি (ECG)</td><td class="text-right">৳${(entry.breakdown?.ecg || 0).toLocaleString()}</td></tr>
            <tr><td>🔬 হরমোন টেস্ট (Hormone)</td><td class="text-right">৳${(entry.breakdown?.hormone || 0).toLocaleString()}</td></tr>
            <tr><td>📦 অন্যান্য ও বিশেষ টেস্ট (Others)</td><td class="text-right">৳${(entry.breakdown?.others || 0).toLocaleString()}</td></tr>
          </tbody>
          <tfoot>
            <tr class="grand-total-row">
              <td>মোট গ্রস ডিপার্টমেন্টাল বিল (Gross Total)</td>
              <td class="text-right font-black">৳${entry.grossAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">২. আর্থিক সারসংক্ষেপ (Financial Summary)</div>
        <table class="data-table">
          <tbody>
            <tr>
              <td>মোট গ্রস বিল (Gross Total Amount):</td>
              <td class="text-right"><b>৳${entry.grossAmount.toLocaleString()}</b></td>
            </tr>
            <tr>
              <td>মোট ছাড় (Special Discount Given):</td>
              <td class="text-right" style="color: #dc2626;">-৳${entry.discountAmount.toLocaleString()}</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td>প্রদেয় নিট বিল (Net Payable):</td>
              <td class="text-right">৳${entry.netPayable.toLocaleString()}</td>
            </tr>
            <tr style="background: #ecfdf5; font-weight: bold; color: #047857;">
              <td>নগদ ক্যাশ আদায় (Cash Collected):</td>
              <td class="text-right">৳${entry.cashCollected.toLocaleString()}</td>
            </tr>
            <tr>
              <td>বকেয়া / বাকি (Due Balance):</td>
              <td class="text-right" style="color: #b45309;">৳${entry.dueAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>প্রদত্ত ডাক্তার পিসি কমিশন (Doctor Commission Paid):</td>
              <td class="text-right" style="color: #dc2626;">-৳${entry.doctorCommissionPaid.toLocaleString()}</td>
            </tr>
            <tr>
              <td>ইউএসজি ডাক্তার অনারিয়াম ফি (USG Doctor Honorarium):</td>
              <td class="text-right" style="color: #dc2626;">-৳${entry.usgDoctorFeePaid.toLocaleString()}</td>
            </tr>
            <tr class="grand-total-row" style="background: #1e293b; color: #fff;">
              <td>ক্লিনিকের নিট ক্যাশ জমা (Net Center Cash In Hand):</td>
              <td class="text-right">৳${((entry.cashCollected || 0) - (entry.doctorCommissionPaid || 0) - (entry.usgDoctorFeePaid || 0)).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        ${entry.notes ? `<p style="margin-top: 15px; font-size: 11px;"><b>মন্তব্য/নোট:</b> ${entry.notes}</p>` : ''}

        <div class="footer">
          <div class="sig-box">ক্যাশিয়ার / প্রস্তুতকারী</div>
          <div class="sig-box">অ্যাকাউন্টিং অফিসার</div>
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
    <div className="w-full h-full min-h-0 flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl no-print shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2.5 sm:p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 active:scale-95 transition-all text-white shadow-md">
              <BackIcon className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Layers className="text-sky-400" /> কনসোলিডেটেড ল্যাব ডাটা এন্ট্রি (Consolidated Lab Entry)
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              ব্যস্ত দিনে দিনভিত্তিক অথবা সারামাসের মোট হিসেব একবারে জমা দিন এবং একাউন্টসে স্বয়ংক্রিয়ভাবে সংযুক্ত করুন।
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveSubTab('new_entry')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'new_entry' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusIcon size={16} /> নতুন এন্ট্রি ভাউচার
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
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

      {/* Main Content - Seamless width without gap */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 w-full overflow-y-auto">
        {activeSubTab === 'new_entry' && (
          <form onSubmit={handleSaveEntry} className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Entry Mode Switcher: Daily vs Monthly */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="text-sky-400" size={18} /> এন্ট্রি মোড নির্বাচন (Entry Mode)
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  প্রতিদিনের আলাদা দৈনিক ভাউচার এন্ট্রি অথবা সারামাসের মোট হিসেব একবারে জমা দেওয়ার জন্য মোড বেছে নিন
                </p>
              </div>
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleModeChange('daily')}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                    entryMode === 'daily' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar size={15} /> দিন হিসেবে (Daily Entry)
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('monthly')}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                    entryMode === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CalendarRange size={15} /> মাস হিসেবে একবারে (Monthly Entry)
                </button>
              </div>
            </div>

            {/* Top Config Row */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {entryMode === 'daily' ? (
                <>
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
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>🗓️ মাস নির্বাচন (Month)</label>
                    <select
                      value={selectedMonth}
                      onChange={e => handleMonthYearChange(parseInt(e.target.value), selectedYear)}
                      className={inputClass}
                    >
                      {BENGALI_MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.bn} ({m.en})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>📅 বৎসর নির্বাচন (Year)</label>
                    <select
                      value={selectedYear}
                      onChange={e => handleMonthYearChange(selectedMonth, parseInt(e.target.value))}
                      className={inputClass}
                    >
                      {AVAILABLE_YEARS.map(y => (
                        <option key={y} value={y}>{y} সন</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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
                <label className={labelClass}>
                  👥 {entryMode === 'monthly' ? 'সারামাসের মোট রোগী (Monthly Patients)' : 'মোট রোগী সংখ্যা (Patients)'}
                </label>
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
            <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-6">
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-sky-400 uppercase block mb-1">🩺 ইউএসজি (USG)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.usg || ''}
                      onChange={e => handleBreakdownField('usg', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-amber-400 uppercase block mb-1">☢️ এক্স-রে (X-Ray)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.xray || ''}
                      onChange={e => handleBreakdownField('xray', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-rose-400 uppercase block mb-1">📈 ইসিজি (ECG)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.ecg || ''}
                      onChange={e => handleBreakdownField('ecg', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-teal-400 uppercase block mb-1">🔬 হরমোন</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.hormone || ''}
                      onChange={e => handleBreakdownField('hormone', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">📦 অন্যান্য টেস্ট</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.breakdown?.others || ''}
                      onChange={e => handleBreakdownField('others', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm text-right outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>সরাসরি মোট গ্রস বিল (Direct Gross Amount ৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.grossAmount || ''}
                    onChange={e => handleGrossOrDiscountChange(parseFloat(e.target.value) || 0, Number(formData.discountAmount) || 0, Number(formData.cashCollected) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono font-black text-lg outline-none"
                    placeholder="0"
                    required
                  />
                </div>
              )}
            </div>

            {/* Financial Summary & Calculations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Adjustments & Doctor Commissions */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
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
                    placeholder={entryMode === 'monthly' ? `মাসিক এককালীন এন্ট্রি: ${BENGALI_MONTHS[selectedMonth]?.bn} ${selectedYear}...` : "ব্যস্ত দিনের নোট বা অতিরিক্ত তথ্য লিখুন..."}
                  />
                </div>
              </div>

              {/* Right Column: Live Calculated Voucher Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/30 p-5 sm:p-6 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-sky-400">লাইভ ভাউচার সামারি</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {entryMode === 'monthly'
                        ? `🗓️ ${BENGALI_MONTHS[selectedMonth]?.bn} ${selectedYear} (সারামাস)`
                        : `📅 ${formData.date} | ${formData.shift}`}
                    </span>
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
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {entryMode === 'monthly' ? 'সারামাসের ক্লিনিকের নিট ক্যাশ জমা' : 'ক্লিনিকের দিন শেষের নিট ক্যাশ জমা'}
                    </span>
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
                    <Save size={18} /> {isSaving ? 'সংরক্ষণ হচ্ছে...' : (entryMode === 'monthly' ? `মাসিক ভাউচার (${BENGALI_MONTHS[selectedMonth]?.bn} ${selectedYear}) সেভ ও প্রিন্ট করুন` : 'ভাউচার সেভ করুন ও স্লিপ প্রিন্ট করুন')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* History Tab */}
        {activeSubTab === 'history' && (
          <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">এন্ট্রি ধরন</label>
                  <select
                    value={historyTypeFilter}
                    onChange={e => setHistoryTypeFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                  >
                    <option value="all">সকল ভাউচার</option>
                    <option value="daily">📅 শুধুমাত্র দৈনিক</option>
                    <option value="monthly">🗓️ শুধুমাত্র মাসিক</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">মাস ফিল্টার</label>
                  <select
                    value={historyMonthFilter}
                    onChange={e => setHistoryMonthFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                  >
                    <option value="all">সকল মাস</option>
                    {BENGALI_MONTHS.map(m => (
                      <option key={m.value} value={String(m.value)}>{m.bn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">বৎসর ফিল্টার</label>
                  <select
                    value={historyYearFilter}
                    onChange={e => setHistoryYearFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                  >
                    <option value="all">সকল বৎসর</option>
                    {AVAILABLE_YEARS.map(y => (
                      <option key={y} value={String(y)}>{y} সন</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">নির্দিষ্ট তারিখ</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                  />
                </div>

                {(searchDate || historyTypeFilter !== 'all' || historyMonthFilter !== 'all' || historyYearFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchDate('');
                      setHistoryTypeFilter('all');
                      setHistoryMonthFilter('all');
                      setHistoryYearFilter('all');
                    }}
                    className="mt-4 px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white"
                  >
                    রিসেট
                  </button>
                )}
              </div>

              {/* Summary Stats Pill */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 self-stretch lg:self-auto justify-around">
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
                      <th className="p-4">তারিখ / মাস-বছর</th>
                      <th className="p-4">এন্ট্রি টাইপ ও শিফট</th>
                      <th className="p-4">অপারেটর</th>
                      <th className="p-4 text-center">রোগী</th>
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
                      filteredEntries.map(row => {
                        const isRowMonthly = row.entryType === 'monthly' || row.shift === 'Monthly';
                        const rowMonth = row.month !== undefined ? row.month : (row.date ? parseInt(row.date.split('-')[1]) - 1 : 0);
                        const rowYear = row.year !== undefined ? row.year : (row.date ? row.date.split('-')[0] : '');

                        return (
                          <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-mono text-slate-200">
                              {isRowMonthly ? (
                                <span className="font-bold text-emerald-400">
                                  {BENGALI_MONTHS[rowMonth]?.bn} {rowYear}
                                </span>
                              ) : (
                                <>
                                  {row.date} <span className="text-[10px] text-slate-400">({row.entryTime})</span>
                                </>
                              )}
                            </td>
                            <td className="p-4">
                              {isRowMonthly ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                                  🗓️ মাসিক এককালীন
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[10px] font-black uppercase">
                                  📅 দৈনিক ({row.shift})
                                </span>
                              )}
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
                        );
                      })
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
              <h3 className="text-lg font-black text-white uppercase">
                {printingEntry.entryType === 'monthly' || printingEntry.shift === 'Monthly'
                  ? 'মাসিক ভাউচার সংরক্ষিত হয়েছে!'
                  : 'ভাউচার সংরক্ষিত হয়েছে!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ভাউচার নং: <span className="font-mono text-sky-400 font-bold">{printingEntry.id}</span>
                {printingEntry.entryType === 'monthly' || printingEntry.shift === 'Monthly' ? (
                  <> | মাস-বৎসর: <span className="text-emerald-400 font-bold">{BENGALI_MONTHS[printingEntry.month ?? new Date(printingEntry.date).getMonth()]?.bn} {printingEntry.year ?? printingEntry.date.split('-')[0]}</span></>
                ) : (
                  <> | তারিখ: {printingEntry.date}</>
                )}
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
