const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const target1 = `                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-wrap justify-between items-center gap-4 no-print">`;

const replace1 = `                {viewMode !== 'ledger' && (
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-wrap justify-between items-center gap-4 no-print">`;

const target2 = `                            </tbody>
                        </table>
                    </div>
                </div>
            </main>`;

const replace2 = `                            </tbody>
                        </table>
                    </div>
                </div>
                )}
                
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
                                                            <span className={\`px-3 py-1 rounded text-[9px] font-black uppercase \${
                                                                item.type === 'MANUAL_SET' || item.type === 'INITIAL' ? 'bg-blue-900/30 text-blue-400' :
                                                                item.type === 'PURCHASE' ? 'bg-emerald-900/30 text-emerald-400' :
                                                                'bg-rose-900/30 text-rose-400'
                                                            }\`}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-400">{item.description}</td>
                                                        <td className={\`p-4 text-right font-black text-sm \${item.qtyChange > 0 ? 'text-emerald-400' : item.qtyChange < 0 ? 'text-rose-400' : 'text-slate-500'}\`}>
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
                                                setReagents(newReagents);
                                                (document.getElementById('reset-qty') as HTMLInputElement).value = '';
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
            </main>`;

if(code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replace1).replace(target2, replace2);
    fs.writeFileSync('components/ReagentInfoPage.tsx', code);
    console.log("Patched ReagentInfoPage UI successfully");
} else {
    console.log("Not found.");
}
