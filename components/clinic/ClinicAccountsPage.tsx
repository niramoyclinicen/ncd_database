
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ExpenseItem, Employee, DueCollection } from '../DiagnosticData';
import { IndoorInvoice } from '../ClinicPage';
import { ClinicIcon, Activity, BackIcon, FileTextIcon, PrinterIcon, SearchIcon } from '../Icons';

// --- Clinic Specific Categories Revised ---
const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'Medicine buy (Pharmacy)', 'X-Ray', 'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

const serviceCategoriesList = ["Conservative treatment", "Operation", "NVD and D&C", "O2 and nebulizer", "Plaster and Bandage", "Others"];

const expenseCategoryBanglaMap: Record<string, string> = {
    'Stuff salary': 'স্টাফ স্যালারী', 'Generator': 'জেনারেটর', 'Motorcycle': 'মোটর সাইকেল',
    'Marketing': 'মার্কেটিং', 'Clinic development': 'ক্লিনিক উন্নয়ন',
    'Medicine buy (Pharmacy)': 'ঔষধ ক্রয় (ফার্মেসী)', 'X-Ray': 'এক্স-রে খরচ', 'House rent': 'বাড়ী ভাড়া',
    'Stationery': 'স্টেশনারী', 'Food/Refreshment': 'আপ্যায়ন/খাবার', 'Doctor donation': 'ডাক্তার ডোনেশন',
    'Repair/Instruments': 'যন্ত্রপাতি মেরামত', 'Press': 'প্রেস/ছাপা খরচ', 'License/Official': 'লাইসেন্স/অফিসিয়াল',
    'Bank/NGO Installment': 'ব্যাংক/এনজিও কিস্তি', 'Mobile': 'মোবাইল খরচ', 'Interest/Loan': 'কিস্তি/সুদ',
    'Others': 'অন্যান্য', 'Old Loan Repay': 'পূর্বের ঋণ পরিশোধ'
};

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const SummaryCard = ({ title, dateLabel, stats }: { title: string, dateLabel: string, stats: any }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col h-full">
        <h4 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">{title}</h4>
        <p className="text-[10px] text-slate-500 mb-6 font-black uppercase tracking-widest border-b border-slate-700 pb-2">{dateLabel}</p>
        <div className="space-y-3 flex-1 text-sm">
            <div className="flex justify-between items-center text-slate-400"><span>Gross Bill:</span> <span className="text-white font-bold">৳{stats.totalBill.toLocaleString()}</span></div>
            <div className="flex justify-between items-center border-t border-slate-700/50 pt-2 font-black text-sky-400"><span>Net Payable:</span> <span>৳{stats.netPayable.toLocaleString()}</span></div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 mt-4 space-y-2">
                <div className="flex justify-between items-center text-emerald-400 font-bold"><span>Paid Amt:</span> <span>৳{stats.paid.toLocaleString()}</span></div>
                <div className="flex justify-between items-center text-teal-400 font-bold"><span>Due Recov:</span> <span>+৳{stats.dueRecovery.toLocaleString()}</span></div>
                <div className="flex justify-between items-center text-rose-500 font-bold"><span>Expenses:</span> <span>-৳{stats.expense.toLocaleString()}</span></div>
            </div>
        </div>
        <div className="mt-6 pt-4 border-t-2 border-slate-700 flex justify-between items-end">
            <span className="text-sm text-slate-300 font-black uppercase">Net Cash Result</span>
            <span className={`text-2xl font-black ${stats.balance >= 0 ? 'text-green-400' : 'text-red-500'}`}>{stats.balance.toLocaleString()} ৳</span>
        </div>
    </div>
);

const DailyExpenseForm: React.FC<any> = ({ selectedDate, onDateChange, items: initialItems, onSave, employees }) => {
    const [items, setItems] = useState<ExpenseItem[]>(initialItems.length > 0 ? initialItems : [{
        id: Date.now(), category: clinicExpenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0
    }]);
    useEffect(() => { setItems(initialItems.length > 0 ? initialItems : [{ id: Date.now(), category: clinicExpenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0 }]); }, [initialItems, selectedDate]);
    const handleItemChange = (id: number, field: keyof ExpenseItem, value: any) => setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    const totals = items.reduce((acc, item) => { acc.cost += Number(item.billAmount) || 0; acc.paid += Number(item.paidAmount) || 0; return acc; }, { cost: 0, paid: 0 });
    const inputClass = "w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-white text-sm outline-none";

    return (
        <div className="bg-emerald-950/40 rounded-xl p-6 border border-emerald-800/50 shadow-xl no-print">
            <div className="flex justify-between items-center mb-6 border-b border-emerald-800/50 pb-4">
                <h3 className="text-xl font-bold text-emerald-100 flex items-center gap-2"><Activity className="w-5 h-5" /> Clinic Daily Expense</h3>
                <input type="date" value={selectedDate} onChange={e => onDateChange(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-emerald-400 uppercase tracking-widest"><th className="pb-3">Category</th><th className="pb-3">Details</th><th className="pb-3 text-right">Bill</th><th className="pb-3 text-right">Paid</th><th className="pb-3 text-center">X</th></tr></thead><tbody>{items.map(item => (<tr key={item.id} className="border-t border-emerald-900/30"><td className="py-2 pr-2"><select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className={inputClass}>{clinicExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></td><td className="py-2 pr-2"><input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputClass} placeholder="Details..."/></td><td className="py-2 pr-2"><input type="number" value={item.billAmount} onChange={e => handleItemChange(item.id, 'billAmount', parseFloat(e.target.value) || 0)} className={`${inputClass} text-right`} /></td><td className="py-2 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className={`${inputClass} text-right`} /></td><td className="py-2 text-center"><button onClick={() => setItems(items.filter(i=>i.id!==item.id))} className="text-red-400 font-bold">×</button></td></tr>))}</tbody></table></div>
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => setItems([...items, { id: Date.now(), category: clinicExpenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0 }])} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500">+ Add</button>
                <div className="flex gap-6 items-center"><div className="text-slate-400">Total Paid: <span className="text-emerald-400 font-bold text-lg">{totals.paid.toLocaleString()}</span></div><button onClick={() => onSave(selectedDate, items)} className="bg-green-600 text-white px-8 py-2 rounded font-black shadow-lg hover:bg-green-500">SAVE DATA</button></div>
            </div>
        </div>
    );
};

const ClinicAccountsPage: React.FC<any> = ({ 
  onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses 
}) => {
    const [viewMode, setViewMode] = useState<'detailed' | 'summary' | 'collection' | 'daily_summary'>('detailed');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isTodayFilter, setIsTodayFilter] = useState(false);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { if(successMsg) setTimeout(() => setSuccessMsg(''), 3000); }, [successMsg]);

    const handleSave = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev:any) => ({ ...prev, [date]: items }));
        setSuccessMsg("Clinic Expense Saved!");
    };

    const summaryData = useMemo(() => {
        const monthInvoices = invoices.filter((inv:any) => {
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
        const monthDueRecov = dueCollections.filter((dc:any) => {
            const isClinic = !dc.invoice_id.startsWith('INV-');
            const d = new Date(dc.collection_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && isClinic;
        }).reduce((sum:any, dc:any) => sum + dc.amount_collected, 0);

        const totalCollection = monthInvoices.reduce((sum:any, inv:any) => sum + inv.paid_amount, 0) + monthDueRecov;
        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        Object.entries(detailedExpenses).forEach(([date, items]:any) => {
            const d = new Date(date);
            if(d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
                items.forEach((it:any) => expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + it.paidAmount);
            }
        });
        const totalExpense = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
        return { totalCollection, expensesByCategory, totalExpense, balance: totalCollection - totalExpense };
    }, [selectedMonth, selectedYear, invoices, dueCollections, detailedExpenses]);

    const dailySummaryData = useMemo(() => {
        const dayInvoices = invoices.filter((inv: any) => inv.invoice_date === selectedDate);
        const dayDueRecov = dueCollections.filter((dc: any) => {
            const isClinic = !dc.invoice_id.startsWith('INV-');
            return dc.collection_date === selectedDate && isClinic;
        }).reduce((sum: any, dc: any) => sum + dc.amount_collected, 0);

        const totalCollection = dayInvoices.reduce((sum: any, inv: any) => sum + inv.paid_amount, 0) + dayDueRecov;
        
        const dayExpenses = detailedExpenses[selectedDate] || [];
        const totalExpense = dayExpenses.reduce((s: number, it: any) => s + it.paidAmount, 0);
        
        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        dayExpenses.forEach((it: any) => {
            expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + it.paidAmount;
        });

        return { totalCollection, totalExpense, expensesByCategory, balance: totalCollection - totalExpense };
    }, [selectedDate, invoices, dueCollections, detailedExpenses]);

    const collectionReportData = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return invoices.filter((inv: any) => {
            if (isTodayFilter) return inv.invoice_date === todayStr;
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).filter((inv: any) => 
            inv.patient_name.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
            inv.admission_id.toLowerCase().includes(invoiceSearch.toLowerCase())
        );
    }, [invoices, isTodayFilter, selectedMonth, selectedYear, invoiceSearch]);

    const handlePrintSummary = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const title = viewMode === 'daily_summary' ? `Clinic Daily Summary - ${selectedDate}` : `Clinic Monthly Summary - ${monthOptions[selectedMonth].name} ${selectedYear}`;
        const currentData = viewMode === 'daily_summary' ? dailySummaryData : summaryData;

        const html = `
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@page { size: A4; margin: 20mm; } body { background: white; font-family: serif; color: black; }</style>
                </head>
                <body class="p-10">
                    <div class="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm">${title}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10">
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-sm">Revenue Analysis</h3>
                            <table class="w-full text-xs">
                                <tr><td class="py-1">Total Collection</td><td class="text-right">৳${(currentData.totalCollection).toLocaleString()}</td></tr>
                                <tr class="font-bold border-t border-black"><td>Grand Total Revenue</td><td class="text-right">৳${currentData.totalCollection.toLocaleString()}</td></tr>
                            </table>
                        </div>
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-sm">Expense Analysis</h3>
                            <table class="w-full text-xs">
                                ${clinicExpenseCategories.map(cat => `<tr><td class="py-1">${expenseCategoryBanglaMap[cat] || cat}</td><td class="text-right">৳${(currentData.expensesByCategory[cat] || 0).toLocaleString()}</td></tr>`).join('')}
                                <tr class="font-bold border-t border-black"><td>Total Expense</td><td class="text-right">৳${currentData.totalExpense.toLocaleString()}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="mt-12 p-6 border-4 border-black flex justify-between items-center">
                        <span class="text-xl font-black uppercase">Net Balance:</span>
                        <span class="text-3xl font-black">৳${currentData.balance.toLocaleString()}</span>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    return (
        <div className="bg-slate-900 min-h-screen text-slate-200 flex flex-col font-sans">
            <header className="bg-slate-800 border-b border-slate-700 p-6 sticky top-0 z-20 no-print flex justify-between items-center shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-all"><BackIcon className="w-5 h-5" /></button>
                    <h1 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Clinic Accounts Console</h1>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-1 overflow-x-auto max-w-full">
                    <button onClick={() => setViewMode('detailed')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'detailed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Daily Journal</button>
                    <button onClick={() => setViewMode('collection')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'collection' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Collection Report</button>
                    <button onClick={() => setViewMode('daily_summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'daily_summary' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Daily Summary</button>
                    <button onClick={() => setViewMode('summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'summary' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Monthly Summary</button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-6 space-y-8">
                {viewMode === 'detailed' && (
                    <div className="space-y-8">
                        <DailyExpenseForm selectedDate={selectedDate} onDateChange={setSelectedDate} items={detailedExpenses[selectedDate] || []} onSave={handleSave} employees={employees} />
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                            <h3 className="text-lg font-black text-sky-400 uppercase mb-6 flex justify-between items-center">
                                <span>Indoor Invoices Journal</span>
                                <input type="text" placeholder="Search Patient..." value={invoiceSearch} onChange={e=>setInvoiceSearch(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-full px-5 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500 w-64"/>
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-700">
                                <table className="w-full text-left text-sm"><thead className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black"><tr><th className="p-4">ID</th><th className="p-4">Patient Name</th><th className="p-4 text-right">Total Bill</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Due</th></tr></thead>
                                <tbody className="divide-y divide-slate-800">{invoices.filter((inv:any)=>inv.patient_name.toLowerCase().includes(invoiceSearch.toLowerCase())).map((inv:any) => (<tr key={inv.daily_id} className="hover:bg-slate-700/40 transition-colors"><td className="p-4 font-mono text-cyan-400 text-xs">{inv.daily_id}</td><td className="p-4 font-bold">{inv.patient_name}</td><td className="p-4 text-right">৳{inv.total_bill.toLocaleString()}</td><td className="p-4 text-right text-emerald-400 font-bold">৳{inv.paid_amount.toLocaleString()}</td><td className="p-4 text-right text-rose-500 font-bold">৳{inv.due_bill.toLocaleString()}</td></tr>))}</tbody></table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'collection' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-6">
                            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-700 pb-4 no-print">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Patient Collection Report</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsTodayFilter(true)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${isTodayFilter ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'}`}>Today's Collection</button>
                                        <button onClick={() => setIsTodayFilter(false)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!isTodayFilter ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'}`}>Monthly View</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isTodayFilter && (
                                        <div className="flex gap-2 mr-4">
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                        </div>
                                    )}
                                    <div className="relative w-64">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input type="text" placeholder="Search Patient/Admission ID..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[400px] border border-slate-700 rounded-xl bg-slate-950/20">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-900/80 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">
                                        <tr>
                                            <th className="p-3 border-r border-slate-800">Adm. ID</th>
                                            <th className="p-3 border-r border-slate-800">Adm. Date</th>
                                            <th className="p-3 border-r border-slate-800">Patient Name</th>
                                            <th className="p-3 border-r border-slate-800">Adm. Fee</th>
                                            <th className="p-3 border-r border-slate-800">Indication</th>
                                            <th className="p-3 border-r border-slate-800">Doctor</th>
                                            <th className="p-3 border-r border-slate-800">Discharge</th>
                                            <th className="p-3 border-r border-slate-800">Services Taken</th>
                                            <th className="p-3 text-right bg-emerald-900/10 text-emerald-400">Paid Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {collectionReportData.length > 0 ? collectionReportData.map((inv: any) => {
                                            const admFeeItem = inv.items.find((it: any) => it.service_type.toLowerCase().includes('admission'));
                                            const admFee = admFeeItem ? admFeeItem.payable_amount : 0;
                                            const servicesTaken = inv.items.map((it: any) => it.service_type).join(', ');
                                            return (
                                                <tr key={inv.daily_id} className="hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3 font-mono text-cyan-500 border-r border-slate-800">{inv.admission_id}</td>
                                                    <td className="p-3 font-bold border-r border-slate-800">{inv.admission_date || inv.invoice_date}</td>
                                                    <td className="p-3 font-black text-slate-200 border-r border-slate-800 uppercase">{inv.patient_name}</td>
                                                    <td className="p-3 font-bold text-slate-400 border-r border-slate-800 text-center">{admFee.toLocaleString()}</td>
                                                    <td className="p-3 text-slate-400 border-r border-slate-800 italic">{inv.indication || '---'}</td>
                                                    <td className="p-3 font-bold border-r border-slate-800 text-sky-400">{inv.doctor_name || 'Self'}</td>
                                                    <td className="p-3 border-r border-slate-800 text-slate-500">{inv.discharge_date || 'N/A'}</td>
                                                    <td className="p-3 text-slate-400 border-r border-slate-800 truncate max-w-[150px]" title={servicesTaken}>{servicesTaken}</td>
                                                    <td className="p-3 text-right font-black text-emerald-400 bg-emerald-900/5">৳ {inv.paid_amount.toLocaleString()}</td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={9} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-xl tracking-[0.2em]">No Collection Records Found</td></tr>
                                        )}
                                    </tbody>
                                    {collectionReportData.length > 0 && (
                                        <tfoot className="bg-slate-900 text-white font-black">
                                            <tr>
                                                <td colSpan={8} className="p-4 text-right uppercase tracking-widest text-[10px]">Grand Total Collection:</td>
                                                <td className="p-4 text-right text-emerald-400 text-lg">৳ {collectionReportData.reduce((s: number, i: any) => s + i.paid_amount, 0).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'daily_summary' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                            <h2 className="text-xl font-black text-white uppercase flex items-center gap-3">
                                <Activity className="text-amber-500" /> Daily Summary: {selectedDate}
                            </h2>
                            <div className="flex gap-4">
                                <button onClick={handlePrintSummary} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><PrinterIcon size={14}/> Print Report</button>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold focus:ring-1 focus:ring-amber-500 outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-emerald-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Daily Revenue</h3>
                                <div className="space-y-3 font-bold">
                                    <div className="flex justify-between"><span>Cash Collection:</span> <span>৳{dailySummaryData.totalCollection.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t border-slate-700 pt-3 text-white"><span>Total Income:</span> <span>৳{dailySummaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Daily Operating Cost</h3>
                                <div className="space-y-2 text-xs">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span>৳{(dailySummaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                    <div className="flex justify-between text-lg border-t border-slate-700 pt-3 text-white"><span>Total Cost:</span> <span>৳{dailySummaryData.totalExpense.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-10">
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-10 rounded-[3rem] text-center shadow-2xl border-2 border-amber-500/20 scale-110">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Daily Net Profit/Loss</p>
                                <h4 className={`text-5xl font-black ${dailySummaryData.balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳{dailySummaryData.balance.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'summary' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                            <h2 className="text-xl font-black text-white uppercase">Summary: {monthOptions[selectedMonth].name} {selectedYear}</h2>
                            <div className="flex gap-4">
                                <button onClick={handlePrintSummary} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><PrinterIcon size={14}/> Print Report</button>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-blue-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Revenue Streams</h3>
                                <div className="space-y-3 font-bold">
                                    <div className="flex justify-between"><span>Inpatient Bill Recovery:</span> <span>৳{summaryData.totalCollection.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t border-slate-700 pt-3 text-white"><span>Total Income:</span> <span>৳{summaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Clinic Operations Cost</h3>
                                <div className="space-y-2 text-xs">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span>৳{(summaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                    <div className="flex justify-between text-lg border-t border-slate-700 pt-3 text-white"><span>Total Cost:</span> <span>৳{summaryData.totalExpense.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-10">
                            <div className="bg-gradient-to-br from-indigo-700 to-slate-900 p-10 rounded-[3rem] text-center shadow-2xl border border-white/10 scale-110">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Monthly Net Profit</p>
                                <h4 className={`text-5xl font-black ${summaryData.balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳{summaryData.balance.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClinicAccountsPage;
