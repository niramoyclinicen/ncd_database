import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice, DueCollection, ExpenseItem, Employee, PurchaseInvoice, SalesInvoice, Medicine } from './DiagnosticData';
import { IndoorInvoice } from './ClinicPage';
import { BackIcon, FileTextIcon, UsersIcon, WalletIcon, MoneyIcon, TrendingDownIcon, ChartIcon, PlusIcon, Activity, TrashIcon, SaveIcon, PrinterIcon, ClinicIcon } from './Icons';

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

interface CompanyCollection {
    id: string;
    date: string;
    companyName: string;
    amount: number;
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
    { id: 9, name: 'মোঃ ফজলুর রহমান (ফজলু)', shares: 1, description: '১টি' },
    { id: 10, name: 'মোঃ কমলা খাতুন', shares: 1.5, description: '১ ১/২ (দেড়)টি' },
    { id: 11, name: 'মোঃ আব্দুল হাই (বিএসসি)', shares: 0.5, description: '১/২ (অর্ধেক)টি' },
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
    { key: 'Clinic_Dev', label: 'ক্লিনিক উন্নয়ন' },
    { key: 'Bills', label: 'বিদ্যুৎ+ পেপার+ ডিশ বিল' },
    { key: 'Reagent buy', label: 'রিএজেন্ট/মালামাল ক্রয়' },
    { key: 'X-Ray', label: 'এক্স-রে' },
    { key: 'House rent', label: 'বাড়ী ভাড়া' },
    { key: 'Stationery', label: 'স্টেশনারী' },
    { key: 'Food', label: 'খাবার' },
    { key: 'Doctor donation', label: 'ডাঃ ডোনেশন+ যাতায়াত' },
    { key: 'Instruments', label: 'ইন্সট্রুমেন্ট' },
    { key: 'Press', label: 'প্রেস' },
    { key: 'License', label: 'লাইসেন্স' },
    { key: 'Installment', label: 'কিস্তি' },
    { key: 'Mobile', label: 'মোবাইল খরচ' },
    { key: 'Others', label: 'অন্যান্য খরচ' },
    { key: 'Old Loan Repay', label: 'পূর্বের ঋণ পরিশোধ' }
];

const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic_Dev', 
    'X-Ray', 'House rent', 'Stationery', 'Food', 
    'Doctor donation', 'Instruments', 'Press', 'License', 
    'Installment', 'Mobile', 'Others', 'Old Loan Repay'
];

const ConsolidatedAccountsPage: React.FC<ConsolidatedAccountsPageProps> = ({
  onBack, labInvoices, dueCollections, detailedExpenses, employees, purchaseInvoices, salesInvoices, indoorInvoices, medicines = []
}) => {
    const [activeView, setActiveView] = useState<'monthly_expense_sheet' | 'accounts' | 'shareholders' | 'money_mgmt' | 'final_status' | 'future_plans' | 'shareholder_mgmt' | 'company_collection'>('accounts');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    
    const [dynamicShareholders, setDynamicShareholders] = useState<Shareholder[]>(() => JSON.parse(localStorage.getItem('ncd_shareholders') || JSON.stringify(initialShareholders)));
    const [loans, setLoans] = useState<LoanRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loans') || '[]'));
    const [repayments, setRepayments] = useState<RepaymentRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loan_repayments') || '[]'));
    const [futurePlans, setFuturePlans] = useState<FuturePlan[]>(() => JSON.parse(localStorage.getItem('ncd_future_plans') || '[]'));
    const [companyCollections, setCompanyCollections] = useState<CompanyCollection[]>(() => JSON.parse(localStorage.getItem('ncd_company_collections') || '[]'));
    
    const [houseRentDeduction, setHouseRentDeduction] = useState<number>(0);
    const [profitDistAmount, setProfitDistAmount] = useState<number>(0);
    const [manualLoanInstallment, setManualLoanInstallment] = useState<number>(0);

    const [editingPartner, setEditingPartner] = useState<number | null>(null);
    const [newPlan, setNewPlan] = useState<Partial<FuturePlan>>({ title: '', estimatedCost: 0, status: 'Pending', targetDate: '' });
    const [newCompanyEntry, setNewCompanyEntry] = useState({ companyName: '', amount: 0, date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        localStorage.setItem('ncd_shareholders', JSON.stringify(dynamicShareholders));
        localStorage.setItem('ncd_loans', JSON.stringify(loans));
        localStorage.setItem('ncd_loan_repayments', JSON.stringify(repayments));
        localStorage.setItem('ncd_future_plans', JSON.stringify(futurePlans));
        localStorage.setItem('ncd_company_collections', JSON.stringify(companyCollections));
    }, [dynamicShareholders, loans, repayments, futurePlans, companyCollections]);

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

    const addCompanyCollection = () => {
        if (!newCompanyEntry.companyName || newCompanyEntry.amount <= 0) return alert("কোম্পানির নাম এবং সঠিক পরিমাণ দিন।");
        const entry: CompanyCollection = {
            id: `CC-${Date.now()}`,
            companyName: newCompanyEntry.companyName,
            amount: newCompanyEntry.amount,
            date: newCompanyEntry.date
        };
        setCompanyCollections([entry, ...companyCollections]);
        setNewCompanyEntry({ companyName: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    };

    const deletePlan = (id: string) => { if(confirm("পরিকল্পনাটি মুছে ফেলতে চান?")) setFuturePlans(futurePlans.filter(p => p.id !== id)); };
    const updatePlan = (id: string, field: keyof FuturePlan, val: any) => { setFuturePlans(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p)); };
    const updateShareholder = (id: number, field: keyof Shareholder, val: any) => { setDynamicShareholders(dynamicShareholders.map(s => s.id === id ? { ...s, [field]: val } : s)); };

    const expenseSheetData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dailyExps = detailedExpenses[dateStr] || [];
            const categorySums: Record<string, number> = {};
            clinicExpenseCategories.forEach(cat => categorySums[cat] = 0);
            dailyExps.forEach(exp => {
                const searchCat = exp.category === 'Clinic development' ? 'Clinic_Dev' : exp.category;
                const matchedCat = clinicExpenseCategories.find(c => c === searchCat);
                if (matchedCat) categorySums[matchedCat] += exp.paidAmount;
            });
            const totalDay = Object.values(categorySums).reduce((a, b) => a + b, 0);
            rows.push({ date: dateStr, categories: categorySums, total: totalDay });
        }
        const columnTotals: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => { columnTotals[cat] = rows.reduce((sum, row) => sum + row.categories[cat], 0); });
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
        
        const getNetDiagCash = (inv: LabInvoice) => {
            const usgFee = inv.items.reduce((s, it) => s + (it.usg_exam_charge * it.quantity), 0);
            const commPaid = inv.commission_paid || 0;
            return inv.paid_amount - usgFee - commPaid;
        };

        const calcNetPrev = () => {
            const prevLab = labInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled').reduce((s, i) => s + getNetDiagCash(i), 0);
            const prevLabDue = dueCollections.filter(dc => isBeforeSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const prevClinic = indoorInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date)).reduce((s, i) => s + i.paid_amount, 0);
            const prevClinicDue = dueCollections.filter(dc => isBeforeSelectedMonth(dc.collection_date) && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const prevMedSales = salesInvoices.filter(inv => isBeforeSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.netPayable, 0);
            const prevMedPurch = purchaseInvoices.filter(inv => isBeforeSelectedMonth(inv.invoiceDate) && inv.status !== 'Initial' && inv.status !== 'Cancelled').reduce((s, i) => s + i.paidAmount, 0);
            const prevCompany = companyCollections.filter(c => isBeforeSelectedMonth(c.date)).reduce((s, c) => s + c.amount, 0);
            
            let prevExp = 0;
            Object.entries(detailedExpenses).forEach(([date, items]) => {
                if (isBeforeSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => prevExp += it.paidAmount);
            });
            const net = (prevLab + prevLabDue + prevClinic + prevClinicDue + prevMedSales + prevCompany) - (prevExp + prevMedPurch);
            return net > 0 ? net : 0;
        };

        const prevJer = calcNetPrev();
        const diagCurrent = labInvoices.filter(inv => isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled').reduce((s, inv) => s + getNetDiagCash(inv), 0);
        const diagDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        const clinicCurrent = indoorInvoices.filter(inv => isSelectedMonth(inv.invoice_date)).reduce((s, i) => s + i.paid_amount, 0);
        const clinicDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        const medSalesCurrent = salesInvoices.filter(inv => isSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.netPayable, 0);
        
        // Logical Fix: Ignore 'Initial' (Opening) stock purchase from current month expense ledger sums
        const medPurchCurrent = purchaseInvoices.filter(inv => isSelectedMonth(inv.invoiceDate) && inv.status !== 'Initial' && inv.status !== 'Cancelled').reduce((s, i) => s + i.paidAmount, 0);
        
        const companyCurrent = companyCollections.filter(c => isSelectedMonth(c.date)).reduce((s, c) => s + c.amount, 0);

        const totalDiag = diagCurrent + diagDue;
        const totalClinic = clinicCurrent + clinicDue;
        const totalMedNet = medSalesCurrent - medPurchCurrent;
        const grandTotalCollection = totalDiag + totalClinic + totalMedNet + companyCurrent + prevJer - houseRentDeduction;
        
        const groupedExp: Record<string, number> = {};
        expenseMapSequence.forEach(e => groupedExp[e.key] = 0);
        Object.entries(detailedExpenses).forEach(([date, items]) => {
            if (isSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => {
                const catName = it.category === 'Clinic development' ? 'Clinic_Dev' : it.category;
                const mapping = expenseMapSequence.find(e => e.key === catName);
                const key = mapping ? mapping.key : 'Others';
                groupedExp[key] += it.paidAmount;
            });
        });
        const monthlyLoanRepayments = repayments.filter(r => isSelectedMonth(r.date)).reduce((s, r) => s + r.amount, 0);
        const totalExpense = Object.values(groupedExp).reduce((s, v) => s + (v as number), 0) + monthlyLoanRepayments + manualLoanInstallment;
        const netProfit = grandTotalCollection - totalExpense;
        const finalClosingJer = netProfit - profitDistAmount;
        const totalShares = dynamicShareholders.reduce((s, h) => s + h.shares, 0);
        const profitPerShare = totalShares > 0 ? profitDistAmount / totalShares : 0;
        return { prevJer, diagCurrent, diagDue, totalDiag, clinicCurrent, clinicDue, totalClinic, medSalesCurrent, medPurchCurrent, totalMedNet, companyCurrent, grandTotalCollection, groupedExp, totalExpense, netProfit, finalClosingJer, profitPerShare, totalShares };
    }, [labInvoices, dueCollections, indoorInvoices, salesInvoices, purchaseInvoices, companyCollections, detailedExpenses, selectedMonth, selectedYear, houseRentDeduction, profitDistAmount, manualLoanInstallment, dynamicShareholders, repayments]);

    const loanStats = useMemo(() => {
        const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0);
        const totalRepaid = repayments.reduce((s, r) => s + r.amount, 0);
        return { totalBorrowed, totalRepaid, outstanding: totalBorrowed - totalRepaid };
    }, [loans, repayments]);

    const handlePrintSpecific = (elementId: string) => {
        const content = document.getElementById(elementId);
        if (!content) return;
        const win = window.open('', '', 'width=1200,height=800');
        if(!win) return;
        const isLandscape = elementId === 'section-monthly-expense';
        const html = `<html><head><title>NcD Report Print</title><script src="https://cdn.tailwindcss.com"></script><style>@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 5mm; } body { background: white; font-family: 'Segoe UI', Tahoma, sans-serif; color: black; -webkit-print-color-adjust: exact; margin: 0; padding: 0; } .print-wrapper { width: 100%; display: flex; flex-direction: column; ${!isLandscape ? 'min-height: 287mm;' : ''} } table { width: 100% !important; border-collapse: collapse !important; font-size: ${isLandscape ? '7pt' : '9.5pt'} !important; table-layout: fixed !important; margin: 0 auto; } th, td { border: 0.5pt solid #000 !important; padding: ${isLandscape ? '1px 2px' : '4px 6px'} !important; text-align: center !important; white-space: normal !important; overflow: hidden !important; vertical-align: middle !important; line-height: 1.0 !important; } th { background: #f3f4f6 !important; font-weight: 900 !important; text-transform: uppercase !important; word-wrap: break-word !important; } ${isLandscape ? 'tbody tr { height: 17.0px !important; }' : ''} .text-right { text-align: right !important; } .font-bold { font-weight: bold !important; } .no-print { display: none !important; } .sig-container { margin-top: ${isLandscape ? '5px' : 'auto'} !important; padding-top: 10px !important; border-top: 1.5px solid black !important; page-break-inside: avoid !important; display: flex; justify-content: space-between; } h1.print-title { font-size: ${isLandscape ? '15pt' : '22pt'} !important; font-weight: 900 !important; color: #1e3a8a !important; text-transform: uppercase; margin-bottom: 0px !important; line-height: 1.0; } p.print-subtitle { font-size: ${isLandscape ? '7.5pt' : '10pt'} !important; font-weight: bold !important; margin-top: 0px !important; margin-bottom: 2px !important; } .font-bengali { font-family: 'Arial', sans-serif !important; } </style></head><body class="${isLandscape ? 'p-1' : 'p-4'}"><div class="print-wrapper">${content.innerHTML}</div><script>setTimeout(() => { window.print(); window.close(); }, 850);</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    const renderHeaderLabel = (cat: string) => {
        switch(cat) {
            case 'Stuff salary': return 'Staff Salary';
            case 'Clinic_Dev': return 'Clinic Dev';
            case 'Old Loan Repay': return 'Loan Repay';
            case 'Doctor donation': return 'Doc Donat';
            default: return cat;
        }
    };

    const commonTableCellClass = "p-1.5 border border-black font-bold text-[10pt] font-bengali h-8 text-center";
    const commonAmtCellClass = "p-1.5 border border-black text-right font-black text-[10pt] w-[100px] h-8";

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
                    <button onClick={() => setActiveView('company_collection')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeView === 'company_collection' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Company Collection</button>
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
                        <main className="p-4 max-w-[1600px] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-sans overflow-x-auto">
                            <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2 shrink-0">
                                <h1 className="text-2xl font-black uppercase text-blue-900 leading-none print-title">Niramoy Clinic & Diagnostic</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-700 print-subtitle">Monthly Clinic Expense Ledger - {monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>
                            <div className="w-full">
                                <table className="w-full text-[11px] border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black p-2 w-[80px] text-center whitespace-nowrap">Date</th>
                                            {clinicExpenseCategories.map(cat => (<th key={cat} className="border border-black p-2 font-black text-center whitespace-nowrap uppercase text-[10px]">{renderHeaderLabel(cat)}</th>))}
                                            <th className="border border-black p-2 w-[135px] bg-gray-200 font-black text-center whitespace-nowrap">Monthly Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenseSheetData.rows.map(row => (
                                            <tr key={row.date} className="hover:bg-blue-50 transition-colors h-10">
                                                <td className="border border-black p-1 text-center font-mono font-bold text-xs whitespace-nowrap">{row.date.split('-')[2]} {monthOptions[parseInt(row.date.split('-')[1])-1].name.substring(0,3)}</td>
                                                {clinicExpenseCategories.map(cat => (<td key={cat} className="border border-black p-1 text-center font-medium text-sm">{row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}</td>))}
                                                <td className="border border-black p-1 text-center font-black bg-gray-50 text-base">৳{row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 font-black">
                                        <tr className="h-12">
                                            <td className="border border-black p-1 text-center text-xs uppercase">TOTALS:</td>
                                            {clinicExpenseCategories.map(cat => (<td key={cat} className="border border-black p-1 text-center text-blue-900 text-sm">{expenseSheetData.columnTotals[cat] > 0 ? expenseSheetData.columnTotals[cat].toLocaleString() : '-'}</td>))}
                                            <td className="border border-black p-1 text-center text-emerald-700 bg-emerald-50 font-black text-lg">৳{expenseSheetData.grandTotal.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </main>
                    </div>
                )}

                {activeView === 'accounts' && (
                    <div id="section-accounts" className="relative h-full">
                        <button onClick={() => handlePrintSpecific('section-accounts')} className="no-print absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 z-50"><FileTextIcon className="w-5 h-5" /></button>
                        <main className="p-8 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-serif min-h-full" id="accounts-table-container">
                            <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-3 shrink-0">
                                <div>
                                    <h1 className="text-2xl font-black uppercase text-blue-900 leading-none print-title">Niramoy Clinic & Diagnostic</h1>
                                    <p className="text-sm font-bold mt-2">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                </div>
                                <h3 className="text-lg font-bold underline uppercase tracking-widest bg-gray-100 px-4 py-2 border border-black font-bengali">অ্যাকাউন্টস শিট : {monthOptions[selectedMonth].name}, {selectedYear}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8 flex-1">
                                <div className="space-y-4">
                                    <div className="bg-slate-800 text-white border border-black p-1.5 text-center font-bold text-xs font-bengali uppercase shadow-md">কালেকশন এর হিসাব</div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-black font-bengali underline mb-0.5">ক) ডায়াগনস্টিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={commonAmtCellClass}>{summary.diagCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">২</td><td className={commonTableCellClass}>বকেয়া আদায়</td><td className={commonAmtCellClass}>{summary.diagDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 font-black h-8"><td colSpan={2} className="p-1 text-right text-[10px]">ডায়াগনস্টিক মোট :</td><td className={commonAmtCellClass}>{summary.totalDiag.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-black font-bengali underline mb-0.5">খ) ক্লিনিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={commonAmtCellClass}>{summary.clinicCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">২</td><td className={commonTableCellClass}>বকেয়া আদায়</td><td className={commonAmtCellClass}>{summary.clinicDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 font-black h-8"><td colSpan={2} className="p-1 text-right text-[10px]">ক্লিনিক মোট :</td><td className={commonAmtCellClass}>{summary.totalClinic.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-black font-bengali underline mb-0.5">গ) ঔষধ হইতে (নিট মুনাফা) :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">১</td><td className={commonTableCellClass}>ঔষধ বিক্রয়</td><td className={commonAmtCellClass}>{summary.medSalesCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-8"><td className="p-1 border border-black text-center w-8">২</td><td className={`${commonTableCellClass} text-black-600`}>ঔষধ ক্রয় (খরচ)</td><td className={`${commonAmtCellClass} text-blackred-600`}>({summary.medPurchCurrent.toLocaleString()})</td></tr>
                                                <tr className="bg-gray-100 font-black h-8"><td colSpan={2} className="p-1 text-right text-[10px]">নিট ঔষধ মুনাফা :</td><td className={commonAmtCellClass}>{summary.totalMedNet.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-black font-bengali underline mb-0.5">ঘ) কোম্পানি হইতে প্রাপ্তি :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="bg-gray-50 font-black h-8"><td colSpan={2} className="p-1 text-right text-[10px]">কোম্পানি মোট :</td><td className={commonAmtCellClass}>{summary.companyCurrent.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 border-t-2 border-black pt-2">
                                        <table className="w-full border-2 border-black">
                                            <tbody>
                                                <tr className="bg-gray-50 h-8">
                                                    <td className={commonTableCellClass}>বাড়ী ভাড়া কর্তন</td>
                                                    <td className="no-print"><input type="number" value={houseRentDeduction || ''} onChange={e=>setHouseRentDeduction(parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded" /></td>
                                                    <td className={commonAmtCellClass}>({houseRentDeduction.toLocaleString()})</td>
                                                </tr>
                                                <tr className="bg-blue-50 h-8">
                                                    <td colSpan={2} className={`${commonTableCellClass} text-blue-900`}>পূর্বের জের (CF)</td>
                                                    <td className={`${commonAmtCellClass} text-blue-900`}>{summary.prevJer.toLocaleString()}</td>
                                                </tr>
                                                <tr className="bg-slate-900 text-white font-black h-10">
                                                    <td colSpan={2} className="p-1 text-right text-[12px]">মোট কালেকশন (A) =</td>
                                                    <td className="p-1 text-right text-lg">{summary.grandTotalCollection.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="space-y-4 flex flex-col">
                                    <div className="bg-slate-800 text-white border border-black p-1.5 text-center font-bold text-xs font-bengali uppercase shadow-md">খরচের হিসাব</div>
                                    <table className="w-full border-2 border-black flex-1">
                                        <thead><tr className="bg-gray-100"><th className="p-1 border border-black w-8 text-[10px]">ক্র.</th><th className="p-1 border border-black text-left text-[10px]">বিবরণ</th><th className="p-1 border border-black w-[100px] text-[10px]">টাকা</th></tr></thead>
                                        <tbody>
                                            {expenseMapSequence.map((item, idx) => (
                                                <tr key={item.key} className="h-7">
                                                    <td className="p-1 border border-black text-center text-[10px]">{idx + 1}</td>
                                                    <td className={`${commonTableCellClass} !text-left text-[10px]`}>{item.label}</td>
                                                    <td className={commonAmtCellClass}>{(summary.groupedExp[item.key] || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-800 text-white font-black h-10">
                                                <td colSpan={2} className="p-1 text-right text-[12px]">মোট খরচ (B) =</td>
                                                <td className="p-1 text-right text-lg">{summary.totalExpense.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="sig-container mt-auto flex justify-between px-6 font-bengali font-black text-sm pt-6 uppercase tracking-tighter border-t-2 border-black shrink-0">
                                <div className="text-center w-40 border-t border-black pt-1">ম্যানেজার</div>
                                <div className="text-center w-40 border-t border-black pt-1">হিসাবরক্ষক</div>
                                <div className="text-center w-40 border-t border-black pt-1">পরিচালক</div>
                            </div>
                        </main>
                    </div>
                )}

                {activeView === 'company_collection' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                             <h3 className="text-xl font-black text-cyan-600 mb-6 font-bengali border-b pb-4 flex items-center gap-3"><ClinicIcon className="w-6 h-6" /> কোম্পানি কালেকশন ডাটা এন্ট্রি</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">কোম্পানির নাম</label>
                                     <input value={newCompanyEntry.companyName} onChange={e=>setNewCompanyEntry({...newCompanyEntry, companyName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold" placeholder="কোম্পানির নাম লিখুন"/>
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">টাকার পরিমাণ (৳)</label>
                                     <input type="number" value={newCompanyEntry.amount} onChange={e=>setNewCompanyEntry({...newCompanyEntry, amount: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" />
                                 </div>
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">তারিখ</label>
                                     <input type="date" value={newCompanyEntry.date} onChange={e=>setNewCompanyEntry({...newCompanyEntry, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" />
                                 </div>
                             </div>
                             <button onClick={addCompanyCollection} className="mt-6 w-full py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">কালেকশন সেভ করুন</button>
                        </div>
                        
                        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 shadow-xl bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                                    <tr><th className="p-5">তারিখ</th><th className="p-5">কোম্পানির নাম</th><th className="p-5 text-right">পরিমাণ (৳)</th><th className="p-5 text-center">X</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {companyCollections.filter(c => {
                                        const d = new Date(c.date);
                                        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                                    }).map(c => (
                                        <tr key={c.id} className="hover:bg-cyan-50 transition-colors">
                                            <td className="p-5 font-bold text-slate-600">{c.date}</td>
                                            <td className="p-5 font-black text-slate-800 uppercase">{c.companyName}</td>
                                            <td className="p-5 text-right font-black text-cyan-600 text-lg">৳{c.amount.toLocaleString()}</td>
                                            <td className="p-5 text-center">
                                                <button onClick={() => { if(confirm("মুছে ফেলতে চান?")) setCompanyCollections(companyCollections.filter(x=>x.id!==c.id)) }} className="text-rose-400 hover:text-rose-600 p-2"><TrashIcon size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {companyCollections.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">এই মাসে কোনো কোম্পানির কালেকশন নেই।</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsolidatedAccountsPage;