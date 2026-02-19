
import React, { useState, useEffect, useMemo } from 'react';
import { Reagent, emptyReagent } from './DiagnosticData';
import { Activity, PrinterIcon, SearchIcon, BeakerIcon, DatabaseIcon, PlusIcon, FileTextIcon } from './Icons';

interface ReagentInfoPageProps {
    reagents: Reagent[];
    setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;
}

const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents }) => {
    const [viewMode, setViewMode] = useState<'inventory' | 'requisition'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReagentId, setSelectedReagentId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Reagent>(emptyReagent);
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Requisition Logic
    const [requisitionItems, setRequisitionItems] = useState<string[]>([]); // Array of reagent IDs

    const filteredReagents = useMemo(() => {
        return reagents.filter(r =>
            r.reagent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reagent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.company && r.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, reagents]);

    const stats = useMemo(() => {
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);

        const expiringSoon = reagents.filter(r => r.expiry_date && new Date(r.expiry_date) <= threeMonthsFromNow && new Date(r.expiry_date) >= today);
        const expired = reagents.filter(r => r.expiry_date && new Date(r.expiry_date) < today);
        const lowStock = reagents.filter(r => r.quantity < 5);

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
                    <button onClick={() => setViewMode('inventory')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Inventory View</button>
                    <button onClick={() => setViewMode('requisition')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${viewMode === 'requisition' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>Requisition Mode</button>
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

                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-wrap justify-between items-center gap-4 no-print">
                        <div className="relative w-full md:w-96">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search Brand, ID or Company..." className="w-full bg-slate-950 border border-slate-800 rounded-full py-3 pl-12 pr-6 text-sm text-white focus:border-blue-500 outline-none shadow-inner"/>
                        </div>
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
                                    <tr key={r.reagent_id} className={`hover:bg-slate-800/40 transition-colors group ${requisitionItems.includes(r.reagent_id) ? 'bg-emerald-900/10' : ''}`}>
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
            </main>

            <footer className="p-12 text-center text-slate-700 border-t border-slate-900">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">NcD Intelligent Reagent Manager • System v3.1</p>
            </footer>
        </div>
    );
};

export default ReagentInfoPage;
