import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ExpenseItem, Employee, DueCollection } from '../DiagnosticData';
import { IndoorInvoice } from '../ClinicPage';
import { ClinicIcon, Activity, BackIcon, FileTextIcon, PrinterIcon, SearchIcon } from '../Icons';

// --- Clinic Specific Categories ---
const clinicExpenseCategories = [
    'Stuff salary', 'Generator', 'Motorcycle', 'Marketing', 'Clinic development', 
    'Medicine buy (Pharmacy)', 'X-Ray', 'House rent', 'Stationery', 'Food/Refreshment', 
    'Doctor donation', 'Repair/Instruments', 'Press', 'License/Official', 
    'Bank/NGO Installment', 'Mobile', 'Interest/Loan', 'Others', 'Old Loan Repay'
];

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

const DailyExpenseForm: React.FC<any> = ({ selectedDate, onDateChange, items: initialItems, onSave, onPrint, employees }) => {
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
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-emerald-100 flex items-center gap-2"><Activity className="w-5 h-5" /> Clinic Daily Expense</h3>
                    <button onClick={onPrint} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"><PrinterIcon size={14}/> Print Daily Ledger</button>
                </div>
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

    // --- Helper function for keyword matching ---
    const matchesKeyword = (source: string, words: string[]) => {
        if(!source) return false;
        const lower = source.toLowerCase();
        return words.some(w => lower.includes(w.toLowerCase()));
    };

    // --- Core logic to categorize an invoice (Mapping Category Breakdown) ---
    const categorizeInvoiceData = (inv: any) => {
        const incomeItems = inv.items.filter((it: any) => it.isClinicFund === true);

        const admFee = incomeItems
            .filter((it: any) => matchesKeyword(it.service_type, ['Admission Fee', 'ভর্তি ফি']))
            .reduce((s: number, i: any) => s + i.payable_amount, 0);

        const oxygen = incomeItems
            .filter((it: any) => matchesKeyword(it.service_type, ['Oxygen', 'O2', 'Nebulizer', 'Nebulization']))
            .reduce((s: number, i: any) => s + i.payable_amount, 0);

        const dressing = incomeItems
            .filter((it: any) => matchesKeyword(it.service_type, ['Dressing']))
            .reduce((s: number, i: any) => s + i.payable_amount, 0);

        const conservative = incomeItems
            .filter((it: any) => 
                it.serviceCategory === 'Conservative treatment' && 
                !matchesKeyword(it.service_type, ['Admission Fee', 'ভর্তি ফি', 'Oxygen', 'O2', 'Nebulizer', 'Nebulization', 'Dressing'])
            )
            .reduce((s: number, i: any) => s + i.payable_amount, 0);

        let nvd = 0, dc = 0, lscs = 0, gb_ot = 0, others_ot = 0, others = 0;
        
        incomeItems.forEach((it: any) => {
            const sName = (it.service_type || '').toUpperCase();
            const iName = (inv.service_name || '').toUpperCase();
            const sCat = (it.serviceCategory || inv.serviceCategory || '');

            if (sCat.includes('Operation') || sCat.includes('OT') || sCat.includes('NVD')) {
                if (sName.includes('LSCS') || iName.includes('LSCS') || sName.includes('LUCS') || iName.includes('LUCS')) {
                    lscs += it.payable_amount;
                } else if (sName.includes('GB') || iName.includes('GB') || sName.includes('Gallbladder')) {
                    gb_ot += it.payable_amount;
                } else if (sName.includes('NVD') || iName.includes('NVD')) {
                    nvd += it.payable_amount;
                } else if (sName.includes('D&C') || iName.includes('D&C')) {
                    dc += it.payable_amount;
                } else if (!matchesKeyword(it.service_type, ['Admission Fee', 'Oxygen', 'O2', 'Nebulizer', 'Dressing'])) {
                    others_ot += it.payable_amount;
                }
            } else if (!matchesKeyword(it.service_type, ['Admission Fee', 'Oxygen', 'O2', 'Nebulizer', 'Dressing'])) {
                others += it.payable_amount;
            }
        });

        // PC and Clinic Net Calculation
        const totalClinicRevenue = admFee + oxygen + conservative + nvd + dc + lscs + gb_ot + others_ot + dressing + others;
        const pcAmount = inv.commission_paid || 0;
        const clinicNet = totalClinicRevenue - pcAmount;

        return { admFee, oxygen, conservative, nvd, dc, lscs, gb_ot, others_ot, dressing, others, pcAmount, clinicNet };
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

        const collectionByCategory = monthInvoices.reduce((acc, inv) => {
            const catData = categorizeInvoiceData(inv);
            acc.admFee += catData.admFee;
            acc.oxygen += catData.oxygen;
            acc.conservative += catData.conservative;
            acc.nvd += catData.nvd;
            acc.dc += catData.dc;
            acc.lscs += catData.lscs;
            acc.gb_ot += catData.gb_ot;
            acc.others_ot += catData.others_ot;
            acc.dressing += catData.dressing;
            acc.others += catData.others;
            acc.totalPC += catData.pcAmount;
            return acc;
        }, { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, totalPC: 0 });

        const totalClinicRevenueOnly = monthInvoices.reduce((sum:any, inv:any) => {
            const netIncomeForInv = inv.items.filter((it:any) => it.isClinicFund).reduce((s:number, i:any) => s + i.payable_amount, 0);
            return sum + netIncomeForInv;
        }, 0);

        const totalCollectionIncludingDue = totalClinicRevenueOnly + monthDueRecov;

        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        Object.entries(detailedExpenses).forEach(([date, items]:any) => {
            const d = new Date(date);
            if(d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
                items.forEach((it:any) => expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + it.paidAmount);
            }
        });
        const totalExpense = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
        return { totalCollection: totalCollectionIncludingDue, collectionByCategory, monthDueRecov, expensesByCategory, totalExpense, balance: totalCollectionIncludingDue - totalExpense };
    }, [selectedMonth, selectedYear, invoices, dueCollections, detailedExpenses]);

    const dailySummaryData = useMemo(() => {
        const dayInvoices = invoices.filter((inv: any) => inv.invoice_date === selectedDate);
        
        const dayDueRecov = dueCollections.filter((dc: any) => {
            const isClinic = !dc.invoice_id.startsWith('INV-');
            return dc.collection_date === selectedDate && isClinic;
        }).reduce((sum: any, dc: any) => sum + dc.amount_collected, 0);

        const collectionByCategory = dayInvoices.reduce((acc, inv) => {
            const catData = categorizeInvoiceData(inv);
            acc.admFee += catData.admFee;
            acc.oxygen += catData.oxygen;
            acc.conservative += catData.conservative;
            acc.nvd += catData.nvd;
            acc.dc += catData.dc;
            acc.lscs += catData.lscs;
            acc.gb_ot += catData.gb_ot;
            acc.others_ot += catData.others_ot;
            acc.dressing += catData.dressing;
            acc.others += catData.others;
            acc.totalPC += catData.pcAmount;
            return acc;
        }, { admFee: 0, oxygen: 0, conservative: 0, nvd: 0, dc: 0, lscs: 0, gb_ot: 0, others_ot: 0, dressing: 0, others: 0, totalPC: 0 });

        const totalClinicRevenueOnly = dayInvoices.reduce((sum: any, inv: any) => {
             const netIncomeForInv = inv.items.filter((it:any) => it.isClinicFund).reduce((s:number, i:any) => s + i.payable_amount, 0);
             return sum + netIncomeForInv;
        }, 0);

        const totalCollection = totalClinicRevenueOnly + dayDueRecov;
        const dayExpenses = detailedExpenses[selectedDate] || [];
        const totalExpense = dayExpenses.reduce((s: number, it: any) => s + it.paidAmount, 0);
        
        const expensesByCategory: Record<string, number> = {};
        clinicExpenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        dayExpenses.forEach((it: any) => {
            expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + it.paidAmount;
        });

        return { totalCollection, collectionByCategory, dayDueRecov, totalExpense, expensesByCategory, balance: totalCollection - totalExpense };
    }, [selectedDate, invoices, dueCollections, detailedExpenses]);

    const collectionReportData = useMemo(() => {
        const filtered = invoices.filter((inv: any) => {
            if (isTodayFilter) return inv.invoice_date === selectedDate;
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).filter((inv: any) => 
            inv.patient_name.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
            (inv.admission_id && inv.admission_id.toLowerCase().includes(invoiceSearch.toLowerCase()))
        );

        return filtered.map((inv: any) => {
            const catData = categorizeInvoiceData(inv);
            return {
                ...inv,
                admFeeCol: catData.admFee,
                lscsCol: catData.lscs,
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
    }, [invoices, isTodayFilter, selectedDate, selectedMonth, selectedYear, invoiceSearch]);

    const reportTotals = useMemo(() => {
        return collectionReportData.reduce((acc, curr) => {
            acc.admFee += curr.admFeeCol;
            acc.lscs += curr.lscsCol;
            acc.gb += curr.gbCol;
            acc.others_ot += curr.othersOtCol;
            acc.nvd += curr.nvdCol;
            acc.dc += curr.dcCol;
            acc.cons += curr.consCol;
            acc.o2neb += curr.o2NebCol;
            acc.dress += curr.dressCol;
            acc.others += curr.othersCol;
            acc.pc += curr.pcCol;
            acc.netClinic += curr.netClinicCol;
            acc.paidTotal += curr.paid_amount;
            return acc;
        }, { admFee: 0, lscs: 0, gb: 0, others_ot: 0, nvd: 0, dc: 0, cons: 0, o2neb: 0, dress: 0, others: 0, pc: 0, netClinic: 0, paidTotal: 0 });
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
                                <th>Adm. ID</th>
                                <th>Date</th>
                                <th>Patient Name</th>
                                <th>Service Taken</th>
                                <th class="text-right">Admission</th>
                                <th class="text-right">LSCS</th>
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
                            </tr>
                        </thead>
                        <tbody>
                            ${collectionReportData.map(inv => `
                                <tr>
                                    <td>${inv.admission_id}</td>
                                    <td>${inv.admission_date || inv.invoice_date}</td>
                                    <td class="font-bold">${inv.patient_name}</td>
                                    <td>${inv.subCategory || '-'}</td>
                                    <td class="text-right">৳${inv.admFeeCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.lscsCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.gbCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.othersOtCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.nvdCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.dcCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.consCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.o2NebCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.dressCol.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.othersCol.toLocaleString()}</td>
                                    <td class="text-right font-bold">৳${inv.paid_amount.toLocaleString()}</td>
                                    <td class="text-right bg-rose-50 text-rose-800">৳${inv.pcCol.toLocaleString()}</td>
                                    <td class="text-right font-black bg-emerald-50 text-emerald-800">৳${inv.netClinicCol.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="bg-gray-100 font-black">
                            <tr>
                                <td colspan="4" class="text-right">Grand Totals:</td>
                                <td class="text-right">৳${reportTotals.admFee.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.lscs.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.gb.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.others_ot.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.nvd.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.dc.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.cons.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.o2neb.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.dress.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.others.toLocaleString()}</td>
                                <td class="text-right">৳${reportTotals.paidTotal.toLocaleString()}</td>
                                <td class="text-right text-rose-700">৳${reportTotals.pc.toLocaleString()}</td>
                                <td class="text-right text-emerald-700">৳${reportTotals.netClinic.toLocaleString()}</td>
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
        const dayInvoices = invoices.filter((inv: any) => inv.invoice_date === date);
        const totalExp = expenses.reduce((s, i) => s + i.paidAmount, 0);
        const totalInvPaid = dayInvoices.reduce((s, i) => s + i.paid_amount, 0);

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
                                <th style="width: 40%">Patient Name</th>
                                <th style="width: 20%" class="text-right">Total Bill</th>
                                <th style="width: 20%" class="text-right">Paid Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dayInvoices.length > 0 ? dayInvoices.map(inv => `
                                <tr>
                                    <td class="font-mono text-xs">${inv.daily_id}</td>
                                    <td class="font-bold uppercase">${inv.patient_name}</td>
                                    <td class="text-right font-medium">৳${inv.total_bill.toLocaleString()}</td>
                                    <td class="text-right font-black text-emerald-700">৳${inv.paid_amount.toLocaleString()}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" class="text-center italic py-4 text-gray-500">No patient invoices for this day.</td></tr>'}
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td colspan="3" class="text-right font-black uppercase">Total Billing (Cash):</td>
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
                                <thead><tr class="bg-gray-100"><th>Category</th><th class="text-right">Amount</th></tr></thead>
                                <tbody>
                                    <tr><td>Admission Fee</td><td class="text-right">৳${currentData.collectionByCategory.admFee.toLocaleString()}</td></tr>
                                    <tr><td>Oxygen / Nebulization</td><td class="text-right">৳${currentData.collectionByCategory.oxygen.toLocaleString()}</td></tr>
                                    <tr><td>Conservative Treatment</td><td class="text-right">৳${currentData.collectionByCategory.conservative.toLocaleString()}</td></tr>
                                    <tr><td>Normal Delivery (NVD)</td><td class="text-right">৳${currentData.collectionByCategory.nvd.toLocaleString()}</td></tr>
                                    <tr><td>D&C / Minor Surgery</td><td class="text-right">৳${currentData.collectionByCategory.dc.toLocaleString()}</td></tr>
                                    <tr><td>LSCS / Major Surgery</td><td class="text-right">৳${currentData.collectionByCategory.lscs.toLocaleString()}</td></tr>
                                    <tr><td>GB (Gallbladder) OT</td><td class="text-right">৳${currentData.collectionByCategory.gb_ot.toLocaleString()}</td></tr>
                                    <tr><td>Others OT / Services</td><td class="text-right">৳${currentData.collectionByCategory.others_ot.toLocaleString()}</td></tr>
                                    <tr><td>Dressing</td><td class="text-right">৳${currentData.collectionByCategory.dressing.toLocaleString()}</td></tr>
                                    <tr><td>Miscellaneous (Others)</td><td class="text-right">৳${currentData.collectionByCategory.others.toLocaleString()}</td></tr>
                                    <tr class="italic text-gray-600"><td>Due Recovery (বকেয়া আদায়)</td><td class="text-right">৳${dueRecov.toLocaleString()}</td></tr>
                                </tbody>
                                <tfoot class="bg-blue-50 font-black">
                                    <tr><td>Total Revenue (A)</td><td class="text-right text-lg">৳${currentData.totalCollection.toLocaleString()}</td></tr>
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
                    <button onClick={() => setViewMode('daily_summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'daily_summary' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Daily Summary</button>
                    <button onClick={() => setViewMode('summary')} className={`px-6 py-2 rounded-md font-bold text-xs uppercase transition-all whitespace-nowrap ${viewMode === 'summary' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Monthly Summary</button>
                </div>
            </header>

            <main className="flex-1 w-full px-4 sm:px-6 py-8 space-y-8">
                {viewMode === 'detailed' && (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <DailyExpenseForm 
                            selectedDate={selectedDate} 
                            onDateChange={setSelectedDate} 
                            items={detailedExpenses[selectedDate] || []} 
                            onSave={handleSave} 
                            onPrint={handlePrintDailyJournal}
                            employees={employees} 
                        />
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                            <h3 className="text-lg font-black text-sky-400 uppercase mb-6 flex justify-between items-center">
                                <span>Indoor Invoices Journal</span>
                                <input type="text" placeholder="Search Patient..." value={invoiceSearch} onChange={e=>setInvoiceSearch(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-full px-5 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-500 w-64"/>
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-700">
                                <table className="w-full text-left text-sm"><thead className="bg-slate-950 text-slate-500 text-[10px] uppercase font-black"><tr><th className="p-4">ID</th><th className="p-4">Patient Name</th><th className="p-4 text-right">Total Bill</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Due</th></tr></thead>
                                <tbody className="divide-y divide-slate-800">{invoices.filter((inv:any)=>inv.patient_name.toLowerCase().includes(invoiceSearch.toLowerCase()) && inv.invoice_date === selectedDate).map((inv:any) => (<tr key={inv.daily_id} className="hover:bg-slate-700/40 transition-colors"><td className="p-4 font-mono text-cyan-400 text-xs">{inv.daily_id}</td><td className="p-4 font-bold">{inv.patient_name}</td><td className="p-4 text-right">৳{inv.total_bill.toLocaleString()}</td><td className="p-4 text-right text-emerald-400 font-bold">৳{inv.paid_amount.toLocaleString()}</td><td className="p-4 text-right text-rose-500 font-bold">৳{inv.due_bill.toLocaleString()}</td></tr>))}</tbody></table>
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
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsTodayFilter(true)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${isTodayFilter ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'}`}>Today's Collection</button>
                                        <button onClick={() => setIsTodayFilter(false)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!isTodayFilter ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'}`}>Monthly View</button>
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

                            {/* TABLE: Occupational width is now full for screen */}
                            <div className="overflow-x-auto min-h-[500px] border border-slate-700 rounded-xl bg-slate-950/20 shadow-inner w-full">
                                <table className="w-full text-left text-[11px] border-collapse min-w-[1500px]">
                                    <thead className="bg-slate-900/80 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">
                                        <tr>
                                            <th className="p-3 whitespace-nowrap">Adm. ID</th>
                                            <th className="p-3 whitespace-nowrap">Date</th>
                                            <th className="p-3 whitespace-nowrap">Patient Name</th>
                                            <th className="p-3 whitespace-nowrap">Service Taken</th>
                                            <th className="p-3 text-right">Admission</th>
                                            <th className="p-3 text-right">LSCS</th>
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {collectionReportData.length > 0 ? collectionReportData.map((inv: any) => (
                                            <tr key={inv.daily_id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 font-mono text-sky-500 border-r border-slate-800/50">{inv.admission_id}</td>
                                                <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{inv.admission_date || inv.invoice_date}</td>
                                                <td className="p-3 font-black text-slate-200 border-r border-slate-800/50 uppercase whitespace-nowrap">{inv.patient_name}</td>
                                                <td className="p-3 text-sky-400 font-bold border-r border-slate-800/50 truncate max-w-[120px]" title={inv.subCategory}>{inv.subCategory || '-'}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.admFeeCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.lscsCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.gbCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.othersOtCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.nvdCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.dcCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.consCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.o2NebCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.dressCol.toLocaleString()}</td>
                                                <td className="p-3 text-right border-r border-slate-800/50">৳${inv.othersCol.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-emerald-400 bg-emerald-900/10">৳ {inv.paid_amount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-rose-400 bg-rose-900/10 border-l-2 border-rose-800/30">৳ {inv.pcCol.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-sky-300 bg-blue-900/10 border-l-2 border-blue-800/30">৳ {inv.netClinicCol.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={17} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-xl tracking-[0.2em]">No Collection Records Found</td></tr>
                                        )}
                                    </tbody>
                                    {collectionReportData.length > 0 && (
                                        <tfoot className="bg-slate-900 text-slate-200 font-black border-t-2 border-slate-700 sticky bottom-0">
                                            <tr>
                                                <td colSpan={4} className="p-4 text-right uppercase tracking-widest text-[11px]">Grand Summary Totals:</td>
                                                <td className="p-4 text-right">৳${reportTotals.admFee.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.lscs.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.gb.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.others_ot.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.nvd.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.dc.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.cons.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.o2neb.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.dress.toLocaleString()}</td>
                                                <td className="p-4 text-right">৳${reportTotals.others.toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-400 text-lg">৳ {reportTotals.paidTotal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-rose-400 text-lg">৳ {reportTotals.pc.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sky-400 text-2xl underline decoration-double">৳ {reportTotals.netClinic.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
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
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Admission Fee:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.admFee.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Oxygen / Nebulization:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.oxygen.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Conservative Treatment:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.conservative.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Normal Delivery (NVD):</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.nvd.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>D&C / Minor Surgery:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.dc.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>LSCS / Major Surgery:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.lscs.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>GB (Gallbladder) OT:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.gb_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Others OT / Services:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.others_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Dressing:</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.dressing.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Miscellaneous (Others):</span> <span className="font-black">৳${dailySummaryData.collectionByCategory.others.toLocaleString()}</span></div>
                                    <div className="flex justify-between italic text-slate-400 pb-1"><span>Due Recovery (বকেয়া আদায়):</span> <span className="font-black">৳${dailySummaryData.dayDueRecov.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t-2 border-emerald-500/50 pt-3 text-white font-black"><span>Total Clinic Revenue:</span> <span>৳${dailySummaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Daily Operating Cost (B)</h3>
                                <div className="space-y-2 text-xs overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between border-b border-slate-700/30 pb-1"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span className="font-black">৳${(dailySummaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg border-t-2 border-rose-500/50 pt-3 text-white font-black mt-2"><span>Total Expense:</span> <span>৳${dailySummaryData.totalExpense.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-10 no-print">
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-10 rounded-[3rem] text-center shadow-2xl border-2 border-amber-500/20 scale-110">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Daily Net Profit/Loss (A - B)</p>
                                <h4 className={`text-5xl font-black ${dailySummaryData.balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳${dailySummaryData.balance.toLocaleString()}</h4>
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
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Admission Fee:</span> <span className="font-black">৳${summaryData.collectionByCategory.admFee.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Oxygen / Nebulization:</span> <span className="font-black">৳${summaryData.collectionByCategory.oxygen.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Conservative Treatment:</span> <span className="font-black">৳${summaryData.collectionByCategory.conservative.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Normal Delivery (NVD):</span> <span className="font-black">৳${summaryData.collectionByCategory.nvd.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>D&C / Minor Surgery:</span> <span className="font-black">৳${summaryData.collectionByCategory.dc.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>LSCS / Major Surgery:</span> <span className="font-black">৳${summaryData.collectionByCategory.lscs.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>GB (Gallbladder) OT:</span> <span className="font-black">৳${summaryData.collectionByCategory.gb_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Others OT / Services:</span> <span className="font-black">৳${summaryData.collectionByCategory.others_ot.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Dressing:</span> <span className="font-black">৳${summaryData.collectionByCategory.dressing.toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b border-slate-700/30 pb-1"><span>Miscellaneous (Others):</span> <span className="font-black">৳${summaryData.collectionByCategory.others.toLocaleString()}</span></div>
                                    <div className="flex justify-between italic text-slate-400 pb-1"><span>Due Recovery (বকেয়া আদায়):</span> <span className="font-black">৳${summaryData.monthDueRecov.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xl border-t-2 border-blue-500/50 pt-3 text-white font-black"><span>Total Clinic Revenue:</span> <span>৳${summaryData.totalCollection.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                <h3 className="text-rose-400 font-black uppercase text-sm mb-4 border-b border-slate-700 pb-2">Monthly Operating Cost (B)</h3>
                                <div className="space-y-2 text-xs overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                                    {clinicExpenseCategories.map(cat => (
                                        <div key={cat} className="flex justify-between border-b border-slate-700/30 pb-1"><span>{expenseCategoryBanglaMap[cat] || cat}:</span> <span className="font-black">৳${(summaryData.expensesByCategory[cat] || 0).toLocaleString()}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg border-t-2 border-rose-500/50 pt-3 text-white font-black mt-2"><span>Total Expense:</span> <span>৳${summaryData.totalExpense.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-10 no-print">
                            <div className="bg-gradient-to-br from-indigo-700 to-slate-900 p-10 rounded-[3rem] text-center shadow-2xl border-2 border-white/10 scale-110">
                                <p className="text-slate-400 text-xs font-black uppercase mb-2">Monthly Net Profit (A - B)</p>
                                <h4 className={`text-5xl font-black ${summaryData.balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳${summaryData.balance.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClinicAccountsPage;