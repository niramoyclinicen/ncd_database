const fs = require('fs');
let code = fs.readFileSync('components/TestInfoPage.tsx', 'utf8');

const target = `                    {!formData.is_group_test && (`;

const replacement = `
                    <div className="md:col-span-2 bg-slate-900 border border-emerald-900/30 p-5 rounded-2xl">
                        <label className="text-xs font-black uppercase text-slate-500 mb-4 block">Reagents / X-Ray Films Required Per Test</label>
                        <div className="space-y-3">
                            {(formData.reagents_required || []).map((req, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <select 
                                        value={req.reagent_id} 
                                        onChange={e => {
                                            const newReq = [...(formData.reagents_required || [])];
                                            newReq[idx].reagent_id = e.target.value;
                                            setFormData({ ...formData, reagents_required: newReq });
                                        }}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm outline-none focus:border-emerald-500"
                                    >
                                        <option value="">-- Select Reagent / Film --</option>
                                        {reagents.map(r => <option key={r.reagent_id} value={r.reagent_name}>{r.reagent_name} ({r.unit})</option>)}
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Qty" 
                                        value={req.quantity_per_test || ''} 
                                        onChange={e => {
                                            const newReq = [...(formData.reagents_required || [])];
                                            newReq[idx].quantity_per_test = parseFloat(e.target.value) || 0;
                                            setFormData({ ...formData, reagents_required: newReq });
                                        }}
                                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm text-center outline-none focus:border-emerald-500" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newReq = [...(formData.reagents_required || [])];
                                            newReq.splice(idx, 1);
                                            setFormData({ ...formData, reagents_required: newReq });
                                        }}
                                        className="text-rose-500 font-bold px-2 hover:text-rose-400"
                                    >×</button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => setFormData({ ...formData, reagents_required: [...(formData.reagents_required || []), { reagent_id: '', quantity_per_test: 1 }] })}
                                className="text-emerald-500 text-xs font-black uppercase hover:text-emerald-400 transition-colors"
                            >+ Add Resource Configuration</button>
                        </div>
                    </div>

                    {!formData.is_group_test && (`

if (code.includes(target)) {
    fs.writeFileSync('components/TestInfoPage.tsx', code.replace(target, replacement));
    console.log("Patched successfully");
} else {
    console.log("Target not found!");
}
