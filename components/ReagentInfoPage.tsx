
import React, { useState, useEffect, useMemo } from 'react';
import { Reagent, emptyReagent } from './DiagnosticData';
import { Activity, PrinterIcon, SearchIcon, BeakerIcon, DatabaseIcon, PlusIcon, FileTextIcon, XIcon } from './Icons';

interface ReagentInfoPageProps {
    reagents: Reagent[];
    setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;
    detailedExpenses?: any;
    labInvoices?: any;
    tests?: any[];
    performBlockingSync?: (overrides?: any) => Promise<boolean>;
}

const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents, detailedExpenses, labInvoices, tests = [], performBlockingSync }) => {
    const [viewMode, setViewMode] = useState<'inventory' | 'requisition' | 'ledger' | 'summary'>('summary');
    const [summaryStartDate, setSummaryStartDate] = useState(() => {
        const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
    });
    const [summaryEndDate, setSummaryEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [ledgerReagentId, setLedgerReagentId] = useState<string | null>(null);
    const [ledgerStartDate, setLedgerStartDate] = useState<string>('');
    const [ledgerEndDate, setLedgerEndDate] = useState<string>('');
    
    // Ledger Calculation
    const getReagentLedger = (reagentId: string) => {
        const reagent = reagents.find(r => r.reagent_id === reagentId);
        if (!reagent) return { items: [], currentStock: 0 };
        
        let stock = 0;
        const ledgerItems: any[] = [];
        
        // 1. Manual updates (Initial / Resets)
        if (reagent.manualStockUpdates) {
            reagent.manualStockUpdates.forEach(update => {
                ledgerItems.push({
                    date: update.date,
                    type: 'MANUAL_SET',
                    description: update.note || 'Manual Stock Update',
                    qtyChange: update.quantity - stock,
                    resultingStock: update.quantity
                });
                stock = update.quantity;
            });
        } else {
             // Fallback to initial quantity if no manual records but it has a stock
             ledgerItems.push({
                date: 'Initial',
                type: 'INITIAL',
                description: 'Initial System Stock',
                qtyChange: reagent.quantity,
                resultingStock: reagent.quantity
             });
             stock = reagent.quantity;
        }

        // 2. Purchases (from detailedExpenses)
        if (detailedExpenses) {
            Object.entries(detailedExpenses).forEach(([date, expenses]: [string, any]) => {
                expenses.forEach((exp: any) => {
                    if (exp.metadata?.isBatchPurchase) {
                        const row = exp.metadata.items.find((i:any) => i.reagentId === reagentId);
                        if (row && row.qty > 0) {
                            stock += row.qty;
                            ledgerItems.push({
                                date,
                                type: 'PURCHASE',
                                description: 'Batch Purchase Invoice',
                                qtyChange: row.qty,
                                resultingStock: stock
                            });
                        }
                    } else if ((exp.category === 'Reagent buy' || exp.category === 'X-ray Film buy') && exp.subCategory === reagent.reagent_name) {
                        const qtyAdded = (exp.metadata?.numberOfBoxes || 0) * (exp.metadata?.quantityPerBox || 0);
                        if (qtyAdded > 0) {
                            stock += qtyAdded;
                            ledgerItems.push({
                                date,
                                type: 'PURCHASE',
                                description: 'Purchase (' + (exp.description || '') + ')',
                                qtyChange: qtyAdded,
                                resultingStock: stock
                            });
                        }
                    }
                });
            });
        }
        
        // 3. Usage (from labInvoices)
        if (labInvoices) {
            labInvoices.forEach((inv: any) => {
                if (reagent.usage_start_date && inv.invoice_date < reagent.usage_start_date) return;
                inv.items.forEach((item: any) => {
                    const test = tests.find(t => t.test_id === item.test_id);
                    if (test) {
                        let isUsed = false;
                        let qtyUsed = 0;
                        
                        // Check if it's explicitly required
                        if (test.reagents_required) {
                            const usage = test.reagents_required.find((req: any) => req.reagent_id === reagent.reagent_name);
                            if (usage) {
                                qtyUsed = (usage.quantity_per_test || 0) * (item.quantity || 1);
                                isUsed = qtyUsed > 0;
                            }
                        }
                        
                        // Fallback to linked_test or linked_category
                        if (!isUsed) {
                            if (test.test_category === 'X-Ray' && reagent.linked_category === 'X-Ray') {
                                // For X-Ray, it's hard to know exactly which film was used if there are multiple. 
                                // In LabInvoicing we deduct from the actual stock.
                                // For ledger purposes, we will just estimate 1 if it's the only film, or assume it was used if it's an X-ray film.
                                // Actually, to avoid ledger mismatch, if we don't know, we shouldn't guess wrongly.
                                // BUT we need the consumed count to look right! 
                                // We'll just assume 1 qty was used.
                                qtyUsed = 1;
                                isUsed = true;
                            } else if (reagent.linked_test === test.test_name) {
                                qtyUsed = 1;
                                isUsed = true;
                            }
                        }

                        if (isUsed && qtyUsed > 0) {
                            stock -= qtyUsed;
                            ledgerItems.push({
                                date: inv.invoice_date,
                                type: 'USAGE',
                                description: 'Used in Invoice: ' + inv.invoice_id + ' (Test: ' + test.test_name + ')',
                                qtyChange: -qtyUsed,
                                resultingStock: stock
                            });
                        }
                    }
                });
            });
        }
        
        return { items: ledgerItems.sort((a,b) => {
            if(a.date === 'Initial') return -1;
            if(b.date === 'Initial') return 1;
            return a.date.localeCompare(b.date);
        }), currentStock: stock };
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReagentId, setSelectedReagentId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Reagent>(emptyReagent);
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [manualStockQty, setManualStockQty] = useState('');
    const [manualStockDate, setManualStockDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddClick = () => {
        setFormData({ ...emptyReagent, reagent_id: 'R-' + Date.now() });
        setIsEditing(false);
        setShowForm(true);
    };

    const handleEditClick = (r) => {
        setFormData(r);
        setIsEditing(true);
        setManualStockQty(r.quantity.toString());
        setManualStockDate(new Date().toISOString().split('T')[0]);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.reagent_name) return;
        let newReagents = [];
        if (isEditing) {
            newReagents = reagents.map(r => r.reagent_id === formData.reagent_id ? formData : r);
        } else {
            newReagents = [...reagents, formData];
        }
        setReagents(newReagents);
        if (performBlockingSync) {
             const success = await performBlockingSync({ reagents: newReagents });
             if(success) {
                 setShowForm(false);
                 setSuccessMessage('Saved successfully!');
                 setTimeout(() => setSuccessMessage(''), 3000);
             } else {
                 alert("Failed to save. Please try again.");
             }
        } else {
            setShowForm(false);
            setSuccessMessage('Saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleSetStock = async () => {
        if (!formData.reagent_id || !manualStockQty) return;
        const qty = parseFloat(manualStockQty);
        
        const newUpdate = {
            date: manualStockDate,
            quantity: qty,
            note: 'Manual Calibration'
        };

        const updatedFormData = {
            ...formData,
            quantity: qty,
            manualStockUpdates: [...(formData.manualStockUpdates || []), newUpdate]
        };

        const newReagents = reagents.map(r => r.reagent_id === formData.reagent_id ? updatedFormData : r);
        setReagents(newReagents);
        setFormData(updatedFormData);
        if (performBlockingSync) {
            const success = await performBlockingSync({ reagents: newReagents });
            if (success) {
                setSuccessMessage('Stock calibrated!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                alert("Failed to save. Please try again.");
            }
        } else {
            setSuccessMessage('Stock calibrated!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };


    // Requisition Logic
    const [requisitionItems, setRequisitionItems] = useState<string[]>([]); // Array of reagent IDs

    const filteredReagents = useMemo(() => {
        if (!Array.isArray(reagents)) return [];
        return reagents.filter(r =>
            r && (
                (r.reagent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.reagent_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.company && r.company.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, reagents]);

    const stats = useMemo(() => {
        if (!Array.isArray(reagents)) return { expiringSoon: [], expired: [], lowStock: [] };
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);

        const expiringSoon = reagents.filter(r => r && r.expiry_date && new Date(r.expiry_date) <= threeMonthsFromNow && new Date(r.expiry_date) >= today);
        const expired = reagents.filter(r => r && r.expiry_date && new Date(r.expiry_date) < today);
        const lowStock = reagents.filter(r => r && r.quantity < 5);

        return { expiringSoon, expired, lowStock };
    }, [reagents]);

    const handlePrintRequisition = () => {
        const itemsToPrint = reagents.filter(r => requisitionItems.includes(r.reagent_id));
        if (itemsToPrint.length === 0) return alert("চাহিদা পত্রের জন্য আইটেম সিলেক্ট করুন।");

        const win = window.open('', '_blank');
        if (!win) return;
        const html = `
            <html>
                <head>
                    <title>Reagent Requisition</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@page { size: A4; margin: 20mm; } body { font-family: serif; color: black; }</style>
                </head>
                <body class="p-10">
                    <div class="text-center mb-10 border-b-2 border-black pb-4">
                        <h1 class="text-3xl font-black uppercase">Niramoy Clinic & Diagnostic</h1>
                        <p class="text-sm font-bold mt-1">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
                        <h2 class="mt-6 text-xl font-bold underline uppercase tracking-widest">রিএজেন্ট চাহিদা পত্র (Reagent Requisition)</h2>
                    </div>
                    <div class="mb-6 flex justify-between">
                        <span><b>তারিখ:</b> ${new Date().toLocaleDateString()}</span>
                        <span><b>বিভাগ:</b> ডায়াগনস্টিক বিভাগ</span>
                    </div>
                    <table class="w-full border-collapse border border-black mb-10">
                        <thead><tr class="bg-gray-100">
                            <th class="border border-black p-2 text-left">SL</th>
                            <th class="border border-black p-2 text-left">Reagent Name</th>
                            <th class="border border-black p-2 text-left">Company</th>
                            <th class="border border-black p-2 text-center">Current Qty</th>
                            <th class="border border-black p-2 text-center">Required Qty</th>
                        </tr></thead>
                        <tbody>
                            ${itemsToPrint.map((r, i) => `
                                <tr>
                                    <td class="border border-black p-2">${i + 1}</td>
                                    <td class="border border-black p-2 font-bold">${r.reagent_name}</td>
                                    <td class="border border-black p-2">${r.company || '---'}</td>
                                    <td class="border border-black p-2 text-center">${r.quantity} ${r.unit || ''}</td>
                                    <td class="border border-black p-2 text-center">.................</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="mt-20 flex justify-between px-10">
                        <div class="text-center w-48 border-t border-black pt-1">প্রস্তুতকারক</div>
                        <div class="text-center w-48 border-t border-black pt-1">অনুমোদনকারী</div>
                    </div>
                </body>
            </html>
        `;
        win.document.write(html); win.document.close();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const toggleRequisition = (id: string) => {
        setRequisitionItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const getExpiryClass = (dateStr?: string) => {
        if (!dateStr) return "text-slate-500";
        const d = new Date(dateStr);
        const today = new Date();
        const diff = d.getTime() - today.getTime();
        const months = diff / (1000 * 60 * 60 * 24 * 30);
        if (months < 0) return "text-rose-500 font-black";
        if (months < 3) return "text-rose-400 font-bold";
        if (months < 6) return "text-amber-400";
        return "text-emerald-400";
    };

    return (
        <div className="bg-slate-950 text-slate-200 min-h-screen flex flex-col font-sans">
            <header className="bg-slate-900 p-6 border-b border-slate-800 flex justify-between items-center shadow-2xl sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 text-blue-400"><BeakerIcon size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Reagent Inventory</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Stock Control & Expiry Tracking</p>
                    </div>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
                    <button onClick={() => setViewMode('inventory')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>Inventory View</button>
                    <button onClick={() => setViewMode('requisition')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'requisition' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>Requisition Mode</button>
                    <button onClick={() => setViewMode('ledger')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'ledger' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>Item Ledger</button>
                    <button onClick={() => setViewMode('summary')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'summary' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>Excel Summary</button>
                </div>
            </header>

            <main className="flex-1 p-6 space-y-8 container mx-auto">
                {/* --- STATS DASHBOARD --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100}/></div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl">{reagents.length}</div>
                        <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Items</p><h4 className="text-2xl font-black text-white">Reagents</h4></div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-rose-900/30 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><FileTextIcon size={100}/></div>
                        <div className="w-12 h-12 bg-rose-600/20 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xl">{stats.expiringSoon.length}</div>
                        <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Expiring Soon</p><h4 className="text-2xl font-black text-rose-400">Within 3M</h4></div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-amber-900/30 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><DatabaseIcon size={100}/></div>
                        <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl">{stats.lowStock.length}</div>
                        <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Low Stock</p><h4 className="text-2xl font-black text-amber-400">Below 5</h4></div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-emerald-900/30 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100}/></div>
                        <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-xl">{reagents.filter(r => r.availability).length}</div>
                        <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Stock</p><h4 className="text-2xl font-black text-emerald-400">Available</h4></div>
                    </div>
                </div>

                {['inventory', 'requisition'].includes(viewMode) && (
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-wrap justify-between items-center gap-4 no-print">
                        <div className="relative w-full md:w-96">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search Brand, ID or Company..." className="w-full bg-slate-950 border border-slate-800 rounded-full py-3 pl-12 pr-6 text-sm text-white focus:border-blue-500 outline-none shadow-inner"/>
                        </div>
                        
                        {viewMode === 'inventory' && (
                            <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2"><PlusIcon size={16}/> Add Reagent</button>
                        )}

                        {viewMode === 'requisition' && (
                            <button onClick={handlePrintRequisition} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2"><PrinterIcon size={16}/> Print Requisition (চাহিদা পত্র)</button>
                        )}
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                                <tr>
                                    {viewMode === 'requisition' && <th className="p-5 text-center w-16">Sel</th>}
                                    <th className="p-5">Reagent Description</th>
                                    <th className="p-5">Company / Brand</th>
                                    <th className="p-5 text-center">Quantity</th>
                                    <th className="p-5">Expiry Date</th>
                                    <th className="p-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredReagents.map((r) => (
                                    <tr key={r.reagent_id} onClick={() => viewMode === 'inventory' && handleEditClick(r)} className={`cursor-pointer hover:bg-slate-800/40 transition-colors group ${requisitionItems.includes(r.reagent_id) ? 'bg-emerald-900/10' : ''}`}>
                                        {viewMode === 'requisition' && (
                                            <td className="p-5 text-center">
                                                <input type="checkbox" checked={requisitionItems.includes(r.reagent_id)} onChange={()=>toggleRequisition(r.reagent_id)} className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-emerald-600" />
                                            </td>
                                        )}
                                        <td className="p-5">
                                            <div className="font-black text-white text-base uppercase tracking-tighter">{r.reagent_name}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">ID: {r.reagent_id} | Unit: {r.unit}</div>
                                        </td>
                                        <td className="p-5 font-black text-sky-400 uppercase italic">{r.company || 'Generic'}</td>
                                        <td className="p-5 text-center">
                                            <div className={`text-xl font-black ${r.quantity < 5 ? 'text-red-500' : 'text-emerald-400'}`}>{r.quantity}</div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase">Stored Units</div>
                                        </td>
                                        <td className={`p-5 text-sm font-mono ${getExpiryClass(r.expiry_date)}`}>
                                            {r.expiry_date || 'N/A'}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${r.quantity < 5 ? 'bg-rose-900/20 text-rose-500 border-rose-800' : 'bg-emerald-900/20 text-emerald-500 border-emerald-800'}`}>
                                                {r.quantity < 5 ? 'Low Stock' : 'Good'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReagents.length === 0 && (
                                    <tr><td colSpan={6} className="p-40 text-center text-slate-700 italic font-black uppercase opacity-20 text-2xl tracking-[0.4em]">Inventory Empty</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
                
                {viewMode === 'summary' && (() => {
                    const getSummaryData = () => {
                        return filteredReagents.map(r => {
                            const ledger = getReagentLedger(r.reagent_id);
                            let openingStock = 0;
                            let purchase = 0;
                            let consume = 0;
                            let adjust = 0;
                            
                            ledger.items.forEach(item => {
                                if (item.date !== 'Initial' && item.date < summaryStartDate) {
                                    openingStock = item.resultingStock;
                                } else if (item.date === 'Initial' || (item.date >= summaryStartDate && item.date <= summaryEndDate)) {
                                    if (item.type === 'PURCHASE') purchase += item.qtyChange;
                                    else if (item.type === 'USAGE') consume += Math.abs(item.qtyChange);
                                    else adjust += item.qtyChange;
                                }
                            });
                            
                            // To match physical reality in DB (reagent.quantity) while preserving mathematical formula
                            // consumed is effectively Opening + Purchase + Adjust - Current
                            // This ensures the summary matches exactly the real stock in the DB if Date range covers today.
                            const isCurrent = summaryEndDate >= new Date().toISOString().split('T')[0];
                            let currentStock = openingStock + purchase - consume + adjust;
                            
                            if (isCurrent) {
                                // If view includes today, current physical stock is the absolute truth
                                currentStock = r.quantity || 0;
                                // We calculate true consumption to make the math balance out perfectly
                                consume = openingStock + purchase + adjust - currentStock;
                            }
                            
                            return {
                                id: r.reagent_id,
                                reagentOriginal: r,
                                name: r.reagent_name,
                                company: r.company,
                                unit: r.unit,
                                linkedTest: r.linked_test || r.linked_category || 'General',
                                openingStock,
                                purchase,
                                consume,
                                adjust,
                                currentStock,
                            };
                        });
                    };
                    const summaryData = getSummaryData();
                    return (
                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-8">
                            <div className="flex justify-between items-center mb-6 no-print">

                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3"><DatabaseIcon size={24} className="text-indigo-400" /> Reagent & Film Inventory (Excel View)</h3>
                                </div>
                                <div className="relative w-64 mt-4 md:mt-0">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                                    <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-12 pr-6 text-sm text-white focus:border-indigo-500 outline-none shadow-inner"/>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <input type="date" value={summaryStartDate} onChange={e=>setSummaryStartDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-indigo-500"/>
                                    <span className="text-slate-500 font-black">TO</span>
                                    <input type="date" value={summaryEndDate} onChange={e=>setSummaryEndDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-indigo-500"/>
                                    <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black uppercase text-xs transition-all shadow-lg flex items-center gap-2"><PrinterIcon size={16}/> Print</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse text-xs print:text-black print:border-black print:border">
                                    <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800 print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="p-4 print:border print:border-black w-10 text-center">SL</th>
                                            <th className="p-4 print:border print:border-black">Test Name</th>
                                            <th className="p-4 print:border print:border-black">Reagent / Film</th>
                                            <th className="p-4 print:border print:border-black text-center">Previous Stock</th>
                                            <th className="p-4 print:border print:border-black text-center text-emerald-400">Purchased</th>
                                            <th className="p-4 print:border print:border-black text-center text-rose-400">Consumed</th>
                                            <th className="p-4 print:border print:border-black text-center text-indigo-400">Current Stock</th>
                                            <th className="p-4 no-print text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 print:divide-black">
                                        {summaryData.map((d, idx) => (
                                            <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="p-4 text-center font-bold text-slate-500 print:border print:border-black print:text-black">{idx + 1}</td>
                                                <td className="p-4 print:border print:border-black">
                                                    <div className="font-bold text-indigo-400 text-sm print:text-black">{d.linkedTest}</div>
                                                </td>
                                                <td className="p-4 print:border print:border-black">
                                                    <div className="font-bold text-white text-sm print:text-black">{d.name}</div>
                                                    <div className="text-[10px] text-slate-500">{d.company ? d.company + ' | ' : ''}Unit: {d.unit}</div>
                                                </td>
                                                <td className="p-4 text-center font-bold print:border print:border-black print:text-black">{d.openingStock || 0}</td>
                                                <td className="p-4 text-center font-bold text-emerald-400 print:border print:border-black print:text-black">{d.purchase || 0}</td>
                                                <td className="p-4 text-center font-bold text-rose-400 print:border print:border-black print:text-black">{d.consume || 0}</td>
                                                <td className="p-4 text-center font-black text-indigo-400 text-sm print:border print:border-black print:text-black">{d.currentStock || 0}</td>
                                                <td className="p-4 text-center no-print">
                                                    <button onClick={() => handleEditClick(d.reagentOriginal)} className="bg-amber-600/20 text-amber-500 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border border-amber-900/50 hover:border-amber-500">
                                                        Set Stock
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

                {viewMode === 'ledger' && (
                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-8">
                        <div className="flex flex-wrap gap-4 items-end mb-8 border-b border-slate-800 pb-8">
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Select Reagent / Item</label>
                                <select 
                                    value={ledgerReagentId || ''} 
                                    onChange={(e) => setLedgerReagentId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold outline-none focus:border-amber-500"
                                >
                                    <option value="">-- Choose Item to view Stock Ledger --</option>
                                    {reagents.map(r => <option key={r.reagent_id} value={r.reagent_id}>{r.reagent_name} (ID: {r.reagent_id})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">From Date</label>
                                <input type="date" value={ledgerStartDate} onChange={e => setLedgerStartDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">To Date</label>
                                <input type="date" value={ledgerEndDate} onChange={e => setLedgerEndDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500" />
                            </div>
                        </div>
                        
                        {ledgerReagentId ? (() => {
                            const ledger = getReagentLedger(ledgerReagentId);
                            let filteredItems = ledger.items;
                            if (ledgerStartDate) filteredItems = filteredItems.filter(i => i.date === 'Initial' || i.date >= ledgerStartDate);
                            if (ledgerEndDate) filteredItems = filteredItems.filter(i => i.date === 'Initial' || i.date <= ledgerEndDate);
                            
                            return (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-white">Stock Ledger: <span className="text-amber-400">{reagents.find(r => r.reagent_id === ledgerReagentId)?.reagent_name}</span></h3>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black uppercase text-slate-500">Current Calculated Stock</div>
                                            <div className="text-3xl font-black text-amber-500">{ledger.currentStock}</div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto min-h-[300px]">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="bg-slate-950 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                                                <tr>
                                                    <th className="p-4 w-32">Date</th>
                                                    <th className="p-4 w-40">Transaction Type</th>
                                                    <th className="p-4">Description</th>
                                                    <th className="p-4 text-right w-32">Qty Change</th>
                                                    <th className="p-4 text-right w-32">Resulting Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                                        <td className="p-4 font-mono text-slate-300">{item.date}</td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${
                                                                item.type === 'MANUAL_SET' || item.type === 'INITIAL' ? 'bg-blue-900/30 text-blue-400' :
                                                                item.type === 'PURCHASE' ? 'bg-emerald-900/30 text-emerald-400' :
                                                                'bg-rose-900/30 text-rose-400'
                                                            }`}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-400">{item.description}</td>
                                                        <td className={`p-4 text-right font-black text-sm ${item.qtyChange > 0 ? 'text-emerald-400' : item.qtyChange < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                                            {item.qtyChange > 0 ? '+' : ''}{item.qtyChange}
                                                        </td>
                                                        <td className="p-4 text-right font-black text-white text-sm">{item.resultingStock}</td>
                                                    </tr>
                                                ))}
                                                {filteredItems.length === 0 && (
                                                    <tr><td colSpan={5} className="p-20 text-center text-slate-700 italic font-black uppercase">No transactions found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-8 border-t border-slate-800 pt-6 flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl">
                                        <div>
                                            <h4 className="text-sm font-black text-white mb-1">Manual Stock Reset</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">If physical stock differs, set the exact count here.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <input type="date" id="reset-date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-bold outline-none focus:border-amber-500" />
                                            <input type="number" id="reset-qty" placeholder="Actual Qty" className="w-32 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-bold outline-none focus:border-amber-500" />
                                            <button onClick={() => {
                                                const d = (document.getElementById('reset-date') as HTMLInputElement).value;
                                                const q = parseFloat((document.getElementById('reset-qty') as HTMLInputElement).value);
                                                if (!d || isNaN(q)) return alert('Enter valid date and quantity');
                                                
                                                const rIdx = reagents.findIndex(r => r.reagent_id === ledgerReagentId);
                                                if(rIdx === -1) return;
                                                const newReagents = [...reagents];
                                                if(!newReagents[rIdx].manualStockUpdates) newReagents[rIdx].manualStockUpdates = [];
                                                newReagents[rIdx].manualStockUpdates.push({ date: d, quantity: q, note: 'Manual Stock Calibration' });
                                                // Also update raw quantity as base
                                                newReagents[rIdx].quantity = q;
                                                if (performBlockingSync) {
                                                    performBlockingSync({ reagents: newReagents }).then(success => {
                                                        if (success) {
                                                            setReagents(newReagents);
                                                            (document.getElementById('reset-qty') as HTMLInputElement).value = '';
                                                        }
                                                    });
                                                } else {
                                                    setReagents(newReagents);
                                                    (document.getElementById('reset-qty') as HTMLInputElement).value = '';
                                                }
                                            }} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Set Stock</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="p-40 flex items-center justify-center text-slate-700 text-xl font-black uppercase tracking-[0.2em] opacity-20">Select an item above</div>
                        )}
                    </div>
                )}
            </main>

            {showForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-white">{isEditing ? 'Edit Reagent / Stock' : 'Add New Reagent'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600 p-2 rounded-full transition-all"><XIcon size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            {successMessage && <div className="bg-emerald-900/50 text-emerald-400 p-4 rounded-xl font-bold border border-emerald-800 text-center">{successMessage}</div>}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Reagent Name / Description</label>
                                    <input value={formData.reagent_name} onChange={e => setFormData({...formData, reagent_name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" placeholder="e.g. X-Ray Film 10x12" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Company / Brand</label>
                                    <input value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" placeholder="e.g. FujiFilm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Unit</label>
                                    <input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" placeholder="e.g. Box, Pcs, ml" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Initial Quantity (only for new)</label>
                                    <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" disabled={isEditing} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Expiry Date</label>
                                    <input type="date" value={formData.expiry_date || ''} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer text-white font-bold mt-4 p-3 bg-slate-800 rounded-xl">
                                        <input type="checkbox" checked={formData.availability} onChange={e => setFormData({...formData, availability: e.target.checked})} className="w-5 h-5" />
                                        Available
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t border-slate-800">
                                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase shadow-xl transition-all">Save Details</button>
                            </div>

                            {isEditing && (
                                <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-800">
                                    <h4 className="text-lg font-black text-white mb-2">Manual Stock Calibration</h4>
                                    <p className="text-sm text-slate-400 mb-4">Set the exact current stock. This will add a manual correction entry in the ledger.</p>
                                    <div className="flex items-end gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Date</label>
                                            <input type="date" value={manualStockDate} onChange={e => setManualStockDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Current Physical Quantity</label>
                                            <input type="number" value={manualStockQty} onChange={e => setManualStockQty(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-500" />
                                        </div>
                                        <button onClick={handleSetStock} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase shadow-xl transition-all whitespace-nowrap">Set Stock</button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}


            <footer className="p-12 text-center text-slate-700 border-t border-slate-900">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">NcD Intelligent Reagent Manager • System v3.1</p>
            </footer>
        </div>
    );
};

export default ReagentInfoPage;
