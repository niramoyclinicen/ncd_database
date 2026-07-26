const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const targetSummaryBlock = `                    const getSummaryData = () => {
                        return reagents.map(r => {
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
                            
                            // If no ledger item was before summaryStartDate, opening stock is 0 (or Initial if Initial is before, but handled above)
                            const currentStock = openingStock + purchase - consume + adjust;
                            return {
                                id: r.reagent_id,
                                name: r.reagent_name,
                                company: r.company,
                                unit: r.unit,
                                openingStock,
                                purchase,
                                consume,
                                adjust,
                                currentStock,
                                rawLedgerStock: ledger.currentStock // just for debug
                            };
                        });
                    };
                    const summaryData = getSummaryData();
                    return (
                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-8">
                            <div className="flex justify-between items-center mb-6 no-print">
                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3"><DatabaseIcon size={24} className="text-indigo-400" /> Date-to-Date Stock Summary</h3>
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
                                            <th className="p-4 print:border print:border-black">Item Name</th>
                                            <th className="p-4 print:border print:border-black text-center">Opening Stock</th>
                                            <th className="p-4 print:border print:border-black text-center text-emerald-400">Purchased</th>
                                            <th className="p-4 print:border print:border-black text-center text-rose-400">Consumed</th>
                                            <th className="p-4 print:border print:border-black text-center text-amber-400">Wastage / Adjust</th>
                                            <th className="p-4 print:border print:border-black text-center text-indigo-400">Closing Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 print:divide-black">
                                        {summaryData.map(d => (
                                            <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="p-4 print:border print:border-black">
                                                    <div className="font-bold text-white text-sm print:text-black">{d.name}</div>
                                                    <div className="text-[10px] text-slate-500">{d.company ? d.company + ' | ' : ''}Unit: {d.unit}</div>
                                                </td>
                                                <td className="p-4 text-center font-bold print:border print:border-black print:text-black">{d.openingStock}</td>
                                                <td className="p-4 text-center font-bold text-emerald-400 print:border print:border-black print:text-black">{d.purchase}</td>
                                                <td className="p-4 text-center font-bold text-rose-400 print:border print:border-black print:text-black">{d.consume}</td>
                                                <td className="p-4 text-center font-bold text-amber-400 print:border print:border-black print:text-black">{d.adjust}</td>
                                                <td className="p-4 text-center font-black text-indigo-400 text-sm print:border print:border-black print:text-black">{d.currentStock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );`;

const newSummaryBlock = `                    const getSummaryData = () => {
                        return reagents.map(r => {
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
                    );`;

if(code.includes('const getSummaryData = () => {')) {
    code = code.replace(targetSummaryBlock, newSummaryBlock);
    fs.writeFileSync('components/ReagentInfoPage.tsx', code);
    console.log("Updated summary table successfully!");
} else {
    console.log("Could not find the target block to replace.");
}
