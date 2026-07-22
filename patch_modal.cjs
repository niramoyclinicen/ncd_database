const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const renderModal = `
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
`;

code = code.replace(
    '</main>',
    '</main>\n' + renderModal
);

fs.writeFileSync('components/ReagentInfoPage.tsx', code);
console.log("Patched modal.");
