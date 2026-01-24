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
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col h-full`}>
        <h4 className={`text-lg font-black ${colorClass} mb-4 uppercase border-b border-slate-700 pb-2 text-white`}>{title}</h4>
        <div className="space-y-2 flex-1">
            {items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-700/30 pb-1 text-slate-300">
                    <span className="font-medium">{it.label}:</span>
                    <span className="font-bold text-white">{it.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
        <div className={`mt-4 pt-3 border-t-2 border-slate-700 flex justify-between items-center`}>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{totalLabel}</span>
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
        <div className="bg-sky-950/40 rounded-2xl p-6 border border-sky-800 shadow-xl no-print">
            <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
                <h3 className="text-xl font-bold text-sky-100 flex items-center gap-2"><Activity className="w-5 h-5 text-sky-400" /> Daily Expense Entry</h3>
                <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div className="overflow-x-auto min-h-[150px]">
                <table className="w-full text-left">
                    <thead>
                        <tr><th className="pb-3 text-[10px] text-slate-500 uppercase tracking-widest">Category</th><th className="pb-3 text-[10px] text-slate-500 uppercase tracking-widest">Sub-Category</th><th className="pb-3 text-[10px] text-slate-500 uppercase tracking-widest">Description</th><th className="pb-3 text-right text-[10px] text-slate-500 uppercase tracking-widest">Paid Amt</th><th className="pb-3 text-center text-[10px] text-slate-500 uppercase tracking-widest">X</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="py-2 pr-2">
                                    <select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs">
                                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </td>
                                <td className="py-2 pr-2">
                                    <input 
                                        list={`list-${item.id}`} 
                                        value={item.subCategory} 
                                        onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs font-bold focus:border-blue-500 outline-none" 
                                        placeholder="Type or select..." 
                                    />
                                    <datalist id={`list-${item.id}`}>
                                        {item.category === 'Stuff salary' ? (
                                            employees.filter((e:any) => e.is_current_month).map((e:any) => <option key={e.emp_id} value={e.emp_name} />)
                                        ) : (
                                            subCategoryMap[item.category]?.map((sub, i) => <option key={i} value={sub} />)
                                        )}
                                    </datalist>
                                </td>
                                <td className="py-2 pr-2"><input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs" /></td>
                                <td className="py-2 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className="w-24 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs text-right" onFocus={e => e.target.select()} /></td>
                                <td className="py-2 text-center"><button onClick={() => removeItem(item.id)} className="text-red-500 font-bold">×</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={addItem} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold text-xs">+ Add Row</button>
                <div className="flex items-center gap-6">
                    <div className="text-slate-400 font-bold">Total Paid: <span className="text-emerald-400 text-xl ml-1">{totalPaid.toLocaleString()}</span></div>
                    <button onClick={() => onSave(selectedDate, items)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-xl font-black shadow-lg uppercase text-xs tracking-widest transition-all">Save Data</button>
                </div>
            </div>
        </div>
    );
};

const DiagnosticAccountsPage: React.FC<any> = ({ 
    onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses 
}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'entry' | 'daily' | 'monthly' | 'yearly' | 'detail' | 'due'>('entry');
    const [detailViewMode, setDetailViewMode] = useState<'today' | 'historical' | 'monthly_summary'>('today');
    const [detailSearch, setDetailSearch] = useState('');
    const [dueSearch, setDueSearch] = useState('');
    const [entrySearch, setEntrySearch] = useState('');
    const [entryCategoryFilter, setEntryCategoryFilter] = useState('All');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); }
    }, [successMessage]);

    const handleSaveExpense = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => ({ ...prev, [date]: items }));
        setSuccessMessage("Expense data saved successfully!");
    };

    // Helper for grouping date display (e.g., 01-Jan-2026)
    const formatGroupingDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    };

    const filteredSavedEntries = useMemo(() => {
        const rawEntries = detailedExpenses[selectedDate] || [];
        return rawEntries.filter((ex: any) => {
            const matchesCategory = entryCategoryFilter === 'All' || ex.category === entryCategoryFilter;
            const searchTermLower = entrySearch.toLowerCase();
            const matchesSearch = 
                ex.category.toLowerCase().includes(searchTermLower) || 
                (ex.subCategory && ex.subCategory.toLowerCase().includes(searchTermLower)) || 
                ex.description.toLowerCase().includes(searchTermLower);
            return matchesCategory && matchesSearch;
        });
    }, [detailedExpenses, selectedDate, entrySearch, entryCategoryFilter]);

    const stats = useMemo(() => {
        const getRangeStats = (rangeType: 'daily' | 'monthly' | 'yearly') => {
            const isMatch = (dateStr: string) => {
                const d = new Date(dateStr);
                if (rangeType === 'daily') return dateStr === selectedDate;
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                return d.getFullYear() === selectedYear;
            };

            const coll = { pathology: 0, hormone: 0, usg: 0, xray: 0, ecg: 0, others: 0, dueRecov: 0 };
            invoices.forEach((inv: any) => {
                if (isMatch(inv.invoice_date) && inv.status !== 'Cancelled') {
                    inv.items.forEach((item: any) => {
                        const testName = (item.test_name || '').toLowerCase();
                        const val = item.price * item.quantity;
                        const ratio = inv.total_amount > 0 ? (inv.paid_amount / inv.total_amount) : 0;
                        const paidVal = val * ratio;
                        if (testName.includes('usg') || testName.includes('ultra')) coll.usg += paidVal;
                        else if (testName.includes('x-ray') || testName.includes('xray')) coll.xray += paidVal;
                        else if (testName.includes('ecg')) coll.ecg += paidVal;
                        else if (testName.includes('hormone')) coll.hormone += paidVal;
                        else coll.pathology += paidVal;
                    });
                }
            });

            dueCollections.forEach((dc: any) => {
                const isDiag = dc.invoice_id.startsWith('INV-');
                if (isMatch(dc.collection_date) && isDiag) coll.dueRecov += dc.amount_collected;
            });

            const exp = { total: 0 };
            const expenseMap: Record<string, number> = {};
            expenseCategories.forEach(c => expenseMap[c] = 0);

            Object.entries(detailedExpenses).forEach(([date, items]: [string, any]) => {
                if (isMatch(date)) {
                    (items as ExpenseItem[]).forEach((it: ExpenseItem) => {
                        expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                        exp.total += it.paidAmount;
                    });
                }
            });

            const totalColl = Object.values(coll).reduce((s, v) => s + v, 0);
            return { coll, exp, totalColl, expenseMap, balance: totalColl - exp.total };
        };

        return { daily: getRangeStats('daily'), monthly: getRangeStats('monthly'), yearly: getRangeStats('yearly') };
    }, [invoices, dueCollections, detailedExpenses, selectedDate, selectedMonth, selectedYear]);

    // Data processing for the Detailed Collection Log with Date Grouping and 10 specific columns
    const detailTableData = useMemo(() => {
        const filtered = invoices.filter((inv: any) => {
            if (detailViewMode === 'today') return inv.invoice_date === todayStr;
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).filter((inv: any) => {
            const matchesSearch = inv.patient_name.toLowerCase().includes(detailSearch.toLowerCase()) || 
                                 inv.invoice_id.toLowerCase().includes(detailSearch.toLowerCase());
            return matchesSearch && inv.status !== 'Cancelled';
        });

        // Map and Calculate 10 Columns
        const results = filtered.map((inv: any) => {
            // USG Calculation: sum of all test charges marked as USG
            const usgAmt = inv.items.reduce((sum: number, item: any) => sum + (item.usg_exam_charge || 0), 0);
            // PC: Special commission
            const pcAmt = inv.special_commission || 0;
            // Cash Paid: Amount collected at billing
            const cashPaid = inv.paid_amount || 0;
            // Balance: Cash Paid - USG - PC (Clinic's Net)
            const balance = cashPaid - usgAmt - pcAmt; 
            
            return {
                id: inv.invoice_id,
                date: inv.invoice_date,
                patientDesc: `${inv.patient_name} (${inv.patient_id})`,
                refDr: inv.referrar_name || 'Self',
                tests: inv.items.map((it: any) => it.test_name).join(', '),
                billAmt: inv.total_amount,
                paid: cashPaid,
                usg: usgAmt,
                pc: pcAmt,
                balance: balance,
                due: inv.due_amount
            };
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Grouping by Date
        const grouped: Record<string, any[]> = {};
        results.forEach((row: any) => {
            if (!grouped[row.date]) grouped[row.date] = [];
            grouped[row.date].push(row);
        });
        return grouped;
    }, [invoices, detailSearch, selectedMonth, selectedYear, detailViewMode, todayStr]);

    // Monthly Collection Summary Cumulative Logic
    const monthlySummaryData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dailyData = [];
        let runningTotal = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayInvoices = invoices.filter((inv: any) => inv.invoice_date === currentDayStr && inv.status !== 'Cancelled');
            const dayDueRecov = dueCollections.filter((dc: any) => dc.collection_date === currentDayStr && dc.invoice_id.startsWith('INV-'));
            
            const dayCollection = dayInvoices.reduce((s, i) => s + i.paid_amount, 0) + dayDueRecov.reduce((s, d) => s + d.amount_collected, 0);
            runningTotal += dayCollection;

            dailyData.push({
                date: currentDayStr,
                collection: dayCollection,
                runningTotal: runningTotal
            });
        }
        return dailyData;
    }, [invoices, dueCollections, selectedMonth, selectedYear]);

    const dueList = useMemo(() => {
        return invoices.filter((inv: any) => 
            inv.due_amount > 1 && inv.status !== 'Cancelled' &&
            (inv.patient_name.toLowerCase().includes(dueSearch.toLowerCase()) || inv.invoice_id.toLowerCase().includes(dueSearch.toLowerCase()))
        ).sort((a: any, b: any) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [invoices, dueSearch]);

    // --- PRINT FUNCTIONS (LANDSCAPE A4) ---
    const handlePrintSummary = (currentStats: any, rangeLabel: string) => {
        const win = window.open('', '_blank');
        if(!win) return;
        const html = `
            <html>
                <head>
                    <title>Summary Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@page { size: A4; margin: 20mm; } body { background: white; font-family: serif; color: black; }</style>
                </head>
                <body class="p-8">
                    <div class="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                    </div>
                    <h2 class="text-center font-bold text-lg underline mb-6">Accounts Summary: ${rangeLabel}</h2>
                    <div class="grid grid-cols-2 gap-10">
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-xs">Collection Analysis</h3>
                            <table class="w-full text-xs border-collapse">
                                <tr><td class="border border-gray-400 p-2">Pathology</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.pathology.toLocaleString()}</td></tr>
                                <tr><td class="border border-gray-400 p-2">Hormone</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.hormone.toLocaleString()}</td></tr>
                                <tr><td class="border border-gray-400 p-2">USG</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.usg.toLocaleString()}</td></tr>
                                <tr><td class="border border-gray-400 p-2">X-Ray</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.xray.toLocaleString()}</td></tr>
                                <tr><td class="border border-gray-400 p-2">ECG</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.ecg.toLocaleString()}</td></tr>
                                <tr><td class="border border-gray-400 p-2">Due Recovery</td><td class="border border-gray-400 p-2 text-right">${currentStats.coll.dueRecov.toLocaleString()}</td></tr>
                                <tr class="font-bold bg-gray-100"><td class="border border-gray-400 p-2">Total Collection</td><td class="border border-gray-400 p-2 text-right">${currentStats.totalColl.toLocaleString()}</td></tr>
                            </table>
                        </div>
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-xs">Expense Analysis</h3>
                            <table class="w-full text-xs border-collapse">
                                ${expenseCategories.map(cat => `<tr><td class="border border-gray-400 p-2">${expenseCategoryBanglaMap[cat] || cat}</td><td class="border border-gray-400 p-2 text-right">${(currentStats.expenseMap?.[cat] || 0).toLocaleString()}</td></tr>`).join('')}
                                <tr class="font-bold bg-gray-100"><td class="border border-gray-400 p-2">Total Expense</td><td class="border border-gray-400 p-2 text-right">${currentStats.exp.total.toLocaleString()}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="mt-10 p-4 border-2 border-black flex justify-between font-bold text-xl">
                        <span>Net Balance:</span>
                        <span>৳ ${currentStats.balance.toLocaleString()}</span>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const handlePrintDetailedLog = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const html = `
            <html>
                <head>
                    <title>Detailed Collection Log</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4 landscape; margin: 10mm; } 
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: black; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 8.5pt; }
                        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; }
                        .date-header { background: #eee; padding: 6px; font-weight: 900; text-align: center; border: 2px solid #000; border-bottom: none; }
                    </style>
                </head>
                <body class="p-4">
                    <div class="text-center mb-6 border-b-2 border-black pb-4">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm">Diagnostic Collection Detailed Journal - ${monthOptions[selectedMonth].name} ${selectedYear}</p>
                    </div>
                    ${Object.entries(detailTableData).map(([date, rows]) => `
                        <div class="mb-8">
                            <div class="date-header">Date- ${formatGroupingDate(date)}</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Patient Description</th>
                                        <th>Refd Dr.</th>
                                        <th>Tests / Parameters</th>
                                        <th class="text-right">Bill Amt</th>
                                        <th class="text-right">Cash Paid</th>
                                        <th class="text-right">USG</th>
                                        <th class="text-right">PC</th>
                                        <th class="text-right">Balance</th>
                                        <th class="text-right">Due</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map(r => `
                                        <tr>
                                            <td class="font-mono">${r.id.split('-').pop()}</td>
                                            <td class="font-bold">${r.patientDesc}</td>
                                            <td>${r.refDr}</td>
                                            <td class="italic">${r.tests}</td>
                                            <td class="text-right">${r.billAmt.toLocaleString()}</td>
                                            <td class="text-right font-bold">${r.paid.toLocaleString()}</td>
                                            <td class="text-right">${r.usg.toLocaleString()}</td>
                                            <td class="text-right">${r.pc.toLocaleString()}</td>
                                            <td class="text-right font-black bg-gray-50">${r.balance.toLocaleString()}</td>
                                            <td class="text-right text-red-600">${r.due.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 750);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <header className="bg-slate-800 border-b border-slate-700 p-5 flex flex-col md:flex-row justify-between items-center gap-4 no-print shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-white transition-all"><BackIcon className="w-5 h-5" /></button>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Diagnostic Accounts Console</h2>
                </div>
                <div className="flex bg-slate-900 rounded-2xl p-1 shadow-inner border border-slate-800 overflow-x-auto max-w-full">
                    {[
                        { id: 'entry', label: 'Data Entry' }, 
                        { id: 'daily', label: 'Daily Hishab' }, 
                        { id: 'monthly', label: 'Monthly Hishab' }, 
                        { id: 'yearly', label: 'Yearly Hishab' },
                        { id: 'detail', label: 'Collection Detail' },
                        { id: 'due', label: 'Due List' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar container mx-auto">
                {activeTab === 'entry' && (
                    <div className="animate-fade-in space-y-8">
                        <DailyExpenseForm selectedDate={selectedDate} onDateChange={setSelectedDate} dailyExpenseItems={detailedExpenses[selectedDate] || []} onSave={handleSaveExpense} employees={employees} />
                        
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                                <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="text-emerald-500" /> Saved Entry List for {selectedDate}
                                </h4>
                                
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Search entries..." 
                                            value={entrySearch}
                                            onChange={e => setEntrySearch(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <select 
                                        value={entryCategoryFilter} 
                                        onChange={e => setEntryCategoryFilter(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                                    >
                                        <option value="All">All Categories</option>
                                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                             </div>

                             <div className="overflow-x-auto min-h-[200px]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Sub-Category</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredSavedEntries.length > 0 ? filteredSavedEntries.map((ex: any) => (
                                            <tr key={ex.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-4">
                                                    <span className="text-blue-400 font-bold text-xs uppercase">{ex.category}</span>
                                                    <div className="text-[9px] text-slate-500 font-bold font-bengali">{expenseCategoryBanglaMap[ex.category]}</div>
                                                </td>
                                                <td className="p-4 text-slate-300 font-black text-sm">{ex.subCategory || '---'}</td>
                                                <td className="p-4 text-slate-500 text-xs italic">{ex.description || 'No description'}</td>
                                                <td className="p-4 text-right text-emerald-400 font-black text-base">৳ {ex.paidAmount.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-lg tracking-[0.2em]">
                                                    No entries found matching filters
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {filteredSavedEntries.length > 0 && (
                                        <tfoot className="bg-slate-900 font-black border-t-2 border-slate-700">
                                            <tr>
                                                <td colSpan={3} className="p-4 text-right text-slate-500 uppercase tracking-widest text-xs">Filtered Total:</td>
                                                <td className="p-4 text-right text-white text-lg underline decoration-emerald-500">
                                                    ৳ {filteredSavedEntries.reduce((s: number, i: any) => s + i.paidAmount, 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                             </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex justify-between items-center bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
                             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                {activeTab === 'daily' ? `Daily Hishab: ${selectedDate}` : 
                                 activeTab === 'monthly' ? `Monthly Hishab: ${monthOptions[selectedMonth].name} ${selectedYear}` : 
                                 `Yearly Hishab: ${selectedYear}`}
                             </h2>
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => handlePrintSummary(
                                        activeTab === 'daily' ? stats.daily : activeTab === 'monthly' ? stats.monthly : stats.yearly,
                                        activeTab === 'daily' ? selectedDate : activeTab === 'monthly' ? `${monthOptions[selectedMonth].name} ${selectedYear}` : `${selectedYear}`
                                    )}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"
                                >
                                    <PrinterIcon size={14}/> Print Summary
                                </button>
                                {activeTab === 'daily' ? (
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-700 border border-slate-600 rounded p-2 text-white font-bold" />
                                ) : (
                                    <>
                                        {activeTab === 'monthly' && (
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-2 text-white font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                        )}
                                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-2 text-white font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </>
                                )}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SummaryBox 
                                title="Collection (কালেকশন)" 
                                colorClass="text-blue-400" 
                                totalLabel="Total Collection" 
                                totalValue={activeTab === 'daily' ? stats.daily.totalColl : activeTab === 'monthly' ? stats.monthly.totalColl : stats.yearly.totalColl} 
                                items={[
                                    { label: 'Pathology', value: activeTab === 'daily' ? stats.daily.coll.pathology : activeTab === 'monthly' ? stats.monthly.coll.pathology : stats.yearly.coll.pathology }, 
                                    { label: 'Hormone', value: activeTab === 'daily' ? stats.daily.coll.hormone : activeTab === 'monthly' ? stats.monthly.coll.hormone : stats.yearly.coll.hormone }, 
                                    { label: 'USG', value: activeTab === 'daily' ? stats.daily.coll.usg : activeTab === 'monthly' ? stats.monthly.coll.usg : stats.yearly.coll.usg }, 
                                    { label: 'X-Ray', value: activeTab === 'daily' ? stats.daily.coll.xray : activeTab === 'monthly' ? stats.monthly.coll.xray : stats.yearly.coll.xray }, 
                                    { label: 'ECG', value: activeTab === 'daily' ? stats.daily.coll.ecg : activeTab === 'monthly' ? stats.monthly.coll.ecg : stats.yearly.coll.ecg }, 
                                    { label: 'Due Recovery', value: activeTab === 'daily' ? stats.daily.coll.dueRecov : activeTab === 'monthly' ? stats.monthly.coll.dueRecov : stats.yearly.coll.dueRecov }
                                ]} 
                            />
                            <SummaryBox 
                                title="Expenses (খরচ)" 
                                colorClass="text-rose-400" 
                                totalLabel="Total Expense" 
                                totalValue={activeTab === 'daily' ? stats.daily.exp.total : activeTab === 'monthly' ? stats.monthly.exp.total : stats.yearly.exp.total} 
                                items={expenseCategories.map(cat => ({ 
                                    label: expenseCategoryBanglaMap[cat], 
                                    value: activeTab === 'daily' ? (stats.daily.expenseMap?.[cat] || 0) : activeTab === 'monthly' ? (stats.monthly.expenseMap?.[cat] || 0) : (stats.yearly.expenseMap?.[cat] || 0) 
                                }))} 
                            />
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-10 pt-5 no-print">
                            <div className="inline-block p-10 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-[3rem] border border-white/10 shadow-2xl text-center transform hover:scale-105 transition-all shrink-0">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 drop-shadow-md">Net Balance</p>
                                <h4 className={`text-6xl font-black ${ (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance) >= 0 ? 'text-green-400' : 'text-rose-500' } drop-shadow-xl`}>
                                    { (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance).toLocaleString() } ৳
                                </h4>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'detail' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-700 pb-4 no-print">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Collection Detailed List</h3>
                                    <div className="flex bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-700">
                                        <button onClick={() => setDetailViewMode('today')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${detailViewMode === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Today</button>
                                        <button onClick={() => setDetailViewMode('historical')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${detailViewMode === 'historical' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Historical</button>
                                        <button onClick={() => setDetailViewMode('monthly_summary')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${detailViewMode === 'monthly_summary' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Monthly Collection</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handlePrintDetailedLog}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg"
                                    >
                                        <PrinterIcon size={14}/> Print Detailed Log
                                    </button>
                                    <div className="relative w-64">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input type="text" placeholder="Search Patient, ID..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            {detailViewMode === 'monthly_summary' ? (
                                <div className="animate-fade-in bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto w-full">
                                    <div className="p-5 bg-slate-950 border-b border-slate-700 flex justify-between items-center font-black uppercase text-xs tracking-widest text-emerald-400">
                                        <span>Monthly Performance Tracker: {monthOptions[selectedMonth].name} {selectedYear}</span>
                                        <div className="flex gap-2">
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-800 p-1 rounded text-[10px] text-white outline-none border border-slate-700">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 p-1 rounded text-[10px] text-white outline-none border border-slate-700">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                        </div>
                                    </div>
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                            <tr><th className="p-5 border-b border-slate-800">Date (তারিখ)</th><th className="p-5 border-b border-slate-800 text-right">Daily Collection (দিনের আদায়)</th><th className="p-5 border-b border-slate-800 text-right text-emerald-400">Running Total (মোট জমা)</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {monthlySummaryData.map((day, i) => (
                                                <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${day.collection > 0 ? 'bg-emerald-950/5' : ''}`}>
                                                    <td className="p-4 font-bold text-slate-300 font-mono">{day.date}</td>
                                                    <td className="p-4 text-right font-black text-slate-400">৳ {day.collection.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-black text-emerald-400 text-lg">৳ {day.runningTotal.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {Object.entries(detailTableData).length > 0 ? Object.entries(detailTableData).map(([date, rows]) => (
                                        <div key={date} className="animate-fade-in bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center px-10 shadow-inner">
                                                <h4 className="text-lg font-black text-sky-400 tracking-widest uppercase">Date- {formatGroupingDate(date)}</h4>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rows.length} Patient Records</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-[11px] border-collapse">
                                                    <thead className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                                        <tr>
                                                            <th className="p-4">Id</th>
                                                            <th className="p-4">Patient Description</th>
                                                            <th className="p-4">Refd Dr.</th>
                                                            <th className="p-4">Tests / Parameters</th>
                                                            <th className="p-4 text-right">Bill Amt</th>
                                                            <th className="p-4 text-right text-emerald-400">Cash Paid</th>
                                                            <th className="p-4 text-right text-sky-400">USG</th>
                                                            <th className="p-4 text-right text-amber-400">PC</th>
                                                            <th className="p-4 text-right text-blue-400">Balance</th>
                                                            <th className="p-4 text-right text-rose-500">Due</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800">
                                                        {rows.map((row, i) => (
                                                            <tr key={i} className="hover:bg-slate-800/40 transition-colors group">
                                                                <td className="p-4 font-mono text-[10px] text-slate-500">{row.id.split('-').pop()}</td>
                                                                <td className="p-4">
                                                                    <div className="font-black text-slate-100 uppercase group-hover:text-blue-400 transition-colors">{row.patientDesc}</div>
                                                                    <div className="text-[9px] text-slate-600 font-mono mt-0.5">{row.id}</div>
                                                                </td>
                                                                <td className="p-4 text-slate-400 font-medium truncate max-w-[100px]" title={row.refDr}>{row.refDr}</td>
                                                                <td className="p-4 text-slate-500 italic text-[10px] truncate max-w-[180px]" title={row.tests}>{row.tests}</td>
                                                                <td className="p-4 text-right font-bold text-slate-300">৳{row.billAmt.toLocaleString()}</td>
                                                                <td className="p-4 text-right font-black text-emerald-400">৳{row.paid.toLocaleString()}</td>
                                                                <td className="p-4 text-right text-sky-400 font-bold">৳{row.usg.toLocaleString()}</td>
                                                                <td className="p-4 text-right text-amber-400 font-bold">৳{row.pc.toLocaleString()}</td>
                                                                <td className="p-4 text-right font-black text-blue-400 bg-blue-950/10 shadow-inner">৳{row.balance.toLocaleString()}</td>
                                                                <td className="p-4 text-right font-black text-rose-600">৳{row.due.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-xl tracking-[0.2em]">
                                            No Data matching filters found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'due' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
                            <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Outstanding Dues List</h3>
                                <input value={dueSearch} onChange={e=>setDueSearch(e.target.value)} placeholder="Search Patient..." className="p-2.5 w-80 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-50 border-b-2 border-slate-300 text-slate-700 uppercase font-black tracking-wider">
                                        <tr>
                                            <th className="p-3 border-r border-slate-200">Date</th>
                                            <th className="p-3 border-r border-slate-200">Patient Name</th>
                                            <th className="p-3 border-r border-slate-200 text-right">Total Bill</th>
                                            <th className="p-3 text-right bg-red-50 text-red-700">Due Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {dueList.map((inv: any, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50 transition-colors text-slate-900 font-medium">
                                                <td className="p-3 border-r border-slate-200 font-mono text-[10px]">{inv.invoice_date}</td>
                                                <td className="p-3 border-r border-slate-200 font-black uppercase">{inv.patient_name}</td>
                                                <td className="p-3 border-r border-slate-200 text-right font-bold">৳ {inv.total_amount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-red-600 bg-red-50/50">৳ {inv.due_amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white font-black text-sm">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-right uppercase tracking-widest text-xs">Total Outstanding Due:</td>
                                            <td className="p-4 text-right text-yellow-400 text-xl">৳ {dueList.reduce((s: number, i: any) => s + i.due_amount, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {successMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-10 py-3 rounded-full shadow-2xl font-black uppercase tracking-widest animate-fade-in-up z-[500]">
                    ✓ {successMessage}
                </div>
            )}
        </div>
    );
};

export default DiagnosticAccountsPage;