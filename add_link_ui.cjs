const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const target = `                                                <div className="ml-auto text-right">
                                                    <div className="text-[9px] text-slate-500 font-black uppercase">Total Add</div>
                                                    <div className="text-emerald-400 font-black text-sm">
                                                        +{(item.metadata?.numberOfBoxes || 0) * (item.metadata?.quantityPerBox || 0)}
                                                    </div>
                                                </div>
                                            </div>`;
                                            
const replacement = `                                                <div className="ml-auto text-right">
                                                    <div className="text-[9px] text-slate-500 font-black uppercase">Total Add</div>
                                                    <div className="text-emerald-400 font-black text-sm">
                                                        +{(item.metadata?.numberOfBoxes || 0) * (item.metadata?.quantityPerBox || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {item.category === 'Reagent buy' && (
                                            <div className="mt-2">
                                                <select 
                                                    value={item.metadata?.linkedTest || ''} 
                                                    onChange={e => handleItemChange(item.id, 'metadata', { ...item.metadata, linkedTest: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-sky-400 font-bold outline-none focus:border-sky-500"
                                                >
                                                    <option value="">-- Link to Test Name --</option>
                                                    {(availableTests || []).map((t: any) => (
                                                        <option key={t.test_id} value={t.test_name}>{t.test_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {item.category === 'X-ray Film buy' && (
                                            <div className="mt-2">
                                                <select 
                                                    value={item.metadata?.linkedCategory || 'X-Ray'} 
                                                    onChange={e => handleItemChange(item.id, 'metadata', { ...item.metadata, linkedCategory: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-sky-400 font-bold outline-none focus:border-sky-500"
                                                >
                                                    <option value="">-- Link to Test Category --</option>
                                                    {testCategories.map((c: string) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>`;
                                            
code = code.replace(target, replacement);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated UI");
