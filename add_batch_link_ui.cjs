const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const targetSelect = `                                        <select value={row.reagentId} onChange={e => updateRow(row.id, 'reagentId', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-sky-500">
                                            <option value="">-- Select Item --</option>
                                            {reagents.map(rg => <option key={rg.reagent_id} value={rg.reagent_id}>{rg.reagent_name} {rg.company ? \`(\${rg.company})\` : ''}</option>)}
                                        </select>`;
                                        
const replaceSelect = `                                        <select value={row.reagentId} onChange={e => updateRow(row.id, 'reagentId', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-sky-500">
                                            <option value="">-- Select Item --</option>
                                            {reagents.map(rg => <option key={rg.reagent_id} value={rg.reagent_id}>{rg.reagent_name} {rg.company ? \`(\${rg.company})\` : ''}</option>)}
                                        </select>
                                        {(() => {
                                            const rg = reagents.find((r:any) => r.reagent_id === row.reagentId);
                                            if (!rg) return null;
                                            const isFilm = rg.reagent_name.toLowerCase().includes('film') || rg.reagent_name.toLowerCase().includes('x-ray');
                                            if (isFilm) {
                                                return (
                                                    <div className="mt-2">
                                                        <select value={row.linkedCategory || 'X-Ray'} onChange={e => updateRow(row.id, 'linkedCategory', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 font-bold outline-none">
                                                            <option value="">-- Link to Category --</option>
                                                            {testCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="mt-2">
                                                        <select value={row.linkedTest || ''} onChange={e => updateRow(row.id, 'linkedTest', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 font-bold outline-none">
                                                            <option value="">-- Link to Test Name --</option>
                                                            {(availableTests || []).map((t: any) => <option key={t.test_id} value={t.test_name}>{t.test_name}</option>)}
                                                        </select>
                                                    </div>
                                                );
                                            }
                                        })()}`;

code = code.replace(targetSelect, replaceSelect);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated Batch UI");
