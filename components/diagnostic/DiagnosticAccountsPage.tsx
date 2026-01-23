
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

const collectionSubMenus = ['All', 'Pathology', 'Hormone', 'Ultrasonography', 'X-Ray', 'ECG', 'Others'];

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
            
            {/* Header Data Row */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Invoice No</label>
                    <input value={invNo} onChange={e=>setInvNo(e.target.value)} placeholder="Inv No" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold"/>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Purchased By (ক্রয় করেছেন)</label>
                    <select value={purchasedBy} onChange={e=>setPurchasedBy(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">-- সিলেক্ট করুন --</option>
                        {employees.filter((e:any)=>e.is_current_month).map((e:any)=><option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase ml-1 mb-1">Purchase Date</label>
                    <input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
            </div>

            {/* Entry Form (Maintained in 3 Rows as requested) */}
            <div className="p-6 bg-slate-950/60 mx-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                {/* Row 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Reagent Name</label>
                        <input placeholder="Item Name" value={tempItem.name} onChange={e=>setTempItem({...tempItem, name:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Manufacturer / Company</label>
                        <input placeholder="Company" value={tempItem.company} onChange={e=>setTempItem({...tempItem, company:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Expiry Date</label>
                        <input type="date" value={tempItem.expiryDate} onChange={e=>setTempItem({...tempItem, expiryDate:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-black"/>
                    </div>
                </div>

                {/* Row 2: Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Volume / Size (e.g. 500ml)</label>
                        <input placeholder="e.g. 500ml / 1L" value={tempItem.volume} onChange={e=>setTempItem({...tempItem, volume:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Expected Tests (test count)</label>
                        <input placeholder="e.g. 250 Tests" value={tempItem.testCapacity} onChange={e=>setTempItem({...tempItem, testCapacity:e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold placeholder:text-slate-600"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Unit Buy Price</label>
                        <input type="number" placeholder="Price" value={tempItem.unitPrice || ''} onChange={e=>setTempItem({...tempItem, unitPrice:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold text-center"/>
                    </div>
                </div>

                {/* Row 3: Final Qty & Add Button */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Total Bottles/Packs</label>
                        <input type="number" placeholder="Quantity" value={tempItem.qty || ''} onChange={e=>setTempItem({...tempItem, qty:parseFloat(e.target.value)})} onFocus={e=>e.target.select()} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold text-center"/>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button onClick={addItem} className="w-full h-[50px] bg-emerald-600 text-white font-black uppercase text-xs rounded-xl hover:bg-emerald-500 shadow-xl transition-all">+ Add Item to Invoice</button>
                    </div>
                </div>

                {/* Item Listing Table */}
                <div className="mt-4 max-h-40 overflow-y-auto border-t border-slate-800 pt-3 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-slate-500 text-[10px] font-black uppercase border-b border-slate-800">
                            <tr>
                                <th className="pb-2">Description & Size</th>
                                <th className="pb-2 text-center">Tests</th>
                                <th className="pb-2 text-right">Price</th>
                                <th className="pb-2 text-center">Qty</th>
                                <th className="pb-2 text-right">Total</th>
                            </tr>
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

            {/* Calculations Area */}
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

    // Listen for Edit trigger from main list
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

    const resetFilters = () => {
        setSelectedDate(todayStr);
        setSelectedMonth(new Date().getMonth());
        setSelectedYear(new Date().getFullYear());
        setDetailSearch('');
        setDueSearch('');
        setDetailCategory('All');
        setEntrySearch('');
        setEntryCategoryFilter('All');
        setIsTodayDetailView(false);
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

    const todayCounts = useMemo(() => {
        const todayInvoices = invoices.filter((inv: any) => inv.invoice_date === todayStr);
        const counts: Record<string, number> = { All: todayInvoices.length, Pathology: 0, Hormone: 0, Ultrasonography: 0, 'X-Ray': 0, ECG: 0, Others: 0 };
        
        todayInvoices.forEach((inv: any) => {
            const testNames = inv.items.map((it: any) => (it.test_name || '').toLowerCase());
            if (testNames.some((t: string) => t.includes('usg') || t.includes('ultra'))) counts.Ultrasonography++;
            if (testNames.some((t: string) => t.includes('x-ray') || t.includes('xray'))) counts['X-Ray']++;
            if (testNames.some((t: string) => t.includes('ecg'))) counts.ECG++;
            if (testNames.some((t: string) => t.includes('hormone') || ['tsh','t3','t4'].some(k => t.includes(k)))) counts.Hormone++;
            const isSpecial = testNames.some((t: string) => ['usg', 'ultra', 'x-ray', 'xray', 'ecg', 'hormone', 'tsh', 't3', 't4'].some(k => t.includes(k)));
            if (!isSpecial && testNames.length > 0) counts.Pathology++;
            else if (isSpecial && testNames.length > 1) {
                if (testNames.some((t: string) => !['usg', 'ultra', 'x-ray', 'xray', 'ecg', 'hormone', 'tsh', 't3', 't4'].some(k => t.includes(k)))) {
                    counts.Pathology++;
                }
            }
        });
        return counts;
    }, [invoices, todayStr]);

    const stats = useMemo(() => {
        const getRangeStats = (rangeType: 'daily' | 'monthly' | 'yearly') => {
            const relevantInvoices = invoices.filter((inv: any) => {
                if (rangeType === 'daily') return inv.invoice_date === selectedDate;
                const d = new Date(inv.invoice_date);
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                return d.getFullYear() === selectedYear;
            });
            const relevantDueColls = dueCollections.filter((dc: any) => {
                const isDiag = dc.invoice_id.startsWith('INV-');
                if (rangeType === 'daily') return dc.collection_date === selectedDate && isDiag;
                const d = new Date(dc.collection_date);
                if (rangeType === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && isDiag;
                return d.getFullYear() === selectedYear && isDiag;
            });

            const coll = { pathology: 0, hormone: 0, usg: 0, xray: 0, ecg: 0, others: 0, dueRecov: 0 };
            relevantInvoices.forEach((inv: any) => {
                inv.items.forEach((item: any) => {
                    const testName = (item.test_name || '').toLowerCase();
                    const val = (item.price * item.quantity);
                    const ratio = inv.total_amount > 0 ? (inv.paid_amount / inv.total_amount) : 0;
                    const paidVal = val * ratio;
                    if (testName.includes('usg') || testName.includes('ultra')) coll.usg += paidVal;
                    else if (testName.includes('x-ray') || testName.includes('xray')) coll.xray += paidVal;
                    else if (testName.includes('ecg')) coll.ecg += paidVal;
                    else if (testName.includes('hormone') || testName.includes('tsh') || testName.includes('t3') || testName.includes('t4')) coll.hormone += paidVal;
                    else if (['hematology', 'biochemistry', 'clinical pathology', 'serology'].some(c => (inv.category || '').toLowerCase().includes(c)) || true) coll.pathology += paidVal;
                    else coll.others += paidVal;
                });
            });
            coll.dueRecov = relevantDueColls.reduce((s: any, c: any) => s + c.amount_collected, 0);

            const exp = { total: 0 };
            const expenseMap: Record<string, number> = {};
            expenseCategories.forEach(c => expenseMap[c] = 0);

            if (rangeType === 'daily') {
                (detailedExpenses[selectedDate] || []).forEach((it: any) => {
                    expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                    exp.total += it.paidAmount;
                });
            } else {
                Object.entries(detailedExpenses).forEach(([date, items]: any) => {
                    const d = new Date(date);
                    const isMonthMatch = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                    const isYearMatch = d.getFullYear() === selectedYear;
                    if ((rangeType === 'monthly' && isMonthMatch) || (rangeType === 'yearly' && isYearMatch)) {
                        items.forEach((it: any) => {
                            expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                            exp.total += it.paidAmount;
                        });
                    }
                });
            }

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
                                 inv.invoice_date.includes(detailSearch) ||
                                 inv.items.some((it: any) => it.test_name.toLowerCase().includes(detailSearch.toLowerCase()));
            if (detailCategory === 'All') return matchesSearch;
            const hasCategoryTest = inv.items.some((item: any) => {
                const test = (item.test_name || '').toLowerCase();
                if (detailCategory === 'Pathology') return !['usg', 'ultra', 'x-ray', 'xray', 'ecg', 'hormone'].some(k => test.includes(k));
                if (detailCategory === 'Hormone') return (test.includes('hormone') || ['tsh','t3','t4','ft3','ft4','prolactin'].some(k => test.includes(k)));
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
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const grouped: Record<string, any[]> = {};
        results.forEach(row => {
            if (!grouped[row.date]) grouped[row.date] = [];
            grouped[row.date].push(row);
        });
        return grouped;
    }, [invoices, detailCategory, detailSearch, selectedMonth, selectedYear, isTodayDetailView, todayStr]);

    const dueList = useMemo(() => {
        return invoices.filter((inv: any) => 
            inv.due_amount > 1 && 
            (inv.patient_name.toLowerCase().includes(dueSearch.toLowerCase()) || inv.invoice_id.toLowerCase().includes(dueSearch.toLowerCase()))
        ).sort((a,b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [invoices, dueSearch]);

    // --- PRINT FUNCTIONS (Standard A4 White Paper) ---
    const handlePrintSummary = (currentStats: any, rangeLabel: string) => {
        const win = window.open('', '_blank');
        if(!win) return;
        const html = `
            <html>
                <head>
                    <title>Summary Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 20mm; }
                        body { background: white; font-family: serif; color: black; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid black; padding: 6px 10px; text-align: left; font-size: 11pt; }
                        th { background: #f3f4f6; font-weight: bold; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                        .title { text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                    </div>
                    <div class="title">Diagnostic Accounts Summary: ${rangeLabel}</div>
                    
                    <h3>1. Collection Analysis</h3>
                    <table>
                        <thead><tr><th>Category</th><th class="text-right">Amount (৳)</th></tr></thead>
                        <tbody>
                            <tr><td>Pathology</td><td class="text-right">${currentStats.coll.pathology.toLocaleString()}</td></tr>
                            <tr><td>Hormone</td><td class="text-right">${currentStats.coll.hormone.toLocaleString()}</td></tr>
                            <tr><td>USG</td><td class="text-right">${currentStats.coll.usg.toLocaleString()}</td></tr>
                            <tr><td>X-Ray</td><td class="text-right">${currentStats.coll.xray.toLocaleString()}</td></tr>
                            <tr><td>ECG</td><td class="text-right">${currentStats.coll.ecg.toLocaleString()}</td></tr>
                            <tr><td>Due Recovery</td><td class="text-right">${currentStats.coll.dueRecov.toLocaleString()}</td></tr>
                            <tr class="font-bold bg-gray-100"><td>Total Collection</td><td class="text-right">${currentStats.totalColl.toLocaleString()}</td></tr>
                        </tbody>
                    </table>

                    <h3 class="mt-8">2. Expense Analysis</h3>
                    <table>
                        <thead><tr><th>Category</th><th class="text-right">Amount (৳)</th></tr></thead>
                        <tbody>
                            ${expenseCategories.map(cat => `<tr><td>${expenseCategoryBanglaMap[cat] || cat}</td><td class="text-right">${(currentStats.expenseMap[cat] || 0).toLocaleString()}</td></tr>`).join('')}
                            <tr class="font-bold bg-gray-100"><td>Total Expense</td><td class="text-right">${currentStats.exp.total.toLocaleString()}</td></tr>
                        </tbody>
                    </table>

                    <div class="mt-10 p-4 border-2 border-black">
                        <div class="flex justify-between font-bold text-xl">
                            <span>Net Balance:</span>
                            <span>${currentStats.balance.toLocaleString()} ৳</span>
                        </div>
                    </div>
                    <div class="mt-20 flex justify-between px-10">
                        <div class="border-t border-black w-40 text-center text-xs pt-1">Accountant</div>
                        <div class="border-t border-black w-40 text-center text-xs pt-1">Manager</div>
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
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@page { size: A4 landscape; margin: 10mm; }</style>
                </head>
                <body class="p-8 bg-white text-black font-serif">
                    <div class="text-center mb-6 border-b-2 border-black pb-4">
                        <h1 class="text-2xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm font-bold">Diagnostic Collection Detailed Log - ${label}</p>
                    </div>
                    <table class="w-full text-[10pt] border-collapse border border-black">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-black p-2">Date</th>
                                <th class="border border-black p-2">Patient</th>
                                <th class="border border-black p-2">Referrer</th>
                                <th class="border border-black p-2">Tests</th>
                                <th class="border border-black p-2 text-right">Bill</th>
                                <th class="border border-black p-2 text-right">Paid</th>
                                <th class="border border-black p-2 text-right">PC</th>
                                <th class="border border-black p-2 text-right">Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(data).map(([date, rows]) => 
                                rows.map((r, i) => `
                                    <tr>
                                        ${i === 0 ? `<td class="border border-black p-2 font-bold" rowspan="${rows.length}">${date}</td>` : ''}
                                        <td class="border border-black p-2">${r.patient}</td>
                                        <td class="border border-black p-2">${r.referrer}</td>
                                        <td class="border border-black p-2 italic text-[9pt]">${r.tests}</td>
                                        <td class="border border-black p-2 text-right">${r.totalBill}</td>
                                        <td class="border border-black p-2 text-right font-bold">${r.paid}</td>
                                        <td class="border border-black p-2 text-right">${r.pc}</td>
                                        <td class="border border-black p-2 text-right">${r.balance}</td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
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

            <main className="flex-1 p-6 space-y-8 container mx-auto overflow-y-auto">
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
                                            <th className="p-4 text-center">X</th>
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
                                                <td className="p-4 text-center">
                                                    {ex.category === 'Reagent buy' && (
                                                        <button onClick={()=>window.dispatchEvent(new CustomEvent('edit-reagent-entry', {detail: ex}))} className="text-blue-400 hover:text-white bg-blue-900/30 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-800 transition-all">Edit</button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-lg tracking-[0.2em]">
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
                                                <td></td>
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
                                    value: activeTab === 'daily' ? (stats.daily.expenseMap[cat] || 0) : activeTab === 'monthly' ? (stats.monthly.expenseMap[cat] || 0) : (stats.yearly.expenseMap[cat] || 0) 
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
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Collection Detailed List</h3>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handlePrintDetail(detailTableData, isTodayDetailView ? todayStr : `${monthOptions[selectedMonth].name} ${selectedYear}`)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg"
                                    >
                                        <PrinterIcon size={14}/> Print Detailed Log
                                    </button>
                                    <div className="relative w-64">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input type="text" placeholder="Search Patient, Test..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <button onClick={() => setIsTodayDetailView(!isTodayDetailView)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-md flex items-center gap-2 ${isTodayDetailView ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'}`}><Activity size={14} /> Today</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-950/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-700">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Patient Name</th>
                                            <th className="p-4">Referrer</th>
                                            <th className="p-4 text-right">Total Bill</th>
                                            <th className="p-4 text-right text-emerald-400">Paid</th>
                                            <th className="p-4 text-right text-red-400">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {Object.entries(detailTableData).length > 0 ? (Object.entries(detailTableData) as [string, any[]][]).map(([date, rows]) => (
                                            <React.Fragment key={date}>
                                                {(rows as any[]).map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                                        <td className="p-4 text-slate-500 font-mono text-[10px]">{row.date}</td>
                                                        <td className="p-4 font-bold text-slate-100">{row.patient}</td>
                                                        <td className="p-4 text-slate-400 font-medium">{row.referrer}</td>
                                                        <td className="p-4 text-right font-bold text-slate-300">{row.totalBill.toLocaleString()}</td>
                                                        <td className="p-4 text-right font-black text-emerald-400">{row.paid.toLocaleString()}</td>
                                                        <td className="p-4 text-right font-black text-red-500">{row.balance.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        )) : (
                                            <tr><td colSpan={6} className="p-20 text-center text-slate-600 italic font-black uppercase opacity-30 text-xl tracking-[0.2em]">No Data Found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                                        {dueList.map((inv, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50 transition-colors text-slate-900 font-medium">
                                                <td className="p-3 border-r border-slate-200">{inv.invoice_date}</td>
                                                <td className="p-3 border-r border-slate-200 font-black">{inv.patient_name}</td>
                                                <td className="p-3 border-r border-slate-200 text-right font-bold">{inv.total_amount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-red-600 bg-red-50/50">{inv.due_amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white font-black text-sm">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-right uppercase">Total Due:</td>
                                            <td className="p-4 text-right text-yellow-400">৳ {dueList.reduce((s,i)=>s+i.due_amount, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DiagnosticAccountsPage;
