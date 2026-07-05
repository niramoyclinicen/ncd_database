
import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice, DueCollection, ExpenseItem, Employee, PurchaseInvoice, SalesInvoice, Medicine } from './DiagnosticData';
import { IndoorInvoice } from './ClinicPage';
import { BackIcon, FileTextIcon, UsersIcon, WalletIcon, MoneyIcon, TrendingDownIcon, ChartIcon, PlusIcon, Activity, TrashIcon, SaveIcon, PrinterIcon, ClinicIcon, EditIcon, XIcon, Plus } from './Icons';

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
    address?: string;
    phone?: string;
    joinDate?: string;
    isDeleted?: boolean;
    deletedAt?: string;
    updatedAt?: string;
}

interface ShareholderLog {
    id: string;
    shareholderId: number;
    action: 'ADD' | 'UPDATE' | 'DELETE';
    details: string;
    timestamp: string;
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
    { key: 'Reagent buy', label: 'রিএজেন্ট' },
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
    { key: 'Maintenance', label: 'রক্ষণাবেক্ষণ' },
    { key: 'Electrical and Electronics', label: 'ইলেকট্রিক্যাল ও ইলেকট্রনিক্স' },
    { key: 'Others', label: 'অন্যান্য খরচ' },
    { key: 'Old Loan Repay', label: 'পূর্বের ঋণ পরিশোধ' }
];

const diagExpenseCategories = [
    'House rent', 'Electricity bill', 'Stuff salary', 'Reagent buy', 'Marketing', 'Motorcycle', 'Doctor donation & Vehicle service',
    'Instruments buy/ repair', 'Diagnostic development', 'Maintenance', 'License cost', 
    'X-ray Film buy', 'Mobile buy/ Flexiload', 'Press Cost', 'Food/Meal Cost', 'Paper / Dish / Wifi Bill',
    'Electrical and Electronics',
    'Others',
];

const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

const ConsolidatedAccountsPage: React.FC<ConsolidatedAccountsPageProps> = ({
  onBack, labInvoices, dueCollections, detailedExpenses, employees, purchaseInvoices, salesInvoices, indoorInvoices, medicines = []
}) => {
    const [activeTab, setActiveTab] = useState<'monthly_expense_sheet' | 'daily_collection' | 'daily_expense' | 'accounts' | 'shareholders' | 'money_mgmt' | 'final_status' | 'future_plans' | 'shareholder_mgmt' | 'company_collection'>('accounts');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [deptFilter, setDeptFilter] = useState<'All' | 'Diagnostic' | 'Clinic'>('All');
    
    const [dynamicShareholders, setDynamicShareholders] = useState<Shareholder[]>(() => {
        const saved = localStorage.getItem('ncd_shareholders');
        if (saved) return JSON.parse(saved);
        // Add default values for original data if field is missing
        return initialShareholders.map(s => ({ 
            ...s, 
            address: 'Enayetpur, Sirajganj', 
            phone: 'N/A', 
            joinDate: '2024-01-01' 
        }));
    });
    const [shareholderLogs, setShareholderLogs] = useState<ShareholderLog[]>(() => JSON.parse(localStorage.getItem('ncd_shareholder_logs') || '[]'));
    const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
    const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);

    const [loans, setLoans] = useState<LoanRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loans') || '[]'));
    const [repayments, setRepayments] = useState<RepaymentRecord[]>(() => JSON.parse(localStorage.getItem('ncd_loan_repayments') || '[]'));
    const [futurePlans, setFuturePlans] = useState<FuturePlan[]>(() => JSON.parse(localStorage.getItem('ncd_future_plans') || '[]'));
    const [companyCollections, setCompanyCollections] = useState<CompanyCollection[]>(() => JSON.parse(localStorage.getItem('ncd_company_collections') || '[]'));
    
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [monthlyAdjustments, setMonthlyAdjustments] = useState<Record<string, { profitDist: number; houseRent: number; loanInstallment: number }>>(() => 
        JSON.parse(localStorage.getItem('ncd_monthly_adjustments') || '{}')
    );

    const currentMonthKey = `${selectedYear}-${selectedMonth}`;
    const adj = monthlyAdjustments[currentMonthKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 };

    const updateAdjustment = (field: 'profitDist' | 'houseRent' | 'loanInstallment', val: number) => {
        setMonthlyAdjustments(prev => ({
            ...prev,
            [currentMonthKey]: {
                ...(prev[currentMonthKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 }),
                [field]: val
            }
        }));
    };

    const [newPlan, setNewPlan] = useState<Partial<FuturePlan>>({ title: '', estimatedCost: 0, status: 'Pending', targetDate: '' });
    const [newCompanyEntry, setNewCompanyEntry] = useState({ companyName: '', amount: 0, date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        localStorage.setItem('ncd_shareholders', JSON.stringify(dynamicShareholders));
        localStorage.setItem('ncd_loans', JSON.stringify(loans));
        localStorage.setItem('ncd_loan_repayments', JSON.stringify(repayments));
        localStorage.setItem('ncd_future_plans', JSON.stringify(futurePlans));
        localStorage.setItem('ncd_company_collections', JSON.stringify(companyCollections));
        localStorage.setItem('ncd_monthly_adjustments', JSON.stringify(monthlyAdjustments));
        localStorage.setItem('ncd_shareholder_logs', JSON.stringify(shareholderLogs));
    }, [dynamicShareholders, loans, repayments, futurePlans, companyCollections, monthlyAdjustments, shareholderLogs]);

    const addLog = (shareholderId: number, action: 'ADD' | 'UPDATE' | 'DELETE', details: string) => {
        const newLog: ShareholderLog = {
            // eslint-disable-next-line react-hooks/purity
            id: `LOG-${Date.now()}`,
            shareholderId,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        setShareholderLogs(prev => [newLog, ...prev]);
    };

    const handleAddOrUpdatePartner = (partner: Partial<Shareholder>) => {
        if (!partner.name || !partner.shares) return alert("নাম এবং শেয়ার সংখ্যা দিন।");
        
        if (editingShareholder) {
            if (!confirm("আপনি কি এই তথ্যগুলো পরিবর্তন করতে চান?")) return;
            const updated = dynamicShareholders.map(s => s.id === editingShareholder.id ? { ...s, ...partner, updatedAt: new Date().toISOString() } as Shareholder : s);
            setDynamicShareholders(updated);
            addLog(editingShareholder.id, 'UPDATE', `Updated partner: ${partner.name}`);
            setEditingShareholder(null);
        } else {
            const newId = dynamicShareholders.length > 0 ? Math.max(...dynamicShareholders.map(s => s.id)) + 1 : 1;
            const newPartner: Shareholder = {
                id: newId,
                name: partner.name!,
                shares: partner.shares!,
                description: partner.description || `${partner.shares}টি`,
                address: partner.address || '',
                phone: partner.phone || '',
                joinDate: partner.joinDate || new Date().toISOString().split('T')[0],
            };
            setDynamicShareholders([...dynamicShareholders, newPartner]);
            addLog(newId, 'ADD', `Added new partner: ${partner.name}`);
        }
        setIsAddPartnerModalOpen(false);
    };

    const handleDeletePartner = (id: number) => {
        const partner = dynamicShareholders.find(s => s.id === id);
        if (!partner) return;
        if (confirm(`আপনি কি নিশ্চিত যে আপনি "${partner.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`)) {
            setDynamicShareholders(dynamicShareholders.filter(s => s.id !== id));
            addLog(id, 'DELETE', `Deleted partner: ${partner.name}`);
        }
    };

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
            const dailyExps = (detailedExpenses[dateStr] || []).filter(ex => {
                if (ex.isDeleted) return false;
                if (deptFilter === 'All') return true;
                if (deptFilter === 'Diagnostic') {
                    return ex.dept === 'Diagnostic' || (!ex.dept && diagExpenseCategories.includes(ex.category));
                }
                if (deptFilter === 'Clinic') {
                    // For Clinic, we include it if it's tagged Clinic OR if it's untagged and in clinic categories
                    // To avoid double counting untagged shared categories, we could prioritize one, 
                    // but usually these were separate in the user's mind even if categories overlapped.
                    return ex.dept === 'Clinic' || (!ex.dept && clinicExpenseCategories.includes(ex.category));
                }
                return false;
            });
            const categorySums: Record<string, number> = {};
            expenseMapSequence.forEach(e => categorySums[e.key] = 0);
            dailyExps.forEach(exp => {
                // Only process if it belongs to the intended department or has no department assigned
                // For the consolidated sheet, we might want to show everything, but the user specifically
                // complained about Diagnostic expenses appearing in Clinic reports.
                // However, 'expenseSheetData' seems to be a combined ledger.
                // If the user wants to see ONLY Clinic expenses in a "Monthly Clinic Expense Sheet",
                // we should check how this data is used.
                
                let catName = exp.category;
                
                // Mapping Diagnostic & Clinic categories to Consolidated keys
                if (catName === 'Clinic development' || catName === 'Diagnostic development') catName = 'Clinic_Dev';
                if (catName === 'Electricity bill' || catName === 'Paper / Dish / Wifi Bill') catName = 'Bills';
                if (catName === 'Doctor donation & Vehicle service' || catName === 'Doctor donation') catName = 'Doctor donation';
                if (catName === 'Instruments buy/ repair' || catName === 'Repair/Instruments') {
                    if (exp.subCategory === 'Stationary' || exp.subCategory === 'Stationery') catName = 'Stationery';
                    else catName = 'Instruments';
                }
                if (catName === 'Maintenance') catName = 'Maintenance';
                if (catName === 'License cost' || catName === 'License/Official') catName = 'License';
                if (catName === 'X-ray Film buy') catName = 'X-Ray';
                if (catName === 'Mobile buy/ Flexiload' || catName === 'Mobile') catName = 'Mobile';
                if (catName === 'Press Cost') catName = 'Press';
                if (catName === 'Food/Meal Cost' || catName === 'Food/Refreshment') catName = 'Food';
                if (catName === 'Bank/NGO Installment' || catName === 'Interest/Loan') catName = 'Installment';
                if (catName === 'Stationery') catName = 'Stationery';
                if (catName === 'Stuff salary') catName = 'Stuff salary';
                if (catName === 'Generator') catName = 'Generator';
                if (catName === 'Marketing') catName = 'Marketing';
                if (catName === 'Motorcycle') catName = 'Motorcycle';
                if (catName === 'Reagent buy') catName = 'Reagent buy';
                if (catName === 'House rent') catName = 'House rent';
                if (catName === 'Electrical and Electronics') catName = 'Electrical and Electronics';

                const matched = expenseMapSequence.find(e => e.key === catName);
                if (matched) categorySums[matched.key] += exp.paidAmount;
                else categorySums['Others'] += exp.paidAmount;
            });
            const totalDay = Object.values(categorySums).reduce((a, b) => a + b, 0);
            rows.push({ date: dateStr, categories: categorySums, total: totalDay });
        }
        const columnTotals: Record<string, number> = {};
        expenseMapSequence.forEach(e => { columnTotals[e.key] = rows.reduce((sum, row) => sum + row.categories[e.key], 0); });
        const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
        return { rows, columnTotals, grandTotal };
    }, [detailedExpenses, selectedMonth, selectedYear, deptFilter]);

    const dailyCollectionData = useMemo(() => {
    const isSameDay = (d1: string, d2: string) => {
        if (!d1 || !d2) return false;
        const [y1, m1, day1] = d1.split('T')[0].split('-').map(Number);
        const [y2, m2, day2] = d2.split('T')[0].split('-').map(Number);
        return y1 === y2 && m1 === m2 && day1 === day2;
    };

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rawRows = [];
        let diagUpto = 0;
        let clinicUpto = 0;
        let lastDayWithData = -1;

        const getNetDiagCash = (inv: LabInvoice) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const usgFee = items.reduce((s, it) => s + ((it.usg_exam_charge || 0) * (it.quantity || 0)), 0);
            const labFee = items.reduce((s, it) => s + ((it.extra_lab_fee || 0) * (it.quantity || 0)), 0);
            const commPaid = inv.commission_paid || 0;
            const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && !isSameDay(dc.collection_date, inv.invoice_date)).reduce((s, dc) => s + dc.amount_collected, 0);
            const initialPaid = inv.paid_amount - subsequentDues;
            return initialPaid - usgFee - labFee - commPaid;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            
            const diagToday = labInvoices.filter(inv => inv && inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, inv) => s + getNetDiagCash(inv), 0);
            const diagDue = dueCollections.filter(dc => {
                if (!dc || !isSameDay(dc.collection_date, dateStr) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || !isSameDay(inv.invoice_date, dc.collection_date);
            }).reduce((s, dc) => s + dc.amount_collected, 0);
            const diagTotal = diagToday + diagDue;
            diagUpto += diagTotal;

            const clinicToday = indoorInvoices.filter(inv => {
                if (!inv) return false;
                const dateToUse = inv.invoice_date || inv.admission_date;
                return dateToUse === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
            }).reduce((s, inv) => {
                const items = Array.isArray(inv.items) ? inv.items : [];
                const fundedRevenue = items.filter(it => it && it.isClinicFund).reduce((ss, ii) => ss + (ii.payable_amount || 0), 0);
                const pcAmount = (inv.commission_paid || 0) + (inv.special_commission || 0);
                const specialDiscount = inv.special_discount_amount || 0;
                return s + (fundedRevenue - pcAmount - specialDiscount);
            }, 0);
            const clinicDue = dueCollections.filter(dc => {
                if (!dc || !isSameDay(dc.collection_date, dateStr) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || !isSameDay(inv.invoice_date || inv.admission_date || '', dc.collection_date);
            }).reduce((s, dc) => s + dc.amount_collected, 0);
            const clinicTotal = clinicToday + clinicDue;
            clinicUpto += clinicTotal;

            if (diagTotal > 0 || clinicTotal > 0) {
                lastDayWithData = d - 1;
            }

            const displayDate = `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`;
            rawRows.push({ 
                date: displayDate, 
                diag: { today: diagToday, due: diagDue, total: diagTotal, upto: diagUpto }, 
                clinic: { today: clinicToday, due: clinicDue, total: clinicTotal, upto: clinicUpto } 
            });
        }

        // Hide upto values after the last day with data
        return rawRows.map((row, idx) => {
            if (idx > lastDayWithData) {
                return {
                    ...row,
                    diag: { ...row.diag, upto: null },
                    clinic: { ...row.clinic, upto: null }
                };
            }
            return row;
        });
    }, [labInvoices, indoorInvoices, dueCollections, selectedMonth, selectedYear]);

    const dailyExpenseReportData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rawRows = [];
        let diagUpto = 0;
        let clinicUpto = 0;
        let lastDayWithData = -1;

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            const dailyExps = (detailedExpenses[dateStr] || []).filter(ex => !ex.isDeleted);

            const diagToday = dailyExps.filter(ex => ex.dept === 'Diagnostic' || (!ex.dept && diagExpenseCategories.includes(ex.category))).reduce((s, ex) => s + ex.paidAmount, 0);
            diagUpto += diagToday;

            const clinicToday = dailyExps.filter(ex => ex.dept === 'Clinic' || (!ex.dept && clinicExpenseCategories.includes(ex.category) && !diagExpenseCategories.includes(ex.category))).reduce((s, ex) => s + ex.paidAmount, 0);
            clinicUpto += clinicToday;

            if (diagToday > 0 || clinicToday > 0) {
                lastDayWithData = d - 1;
            }

            const displayDate = `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`;
            rawRows.push({ date: displayDate, diag: { today: diagToday, upto: diagUpto }, clinic: { today: clinicToday, upto: clinicUpto }, total: diagToday + clinicToday });
        }

        // Hide upto values after the last day with data
        return rawRows.map((row, idx) => {
            if (idx > lastDayWithData) {
                return {
                    ...row,
                    diag: { ...row.diag, upto: null },
                    clinic: { ...row.clinic, upto: null }
                };
            }
            return row;
        });
    }, [detailedExpenses, selectedMonth, selectedYear]);

    const statusReportData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rawRows = [];
        let runningBalance = 0;
        let lastDayWithData = -1;

        const getNetDiagCash = (inv: LabInvoice) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const usgFee = items.reduce((s, it) => s + ((it.usg_exam_charge || 0) * (it.quantity || 0)), 0);
            const labFee = items.reduce((s, it) => s + ((it.extra_lab_fee || 0) * (it.quantity || 0)), 0);
            const commPaid = inv.commission_paid || 0;
            const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && !isSameDay(dc.collection_date, inv.invoice_date)).reduce((s, dc) => s + dc.amount_collected, 0);
            const initialPaid = inv.paid_amount - subsequentDues;
            return initialPaid - usgFee - labFee - commPaid;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${dayStr}`;
            
            // Collections
            const diagColl = labInvoices.filter(inv => inv.invoice_date === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, inv) => s + getNetDiagCash(inv), 0)
                           + dueCollections.filter(dc => dc.collection_date === dateStr && dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);

            const clinicColl = indoorInvoices.filter(inv => {
                const dateToUse = inv.invoice_date || inv.admission_date;
                return dateToUse === dateStr && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
            }).reduce((s, inv) => {
                const items = Array.isArray(inv.items) ? inv.items : [];
                const fundedRevenue = items.filter(it => it && it.isClinicFund).reduce((ss, ii) => ss + (ii.payable_amount || 0), 0);
                const pcAmount = (inv.commission_paid || 0) + (inv.special_commission || 0);
                const specialDiscount = inv.special_discount_amount || 0;
                return s + (fundedRevenue - pcAmount - specialDiscount);
            }, 0) + dueCollections.filter(dc => dc.collection_date === dateStr && !dc.invoice_id.startsWith('INV')).reduce((s, dc) => s + dc.amount_collected, 0);

            const totalColl = diagColl + clinicColl;

            // Expenses
            const dailyExps = (detailedExpenses[dateStr] || []).filter(ex => !ex.isDeleted);
            const diagExp = dailyExps.filter(ex => ex.dept === 'Diagnostic' || (!ex.dept && diagExpenseCategories.includes(ex.category))).reduce((s, ex) => s + ex.paidAmount, 0);
            const clinicExp = dailyExps.filter(ex => ex.dept === 'Clinic' || (!ex.dept && clinicExpenseCategories.includes(ex.category) && !diagExpenseCategories.includes(ex.category))).reduce((s, ex) => s + ex.paidAmount, 0);
            const totalExp = diagExp + clinicExp;

            if (totalColl > 0 || totalExp > 0) {
                lastDayWithData = d - 1;
            }

            runningBalance += (totalColl - totalExp);

            rawRows.push({
                date: `${dayStr}-${monthOptions[selectedMonth].name.substring(0, 3)}-${String(selectedYear).substring(2)}`,
                diagColl, clinicColl, totalColl,
                diagExp, clinicExp, totalExp,
                balance: runningBalance
            });
        }

        // Hide balance values after the last day with data
        return rawRows.map((row, idx) => {
            if (idx > lastDayWithData) {
                return { ...row, balance: null };
            }
            return row;
        });
    }, [labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear]);

    const summary = useMemo(() => {
    const isSameDay = (d1: string, d2: string) => {
        if (!d1 || !d2) return false;
        const [y1, m1, day1] = d1.split('T')[0].split('-').map(Number);
        const [y2, m2, day2] = d2.split('T')[0].split('-').map(Number);
        return y1 === y2 && m1 === m2 && day1 === day2;
    };

        const isSelectedMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const [y, m] = dateStr.split('-').map(Number);
            return m - 1 === selectedMonth && y === selectedYear;
        };
        const isBeforeSelectedMonth = (dateStr: string) => {
            if (!dateStr) return false;
            const [y, m] = dateStr.split('-').map(Number);
            return y < selectedYear || (y === selectedYear && m - 1 < selectedMonth);
        };
        
        const getNetDiagCash = (inv: LabInvoice) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const usgFee = items.reduce((s, it) => s + ((it.usg_exam_charge || 0) * (it.quantity || 0)), 0);
            const labFee = items.reduce((s, it) => s + ((it.extra_lab_fee || 0) * (it.quantity || 0)), 0);
            const commPaid = inv.commission_paid || 0;
            const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && !isSameDay(dc.collection_date, inv.invoice_date)).reduce((s, dc) => s + dc.amount_collected, 0);
            const initialPaid = inv.paid_amount - subsequentDues;
            return initialPaid - usgFee - labFee - commPaid;
        };

        const calcNetPrev = () => {
            const prevLab = labInvoices.filter(inv => inv && isBeforeSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, i) => s + getNetDiagCash(i), 0);
            const prevLabDue = dueCollections.filter(dc => {
                if (!dc || !isBeforeSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || inv.invoice_date !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);
            
            const prevClinic = indoorInvoices.filter(inv => {
                if (!inv) return false;
                const dateToUse = inv.invoice_date || inv.admission_date;
                return isBeforeSelectedMonth(dateToUse) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
            }).reduce((acc, inv) => {
                const items = Array.isArray(inv.items) ? inv.items : [];
                const netIncomeForInv = items.filter((it: any) => it && it.isClinicFund).reduce((s: number, i: any) => s + (i.payable_amount || 0), 0);
                const pcAmount = (inv.commission_paid || 0) + (inv.special_commission || 0);
                const specialDiscount = inv.special_discount_amount || 0;
                return acc + (netIncomeForInv - pcAmount - specialDiscount);
            }, 0);

            const prevClinicDue = dueCollections.filter(dc => {
                if (!dc || !isBeforeSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || (inv.invoice_date || inv.admission_date) !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);
            
            const prevMedSalesOutdoor = salesInvoices.filter(inv => inv && isBeforeSelectedMonth(inv.invoiceDate) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, i) => s + i.netPayable, 0);
            const prevMedSalesIndoor = indoorInvoices.filter(inv => {
                if (!inv) return false;
                const dateToUse = inv.invoice_date || inv.admission_date;
                return isBeforeSelectedMonth(dateToUse) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
            }).reduce((s, inv) => {
                const items = Array.isArray(inv.items) ? inv.items : [];
                return s + items.filter(it => it && it.service_type === 'Medicine').reduce((ss, it) => ss + (it.payable_amount || 0), 0);
            }, 0);
            const prevMedSales = prevMedSalesOutdoor + prevMedSalesIndoor;

            const prevMedPurch = purchaseInvoices.filter(inv => inv && isBeforeSelectedMonth(inv.invoiceDate) && inv.status !== 'Initial' && inv.status !== 'Cancelled').reduce((s, i) => s + i.netPayable, 0);
            const prevCompany = companyCollections.filter(c => c && isBeforeSelectedMonth(c.date)).reduce((s, c) => s + c.amount, 0);
            let prevExp = 0;
            Object.entries(detailedExpenses).forEach(([date, items]) => {
                if (isBeforeSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => {
                    if (it && !it.isDeleted) prevExp += it.paidAmount;
                });
            });

            // Subtract all previous manual adjustments (profit distributions and house rent)
            let prevAdjustments = 0;
            Object.entries(monthlyAdjustments).forEach(([key, val]) => {
                const [y, m] = key.split('-').map(Number);
                if (y < selectedYear || (y === selectedYear && m < selectedMonth)) {
                    prevAdjustments += (val.profitDist || 0) + (val.houseRent || 0);
                }
            });

            const net = (prevLab + prevLabDue + prevClinic + prevClinicDue + prevMedSales + prevCompany) - (prevExp + prevMedPurch + prevAdjustments);
            return net;
        };

        const prevJer = calcNetPrev();
        const diagCurrent = labInvoices.filter(inv => inv && isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, inv) => s + getNetDiagCash(inv), 0) + 
            dueCollections.filter(dc => {
                if (!dc || !isSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return inv && isSelectedMonth(inv.invoice_date) && inv.invoice_date !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);
        const diagDue = dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
            const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || !isSelectedMonth(inv.invoice_date);
        }).reduce((s, dc) => s + dc.amount_collected, 0);
        
        let totalMonthlyOperatingExpenses = 0;
        Object.entries(detailedExpenses).forEach(([date, items]) => {
            if (isSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => {
                if (it && !it.isDeleted) {
                    totalMonthlyOperatingExpenses += it.paidAmount;
                }
            });
        });

        const clinicRevenueCurrent = indoorInvoices.filter(inv => {
            if (!inv) return false;
            const dateToUse = inv.invoice_date || inv.admission_date;
            return isSelectedMonth(dateToUse) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
        }).reduce((acc, inv) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const netIncomeForInv = items.filter((it: any) => it && it.isClinicFund).reduce((s: number, i: any) => s + (i.payable_amount || 0), 0);
            const pcAmount = (inv.commission_paid || 0) + (inv.special_commission || 0);
            const specialDiscount = inv.special_discount_amount || 0;
            return acc + (netIncomeForInv - pcAmount - specialDiscount);
        }, 0);

        const clinicCurrent = clinicRevenueCurrent + 
            dueCollections.filter(dc => {
                if (!dc || !isSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return inv && isSelectedMonth(inv.invoice_date || inv.admission_date) && (inv.invoice_date || inv.admission_date) !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);
        const clinicDue = dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
            const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || !isSelectedMonth(inv.invoice_date || inv.admission_date);
        }).reduce((s, dc) => s + dc.amount_collected, 0);
        
        const medSalesOutdoor = salesInvoices.filter(inv => inv && isSelectedMonth(inv.invoiceDate) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, i) => s + i.netPayable, 0);
        const medSalesIndoor = indoorInvoices.filter(inv => {
            if (!inv) return false;
            const dateToUse = inv.invoice_date || inv.admission_date;
            return isSelectedMonth(dateToUse) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';
        }).reduce((s, inv) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            return s + items.filter(it => it && it.service_type === 'Medicine').reduce((ss, it) => ss + (it.payable_amount || 0), 0);
        }, 0);
        const medSalesCurrent = medSalesOutdoor + medSalesIndoor;

        const medPurchCurrent = purchaseInvoices.filter(inv => inv && isSelectedMonth(inv.invoiceDate) && inv.status !== 'Initial' && inv.status !== 'Cancelled').reduce((s, i) => s + i.netPayable, 0);
        const companyCurrent = companyCollections.filter(c => c && isSelectedMonth(c.date)).reduce((s, c) => s + c.amount, 0);

        const totalDiag = diagCurrent + diagDue;
        const totalClinic = clinicCurrent + clinicDue;
        const totalMedNet = medSalesCurrent - medPurchCurrent;
        
        const grandTotalCollection = totalDiag + totalClinic + totalMedNet + companyCurrent + prevJer - adj.houseRent;
        
        const groupedExp: Record<string, number> = {};
        expenseMapSequence.forEach(e => groupedExp[e.key] = 0);
        Object.entries(detailedExpenses).forEach(([date, items]) => {
            if (isSelectedMonth(date)) (items as ExpenseItem[]).forEach(it => {
                if (it.isDeleted) return;
                let catName = it.category;
                
                // Mapping Diagnostic categories to Consolidated keys
                if (catName === 'Clinic development' || catName === 'Diagnostic development') catName = 'Clinic_Dev';
                if (catName === 'Electricity bill' || catName === 'Paper / Dish / Wifi Bill') catName = 'Bills';
                if (catName === 'Doctor donation & Vehicle service' || catName === 'Doctor donation') catName = 'Doctor donation';
                if (catName === 'Instruments buy/ repair' || catName === 'Repair/Instruments') {
                    if (it.subCategory === 'Stationary' || it.subCategory === 'Stationery') catName = 'Stationery';
                    else catName = 'Instruments';
                }
                if (catName === 'Maintenance') catName = 'Maintenance';
                if (catName === 'License cost' || catName === 'License/Official') catName = 'License';
                if (catName === 'X-ray Film buy') catName = 'X-Ray';
                if (catName === 'Mobile buy/ Flexiload' || catName === 'Mobile') catName = 'Mobile';
                if (catName === 'Press Cost') catName = 'Press';
                if (catName === 'Food/Meal Cost' || catName === 'Food/Refreshment') catName = 'Food';
                if (catName === 'Bank/NGO Installment' || catName === 'Interest/Loan') catName = 'Installment';
                if (catName === 'Stuff salary') catName = 'Stuff salary';
                if (catName === 'Generator') catName = 'Generator';
                if (catName === 'Marketing') catName = 'Marketing';
                if (catName === 'Motorcycle') catName = 'Motorcycle';
                if (catName === 'Reagent buy') catName = 'Reagent buy';
                if (catName === 'House rent') catName = 'House rent';
                if (catName === 'Electrical and Electronics') catName = 'Electrical and Electronics';

                const mapping = expenseMapSequence.find(e => e.key === catName);
                const key = mapping ? mapping.key : 'Others';
                groupedExp[key] += it.paidAmount;
            });
        });
        const monthlyLoanRepayments = repayments.filter(r => isSelectedMonth(r.date)).reduce((s, r) => s + r.amount, 0);
        const totalExpenseTableOnly = Object.values(groupedExp).reduce((s, v) => s + (v as number), 0) + monthlyLoanRepayments + adj.loanInstallment;
        const netProfit = grandTotalCollection - totalExpenseTableOnly;
        const finalClosingJer = netProfit - adj.profitDist;
        const totalShares = dynamicShareholders.reduce((s, h) => s + h.shares, 0);
        const profitPerShare = totalShares > 0 ? adj.profitDist / totalShares : 0;
        
        return { prevJer, diagCurrent, diagDue, totalDiag, clinicCurrent, clinicDue, totalClinic, medSalesCurrent, medPurchCurrent, totalMedNet, companyCurrent, grandTotalCollection, groupedExp, totalExpense: totalExpenseTableOnly, netProfit, finalClosingJer, profitPerShare, totalShares };
    }, [labInvoices, dueCollections, indoorInvoices, salesInvoices, purchaseInvoices, companyCollections, detailedExpenses, selectedMonth, selectedYear, monthlyAdjustments, dynamicShareholders, repayments, adj.houseRent, adj.loanInstallment, adj.profitDist]);

    const handlePrintSpecific = (elementId: string) => {
        const content = document.getElementById(elementId);
        if (!content) return;
        const win = window.open('', '', `width=${screen.availWidth},height=${screen.availHeight}`);
        if(!win) return;
        const isLandscape = elementId === 'section-monthly-expense';
        const isPartnerList = elementId === 'print-shareholder-list';
        const isProfitShare = elementId === 'section-profit-share';
        const html = `<html><head><title>Print Report</title><script src="https://cdn.tailwindcss.com"></script><style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap');
            @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: ${isPartnerList ? '8mm' : (isProfitShare ? '4mm' : (isLandscape ? '5mm' : '15mm'))} 10mm ${isPartnerList || isProfitShare ? '5mm' : '5mm'} 10mm; } 
            html, body { background: white; font-family: 'Inter', 'Hind Siliguri', sans-serif; padding: 0; margin: 0; color: black; box-sizing: border-box; -webkit-print-color-adjust: exact; width: 100%; height: auto !important; min-height: 0 !important; } 
            main { width: 100% !important; max-width: none !important; margin: 0 !important; padding: ${isLandscape ? '0.5mm' : (elementId === 'section-accounts' ? '2mm' : (isProfitShare ? '1mm' : '5mm'))} 0 !important; border: none !important; box-shadow: none !important; height: auto !important; min-height: 0 !important; display: flex; flex-direction: column; }
            .print-table { width: 100% !important; border-collapse: collapse !important; border: 2px solid #000 !important; table-layout: fixed; margin-bottom: 0 !important; } 
            th, td { border: 1.5px solid #000 !important; padding: ${isPartnerList ? '2px 4px' : '2px 1.5px'}; text-align: center; overflow: hidden; font-size: ${isPartnerList ? '10.5pt' : (isLandscape ? '8.75pt' : '10.5pt')}; line-height: 1.2; word-break: break-all; } 
            .no-print { display: none !important; } 
            .font-bengali { font-family: 'Hind Siliguri', sans-serif !important; } 
            .font-mono { font-family: 'JetBrains Mono', monospace !important; }
            h1 { font-size: ${isLandscape ? '14pt' : '18pt'} !important; margin: 0 !important; font-weight: 900 !important; line-height: 1.1; } 
            p { font-size: ${isLandscape ? '9.5pt' : '10pt'} !important; margin: 0 !important; line-height: 1.2; }
            .print-border-b { border-bottom: 2px solid black !important; }
            ${isPartnerList ? 'table tbody tr { height: 54px !important; page-break-inside: avoid; }' : ''}
        </style></head><body>${content.innerHTML}<script>setTimeout(() => { window.print(); window.close(); }, 850);</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    const commonTableCellClass = "p-1.5 border border-black font-bold text-[10.5pt] font-['Hind_Siliguri'] h-10 text-center";
    const commonAmtCellClass = "p-1.5 border border-black text-right font-black text-[10.5pt] w-[100px] h-10 font-['JetBrains_Mono']";

    const collectionTableCellClass = "p-1 border border-black font-bold text-[10pt] font-['Hind_Siliguri'] h-13 text-center";
    const collectionAmtCellClass = "p-1 border border-black text-right font-black text-[10pt] w-[90px] h-13 font-['JetBrains_Mono']";

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-['Inter']">
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
                    <div id="section-monthly-expense" className="animate-fade-in w-full">
                        <main className="relative p-2 print:p-0 w-full max-w-[98%] lg:max-w-[none] mx-auto bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-['Inter'] overflow-x-auto min-h-0">
                            <button 
                                onClick={() => handlePrintSpecific('section-monthly-expense')} 
                                className="no-print absolute top-1.5 right-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95 z-[60]"
                            >
                                <PrinterIcon size={14} /> 
                                <span className="text-[9px] font-bold uppercase tracking-wider">Print Landscape</span>
                            </button>
                            <div className="flex justify-between items-center mb-1 border-b-2 border-black pb-0.5 shrink-0 px-1 print:mb-0.5 print:pb-0.5">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-black uppercase text-blue-900 leading-none m-0 p-0 print:text-lg">Niramoy Clinic & Diagnostic</h1>
                                    <span className="h-4 w-0.5 bg-black"></span>
                                    <p className="text-[10pt] font-black uppercase tracking-tight text-slate-800 m-0 p-0 font-['Hind_Siliguri'] print:text-[8pt]">মাসিক খরচের হিসাব : {monthOptions[selectedMonth].name} {selectedYear}</p>
                                </div>
                                <div className="no-print flex items-center bg-slate-100 p-1 rounded border border-slate-300 mr-32 gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1 ml-0.5">Filter:</span>
                                    <button onClick={() => setDeptFilter('All')} className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${deptFilter === 'All' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>All</button>
                                    <button onClick={() => setDeptFilter('Diagnostic')} className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${deptFilter === 'Diagnostic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Diagnostic</button>
                                    <button onClick={() => setDeptFilter('Clinic')} className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${deptFilter === 'Clinic' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'}`}>Clinic</button>
                                </div>
                            </div>
                            <table className="print-table w-full text-[8.75pt] border-collapse border-2 border-black table-fixed leading-none">
                                <thead className="shrink-0 bg-gray-100">
                                    <tr className="bg-gray-100 h-[36px] print:h-[6mm]">
                                        <th className="border-2 border-black p-0 w-[45px] text-[8.5pt]">Date</th>
                                        {expenseMapSequence.map(e => <th key={e.key} className="border-2 border-black p-0 font-black text-[8pt] uppercase leading-tight break-all font-['Hind_Siliguri']">{e.label}</th>)}
                                        <th className="border-2 border-black p-0 bg-gray-200 font-black w-[70px] text-[8.5pt]">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseSheetData.rows.map(row => (
                                        <tr key={row.date} className="hover:bg-blue-50 transition-colors h-[32px] print:h-[5.3mm]">
                                            <td className="border border-black p-0 text-center font-['JetBrains_Mono'] font-bold text-[8.5pt] whitespace-nowrap bg-gray-50">{row.date.split('-')[2]} {monthOptions[parseInt(row.date.split('-')[1])-1].name.substring(0,3)}</td>
                                            {expenseMapSequence.map(e => <td key={e.key} className="border border-black p-0.5 text-center font-medium text-[9pt]">{row.categories[e.key] > 0 ? row.categories[e.key].toLocaleString() : '-'}</td>)}
                                            <td className="border border-black p-0.5 px-1 text-left font-black bg-gray-50 text-[9.5pt]">{row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                    {/* Padding Empty Rows if needed to fill the month */}
                                    {expenseSheetData.rows.length < 31 && Array.from({length: 31 - expenseSheetData.rows.length}).map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-[32px] print:h-[5.3mm]">
                                            <td className="border border-black bg-gray-50"></td>
                                            {expenseMapSequence.map(e => <td key={e.key} className="border border-black"></td>)}
                                            <td className="border border-black bg-gray-50"></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-black h-[36px] print:h-[6mm]">
                                    <tr>
                                        <td className="border-2 border-black p-0 text-center text-[7.5pt] uppercase">TOTAL:</td>
                                        {expenseMapSequence.map(e => <td key={e.key} className="border-2 border-black p-0 text-center text-blue-900 text-[8pt]">{expenseSheetData.columnTotals[e.key] > 0 ? expenseSheetData.columnTotals[e.key].toLocaleString() : '-'}</td>)}
                                        <td className="border-2 border-black p-0 px-1 text-left text-emerald-700 bg-emerald-50 font-black text-[9pt]">{expenseSheetData.grandTotal.toLocaleString()}</td>
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
                                        <th className="border-2 border-black p-2 bg-slate-50 w-[100px]" rowSpan={2}>Total Collection</th>
                                    </tr>
                                    <tr className="bg-gray-50 uppercase text-[8px] font-black">
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1">Due Coll.</th><th className="border-2 border-black p-1">Total</th><th className="border-2 border-black p-1 bg-blue-50">Upto</th>
                                        <th className="border-2 border-black p-1">Today</th><th className="border-2 border-black p-1">Due Coll.</th><th className="border-2 border-black p-1">Total</th><th className="border-2 border-black p-1 bg-emerald-50">Upto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyCollectionData.map((row, idx) => (
                                        <tr key={idx} className="h-7 hover:bg-slate-50 transition-colors print:h-[6mm]">
                                            <td className="border border-black p-1 font-['JetBrains_Mono'] font-bold">{row.date}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.today > 0 ? row.diag.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.due > 0 ? row.diag.due.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black">{row.diag.total > 0 ? row.diag.total.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-blue-50/50">{row.diag.upto !== null ? row.diag.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.today > 0 ? row.clinic.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.due > 0 ? row.clinic.due.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black">{row.clinic.total > 0 ? row.clinic.total.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-emerald-50/50">{row.clinic.upto !== null ? row.clinic.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-slate-50 italic">{(row.diag.total + row.clinic.total) > 0 ? (row.diag.total + row.clinic.total).toLocaleString() : ''}</td>
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
                                        <tr key={idx} className="h-7 hover:bg-slate-50 transition-colors print:h-[6mm]">
                                            <td className="border border-black p-1 font-['JetBrains_Mono'] font-bold">{row.date}</td>
                                            <td className="border border-black p-1 text-right">{row.diag.today > 0 ? row.diag.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-blue-50/50">{row.diag.upto !== null ? row.diag.upto.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right">{row.clinic.today > 0 ? row.clinic.today.toLocaleString() : ''}</td>
                                            <td className="border border-black p-1 text-right font-black bg-emerald-50/50">{row.clinic.upto !== null ? row.clinic.upto.toLocaleString() : ''}</td>
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
                        <main className="p-4 sm:p-6 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-['Inter'] min-h-0 print:border-2 print:border-black print:shadow-none print:m-0">
                            <div className="flex justify-between items-end mb-12 border-b-2 border-black pb-3 shrink-0">
                                <div>
                                    <h1 className="text-xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                                    <p className="text-[10px] font-bold mt-0.5">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                                </div>
                                <h3 className="text-sm font-bold underline uppercase tracking-widest bg-gray-50 px-3 py-1 border border-black font-['Hind_Siliguri']">অ্যাকাউন্টস শিট : {monthOptions[selectedMonth].name}, {selectedYear}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8 flex-1">
                                <div className="space-y-4 pl-4">
                                    <div className="bg-gray-100 text-slate-900 border-2 border-black p-1 text-center font-black text-xs font-['Hind_Siliguri'] uppercase shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]"></div>
                                        কালেকশন এর হিসাব
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">ক) ডায়াগনস্টিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={collectionTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={collectionAmtCellClass}>{summary.diagCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={collectionTableCellClass}>বকেয়া আদায়</td><td className={collectionAmtCellClass}>{summary.diagDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-50 font-black h-9"><td colSpan={2} className="p-1 text-right text-[11px]">ডায়াগনস্টিক মোট :</td><td className={collectionAmtCellClass}>{summary.totalDiag.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">খ) ক্লিনিক হইতে :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={collectionTableCellClass}>বর্তমান মাসের ক্যাশ</td><td className={collectionAmtCellClass}>{summary.clinicCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={collectionTableCellClass}>বকেয়া আদায়</td><td className={collectionAmtCellClass}>{summary.clinicDue.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 font-black h-9"><td colSpan={2} className="p-1 text-right text-[11px]">ক্লিনিক মোট :</td><td className={collectionAmtCellClass}>{summary.totalClinic.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">গ) ঔষধ হইতে (নিট মুনাফা) :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">১</td><td className={collectionTableCellClass}>মোট ঔষধ বিক্রয়</td><td className={collectionAmtCellClass}>{summary.medSalesCurrent.toLocaleString()}</td></tr>
                                                <tr className="h-9"><td className="p-1 border border-black text-center w-8">২</td><td className={collectionTableCellClass}>মোট ঔষধ ক্রয়</td><td className={`${collectionAmtCellClass} text-rose-600`}>({summary.medPurchCurrent.toLocaleString()})</td></tr>
                                                <tr className="bg-gray-100 font-black h-9"><td colSpan={2} className="p-1 text-right text-[11px]">নিট ঔষধ মুনাফা :</td><td className={collectionAmtCellClass}>{summary.totalMedNet.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-black font-['Hind_Siliguri'] underline mb-0.5">ঘ) কোম্পানি হইতে প্রাপ্তি :</div>
                                        <table className="w-full border border-black">
                                            <tbody>
                                                <tr className="bg-gray-50 font-black h-9"><td colSpan={2} className="p-1 text-right text-[11px]">কোম্পানি মোট :</td><td className={collectionAmtCellClass}>{summary.companyCurrent.toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-2 border-t-2 border-black pt-1">
                                        <table className="w-full border-2 border-black">
                                            <tbody>
                                                <tr className="bg-gray-50 h-9"><td className={collectionTableCellClass}>বাড়ী ভাড়া কর্তন</td><td className="no-print"><input type="number" value={adj.houseRent || ''} onChange={e=>updateAdjustment('houseRent', parseFloat(e.target.value)||0)} className="w-16 text-right border border-gray-400 rounded" /></td><td className={collectionAmtCellClass}>({adj.houseRent.toLocaleString()})</td></tr>
                                                <tr className="bg-blue-50/30 h-9"><td colSpan={2} className={`${collectionTableCellClass} text-blue-900 italic`}>পূর্বের জের (CF)</td><td className={`${collectionAmtCellClass} ${summary.prevJer < 0 ? 'text-rose-600' : 'text-blue-900'} underline decoration-double`}>{summary.prevJer.toLocaleString()}</td></tr>
                                                <tr className="bg-gray-100 text-slate-900 font-black h-10 border-y-[3px] border-black shadow-inner relative">
                                                    <td colSpan={2} className="p-1 text-right text-[12px] uppercase tracking-tighter relative z-10">
                                                        <span className="absolute left-1 top-1 text-[8px] opacity-20">TOTAL A</span>
                                                        মোট কালেকশন (A) =
                                                    </td>
                                                    <td className="p-1 text-right text-base font-black font-['JetBrains_Mono'] border-l-2 border-black relative z-10">{summary.grandTotalCollection.toLocaleString()}</td>
                                                </tr>
                                                
                                                <tr className="bg-rose-50/30 h-9"><td colSpan={2} className={`${collectionTableCellClass} text-rose-900`}>মোট খরচ (B)</td><td className={`${collectionAmtCellClass} text-rose-900`}>({summary.totalExpense.toLocaleString()})</td></tr>
                                                <tr className="bg-amber-50/30 h-9">
                                                    <td className={`${collectionTableCellClass} text-amber-900`}>লভ্যাংশ বন্টন</td>
                                                    <td className="no-print">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <input type="number" value={adj.profitDist || ''} onChange={e=>updateAdjustment('profitDist', parseFloat(e.target.value)||0)} className="w-24 text-right border border-amber-400 rounded font-bold" />
                                                            <button 
                                                                onClick={() => setShowSaveConfirm(true)}
                                                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm"
                                                                title="Save"
                                                            >
                                                                <SaveIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${collectionAmtCellClass} text-amber-900`}>({adj.profitDist.toLocaleString()})</td>
                                                </tr>
                                                <tr className="bg-emerald-50 text-emerald-900 font-black h-10 border-y-[3px] border-emerald-900 shadow-inner relative">
                                                    <td colSpan={2} className="p-1 text-right text-[12px] uppercase tracking-tight relative z-10">
                                                        <span className="absolute left-1 top-1 text-[8px] opacity-20 uppercase">Balance</span>
                                                        অবশিষ্ট বা জের =
                                                    </td>
                                                    <td className="p-1 text-right text-base font-black font-['JetBrains_Mono'] border-l-2 border-emerald-900 relative z-10">{summary.finalClosingJer.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="space-y-4 flex flex-col pr-4 overflow-hidden">
                                    <div className="bg-gray-100 text-slate-900 border-2 border-black p-1 text-center font-black text-xs font-['Hind_Siliguri'] uppercase shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]"></div>
                                        খরচের হিসাব
                                    </div>
                                    <table className="w-fit border-2 border-black flex-1 border-collapse">
                                        <thead><tr className="bg-gray-50"><th className="p-1 border border-black w-8 text-[11px]">ক্র.</th><th className="p-1 border border-black text-left text-[11px]">বিবরণ</th><th className="p-1 border border-black w-[100px] text-[11px]">টাকা</th></tr></thead>
                                        <tbody>
                                            {expenseMapSequence.map((item, idx) => (
                                                <tr key={item.key} className="h-6"><td className="py-0.5 px-1 border border-black text-center text-[10pt]">{idx + 1}</td><td className={`${commonTableCellClass} !text-left text-[10pt] !p-1 !h-auto`}>{item.label}</td><td className={`${commonAmtCellClass} !p-1 !h-auto text-[10pt]`}>{(summary.groupedExp[item.key] || 0).toLocaleString()}</td></tr>
                                            ))}
                                            <tr className="bg-gray-100 text-slate-900 font-black h-[30px] border-y-[3px] border-black relative">
                                                <td colSpan={2} className="p-1 text-right text-[12px] uppercase tracking-tighter relative z-10">
                                                    <span className="absolute left-1 top-1 text-[8px] opacity-20 uppercase">Total Exp</span>
                                                    মোট খরচ (B) =
                                                </td>
                                                <td className="p-1 text-right text-base font-black font-['JetBrains_Mono'] border-l-2 border-black relative z-10">{summary.totalExpense.toLocaleString()}</td>
                                            </tr>
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
                        <main className="p-4 sm:p-5 max-w-[210mm] mx-auto w-full bg-white text-black shadow-2xl flex flex-col border border-gray-300 font-['Inter'] min-h-[292mm]">
                            
                            {/* COMPACT HEADER */}
                            <div className="flex justify-between items-start mb-1 border-b-2 border-black pb-0.5 shrink-0">
                                <div className="text-left flex-1">
                                    <h1 className="text-xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-1">Niramoy Clinic & Diagnostic</h1>
                                    <h2 className="text-xs font-black underline uppercase tracking-widest font-['Hind_Siliguri']">মাসিক চূড়ান্ত রিপোর্ট (Closing Status) : {monthOptions[selectedMonth].name}, {selectedYear}</h2>
                                </div>
                                <div className="w-[250px] border border-black text-[8pt] font-bold">
                                    <div className="flex justify-between border-b border-black p-0.5"><span className="text-blue-900">সর্বমোট জমা (Total Gross Cash) :</span> <span className="border-l border-black pl-2 w-16 text-right">{summary.grandTotalCollection.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-black p-0.5"><span className="text-rose-900">সর্বমোট খরচ (Total Operating Cost) :</span> <span className="border-l border-black pl-2 w-16 text-right text-rose-600">{summary.totalExpense.toLocaleString()}</span></div>
                                    <div className="flex justify-between p-0.5 bg-gray-50"><span className="text-blue-700 font-black">Nit Balance :</span> <span className="border-l border-black pl-2 w-16 text-right font-black text-blue-700">{(summary.grandTotalCollection - summary.totalExpense).toLocaleString()}</span></div>
                                </div>
                            </div>

                            {/* MAIN TABLE (TIGHTENED FOR SINGLE PAGE) */}
                            <table className="w-full border-collapse border-2 border-black text-[8.2pt] font-['Inter']">
                                <thead>
                                    <tr className="h-6.5 print:h-[7mm]">
                                        <th className="border-2 border-black w-[75px]"></th> 
                                        <th className="border-2 border-black text-purple-700 font-black uppercase text-xs py-0.5 font-['Inter']" colSpan={3}>Collection</th>
                                        <th className="border-2 border-black text-fuchsia-700 font-black uppercase text-xs py-0.5 font-['Inter']" colSpan={3}>Expense</th>
                                        <th className="border-2 border-black text-fuchsia-600 font-black uppercase text-xs py-0.5 font-['Inter']">Balance</th>
                                    </tr>
                                    <tr className="bg-gray-100 uppercase text-[7.8pt] font-black h-6.5 print:h-[7mm]">
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
                                        <tr key={idx} className="h-[25.5px] hover:bg-slate-50 transition-colors leading-tight print:h-[6mm]">
                                            <td className="border-2 border-black text-center font-['JetBrains_Mono'] font-bold text-[7.5pt]">{row.date}</td>
                                            <td className="border-2 border-black text-center">{row.diagColl > 0 ? row.diagColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.clinicColl > 0 ? row.clinicColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black bg-slate-50">{row.totalColl > 0 ? row.totalColl.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.diagExp > 0 ? row.diagExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center">{row.clinicExp > 0 ? row.clinicExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black bg-slate-50">{row.totalExp > 0 ? row.totalExp.toLocaleString() : ''}</td>
                                            <td className="border-2 border-black text-center font-black text-slate-900 bg-gray-50">{row.balance !== null ? row.balance.toLocaleString() : ''}</td>
                                        </tr>
                                    ))}
                                    {/* Calculated padding empty rows */}
                                    {statusReportData.length < 31 && Array.from({length: 31 - statusReportData.length}).map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-[25.5px] print:h-[6mm]">
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
                                <div className="flex justify-between items-center"><span className="text-sm font-bold">Manual Installment:</span><input type="number" value={adj.loanInstallment || ''} onChange={e=>updateAdjustment('loanInstallment', parseFloat(e.target.value)||0)} className="w-32 bg-slate-800 border-none rounded p-2 text-right font-black text-amber-400" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Future Plans */}
                {activeTab === 'future_plans' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                             <h3 className="text-xl font-black text-indigo-600 mb-6 font-['Hind_Siliguri'] border-b pb-4 flex items-center gap-3"><PlusIcon size={24}/> ভবিষ্যৎ পরিকল্পনা ও লক্ষ্যমাত্রা</h3>
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

                {/* 10. Partner Management */}
                {activeTab === 'shareholder_mgmt' && (
                    <div id="section-shareholder-mgmt" className="max-w-6xl mx-auto space-y-4 animate-fade-in no-print">
                        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter font-['Hind_Siliguri']">অংশীদার ব্যবস্থাপনা (Partner List)</h3>
                            <div className="flex gap-3">
                                <button onClick={() => {
                                    setEditingShareholder(null);
                                    setIsAddPartnerModalOpen(true);
                                }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all active:scale-95 flex items-center gap-2 font-['Inter']">
                                    <PlusIcon size={14} /> নতুন অংশীদার
                                </button>
                                <button 
                                    onClick={() => handlePrintSpecific('print-shareholder-list')} 
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2 active:scale-95 font-['Inter']"
                                >
                                    <PrinterIcon size={14} />
                                    <span className="text-[11px] font-black uppercase">Print List</span>
                                </button>
                            </div>
                        </div>

                        {/* Search & Stats - Compact one line */}
                        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                            <div className="flex-1 flex items-center justify-center gap-2 bg-blue-50 py-2 px-3 rounded-xl border border-blue-100">
                                <p className="text-base font-bold text-blue-600 uppercase tracking-tight">মোট অংশীদার:</p>
                                <p className="text-base font-black text-blue-700">{dynamicShareholders.filter(s => !s.isDeleted).length} জন</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-100">
                                <p className="text-base font-bold text-emerald-600 uppercase tracking-tight">মোট শেয়ার:</p>
                                <p className="text-base font-black text-emerald-700">{dynamicShareholders.filter(s => !s.isDeleted).reduce((sum, s) => sum + s.shares, 0).toLocaleString()} টি</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-2 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200">
                                <p className="text-base font-bold text-slate-600 uppercase tracking-tight">সক্রিয় পিরিয়ড:</p>
                                <p className="text-base font-black text-slate-800">{monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>
                        </div>

                        {/* Partner Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xl bg-white">
                            <div id="print-shareholder-list" className="bg-white">
                                <div className="hidden print:block mb-9 border-b-2 border-black pb-5 text-center">
                                    <h1 className="text-2xl font-black uppercase text-blue-900 mb-2">Niramoy Clinic & Diagnostic</h1>
                                    <p className="text-xs font-bold uppercase text-slate-600 mb-3">Partner List Summary - {monthOptions[selectedMonth].name} {selectedYear}</p>
                                    <div className="flex justify-center gap-10 text-[10px] font-black">
                                        <span>Total Partners: {dynamicShareholders.filter(s => !s.isDeleted).length}</span>
                                        <span>Total Shares: {dynamicShareholders.filter(s => !s.isDeleted).reduce((sum, s) => sum + s.shares, 0)}</span>
                                    </div>
                                </div>
                                
                                <table className="print-table w-full text-left border-collapse border-slate-200 table-fixed border">
                                    <thead className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="p-3 border border-slate-700 text-center w-24 text-base">SL</th>
                                            <th className="p-3 border border-slate-700 text-base w-[400px]">নাম (Name)</th>
                                            <th className="p-3 border border-slate-700 text-base text-center w-40">শেয়ার ({dynamicShareholders.filter(s => !s.isDeleted).reduce((sum, s) => sum + s.shares, 0)})</th>
                                            <th className="p-3 border border-slate-700 text-base w-[230px]">বিবরণ (কথায়)</th>
                                            <th className="p-3 border border-slate-700 text-base w-40 hidden print:table-cell">স্বাক্ষর (Signature)</th>
                                            <th className="p-3 border border-slate-700 print:hidden text-center w-72 text-base">অ্যাকশন</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-['Hind_Siliguri']">
                                        {dynamicShareholders
                                            .filter(s => !s.isDeleted)
                                            .filter(s => {
                                                // Simplified month filtering: if joinDate is present, only show if joinDate <= current month
                                                if (!s.joinDate) return true;
                                                const join = new Date(s.joinDate);
                                                const current = new Date(selectedYear, selectedMonth + 1, 0);
                                                return join <= current;
                                            })
                                            .map((s, i) => (
                                            <tr key={s.id} className="hover:bg-blue-50/50 transition-colors h-14 group">
                                                <td className="p-1 px-3 border border-slate-300 text-center font-bold text-slate-700 text-lg">{i+1}</td>
                                                <td className="p-1 px-3 border border-slate-300 group-hover:pl-4 transition-all pr-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 uppercase text-lg leading-tight">{s.name}</span>
                                                        <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0">
                                                            <span>Phone: {s.phone || 'N/A'}</span>
                                                            <span className="h-2 w-px bg-slate-200"></span>
                                                            <span>Joined: {s.joinDate || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-1 border border-slate-300 text-center">
                                                    <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-md font-black text-lg shadow-sm">{s.shares}</span>
                                                </td>
                                                <td className="p-1 px-3 border border-slate-300 text-slate-700 font-bold text-lg">{s.description}</td>
                                                <td className="p-1 border border-slate-300 hidden print:table-cell"></td>
                                                <td className="p-1 border border-slate-300 text-center print:hidden">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingShareholder(s);
                                                                setIsAddPartnerModalOpen(true);
                                                            }} 
                                                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                                            title="Edit"
                                                        >
                                                            <EditIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-300"></div>
                                                        <button 
                                                            onClick={() => handleDeletePartner(s.id)} 
                                                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200">
                                        <tr className="h-10">
                                            <td className="p-2 border border-slate-200 text-center text-sm">{dynamicShareholders.filter(s => !s.isDeleted).length}</td>
                                            <td className="p-2 border border-slate-200 text-right text-xs uppercase text-slate-500">Total Shares Summary:</td>
                                            <td className="p-2 border border-slate-200 text-center text-blue-700 text-lg bg-blue-50/50">
                                                {dynamicShareholders.filter(s => !s.isDeleted).reduce((sum, s) => sum + s.shares, 0)}
                                            </td>
                                            <td className="p-2 border border-slate-200" colSpan={3}></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Print version footer */}
                                <div className="hidden print:flex justify-between mt-20 px-10 text-[10px] uppercase font-black">
                                    <div className="text-center w-40 border-t border-black pt-2">Authorized Signature</div>
                                    <div className="text-center w-40 border-t border-black pt-2">Date: {new Date().toLocaleDateString()}</div>
                                    <div className="text-center w-40 border-t border-black pt-2">Managing Director</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Logs Section */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl no-print">
                            <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                                <Activity className="w-4 h-4 text-blue-500" /> সাম্প্রতিক পরিবর্তন লগ (Recent Activity)
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {shareholderLogs.length === 0 ? (
                                    <p className="text-center text-xs text-slate-400 py-10 font-bold uppercase italic">No recent activity recorded.</p>
                                ) : (
                                    shareholderLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${log.action === 'ADD' ? 'bg-emerald-50 text-emerald-600' : log.action === 'UPDATE' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {log.action === 'ADD' ? <PlusIcon size={14}/> : log.action === 'UPDATE' ? <EditIcon size={14}/> : <TrashIcon size={14}/>}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{log.details}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-500 uppercase tracking-tighter">ID: {log.shareholderId}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Partner Modal */}
                {isAddPartnerModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fade-in-up">
                            <div className="p-8 bg-slate-800 text-white relative">
                                <h3 className="text-2xl font-black uppercase tracking-tighter font-['Hind_Siliguri'] flex items-center gap-3">
                                    {editingShareholder ? <EditIcon className="w-7 h-7 text-indigo-400"/> : <PlusIcon className="w-7 h-7 text-emerald-400"/>}
                                    {editingShareholder ? 'অংশীদার তথ্য পরিবর্তন' : 'নতুন অংশীদার যুক্ত করুন'}
                                </h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Please fill out all required information</p>
                                <button type="button" onClick={() => setIsAddPartnerModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><XIcon size={24}/></button>
                            </div>
                            
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleAddOrUpdatePartner({
                                    name: formData.get('name') as string,
                                    shares: parseFloat(formData.get('shares') as string),
                                    description: formData.get('description') as string,
                                    address: formData.get('address') as string,
                                    phone: formData.get('phone') as string,
                                    joinDate: formData.get('joinDate') as string,
                                });
                            }} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">পূর্ণ নাম (Full Name)*</label>
                                        <input 
                                            name="name" 
                                            required 
                                            defaultValue={editingShareholder?.name || ''} 
                                            placeholder="অংশীদারের পুরো নাম লিখুন..." 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">শেয়ার সংখ্যা (Shares Ratio)*</label>
                                        <input 
                                            name="shares" 
                                            type="number" 
                                            step="0.01" 
                                            required 
                                            defaultValue={editingShareholder?.shares || ''} 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">মোবাইল নাম্বার (Phone)</label>
                                        <input 
                                            name="phone" 
                                            type="tel" 
                                            defaultValue={editingShareholder?.phone || ''} 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">ঠিকানা (Address)</label>
                                        <input 
                                            name="address" 
                                            defaultValue={editingShareholder?.address || ''} 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">যোগদানের তারিখ (Join Date)</label>
                                        <input 
                                            name="joinDate" 
                                            type="date" 
                                            defaultValue={editingShareholder?.joinDate || new Date().toISOString().split('T')[0]} 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black font-mono text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-500 uppercase ml-2 mb-1 block">বিবরণ (Description)</label>
                                        <input 
                                            name="description" 
                                            defaultValue={editingShareholder?.description || ''} 
                                            className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 mt-8">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddPartnerModalOpen(false)} 
                                        className="flex-1 py-4 text-slate-500 font-black uppercase text-sm hover:bg-slate-100 rounded-2xl transition-all"
                                    >
                                        বাতিল (Cancel)
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`flex-1 py-4 ${editingShareholder ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black uppercase text-sm rounded-2xl shadow-xl transition-all active:scale-95`}
                                    >
                                        {editingShareholder ? 'পরিবর্তন সেভ করুন' : 'অংশীদার সেভ করুন'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* RESTORED & PERSISTED: Company Collection */}
                {activeTab === 'company_collection' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200">
                             <h3 className="text-xl font-black text-cyan-600 mb-6 font-['Hind_Siliguri'] border-b pb-4 flex items-center gap-3"><ClinicIcon className="w-6 h-6" /> কোম্পানি কালেকশন ডাটা এন্ট্রি</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">কোম্পানি</label><input value={newCompanyEntry.companyName} onChange={e=>setNewCompanyEntry({...newCompanyEntry, companyName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold" placeholder="কোম্পানির নাম..."/></div>
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">টাকার পরিমাণ (৳)</label><input type="number" value={newCompanyEntry.amount} onChange={e=>setNewCompanyEntry({...newCompanyEntry, amount: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" /></div>
                                 <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">তারিখ</label><input type="date" value={newCompanyEntry.date} onChange={e=>setNewCompanyEntry({...newCompanyEntry, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black" /></div>
                             </div>
                             <button onClick={addCompanyCollection} className="mt-6 w-full py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl transition-all">কালেকশন সেভ করুন</button>
                        </div>
                    </div>
                )}

                {/* 6. Profit Share (RESTORED) */}
                {activeTab === 'shareholders' && (
                    <div id="section-profit-share" className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 relative">
                            <button onClick={() => handlePrintSpecific('section-profit-share')} className="no-print absolute top-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-all"><PrinterIcon size={20}/></button>
                            <div className="text-center mb-8 border-b pb-6 print:mb-8 print:pb-2">
                                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none mb-2 print:text-2xl">Niramoy Clinic & Diagnostic</h1>
                                <h2 className="text-xl font-black text-slate-700 font-['Hind_Siliguri'] print:text-base">অংশীদারদের লভ্যাংশ বন্টন রিপোর্ট</h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 print:text-xs print:mt-1">{monthOptions[selectedMonth].name} {selectedYear}</p>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-8 print:gap-1 print:mb-8 print:mt-0">
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 text-center print:bg-white print:rounded-none print:border-black print:p-1 print:flex print:items-center print:justify-between print:px-3">
                                    <p className="text-[13px] font-black text-slate-500 uppercase mb-1 font-['Hind_Siliguri'] print:text-[8pt] print:mb-0 print:text-black">মোট নিট মুনাফা</p>
                                    <p className="text-2xl font-black text-slate-800 print:text-[10pt]">{adj.profitDist.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 text-center print:bg-white print:rounded-none print:border-black print:p-1 print:flex print:items-center print:justify-between print:px-3">
                                    <p className="text-[13px] font-black text-blue-500 uppercase mb-1 font-['Hind_Siliguri'] print:text-[8pt] print:mb-0 print:text-black">বন্টনযোগ্য লভ্যাংশ</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg font-black text-blue-900 no-print invisible">৳</span>
                                        <input type="number" value={adj.profitDist || ''} onChange={e=>updateAdjustment('profitDist', parseFloat(e.target.value)||0)} className="w-24 bg-transparent border-b-2 border-blue-300 text-center text-2xl font-black text-blue-900 outline-none no-print" />
                                        <button 
                                            onClick={() => setShowSaveConfirm(true)}
                                            className="no-print p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                                            title="Save"
                                        >
                                            <SaveIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-2xl font-black text-blue-900 print:inline-block hidden print:text-[10pt]">{adj.profitDist.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-center print:bg-white print:rounded-none print:border-black print:p-1 print:flex print:items-center print:justify-between print:px-3">
                                    <p className="text-[13px] font-black text-indigo-500 uppercase mb-1 font-['Hind_Siliguri'] print:text-[8pt] print:mb-0 print:text-black">মোট শেয়ার সংখ্যা</p>
                                    <p className="text-2xl font-black text-indigo-900 print:text-[10pt]">{summary.totalShares}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-center print:bg-white print:rounded-none print:border-black print:p-1 print:flex print:items-center print:justify-between print:px-3">
                                    <p className="text-[13px] font-black text-emerald-500 uppercase mb-1 font-['Hind_Siliguri'] print:text-[8pt] print:mb-0 print:text-black">প্রতি শেয়ারে লভ্যাংশ</p>
                                    <p className="text-2xl font-black text-emerald-900 print:text-[10pt]">{summary.profitPerShare.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-xl bg-white print:border-black print:rounded-none">
                                <table className="w-full text-left border-collapse print:border-black border-x border-slate-200">
                                    <thead className="bg-slate-800 text-white font-black uppercase text-[11px] tracking-widest print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="p-4 w-12 text-center border-b border-r border-slate-700/30 print:border-black print:w-16 print:p-1.5">SL</th>
                                            <th className="p-4 border-b border-r border-slate-700/30 print:border-black print:p-1.5 print:px-3">অংশীদারের নাম</th>
                                            <th className="p-4 text-center border-b border-r border-slate-700/30 print:border-black print:p-1.5">শেয়ার</th>
                                            <th className="p-4 text-right border-b border-r border-slate-700/30 print:border-black print:p-1.5 print:px-3">লভ্যাংশ (৳)</th>
                                            <th className="p-4 text-center border-b print:border-black w-32 print:p-1.5">সিগনেচার</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 print:divide-black">
                                        {dynamicShareholders.filter(s => !s.isDeleted).map((s, i) => (
                                            <tr key={s.id} className="hover:bg-blue-50 transition-colors h-12 print:h-9">
                                                <td className="p-4 text-center font-bold text-slate-400 border-b border-r border-slate-100 print:border-black print:text-black print:p-1 text-xs">{i+1}</td>
                                                <td className="p-4 font-black text-slate-800 uppercase font-['Hind_Siliguri'] border-b border-r border-slate-100 print:border-black print:p-1 print:px-3 text-sm">{s.name}</td>
                                                <td className="p-4 text-center font-black text-blue-600 border-b border-r border-slate-100 print:border-black print:p-1 text-sm">{s.shares}</td>
                                                <td className="p-4 text-right font-black text-emerald-600 border-b border-r border-slate-100 print:border-black print:p-1 print:px-3 text-sm">{(s.shares * summary.profitPerShare).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td className="p-4 border-b print:border-black print:p-1"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200 print:border-black">
                                        <tr className="h-12 print:h-9">
                                            <td colSpan={2} className="p-4 text-right uppercase text-slate-500 border-r border-slate-200 print:border-black print:text-black font-['Hind_Siliguri'] print:p-1 print:px-3 text-sm">সর্বমোট বন্টন:</td>
                                            <td className="p-4 text-center text-blue-900 border-r border-slate-200 print:border-black print:text-black print:p-1 text-sm">{summary.totalShares}</td>
                                            <td className="p-4 text-right text-emerald-700 text-lg border-r border-slate-200 print:border-black print:text-black print:p-1 print:px-3 text-sm">{adj.profitDist.toLocaleString()}</td>
                                            <td className="p-4 print:p-1"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            <div className="mt-12 pt-8 flex justify-between px-10 text-slate-400 font-black uppercase text-[10px] tracking-widest print:mt-12 print:pt-4 print:text-black">
                                <div className="text-center w-48 border-t border-slate-200 pt-2">Accountant Signature</div>
                                <div className="text-center w-48 border-t border-slate-200 pt-2">Managing Director</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Confirmation Modal */}
            {showSaveConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] no-print p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-200 animate-fade-in-up">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <SaveIcon size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2 font-['Hind_Siliguri']">সেভ নিশ্চিত করুন</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">আপনি কি এই ডাটা সেভ করতে চান?</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowSaveConfirm(false)} 
                                className="flex-1 py-3 text-slate-500 font-black uppercase text-xs hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                না
                            </button>
                            <button 
                                onClick={() => {
                                    setShowSaveConfirm(false);
                                    setSaveSuccess(true);
                                    setTimeout(() => setSaveSuccess(false), 3000);
                                }} 
                                className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase text-xs rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                            >
                                হ্যাঁ, সেভ করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {saveSuccess && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[1001] flex items-center gap-3 animate-fade-in-up border border-slate-700">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <SaveIcon size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm font-['Hind_Siliguri']">সফলভাবে সেভ হয়েছে!</span>
                </div>
            )}
        </div>
    );
};

export default ConsolidatedAccountsPage;
