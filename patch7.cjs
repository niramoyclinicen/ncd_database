const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const target1 = `                    <button onClick={() => setViewMode('inventory')} className={\`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all \${viewMode === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}\`}>Inventory View</button>
                    <button onClick={() => setViewMode('requisition')} className={\`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all \${viewMode === 'requisition' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}\`}>Requisition Mode</button>`;

const replace1 = `                    <button onClick={() => setViewMode('inventory')} className={\`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all \${viewMode === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}\`}>Inventory View</button>
                    <button onClick={() => setViewMode('requisition')} className={\`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all \${viewMode === 'requisition' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}\`}>Requisition Mode</button>
                    <button onClick={() => setViewMode('ledger')} className={\`px-8 py-2.5 rounded-xl font-black text-xs uppercase transition-all \${viewMode === 'ledger' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}\`}>Stock Ledger</button>`;

const target2 = `                                {filteredReagents.length === 0 && (
                                    <tr><td colSpan={6} className="p-40 text-center text-slate-700 italic font-black uppercase opacity-20 text-2xl tracking-[0.4em]">Inventory Empty</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>`;

const replace2 = `                                {filteredReagents.length === 0 && (
                                    <tr><td colSpan={6} className="p-40 text-center text-slate-700 italic font-black uppercase opacity-20 text-2xl tracking-[0.4em]">Inventory Empty</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>`; // Wait, need to conditionally render the inventory view

if(code.includes(target1)) {
    code = code.replace(target1, replace1);
    fs.writeFileSync('components/ReagentInfoPage.tsx', code);
    console.log("Patched tab buttons.");
}
