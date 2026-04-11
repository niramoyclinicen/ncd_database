import React, { useMemo, useState, useEffect } from 'react';
import { LabInvoice as Invoice, DueCollection, ExpenseItem, Employee, testCategories } from '../DiagnosticData';
import { Activity, BackIcon, FileTextIcon, SearchIcon, PrinterIcon } from '../Icons';

// --- Configuration & Data ---
const expenseCategories = [
    'House rent', 'Electricity bill', 'Stuff salary', 'Reagent buy', 'Marketing', 'Motorcycle', 'Doctor donation & Vehicle service',
    'Instruments buy/ repair', 'Diagnostic development', 'Maintenance', 'License cost', 
    'X-ray Film buy', 'Mobile buy/ Flexiload', 'Press Cost', 'Food/Meal Cost', 'Paper / Dish / Wifi Bill',
    'Others',
];

const expenseCategoryBanglaMap: Record<string, string> = {
    'House rent': 'বাড়ী ভাড়া', 'Electricity bill': 'বিদ্যুৎ বিল', 'Stuff salary': 'স্টাফ স্যালারী',
    'Reagent buy': 'রিএজেন্ট ক্রয়', 'Marketing': 'মার্কেটিং', 'Motorcycle':'মোটর সাইকেল','Doctor donation & Vehicle service': 'ডাক্তার ডোনেশন', 'Instruments buy/ repair': 'যন্ত্রপাতি ক্রয়/মেরামত',
    'Diagnostic development': 'ডায়াগনস্টিক উন্নয়ন', 'Maintenance': 'রক্ষণাবেক্ষণ', 'License cost': 'লাইসেন্স খরচ', 
    'X-ray Film buy': 'এক্স-রে ফিল্ম ক্রয়', 'Mobile buy/ Flexiload': 'মোবাইল ক্রয়/ফ্লেক্সিলোড', 'Press Cost': 'প্রেস খরচ', 
    'Food/Meal Cost': 'খাবার খরচ', 'Paper / Dish / Wifi Bill': 'পেপার/ডিশ/ওয়াইফাই বিল',
    'Others': 'অন্যান্য',
};

const subCategoryMap: Record<string, string[]> = {
    'House rent': ['Diagnostic Building Rent'],
    'Electricity bill': ['Meter 01', 'Meter 02'],
    'Reagent buy': ['Local Market', 'Company Delivery', 'Special Order'],
    'Marketing': ['Doctor Appayon', 'PC conference', 'PC Gift', 'Miking', 'Recording', 'Others'],
    'Motorcycle': ['Motorcycle buy', 'Motorcycle repair', 'Motorcycle License', 'Motorcycle Fuel'],
    'Doctor donation & Vehicle service': ['Weekly vehicle', 'Monthly Referral Pay', 'Festival Bonus'],
    'Instruments buy/ repair': ['Lab Equipment', 'IT/Computer', 'Furniture'],
    'Diagnostic development': ['New Test Marketing', 'Branding'],
    'Maintenance': ['AC Service', ' Fridge ', 'Generator Service', 'Clothing', 'Stationary', 'Cleaning'],
    'License cost': ['Trade License', 'Fire License', 'Labour welfare License','Narcotic License','DG Health', 'Environment', 'Atomic Energy'],
    'X-ray Film buy': ['12x15 Film', '10x12 Film', '8x10 Film'],
    'Mobile buy/ Flexiload': ['Office Mobile_buy', 'Marketing mobile Mobile_buy', 'MD mobile buy', 'Office Mobile_Flexiload', 'Marketing mobile_Flexiload', 'MD mobile_Flexiload'],
    'Press Cost': ['Pad Printing', 'Envelope Printing', 'Leaflet','Others'],
    'Food/Meal Cost': ['Staff Lunch','Doctor Lunch', 'Guest Entertainment', 'Tea/Snacks'],
    'Paper / Dish / Wifi Bill': ['Newspaper', 'Dish Bill', 'Wifi Bill'],
    'Others': ['Entertainment', 'Donation', 'Emergency']
};

const monthOptions = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const SummaryBox = ({ title, items, totalLabel, totalValue, colorClass }: any) => (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col h-full`}>
        <h4 className={`text-lg font-black ${colorClass} mb-4 uppercase border-b border-slate-700 pb-2 text-white`}>{title}</h4>
        <div className="space-y-3 flex-1">
            {items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-700/30 pb-1 text-slate-300">
                    <span className="font-bold">{it.label}:</span>
                    <span className="font-black text-white">{it.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
        <div className={`mt-4 pt-3 border-t-2 border-slate-700 flex justify-between items-center`}>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{totalLabel}</span>
            <span className={`text-xl font-black ${colorClass}`}>{totalValue.toLocaleString()} ৳</span>
        </div>
    </div>
);

const HistoryModal: React.FC<{ item: ExpenseItem, onClose: () => void }> = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h3 className="font-black text-sky-400 uppercase text-sm">Edit History: {item.category}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                {(!item.editHistory || item.editHistory.length === 0) ? (
                    <p className="text-center text-slate-500 italic py-8 text-slate-500">No edit history found.</p>
                ) : (
                    item.editHistory.map((log, i) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase">
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                <span className="text-sky-500">{log.field}</span>
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
                <button onClick={onClose} className="bg-slate-700 px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-slate-600 text-white">Close</button>
            </div>
        </div>
    </div>
);

const DailyExpenseForm: React.FC<any> = ({ selectedDate, onDateChange, allDetailedExpenses, onSave, onDelete, onEdit, employees, monthlyRoster, editingItem }) => {
    const dailyExpenseItems = (allDetailedExpenses && allDetailedExpenses[selectedDate]) || [];
    const [items, setItems] = useState<ExpenseItem[]>(() => {
        if (editingItem && editingItem.date === selectedDate) {
            return [{ ...editingItem }];
        }

        const existingItems = (allDetailedExpenses && allDetailedExpenses[selectedDate]) || [];
        const diagnosticItems = existingItems.filter((it: any) => !it.isDeleted && (it.dept === 'Diagnostic' || (!it.dept && expenseCategories.includes(it.category))));
        
        if (diagnosticItems.length > 0) {
            return diagnosticItems.map(it => ({ ...it }));
        }
        
        return [{
            id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0, dept: 'Diagnostic'
        }];
    });

    const [savedSearchTerm, setSavedSearchTerm] = useState('');
    const [savedCategoryFilter, setSavedCategoryFilter] = useState('All');
    const [searchDate, setSearchDate] = useState(selectedDate);
    const [searchMonth, setSearchMonth] = useState(new Date().getMonth());
    const [searchYear, setSearchYear] = useState(new Date().getFullYear());
    const [searchMode, setSearchMode] = useState<'date' | 'month' | 'year' | 'all'>('date');
    const [historyItem, setHistoryItem] = useState<ExpenseItem | null>(null);

    const handleDateChange = (newDate: string) => {
        onDateChange(newDate);
        setSearchDate(newDate);
    };

    const periodKey = selectedDate.substring(0, 7); // YYYY-MM
    const activeEmpIds = monthlyRoster[periodKey] || [];
    const filteredEmployees = employees.filter((e: any) => activeEmpIds.includes(e.emp_id));

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

    const addItem = () => setItems(prev => [...prev, { id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0, dept: 'Diagnostic' }]);
    const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

    const handleEditSavedItem = (savedItem: any) => {
        onDateChange(savedItem.date);
        onEdit(savedItem);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteSavedItem = (savedItem: any) => {
        if (window.confirm(`Are you sure you want to delete this expense entry (${savedItem.category}: ${savedItem.paidAmount}৳)?`)) {
            onDelete(savedItem.date, savedItem.id);
        }
    };

    const handleSave = () => {
        const updatedDailyItems = [...dailyExpenseItems];
        
        // If we are editing and the date changed, we need to remove it from the old date
        if (editingItem && editingItem.date !== selectedDate) {
            onDelete(editingItem.date, editingItem.id);
        }

        items.forEach(formItem => {
            const existingIdx = updatedDailyItems.findIndex(di => di.id === formItem.id);
            if (existingIdx !== -1) {
                updatedDailyItems[existingIdx] = { 
                    ...formItem, 
                    dept: 'Diagnostic'
                };
            } else {
                updatedDailyItems.push({ ...formItem, dept: 'Diagnostic' });
            }
        });

        onSave(selectedDate, updatedDailyItems);
        setItems([{
            id: Date.now(), category: expenseCategories[0], subCategory: '', description: '', billAmount: 0, paidAmount: 0, dept: 'Diagnostic'
        }]);
    };

    const totalPaid = items.reduce((acc, item) => acc + (Number(item.paidAmount) || 0), 0);
    
    const filteredSavedItems = useMemo(() => {
        const allItems: any[] = [];
        Object.entries(allDetailedExpenses || {}).forEach(([date, items]: [string, any]) => {
            const [y, m] = date.split('-').map(Number);
            
            let matchesTime = false;
            if (searchMode === 'date') matchesTime = date === searchDate;
            else if (searchMode === 'month') matchesTime = (m - 1 === searchMonth && y === searchYear);
            else if (searchMode === 'year') matchesTime = y === searchYear;
            else if (searchMode === 'all') matchesTime = true;

            if (matchesTime && Array.isArray(items)) {
                items.filter((it: any) => !it.isDeleted && (it.dept === 'Diagnostic' || (!it.dept && expenseCategories.includes(it.category)))).forEach((it: any) => {
                    allItems.push({ ...it, date });
                });
            }
        });

        return allItems.filter((it: any) => {
            const cat = it.category || '';
            const subCat = it.subCategory || '';
            const desc = it.description || '';
            
            const matchesSearch = cat.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
                (expenseCategoryBanglaMap[cat] || '').includes(savedSearchTerm) ||
                subCat.toLowerCase().includes(savedSearchTerm.toLowerCase()) ||
                desc.toLowerCase().includes(savedSearchTerm.toLowerCase());
            
            const matchesCategory = savedCategoryFilter === 'All' || cat === savedCategoryFilter;
            
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return timeB - timeA;
        });
    }, [allDetailedExpenses, searchDate, searchMonth, searchYear, searchMode, savedSearchTerm, savedCategoryFilter]);

    const totalFilteredSavedAmount = useMemo(() => {
        return filteredSavedItems.reduce((acc, it) => acc + (Number(it.paidAmount) || 0), 0);
    }, [filteredSavedItems]);

    const descriptionSuggestions = useMemo(() => {
        const suggestions: Record<string, Set<string>> = {};
        Object.values(allDetailedExpenses || {}).forEach((dayItems: any) => {
            if (Array.isArray(dayItems)) {
                dayItems.forEach((item: any) => {
                    if (item.subCategory && item.description) {
                        const key = `${item.category}|${item.subCategory}`;
                        if (!suggestions[key]) suggestions[key] = new Set();
                        suggestions[key].add(item.description);
                    }
                });
            }
        });
        return suggestions;
    }, [allDetailedExpenses]);

    return (
        <div className="space-y-10">
            <div className="bg-sky-950/40 rounded-[2rem] p-8 border border-sky-800 shadow-xl no-print">
                {historyItem && <HistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}
                <div className="flex justify-between items-center mb-6 border-b border-sky-800 pb-4">
                    <h3 className="text-xl font-black text-sky-100 flex items-center gap-3"><Activity className="w-6 h-6 text-sky-400" /> Daily Expense Entry</h3>
                    <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black" />
                </div>
                <div className="overflow-x-auto min-h-[150px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] text-slate-500 uppercase font-black tracking-widest">
                                <th className="pb-3 pl-2">বিভাগ (Category)</th>
                                <th className="pb-3 pl-2">কর্মচারী / বিবরণ (Employee / Details)</th>
                                <th className="pb-3 pl-2">বর্ণনা (Description)</th>
                                <th className="pb-3 text-right">পরিশোধিত টাকা (Paid Amount)</th>
                                <th className="pb-3 text-center">X</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="py-3 pr-2">
                                        <select value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-blue-500">
                                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-3 pr-2">
                                        {item.category === 'Stuff salary' ? (
                                            <select 
                                                value={item.subCategory} 
                                                onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                                                className="w-full bg-slate-800 border-2 border-amber-600/50 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-amber-500"
                                            >
                                                <option value="">-- Select Employee --</option>
                                                {filteredEmployees.map((e:any) => <option key={e.emp_id} value={e.emp_name}>{e.emp_name}</option>)}
                                            </select>
                                        ) : (
                                            <>
                                                <input 
                                                    list={`list-${item.id}`} 
                                                    value={item.subCategory} 
                                                    onChange={e => handleItemChange(item.id, 'subCategory', e.target.value)} 
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-black outline-none focus:border-blue-500" 
                                                    placeholder="Sub-category..." 
                                                />
                                                <datalist id={`list-${item.id}`}>
                                                    {subCategoryMap[item.category]?.map((sub, i) => <option key={i} value={sub} />)}
                                                </datalist>
                                            </>
                                        )}
                                    </td>
                                    <td className="py-3 pr-2">
                                        <input 
                                            list={`desc-list-${item.id}`}
                                            value={item.description} 
                                            onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-bold" 
                                            placeholder="Additional details..." 
                                        />
                                        <datalist id={`desc-list-${item.id}`}>
                                            {Array.from(descriptionSuggestions[`${item.category}|${item.subCategory}`] || []).map((desc, i) => (
                                                <option key={i} value={desc} />
                                            ))}
                                        </datalist>
                                    </td>
                                    <td className="py-3 pr-2"><input type="number" value={item.paidAmount} onChange={e => handleItemChange(item.id, 'paidAmount', parseFloat(e.target.value) || 0)} className="w-28 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-base font-black text-right outline-none focus:border-emerald-500" onFocus={e => e.target.select()} /></td>
                                    <td className="py-3 text-center"><button onClick={() => removeItem(item.id)} className="text-red-500 font-bold text-2xl hover:text-red-400">×</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-8 flex justify-between items-center border-t border-sky-900/50 pt-6">
                    <button onClick={addItem} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all">+ Add Item Row</button>
                    <div className="flex items-center gap-8">
                        <div className="text-slate-400 font-black uppercase text-xs tracking-widest">Total Paid: <span className="text-emerald-400 text-3xl font-black ml-2">৳{totalPaid.toLocaleString()}</span></div>
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-12 py-3 rounded-2xl font-black shadow-2xl uppercase text-[11px] tracking-widest transition-all">Save Daily Ledger</button>
                    </div>
                </div>
            </div>

            {/* Saved Expenses List */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl">
                <div className="flex flex-wrap justify-between items-center mb-6 border-b border-slate-800 pb-4 gap-4">
                    <h3 className="text-xl font-black text-white flex items-center gap-3"><FileTextIcon className="w-6 h-6 text-blue-400" /> Saved Expenses Explorer</h3>
                    
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button onClick={() => setSearchMode('date')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'date' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Date</button>
                            <button onClick={() => setSearchMode('month')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Month</button>
                            <button onClick={() => setSearchMode('year')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'year' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Year</button>
                            <button onClick={() => setSearchMode('all')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${searchMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>All</button>
                        </div>

                        {searchMode === 'date' && (
                            <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-blue-500" />
                        )}
                        {searchMode === 'month' && (
                            <div className="flex gap-2">
                                <select value={searchMonth} onChange={e => setSearchMonth(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-blue-500">
                                    {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                                </select>
                                <select value={searchYear} onChange={e => setSearchYear(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-blue-500">
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        )}
                        {searchMode === 'year' && (
                            <select value={searchYear} onChange={e => setSearchYear(parseInt(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-blue-500">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}

                        <select 
                            value={savedCategoryFilter} 
                            onChange={e => setSavedCategoryFilter(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-blue-500"
                        >
                            <option value="All">All Categories</option>
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{expenseCategoryBanglaMap[cat] || cat}</option>)}
                        </select>

                        <div className="relative w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by item/desc..." 
                                value={savedSearchTerm} 
                                onChange={e => setSavedSearchTerm(e.target.value)} 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-blue-500" 
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-800">
                                <th className="pb-3 pl-2 w-12">SL</th>
                                <th className="pb-3">তারিখ (Date)</th>
                                <th className="pb-3">বিভাগ (Category)</th>
                                <th className="pb-3">উপ-বিভাগ (Sub-Category)</th>
                                <th className="pb-3">বিবরণ (Description)</th>
                                <th className="pb-3 text-right">পরিমাণ (Amount)</th>
                                <th className="pb-3 text-center">অবস্থা (Status)</th>
                                <th className="pb-3 text-center">অ্যাকশন (Action)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredSavedItems.length > 0 ? filteredSavedItems.map((it: any, idx: number) => (
                                <tr key={it.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-4 pl-2 text-slate-500 font-mono">{idx + 1}</td>
                                    <td className="py-4 text-slate-400 font-bold">{it.date}</td>
                                    <td className="py-4 font-bold text-slate-300">{it.category}</td>
                                    <td className="py-4 text-slate-400">{it.subCategory}</td>
                                    <td className="py-4 text-slate-500 italic">{it.description}</td>
                                    <td className="py-4 text-right font-black text-white">৳{it.paidAmount.toLocaleString()}</td>
                                    <td className="py-4 text-center">
                                        {it.isEdited ? (
                                            <span className="bg-amber-900/30 text-amber-400 px-2 py-1 rounded text-[9px] font-black uppercase border border-amber-500/20" title={`Edited at ${it.lastEditedAt}`}>Edited</span>
                                        ) : (
                                            <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-[9px] font-black uppercase border border-emerald-500/20">Original</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-center space-x-2">
                                        <button 
                                            onClick={() => setHistoryItem(it)} 
                                            className="text-emerald-400 hover:text-emerald-300 font-black uppercase text-[10px] tracking-widest border border-emerald-500/30 px-3 py-1 rounded-lg hover:bg-emerald-600/10 transition-all"
                                        >
                                            History
                                        </button>
                                        <button 
                                            onClick={() => handleEditSavedItem(it)} 
                                            className="text-blue-400 hover:text-blue-300 font-black uppercase text-[10px] tracking-widest border border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-600/10 transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSavedItem(it)} 
                                            className="text-rose-400 hover:text-rose-300 font-black uppercase text-[10px] tracking-widest border border-rose-500/30 px-3 py-1 rounded-lg hover:bg-rose-600/10 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-slate-600 font-bold italic">No saved expenses found for the selected criteria.</td>
                                </tr>
                            )}
                        </tbody>
                        {filteredSavedItems.length > 0 && (
                            <tfoot className="bg-slate-950 border-t-2 border-slate-800 text-white font-black">
                                <tr>
                                    <td colSpan={5} className="py-4 text-right uppercase tracking-widest text-slate-500 pr-4">Total Filtered Amount:</td>
                                    <td className="py-4 text-right text-emerald-400 text-lg pr-2">৳{totalFilteredSavedAmount.toLocaleString()}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

const DiagnosticAccountsPage: React.FC<any> = ({ onBack, invoices, dueCollections, employees, detailedExpenses, setDetailedExpenses, monthlyRoster }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate);
        const dateObj = new Date(newDate);
        if (!isNaN(dateObj.getTime())) {
            setSelectedMonth(dateObj.getMonth());
            setSelectedYear(dateObj.getFullYear());
        }
    };

    const [activeTab, setActiveTab] = useState<'entry' | 'diagnostic_expense' | 'daily' | 'monthly' | 'yearly' | 'detail' | 'due'>('entry');
    
    // Detailed Collection States
    const [detailViewMode, setDetailViewMode] = useState<'today' | 'month' | 'year' | 'date'>('today');
    const [detailSearch, setDetailSearch] = useState('');
    const [detailFilterCategory, setDetailFilterCategory] = useState('All');
    
    const [dueSearch, setDueSearch] = useState('');
    const [dueViewMode, setDueViewMode] = useState<'all' | 'date' | 'month' | 'year'>('all');
    const [successMessage, setSuccessMessage] = useState('');

    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (successMessage) { const t = setTimeout(() => setSuccessMessage(''), 3000); return () => clearTimeout(t); }
    }, [successMessage]);

    const handleSaveExpense = (date: string, items: ExpenseItem[]) => {
        setDetailedExpenses((prev: any) => {
            const safePrev = prev || {};
            const existingItems = safePrev[date] || [];
            // Keep Clinic items, replace Diagnostic items with updated ones
            const otherDeptItems = existingItems.filter((it: any) => it.dept !== 'Diagnostic');
            
            // Ensure all items have the correct department and date
            const diagnosticItems = (items || []).map(it => ({ 
                ...it, 
                dept: 'Diagnostic' as const,
                date: date // Ensure date consistency
            }));
            
            const newState = { ...safePrev, [date]: [...otherDeptItems, ...diagnosticItems] };
            
            return newState;
        });
        setEditingItem(null);
        setSuccessMessage("Expense data saved successfully! Syncing to cloud...");
    };

    const handleDeleteExpense = (date: string, id: number) => {
        setDetailedExpenses((prev: any) => {
            const safePrev = prev || {};
            const existingItems = safePrev[date] || [];
            const updatedItems = existingItems.map((it: any) => {
                if (it.id === id) {
                    const history = it.editHistory || [];
                    const newLog = {
                        timestamp: new Date().toISOString(),
                        field: 'DELETED',
                        oldValue: 'Active',
                        newValue: 'Deleted'
                    };
                    return { ...it, isDeleted: true, editHistory: [...history, newLog] };
                }
                return it;
            });
            return { ...prev, [date]: updatedItems };
        });
        setSuccessMessage("Expense item deleted successfully!");
    };

    const diagnosticExpenseSheetData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rows = [];
        const categories = expenseCategories;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dailyExps = ((detailedExpenses && detailedExpenses[dateStr]) || []).filter((it: any) => !it.isDeleted && (it.dept === 'Diagnostic' || (!it.dept && categories.includes(it.category))));
            
            const categorySums: Record<string, number> = {};
            categories.forEach(cat => categorySums[cat] = 0);
            
            dailyExps.forEach(exp => {
                if (categories.includes(exp.category)) {
                    categorySums[exp.category] += exp.paidAmount;
                } else {
                    categorySums['Others'] = (categorySums['Others'] || 0) + exp.paidAmount;
                }
            });
            
            const totalDay = Object.values(categorySums).reduce((a, b) => a + b, 0);
            rows.push({ date: dateStr, categories: categorySums, total: totalDay });
        }

        const columnTotals: Record<string, number> = {};
        categories.forEach(cat => {
            columnTotals[cat] = rows.reduce((sum, row) => sum + row.categories[cat], 0);
        });
        const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

        return { rows, columnTotals, grandTotal };
    }, [detailedExpenses, selectedMonth, selectedYear]);

    const diagnosticMonthlyExpenseSheetData = useMemo(() => {
        const expensesByCategory: Record<string, number> = {};
        expenseCategories.forEach(cat => expensesByCategory[cat] = 0);
        
        Object.entries(detailedExpenses || {}).forEach(([date, items]: any) => {
            const [y, m] = date.split('-').map(Number);
            if (m - 1 === selectedMonth && y === selectedYear && Array.isArray(items)) {
                items.forEach((it: any) => {
                    if (!it.isDeleted && (it.dept === 'Diagnostic' || (!it.dept && expenseCategories.includes(it.category)))) {
                        expensesByCategory[it.category] = (expensesByCategory[it.category] || 0) + it.paidAmount;
                    }
                });
            }
        });

        const totalExpense = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
        return { expensesByCategory, totalExpense };
    }, [selectedMonth, selectedYear, detailedExpenses]);

    const detailTableData = useMemo(() => {
        const filtered = (invoices || []).filter((inv: any) => {
            if (detailViewMode === 'today') return inv.invoice_date === todayStr;
            if (detailViewMode === 'date') return inv.invoice_date === selectedDate;
            
            const [y, m] = (inv.invoice_date || '').split('-').map(Number);
            if (detailViewMode === 'month') return (m - 1) === selectedMonth && y === selectedYear;
            if (detailViewMode === 'year') return y === selectedYear;
            
            return true;
        }).filter((inv: any) => {
            const matchesSearch = (inv.patient_name || '').toLowerCase().includes(detailSearch.toLowerCase()) || 
                                 (inv.invoice_id || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                                 (inv.referrar_name || '').toLowerCase().includes(detailSearch.toLowerCase());
            
            if (detailFilterCategory === 'All') return matchesSearch;
            if (detailFilterCategory === 'Due Recovery') return matchesSearch && inv.due_amount > 0;

            const matchesCat = (inv.items || []).some((it: any) => {
                const name = (it.test_name || '').toLowerCase();
                if (detailFilterCategory === 'USG') return name.includes('usg') || name.includes('ultra');
                if (detailFilterCategory === 'X-Ray') return name.includes('x-ray') || name.includes('xray');
                if (detailFilterCategory === 'ECG') return name.includes('ecg');
                if (detailFilterCategory === 'Hormone') return name.includes('hormone');
                if (detailFilterCategory === 'Pathology') return !name.includes('usg') && !name.includes('ultra') && !name.includes('x-ray') && !name.includes('xray') && !name.includes('ecg') && !name.includes('hormone');
                return true;
            });
            return matchesSearch && matchesCat;
        });

        return filtered.map((inv: any) => {
            const isReturned = inv.status === 'Returned' || inv.status === 'Cancelled';
            
            // Logic Change: Only show what was written in the 'Commission Paid' box
            const totalPC = isReturned ? 0 : (inv.commission_paid || 0);
            
            const usgFee = isReturned ? 0 : inv.items.reduce((s: number, i: any) => s + ((i.usg_exam_charge || 0) * (i.quantity || 1)), 0);
            const paid = isReturned ? 0 : inv.paid_amount;
            const bill = isReturned ? 0 : inv.total_amount;
            const disc = isReturned ? 0 : inv.discount_amount;
            
            return { 
                ...inv, 
                fixedPC: 0, // No longer used as primary source
                specialPC: totalPC, 
                totalPC, 
                usgFee, 
                paidVal: paid, 
                billVal: bill,
                discVal: disc,
                netProfit: paid - (totalPC + usgFee) 
            };
        });
    }, [invoices, detailSearch, selectedMonth, selectedYear, detailViewMode, selectedDate, detailFilterCategory, todayStr]);

    const reportSummary = useMemo(() => {
        return detailTableData.reduce((acc, curr) => {
            if (curr.status !== 'Cancelled' && curr.status !== 'Returned') {
                acc.totalBill += curr.billVal;
                acc.totalDiscount += curr.discVal;
                acc.paidAmount += curr.paidVal;
                acc.fixedPC += curr.fixedPC;
                acc.specialPC += curr.specialPC;
                acc.totalPC += curr.totalPC;
                acc.usgFee += curr.usgFee;
                acc.netInstProfit += curr.netProfit;
                acc.count++;
            }
            return acc;
        }, { totalBill: 0, totalDiscount: 0, paidAmount: 0, fixedPC: 0, specialPC: 0, totalPC: 0, usgFee: 0, netInstProfit: 0, count: 0 });
    }, [detailTableData]);

    const categoryCounts = useMemo(() => {
        const baseFiltered = (invoices || []).filter((inv: any) => {
            if (detailViewMode === 'today') return inv.invoice_date === todayStr;
            if (detailViewMode === 'date') return inv.invoice_date === selectedDate;
            
            const [y, m] = (inv.invoice_date || '').split('-').map(Number);
            if (detailViewMode === 'month') return (m - 1) === selectedMonth && y === selectedYear;
            if (detailViewMode === 'year') return y === selectedYear;
            return true;
        }).filter((inv: any) => {
            return (inv.patient_name || '').toLowerCase().includes(detailSearch.toLowerCase()) || 
                   (inv.invoice_id || '').toLowerCase().includes(detailSearch.toLowerCase()) ||
                   (inv.referrar_name || '').toLowerCase().includes(detailSearch.toLowerCase());
        });

        const counts: Record<string, number> = { All: baseFiltered.length };
        ['Pathology', 'USG', 'X-Ray', 'ECG', 'Hormone'].forEach(cat => {
            counts[cat] = baseFiltered.filter(inv => {
                return (inv.items || []).some((it: any) => {
                    const name = (it.test_name || '').toLowerCase();
                    if (cat === 'USG') return name.includes('usg') || name.includes('ultra');
                    if (cat === 'X-Ray') return name.includes('x-ray') || name.includes('xray');
                    if (cat === 'ECG') return name.includes('ecg');
                    if (cat === 'Hormone') return name.includes('hormone');
                    if (cat === 'Pathology') return !name.includes('usg') && !name.includes('ultra') && !name.includes('x-ray') && !name.includes('xray') && !name.includes('ecg') && !name.includes('hormone');
                    return false;
                });
            }).length;
        });
        return counts;
    }, [invoices, detailSearch, selectedMonth, selectedYear, detailViewMode, selectedDate, todayStr]);

    const stats = useMemo(() => {
        const getRangeStats = (rangeType: 'daily' | 'monthly' | 'yearly') => {
            const relevantInvoices = (invoices || []).filter((inv: any) => {
                if (inv.status === 'Cancelled' || inv.status === 'Returned') return false;
                if (rangeType === 'daily') return inv.invoice_date === selectedDate;
                
                // Avoid timezone issues by splitting the date string directly
                const [y, m] = (inv.invoice_date || '').split('-').map(Number);
                if (rangeType === 'monthly') return (m - 1) === selectedMonth && y === selectedYear;
                return y === selectedYear;
            });
            const relevantDueColls = (dueCollections || []).filter((dc: any) => {
                const isDiag = dc.invoice_id && dc.invoice_id.startsWith('INV-');
                if (rangeType === 'daily') return dc.collection_date === selectedDate && isDiag;
                
                const [y, m] = (dc.collection_date || '').split('-').map(Number);
                if (rangeType === 'monthly') return (m - 1) === selectedMonth && y === selectedYear && isDiag;
                return y === selectedYear && isDiag;
            });

            const coll = { pathology: 0, hormone: 0, usg: 0, xray: 0, ecg: 0, others: 0, dueRecov: 0 };
            
            relevantInvoices.forEach((inv: any) => {
                const ratio = inv.total_amount > 0 ? (inv.paid_amount / inv.total_amount) : 0;
                
                // Logic Change: Calculate actual commission factor based on "Commission Paid" box
                const actualCommPaid = inv.commission_paid || 0;
                const commFactor = inv.paid_amount > 0 ? (actualCommPaid / inv.paid_amount) : 0;

                (inv.items || []).forEach((item: any) => {
                    const testName = (item.test_name || '').toLowerCase();
                    const itemGross = (item.price * item.quantity);
                    
                    // Subtract USG Fee and the actual commission paid (distributed proportionally)
                    const itemNetPaid = (itemGross * ratio) * (1 - commFactor)
                                      - (item.usg_exam_charge * item.quantity);

                    if (testName.includes('usg') || testName.includes('ultra')) coll.usg += itemNetPaid;
                    else if (testName.includes('x-ray') || testName.includes('xray')) coll.xray += itemNetPaid;
                    else if (testName.includes('ecg')) coll.ecg += itemNetPaid;
                    else if (testName.includes('hormone') || testName.includes('tsh') || testName.includes('t3') || testName.includes('t4')) coll.hormone += itemNetPaid;
                    else coll.pathology += itemNetPaid;
                });
            });
            
            coll.dueRecov = relevantDueColls.reduce((s: any, c: any) => s + (c.amount_collected || 0), 0);

            const exp = { total: 0 };
            const expenseMap: Record<string, number> = {};
            expenseCategories.forEach(c => expenseMap[c] = 0);

            if (rangeType === 'daily') {
                ((detailedExpenses && detailedExpenses[selectedDate]) || []).filter((it: any) => it.dept === 'Diagnostic' || (!it.dept && expenseCategories.includes(it.category))).forEach((it: any) => {
                    expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                    exp.total += it.paidAmount;
                });
            } else {
                Object.entries(detailedExpenses || {}).forEach(([date, items]) => {
                    const [y, m] = date.split('-').map(Number);
                    const isMatch = (rangeType === 'monthly' && (m - 1) === selectedMonth && y === selectedYear) || 
                                    (rangeType === 'yearly' && y === selectedYear);
                    
                    if (isMatch && Array.isArray(items)) {
                        (items as any[]).filter((it: any) => !it.isDeleted && (it.dept === 'Diagnostic' || (!it.dept && expenseCategories.includes(it.category)))).forEach((it: any) => {
                            expenseMap[it.category] = (expenseMap[it.category] || 0) + it.paidAmount;
                            exp.total += it.paidAmount;
                        });
                    }
                });
            }

            const totalColl = Object.values(coll).reduce((s, v) => s + v, 0);
            const totalCollExclDue = totalColl - coll.dueRecov;
            return { coll, exp, totalColl, totalCollExclDue, expenseMap, balance: totalColl - exp.total };
        };

        return { daily: getRangeStats('daily'), monthly: getRangeStats('monthly'), yearly: getRangeStats('yearly') };
    }, [invoices, dueCollections, detailedExpenses, selectedDate, selectedMonth, selectedYear]);

    const handlePrintDiagnosticExpenseSheet = () => {
        const win = window.open('', '_blank');
        if(!win) return;
        const monthName = monthOptions[selectedMonth].name;
        const { rows, columnTotals, grandTotal } = diagnosticExpenseSheetData;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Diagnostic Expense Sheet - ${monthName} ${selectedYear}</title>
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
                        <p>Monthly Diagnostic Expense Ledger - ${monthName} ${selectedYear}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 35px">Date</th>
                                ${expenseCategories.map(cat => `<th title="${cat}">${expenseCategoryBanglaMap[cat] || cat}</th>`).join('')}
                                <th style="width: 55px" style="background: #e5e7eb">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td style="font-weight: bold">${row.date.split('-')[2]} ${monthName.substring(0,3)}</td>
                                    ${expenseCategories.map(cat => `<td>${row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}</td>`).join('')}
                                    <td style="font-weight: 900; background: #f9fafb">৳${row.total > 0 ? row.total.toLocaleString() : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="total-row">
                            <tr>
                                <td style="text-transform: uppercase">TOTAL:</td>
                                ${expenseCategories.map(cat => `<td>${columnTotals[cat] > 0 ? columnTotals[cat].toLocaleString() : '-'}</td>`).join('')}
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

    const handlePrintDueList = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const html = `
            <html>
                <head>
                    <title>Outstanding Patient Dues</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 4px solid #0f172a; padding-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 32px; text-transform: uppercase; letter-spacing: 2px; color: #0f172a; }
                        .header p { margin: 5px 0; color: #64748b; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #0f172a; color: white; text-align: left; padding: 12px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                        tr:nth-child(even) { background: #f8fafc; }
                        .text-right { text-align: right; }
                        .total-row { background: #f1f5f9 !important; font-weight: 900; font-size: 16px; }
                        .footer { margin-top: 60px; display: flex; justify-content: space-between; }
                        .sig-box { border-top: 2px solid #0f172a; width: 200px; text-align: center; padding-top: 10px; font-weight: bold; font-size: 12px; }
                        .date-info { font-size: 12px; color: #64748b; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Outstanding Patient Dues</h1>
                        <p>Diagnostic Accounts Console</p>
                    </div>
                    <div class="date-info">
                        Report Type: ${dueViewMode.toUpperCase()} | 
                        Generated on: ${new Date().toLocaleString()}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Date</th>
                                <th>Patient Name</th>
                                <th class="text-right">Total Bill</th>
                                <th class="text-right">Due Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dueList.map((inv, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${inv.invoice_date}</td>
                                    <td>${inv.patient_name}</td>
                                    <td class="text-right">${inv.total_amount.toLocaleString()}</td>
                                    <td class="text-right">৳${inv.due_amount.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="4" class="text-right">Total Outstanding Due:</td>
                                <td class="text-right">৳${dueList.reduce((s, i) => s + i.due_amount, 0).toLocaleString()}</td>
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

    const dueList = (invoices || []).filter((inv: any) => {
        if (!inv || (inv.due_amount || 0) <= 1) return false;
        
        let matchesTime = true;
        const invDate = inv.invoice_date || '';
        if (dueViewMode === 'date') matchesTime = invDate === selectedDate;
        else if (dueViewMode === 'month') {
            const d = new Date(invDate);
            matchesTime = !isNaN(d.getTime()) && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }
        else if (dueViewMode === 'year') {
            const d = new Date(invDate);
            matchesTime = !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
        }
        
        const matchesSearch = (inv.patient_name || '').toLowerCase().includes(dueSearch.toLowerCase()) || 
                             (inv.invoice_id || '').toLowerCase().includes(dueSearch.toLowerCase());
        
        return matchesTime && matchesSearch;
    }).sort((a,b) => {
        const timeA = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
        const timeB = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
        return timeB - timeA;
    });

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
            <header className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl no-print">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-all"><BackIcon className="w-6 h-6" /></button>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Diagnostic Accounts Console</h2>
                </div>
                <div className="flex bg-slate-800 rounded-2xl p-1 shadow-inner border border-slate-700 overflow-x-auto max-w-full">
                    {[
                        { id: 'entry', label: 'Data Entry' }, 
                        { id: 'diagnostic_expense', label: 'Diagnostic Expense Sheet' },
                        { id: 'daily', label: 'Daily Hishab' }, 
                        { id: 'monthly', label: 'Monthly Hishab' }, 
                        { id: 'yearly', label: 'Yearly Hishab' },
                        { id: 'detail', label: 'Collection Detail' },
                        { id: 'due', label: 'Due List' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                    ))}
                </div>
            </header>

            {successMessage && (
                <div className="fixed top-24 right-8 z-50 animate-bounce">
                    <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-2xl flex items-center gap-3 border border-emerald-400">
                        <Activity className="w-5 h-5" />
                        {successMessage}
                    </div>
                </div>
            )}

            <main className="flex-1 p-8 space-y-10 container mx-auto overflow-y-auto">
                {activeTab === 'entry' && (
                    <div className="animate-fade-in space-y-10">
                        <DailyExpenseForm 
                            key={`${selectedDate}-${editingItem?.id || 'new'}`} 
                            selectedDate={selectedDate} 
                            onDateChange={handleDateChange} 
                            allDetailedExpenses={detailedExpenses} 
                            onSave={handleSaveExpense} 
                            onDelete={handleDeleteExpense}
                            onEdit={setEditingItem}
                            editingItem={editingItem}
                            employees={employees} 
                            monthlyRoster={monthlyRoster} 
                        />
                    </div>
                )}

                {activeTab === 'diagnostic_expense' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl no-print">
                             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                Monthly Diagnostic Expense Sheet: {monthOptions[selectedMonth].name} {selectedYear}
                             </h2>
                             <div className="flex gap-4">
                                <button onClick={handlePrintDiagnosticExpenseSheet} className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><PrinterIcon size={14}/> Print Landscape</button>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                             </div>
                        </div>

                        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-300 shadow-2xl overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                <thead className="bg-slate-100 text-slate-800 text-[9px] uppercase font-black tracking-widest border-b-2 border-slate-300">
                                    <tr>
                                        <th className="p-2 border border-slate-300 w-[60px]">Date</th>
                                        {expenseCategories.map(cat => (
                                            <th key={cat} className="p-2 border border-slate-300 text-center leading-tight break-words" title={cat}>
                                                {expenseCategoryBanglaMap[cat] || cat}
                                            </th>
                                        ))}
                                        <th className="p-2 border border-slate-300 text-right bg-slate-200 w-[100px]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {diagnosticExpenseSheetData.rows.map(row => (
                                        <tr key={row.date} className="hover:bg-blue-50 transition-colors border-b border-slate-200">
                                            <td className="p-2 border border-slate-300 text-center font-mono font-bold bg-slate-50">
                                                {row.date.split('-')[2]} {monthOptions[selectedMonth].name.substring(0,3)}
                                            </td>
                                            {expenseCategories.map(cat => (
                                                <td key={cat} className="p-2 border border-slate-300 text-center font-medium">
                                                    {row.categories[cat] > 0 ? row.categories[cat].toLocaleString() : '-'}
                                                </td>
                                            ))}
                                            <td className="p-2 border border-slate-300 text-right font-black bg-slate-50 text-slate-900">
                                                ৳{row.total > 0 ? row.total.toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-400">
                                    <tr>
                                        <td className="p-3 border border-slate-300 text-center uppercase text-[10px]">TOTAL:</td>
                                        {expenseCategories.map(cat => (
                                            <td key={cat} className="p-3 border border-slate-300 text-center text-blue-700">
                                                {diagnosticExpenseSheetData.columnTotals[cat] > 0 ? diagnosticExpenseSheetData.columnTotals[cat].toLocaleString() : '-'}
                                            </td>
                                        ))}
                                        <td className="p-3 border border-slate-300 text-right text-lg text-emerald-700 bg-emerald-50">
                                            ৳{diagnosticExpenseSheetData.grandTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') && (
                    <div className="animate-fade-in space-y-10">
                        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
                             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                {activeTab === 'daily' ? `Daily Summary (Net): ${selectedDate}` : activeTab === 'monthly' ? `Monthly (Net): ${monthOptions[selectedMonth].name} ${selectedYear}` : `Yearly (Net): ${selectedYear}`}
                             </h2>
                             <div className="flex gap-4">
                                {activeTab === 'daily' ? (
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-black text-sm" />
                                ) : (
                                    <>
                                        {activeTab === 'monthly' && (
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                        )}
                                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-slate-800 border-none rounded-xl p-3 text-white font-black text-sm">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </>
                                )}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <SummaryBox title="Net Collection (নিট কালেকশন)" colorClass="text-blue-400" totalLabel="Total Collection (Excl. Due Recovery)" totalValue={activeTab === 'daily' ? stats.daily.totalCollExclDue : activeTab === 'monthly' ? stats.monthly.totalCollExclDue : stats.yearly.totalCollExclDue} 
                                items={[
                                    { label: 'Pathology (Net)', value: activeTab === 'daily' ? stats.daily.coll.pathology : activeTab === 'monthly' ? stats.monthly.coll.pathology : stats.yearly.coll.pathology }, 
                                    { label: 'Hormone (Net)', value: activeTab === 'daily' ? stats.daily.coll.hormone : activeTab === 'monthly' ? stats.monthly.coll.hormone : stats.yearly.coll.hormone }, 
                                    { label: 'USG (Net)', value: activeTab === 'daily' ? stats.daily.coll.usg : activeTab === 'monthly' ? stats.monthly.coll.usg : stats.yearly.coll.usg }, 
                                    { label: 'X-Ray (Net)', value: activeTab === 'daily' ? stats.daily.coll.xray : activeTab === 'monthly' ? stats.monthly.coll.xray : stats.yearly.coll.xray }, 
                                    { label: 'ECG (Net)', value: activeTab === 'daily' ? stats.daily.coll.ecg : activeTab === 'monthly' ? stats.monthly.coll.ecg : stats.yearly.coll.ecg }, 
                                    { label: 'Due Recovery', value: activeTab === 'daily' ? stats.daily.coll.dueRecov : activeTab === 'monthly' ? stats.monthly.coll.dueRecov : stats.yearly.coll.dueRecov },
                                    { label: 'Grand Total (Incl. Due)', value: activeTab === 'daily' ? stats.daily.totalColl : activeTab === 'monthly' ? stats.monthly.totalColl : stats.yearly.totalColl }
                                ]} 
                            />
                            <SummaryBox title="Expenses (অন্যান্য খরচ)" colorClass="text-rose-400" totalLabel="Total Expense" totalValue={activeTab === 'daily' ? stats.daily.exp.total : activeTab === 'monthly' ? stats.monthly.exp.total : stats.yearly.exp.total} 
                                items={expenseCategories.map(cat => ({ 
                                    label: expenseCategoryBanglaMap[cat], 
                                    value: activeTab === 'daily' ? (stats.daily.expenseMap[cat] || 0) : activeTab === 'monthly' ? (stats.monthly.expenseMap[cat] || 0) : (stats.yearly.expenseMap[cat] || 0) 
                                }))} 
                            />
                        </div>

                        <div className="flex justify-center pt-8 no-print">
                            <div className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 shadow-2xl text-center">
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Net Balance (A - B)</p>
                                <h4 className={`text-6xl font-black ${ (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance) >= 0 ? 'text-green-400' : 'text-rose-500' }`}>
                                    ৳ { (activeTab === 'daily' ? stats.daily.balance : activeTab === 'monthly' ? stats.monthly.balance : stats.yearly.balance).toLocaleString() }
                                </h4>
                                <p className="text-slate-600 text-[10px] mt-4 font-bold uppercase tracking-widest italic">* সকল পেমেন্টকৃত কমিশন ও ইউএসজি ফি কালেকশন থেকে বিয়োগ করা হয়েছে</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'detail' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col gap-8">
                            <div className="flex flex-wrap justify-between items-center gap-6 border-b border-slate-700 pb-6 no-print">
                                <div className="flex items-center gap-6 flex-wrap">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Journal Details</h3>
                                    <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700">
                                        <button onClick={() => setDetailViewMode('today')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Today</button>
                                        <button onClick={() => setDetailViewMode('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Monthly</button>
                                        <button onClick={() => setDetailViewMode('year')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'year' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Yearly</button>
                                        <button onClick={() => setDetailViewMode('date')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${detailViewMode === 'date' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Specific Date</button>
                                    </div>
                                    
                                    {detailViewMode === 'date' && <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold" />}
                                    {detailViewMode === 'month' && (
                                        <div className="flex gap-2">
                                            <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{monthOptions.map(m=><option key={m.value} value={m.value}>{m.name}</option>)}</select>
                                            <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
                                        </div>
                                    )}
                                    {detailViewMode === 'year' && (
                                        <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-bold">{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
                                    )}
                                </div>
                                <div className="relative w-80">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input type="text" placeholder="Search Patient or Referrer..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-full pl-12 pr-6 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 no-print border-b border-slate-700 pb-6">
                                {['All', 'Pathology', 'USG', 'X-Ray', 'ECG', 'Hormone'].map(cat => (
                                    <button key={cat} onClick={()=>setDetailFilterCategory(cat)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase border transition-all ${detailFilterCategory === cat ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'}`}>
                                        {cat} <span className={`ml-2 px-2 py-0.5 rounded-full ${detailFilterCategory === cat ? 'bg-white/20' : 'bg-slate-800'}`}>{categoryCounts[cat] || 0}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/50">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                        <tr className="bg-slate-900/80 text-white font-black border-b border-slate-700 no-print">
                                            <td colSpan={4} className="p-4 text-right text-[10px] text-slate-500 uppercase tracking-widest">Summary Totals:</td>
                                            <td className="p-4 text-right text-blue-400">৳{reportSummary.totalBill.toLocaleString()}</td>
                                            <td className="p-4 text-right text-rose-400">৳{reportSummary.totalDiscount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-emerald-400 font-black">৳{reportSummary.paidAmount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-amber-500">৳{reportSummary.totalPC.toLocaleString()}</td>
                                            <td className="p-4 text-right text-sky-400">৳{reportSummary.usgFee.toLocaleString()}</td>
                                            <td className="p-4 text-right bg-blue-600 text-white text-sm">৳{reportSummary.netInstProfit.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <th className="p-4">SL</th>
                                            <th className="p-4">Invoice ID</th>
                                            <th className="p-4">Patient Name</th>
                                            <th className="p-4">Referrer</th>
                                            <th className="p-4 text-right">Bill</th>
                                            <th className="p-4 text-right text-rose-300">Disc</th>
                                            <th className="p-4 text-right text-emerald-400">Paid</th>
                                            <th className="p-4 text-right text-amber-500">Paid PC</th>
                                            <th className="p-4 text-right text-sky-400">USG Fee</th>
                                            <th className="p-4 text-right bg-blue-900/20 text-white">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {detailTableData.map((inv, idx) => (
                                            <tr key={inv.invoice_id} className={`hover:bg-slate-700/30 transition-colors ${inv.status==='Returned'?'opacity-50 grayscale bg-red-900/10':''}`}>
                                                <td className="p-4 text-slate-500 font-bold">{idx+1}</td>
                                                <td className="p-4 font-mono text-cyan-400 font-bold">{inv.invoice_id}</td>
                                                <td className="p-4 font-black uppercase text-slate-200">{inv.patient_name}</td>
                                                <td className="p-4 text-slate-400 font-bold italic truncate max-w-[120px]">{inv.referrar_name || 'Self'}</td>
                                                <td className="p-4 text-right font-medium text-slate-300">{inv.billVal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-rose-400/70">{inv.discVal.toLocaleString()}</td>
                                                <td className="p-4 text-right font-black text-emerald-400">{inv.paidVal.toLocaleString()}</td>
                                                <td className="p-4 text-right text-amber-500 font-bold">৳ {inv.totalPC.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sky-400 font-bold">{inv.usgFee.toLocaleString()}</td>
                                                <td className="p-4 text-right font-black text-white bg-blue-900/10 text-base">৳{inv.netProfit.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-950 border-t-4 border-slate-700 text-[10px] font-black text-white">
                                        <tr className="h-16">
                                            <td colSpan={4} className="p-4 text-right uppercase tracking-widest text-slate-400">Grand Summary Totals:</td>
                                            <td className="p-4 text-right">৳{reportSummary.totalBill.toLocaleString()}</td>
                                            <td className="p-4 text-right text-rose-500">৳{reportSummary.totalDiscount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-emerald-400">৳{reportSummary.paidAmount.toLocaleString()}</td>
                                            <td className="p-4 text-right text-amber-500">৳{reportSummary.totalPC.toLocaleString()}</td>
                                            <td className="p-3 text-right text-sky-400">৳{reportSummary.usgFee.toLocaleString()}</td>
                                            <td className="p-4 text-right text-white bg-blue-600 rounded-br-2xl text-lg">৳{reportSummary.netInstProfit.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'due' && (
                    <div className="animate-fade-in space-y-10">
                        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
                            <div className="p-8 bg-slate-900 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Outstanding Patient Dues</h3>
                                    <button onClick={handlePrintDueList} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg flex items-center gap-2 text-xs font-black uppercase">
                                        <PrinterIcon className="w-4 h-4" /> Print
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                                        {(['all', 'date', 'month', 'year'] as const).map(mode => (
                                            <button key={mode} onClick={() => setDueViewMode(mode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dueViewMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{mode}</button>
                                        ))}
                                    </div>

                                    {dueViewMode === 'date' && <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500" />}
                                    {dueViewMode === 'month' && (
                                        <div className="flex gap-2">
                                            <select value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500">
                                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                                            </select>
                                            <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500">
                                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {dueViewMode === 'year' && (
                                        <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500">
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    )}

                                    <div className="relative">
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input value={dueSearch} onChange={e=>setDueSearch(e.target.value)} placeholder="Search Patient..." className="pl-12 pr-4 py-3 w-64 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                        <tr className="bg-slate-900/80 text-white font-black border-b border-slate-700 no-print">
                                            <td colSpan={3} className="p-5 text-right text-[10px] text-slate-500 uppercase tracking-widest">Summary Totals:</td>
                                            <td className="p-5 text-right text-blue-400">৳{dueList.reduce((s,i)=>s+i.total_amount, 0).toLocaleString()}</td>
                                            <td className="p-5 text-right text-rose-500 font-black text-sm">৳{dueList.reduce((s,i)=>s+i.due_amount, 0).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <th className="p-5 w-16">SL</th>
                                            <th className="p-5">Date</th>
                                            <th className="p-5">Patient Name</th>
                                            <th className="p-5 text-right">Total Bill</th>
                                            <th className="p-5 text-right text-rose-500">Due Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {dueList.map((inv, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-5 text-slate-500 font-bold">{idx + 1}</td>
                                                <td className="p-5 text-slate-400 font-bold">{inv.invoice_date}</td>
                                                <td className="p-5 font-black text-white uppercase text-sm">{inv.patient_name}</td>
                                                <td className="p-5 text-right text-slate-300 font-bold">{inv.total_amount.toLocaleString()}</td>
                                                <td className="p-5 text-right font-black text-rose-500 text-xl">৳{inv.due_amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-950 text-white font-black text-sm border-t-4 border-slate-800">
                                        <tr>
                                            <td colSpan={4} className="p-8 text-right uppercase tracking-widest text-slate-500">Total Outstanding Due:</td>
                                            <td className="p-8 text-right text-yellow-400 text-4xl">৳ {dueList.reduce((s,i)=>s+i.due_amount, 0).toLocaleString()}</td>
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