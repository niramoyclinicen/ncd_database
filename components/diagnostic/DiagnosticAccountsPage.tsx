
import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice as Invoice, DueCollection, ExpenseItem, Employee, testCategories, Reagent } from '../DiagnosticData';
import { Activity, BackIcon, FileTextIcon, SearchIcon, PrinterIcon, SaveIcon, DatabaseIcon } from '../Icons';
import { formatDateTime } from '../../utils/dateUtils';

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

const subCategoryMap: Record<string, string[]> = {
    'House rent': ['Diagnostic Building Rent'],
    'Bills': ['Electricity bill', 'Dish Bill', 'Paper Bill'],
    'Reagent buy': ['Local Market', 'Company Delivery', 'Special Order'],
    'Doctor donation': ['Monthly Referral Pay', 'Festival Bonus'],
    'Repair/Instruments': ['Lab Equipment', 'IT/Computer', 'Furniture'],
    'Diagnostic development': ['New Test Marketing', 'Branding'],
    'Others': ['Entertainment', 'Donation', 'Emergency']
};

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

// --- Specialized Reagent Module Component ---
interface ReagentItem {
    id: string; 
    name: string; 
    company: string; 
    expiryDate: string; 
    volume: string;      
    testCapacity: string; 
    unitPrice: number; 
    qty: number; 
    total: number;
}

const ReagentPurchaseModule: React.FC<any> = ({ onSave, onCancel, employees, editData }) => {
    const [invNo, setInvNo] = useState(editData?.metadata?.invNo || `INV-REG-${Date.now().toString().slice(-6)}`);
    const [purchasedBy, setPurchasedBy] = useState(editData?.subCategory || '');
    const [purchaseDate, setPurchaseDate] = useState(editData?.metadata?.date || new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ReagentItem[]>(editData?.metadata?.items || []);
    const [discount, setDiscount] = useState(editData?.metadata?.discount || 0);
    const [paid, setPaid] = useState(editData?.paidAmount || 0);
    
    const [tempItem, setTempItem] = useState<Partial<ReagentItem>>({ 
        name: '', company: '', expiryDate: '', volume: '', testCapacity: '', unitPrice: 0, qty: 1 
    });

    const addItem = () => {
        if (!tempItem.name) return;
        const newItem = { 
            ...tempItem, 
            id: Date.now().toString(), 
            total: (tempItem.unitPrice || 0) * (tempItem.qty || 1) 
        } as ReagentItem;
        setItems([...items, newItem]);
        setTempItem({ name: '', company: '', expiryDate: '', volume: '', testCapacity: '', unitPrice: 0, qty: 1 });
    };

    const subTotal = items.reduce((s, i) => s + i.total, 0);
    const netPayable = subTotal - discount;
    const due = netPayable - paid;

    const handlePost = () => {
        if (!purchasedBy) return alert("কে ক্রয় করেছেন তা সিলেক্ট করুন।");
        if (items.length === 0) return alert("পণ্য যোগ করুন।");
        
        let summaryDesc = `Items: ${items.map(i => `${i.name} (${i.volume})`).join(', ')}`;
        if (editData) summaryDesc += ` (Edited on: ${formatDateTime(new Date())})`;

        onSave({
            id: editData?.id || Date.now(), 
            category: 'Reagent buy', 
            subCategory: purchasedBy, 
            description: summaryDesc,
            billAmount: netPayable, 
            paidAmount: paid,
            metadata: { invNo, items, discount, date: purchaseDate }
        });
    };

    return (
        <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl animate-fade-in mb-8 no-print">
            <div className="p-5 bg-emerald-900/20 border-b border-emerald-500/20 flex justify-between items-center text-white font-black uppercase">
                <span className="flex items-center gap-2"><DatabaseIcon size={18}/> {editData ? 'Edit Reagent Bill' : 'Advanced Reagent Purchase'}</span>
                <button onClick={onCancel} className="text-2xl hover:text-rose-500 transition-colors">&times;</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Invoice No</label>
                    <input value={invNo} onChange={e=>setInvNo(e.target.value)} placeholder="Inv No" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold"/>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Purchased By</label>
                    <select value={purchasedBy} onChange={e=>setPurchasedBy(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">-- Select --</option>
                        {employees.filter((e:any)=>e.is_current_month).map((e:any)=><option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Purchase Date</label>
                    <input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
            </div>

            <div className="p-6 bg-slate-950/60 mx-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Reagent Name</label>
                        <input placeholder="Item Name" value={tempItem.name} onChange={e=>setTempItem({...tempItem, name:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Company</label>
                        <input placeholder="Company" value={tempItem.company} onChange={e=>setTempItem({...tempItem, company:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Expiry Date</label>
                        <input type="date" value={tempItem.expiryDate} onChange={e=>setTempItem({...tempItem, expiryDate:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-black"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Volume/Size</label>
                        <input placeholder="e.g. 500ml" value={tempItem.volume} onChange={e=>setTempItem({...tempItem, volume:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Expected Tests</label>
                        <input placeholder="e.g. 250 Tests" value={tempItem.testCapacity} onChange={e=>setTempItem({...tempItem, testCapacity:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Unit Price</label>
                        <input type="number" placeholder="Price" value={tempItem.unitPrice || ''} onChange={e=>setTempItem({...tempItem, unitPrice:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold text-center"/>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Qty</label>
                        <input type="number" placeholder="Quantity" value={tempItem.qty || ''} onChange={e=>setTempItem({...tempItem, qty:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold text-center"/>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button onClick={addItem} className="w-full h-[50px] bg-emerald-600 text-white font-black uppercase text-xs rounded-xl hover:bg-emerald-500 shadow-xl transition-all">+ Add Item</button>
                    </div>
                </div>

                <div className="mt-4 max-h-40 overflow-y-auto border-t border-slate-800 pt-3 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-slate-500 text-[10px] font-black uppercase border-b border-slate-800">
                            <tr><th className="pb-2">Description</th><th className="pb-2 text-center">Tests</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {items.map(i=>(
                                <tr key={i.id} className="text-white">
                                    <td className="py-2 font-bold text-slate-100">
                                        <div>{i.name}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">{i.company} | Size: {i.volume} | Exp: {i.expiryDate}</div>
                                    </td>
                                    <td className="py-2 text-center text-sky-400 font-black text-xs">{i.testCapacity}</td>
                                    <td className="py-2 text-right font-mono text-slate-300">{i.unitPrice.toFixed(2)}</td>
                                    <td className="py-2 text-center text-white">{i.qty}</td>
                                    <td className="py-2 text-right font-black text-emerald-400">৳{i.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex gap-10">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Sub-Total</p>
                        <p className="text-white font-black text-xl">৳{subTotal.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Discount</p>
                        <input type="number" value={discount} onChange={e=>setDiscount(parseFloat(e.target.value)||0)} className="w-20 bg-slate-800 border border-slate-700 rounded-lg text-right text-white text-sm font-bold p-1 outline-none focus:border-blue-500"/>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-2xl">
                        <div className="flex justify-between items-center text-sky-400 font-black uppercase text-xs"><span>Net Payable:</span><span className="text-2xl tracking-tighter">৳{netPayable.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center text-emerald-500 font-black uppercase text-xs"><span>Amount Paid:</span><input type="number" value={paid} onChange={e=>setPaid(parseFloat(e.target.value)||0)} className="w-28 bg-slate-800 border border-slate-700 rounded-lg text-right text-white font-black p-2 text-lg shadow-inner focus:border-emerald-500 outline-none"/></div>
                        <div className="flex justify-between items-center text-rose-500 font-black uppercase text-xs"><span>Current Due:</span><span className="text-2xl tracking-tighter">৳{due.toLocaleString()}</span></div>
                    </div>
                    <button onClick={handlePost} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs py-4 rounded-2xl shadow-2xl transition-all transform active:scale-95 tracking-widest">{editData ? 'Update Bill' : 'Post Reagent Bill'}</button>
                </div>
            </div>
        </div>
    );
};

// --- Simple SVG Pie Chart Component ---
const SimplePieChart = ({ data, title }: { data: { label: string, value: number, color: string }[], title: string }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    let currentPercent = 0;

    const slices = data.map((d, i) => {
        if (total === 0) return null;
        const percent = d.value / total;
        const startX = Math.cos(2 * Math.PI * currentPercent);
        const startY = Math.sin(2 * Math.PI * currentPercent);
        currentPercent += percent;
        const endX = Math.cos(2 * Math.PI * currentPercent);
        const endY = Math.sin(2 * Math.PI * currentPercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
        ].join(' ');
        return <path key={i} d={pathData} fill={d.color} stroke="white" strokeWidth="0.01" />;
    });

    return (
        <div className="flex flex-col items-center p-4 bg-slate-800/30 border border-slate-700 rounded-2xl">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">{title}</h5>
            <div className="relative w-32 h-32 mb-4">
                <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                    {total === 0 ? <circle cx="0" cy="0" r="1" fill="#1e293b" /> : slices}
                </svg>
            </div>
            <div className="w-full space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                {data.filter(d => d.value > 0).map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span className="truncate w-20">{d.label}</span>
                        </div>
                        <span className="text-white">{Math.round((d.value/total)*100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

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
    const [reagentMode, setReagentMode] = useState(false);
    const [editingReagent, setEditingReagent] = useState<any>(null);

    useEffect(() => {
        setItems(dailyExpenseItems.length > 0 ? dailyExpenseItems : [{
            id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0
        }]);
    }, [dailyExpenseItems, selectedDate]);

    useEffect(() => {
        const handleEdit = (e: any) => { if(e.detail?.category === 'Reagent buy') { setEditingReagent(e.detail); setReagentMode(true); } };
        window.addEventListener('edit-reagent-entry', handleEdit);
        return () => window.removeEventListener('edit-reagent-entry', handleEdit);
    }, []);

    const handleItemChange = (id: number, field: keyof ExpenseItem, value: any) => {
        if (field === 'category' && value === 'Reagent buy') {
            setEditingReagent(null); setReagentMode(true); return;
        }
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSaveReagent = (reagentExp: ExpenseItem) => {
        let updated;
        if (editingReagent) updated = items.map(i => i.id === editingReagent.id ? reagentExp : i);
        else updated = [...items, reagentExp];
        setItems(updated);
        onSave(selectedDate, updated);
        setReagentMode(false); setEditingReagent(null);
    };

    const addItem = () => setItems(prev => [...prev, { id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0 }]);
    const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

    const totalPaid = items.reduce((acc, item) => acc + (Number(item.paidAmount) || 0), 0);

    return (
        <div className="space-y-4">
            {reagentMode && <ReagentPurchaseModule onCancel={()=>{setReagentMode(false); setEditingReagent(null);}} onSave={handleSaveReagent} employees={employees} editData={editingReagent}/>}
            
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
    const [detailCategory, setDetailCategory] = useState('All');
    const [detailSearch, setDetailSearch] = useState('');
    const [dueSearch, setDueSearch] = useState('');
    const [entrySearch, setEntrySearch] = useState('');
    const [entryCategoryFilter, setEntryCategoryFilter] = useState('All');
    const [successMessage, setSuccessMessage] = useState('');
    const [isTodayDetailView, setIsTodayDetailView] = useState(false);

    useEffect(() => {
        if (successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); }
    }, [successMessage]);

    // NEW: Sync reagents with expense saving
    const handleSaveExpense = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => ({ ...prev, [date]: items }));
        
        // SYNC STOCK LOGIC
        if (setReagents) {
            setReagents((prevStock: Reagent[]) => {
                let newStock = [...prevStock];
                items.forEach(exp => {
                    if (exp.category === 'Reagent buy' && exp.metadata?.items) {
                        exp.metadata.items.forEach((boughtItem: any) => {
                            const idx = newStock.findIndex(r => r.reagent_name.toLowerCase().trim() === boughtItem.name.toLowerCase().trim());
                            if (idx >= 0) {
                                // Update existing
                                newStock[idx] = {
                                    ...newStock[idx],
                                    quantity: newStock[idx].quantity + boughtItem.qty,
                                    expiry_date: boughtItem.expiryDate, 
                                    company: boughtItem.company,
                                    capacity_per_unit: boughtItem.testCapacity,
                                    unit: boughtItem.volume
                                };
                            } else {
                                // Add new
                                newStock.push({
                                    reagent_id: `REG-${Date.now()}-${Math.random().toString(36).slice(-3)}`,
                                    reagent_name: boughtItem.name,
                                    quantity: boughtItem.qty,
                                    unit: boughtItem.volume,
                                    availability: true,
                                    expiry_date: boughtItem.expiryDate,
                                    company: boughtItem.company,
                                    capacity_per_unit: boughtItem.testCapacity
                                });
                            }
                        });
                    }
                });
                return newStock;
            });
        }

        setSuccessMessage("Expense data & Stock synced successfully!");
    };

    const filteredSavedEntries = useMemo(() => {
        const rawEntries = detailedExpenses[selectedDate] || [];
        return rawEntries.filter((ex: any) => {
            const matchesCategory = entryCategoryFilter === 'All' || ex.category === entryCategoryFilter;
            const searchTermLower = entrySearch.toLowerCase();
            const matchesSearch = 
                ex.category.toLowerCase().includes(searchTermLower) || 
                ex.subCategory.toLowerCase().includes(searchTermLower) || 
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
                        const val = (item.price * item.quantity);
                        const ratio = inv.total_amount > 0 ? (inv.paid_amount / inv.total_amount) : 0;
                        const paidVal = val * ratio;
                        if (testName.includes('usg') || testName.includes('ultra')) coll.usg += paidVal;
                        else if (testName.includes('x-ray') || testName.includes('xray')) coll.xray += paidVal;
                        else if (testName.includes('ecg')) coll.ecg += paidVal;
                        else if (testName.includes('hormone') || ['tsh','t3','t4'].some(k=>testName.includes(k))) coll.hormone += paidVal;
                        else coll.pathology += paidVal;
                    });
                }
            });

            dueCollections.forEach((dc: any) => {
                if (isMatch(dc.collection_date) && dc.invoice_id.startsWith('INV')) {
                    coll.dueRecov += dc.amount_collected;
                }
            });

            const exp = { total: 0 };
            const expenseMap: Record<string, number> = {};
            expenseCategories.forEach(c => expenseMap[c] = 0);

            Object.entries(detailedExpenses).forEach(([date, items]: any) => {
                if (isMatch(date)) {
                    items.forEach((it: any) => {
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

    const detailTableData = useMemo(() => {
        const results = invoices.filter((inv: any) => {
            if (isTodayDetailView) return inv.invoice_date === todayStr;
            const d = new Date(inv.invoice_date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }).filter((inv: any) => {
            const matchesSearch = inv.patient_name.toLowerCase().includes(detailSearch.toLowerCase()) || 
                                 inv.invoice_date.includes(detailSearch);
            if (detailCategory === 'All') return matchesSearch;
            const hasCategoryTest = inv.items.some((item: any) => {
                const test = (item.test_name || '').toLowerCase();
                if (detailCategory === 'Pathology') return !['usg', 'ultra', 'x-ray', 'xray', 'ecg', 'hormone'].some(k => test.includes(k));
                if (detailCategory === 'Hormone') return (test.includes('hormone') || ['tsh','t3','t4'].some(k => test.includes(k)));
                if (detailCategory === 'Ultrasonography') return (test.includes('usg') || test.includes('ultra'));
                if (detailCategory === 'X-Ray') return (test.includes('x-ray') || test.includes('xray'));
                if (detailCategory === 'ECG') return test.includes('ecg');
                return true;
            });
            return hasCategoryTest && matchesSearch;
        }).map((inv: any) => ({
            date: inv.invoice_date,
            patient: inv.patient_name,
            referrer: inv.referrar_name || 'Self',
            tests: inv.items.map((it: any) => it.test_name).join(', '),
            totalBill: inv.total_amount,
            discount: inv.discount_amount,
            paid: inv.paid_amount,
            pc: inv.special_commission || 0,
            balance: inv.due_amount
        })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const grouped: Record<string, any[]> = {};
        results.forEach((row: any) => {
            if (!grouped[row.date]) grouped[row.date] = [];
            grouped[row.date].push(row);
        });
        return grouped;
    }, [invoices, detailCategory, detailSearch, selectedMonth, selectedYear, isTodayDetailView, todayStr]);

    const dueList = useMemo(() => {
        return invoices.filter((inv: any) => 
            inv.due_amount > 1 && 
            (inv.patient_name.toLowerCase().includes(dueSearch.toLowerCase()) || inv.invoice_id.toLowerCase().includes(dueSearch.toLowerCase()))
        ).sort((a: any, b: any) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [invoices, dueSearch]);

    const handlePrintSummary = (currentStats: any, rangeLabel: string) => {
        const win = window.open('', '_blank');
        if(!win) return;
        const html = `
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@page { size: A4; margin: 20mm; } body { background: white; font-family: serif; color: black; }</style>
                </head>
                <body class="p-10">
                    <div class="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm">Summary Report: ${rangeLabel}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10">
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-sm">Collection</h3>
                            <table class="w-full text-xs">
                                <tr><td>Pathology</td><td class="text-right">${currentStats.coll.pathology.toLocaleString()}</td></tr>
                                <tr><td>Hormone</td><td class="text-right">${currentStats.coll.hormone.toLocaleString()}</td></tr>
                                <tr><td>USG</td><td class="text-right">${currentStats.coll.usg.toLocaleString()}</td></tr>
                                <tr><td>X-Ray</td><td class="text-right">${currentStats.coll.xray.toLocaleString()}</td></tr>
                                <tr><td>ECG</td><td class="text-right">${currentStats.coll.ecg.toLocaleString()}</td></tr>
                                <tr><td>Due Recovery</td><td class="text-right">${currentStats.coll.dueRecov.toLocaleString()}</td></tr>
                                <tr class="font-bold border-t border-black"><td>Total</td><td class="text-right">${currentStats.totalColl.toLocaleString()}</td></tr>
                            </table>
                        </div>
                        <div>
                            <h3 class="font-bold border-b border-black mb-2 uppercase text-sm">Expenses</h3>
                            <table class="w-full text-xs">
                                ${expenseCategories.map(cat => `<tr><td>${expenseCategoryBanglaMap[cat] || cat}</td><td class="text-right">৳${(currentStats.expenseMap[cat] || 0).toLocaleString()}</td></tr>`).join('')}
                                <tr class="font-bold border-t border-black"><td>Total</td><td class="text-right">${currentStats.exp.total.toLocaleString()}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="mt-12 p-6 border-4 border-black flex justify-between items-center">
                        <span class="text-xl font-black uppercase">Net Balance:</span>
                        <span class="text-3xl font-black">৳${currentStats.balance.toLocaleString()}</span>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const handlePrintDetail = (data: Record<string, any[]>, label: string) => {
        const win = window.open('', '_blank');
        if(!win) return;
        const html = `
            <html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 bg-white text-black font-serif">
                <div class="text-center mb-6 border-b-2 border-black pb-4">
                    <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                    <p class="text-sm">Detailed Collection Journal - ${label}</p>
                </div>
                <table class="w-full text-[10pt] border-collapse border border-black">
                    <thead><tr class="bg-gray-100"><th class="border border-black p-2">Date</th><th className="border border-black p-2">Patient</th><th className="border border-black p-2">Tests</th><th className="border border-black p-2 text-right">Bill</th><th className="border border-black p-2 text-right">Paid</th><th className="border border-black p-2 text-right">Due</th></tr></thead>
                    <tbody>${Object.entries(data).map(([date, rows]) => rows.map((r, i) => `<tr>${i === 0 ? `<td class="border border-black p-2 font-bold" rowspan="${rows.length}">${date}</td>` : ''}<td class="border border-black p-2">${r.patient}</td><td class="border border-black p-2 italic text-[9pt]">${r.tests}</td><td class="border border-black p-2 text-right">${r.totalBill}</td><td class="border border-black p-2 text-right font-bold">${r.paid}</td><td class="border border-black p-2 text-right">${r.balance}</td></tr>`).join('')).join('')}</tbody>
                </table>
            </body></html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

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
                        { id: 'yearly', label: 'Yearly Hishab' },
                        { id: 'detail', label: 'Collection Detail' },
                        { id: 'due', label: 'Due List' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {activeTab === 'entry' && (
                    <div className="space-y-6">
                        <DailyExpenseForm selectedDate={selectedDate} onDateChange={setSelectedDate} dailyExpenseItems={detailedExpenses[selectedDate] || []} onSave={handleSaveExpense} employees={employees} />
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-lg font-black text-white uppercase mb-4">Saved Entries for {selectedDate}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="text-xs text-slate-500 uppercase font-black border-b border-slate-700"><th className="p-3">Category</th><th className="p-3">Description</th><th className="p-3 text-right">Amount</th></tr></thead>
                                    <tbody>
                                        {filteredSavedEntries.map((ex: any) => (
                                            <tr key={ex.id} className="border-b border-slate-800 hover:bg-slate-750">
                                                <td className="p-3 font-bold text-slate-300">{ex.category}</td>
                                                <td className="p-3 text-slate-400">{ex.description}</td>
                                                <td className="p-3 text-right font-black text-rose-400">{ex.paidAmount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                                <button onClick={() => handlePrintSummary(stats[activeTab], activeTab)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black uppercase text-xs shadow-lg flex items-center gap-2"><PrinterIcon size={14}/> Print Summary</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <SummaryBox title="Collection Analysis" colorClass="text-emerald-400" totalLabel="Total Collection" totalValue={stats[activeTab].totalColl} items={[{ label: 'Pathology', value: stats[activeTab].coll.pathology }, { label: 'Hormone', value: stats[activeTab].coll.hormone }, { label: 'USG', value: stats[activeTab].coll.usg }, { label: 'X-Ray', value: stats[activeTab].coll.xray }, { label: 'ECG', value: stats[activeTab].coll.ecg }, { label: 'Due Recovery', value: stats[activeTab].coll.dueRecov }]} />
                            <SummaryBox title="Expense Analysis" colorClass="text-rose-400" totalLabel="Total Expense" totalValue={stats[activeTab].exp.total} items={expenseCategories.slice(0, 8).map(c => ({ label: expenseCategoryBanglaMap[c] || c, value: stats[activeTab].expenseMap[c] }))} />
                            <div className="flex flex-col gap-6">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 p-8 rounded-[2.5rem] text-center shadow-2xl">
                                    <p className="text-slate-500 text-xs font-black uppercase mb-2">Net Cash Balance</p>
                                    <h4 className={`text-4xl font-black ${stats[activeTab].balance >= 0 ? 'text-green-400' : 'text-rose-500'}`}>৳ {stats[activeTab].balance.toLocaleString()}</h4>
                                </div>
                                <SimplePieChart title="Expense Distribution" data={expenseCategories.map((c, idx) => ({ label: expenseCategoryBanglaMap[c] || c, value: stats[activeTab].expenseMap[c], color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'][idx % 8] }))} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'detail' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 no-print">
                            <div className="flex gap-4 items-center">
                                <h3 className="text-xl font-black text-white uppercase">Collection Detail Journal</h3>
                                <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                                    <button onClick={() => setIsTodayDetailView(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isTodayDetailView ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Today</button>
                                    <button onClick={() => setIsTodayDetailView(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isTodayDetailView ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Monthly</button>
                                </div>
                            </div>
                            <button onClick={() => handlePrintDetail(detailTableData, isTodayDetailView ? todayStr : `${monthOptions[selectedMonth].name} ${selectedYear}`)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-black uppercase text-xs shadow-lg flex items-center gap-2"><PrinterIcon size={14}/> Print Detail Log</button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-700 shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                                    <tr><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4">Tests</th><th className="p-4 text-right">Bill</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Due</th></tr>
                                </thead>
                                <tbody className="bg-slate-900/50">
                                    {Object.entries(detailTableData).map(([date, rows]) => (
                                        <React.Fragment key={date}>
                                            <tr className="bg-slate-800/50"><td colSpan={6} className="p-3 font-black text-sky-400 border-y border-slate-700">{date}</td></tr>
                                            {rows.map((r, i) => (
                                                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-4"></td><td className="p-4 font-bold text-slate-200 uppercase">{r.patient}</td><td className="p-4 text-slate-400 italic text-xs truncate max-w-[200px]" title={r.tests}>{r.tests}</td><td className="p-4 text-right text-slate-300">৳{r.totalBill.toLocaleString()}</td><td className="p-4 text-right font-black text-emerald-400">৳{r.paid.toLocaleString()}</td><td className="p-4 text-right font-black text-rose-500">৳{r.balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'due' && (
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">Diagnostic Outstanding Due List</h3>
                            <div className="relative w-64">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/><input value={dueSearch} onChange={e=>setDueSearch(e.target.value)} placeholder="Search Patient/ID..." className="w-full bg-slate-950 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none"/>
                            </div>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800"><tr><th className="pb-4">Date</th><th className="pb-4">Invoice ID</th><th className="pb-4">Patient Name</th><th className="pb-4 text-right">Bill</th><th className="pb-4 text-right">Paid</th><th className="pb-4 text-right">Balance Due</th></tr></thead>
                            <tbody className="divide-y divide-slate-800">
                                {dueList.map(d => (
                                    <tr key={d.invoice_id} className="hover:bg-slate-700/20 transition-colors"><td className="py-4 text-slate-400 font-mono text-xs">{d.invoice_date}</td><td className="py-4 font-black text-sky-400 text-xs">{d.invoice_id}</td><td className="py-4 font-black text-slate-200 uppercase">{d.patient_name}</td><td className="py-4 text-right font-bold text-slate-400">{d.total_amount.toLocaleString()}</td><td className="py-4 text-right font-bold text-emerald-500">{d.paid_amount.toLocaleString()}</td><td className="py-4 text-right font-black text-rose-500 text-lg">৳{d.due_amount.toLocaleString()}</td></tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                )}
            </main>
            {successMessage && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-3 rounded-2xl shadow-2xl font-black uppercase tracking-widest animate-fade-in-up z-[200]">{successMessage}</div>}
        </div>
    );
};

export default DiagnosticAccountsPage;
