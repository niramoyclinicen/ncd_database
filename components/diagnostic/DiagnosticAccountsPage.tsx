import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice as Invoice, DueCollection, ExpenseItem, Employee, testCategories } from '../DiagnosticData';
import { Activity, BackIcon, FileTextIcon, SearchIcon, PrinterIcon } from '../Icons';

// --- Configuration & Data ---
const expenseCategories = [
    'House rent', 'Electricity bill', 'Stuff salary', 'Reagent buy', 'Doctor donation',
    'Instruments buy/ repair', 'Diagnostic development', 'Maintenance', 'License cost', 'Others',
];

const expenseCategoryBanglaMap: Record<string, string> = {
    'House rent': 'বাড়ী ভাড়া', 'Electricity bill': 'বিদ্যুৎ বিল', 'Stuff salary': 'স্টাফ স্যালারী',
    'Reagent buy': 'রিএজেন্ট ক্রয়', 'Doctor donation': 'ডাক্তার ডোনেশন', 'Instruments buy/ repair': 'যন্ত্রপাতি ক্রয়/মেরামত',
    'Diagnostic development': 'ডায়াগনস্টিক উন্নয়ন', 'Maintenance': 'রক্ষণাবেক্ষণ', 'License cost': 'লাইসেন্স খরচ', 'Others': 'অন্যান্য',
};

const subCategoryMap: Record<string, string[]> = {
    'House rent': ['Diagnostic Building Rent'],
    'Electricity bill': ['Meter 01', 'Meter 02'],
    'Reagent buy': ['Local Market', 'Company Delivery', 'Special Order'],
    'Doctor donation': ['Monthly Referral Pay', 'Festival Bonus'],
    'Instruments buy/ repair': ['Lab Equipment', 'IT/Computer', 'Furniture'],
    'Diagnostic development': ['New Test Marketing', 'Branding'],
    'Maintenance': ['AC Service', 'Generator Service', 'Cleaning'],
    'License cost': ['DG Health', 'Environment', 'Atomic Energy'],
    'Others': ['Entertainment', 'Donation', 'Emergency']
};

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const SummaryBox = ({ title, items, totalLabel, totalValue, colorClass }: any) => (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col h-full`}>
        <h4 className={`text-lg font-black ${colorClass} mb-4 uppercase border-b border-slate-700 pb-2 text-white`}>{title}</h4>
        <div className="space-y-3 flex-1">
            {items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-700/30 pb-1 text-slate-300">
                    <span className="font-bold">{it.label}:</span>
                    <span className="font-black text-white">{it.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
        <div className={`mt-4 pt-3 border-t-2 border-slate-700 flex justify-between items-center`}>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{totalLabel}</span>
            <span className={`text-xl font-black ${colorClass}`}>{totalValue.toLocaleString()} ৳</span>
        </div>
    </div>
);

const DailyExpenseForm: React.FC<any> = ({ selectedDate, onDateChange, dailyExpenseItems, onSave, employees }) => {
    const [items, setItems] = useState<ExpenseItem[]>(dailyExpenseItems.length > 0 ? dailyExpenseItems : [{
        id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0
    }]);

    useEffect(() => {
        setItems(dailyExpenseItems.length > 0 ? dailyExpenseItems : [{
            id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0
        }]);
    }, [dailyExpenseItems, selectedDate]);

    const handleItemChange = (id: number, field: keyof ExpenseItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItem = () => setItems(prev => [...prev, { id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0 }]);
    const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

    const totalPaid = items.reduce((acc, item) => acc + (Number(item.paidAmount) || 0), 0);

    return (
        <div className="bg-sky-950/40 rounded-[2rem] p-8 border border-sky-800 shadow-xl no-print">
            <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
                <h3 className="text-xl font-black text-sky-100 flex items-center gap-3"><Activity className="w-6 h-6 text-sky-400" /> Daily Expense Entry</h3>
                <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black" />
            </div>
            <div className="overflow-x-auto min-h-[150px]">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[11px] text-slate-500 uppercase font-black tracking-widest">
                            <th className="pb-3 pl-2">Category</th>
                            <th className="pb-3 pl-2">Employee / Details</th>
                            <th className="pb-3 pl-2">Description</th>
                            <th className="pb-3 text-right">Paid Amount</th>
                            <th className="pb-3 text-center">X</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="py-3 pr-2">
                                    <select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-blue-500">
                                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </td>
                                <td className="py-3 pr-2">
                                    {item.category === 'Stuff salary' ? (
                                        <select 
                                            value={item.subCategory} 
                                            onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                                            className="w-full bg-slate-800 border-2 border-amber-600/50 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-amber-500"
                                        >
                                            <option value="">-- Select Employee --</option>
                                            {employees.filter((e:any) => e.is_current_month).map((e:any) => <option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}
                                        </select>
                                    ) : (
                                        <>
                                            <input 
                                                list={`list-${item.id}`} 
                                                value={item.subCategory} 
                                                onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-blue-500" 
                                                placeholder="Sub-category..." 
                                            />
                                            <datalist id={`list-${item.id}`}>
                                                {subCategoryMap[item.category]?.map((sub, i) => <option key={i} value={sub} />)}
                                            </datalist>
                                        </>
                                    )}
                                </td>
                                <td className="py-3 pr-2"><input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-bold" placeholder="Additional details..." /></td>
                                <td className="py-3 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className="w-28 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-base font-black text-right outline-none focus:border-emerald-500" onFocus={e => e.target.select()} /></td>
                                <td className="py-3 text-center"><button onClick={() => removeItem(item.id)} className="text-red-500 font-bold text-2xl hover:text-red-400">×</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-8 flex justify-between items-center border-t border-sky-900/50 pt-6">
                <button onClick={addItem} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all">+ Add Item Row</button>
                <div className="flex items-center gap-8">
                    <div className="text-slate-400 font-black uppercase text-xs tracking-widest">Total Paid: <span className="text-emerald-400 text-3xl font-black ml-2">৳{totalPaid.toLocaleString()}</span></div>
                    <button onClick={() => onSave(selectedDate, items)} className="bg-green-600 hover:bg-green-500 text-white px-12 py-3 rounded-2xl font-black shadow-2xl uppercase text-[11px] tracking-widest transition-all">Save Daily Ledger</button>
                </div>
            </div>
        </div>
    );
};

const DiagnosticAccountsPage: React.FC<any> = ({ onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'entry' | 'daily' | 'monthly' | 'yearly' | 'detail' | 'due'>('entry');
    
    // Detailed Collection States
    const [detailViewMode, setDetailViewMode] = useState<'today' | 'month' | 'year' | 'date'>('today');
    const [detailSearch, setDetailSearch] = useState('');
    const [detailFilterCategory, setDetailFilterCategory] = useState('All');
    
    const [dueSearch, setDueSearch] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); }
    }, [successMessage]);

    const handleSaveExpense = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => ({ ...prev, [date]: items }));
        setSuccessMessage("Expense data saved successfully!");
    };

    const detailTableData = useMemo(() => {
        const filtered = invoices.filter((inv: any) => {
            if (detailViewMode === 'today') return inv.invoice_date === todayStr;
            if (detailViewMode === 'date') return inv.invoice_date === selectedDate;
            
            const d = new Date(inv.invoice_date);
            if (detailViewMode === 'month') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
            if (detailViewMode === 'year') return d.getFullYear() === selectedYear;
            
            return true;
        }).filter((inv: any) => {
            const matchesSearch = inv.patient_name.toLowerCase().includes(detailSearch.toLowerCase()) || 
                                 inv.invoice_id.toLowerCase().includes(detailSearch.toLowerCase()) ||
                                 (inv.referrar_name || '').toLowerCase().includes(detailSearch.toLowerCase());
            
            if (detailFilterCategory === 'All') return matchesSearch;
            if (detailFilterCategory === 'Due Recovery') return matchesSearch && inv.due_amount > 0;

            const matchesCat = inv.items.some((it: any) => {
                const name = (it.test_name || '').toLowerCase();
                if (detailFilterCategory === 'USG') return name.includes('usg') || name.includes('ultra');
                if (detailFilterCategory === 'X-Ray') return name.includes('x-ray') || name.includes('xray');
                if (detailFilterCategory === 'ECG') return name.includes('ecg');
                if (detailFilterCategory === 'Hormone') return name.includes('hormone');
                if (detailFilterCategory === 'Pathology') return !name.includes('usg') && !name.includes('ultra') && !name.includes('x-ray') && !name.includes('xray') && !name.includes('ecg') && !name.includes('hormone');
                return true;
            });
            return matchesSearch && matchesCat;
        });

        return filtered.map((inv: any) => {
            const isReturned = inv.status === 'Returned' || inv.status === 'Cancelled';
            
            // Logic Change: Only show what was written in the 'Commission Paid' box
            const totalPC = isReturned ? 0 : (inv.commission_paid || 0);
            
            const usgFee = isReturned ? 0 : inv.items.reduce((s: number, i: any) => s + ((i.usg_exam_charge || 0) * (i.quantity || 1)), 0);
            const paid = isReturned ? 0 : inv.paid_amount;
            const bill = isReturned ? 0 : inv.total_amount;
            const disc = isReturned ? 0 : inv.discount_amount;
            
            return { 
                ...inv, 
                fixedPC: 0, // No longer used as primary source
                specialPC: totalPC, 
                totalPC, 
                usgFee, 
                paidVal: paid, 
                billVal: bill,
                discVal: disc,
                netProfit: paid - (totalPC + usgFee) 
            };
        });
    }, [invoices, detailSearch, selectedMonth, selectedYear, detailViewMode, selectedDate, detailFilterCategory, todayStr]);

    const reportSummary = useMemo(() => {
        return detailTableData.reduce((acc, curr) => {
            if (curr.status !== 'Cancelled' && curr.status !== 'Returned') {
                acc.totalBill += curr.billVal;
                acc.totalDiscount += curr.discVal;
                acc.paidAmount += curr.paidVal;
                acc.fixedPC += curr.fixedPC;
                acc.specialPC += curr.specialPC;
                acc.totalPC += curr.totalPC;
                acc.usgFee += curr.usgFee;
                acc.netInstProfit += curr.netProfit;
                acc.count++;
            }
            return acc;
        }, { totalBill: 0, totalDiscount: 0, paidAmount: 0, fixedPC: 0, specialPC: 0, totalPC: 0, usgFee: 0, netInstProfit: 0, count: 0 });
    }, [detailTableData]);

    const stats = useMemo(() => {
        const getRangeStats = (rangeType: 'daily' | 'monthly' | 'yearly') => {
            const relevantInvoices = invoices.filter((inv: any) => {
                if (inv.status === 'Cancelled' || inv.status === 'Returned') return false;
                if (rangeType === 'daily') return inv.invoice_date === selectedDate;
                const d = new Date(inv.invoice_date);
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                return d.getFullYear() === selectedYear;
            });
            const relevantDueColls = dueCollections.filter((dc: any) => {
                const isDiag = dc.invoice_id.startsWith('INV-');
                if (rangeType === 'daily') return dc.collection_date === selectedDate && isDiag;
                const d = new Date(dc.collection_date);
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && isDiag;
                return d.getFullYear() === selectedYear && isDiag;
            });

            const coll = { pathology: 0, hormone: 0, usg: 0, xray: 0, ecg: 0, others: 0, dueRecov: 0 };
            
            relevantInvoices.forEach((inv: any) => {
                const ratio = inv.total_amount > 0 ? (inv.paid_amount / inv.total_amount) : 0;
                
                // Logic Change: Calculate actual commission factor based on "Commission Paid" box
                const actualCommPaid = inv.commission_paid || 0;
                const commFactor = inv.paid_amount > 0 ? (actualCommPaid / inv.paid_amount) : 0;

                inv.items.forEach((item: any) => {
                    const testName = (item.test_name || '').toLowerCase();
                    const itemGross = (item.price * item.quantity);
                    
                    // Subtract USG Fee and the actual commission paid (distributed proportionally)
                    const itemNetPaid = (itemGross * ratio) * (1 - commFactor)
                                      - (item.usg_exam_charge * item.quantity);

                    if (testName.includes('usg') || testName.includes('ultra')) coll.usg += itemNetPaid;
                    else if (testName.includes('x-ray') || testName.includes('xray')) coll.xray += itemNetPaid;
                    else if (testName.includes('ecg')) coll.ecg += itemNetPaid;
                    else if (testName.includes('hormone') || testName.includes('tsh') || testName.includes('t3') || testName.includes('t4')) coll.hormone += itemNetPaid;
                    else coll.pathology += itemNetPaid;
                });
            });
            
            coll.dueRecov = relevantDueColls.reduce((s: any, c: any) => s + c.amount_collected, 0);

            const exp = { total: 0 };
            const expenseMap: Record<string, number> = {};
            expenseCategories.forEach(c => expenseMap[c] = 0);

            if (rangeType === 'daily') {
                (detailedExpenses[selectedDate] || []).forEach((it: any) => {
                    expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                    exp.total += it.paidAmount;
                });
            } else {
                Object.entries(detailedExpenses).forEach(([date, items]) => {
                    const d = new Date(date);
                    if ((rangeType === 'monthly' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) || (rangeType === 'yearly' && d.getFullYear() === selectedYear)) {
                        (items as any[]).forEach((it: any) => {
                            expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                            exp.total += it.paidAmount;
                        });
                    }
                });
            }

            const totalColl = Object.values(coll).reduce((s, v) => s + v, 0);
            return { coll, exp, totalColl, expenseMap, balance: totalColl - exp.total };
        };

        return { daily: getRangeStats('daily'), monthly: getRangeStats('monthly'), yearly: getRangeStats('yearly') };
    }, [invoices, dueCollections, detailedExpenses, selectedDate, selectedMonth, selectedYear]);

    const dueList = useMemo(() => {
        return invoices.filter((inv: any) => inv.due_amount > 1 && (inv.patient_name.toLowerCase().includes(dueSearch.toLowerCase()) || inv.invoice_id.includes(dueSearch))).sort((a,b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [invoices, dueSearch]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
            <header className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl no-print">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-all"><BackIcon className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Diagnostic Accounts Console</h2>
                </div>
                <div className="flex bg-slate-800 rounded-2xl p-1 shadow-inner border border-slate-700 overflow-x-auto max-w-full">
                    {[
                        { id: 'entry', label: 'Data Entry' }, 
                        { id: 'daily', label: 'Daily Hishab' }, 
                        { id: 'monthly', label: 'Monthly Hishab' }, 
                        { id: 'yearly', label: 'Yearly Hishab' },
                        { id: 'detail', label: 'Collection Detail' },
                        { id: 'due', label: 'Due List' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>
            </header>

            <main className="flex-1 p-8 space-y-10 container mx-auto overflow-y-auto">
                {activeTab === 'entry' && (
                    <div className="animate-fade-in space-y-10">
                        <DailyExpenseForm selectedDate={selectedDate} onDateChange={setSelectedDate} dailyExpenseItems={detailedExpenses[selectedDate] || []} onSave={handleSaveExpense} employees={employees} />
                    </div>
                )}

                {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') && (
                    <div className="animate-fade-in space-y-10">
                        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
                             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                {activeTab === 'daily' ? `Daily Summary (Net): ${selectedDate}` : activeTab === 'monthly' ? `Monthly (Net): ${monthOptions[selectedMonth].name} ${selectedYear}` : `Yearly (Net): ${selectedYear}`}
                             </h2>
                             <div className="flex gap-4">
                                {activeTab === 'daily' ? (
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black text-sm" />
                                ) : (
                                    <>
                                        {activeTab === 'monthly' && (
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                        )}
                                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </>
                                )}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <SummaryBox title="Net Collection (নিট কালেকশন)" colorClass="text-blue-400" totalLabel="Total Net Collection" totalValue={activeTab === 'daily' ? stats.daily.totalColl : activeTab === 'monthly' ? stats.monthly.totalColl : stats.yearly.totalColl} 
                                items={[
                                    { label: 'Pathology (Net)', value: activeTab === 'daily' ? stats.daily.coll.pathology : activeTab === 'monthly' ? stats.monthly.coll.pathology : stats.yearly.coll.pathology }, 
                                    { label: 'Hormone (Net)', value: activeTab === 'daily' ? stats.daily.coll.hormone : activeTab === 'monthly' ? stats.monthly.coll.hormone : stats.yearly.coll.hormone }, 
                                    { label: 'USG (Net)', value: activeTab === 'daily' ? stats.daily.coll.usg : activeTab === 'monthly' ? stats.monthly.coll.usg : stats.yearly.coll.usg }, 
                                    { label: 'X-Ray (Net)', value: activeTab === 'daily' ? stats.daily.coll.xray : activeTab === 'monthly' ? stats.monthly.coll.xray : stats.yearly.coll.xray }, 
                                    { label: 'ECG (Net)', value: activeTab === 'daily' ? stats.daily.coll.ecg : activeTab === 'monthly' ? stats.monthly.coll.ecg : stats.yearly.coll.ecg }, 
                                    { label: 'Due Recovery', value: activeTab === 'daily' ? stats.daily.coll.dueRecov : activeTab === 'monthly' ? stats.monthly.coll.dueRecov : stats.yearly.coll.dueRecov }
                                ]} 
                            />
                            <SummaryBox title="Expenses (অন্যান্য খরচ)" colorClass="text-rose-400" totalLabel="Total Expense" totalValue={activeTab === 'daily' ? stats.daily.exp.total : activeTab === 'monthly' ? stats.monthly.exp.total : stats.yearly.exp.total} 
                                items={expenseCategories.map(cat => ({ 
                                    label: expenseCategoryBanglaMap[cat], 
                                    value: activeTab === 'daily' ? (stats.daily.expenseMap[cat] || 0) : activeTab === 'monthly' ? (stats.monthly.expenseMap[cat] || 0) : (stats.yearly.expenseMap[cat] || 0) 
                                }))} 
                            />
                        </div>

                        <div className="flex justify-center pt-8 no-print">
                            <div className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 shadow-2xl text-center">
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Net Balance (A - B)</p>
                                <h4 className={`text-6xl font-black ${ (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance) >= 0 ? 'text-green-400' : 'text-rose-500' }`}>
                                    ৳ { (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance).toLocaleString() }
                                </h4>
                                <p className="text-slate-600 text-[10px] mt-4 font-bold uppercase tracking-widest italic">* সকল পেমেন্টকৃত কমিশন ও ইউএসজি ফি কালেকশন থেকে বিয়োগ করা হয়েছে</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'detail' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col gap-8">
                            <div className="flex flex-wrap justify-between items-center gap-6 border-b border-slate-700 pb-6 no-print">
                                <div className="flex items-center gap-6 flex-wrap">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Journal Details</h3>
                                    <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700">
                                        <button onClick={() => setDetailViewMode('today')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Today</button>
                                        <button onClick={() => setDetailViewMode('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Monthly</button>
                                        <button onClick={() => setDetailViewMode('year')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'year' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Yearly</button>
                                        <button onClick={() => setDetailViewMode('date')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'date' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Specific Date</button>
                                    </div>
                                    
                                    {detailViewMode === 'date' && <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold" />}
                                    {detailViewMode === 'month' && (
                                        <div className="flex gap-2">
                                            <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{monthOptions.map(m=><option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                            <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
                                        </div>
                                    )}
                                    {detailViewMode === 'year' && (
                                        <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
                                    )}
                                </div>
                                <div className="relative w-80">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input type="text" placeholder="Search Patient or Referrer..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full pl-12 pr-6 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 no-print border-b border-slate-700 pb-6">
                                {['All', 'Pathology', 'USG', 'X-Ray', 'ECG', 'Hormone'].map(cat => (
                                    <button key={cat} onClick={()=>setDetailFilterCategory(cat)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase border transition-all ${detailFilterCategory === cat ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'}`}>{cat}</button>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                        <tr>
                                            <th className="p-4">SL</th>
                                            <th className="p-4">Invoice ID</th>
                                            <th className="p-4">Patient Name</th>
                                            <th className="p-4">Referrer</th>
                                            <th className="p-4 text-right">Bill</th>
                                            <th className="p-4 text-right text-rose-300">Disc</th>
                                            <th className="p-4 text-right text-emerald-400">Paid</th>
                                            <th className="p-4 text-right text-amber-500">Paid PC</th>
                                            <th className="p-4 text-right text-sky-400">USG Fee</th>
                                            <th className="p-4 text-right bg-blue-900/20 text-white">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {detailTableData.map((inv, idx) => (
                                            <tr key={inv.invoice_id} className={`hover:bg-slate-700/30 transition-colors ${inv.status==='Returned'?'opacity-50 grayscale bg-red-900/10':''}`}>
                                                <td className="p-4 text-slate-500 font-bold">{idx+1}</td>
                                                <td className="p-4 font-mono text-cyan-400 font-bold">{inv.invoice_id}</td>
                                                <td className="p-4 font-black uppercase text-slate-200">{inv.patient_name}</td>
                                                <td className="p-4 text-slate-400 font-bold italic truncate max-w-[120px]">{inv.referrar_name || 'Self'}</td>
                                                <td className="p-4 text-right font-medium text-slate-300">{inv.billVal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-rose-400/70">{inv.discVal.toLocaleString()}</td>
                                                <td className="p-4 text-right font-black text-emerald-400">{inv.paidVal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-amber-500 font-bold">৳ {inv.totalPC.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sky-400 font-bold">{inv.usgFee.toLocaleString()}</td>
                                                <td className="p-4 text-right font-black text-white bg-blue-900/10 text-base">৳{inv.netProfit.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-950 border-t-4 border-slate-700 text-[10px] font-black text-white">
                                        <tr className="h-16">
                                            <td colSpan={4} className="p-4 text-right uppercase tracking-widest text-slate-400">Grand Summary Totals:</td>
                                            <td className="p-4 text-right">৳{reportSummary.totalBill.toLocaleString()}</td>
                                            <td className="p-4 text-right text-rose-500">৳{reportSummary.totalDiscount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-emerald-400">৳{reportSummary.paidAmount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-amber-500">৳{reportSummary.totalPC.toLocaleString()}</td>
                                            <td className="p-3 text-right text-sky-400">৳{reportSummary.usgFee.toLocaleString()}</td>
                                            <td className="p-4 text-right text-white bg-blue-600 rounded-br-2xl text-lg">৳{reportSummary.netInstProfit.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'due' && (
                    <div className="animate-fade-in space-y-10">
                        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
                            <div className="p-8 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Outstanding Patient Dues</h3>
                                <input value={dueSearch} onChange={e=>setDueSearch(e.target.value)} placeholder="Search Patient..." className="p-3 w-96 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                        <tr><th className="p-5">Date</th><th className="p-5">Patient Name</th><th className="p-5 text-right">Total Bill</th><th className="p-5 text-right text-rose-500">Due Balance</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {dueList.map((inv, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-5 text-slate-400 font-bold">{inv.invoice_date}</td>
                                                <td className="p-5 font-black text-white uppercase text-sm">{inv.patient_name}</td>
                                                <td className="p-5 text-right text-slate-300 font-bold">{inv.total_amount.toLocaleString()}</td>
                                                <td className="p-5 text-right font-black text-rose-500 text-xl">৳{inv.due_amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-950 text-white font-black text-sm border-t-4 border-slate-800">
                                        <tr>
                                            <td colSpan={3} className="p-8 text-right uppercase tracking-widest text-slate-500">Total Outstanding Due:</td>
                                            <td className="p-8 text-right text-yellow-400 text-4xl">৳ {dueList.reduce((s,i)=>s+i.due_amount, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DiagnosticAccountsPage;