
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ExpenseItem, Employee, DueCollection } from '../DiagnosticData';
import { IndoorInvoice } from '../ClinicPage';
import { ClinicIcon, Activity, BackIcon, FileTextIcon, PrinterIcon, SearchIcon } from '../Icons';

// --- Clinic Specific Categories ---
const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Instruments/Repair', 'Electric bill', 'Electrical & Electronics', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

const expenseCategoryBanglaMap: Record<string, string> = {
    'Stuff salary': 'স্টাফ স্যালারী', 'Generator': 'জেনারেটর', 'Motorcycle': 'মোটর সাইকেল',
    'Marketing': 'মার্কেটিং', 'Clinic development': 'ক্লিনিক উন্নয়ন',
    'House rent': 'বাড়ী ভাড়া',
    'Stationery': 'স্টেশনারী', 'Food/Refreshment': 'আপ্যায়ন/খাবার', 'Doctor donation': 'ডাক্তার ডোনেশন',
    'Instruments/Repair': 'ইন্সট্রুমেন্ট বাই / রিপায়ার', 'Electric bill': 'বিদ্যুৎ বিল', 'Electrical & Electronics': 'ইলেকট্রিক্যাল এন্ড ইলেকট্রনিক্স', 'Press': 'প্রেস/ছাপা খরচ', 'License/Official': 'লাইসেন্স/অফিসিয়াল',
    'Bank/NGO Installment': 'ব্যাংক/এনজিও কিস্তি', 'Mobile': 'মোবাইল খরচ', 'Interest/Loan': 'কিস্তি/সুদ',
    'Others': 'অন্যান্য', 'Old Loan Repay': 'পূর্বের ঋণ পরিশোধ'
};

const expenseSubCategoryMap: Record<string, string[]> = {
    'Stuff salary': [], // Populated from employees
    'House rent': ['Main Building', 'Annex Building', 'Staff Quarter'],
    'Marketing': ['Social Media', 'Newspaper', 'Local Campaign', 'Doctor Referral'],
    'Generator': ['Fuel', 'Maintenance', 'Repair'],
    'Motorcycle': ['Fuel', 'Maintenance', 'Repair'],
    'Clinic development': ['Construction', 'Interior', 'Equipment'],
    'Stationery': ['Office', 'Medical', 'Printing'],
    'Food/Refreshment': ['Staff Food', 'Guest Refreshment', 'Patient Food'],
    'Doctor donation': ['Regular', 'Special Event'],
    'Instruments/Repair': ['Medical Equipment', 'Electrical', 'Plumbing'],
    'Electric bill': ['Current Month Bill', 'Arrears'],
    'Electrical & Electronics': ['Bulb', 'Fan', 'Switch', 'AC', 'Wiring'],
    'Press': ['Leaflet', 'Poster', 'Banner'],
    'License/Official': ['Trade License', 'Health License', 'Tax'],
    'Bank/NGO Installment': ['Bank Loan', 'NGO Loan'],
    'Mobile': ['Bill', 'Recharge'],
    'Interest/Loan': ['Bank Interest', 'Private Loan Interest'],
    'Old Loan Repay': ['Bank', 'Private'],
    'Others': ['Misc']
};

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const HistoryModal: React.FC<{ item: ExpenseItem, onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h3 className="font-black text-emerald-400 uppercase text-sm">Edit History: {item.category}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                {(!item.editHistory || item.editHistory.length === 0) ? (
                    <p className="text-center text-slate-500 italic py-8">No edit history found.</p>
                ) : (
                    item.editHistory.map((log, i) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase">
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                <span className="text-emerald-500">{log.field}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[9px] text-slate-500 uppercase">Old Value</p><p className="text-rose-400 font-bold">{String(log.oldValue)}</p></div>
                                <div><p className="text-[9px] text-slate-500 uppercase">New Value</p><p className="text-emerald-400 font-bold">{String(log.newValue)}</p></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 text-right">
                <button onClick={onClose} className="bg-slate-700 px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-slate-600">Close</button>
            </div>
        </div>
    </div>
);

const DailyExpenseForm: React.FC<any> = ({ selectedDate, onDateChange, items: initialItems, onSave, onPrint, employees }) => {
    const [items, setItems] = useState<ExpenseItem[]>([]);
    const [historyItem, setHistoryItem] = useState<ExpenseItem | null>(null);
    const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>(() => {
        const saved = localStorage.getItem('clinic_custom_subcategories');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('clinic_custom_subcategories', JSON.stringify(customSubCategories));
    }, [customSubCategories]);

    const [prevInitialItems, setPrevInitialItems] = useState(initialItems);

    if (initialItems !== prevInitialItems) {
        setPrevInitialItems(initialItems);
        setItems(initialItems.length > 0 ? initialItems : [{ id: 1, category: clinicExpenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0, dept: 'Clinic' }]);
    }
    
    const handleItemChange = (id: number, field: keyof ExpenseItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const oldValue = item[field];
                if (oldValue === value) return item;

                const history = item.editHistory || [];
                const newLog = {
                    timestamp: new Date().toISOString(),
                    field,
                    oldValue,
                    newValue: value
                };

                return { 
                    ...item, 
                    [field]: value, 
                    isEdited: true, 
                    lastEditedAt: new Date().toISOString(),
                    editHistory: [...history, newLog]
                };
            }
            return item;
        }));
    };
    const handleDeleteItem = (id: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const history = item.editHistory || [];
                const newLog = {
                    timestamp: new Date().toISOString(),
                    field: 'DELETED',
                    oldValue: 'Active',
                    newValue: 'Deleted'
                };
                return { ...item, isDeleted: true, editHistory: [...history, newLog] };
            }
            return item;
        }));
    };

    const totals = items.filter(i => !i.isDeleted).reduce((acc, item) => { acc.cost += Number(item.billAmount) || 0; acc.paid += Number(item.paidAmount) || 0; return acc; }, { cost: 0, paid: 0 });
    const inputClass = "w-full bg-slate-700 border border-slate-600 rounded p-1.5 text-white text-sm outline-none";

    const subCategories = useMemo(() => {
        const map = { ...expenseSubCategoryMap };
        Object.keys(customSubCategories).forEach(cat => {
            if (map[cat]) {
                map[cat] = [...new Set([...map[cat], ...customSubCategories[cat]])];
            } else {
                map[cat] = customSubCategories[cat];
            }
        });
        map['Stuff salary'] = (Array.isArray(employees) ? employees : []).map((e: any) => e?.name || e?.emp_name || 'Unknown');
        return map;
    }, [employees, customSubCategories]);

    const addSubCategory = (category: string) => {
        const newSub = prompt(`নতুন সাব-ক্যাটাগরি লিখুন (${expenseCategoryBanglaMap[category] || category}):`);
        if (newSub && newSub.trim()) {
            setCustomSubCategories(prev => ({
                ...prev,
                [category]: [...(prev[category] || []), newSub.trim()]
            }));
        }
    };

    const deleteSubCategory = (category: string, sub: string) => {
        if (!window.confirm(`আপনি কি "${sub}" সাব-ক্যাটাগরি মুছে ফেলতে চান?`)) return;
        setCustomSubCategories(prev => {
            const updated = { ...prev };
            if (updated[category]) {
                updated[category] = updated[category].filter(s => s !== sub);
            }
            return updated;
        });
    };

    return (
        <div className="bg-emerald-950/40 rounded-xl p-6 border border-emerald-800/50 shadow-xl no-print">
            {historyItem && <HistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}
            <div className="flex justify-between items-center mb-6 border-b border-emerald-800/50 pb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-emerald-100 flex items-center gap-2"><Activity className="w-5 h-5" /> Clinic Daily Expense</h3>
                    <button onClick={onPrint} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"><PrinterIcon size={14}/> Print Daily Ledger</button>
                </div>
                <input type="date" value={selectedDate} onChange={e => onDateChange(e.target.value)} className="bg-slate-800 border border-slate-700 rounded p-2 text-white" />
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-emerald-400 uppercase tracking-widest"><th className="pb-3">Category</th><th className="pb-3">Sub-Category</th><th className="pb-3">Details</th><th className="pb-3 text-right">Bill</th><th className="pb-3 text-right">Paid</th><th className="pb-3 text-center">History</th><th className="pb-3 text-center">X</th></tr></thead><tbody>{items.filter(i => !i.isDeleted).map(item => (<tr key={item.id} className="border-t border-emerald-900/30"><td className="py-2 pr-2"><select value={item.category} onChange={e => { handleItemChange(item.id, 'category', e.target.value); handleItemChange(item.id, 'subCategory', ''); }} className={inputClass}>{clinicExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></td><td className="py-2 pr-2">
    <div className="flex items-center gap-1 group">
        {(subCategories[item.category] && subCategories[item.category].length > 0) ? (
            <div className="relative flex-1">
                <select 
                    value={item.subCategory} 
                    onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                    className={inputClass}
                >
                    <option value="">Select...</option>
                    {subCategories[item.category].map(sc => (
                        <option key={sc} value={sc}>{sc}</option>
                    ))}
                </select>
                {item.subCategory && customSubCategories[item.category]?.includes(item.subCategory) && (
                    <button 
                        type="button"
                        onClick={() => deleteSubCategory(item.category, item.subCategory)}
                        className="absolute -right-1 -top-1 bg-red-600 border border-white text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                        title="Delete this sub-category"
                    >
                        ×
                    </button>
                )}
            </div>
        ) : (
            <input value={item.subCategory} onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} className={inputClass} placeholder="Sub-category..."/>
        )}
        <button 
            type="button"
            onClick={() => addSubCategory(item.category)} 
            className="p-1 px-2.5 bg-emerald-700/50 hover:bg-emerald-600 rounded text-emerald-100 text-sm font-bold transition-colors shadow-lg border border-emerald-600/50"
            title="Add New Sub-category"
        >
            +
        </button>
    </div>
</td>
<td className="py-2 pr-2"><input value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={inputClass} placeholder="Details..."/></td><td className="py-2 pr-2"><input type="number" value={item.billAmount} onChange={e => handleItemChange(item.id, 'billAmount', parseFloat(e.target.value) || 0)} className={`${inputClass} text-right`} /></td><td className="py-2 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className={`${inputClass} text-right`} /></td><td className="py-2 text-center"><button onClick={() => setHistoryItem(item)} className={`text-[10px] font-black uppercase px-2 py-1 rounded ${item.isEdited ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}>History</button></td><td className="py-2 text-center"><button onClick={() => handleDeleteItem(item.id)} className="text-red-400 font-bold">×</button></td></tr>))}</tbody></table></div>
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => setItems([...items, { id: Date.now(), category: clinicExpenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0, dept: 'Clinic' }])} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500">+ Add</button>
                <div className="flex gap-6 items-center"><div className="text-slate-400">Total Paid: <span className="text-emerald-400 font-bold text-lg">{totals.paid.toLocaleString()}</span></div><button onClick={() => onSave(selectedDate, items)} className="bg-green-600 text-white px-8 py-2 rounded font-black shadow-lg hover:bg-green-500">SAVE DATA</button></div>
            </div>
        </div>
    );
};

const ClinicAccountsPage: React.FC<any> = ({ 
  onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses 
}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<'detailed' | 'summary' | 'collection' | 'daily_summary' | 'monthly_expense'>('detailed');
    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) {
            setSelectedMonth(dateObj.getMonth());
            setSelectedYear(dateObj.getFullYear());
            if (viewMode === 'detailed') {
                setExpDateSearch(newDate);
            }
        }
    };

    const [isTodayFilter, setIsTodayFilter] = useState(false);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceDateSearch, setInvoiceDateSearch] = useState('');
    const [invoiceMonthSearch, setInvoiceMonthSearch] = useState<number | ''>('');
    const [invoiceYearSearch, setInvoiceYearSearch] = useState<number | ''>('');

    const [expSearch, setExpSearch] = useState('');
    const [expDateSearch, setExpDateSearch] = useState(selectedDate);
    const [expMonthSearch, setExpMonthSearch] = useState<number | ''>('');
    const [expYearSearch, setExpYearSearch] = useState<number | ''>('');
    const [expCategorySearch, setExpCategorySearch] = useState('');
    const [ledgerHistoryItem, setLedgerHistoryItem] = useState<ExpenseItem | null>(null);

    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { if(successMsg) setTimeout(() => setSuccessMsg(''), 3000); }, [successMsg]);

    const handleSave = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => {
            const safePrev = prev || {};
            const existingItems = safePrev[date] || [];
            // Keep Diagnostic items, replace Clinic items
            const otherDeptItems = existingItems.filter((it: any) => it.dept !== 'Clinic');
            const clinicItems = (items || []).map(it => ({ ...it, dept: 'Clinic' as const, date: date }));
            const newState = { ...safePrev, [date]: [...otherDeptItems, ...clinicItems] };
            
            return newState;
        });
        setSuccessMsg("Clinic Expense Saved! Syncing to cloud...");
    };

    const handleLedgerDelete = (date: string, itemId: number) => {
        if (!window.confirm("Are you sure you want to delete this expense entry? It will be logged and removed from totals.")) return;

        setDetailedExpenses((prev: any) => {
            const safePrev = prev || {};
            const dateItems = safePrev[date] || [];
            const updatedItems = dateItems.map((it: any) => {
                if (it.id === itemId) {
                    const history = it.editHistory || [];
                    const newLog = {
                        timestamp: new Date().toISOString(),
                        field: 'DELETED',
                        oldValue: 'Active',
                        newValue: 'Deleted'
                    };
                    return { 
                        ...it, 
                        isDeleted: true, 
                        deletedAt: new Date().toISOString(),
                        editHistory: [...history, newLog]
                    };
                }
                return it;
            });
            return { ...prev, [date]: updatedItems };
        });
        setSuccessMsg("Expense Entry Deleted (Logged)");
    };

    // --- Helper function for keyword matching ---
    const matchesKeyword = (source: string, words: string[]) => {
        if(!source) return false;
        const lower = source.toLowerCase();
        return words.some(w => lower.includes(w.toLowerCase()));
    };

    // --- Core logic to categorize an invoice (Mapping Category Breakdown) ---
    const categorizeInvoiceData = React.useCallback((inv: any) => {
        if (!inv || inv.status === 'Cancelled' || inv.status === 'Returned') {
            return { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs_ot: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, pcAmount: 0, clinicNet: 0 };
        }

        const items = Array.isArray(inv.items) ? inv.items : [];
        const incomeItems = items.filter((it: any) => it && it.isClinicFund === true);
        const totalRevenue = incomeItems.reduce((s, it) => s + it.payable_amount, 0);
        const pcAmount = (inv.special_commission || 0) + (inv.commission_paid || 0);
        const clinicNet = totalRevenue - (inv.special_discount_amount || 0) - pcAmount;

        // Ratio to distribute deductions (commission + discount) proportionally across categories
        const ratio = totalRevenue > 0 ? clinicNet / totalRevenue : 0;

        let admFee = 0, oxygen = 0, dressing = 0, conservative = 0, nvd = 0, dc = 0, lscs_ot = 0, gb_ot = 0, others_ot = 0, others = 0;

        incomeItems.forEach((it: any) => {
            const typeLower = (it.service_type || '').toLowerCase();
            const amt = it.payable_amount * ratio;
            const subCat = (inv.subCategory || '').toUpperCase();
            const mainCat = inv.serviceCategory;

            // Rule 1: Key Item Keywords (Admission, O2, Dressing)
            if (matchesKeyword(typeLower, ['admission fee', 'ভর্তি ফি'])) {
                admFee += amt;
            } else if (matchesKeyword(typeLower, ['oxygen', 'o2', 'nebulizer', 'nebulization'])) {
                oxygen += amt;
            } else if (matchesKeyword(typeLower, ['dressing'])) {
                dressing += amt;
            } 
            // Rule 2: Priority Sub-Category Logic
            else if (subCat === 'LSCS_OT') {
                lscs_ot += amt;
            } else if (subCat === 'GB_OT') {
                gb_ot += amt;
            } else if (subCat === 'NVD') {
                nvd += amt;
            } else if (subCat === 'D&C') {
                dc += amt;
            } 
            // Rule 3: Category Logic
            else if (mainCat === 'Operation') {
                others_ot += amt;
            } else if (mainCat === 'Conservative treatment') {
                conservative += amt;
            } 
            // Rule 4: Others (Misc)
            else {
                others += amt;
            }
        });

        return { admFee, oxygen, conservative, nvd, dc, lscs_ot, gb_ot, others_ot, dressing, others, pcAmount, clinicNet };
    }, []);

    const summaryData = useMemo(() => {
        const safeInvoices = Array.isArray(invoices) ? invoices : [];
        const monthInvoices = safeInvoices.filter((inv:any) => {
            if (!inv) return false;
            const dateToUse = inv.invoice_date || inv.admission_date;
            if (!dateToUse || typeof dateToUse !== 'string') return false;
            const parts = dateToUse.split('-');
            if (parts.length < 2) return false;
            const [y, m] = parts.map(Number);
            return (m - 1) === selectedMonth && y === selectedYear;
        });
        
        const safeDueCollections = Array.isArray(dueCollections) ? dueCollections : [];
        const monthDueRecov = safeDueCollections.filter((dc:any) => {
            if (!dc) return false;
            const isClinic = dc.invoice_id && !dc.invoice_id.startsWith('INV-');
            if (!dc.collection_date) return false;
            const parts = dc.collection_date.split('-');
            if (parts.length < 2) return false;
            const [y, m] = parts.map(Number);
            return (m - 1) === selectedMonth && y === selectedYear && isClinic;
        }).reduce((sum:any, dc:any) => sum + (dc.amount_collected || 0), 0);

        const collectionByCategory = monthInvoices.reduce((acc, inv) => {
            const catData = categorizeInvoiceData(inv);
            acc.admFee += catData.admFee;
            acc.oxygen += catData.oxygen;
            acc.conservative += catData.conservative;
            acc.nvd += catData.nvd;
            acc.dc += catData.dc;
            acc.lscs_ot += catData.lscs_ot;
            acc.gb_ot += catData.gb_ot;
            acc.others_ot += catData.others_ot;
            acc.dressing += catData.dressing;
            acc.others += catData.others;
            acc.totalPC += catData.pcAmount;
            return acc;
        }, { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs_ot: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, totalPC: 0 });

        const totalClinicNetOnly = monthInvoices.reduce((sum:any, inv:any) => {
            if (inv.status === 'Cancelled' || inv.status === 'Returned') return sum;
            const catData = categorizeInvoiceData(inv);
            return sum + catData.clinicNet;
        }, 0);

        const totalCollectionIncludingDue = totalClinicNetOnly + monthDueRecov;

        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        Object.entries(detailedExpenses || {}).forEach(([date, items]:any) => {
            const parts = (date || '').split('-');
            if (parts.length < 2) return;
            const [y, m] = parts.map(Number);
            if(m - 1 === selectedMonth && y === selectedYear) {
                (Array.isArray(items) ? items : []).forEach((it:any) => {
                    if (it && !it.isDeleted && (it.dept === 'Clinic' || (!it.dept && clinicExpenseCategories.includes(it.category)))) {
                        expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + (it.paidAmount || 0);
                    }
                });
            }
        });
        const totalExpense = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
        return { totalCollection: totalCollectionIncludingDue, collectionByCategory, monthDueRecov, expensesByCategory, totalExpense, balance: totalCollectionIncludingDue - totalExpense };
    }, [selectedMonth, selectedYear, invoices, dueCollections, detailedExpenses, categorizeInvoiceData]);

    const clinicExpenseJournalData = useMemo(() => {
        const allClinicExpenses: any[] = [];
        Object.entries(detailedExpenses || {}).forEach(([date, items]: any) => {
            (Array.isArray(items) ? items : []).forEach((it: any) => {
                if (it && !it.isDeleted && (it.dept === 'Clinic' || (!it.dept && clinicExpenseCategories.includes(it.category)))) {
                    allClinicExpenses.push({ ...it, date });
                }
            });
        });

        const filtered = allClinicExpenses.filter(ex => {
            if (!ex || !ex.date) return false;
            const matchesSearch = !expSearch || (ex.description || '').toLowerCase().includes(expSearch.toLowerCase()) || (ex.subCategory || '').toLowerCase().includes(expSearch.toLowerCase());
            const matchesDate = !expDateSearch || ex.date === expDateSearch;
            const parts = ex.date.split('-');
            if (parts.length < 2) return false;
            const [y, m] = parts.map(Number);
            const matchesMonth = expMonthSearch === '' || (m - 1) === expMonthSearch;
            const matchesYear = expYearSearch === '' || y === expYearSearch;
            const matchesCategory = !expCategorySearch || ex.category === expCategorySearch;
            return matchesSearch && matchesDate && matchesMonth && matchesYear && matchesCategory;
        }).sort((a, b) => b.date.localeCompare(a.date));

        const totalPaid = filtered.filter(ex => !ex.isDeleted).reduce((s, ex) => s + ex.paidAmount, 0);
        const totalBill = filtered.filter(ex => !ex.isDeleted).reduce((s, ex) => s + ex.billAmount, 0);

        return { filtered, totals: { totalPaid, totalBill } };
    }, [detailedExpenses, expSearch, expDateSearch, expMonthSearch, expYearSearch, expCategorySearch]);

    const clinicMonthlyExpenseSheetData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        const columnTotals: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => columnTotals[cat] = 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dailyExps = (Array.isArray(detailedExpenses[dateStr]) ? detailedExpenses[dateStr] : []).filter((it: any) => it && !it.isDeleted && (it.dept === 'Clinic' || (!it.dept && clinicExpenseCategories.includes(it.category))));
            
            const rowCategories: Record<string, number> = {};
            clinicExpenseCategories.forEach(cat => rowCategories[cat] = 0);
            
            let dayTotal = 0;
            dailyExps.forEach((exp: any) => {
                if (exp && clinicExpenseCategories.includes(exp.category)) {
                    rowCategories[exp.category] += (exp.paidAmount || 0);
                    columnTotals[exp.category] += (exp.paidAmount || 0);
                    dayTotal += (exp.paidAmount || 0);
                } else if (exp) {
                    rowCategories['Others'] = (rowCategories['Others'] || 0) + (exp.paidAmount || 0);
                    columnTotals['Others'] = (columnTotals['Others'] || 0) + (exp.paidAmount || 0);
                    dayTotal += (exp.paidAmount || 0);
                }
            });

            rows.push({
                date: dateStr,
                categories: rowCategories,
                total: dayTotal
            });
        }

        const grandTotal = Object.values(columnTotals).reduce((a, b) => a + b, 0);
        return { rows, columnTotals, grandTotal };
    }, [selectedMonth, selectedYear, detailedExpenses]);

    const dailySummaryData = useMemo(() => {
        const safeInvoices = Array.isArray(invoices) ? invoices : [];
        const dayInvoices = safeInvoices.filter((inv: any) => (inv.invoice_date || inv.admission_date) === selectedDate);
        
        const safeDueCollections = Array.isArray(dueCollections) ? dueCollections : [];
        const dayDueRecov = safeDueCollections.filter((dc: any) => {
            const isClinic = dc && dc.invoice_id && !dc.invoice_id.startsWith('INV-');
            return dc && dc.collection_date === selectedDate && isClinic;
        }).reduce((sum: any, dc: any) => sum + (dc.amount_collected || 0), 0);

        const collectionByCategory = dayInvoices.reduce((acc, inv) => {
            const catData = categorizeInvoiceData(inv);
            acc.admFee += catData.admFee;
            acc.oxygen += catData.oxygen;
            acc.conservative += catData.conservative;
            acc.nvd += catData.nvd;
            acc.dc += catData.dc;
            acc.lscs_ot += catData.lscs_ot;
            acc.gb_ot += catData.gb_ot;
            acc.others_ot += catData.others_ot;
            acc.dressing += catData.dressing;
            acc.others += catData.others;
            acc.totalPC += catData.pcAmount;
            return acc;
        }, { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs_ot: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, totalPC: 0 });

        const totalClinicNetOnly = dayInvoices.reduce((sum: any, inv: any) => {
             if (inv.status === 'Cancelled' || inv.status === 'Returned') return sum;
             const catData = categorizeInvoiceData(inv);
             return sum + catData.clinicNet;
        }, 0);

        const totalCollection = totalClinicNetOnly + dayDueRecov;
        const dayExpenses = (Array.isArray(detailedExpenses && detailedExpenses[selectedDate]) ? detailedExpenses[selectedDate] : []).filter((it: any) => it && !it.isDeleted && (it.dept === 'Clinic' || (!it.dept && clinicExpenseCategories.includes(it.category))));
        const totalExpense = dayExpenses.reduce((s: number, it: any) => s + (it.paidAmount || 0), 0);
        
        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        dayExpenses.forEach((it: any) => {
            if (it) expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + (it.paidAmount || 0);
        });

        return { totalCollection, collectionByCategory, dayDueRecov, totalExpense, expensesByCategory, balance: totalCollection - totalExpense };
    }, [selectedDate, invoices, dueCollections, detailedExpenses, categorizeInvoiceData]);

    const collectionReportData = useMemo(() => {
        const safeInvoices = Array.isArray(invoices) ? invoices : [];
        const filtered = safeInvoices.filter((inv: any) => {
            const dateToUse = inv.invoice_date || inv.admission_date;
            if (isTodayFilter) return dateToUse === selectedDate;
            if (!dateToUse) return false;
            const [y, m] = dateToUse.split('-').map(Number);
            return (m - 1) === selectedMonth && y === selectedYear;
        }).filter((inv: any) => 
            (inv.patient_name || '').toLowerCase().includes(invoiceSearch.toLowerCase()) || 
            (inv.admission_id && inv.admission_id.toLowerCase().includes(invoiceSearch.toLowerCase()))
        );

        return filtered.map((inv: any) => {
            const catData = categorizeInvoiceData(inv);
            return {
                ...inv,
                admFeeCol: catData.admFee,
                lscsOtCol: catData.lscs_ot,
                gbCol: catData.gb_ot,
                othersOtCol: catData.others_ot,
                nvdCol: catData.nvd,
                dcCol: catData.dc,
                consCol: catData.conservative,
                o2NebCol: catData.oxygen,
                dressCol: catData.dressing,
                othersCol: catData.others,
                pcCol: catData.pcAmount,
                netClinicCol: catData.clinicNet
            };
        });
    }, [invoices, isTodayFilter, selectedDate, selectedMonth, selectedYear, invoiceSearch, categorizeInvoiceData]);

    const indoorJournalData = useMemo(() => {
        const safeInvoices = Array.isArray(invoices) ? invoices : [];
        const filtered = safeInvoices.filter((inv: any) => {
            const dateToUse = inv.invoice_date || inv.admission_date;
            
            const matchesName = (inv.patient_name || '').toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                               (inv.admission_id && inv.admission_id.toLowerCase().includes(invoiceSearch.toLowerCase()));
            
            const matchesDate = invoiceDateSearch ? dateToUse === invoiceDateSearch : true;
            
            let matchesMonth = true;
            let matchesYear = true;
            if (dateToUse) {
                const [y, m] = dateToUse.split('-').map(Number);
                matchesMonth = invoiceMonthSearch !== '' ? (m - 1) === invoiceMonthSearch : true;
                matchesYear = invoiceYearSearch !== '' ? y === invoiceYearSearch : true;
            } else {
                matchesMonth = invoiceMonthSearch === '';
                matchesYear = invoiceYearSearch === '';
            }
            
            // If no specific search criteria, default to selectedDate
            if (!invoiceSearch && !invoiceDateSearch && invoiceMonthSearch === '' && invoiceYearSearch === '') {
                return dateToUse === selectedDate;
            }

            return matchesName && matchesDate && matchesMonth && matchesYear;
        });

        const totals = filtered.reduce((acc, inv) => {
            if (inv.status !== 'Cancelled' && inv.status !== 'Returned') {
                acc.totalBill += inv.total_bill || 0;
                acc.totalPaid += inv.paid_amount || 0;
                acc.totalDue += inv.due_bill || 0;
            }
            return acc;
        }, { totalBill: 0, totalPaid: 0, totalDue: 0 });

        return { filtered, totals };
    }, [invoices, invoiceSearch, invoiceDateSearch, invoiceMonthSearch, invoiceYearSearch, selectedDate]);
    const reportTotals = useMemo(() => {
        return collectionReportData.reduce((acc, curr) => {
            if (curr.status !== 'Cancelled' && curr.status !== 'Returned') {
                acc.admFee += curr.admFeeCol;
                if (curr.admFeeCol > 0) acc.admFeeCount++;

                acc.lscs_ot += curr.lscsOtCol;
                if (curr.lscsOtCol > 0) acc.lscs_otCount++;

                acc.gb += curr.gbCol;
                if (curr.gbCol > 0) acc.gbCount++;

                acc.others_ot += curr.othersOtCol;
                if (curr.othersOtCol > 0) acc.others_otCount++;

                acc.nvd += curr.nvdCol;
                if (curr.nvdCol > 0) acc.nvdCount++;

                acc.dc += curr.dcCol;
                if (curr.dcCol > 0) acc.dcCount++;

                acc.cons += curr.consCol;
                if (curr.consCol > 0) acc.consCount++;

                acc.o2neb += curr.o2NebCol;
                if (curr.o2NebCol > 0) acc.o2nebCount++;

                acc.dress += curr.dressCol;
                if (curr.dressCol > 0) acc.dressCount++;

                acc.others += curr.othersCol;
                if (curr.othersCol > 0) acc.othersCount++;

                acc.pc += curr.pcCol;
                acc.netClinic += curr.netClinicCol;
                acc.paidTotal += curr.paid_amount;
            }
            return acc;
        }, { 
            admFee: 0, admFeeCount: 0,
            lscs_ot: 0, lscs_otCount: 0,
            gb: 0, gbCount: 0,
            others_ot: 0, others_otCount: 0,
            nvd: 0, nvdCount: 0,
            dc: 0, dcCount: 0,
            cons: 0, consCount: 0,
            o2neb: 0, o2nebCount: 0,
            dress: 0, dressCount: 0,
            others: 0, othersCount: 0,
            pc: 0, netClinic: 0, paidTotal: 0 
        });
    }, [collectionReportData]);

    const handlePrintCollectionReport = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const title = isTodayFilter ? `Today's Collection Report - ${selectedDate}` : `Monthly Collection Report - ${monthOptions[selectedMonth].name} ${selectedYear}`;
        
        const html = `
            <html>
                <head>
                    <title>${title}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4 landscape; margin: 8mm; } 
                        body { background: white; font-family: 'Segoe UI', serif; color: black; font-size: 7.5pt; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 2px 4px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 7pt; }
                        .text-right { text-align: right; }
                        .font-black { font-weight: 900; }
                    </style>
                </head>
                <body class="p-2">
                    <div class="text-center mb-4 border-b-2 border-black pb-2">
                        <h1 class="text-xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-[8pt] font-bold">Patient Collection Report (Clinic Accounts) - ${title}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Adm. ID</th>
                                <th>Date</th>
                                <th>Patient Name</th>
                                <th>Service Taken</th>
                                <th class="text-right">Admission</th>
                                <th class="text-right">LSCS_OT</th>
                                <th class="text-right">GB_OT</th>
                                <th class="text-right">Others_OT</th>
                                <th class="text-right">NVD</th>
                                <th class="text-right">D&C</th>
                                <th class="text-right">Cons.</th>
                                <th class="text-right">O2/Neb</th>
                                <th class="text-right">Dress</th>
                                <th class="text-right">Misc</th>
                                <th class="text-right">Paid Total</th>
                                <th class="text-right bg-rose-50">PC (Comm)</th>
                                <th class="text-right bg-emerald-50">Clinic Net</th>
                                <th class="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${collectionReportData.map((inv, idx) => `
                                <tr class="${inv.status === 'Cancelled' ? 'opacity-30 line-through' : inv.status === 'Returned' ? 'bg-red-50' : ''}">
                                    <td>${idx + 1}</td>
                                    <td>${inv.admission_id}</td>
                                    <td>${inv.invoice_date || inv.admission_date}</td>
                                    <td class="font-bold">${inv.patient_name}</td>
                                    <td>${inv.subCategory || '-'}</td>
                                    <td class="text-right">৳${inv.admFeeCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.lscsOtCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.gbCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.othersOtCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.nvdCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.dcCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.consCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.o2NebCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.dressCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.othersCol.toLocaleString()}</td>
                                    <td class="text-right font-bold">৳${(inv.status === 'Cancelled' || inv.status === 'Returned') ? '0' : inv.paid_amount.toLocaleString()}</td>
                                    <td class="text-right bg-rose-50 text-rose-800">৳${inv.pcCol.toLocaleString()}</td>
                                    <td class="text-right font-black bg-emerald-50 text-emerald-800">৳${inv.netClinicCol.toLocaleString()}</td>
                                    <td class="text-center text-[6pt] font-black">${inv.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="bg-gray-100 font-black">
                            <tr>
                                <td colspan="5" class="text-right">Grand Totals (Active Only):</td>
                                <td class="text-right">
                                    <div>৳${reportTotals.admFee.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.admFeeCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.lscs_ot.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.lscs_otCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.gb.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.gbCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.others_ot.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.others_otCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.nvd.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.nvdCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.dc.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.dcCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.cons.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.consCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.o2neb.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.o2nebCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.dress.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.dressCount}</div>
                                </td>
                                <td class="text-right">
                                    <div>৳${reportTotals.others.toLocaleString()}</div>
                                    <div class="text-[6pt] text-gray-500">Qty: ${reportTotals.othersCount}</div>
                                </td>
                                <td class="text-right">৳${reportTotals.paidTotal.toLocaleString()}</td>
                                <td class="text-right text-rose-700">৳${reportTotals.pc.toLocaleString()}</td>
                                <td class="text-right text-emerald-700">৳${reportTotals.netClinic.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 750);
    };

    const handlePrintDailyJournal = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const date = selectedDate;
        const expenses = detailedExpenses[date] || [];
        const dayInvoices = invoices.filter((inv: any) => (inv.invoice_date || inv.admission_date) === date);
        const totalExp = expenses.reduce((s, i) => s + i.paidAmount, 0);
        const totalInvPaid = dayInvoices.filter(i => i.status !== 'Cancelled' && i.status !== 'Returned').reduce((s, i) => s + i.paid_amount, 0);

        const html = `
            <html>
                <head>
                    <title>Daily Journal - ${date}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 8mm; } 
                        body { background: white; font-family: 'Segoe UI', Tahoma, sans-serif; color: black; font-size: 10pt; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
                        .text-right { text-align: right; }
                        .font-black { font-weight: 900; }
                    </style>
                </head>
                <body class="p-4">
                    <div class="text-center mb-6 border-b-2 border-black pb-3">
                        <h1 class="text-2xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-xs font-bold mt-1">Daily Transaction Ledger - Date: ${date}</p>
                    </div>

                    <h3 class="text-sm font-black uppercase mb-2 border-l-4 border-rose-600 pl-2">Section I: Daily Operating Expenses</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30%">Category</th>
                                <th style="width: 50%">Details / Description</th>
                                <th style="width: 20%" class="text-right">Paid Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.length > 0 ? expenses.map(ex => `
                                <tr>
                                    <td class="font-bold">${expenseCategoryBanglaMap[ex.category] || ex.category}</td>
                                    <td>${ex.subCategory ? `<b>${ex.subCategory}:</b> ` : ''}${ex.description || '-'}</td>
                                    <td class="text-right font-black">৳${ex.paidAmount.toLocaleString()}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="text-center italic py-4 text-gray-500">No expenses recorded for this day.</td></tr>'}
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td colspan="2" class="text-right font-black uppercase">Total Expense:</td>
                                <td class="text-right font-black text-lg">৳${totalExp.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <h3 class="text-sm font-black uppercase mb-2 border-l-4 border-emerald-600 pl-2">Section II: Patient Billing Log</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 20%">Invoice ID</th>
                                <th style="width: 30%">Patient Name</th>
                                <th style="width: 15%">Status</th>
                                <th style="width: 15%" class="text-right">Total Bill</th>
                                <th style="width: 20%" class="text-right">Paid Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dayInvoices.length > 0 ? dayInvoices.map(inv => `
                                <tr class="${inv.status === 'Cancelled' ? 'opacity-30 line-through' : ''}">
                                    <td class="font-mono text-xs">${inv.daily_id}</td>
                                    <td class="font-bold uppercase">${inv.patient_name}</td>
                                    <td class="text-[8pt] font-black uppercase">${inv.status}</td>
                                    <td class="text-right font-medium">৳${inv.total_bill.toLocaleString()}</td>
                                    <td class="text-right font-black text-emerald-700">৳${(inv.status === 'Cancelled' || inv.status === 'Returned') ? '0' : inv.paid_amount.toLocaleString()}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" class="text-center italic py-4 text-gray-500">No patient invoices for this day.</td></tr>'}
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td colspan="4" class="text-right font-black uppercase">Total Billing (Active Cash):</td>
                                <td class="text-right font-black text-lg text-emerald-800">৳${totalInvPaid.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="mt-20 flex justify-between px-10 text-[8.5pt] font-bold uppercase text-gray-500">
                        <div class="text-center w-40 border-t border-black pt-1">Accountant</div>
                        <div class="text-center w-56 border-t border-black pt-1">Managing Director / MD</div>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 750);
    };

    const handlePrintMonthlyExpenseSheet = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const monthName = monthOptions[selectedMonth].name;
        const { rows, columnTotals, grandTotal } = clinicMonthlyExpenseSheetData;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Clinic Expense Sheet - ${monthName} ${selectedYear}</title>
                    <style>
                        @page { 
                            size: A4 landscape; 
                            margin: 3mm; 
                        }
                        body { 
                            font-family: 'Arial Narrow', sans-serif; 
                            background: white; 
                            color: black; 
                            margin: 0; 
                            padding: 0; 
                            width: 100%;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                            border-bottom: 1px solid black;
                            margin-bottom: 2px;
                            padding-bottom: 1px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 12pt;
                            color: #1e3a8a;
                            text-transform: uppercase;
                        }
                        .header p {
                            margin: 0;
                            font-size: 7.5pt;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            table-layout: fixed; 
                        }
                        th, td { 
                            border: 1px solid black; 
                            padding: 1px; 
                            text-align: center; 
                            font-size: 7.5pt; 
                            word-wrap: break-word; 
                            line-height: 1;
                            height: 13.8pt;
                        }
                        th { 
                            background: #f3f4f6; 
                            font-weight: bold; 
                            text-transform: uppercase; 
                            font-size: 6.5pt; 
                        }
                        .total-row {
                            background: #f3f4f6;
                            font-weight: bold;
                        }
                        .grand-total {
                            color: #047857;
                            background: #ecfdf5;
                            font-size: 8.5pt;
                        }
                        .footer {
                            margin-top: 3mm;
                            display: flex;
                            justify-content: space-between;
                            padding: 0 60px;
                            font-size: 7.5pt;
                            font-weight: bold;
                            text-transform: uppercase;
                            color: #6b7280;
                        }
                        .sig-box {
                            width: 150px;
                            border-top: 1px solid black;
                            text-align: center;
                            padding-top: 2px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Niramoy Clinic & Diagnostic</h1>
                        <p>Monthly Clinic Expense Ledger - ${monthName} ${selectedYear}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 35px">Date</th>
                                ${clinicExpenseCategories.map(cat => `<th title="${cat}">${expenseCategoryBanglaMap[cat] || cat}</th>`).join('')}
                                <th style="width: 55px" style="background: #e5e7eb">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td style="font-weight: bold">${row.date.split('-')[2]} ${monthName.substring(0,3)}</td>
                                    ${clinicExpenseCategories.map(cat => `<td>${row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}</td>`).join('')}
                                    <td style="font-weight: 900; background: #f9fafb">৳${row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="total-row">
                            <tr>
                                <td style="text-transform: uppercase">TOTAL:</td>
                                ${clinicExpenseCategories.map(cat => `<td>${columnTotals[cat] > 0 ? columnTotals[cat].toLocaleString() : '-'}</td>`).join('')}
                                <td class="grand-total">৳${grandTotal.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">
                        <div class="sig-box">Accountant</div>
                        <div class="sig-box">Managing Director</div>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const handlePrintSummary = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const title = viewMode === 'daily_summary' ? `Clinic Daily Summary - ${selectedDate}` : `Clinic Monthly Summary - ${monthOptions[selectedMonth].name} ${selectedYear}`;
        const currentData = viewMode === 'daily_summary' ? dailySummaryData : summaryData;
        const dueRecov = viewMode === 'daily_summary' ? (currentData as any).dayDueRecov : (currentData as any).monthDueRecov;

        const html = `
            <html>
                <head>
                    <title>${title}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 8mm; } 
                        body { background: white; font-family: 'Segoe UI', serif; color: black; font-size: 9.5pt; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
                        th, td { border: 1.5px solid #000; padding: 4px 8px; text-align: left; }
                        th { background: #f3f4f6; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; }
                        .text-right { text-align: right; }
                        .font-black { font-weight: 900; }
                        .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 4px; margin-bottom: 12px; }
                    </style>
                </head>
                <body class="p-4">
                    <div class="header">
                        <h1 class="text-xl font-black uppercase text-blue-900 leading-none">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-[8pt] font-bold">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                        <h2 class="mt-2 text-lg font-bold underline uppercase tracking-widest bg-gray-50 py-1 border border-black">${title}</h2>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-[8pt] tracking-widest text-gray-600">I. Revenue Analysis (Income)</h3>
                            <table class="text-[8.5pt]">
                                <thead><tr class="bg-gray-100"><th>Category</th><th className="text-right">Amount</th></tr></thead>
                                <tbody>
                                    <tr><td>Admission Fee</td><td class="text-right">৳${currentData.collectionByCategory.admFee.toLocaleString()}</td></tr>
                                    <tr><td>Oxygen / Nebulization</td><td class="text-right">৳${currentData.collectionByCategory.oxygen.toLocaleString()}</td></tr>
                                    <tr><td>Conservative Treatment</td><td class="text-right">৳${currentData.collectionByCategory.conservative.toLocaleString()}</td></tr>
                                    <tr><td>Normal Delivery (NVD)</td><td class="text-right">৳${currentData.collectionByCategory.nvd.toLocaleString()}</td></tr>
                                    <tr><td>D&C / Minor Surgery</td><td class="text-right">৳${currentData.collectionByCategory.dc.toLocaleString()}</td></tr>
                                    <tr><td>LSCS_OT / Major Surgery</td><td class="text-right">৳${currentData.collectionByCategory.lscs_ot.toLocaleString()}</td></tr>
                                    <tr><td>GB (Gallbladder) OT</td><td class="text-right">৳${currentData.collectionByCategory.gb_ot.toLocaleString()}</td></tr>
                                    <tr><td>Others OT / Services</td><td class="text-right">৳${currentData.collectionByCategory.others_ot.toLocaleString()}</td></tr>
                                    <tr><td>Dressing</td><td class="text-right">৳${currentData.collectionByCategory.dressing.toLocaleString()}</td></tr>
                                    <tr><td>Miscellaneous (Others)</td><td class="text-right">৳${currentData.collectionByCategory.others.toLocaleString()}</td></tr>
                                    <tr class="italic text-gray-600"><td>Due Recovery (বকেয়া আদায়)</td><td class="text-right">৳${dueRecov.toLocaleString()}</td></tr>
                                </tbody>
                                <tfoot class="bg-blue-50 font-black">
                                    <tr><td>Total Revenue (Gross - Comm)</td><td class="text-right text-lg">৳${currentData.totalCollection.toLocaleString()}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-[8pt] tracking-widest text-gray-600">II. Operating Cost (Expenses)</h3>
                            <table class="text-[8.5pt]">
                                <thead><tr class="bg-gray-100"><th>Expense Item</th><th class="text-right">Amount</th></tr></thead>
                                <tbody>
                                    ${clinicExpenseCategories.map(cat => `
                                        <tr><td>${expenseCategoryBanglaMap[cat] || cat}</td><td class="text-right">৳${(currentData.expensesByCategory[cat] || 0).toLocaleString()}</td></tr>
                                    `).join('')}
                                </tbody>
                                <tfoot class="bg-red-50 font-black">
                                    <tr><td>Total Expense (B)</td><td class="text-right text-lg">৳${currentData.totalExpense.toLocaleString()}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-4 border-2 border-black bg-gray-50 flex justify-between items-center rounded-xl shadow-sm">
                        <span class="text-lg font-black uppercase text-blue-900">Net Profitability (A - B)</span>
                        <span class="text-3xl font-black ${currentData.balance >= 0 ? 'text-green-700' : 'text-red-600'}">৳${currentData.balance.toLocaleString()}</span>
                    </div>

                    <div class="mt-8 flex justify-between px-8 text-[8pt] font-bold uppercase text-gray-500">
                        <div class="text-center w-40 border-t border-black pt-1">Accountant</div>
                        <div class="text-center w-56 border-t border-black pt-1">Authorized Managing Director</div>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 750);
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
                    <button onClick={() => setViewMode('monthly_expense')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'monthly_expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Monthly Clinic Expense Sheet</button>
                    <button onClick={() => setViewMode('daily_summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'daily_summary' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Daily Summary</button>
                    <button onClick={() => setViewMode('summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'summary' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Monthly Summary</button>
                </div>
            </header>

            <main className="flex-1 w-full px-4 sm:px-6 py-8 space-y-8">
                {viewMode === 'detailed' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        {ledgerHistoryItem && <HistoryModal item={ledgerHistoryItem} onClose={() => setLedgerHistoryItem(null)} />}
                        <DailyExpenseForm 
                            key={selectedDate}
                            selectedDate={selectedDate} 
                            onDateChange={handleDateChange} 
                            items={detailedExpenses[selectedDate] || []} 
                            onSave={handleSave} 
                            onPrint={handlePrintDailyJournal}
                            employees={employees} 
                        />
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                            <h3 className="text-lg font-black text-sky-400 uppercase mb-6 flex flex-wrap justify-between items-center gap-4">
                                <span>Clinic Expense Ledger Journal</span>
                                <div className="flex flex-wrap gap-2">
                                    <input type="text" placeholder="Search Expense..." value={expSearch} onChange={e=>setExpSearch(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500 w-40"/>
                                    <select value={expCategorySearch} onChange={e=>setExpCategorySearch(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500">
                                        <option value="">Category</option>
                                        {clinicExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input type="date" value={expDateSearch} onChange={e=>setExpDateSearch(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500 w-36"/>
                                    <select value={expMonthSearch} onChange={e=>setExpMonthSearch(e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500">
                                        <option value="">Month</option>
                                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                                    </select>
                                    <select value={expYearSearch} onChange={e=>setExpYearSearch(e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500">
                                        <option value="">Year</option>
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    {(expSearch || expDateSearch || expMonthSearch !== '' || expYearSearch !== '' || expCategorySearch) && (
                                        <button onClick={() => { setExpSearch(''); setExpDateSearch(''); setExpMonthSearch(''); setExpYearSearch(''); setExpCategorySearch(''); }} className="text-rose-400 text-[10px] font-black uppercase hover:underline">Clear</button>
                                    )}
                                </div>
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-700">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black">
                                        <tr>
                                            <th className="p-4">SL</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Sub-Category</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4 text-right">Bill</th>
                                            <th className="p-4 text-right">Paid</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                        <tr className="bg-slate-900 border-b border-slate-700">
                                            <th colSpan={5} className="p-2 text-right text-slate-400 uppercase tracking-widest">Filtered Totals:</th>
                                            <th className="p-2 text-right text-sky-400">৳{clinicExpenseJournalData.totals.totalBill.toLocaleString()}</th>
                                            <th className="p-2 text-right text-emerald-400">৳{clinicExpenseJournalData.totals.totalPaid.toLocaleString()}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {clinicExpenseJournalData.filtered.map((ex:any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-700/40 transition-colors">
                                                <td className="p-4 text-slate-500 text-xs">{idx + 1}</td>
                                                <td className="p-4 text-xs font-mono text-slate-400">{ex.date}</td>
                                                <td className="p-4 font-bold text-emerald-400">{expenseCategoryBanglaMap[ex.category] || ex.category}</td>
                                                <td className="p-4 text-sky-400 font-black uppercase text-[10px]">{ex.subCategory || '-'}</td>
                                                <td className="p-4 text-slate-300">{ex.description || '-'}</td>
                                                <td className="p-4 text-right text-slate-400">৳{ex.billAmount.toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-400 font-black">৳{ex.paidAmount.toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedDate(ex.date);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="p-1.5 bg-sky-600/20 text-sky-400 rounded hover:bg-sky-600 hover:text-white transition-all"
                                                            title="Edit"
                                                        >
                                                            <FileTextIcon size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setLedgerHistoryItem(ex)}
                                                            className={`p-1.5 rounded transition-all text-[10px] font-black uppercase ${ex.isEdited ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700 hover:text-white'}`}
                                                            title="History"
                                                        >
                                                            H
                                                        </button>
                                                        {!ex.isDeleted && (
                                                            <button 
                                                                onClick={() => handleLedgerDelete(ex.date, ex.id)}
                                                                className="p-1.5 bg-rose-600/20 text-rose-400 rounded hover:bg-rose-600 hover:text-white transition-all"
                                                                title="Delete"
                                                            >
                                                                <BackIcon size={14} className="rotate-45" />
                                                            </button>
                                                        )}
                                                        {ex.isDeleted && (
                                                            <span className="text-[10px] font-black text-rose-500 uppercase bg-rose-500/10 px-2 py-1 rounded">Deleted</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {clinicExpenseJournalData.filtered.length === 0 && (
                                            <tr><td colSpan={8} className="p-10 text-center text-slate-600 italic">No clinic expenses found for the selected filters.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'collection' && (
                    <div className="animate-fade-in space-y-6 w-full">
                        <div className="bg-slate-800 p-4 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-6 w-full">
                            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-700 pb-4 no-print">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Patient Collection Report</h3>
                                    <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700">
                                        <button onClick={() => setIsTodayFilter(true)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${isTodayFilter && selectedDate === new Date().toISOString().split('T')[0] ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Today's Collection</button>
                                        <button onClick={() => setIsTodayFilter(false)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!isTodayFilter ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Monthly View</button>
                                    </div>
                                    {!isTodayFilter && (
                                        <div className="flex flex-col items-start bg-emerald-900/20 border border-emerald-500/30 px-4 py-1 rounded-2xl">
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Total Collection</span>
                                            <span className="text-sm font-black text-emerald-400">৳{reportTotals.paidTotal.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-slate-700">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Custom Date:</label>
                                        <input 
                                            type="date" 
                                            value={selectedDate} 
                                            onChange={(e) => {
                                                setSelectedDate(e.target.value);
                                                setIsTodayFilter(true);
                                            }} 
                                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handlePrintCollectionReport}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95"
                                    >
                                        <PrinterIcon size={14}/> Print A4 Landscape
                                    </button>
                                    {!isTodayFilter && (
                                        <div className="flex gap-2 mx-2">
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

                            <div className="overflow-x-auto min-h-[500px] border border-slate-700 rounded-xl bg-slate-950/20 shadow-inner w-full">
                                <table className="w-full text-left text-[11px] border-collapse min-w-[1500px]">
                                    <thead className="bg-slate-900/80 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">
                                        <tr>
                                            <th className="p-3 whitespace-nowrap">SL</th>
                                            <th className="p-3 whitespace-nowrap">Adm. ID</th>
                                            <th className="p-3 whitespace-nowrap">Date</th>
                                            <th className="p-3 whitespace-nowrap">Patient Name</th>
                                            <th className="p-3 whitespace-nowrap">Service Taken</th>
                                            <th className="p-3 text-right">Admission</th>
                                            <th className="p-3 text-right">LSCS_OT</th>
                                            <th className="p-3 text-right">GB_OT</th>
                                            <th className="p-3 text-right">Others_OT</th>
                                            <th className="p-3 text-right">NVD</th>
                                            <th className="p-3 text-right">D&C</th>
                                            <th className="p-3 text-right">Cons.</th>
                                            <th className="p-3 text-right">O2/Neb</th>
                                            <th className="p-3 text-right">Dress</th>
                                            <th className="p-3 text-right">Misc</th>
                                            <th className="p-3 text-right bg-emerald-900/10 text-emerald-100 font-black">Paid Total</th>
                                            <th className="p-3 text-right bg-rose-900/10 text-rose-300 font-black border-l-2 border-rose-800/30">PC (Comm)</th>
                                            <th className="p-3 text-right bg-blue-900/10 text-sky-200 font-black border-l-2 border-blue-800/30">Clinic Net</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {collectionReportData.length > 0 ? collectionReportData.map((inv: any, idx: number) => (
                                            <tr key={inv.daily_id} className={`hover:bg-slate-700/30 transition-colors ${inv.status === 'Cancelled' ? 'opacity-30 line-through grayscale' : inv.status === 'Returned' ? 'bg-rose-900/5' : ''}`}>
                                                <td className="p-3 border-r border-slate-800/50 text-slate-500 font-mono">{idx + 1}</td>
                                                <td className="p-3 font-mono text-sky-500 border-r border-slate-800/50">{inv.admission_id}</td>
                                                <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{inv.invoice_date || inv.admission_date}</td>
                                                <td className="p-3 font-black text-slate-200 border-r border-slate-800/50 uppercase whitespace-nowrap">{inv.patient_name}</td>
                                                <td className="p-3 text-sky-400 font-bold border-r border-slate-800/50 truncate max-w-[120px]" title={inv.subCategory}>{inv.subCategory || '-'}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.admFeeCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.lscsOtCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.gbCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.othersOtCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.nvdCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.dcCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.consCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.o2NebCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.dressCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳{inv.othersCol.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-emerald-400 bg-emerald-900/10">৳ {(inv.status === 'Cancelled' || inv.status === 'Returned') ? '0' : inv.paid_amount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-rose-400 bg-rose-900/10 border-l-2 border-rose-800/30">৳ {inv.pcCol.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-sky-300 bg-blue-900/10 border-l-2 border-blue-800/30">৳ {inv.netClinicCol.toLocaleString()}</td>
                                                <td className="p-3 text-center"><span className="text-[7px] font-black uppercase px-1 rounded bg-slate-900">{inv.status}</span></td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={19} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-xl tracking-[0.2em]">No Collection Records Found</td></tr>
                                        )}
                                    </tbody>
                                    {collectionReportData.length > 0 && (
                                        <tfoot className="bg-slate-900 text-slate-200 font-black border-t-2 border-slate-700 sticky bottom-0">
                                            <tr>
                                                <td colSpan={5} className="p-4 text-right uppercase tracking-widest text-[11px]">Grand Summary Totals (Active Only):</td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.admFee.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.admFeeCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.lscs_ot.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.lscs_otCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.gb.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.gbCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.others_ot.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.others_otCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.nvd.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.nvdCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.dc.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.dcCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.cons.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.consCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.o2neb.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.o2nebCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.dress.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.dressCount}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-emerald-400">৳{reportTotals.others.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold">Qty: {reportTotals.othersCount}</div>
                                                </td>
                                                <td className="p-4 text-right text-emerald-400 text-lg">৳ {reportTotals.paidTotal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-rose-400 text-lg">৳ {reportTotals.pc.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sky-400 text-2xl underline decoration-double">৳ {reportTotals.netClinic.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'monthly_expense' && (
                    <div className="w-full space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl no-print">
                            <h2 className="text-xl font-black text-white uppercase">Monthly Clinic Expense Sheet: {monthOptions[selectedMonth].name} {selectedYear}</h2>
                            <div className="flex gap-4">
                                <button onClick={handlePrintMonthlyExpenseSheet} className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><PrinterIcon size={14}/> Print A4 Landscape</button>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                                    <tr>
                                        <th className="p-2 border border-slate-200 w-20">Date</th>
                                        {clinicExpenseCategories.map(cat => (
                                            <th key={cat} className="p-2 border border-slate-200 text-center">{expenseCategoryBanglaMap[cat] || cat}</th>
                                        ))}
                                        <th className="p-2 border border-slate-200 text-right bg-slate-100">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {clinicMonthlyExpenseSheetData.rows.map((row) => (
                                        <tr key={row.date} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            <td className="p-2 border border-slate-200 font-bold text-slate-700">{row.date.split('-')[2]} {monthOptions[selectedMonth].name.substring(0,3)}</td>
                                            {clinicExpenseCategories.map(cat => (
                                                <td key={cat} className="p-2 border border-slate-200 text-center text-slate-600">
                                                    {row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}
                                                </td>
                                            ))}
                                            <td className="p-2 border border-slate-200 text-right font-black text-rose-600 bg-rose-50/30">
                                                ৳{row.total > 0 ? row.total.toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white font-black border-t-2 border-slate-700">
                                    <tr>
                                        <td className="p-4 border border-slate-700 uppercase text-[10px]">Total:</td>
                                        {clinicExpenseCategories.map(cat => (
                                            <td key={cat} className="p-4 border border-slate-700 text-center">
                                                ৳{clinicMonthlyExpenseSheetData.columnTotals[cat].toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="p-4 border border-slate-700 text-right text-xl text-emerald-400">
                                            ৳{clinicMonthlyExpenseSheetData.grandTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {viewMode === 'daily_summary' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl no-print">
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
                                <h3 className="text-emerald-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Daily Income (Clinic Fund Only)</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Admission Fee:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.admFee.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Oxygen / Nebulization:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.oxygen.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Conservative Treatment:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.conservative.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Normal Delivery (NVD):</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.nvd.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>D&C / Minor Surgery:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.dc.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>LSCS_OT / Major Surgery:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.lscs_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>GB (Gallbladder) OT:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.gb_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Others OT / Services:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.others_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Dressing:</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.dressing.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Miscellaneous (Others):</span> <span className="font-black">৳{dailySummaryData.collectionByCategory.others.toLocaleString()}</span></div>
                                    <div className="flex justify-between italic text-slate-400 pb-1"><span>Due Recovery (বকেয়া আদায়):</span> <span className="font-black">৳{dailySummaryData.dayDueRecov.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t-2 border-emerald-500/50 pt-3 text-white font-black"><span>Total Net Revenue:</span> <span>৳{dailySummaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Daily Operating Cost (B)</h3>
                                <div className="space-y-2 text-xs pr-2">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between border-b border-slate-700/30 pb-1"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span className="font-black">৳{(dailySummaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg border-t-2 border-rose-500/50 pt-3 text-white font-black mt-2"><span>Total Expense:</span> <span>৳{dailySummaryData.totalExpense.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-4 no-print">
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-3xl text-center shadow-2xl border-2 border-amber-500/20">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Daily Net Profit/Loss (A - B)</p>
                                <h4 className={`text-5xl font-black ${dailySummaryData.balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳{dailySummaryData.balance.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'summary' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl no-print">
                            <h2 className="text-xl font-black text-white uppercase">Monthly Summary: {monthOptions[selectedMonth].name} {selectedYear}</h2>
                            <div className="flex gap-4">
                                <button onClick={handlePrintSummary} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><PrinterIcon size={14}/> Print Report</button>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-900 border border-slate-700 p-2 rounded text-white text-xs font-bold">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-blue-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Monthly Income (Clinic Fund Only)</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Admission Fee:</span> <span className="font-black">৳{summaryData.collectionByCategory.admFee.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Oxygen / Nebulization:</span> <span className="font-black">৳{summaryData.collectionByCategory.oxygen.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Conservative Treatment:</span> <span className="font-black">৳{summaryData.collectionByCategory.conservative.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Normal Delivery (NVD):</span> <span className="font-black">৳{summaryData.collectionByCategory.nvd.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>D&C / Minor Surgery:</span> <span className="font-black">৳{summaryData.collectionByCategory.dc.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>LSCS_OT / Major Surgery:</span> <span className="font-black">৳{summaryData.collectionByCategory.lscs_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>GB (Gallbladder) OT:</span> <span className="font-black">৳{summaryData.collectionByCategory.gb_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Others OT / Services:</span> <span className="font-black">৳{summaryData.collectionByCategory.others_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Dressing:</span> <span className="font-black">৳{summaryData.collectionByCategory.dressing.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Miscellaneous (Others):</span> <span className="font-black">৳{summaryData.collectionByCategory.others.toLocaleString()}</span></div>
                                    <div className="flex justify-between italic text-slate-400 pb-1"><span>Due Recovery (বকেয়া আদায়):</span> <span className="font-black">৳{summaryData.monthDueRecov.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t-2 border-blue-500/50 pt-3 text-white font-black"><span>Total Net Revenue:</span> <span>৳{summaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Monthly Operating Cost (B)</h3>
                                <div className="space-y-2 text-xs pr-2">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between border-b border-slate-700/30 pb-1"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span className="font-black">৳{(summaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg border-t-2 border-rose-500/50 pt-3 text-white font-black mt-2"><span>Total Expense:</span> <span>৳{summaryData.totalExpense.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-4 no-print">
                            <div className="bg-gradient-to-br from-indigo-700 to-slate-900 p-6 rounded-3xl text-center shadow-2xl border-2 border-white/10">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Monthly Net Profit (A - B)</p>
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
