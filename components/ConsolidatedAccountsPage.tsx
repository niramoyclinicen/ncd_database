import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice, DueCollection, ExpenseItem, Employee, PurchaseInvoice, SalesInvoice, Medicine } from './DiagnosticData';
import { IndoorInvoice } from './ClinicPage';
import { BackIcon, FileTextIcon, UsersIcon, WalletIcon, MoneyIcon, TrendingDownIcon, ChartIcon, PlusIcon, Activity, TrashIcon, SaveIcon, PrinterIcon } from './Icons';

interface ConsolidatedAccountsPageProps {
  onBack: () => void;
  labInvoices: LabInvoice[];
  dueCollections: DueCollection[];
  detailedExpenses: Record<string, ExpenseItem[]>;
  employees: Employee[];
  purchaseInvoices: PurchaseInvoice[];
  salesInvoices: SalesInvoice[];
  indoorInvoices: IndoorInvoice[];
  medicines?: Medicine[];
}

interface Shareholder {
    id: number;
    name: string;
    shares: number;
    description: string;
}

interface LoanRecord {
    id: string;
    source: string;
    amount: number;
    date: string;
    type: string;
}

interface RepaymentRecord {
    id: string;
    loanId: string;
    amount: number;
    date: string;
    type: 'Installment' | 'One-time';
}

interface FuturePlan {
    id: string;
    title: string;
    description: string;
    estimatedCost: number;
    targetDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
}

const initialShareholders: Shareholder[] = [
    { id: 1, name: 'মোছাঃ জান্নাতী শেখ', shares: 4.5, description: '৪ ১/২ (সাড়ে চার)টি' },
    { id: 2, name: 'মোছাঃ মরিয়ম খাতুন', shares: 2, description: '২টি' },
    { id: 3, name: 'মোঃ কামরুল ইসলাম', shares: 1, description: '১টি' },
    { id: 4, name: 'মোঃ আব্দুল মন্ডল', shares: 1, description: '১টি' },
    { id: 5, name: 'মোঃ আব্দুল হাই', shares: 1, description: '১টি' },
    { id: 6, name: 'মোঃ আব্দুল্লাহ্ সরকার', shares: 2, description: '২টি' },
    { id: 7, name: 'মোঃ আয়নুল হক', shares: 1, description: '১টি' },
    { id: 8, name: 'মোঃ সোলাইমান সরকার (লিমন)', shares: 1, description: '১টি' },
    { id: 9, name: 'মোঃ বাবুল আক্তার (চরকেজুরী)', shares: 1, description: '১টি' },
    { id: 10, name: 'মোঃ কমলা খাতুন', shares: 1.5, description: '১ ১/২ (দেড়)টি' },
    { id: 11, name: 'মোঃ বাবুল সরকার (গোপরেখী)', shares: 0.5, description: '১/২ (অর্ধেক)টি' },
    { id: 12, name: 'মোঃ মোফাজ্জল হোসেন', shares: 1, description: '১টি' },
    { id: 13, name: 'মোঃ শহিদুল ইসলাম', shares: 1, description: '১টি' },
    { id: 14, name: 'হাজী মোঃ বাবুল আহমেদ বাবু', shares: 1, description: '১টি' },
    { id: 15, name: 'হাজী মোঃ আব্দুল রাজ্জাক', shares: 1, description: '১টি' },
    { id: 16, name: 'মোঃ বিপ্লব হোসেন রজব', shares: 1, description: '১টি' },
    { id: 17, name: 'মোছাঃ রেখা খাতুন', shares: 1, description: '১টি' },
    { id: 18, name: 'অন্যান্য/সংরক্ষিত', shares: 0.5, description: '১/২টি' }
];

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const expenseMapSequence = [
    { key: 'Stuff salary', label: 'স্টাফ বেতন' },
    { key: 'Generator', label: 'জেনারেটর' },
    { key: 'Motorcycle', label: 'মোটর সাইকেল' },
    { key: 'Marketing', label: 'মার্কেটিং' },
    { key: 'Clinic development', label: 'ক্লিনিক উন্নয়ন' },
    { key: 'Bills', label: 'বিদ্যুৎ+ পেপার+ ডিশ বিল' },
    { key: 'Reagent buy', label: 'রিএজেন্ট/মালামাল ক্রয়' },
    { key: 'X-Ray', label: 'এক্স-রে' },
    { key: 'House rent', label: 'বাড়ী ভাড়া' },
    { key: 'Stationery', label: 'স্টেশনারী' },
    { key: 'Food/Refreshment', label: 'ডাঃ আপ্যায়ন/ খাবার' },
    { key: 'Doctor donation', label: 'ডাঃ ডোনেশন+ যাতায়াত' },
    { key: 'Repair/Instruments', label: 'যন্ত্র ক্রয়/মেরামত' },
    { key: 'Press', label: 'প্রেস' },
    { key: 'License/Official', label: 'লাইসেন্স/ অফিসিয়াল খরচ' },
    { key: 'Bank/NGO Installment', label: 'ব্যাংক+বুড়ো এনজিও কিস্তি' },
    { key: 'Mobile', label: 'মোবাইল খরচ' },
    { key: 'Interest/Loan', label: 'কিস্তি/সুদ' },
    { key: 'Others', label: 'অন্যান্য খরচ' },
    { key: 'Old Loan Repay', label: 'পূর্বের ঋণ পরিশোধ' }
];

const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'Medicine buy (Pharmacy)', 'X-Ray', 'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

const ConsolidatedAccountsPage: React.FC<ConsolidatedAccountsPageProps> = ({
  onBack, labInvoices, dueCollections, detailedExpenses, employees, purchaseInvoices, salesInvoices, indoorInvoices, medicines = []
}) => {
    const [activeView, setActiveView] = useState<'monthly_expense_sheet' | 'accounts' | 'shareholders' | 'money_mgmt' | 'final_status' | 'future_plans' | 'shareholder_mgmt'>('accounts');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    
    const [dynamicShareholders, setDynamicShareholders] = useState<Shareholder[]>(() => JSON.parse(localStorage.getItem('ncd_shareholders') || JSON.stringify(initialShareholders)));
    const [loans, setLoans] = useState<LoanRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loans') || '[]'));
    const [repayments, setRepayments] = useState<RepaymentRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loan_repayments') || '[]'));
    const [futurePlans, setFuturePlans] = useState<FuturePlan[]>(() => JSON.parse(localStorage.getItem('ncd_future_plans') || '[]'));
    
    const [houseRentDeduction, setHouseRentDeduction] = useState<number>(0);
    const [profitDistAmount, setProfitDistAmount] = useState<number>(0);
    const [manualLoanInstallment, setManualLoanInstallment] = useState<number>(0);

    const [editingPartner, setEditingPartner] = useState<number | null>(null);
    const [newPlan, setNewPlan] = useState<Partial<FuturePlan>>({ title: '', estimatedCost: 0, status: 'Pending', targetDate: '' });

    useEffect(() => {
        localStorage.setItem('ncd_shareholders', JSON.stringify(dynamicShareholders));
        localStorage.setItem('ncd_loans', JSON.stringify(loans));
        localStorage.setItem('ncd_loan_repayments', JSON.stringify(repayments));
        localStorage.setItem('ncd_future_plans', JSON.stringify(futurePlans));
    }, [dynamicShareholders, loans, repayments, futurePlans]);

    const addFuturePlan = () => {
        if (!newPlan.title) return alert("শিরোনাম দিন।");
        const plan: FuturePlan = { 
            id: `FP-${Date.now()}`, 
            title: newPlan.title, 
            description: '', 
            estimatedCost: newPlan.estimatedCost || 0, 
            targetDate: newPlan.targetDate || new Date().toISOString().split('T')[0], 
            status: 'Pending' 
        };
        setFuturePlans([plan, ...futurePlans]);
        setNewPlan({ title: '', estimatedCost: 0, status: 'Pending', targetDate: '' });
    };

    const deletePlan = (id: string) => {
        if(confirm("পরিকল্পনাটি মুছে ফেলতে চান?")) setFuturePlans(futurePlans.filter(p => p.id !== id));
    };

    const updatePlan = (id: string, field: keyof FuturePlan, val: any) => {
        setFuturePlans(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const updateShareholder = (id: number, field: keyof Shareholder, val: any) => {
        setDynamicShareholders(dynamicShareholders.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const expenseSheetData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dailyExps = detailedExpenses[dateStr] || [];
            const categorySums: Record<string, number> = {};
            clinicExpenseCategories.forEach(cat => categorySums[cat] = 0);
            dailyExps.forEach(exp => {
                if (categorySums[exp.category] !== undefined) categorySums[exp.category] += exp.paidAmount;
            });
            const totalDay = Object.values(categorySums).reduce((a, b) => a + b, 0);
            rows.push({ date: dateStr, categories: categorySums, total: totalDay });
        }
        const columnTotals: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => {
            columnTotals[cat] = rows.reduce((sum, row) => sum + row.categories[cat], 0);
        });
        const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
        return { rows, columnTotals, grandTotal };
    }, [detailedExpenses, selectedMonth, selectedYear]);

    const summary = useMemo(() => {
        const isSelectedMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        };
        const isBeforeSelectedMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() < selectedMonth);
        };
        const calcNetPrev = () => {
            const prevLab = labInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled').reduce((s, i) => s + i.paid_amount, 0);
            const prevLabDue = dueCollections.filter(dc => isBeforeSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const prevClinic = indoorInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date)).reduce((s, i) => s + i.paid_amount, 0);
            const prevClinicDue = dueCollections.filter(dc => isBeforeSelectedMonth(dc.collection_date) && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const prevMedSales = salesInvoices.filter(inv => isBeforeSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.netPayable, 0);
            const prevMedPurch = purchaseInvoices.filter(inv => isBeforeSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.paidAmount, 0);
            let prevExp = 0;
            Object.entries(detailedExpenses).forEach(([date, items]) => {
                if (isBeforeSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => prevExp += it.paidAmount);
            });
            const net = (prevLab + prevLabDue + prevClinic + prevClinicDue + prevMedSales) - (prevExp + prevMedPurch);
            return net > 0 ? net : 0;
        };
        const prevJer = calcNetPrev();
        const diagCurrent = labInvoices.filter(inv => isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled').reduce((s, i) => s + i.paid_amount, 0);
        const diagDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        const clinicCurrent = indoorInvoices.filter(inv => isSelectedMonth(inv.invoice_date)).reduce((s, i) => s + i.paid_amount, 0);
        const clinicDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        const medSalesCurrent = salesInvoices.filter(inv => isSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.netPayable, 0);
        const medPurchCurrent = purchaseInvoices.filter(inv => isSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.paidAmount, 0);
        const totalDiag = diagCurrent + diagDue;
        const totalClinic = clinicCurrent + clinicDue;
        const totalMedNet = medSalesCurrent - medPurchCurrent;
        const grandTotalCollection = totalDiag + totalClinic + medSalesCurrent + prevJer - houseRentDeduction;
        const groupedExp: Record<string, number> = {};
        expenseMapSequence.forEach(e => groupedExp[e.key] = 0);
        Object.entries(detailedExpenses).forEach(([date, items]) => {
            if (isSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => {
                const key = expenseMapSequence.find(e => e.key === it.category)?.key || 'Others';
                groupedExp[key] += it.paidAmount;
            });
        });
        const monthlyLoanRepayments = repayments.filter(r => isSelectedMonth(r.date)).reduce((s, r) => s + r.amount, 0);
        groupedExp['Interest/Loan'] += monthlyLoanRepayments;
        groupedExp['Interest/Loan'] += manualLoanInstallment;
        const totalExpense = Object.values(groupedExp).reduce((s, v) => s + (v as number), 0);
        const netProfit = grandTotalCollection - totalExpense;
        const finalClosingJer = netProfit - profitDistAmount;
        const totalShares = dynamicShareholders.reduce((s, h) => s + h.shares, 0);
        const profitPerShare = totalShares > 0 ? profitDistAmount / totalShares : 0;
        return {
            prevJer, diagCurrent, diagDue, totalDiag, clinicCurrent, clinicDue, totalClinic,
            medSalesCurrent, medPurchCurrent, totalMedNet, grandTotalCollection, groupedExp, totalExpense, netProfit, finalClosingJer, profitPerShare, totalShares
        };
    }, [labInvoices, dueCollections, indoorInvoices, salesInvoices, purchaseInvoices, detailedExpenses, selectedMonth, selectedYear, houseRentDeduction, profitDistAmount, manualLoanInstallment, dynamicShareholders, repayments]);

    const loanStats = useMemo(() => {
        const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0);
        const totalRepaid = repayments.reduce((s, r) => s + r.amount, 0);
        return { totalBorrowed, totalRepaid, outstanding: totalBorrowed - totalRepaid };
    }, [loans, repayments]);

    const handlePrintSpecific = (elementId: string) => {
        const content = document.getElementById(elementId);
        if (!content) return;
        const win = window.open('', '', 'width=1000,height=1200');
        if(!win) return;
        const isLandscape = elementId === 'section-monthly-expense';
        const html = `
            <html>
                <head>
                    <title>NcD Report Print</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 5mm; } 
                        body { background: white; font-family: 'Segoe UI', Tahoma, sans-serif; color: black; }
                        table { width: 100%; border-collapse: collapse; font-size: ${isLandscape ? '6pt' : '8pt'}; }
                        th, td { border: 1px solid #000; padding: 2px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .vertical-header { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; height: 80px; padding: 5px; font-size: 5pt; }
                    </style>
                </head>
                <body class="p-2">
                    <div class="print-wrapper">${content.innerHTML}</div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 750);</script>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
    };

    const commonTableCellClass = "p-1.5 border border-black font-bold text-[10.5pt] font-bengali h-9";
    const commonAmtCellClass = "p-1.5 border border-black text-right font-black text-[10.5pt] w-[110px] h-9";

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            <header className="bg-slate-800 p-4 border-b border-slate-700 sticky top-0 z-[100] no-print flex flex-col md:flex-row justify-between items-center text-white gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"><BackIcon className="w-5 h-5" /></button>
                    <h1 className="font-bold uppercase tracking-tight text-sm">Accounts Console</h1>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
                    <button onClick={() => setActiveView('monthly_expense_sheet')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'monthly_expense_sheet' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Monthly Expense Sheet</button>
                    <button onClick={() => setActiveView('accounts')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'accounts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Accounts Sheet</button>
                    <button onClick={() => setActiveView('shareholders')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'shareholders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Profit Share</button>
                    <button onClick={() => setActiveView('final_status')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'final_status' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Status</button>
                    <button onClick={() => setActiveView('money_mgmt')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'money_mgmt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Money Mgmt</button>
                    <button onClick={() => setActiveView('future_plans')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'future_plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Future Plans</button>
                    <button onClick={() => setActiveView('shareholder_mgmt')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'shareholder_mgmt' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Partner Mgmt</button>
                </div>
                <div className="flex gap-4 items-center">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-1 text-white text-xs">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-1 text-white text-xs">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200">
                {activeView === 'monthly_expense_sheet' && (
                    <div id="section-monthly-expense" className="relative animate-fade-in">
                        <button onClick={() => handlePrintSpecific('section-monthly-expense')} className="no-print absolute top-2 right-2 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-500 z-50 flex items-center gap-2"><PrinterIcon size={18} /> <span className="text-xs font-bold">Print Landscape</span></button>
                        <main className="p-4 max-w-[297mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-sans">
                            <div className="text-center mb-4 border-b-2 border-black pb-2">
                                <h1 className="text-2xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                                <p className="text-xs font-bold mt-1">Monthly Clinic Expense Ledger - {monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[7.5px] border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black p-1 w-16">Date</th>
                                            {clinicExpenseCategories.map(cat => (<th key={cat} className="border border-black p-1 vertical-header text-[7px] leading-tight break-words min-w-[35px] max-w-[50px]">{cat}</th>))}
                                            <th className="border border-black p-1 w-20 bg-gray-200">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenseSheetData.rows.map(row => (
                                            <tr key={row.date} className="hover:bg-blue-50 transition-colors">
                                                <td className="border border-black p-1 text-center font-mono font-bold">{row.date.split('-')[2]} {monthOptions[parseInt(row.date.split('-')[1])-1].name.substring(0,3)}</td>
                                                {clinicExpenseCategories.map(cat => (<td key={cat} className="border border-black p-1 text-right font-medium">{row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}</td>))}
                                                <td className="border border-black p-1 text-right font-black bg-gray-50">{row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 font-black">
                                        <tr>
                                            <td className="border border-black p-1 text-center">TOTALS:</td>
                                            {clinicExpenseCategories.map(cat => (<td key={cat} className="border border-black p-1 text-right text-blue-900">{expenseSheetData.columnTotals[cat] > 0 ? expenseSheetData.columnTotals[cat].toLocaleString() : '-'}</td>))}
                                            <td className="border border-black p-1 text-right text-emerald-700 text-[10pt] shadow-inner">৳{expenseSheetData.grandTotal.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mt-4 text-[7px] italic text-gray-400 text-center">Printed at: {new Date().toLocaleString()} | IMS System</div>
                        </main>
                    </div>
                )}

                {activeView === 'accounts' && (
                    <div id="section-accounts" className="relative">
                        <button onClick={() => handlePrintSpecific('section-accounts')} className="no-print absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 z-50"><FileTextIcon className="w-5 h-5" /></button>
                        <main className="p-10 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-serif">
                            <div className="text-center mb-6 border-b-2 border-black pb-3">
                                <h1 className="text-4xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                                <p className="text-base font-bold mt-2">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                <h3 className="mt-4 text-xl font-bold underline uppercase tracking-widest bg-gray-100 py-2 border border-black font-bengali">অ্যাকাউন্টস শিট : {monthOptions[selectedMonth].name}, {selectedYear}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-5">
                                    <div className="bg-slate-800 text-white border border-black p-2 text-center font-bold text-sm font-bengali uppercase shadow-md">কালেকশন এর হিসাব</div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black font-bengali underline mb-1">ক) ডায়াগনস্টিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={commonAmtCellClass}>{summary.diagCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={commonTableCellClass}>বকেয়া আদায়</td><td className={commonAmtCellClass}>{summary.diagDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 font-black h-9"><td colSpan={2} className="p-1 text-right">ডায়াগনস্টিক মোট :</td><td className={commonAmtCellClass}>{summary.totalDiag.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black font-bengali underline mb-1">খ) ক্লিনিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={commonAmtCellClass}>{summary.clinicCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={commonTableCellClass}>বকেয়া আদায়</td><td className={commonAmtCellClass}>{summary.clinicDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 font-black h-9"><td colSpan={2} className="p-1 text-right">ক্লিনিক মোট :</td><td className={commonAmtCellClass}>{summary.totalClinic.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black font-bengali underline mb-1">গ) ঔষধ হইতে (নিট মুনাফা) :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>ঔষধ বিক্রয়</td><td className={commonAmtCellClass}>{summary.medSalesCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={`${commonTableCellClass} text-red-600`}>ঔষধ ক্রয় (খরচ)</td><td className={`${commonAmtCellClass} text-red-600`}>({summary.medPurchCurrent.toLocaleString()})</td></tr>
                                                <tr className="bg-gray-100 font-black h-9"><td colSpan={2} className="p-1 text-right">নিট ঔষধ মুনাফা :</td><td className={commonAmtCellClass}>{summary.totalMedNet.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-6 border-t-2 border-black pt-2">
                                        <table className="w-full border-2 border-black">
                                            <tbody>
                                                <tr className="bg-gray-50 h-9">
                                                    <td className={commonTableCellClass}>বাড়ী ভাড়া কর্তন</td>
                                                    <td className="no-print"><input type="number" value={houseRentDeduction || ''} onChange={e=>setHouseRentDeduction(parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded" /></td>
                                                    <td className={commonAmtCellClass}>({houseRentDeduction.toLocaleString()})</td>
                                                </tr>
                                                <tr className="bg-blue-50 h-9">
                                                    <td colSpan={2} className={`${commonTableCellClass} text-blue-900`}>পূর্বের জের (CF)</td>
                                                    <td className={`${commonAmtCellClass} text-blue-900`}>{summary.prevJer.toLocaleString()}</td>
                                                </tr>
                                                <tr className="bg-slate-900 text-white font-black h-12">
                                                    <td colSpan={2} className="p-2 text-right">মোট কালেকশন (A) =</td>
                                                    <td className="p-2 text-right text-xl">{summary.grandTotalCollection.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div className="bg-slate-800 text-white border border-black p-2 text-center font-bold text-sm font-bengali uppercase shadow-md">খরচের হিসাব</div>
                                    <table className="w-full border-2 border-black">
                                        <thead><tr className="bg-gray-100"><th className="p-1 border border-black w-8">ক্র.</th><th className="p-1 border border-black text-left">বিবরণ</th><th className="p-1 border border-black w-[110px]">টাকা</th></tr></thead>
                                        <tbody>
                                            {expenseMapSequence.map((item, idx) => (
                                                <tr key={item.key} className="h-9">
                                                    <td className="p-1 border border-black text-center">{idx + 1}</td>
                                                    <td className={commonTableCellClass}>{item.label}</td>
                                                    <td className={commonAmtCellClass}>{(summary.groupedExp[item.key] || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-800 text-white font-black h-12">
                                                <td colSpan={2} className="p-2 text-right">মোট খরচ (B) =</td>
                                                <td className="p-2 text-right text-xl">{summary.totalExpense.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div className="mt-4 border-4 border-black p-4 bg-gray-50 rounded-xl space-y-2">
                                        <div className="flex justify-between font-black text-lg"><span>নিট মুনাফা:</span> <span className="text-emerald-700">{summary.netProfit.toLocaleString()} ৳</span></div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex gap-2 items-center">(-) লভ্যাংশ বণ্টন: <input type="number" value={profitDistAmount || ''} onChange={e=>setProfitDistAmount(parseFloat(e.target.value)||0)} className="no-print w-20 border border-gray-400 rounded text-right" /></div>
                                            <span className="text-red-600">({profitDistAmount.toLocaleString()})</span>
                                        </div>
                                        <div className="flex justify-between font-black text-2xl text-blue-900 border-t border-black pt-2"><span>জের (Closing):</span> <span>{summary.finalClosingJer.toLocaleString()} ৳</span></div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                )}

                {activeView === 'shareholder_mgmt' && (
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2rem] shadow-2xl animate-fade-in no-print">
                        <h3 className="text-2xl font-black text-slate-800 mb-8 font-bengali border-b pb-4 flex items-center gap-3"><UsersIcon className="text-blue-500" /> শেয়ারহোল্ডার ম্যানেজমেন্ট</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-600 text-xs font-black uppercase">
                                    <tr><th className="p-4">ক্রম</th><th className="p-4">নাম</th><th className="p-4">শেয়ার সংখ্যা</th><th className="p-4 text-center">X</th></tr>
                                </thead>
                                <tbody>
                                    {dynamicShareholders.map((sh, idx) => (
                                        <tr key={sh.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-400">{idx + 1}/</td>
                                            <td className="p-4">
                                                {editingPartner === sh.id ? (
                                                    <input value={sh.name} onChange={e => updateShareholder(sh.id, 'name', e.target.value)} className="w-full bg-white border border-blue-500 rounded p-1 font-bold" autoFocus />
                                                ) : (
                                                    <span onClick={() => setEditingPartner(sh.id)} className="font-bold text-slate-800 cursor-pointer hover:text-blue-600">{sh.name}</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {editingPartner === sh.id ? (
                                                    <input type="number" step="0.5" value={sh.shares} onChange={e => updateShareholder(sh.id, 'shares', parseFloat(e.target.value) || 0)} className="w-20 bg-white border border-blue-500 rounded p-1 font-bold text-center" />
                                                ) : (
                                                    <span onClick={() => setEditingPartner(sh.id)} className="font-black text-blue-600 cursor-pointer">{sh.shares} টি</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {editingPartner === sh.id ? (
                                                    <button onClick={() => setEditingPartner(null)} className="p-1 bg-green-500 text-white rounded"><SaveIcon size={16}/></button>
                                                ) : (
                                                    <button onClick={() => setDynamicShareholders(dynamicShareholders.filter(s => s.id !== sh.id))} className="text-rose-400 hover:text-rose-600"><TrashIcon size={16}/></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setDynamicShareholders([...dynamicShareholders, { id: Date.now(), name: 'নতুন পার্টনার', shares: 1, description: '১টি' }])} className="mt-8 w-full py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700">+ নতুন পার্টনার যুক্ত করুন</button>
                    </div>
                )}

                {activeView === 'future_plans' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
                            <h3 className="text-xl font-black text-white mb-6 font-bengali flex items-center gap-3"><Activity className="text-indigo-400" /> নতুন ফিউচার প্ল্যান যুক্ত করুন</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">পরিকল্পনার নাম</label><input value={newPlan.title} onChange={e=>setNewPlan({...newPlan, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold" /></div>
                                <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2">আনুমানিক খরচ</label><input type="number" value={newPlan.estimatedCost} onChange={e=>setNewPlan({...newPlan, estimatedCost: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black" /></div>
                                <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2">টার্গেট ডেট</label><input type="date" value={newPlan.targetDate} onChange={e=>setNewPlan({...newPlan, targetDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" /></div>
                                <button onClick={addFuturePlan} className="md:col-span-3 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all">সেভ করুন</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {futurePlans.map(plan => (
                                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg flex justify-between items-center group hover:border-indigo-400 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${plan.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}><ChartIcon /></div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{plan.title}</h4>
                                            <div className="flex gap-4 text-xs font-bold text-slate-400 mt-1 uppercase">
                                                <span>খরচ: ৳{plan.estimatedCost.toLocaleString()}</span>
                                                <span className="text-indigo-400">টার্গেট: {plan.targetDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select value={plan.status} onChange={e => updatePlan(plan.id, 'status', e.target.value)} className="bg-slate-100 border-none rounded-lg p-2 text-[10px] font-black uppercase">{['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}</select>
                                        <button onClick={() => deletePlan(plan.id)} className="text-rose-300 hover:text-rose-600 p-2"><TrashIcon size={20}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeView === 'shareholders' && (
                    <div id="section-shareholders" className="relative">
                        <button onClick={() => handlePrintSpecific('section-shareholders')} className="no-print absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 z-50"><FileTextIcon className="w-5 h-5" /></button>
                        <main className="p-10 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-serif min-h-[296mm]">
                            <div className="text-center mb-8 border-b-2 border-black pb-3">
                                <h1 className="text-3xl font-black uppercase text-blue-900 leading-none">নিরাময় ক্লিনিক এন্ড ডায়াগনস্টিক</h1>
                                <p className="text-sm font-bold mt-2">এনায়েতপুর সিরাজগঞ্জ। ফোন: ০১৭৩০ ৯২৩০০৭</p>
                                <h2 className="mt-6 font-black text-xl font-bengali bg-gray-100 py-2 border-y-2 border-black uppercase tracking-tight">লভ্যাংশ বিবরণ : {monthOptions[selectedMonth].name}, {selectedYear}</h2>
                            </div>
                            <table className="w-full border-collapse border-2 border-black font-bengali">
                                <thead><tr className="bg-gray-200"><th className="p-3 border border-black w-14">ক্রম</th><th className="p-3 border border-black text-left">নাম</th><th className="p-3 border border-black w-24">শেয়ার</th><th className="p-3 border border-black text-right w-44">লাভ (টাকা)</th><th className="p-3 border border-black">স্বাক্ষর</th></tr></thead>
                                <tbody>
                                    {dynamicShareholders.map((sh, idx) => (
                                        <tr key={sh.id} className="h-9">
                                            <td className="p-2 border border-black text-center">{idx + 1}/</td>
                                            <td className="p-2 border border-black font-bold">{sh.name}</td>
                                            <td className="p-2 border border-black text-center">{sh.shares}</td>
                                            <td className="p-2 border border-black text-right font-black text-blue-900">{(sh.shares * summary.profitPerShare).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳</td>
                                            <td className="p-2 border border-black"></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr className="bg-slate-900 text-white font-black h-12"><td colSpan={2} className="text-right px-4">মোট বণ্টন =</td><td className="text-center">{summary.totalShares}</td><td className="text-right px-2 text-yellow-400">{profitDistAmount.toLocaleString()} ৳</td><td></td></tr></tfoot>
                            </table>
                        </main>
                    </div>
                )}

                {activeView === 'final_status' && (
                    <div id="section-status" className="relative">
                        <button onClick={() => handlePrintSpecific('section-status')} className="no-print absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 z-50"><FileTextIcon className="w-5 h-5" /></button>
                        <main className="max-w-[210mm] mx-auto w-full bg-white p-12 text-black shadow-2xl h-auto flex flex-col font-serif border border-gray-300">
                            <div className="text-center mb-10 border-b-4 border-slate-900 pb-4">
                                <h1 className="text-3xl font-black uppercase text-slate-900 leading-none">Institution Final Status Report</h1>
                                <p className="text-lg font-bengali font-bold mt-2">নিরাময় ক্লিনিক এন্ড ডায়াগনস্টিক - আর্থিক অবস্থা</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mb-12">
                                <div className="bg-emerald-50 border-4 border-emerald-600 p-6 rounded-3xl shadow-xl">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800">Available Cash</h4>
                                    <h3 className="text-4xl font-black text-emerald-900">৳ {summary.finalClosingJer.toLocaleString()}</h3>
                                </div>
                                <div className="bg-rose-50 border-4 border-rose-600 p-6 rounded-3xl shadow-xl">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-800">Total Liabilities</h4>
                                    <h3 className="text-4xl font-black text-rose-900">৳ {loanStats.outstanding.toLocaleString()}</h3>
                                </div>
                            </div>
                            <table className="w-full border-collapse border-4 border-slate-900 text-lg font-bengali">
                                <tbody>
                                    <tr className="h-12"><td className="p-4 border-4 border-slate-900 font-bold">১/ ক্যাশ ব্যালেন্স (জের)</td><td className="p-4 border-4 border-slate-900 text-right font-black">৳ {summary.finalClosingJer.toLocaleString()}</td></tr>
                                    <tr className="h-12"><td className="p-4 border-4 border-slate-900 font-bold">২/ মেডিসিন স্টক মূল্য</td><td className="p-4 border-4 border-slate-900 text-right font-black">৳ {medicines.reduce((s,m)=>s+(m.stock*m.unitPriceBuy),0).toLocaleString()}</td></tr>
                                    <tr className="h-12 bg-red-50"><td className="p-4 border-4 border-slate-900 font-bold">৩/ মোট ধার ও ঋণ</td><td className="p-4 border-4 border-slate-900 text-right font-black text-red-600">(-) ৳ {loanStats.outstanding.toLocaleString()}</td></tr>
                                    <tr className="bg-slate-900 text-white h-16"><td className="p-4 font-black">প্রকৃত নিট মূলধন =</td><td className="p-4 text-right text-3xl font-black text-yellow-400">৳ {(summary.finalClosingJer + medicines.reduce((s,m)=>s+(m.stock*m.unitPriceBuy),0) - loanStats.outstanding).toLocaleString()}</td></tr>
                                </tbody>
                            </table>
                        </main>
                    </div>
                )}
                
                {activeView === 'money_mgmt' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-3xl p-8 border border-slate-300 shadow-2xl">
                                <h3 className="text-xl font-black text-slate-800 mb-6 font-bengali border-b pb-3">লোন গ্রহণ ফরম (New Loan)</h3>
                                <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.target as any); const nl: LoanRecord = { id: `L-${Date.now()}`, source: f.get('src') as string, amount: parseFloat(f.get('amt') as any), date: f.get('dt') as string, type: f.get('tp') as string }; setLoans([...loans, nl]); (e.target as any).reset(); }} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">উৎস</label><input name="src" required className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">টাকার পরিমাণ</label><input name="amt" type="number" required className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">তারিখ</label><input name="dt" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">ধরণ</label><select name="tp" className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold"><option>Bank</option><option>NGO</option><option>Person</option></select></div>
                                    </div>
                                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">লোন রেকর্ড করুন</button>
                                </form>
                            </div>
                            <div className="bg-white rounded-3xl p-8 border border-slate-300 shadow-2xl">
                                <h3 className="text-xl font-black text-emerald-600 mb-6 font-bengali border-b pb-3">কিস্তি পরিশোধ (Installment Pay)</h3>
                                <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.target as any); const nr: RepaymentRecord = { id: `R-${Date.now()}`, loanId: f.get('lid') as string, amount: parseFloat(f.get('amt') as any), date: f.get('dt') as string, type: 'Installment' }; setRepayments([...repayments, nr]); (e.target as any).reset(); }} className="space-y-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">লোন সিলেক্ট করুন</label>
                                    <select name="lid" required className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-bold"><option value="">-- নির্বাচন করুন --</option>{loans.map(l => <option key={l.id} value={l.id}>{l.source} (৳{l.amount})</option>)}</select>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">কিস্তির পরিমাণ</label><input name="amt" type="number" required className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">তারিখ</label><input name="dt" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold" /></div>
                                    </div>
                                    <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">কিস্তি জমা করুন</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsolidatedAccountsPage;