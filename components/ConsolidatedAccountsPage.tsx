
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

const diagExpenseCategories = [
    'House rent', 'Electricity bill', 'Stuff salary', 'Reagent buy', 'Doctor donation',
    'Instruments buy/ repair', 'Diagnostic development', 'Maintenance', 'License cost', 'Others'
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
    const [activeTab, setActiveTab] = useState<'monthly_expense_sheet' | 'daily_collection' | 'daily_expense' | 'accounts' | 'shareholders' | 'money_mgmt' | 'final_status' | 'future_plans' | 'shareholder_mgmt' | 'company_collection'>('accounts');
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
    
    const expenseSheetData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dailyExps = detailedExpenses[dateStr] || [];
            const categorySums: Record<string, number> = {};
            expenseMapSequence.forEach(e => categorySums[e.key] = 0);
            dailyExps.forEach(exp => {
                const searchCat = exp.category === 'Clinic development' ? 'Clinic_Dev' : exp.category;
                const matched = expenseMapSequence.find(e => e.key === searchCat);
                if (matched) categorySums[matched.key] += exp.paidAmount;
            });
            const totalDay = Object.values(categorySums).reduce((a, b) => a + b, 0);
            rows.push({ date: dateStr, categories: categorySums, total: totalDay });
        }
        const columnTotals: Record<string, number> = {};
        expenseMapSequence.forEach(e => { columnTotals[e.key] = rows.reduce((sum, row) => sum + row.categories[e.key], 0); });
        const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
        return { rows, columnTotals, grandTotal };
    }, [detailedExpenses, selectedMonth, selectedYear]);

    const dailyCollectionData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        let diagUpto = 0;
        let clinicUpto = 0;

        const getNetDiagCash = (inv: LabInvoice) => {
            const usgFee = inv.items.reduce((s, it) => s + (it.usg_exam_charge * it.quantity), 0);
            const commPaid = inv.commission_paid || 0;
            return inv.paid_amount - usgFee - commPaid;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            
            const diagToday = labInvoices.filter(inv => inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, inv) => s + getNetDiagCash(inv), 0);
            const diagDue = dueCollections.filter(dc => dc.collection_date === dateStr && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const diagTotal = diagToday + diagDue;
            diagUpto += diagTotal;

            const clinicToday = indoorInvoices.filter(inv => inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, inv) => {
                const fundedRevenue = inv.items.filter(it => it.isClinicFund).reduce((ss, ii) => ss + ii.payable_amount, 0);
                const pcAmount = inv.commission_paid || 0;
                return s + (fundedRevenue - pcAmount);
            }, 0);
            const clinicDue = dueCollections.filter(dc => dc.collection_date === dateStr && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const clinicTotal = clinicToday + clinicDue;
            clinicUpto += clinicTotal;

            const displayDate = `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`;
            rows.push({ date: displayDate, diag: { today: diagToday, due: diagDue, total: diagTotal, upto: diagUpto }, clinic: { today: clinicToday, due: clinicDue, total: clinicTotal, upto: clinicUpto } });
        }
        return rows;
    }, [labInvoices, indoorInvoices, dueCollections, selectedMonth, selectedYear]);

    const dailyExpenseReportData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        let diagUpto = 0;
        let clinicUpto = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            const dailyExps = detailedExpenses[dateStr] || [];

            const diagToday = dailyExps.filter(ex => diagExpenseCategories.includes(ex.category)).reduce((s, ex) => s + ex.paidAmount, 0);
            diagUpto += diagToday;

            const clinicToday = dailyExps.filter(ex => clinicExpenseCategories.includes(ex.category)).reduce((s, ex) => s + ex.paidAmount, 0);
            clinicUpto += clinicToday;

            const displayDate = `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`;
            rows.push({ date: displayDate, diag: { today: diagToday, upto: diagUpto }, clinic: { today: clinicToday, upto: clinicUpto }, total: diagToday + clinicToday });
        }
        return rows;
    }, [detailedExpenses, selectedMonth, selectedYear]);

    const statusReportData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        let runningBalance = 0;

        const getNetDiagCash = (inv: LabInvoice) => {
            const usgFee = inv.items.reduce((s, it) => s + (it.usg_exam_charge * it.quantity), 0);
            const commPaid = inv.commission_paid || 0;
            return inv.paid_amount - usgFee - commPaid;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            
            // Collections
            const diagColl = labInvoices.filter(inv => inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, inv) => s + getNetDiagCash(inv), 0)
                           + dueCollections.filter(dc => dc.collection_date === dateStr && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);

            const clinicColl = indoorInvoices.filter(inv => inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, inv) => {
                const fundedRevenue = inv.items.filter(it => it.isClinicFund).reduce((ss, ii) => ss + ii.payable_amount, 0);
                const pcAmount = inv.commission_paid || 0;
                return s + (fundedRevenue - pcAmount);
            }, 0) + dueCollections.filter(dc => dc.collection_date === dateStr && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);

            const totalColl = diagColl + clinicColl;

            // Expenses
            const dailyExps = detailedExpenses[dateStr] || [];
            const diagExp = dailyExps.filter(ex => diagExpenseCategories.includes(ex.category)).reduce((s, ex) => s + ex.paidAmount, 0);
            const clinicExp = dailyExps.filter(ex => clinicExpenseCategories.includes(ex.category)).reduce((s, ex) => s + ex.paidAmount, 0);
            const totalExp = diagExp + clinicExp;

            runningBalance += (totalColl - totalExp);

            rows.push({
                date: `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`,
                diagColl, clinicColl, totalColl,
                diagExp, clinicExp, totalExp,
                balance: runningBalance
            });
        }
        return rows;
    }, [labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear]);

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
            const prevLab = labInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, i) => s + getNetDiagCash(i), 0);
            const prevLabDue = dueCollections.filter(dc => isBeforeSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
            const prevClinic = indoorInvoices.filter(inv => isBeforeSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, i) => s + i.paid_amount, 0);
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
        const diagCurrent = labInvoices.filter(inv => isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((s, inv) => s + getNetDiagCash(inv), 0);
        const diagDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        
        let totalMonthlyOperatingExpenses = 0;
        Object.entries(detailedExpenses).forEach(([date, items]) => {
            if (isSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => totalMonthlyOperatingExpenses += it.paidAmount);
        });

        const clinicRevenueCurrent = indoorInvoices.filter(inv => isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned').reduce((acc, inv) => {
            const netIncomeForInv = inv.items.filter((it: any) => it.isClinicFund).reduce((s: number, i: any) => s + i.payable_amount, 0);
            const pcAmount = inv.commission_paid || 0;
            return acc + (netIncomeForInv - pcAmount);
        }, 0);

        const clinicCurrent = clinicRevenueCurrent - totalMonthlyOperatingExpenses;
        const clinicDue = dueCollections.filter(dc => isSelectedMonth(dc.collection_date) && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);
        const medSalesCurrent = salesInvoices.filter(inv => isSelectedMonth(inv.invoiceDate)).reduce((s, i) => s + i.netPayable, 0);
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
        const totalExpenseTableOnly = Object.values(groupedExp).reduce((s, v) => s + (v as number), 0) + monthlyLoanRepayments + manualLoanInstallment;
        const netProfit = grandTotalCollection - (monthlyLoanRepayments + manualLoanInstallment);
        const finalClosingJer = netProfit - profitDistAmount;
        const totalShares = dynamicShareholders.reduce((s, h) => s + h.shares, 0);
        const profitPerShare = totalShares > 0 ? profitDistAmount / totalShares : 0;
        
        return { prevJer, diagCurrent, diagDue, totalDiag, clinicCurrent, clinicDue, totalClinic, medSalesCurrent, medPurchCurrent, totalMedNet, companyCurrent, grandTotalCollection, groupedExp, totalExpense: totalExpenseTableOnly, netProfit, finalClosingJer, profitPerShare, totalShares };
    }, [labInvoices, dueCollections, indoorInvoices, salesInvoices, purchaseInvoices, companyCollections, detailedExpenses, selectedMonth, selectedYear, houseRentDeduction, profitDistAmount, manualLoanInstallment, dynamicShareholders, repayments]);

    const handlePrintSpecific = (elementId: string) => {
        const content = document.getElementById(elementId);
        if (!content) return;
        const win = window.open('', '', 'width=1200,height=800');
        if(!win) return;
        const isLandscape = elementId === 'section-monthly-expense';
        const html = `<html><head><title>Print Report</title><script src="https://cdn.tailwindcss.com"></script><style>@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 5mm; } body { background: white; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 5mm; color: black; } table { width: 100% !important; border-collapse: collapse !important; border: 1.2px solid #000 !important; } th, td { border: 1px solid #000 !important; padding: 2px 4px; text-align: center; } .no-print { display: none !important; } .font-bengali { font-family: 'Arial', sans-serif !important; }</style></head><body>${content.innerHTML}<script>setTimeout(() => { window.print(); window.close(); }, 850);</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    const commonTableCellClass = "p-1.5 border border-black font-bold text-[10pt] font-bengali h-8 text-center";
    const commonAmtCellClass = "p-1.5 border border-black text-right font-black text-[10pt] w-[100px] h-8";

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            <header className="bg-slate-800 p-4 border-b border-slate-700 sticky top-0 z-[100] no-print flex flex-col md:flex-row justify-between items-center text-white gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-all"><BackIcon className="w-5 h-5" /></button>
                    <h1 className="font-bold uppercase tracking-tight text-sm">Accounts Console</h1>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
                    <button onClick={() => setActiveTab('monthly_expense_sheet')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'monthly_expense_sheet' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Monthly Expense Sheet</button>
                    <button onClick={() => setActiveTab('daily_collection')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'daily_collection' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Daily Collection</button>
                    <button onClick={() => setActiveTab('daily_expense')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'daily_expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Daily Expense</button>
                    <button onClick={() => setActiveTab('accounts')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Accounts Sheet</button>
                    <button onClick={() => setActiveTab('company_collection')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'company_collection' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Company Collection</button>
                    <button onClick={() => setActiveTab('shareholders')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'shareholders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Profit Share</button>
                    <button onClick={() => setActiveTab('final_status')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'final_status' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Status</button>
                    <button onClick={() => setActiveTab('money_mgmt')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'money_mgmt' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Money Mgmt</button>
                    <button onClick={() => setActiveTab('future_plans')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'future_plans' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Future Plans</button>
                    <button onClick={() => setActiveTab('shareholder_mgmt')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'shareholder_mgmt' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Partner Mgmt</button>
                </div>
                <div className="flex gap-4 items-center">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-1 text-white text-xs">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-700 border-none rounded p-1 text-white text-xs">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200">
                
                {/* 1. Monthly Expense Sheet */}
                {activeTab === 'monthly_expense_sheet' && (
                    <div id="section-monthly-expense" className="relative animate-fade-in">
                        <button onClick={() => handlePrintSpecific('section-monthly-expense')} className="no-print absolute top-2 right-2 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-500 z-50 flex items-center gap-2"><PrinterIcon size={18} /> <span className="text-xs font-bold">Print Landscape</span></button>
                        <main className="p-4 max-w-[1600px] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-sans overflow-x-auto">
                            <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                                <h1 className="text-2xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-700">Monthly Clinic Expense Ledger - {monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>
                            <table className="w-full text-[11px] border-collapse border border-black">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-2 w-[80px]">Date</th>
                                        {expenseMapSequence.map(e => <th key={e.key} className="border border-black p-2 font-black text-[10px] uppercase">{e.label}</th>)}
                                        <th className="border border-black p-2 bg-gray-200 font-black">Monthly Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseSheetData.rows.map(row => (
                                        <tr key={row.date} className="hover:bg-blue-50 transition-colors h-10">
                                            <td className="border border-black p-1 text-center font-mono font-bold text-xs whitespace-nowrap">{row.date.split('-')[2]} {monthOptions[parseInt(row.date.split('-')[1])-1].name.substring(0,3)}</td>
                                            {expenseMapSequence.map(e => <td key={e.key} className="border border-black p-1 text-center font-medium text-sm">{row.categories[e.key] > 0 ? row.categories[e.key].toLocaleString() : '-'}</td>)}
                                            <td className="border border-black p-1 text-center font-black bg-gray-50 text-base">৳{row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-black h-12">
                                    <tr>
                                        <td className="border border-black p-1 text-center text-xs uppercase">TOTALS:</td>
                                        {expenseMapSequence.map(e => <td key={e.key} className="border border-black p-1 text-center text-blue-900 text-sm">{expenseSheetData.columnTotals[e.key] > 0 ? expenseSheetData.columnTotals[e.key].toLocaleString() : '-'}</td>)}
                                        <td className="border border-black p-1 text-center text-emerald-700 bg-emerald-50 font-black text-lg">৳{expenseSheetData.grandTotal.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </main>
                    </div>
                )}

                {/* 2. Daily Collection */}
                {activeTab === 'daily_collection' && (
                    <div id="section-daily-collection" className="relative animate-fade-in">
                        <button onClick={() => handlePrintSpecific('section-daily-collection')} className="no-print absolute top-2 right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg flex items-center gap-2"><PrinterIcon size={18} /> <span className="text-xs font-bold">Print</span></button>
                        <main className="p-6 max-w-[1200px] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300">
                            <h1 className="text-[16pt] font-black uppercase text-center mb-4">Collection breakdown - {monthOptions[selectedMonth].name} {selectedYear}</h1>
                            <table className="w-full border-collapse border-2 border-black text-[9pt]">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border-2 border-black p-2 w-[100px]" rowSpan={2}>Date</th>
                                        <th className="border-2 border-black p-2" colSpan={4}>Diagnostic</th>
                                        <th className="border-2 border-black p-2" colSpan={4}>Clinic</th>
                                    </tr>
                                    <tr className="bg-gray-50 uppercase text-[8px] font-black">
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1">Due</th><th className="border-2 border-black p-1">Total</th><th className="border-2 border-black p-1 bg-blue-50">Upto</th>
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1">Due</th><th className="border-2 border-black p-1">Total</th><th className="border-2 border-black p-1 bg-emerald-50">Upto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyCollectionData.map((row, idx) => (
                                        <tr key={idx} className="h-7 hover:bg-slate-50 transition-colors">
                                            <td className="border border-black p-1 font-mono font-bold">{row.date}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.today > 0 ? row.diag.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.due > 0 ? row.diag.due.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black">{row.diag.total > 0 ? row.diag.total.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-blue-50/50">{row.diag.upto > 0 ? row.diag.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.today > 0 ? row.clinic.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.due > 0 ? row.clinic.due.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black">{row.clinic.total > 0 ? row.clinic.total.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-emerald-50/50">{row.clinic.upto > 0 ? row.clinic.upto.toLocaleString() : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </main>
                    </div>
                )}

                {/* 3. Daily Expense */}
                {activeTab === 'daily_expense' && (
                    <div id="section-daily-expense" className="relative animate-fade-in">
                        <button onClick={() => handlePrintSpecific('section-daily-expense')} className="no-print absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-full shadow-lg flex items-center gap-2"><PrinterIcon size={18} /> <span className="text-xs font-bold">Print</span></button>
                        <main className="p-6 max-w-[1200px] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300">
                            <h1 className="text-[16pt] font-black uppercase text-center mb-4">Expense detail - {monthOptions[selectedMonth].name} {selectedYear}</h1>
                            <table className="w-full border-collapse border-2 border-black text-[9pt]">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border-2 border-black p-2 w-[100px]" rowSpan={2}>Date</th>
                                        <th className="border-2 border-black p-2" colSpan={2}>Diagnostic Expense</th>
                                        <th className="border-2 border-black p-2" colSpan={2}>Clinic Expense</th>
                                        <th className="border-2 border-black p-2 w-[100px]" rowSpan={2}>Daily Total</th>
                                    </tr>
                                    <tr className="bg-gray-50 uppercase text-[8px] font-black">
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1 bg-blue-50">Upto</th>
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1 bg-emerald-50">Upto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyExpenseReportData.map((row, idx) => (
                                        <tr key={idx} className="h-7 hover:bg-slate-50 transition-colors">
                                            <td className="border border-black p-1 font-mono font-bold">{row.date}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.today > 0 ? row.diag.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-blue-50/50">{row.diag.upto > 0 ? row.diag.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.today > 0 ? row.clinic.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-emerald-50/50">{row.clinic.upto > 0 ? row.clinic.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-slate-100">{row.total > 0 ? row.total.toLocaleString() : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </main>
                    </div>
                )}

                {/* 4. Accounts Sheet */}
                {activeTab === 'accounts' && (
                    <div id="section-accounts" className="relative animate-fade-in h-full">
                        <button onClick={() => handlePrintSpecific('section-accounts')} className="no-print absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg"><FileTextIcon className="w-5 h-5" /></button>
                        <main className="p-8 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-serif min-h-full">
                            <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-3 shrink-0">
                                <div>
                                    <h1 className="text-2xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
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
                                                <tr className="bg-gray-50 h-8"><td className={commonTableCellClass}>বাড়ী ভাড়া কর্তন</td><td className="no-print"><input type="number" value={houseRentDeduction || ''} onChange={e=>setHouseRentDeduction(parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded" /></td><td className={commonAmtCellClass}>({houseRentDeduction.toLocaleString()})</td></tr>
                                                <tr className="bg-blue-50 h-8"><td colSpan={2} className={`${commonTableCellClass} text-blue-900`}>পূর্বের জের (CF)</td><td className={`${commonAmtCellClass} text-blue-900`}>{summary.prevJer.toLocaleString()}</td></tr>
                                                <tr className="bg-slate-900 text-white font-black h-10"><td colSpan={2} className="p-1 text-right text-[12px]">মোট কালেকশন (A) =</td><td className="p-1 text-right text-lg">{summary.grandTotalCollection.toLocaleString()}</td></tr>
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
                                                <tr key={item.key} className="h-7"><td className="p-1 border border-black text-center text-[10px]">{idx + 1}</td><td className={`${commonTableCellClass} !text-left text-[10px]`}>{item.label}</td><td className={commonAmtCellClass}>{(summary.groupedExp[item.key] || 0).toLocaleString()}</td></tr>
                                            ))}
                                            <tr className="bg-slate-800 text-white font-black h-10"><td colSpan={2} className="p-1 text-right text-[12px]">মোট খরচ (B) =</td><td className="p-1 text-right text-lg">{summary.totalExpense.toLocaleString()}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </main>
                    </div>
                )}

                {/* 8. Final Status (SINGLE PAGE A4 COMPACT) */}
                {activeTab === 'final_status' && (
                    <div id="section-status" className="relative animate-fade-in h-full">
                        <button onClick={() => handlePrintSpecific('section-status')} className="no-print absolute top-2 right-2 p-2 bg-amber-600 text-white rounded-full shadow-lg flex items-center gap-2"><PrinterIcon size={18} /><span className="text-xs font-bold">Print A4 Portrait</span></button>
                        <main className="p-4 sm:p-5 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-sans min-h-[292mm]">
                            
                            {/* COMPACT HEADER */}
                            <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-1 shrink-0">
                                <div className="text-left flex-1">
                                    <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-1.5">Niramoy Clinic & Diagnostic</h1>
                                    <h2 className="text-sm font-black underline uppercase tracking-widest font-bengali">মাসিক চূড়ান্ত রিপোর্ট (Closing Status) : {monthOptions[selectedMonth].name}, {selectedYear}</h2>
                                </div>
                                <div className="w-[270px] border border-black text-[8.5pt] font-bold">
                                    <div className="flex justify-between border-b border-black p-1"><span className="text-blue-900">সর্বমোট জমা (Total Gross Cash) :</span> <span className="border-l border-black pl-3 w-18 text-right">{summary.grandTotalCollection.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-black p-1"><span className="text-rose-900">সর্বমোট খরচ (Total Operating Cost) :</span> <span className="border-l border-black pl-3 w-18 text-right text-rose-600">{summary.totalExpense.toLocaleString()}</span></div>
                                    <div className="flex justify-between p-1 bg-gray-50"><span className="text-blue-700 font-black">Nit Balance :</span> <span className="border-l border-black pl-3 w-18 text-right font-black text-blue-700">{(summary.grandTotalCollection - summary.totalExpense).toLocaleString()}</span></div>
                                </div>
                            </div>

                            {/* MAIN TABLE (TIGHTENED FOR SINGLE PAGE) */}
                            <table className="w-full border-collapse border-2 border-black text-[8.2pt] font-sans">
                                <thead>
                                    <tr className="h-6.5">
                                        <th className="border-2 border-black w-[75px]"></th> 
                                        <th className="border-2 border-black text-purple-700 font-black uppercase text-xs py-0.5" colSpan={3}>Collection</th>
                                        <th className="border-2 border-black text-fuchsia-700 font-black uppercase text-xs py-0.5" colSpan={3}>Expense</th>
                                        <th className="border-2 border-black text-fuchsia-600 font-black uppercase text-xs py-0.5">Balance</th>
                                    </tr>
                                    <tr className="bg-gray-100 uppercase text-[7.8pt] font-black h-6.5">
                                        <th className="border-2 border-black text-blue-700">Date</th>
                                        <th className="border-2 border-black text-blue-700">Diagnostic</th>
                                        <th className="border-2 border-black text-blue-700">Clinic</th>
                                        <th className="border-2 border-black text-blue-700">Total collection</th>
                                        <th className="border-2 border-black text-blue-700">Diagnostic</th>
                                        <th className="border-2 border-black text-blue-700">Clinic</th>
                                        <th className="border-2 border-black text-blue-700">Total Expense</th>
                                        <th className="border-2 border-black text-blue-700"></th> 
                                    </tr>
                                </thead>
                                <tbody>
                                    {statusReportData.map((row, idx) => (
                                        <tr key={idx} className="h-[25.5px] hover:bg-slate-50 transition-colors leading-tight">
                                            <td className="border-2 border-black text-center font-mono font-bold text-[7.5pt]">{row.date}</td>
                                            <td className="border-2 border-black text-center">{row.diagColl > 0 ? row.diagColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.clinicColl > 0 ? row.clinicColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black bg-slate-50">{row.totalColl > 0 ? row.totalColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.diagExp > 0 ? row.diagExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.clinicExp > 0 ? row.clinicExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black bg-slate-50">{row.totalExp > 0 ? row.totalExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black text-slate-900 bg-gray-50">{row.balance > 0 ? row.balance.toLocaleString() : ''}</td>
                                        </tr>
                                    ))}
                                    {/* Calculated padding empty rows */}
                                    {statusReportData.length < 31 && Array.from({length: 31 - statusReportData.length}).map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-[25.5px]">
                                            <td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td><td className="border-2 border-black"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-3 pt-2 flex justify-between px-10 text-gray-500 font-bold uppercase text-[7.8pt] shrink-0 no-print">
                                <div className="text-center w-36 border-t border-black pt-1">Accountant</div>
                                <div className="text-center w-36 border-t border-black pt-1">Authorized MD</div>
                            </div>
                        </main>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Money Management (Loans) */}
                {activeTab === 'money_mgmt' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in no-print">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                                <h3 className="text-lg font-black text-emerald-600 uppercase mb-4 flex items-center gap-2"><MoneyIcon size={20}/> Add New Loan Source</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Source (e.g. Bank Asia)" className="p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold" id="loan_src"/>
                                    <input type="number" placeholder="Amount" className="p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" id="loan_amt"/>
                                </div>
                                <button onClick={() => { 
                                    const src = (document.getElementById('loan_src') as HTMLInputElement).value;
                                    const amt = parseFloat((document.getElementById('loan_amt') as HTMLInputElement).value);
                                    if(src && amt) setLoans([...loans, {id:`L-${Date.now()}`, source:src, amount:amt, date:new Date().toISOString().split('T')[0], type:'Capital'}]);
                                }} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs">Add Loan</button>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                                <h3 className="text-lg font-black text-slate-800 uppercase mb-4">Loan Master List</h3>
                                {loans.map(l => (
                                    <div key={l.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-3 flex justify-between items-center group">
                                        <div><p className="font-black text-slate-800 uppercase text-sm">{l.source}</p><p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Loan ID: {l.id} | Date: {l.date}</p></div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-rose-600">৳{l.amount.toLocaleString()}</p>
                                            <button onClick={() => setLoans(loans.filter(x=>x.id!==l.id))} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><TrashIcon size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                                <h3 className="text-lg font-black text-blue-600 uppercase mb-4 flex items-center gap-2"><TrendingDownIcon size={20}/> Log Monthly Repayments</h3>
                                <div className="space-y-4">
                                    <select className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold" id="rep_loan_id">
                                        <option value="">Select Loan...</option>
                                        {loans.map(l => <option key={l.id} value={l.id}>{l.source} (৳{l.amount})</option>)}
                                    </select>
                                    <input type="number" placeholder="Repayment Amount" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" id="rep_amt"/>
                                    <button onClick={() => {
                                        const lid = (document.getElementById('rep_loan_id') as HTMLSelectElement).value;
                                        const ramt = parseFloat((document.getElementById('rep_amt') as HTMLInputElement).value);
                                        if(lid && ramt) setRepayments([...repayments, {id:`R-${Date.now()}`, loanId:lid, amount:ramt, date:new Date().toISOString().split('T')[0], type:'Installment'}]);
                                    }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">Submit Repayment</button>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Manual Month-end Adjustment</h4>
                                <div className="flex justify-between items-center"><span className="text-sm font-bold">Manual Installment:</span><input type="number" value={manualLoanInstallment || ''} onChange={e=>setManualLoanInstallment(parseFloat(e.target.value)||0)} className="w-32 bg-slate-800 border-none rounded p-2 text-right font-black text-amber-400" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Future Plans */}
                {activeTab === 'future_plans' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                             <h3 className="text-xl font-black text-indigo-600 mb-6 font-bengali border-b pb-4 flex items-center gap-3"><PlusIcon size={24}/> ভবিষ্যৎ পরিকল্পনা ও লক্ষ্যমাত্রা</h3>
                             <div className="grid grid-cols-2 gap-6">
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">পরিকল্পনার শিরোনাম</label><input value={newPlan.title} onChange={e=>setNewPlan({...newPlan, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-bold" placeholder="যেমন: নতুন USG মেশিন ক্রয়"/></div>
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">সম্ভাব্য খরচ</label><input type="number" value={newPlan.estimatedCost} onChange={e=>setNewPlan({...newPlan, estimatedCost: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black" /></div>
                             </div>
                             <button onClick={addFuturePlan} className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">নতুন পরিকল্পনা যুক্ত করুন</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {futurePlans.map(p => (
                                <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{p.status}</div>
                                        <button onClick={() => deletePlan(p.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-2"><TrashIcon size={18}/></button>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase leading-tight mb-2">{p.title}</h4>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100"><span className="text-sm font-black text-indigo-600 uppercase">৳{p.estimatedCost.toLocaleString()}</span><select value={p.status} onChange={e=>updatePlan(p.id, 'status', e.target.value as any)} className="bg-slate-50 border-none text-[10px] font-black rounded-lg uppercase tracking-widest outline-none"><option>Pending</option><option>In Progress</option><option>Completed</option></select></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Partner Management */}
                {activeTab === 'shareholder_mgmt' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl flex items-center justify-between"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">অংশীদার ব্যবস্থাপনা (Partner List)</h3><button onClick={() => {
                            const n = prompt("নাম লিখুন:"); const s = parseFloat(prompt("শেয়ার সংখ্যা:") || '0');
                            if(n && s) setDynamicShareholders([...dynamicShareholders, {id:Date.now(), name:n, shares:s, description: `${s}টি`}]);
                        }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">+ নতুন অংশীদার</button></div>
                        <div className="overflow-x-auto rounded-[2rem] border border-slate-200 shadow-xl bg-white"><table className="w-full text-left border-collapse"><thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200"><tr><th className="p-5">SL</th><th className="p-5">নাম</th><th className="p-5 text-center">শেয়ার</th><th className="p-5">বিবরণ</th><th className="p-5 text-center">X</th></tr></thead><tbody className="divide-y divide-slate-100">
                            {dynamicShareholders.map((s, i) => (
                                <tr key={s.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="p-5 font-bold text-slate-400">{i+1}</td>
                                    <td className="p-5 font-black text-slate-800 uppercase font-bengali">{s.name}</td>
                                    <td className="p-5 text-center font-black text-blue-600">{s.shares}</td>
                                    <td className="p-5 text-slate-500 text-sm">{s.description}</td>
                                    <td className="p-5 text-center"><button onClick={() => setDynamicShareholders(dynamicShareholders.filter(x=>x.id!==s.id))} className="text-rose-400 hover:text-rose-600 p-2"><TrashIcon size={18}/></button></td>
                                </tr>
                            ))}
                        </tbody></table></div>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Company Collection */}
                {activeTab === 'company_collection' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                             <h3 className="text-xl font-black text-cyan-600 mb-6 font-bengali border-b pb-4 flex items-center gap-3"><ClinicIcon className="w-6 h-6" /> কোম্পানি কালেকশন ডাটা এন্ট্রি</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">কোম্পানি</label><input value={newCompanyEntry.companyName} onChange={e=>setNewCompanyEntry({...newCompanyEntry, companyName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold" placeholder="কোম্পানির নাম..."/></div>
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">টাকার পরিমাণ (৳)</label><input type="number" value={newCompanyEntry.amount} onChange={e=>setNewCompanyEntry({...newCompanyEntry, amount: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" /></div>
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">তারিখ</label><input type="date" value={newCompanyEntry.date} onChange={e=>setNewCompanyEntry({...newCompanyEntry, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" /></div>
                             </div>
                             <button onClick={addCompanyCollection} className="mt-6 w-full py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl transition-all">কালেকশন সেভ করুন</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsolidatedAccountsPage;
