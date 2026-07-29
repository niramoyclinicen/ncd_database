const fs = require('fs');
const file = 'components/diagnostic/DiagnosticAccountsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `                                            {!row.isNew ? (
                                                <select value={row.reagentId} onChange={e => updateRow(row.id, 'reagentId', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-sky-500 text-xs">
                                                    <option value="">-- Select Existing Item --</option>
                                                    {reagents.map(rg => <option key={rg.reagent_id} value={rg.reagent_id}>{rg.reagent_name} {rg.company ? \`(\${rg.company})\` : ''}</option>)}
                                                </select>
                                            ) : (`;

const newStr = `                                            {!row.isNew ? (
                                                <SearchableSelect 
                                                    label=""
                                                    options={reagents.map((rg:any) => ({ id: rg.reagent_id, name: rg.reagent_name, details: rg.company }))}
                                                    value={row.reagentId}
                                                    onChange={(id, name) => {
                                                        const exists = reagents.find((r:any) => r.reagent_id === id);
                                                        if (!exists) {
                                                            // Custom name entered
                                                            updateRow(row.id, 'isNew', true);
                                                            updateRow(row.id, 'newReagentName', name);
                                                            updateRow(row.id, 'reagentId', '');
                                                        } else {
                                                            updateRow(row.id, 'reagentId', id);
                                                            updateRow(row.id, 'isNew', false);
                                                        }
                                                    }}
                                                    placeholder="Type Reagent Name to Search or Create New..."
                                                    theme="dark"
                                                    allowCustom={true}
                                                />
                                            ) : (`;

code = code.replace(targetStr, newStr);

// Also remove the checkbox if we want, or keep it. Let's keep it but change the text.
const checkboxStr = `<label className="flex items-center gap-1 cursor-pointer text-sky-400 font-bold text-xs">
                                                    <input type="checkbox" checked={row.isNew} onChange={e => updateRow(row.id, 'isNew', e.target.checked)} className="rounded bg-slate-900 border-slate-700" />
                                                    Add New Reagent
                                                </label>`;
                                                
const newCheckboxStr = `<label className="flex items-center gap-1 cursor-pointer text-emerald-400 font-bold text-xs border border-emerald-500/30 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                                                    <input type="checkbox" checked={row.isNew} onChange={e => updateRow(row.id, 'isNew', e.target.checked)} className="rounded bg-slate-900 border-slate-700" />
                                                    📝 Enter New Reagent Manually
                                                </label>`;

code = code.replace(checkboxStr, newCheckboxStr);
fs.writeFileSync(file, code);
