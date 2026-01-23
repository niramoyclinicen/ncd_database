import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice as Invoice, DueCollection, ExpenseItem, Employee, Reagent } from '../DiagnosticData';
import { Activity, BackIcon, FileTextIcon, SearchIcon, PrinterIcon, DatabaseIcon } from '../Icons';

// --- Configuration & Data ---
const expenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Diagnostic development', 
    'Bills', 'Reagent buy', 'X-Ray', 'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

const expenseCategoryBanglaMap: Record<string, string> = {
    'Stuff salary': 'স্টাফ স্যালারী', 'Generator': 'জেনারেটর', 'Motorcycle': 'মোটর সাইকেল',
    'Marketing': 'মার্কেটিং', 'Diagnostic development': 'ডায়াগনস্টিক উন্নয়ন', 'Bills': 'বিদ্যুৎ+ পেপার+ ডিশ বিল',
    'Reagent buy': 'রিএজেন্ট ক্রয়', 'X-Ray': 'এক্স-রে খরচ', 'House rent': 'বাড়ী ভাড়া',
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
            <div className="overflow-x-auto">
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
                                    <input value={item.subCategory} onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs" />
                                </td>
                                <td className="py-2 pr-2"><input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs" /></td>
                                <td className="py-2 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className="w-24 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-xs text-right" /></td>
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
                    <button onClick={() => onSave(selectedDate, items)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-xl font-black shadow-lg uppercase text-xs tracking-widest">Save Data</button>
                </div>
            </div>
        </div>
    );
};

const DiagnosticAccountsPage: React.FC<any> = ({ 
    onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses, setReagents 
}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'entry' | 'daily' | 'monthly' | 'yearly' | 'detail' | 'due'>('entry');
    const [detailSearch, setDetailSearch] = useState('');
    const [dueSearch, setDueSearch] = useState('');
    const [entrySearch, setEntrySearch] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); }
    }, [successMessage]);

    const handleSaveExpense = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => ({ ...prev, [date]: items }));
        setSuccessMessage("Expense data saved successfully!");
    };

    const stats = useMemo(() => {
        const getRangeStats = (rangeType: 'daily' | 'monthly' | 'yearly') => {
            const isMatch = (dateStr: string) => {
                const d = new Date(dateStr);
                if (rangeType === 'daily') return dateStr === selectedDate;
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                return d.getFullYear() === selectedYear;
            };

            const coll = { pathology: 0, hormone: 0, usg: 0, xray: 0, ecg: 0, dueRecov: 0 };
            invoices.forEach((inv: Invoice) => {
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

            dueCollections.forEach((dc: DueCollection) => {
                if (isMatch(dc.collection_date) && dc.invoice_id.startsWith('INV')) {
                    coll.dueRecov += dc.amount_collected;
                }
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

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <header className="bg-slate-800 border-b border-slate-700 p-5 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-white"><BackIcon className="w-5 h-5" /></button>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Diagnostic Accounts Console</h2>
                </div>
                <div className="flex bg-slate-900 rounded-2xl p-1 shadow-inner border border-slate-800 overflow-x-auto max-w-full">
                    {[
                        { id: 'entry', label: 'Data Entry' }, 
                        { id: 'daily', label: 'Daily Hishab' }, 
                        { id: 'monthly', label: 'Monthly Hishab' }, 
                        { id: 'yearly', label: 'Yearly Hishab' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {activeTab === 'entry' && (
                    <div className="space-y-6">
                        <DailyExpenseForm selectedDate={selectedDate} onDateChange={setSelectedDate} dailyExpenseItems={detailedExpenses[selectedDate] || []} onSave={handleSaveExpense} employees={employees} />
                    </div>
                )}

                {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 no-print">
                            <h3 className="text-xl font-black text-white uppercase">
                                {activeTab === 'daily' ? `Daily Summary: ${selectedDate}` : 
                                 activeTab === 'monthly' ? `Monthly Summary: ${monthOptions[selectedMonth].name} ${selectedYear}` : 
                                 `Yearly Summary: ${selectedYear}`}
                            </h3>
                            <div className="flex gap-4">
                                {activeTab !== 'daily' && (
                                    <div className="flex gap-2">
                                        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <SummaryBox title="Collection Analysis" colorClass="text-emerald-400" totalLabel="Total Collection" totalValue={stats[activeTab].totalColl} items={[{ label: 'Pathology', value: stats[activeTab].coll.pathology }, { label: 'Hormone', value: stats[activeTab].coll.hormone }, { label: 'USG', value: stats[activeTab].coll.usg }, { label: 'X-Ray', value: stats[activeTab].coll.xray }, { label: 'ECG', value: stats[activeTab].coll.ecg }, { label: 'Due Recovery', value: stats[activeTab].coll.dueRecov }]} />
                            <SummaryBox title="Expense Analysis" colorClass="text-rose-400" totalLabel="Total Expense" totalValue={stats[activeTab].exp.total} items={expenseCategories.slice(0, 8).map(c => ({ label: expenseCategoryBanglaMap[c] || c, value: stats[activeTab].expenseMap[c] }))} />
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 p-8 rounded-[2.5rem] text-center shadow-2xl flex flex-col justify-center">
                                <p className="text-slate-500 text-xs font-black uppercase mb-2">Net Cash Balance</p>
                                <h4 className={`text-4xl font-black ${stats[activeTab].balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳ {stats[activeTab].balance.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DiagnosticAccountsPage;