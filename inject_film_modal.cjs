const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

const target = `{confirmModal.isOpen && (`;
const replacement = `{pendingFilmSelections && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex justify-center items-center" aria-modal="true" role="dialog">
                <div className="bg-slate-800 border-2 border-slate-700 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[1001] w-full max-w-lg animate-zoom-in">
                    <h3 className="text-2xl font-black text-white mb-6">Select X-Ray Film</h3>
                    <p className="text-slate-300 text-sm mb-6">Please select which film size to deduct for the following X-Ray tests:</p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {pendingFilmSelections.map((sel, idx) => (
                            <div key={sel.test_id} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <div className="text-emerald-400 font-bold mb-2">{sel.test_name}</div>
                                <select 
                                    value={sel.film_reagent_id || ''}
                                    onChange={e => {
                                        const newSels = [...pendingFilmSelections];
                                        newSels[idx].film_reagent_id = e.target.value;
                                        setPendingFilmSelections(newSels);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500"
                                >
                                    {reagents.filter(r => r.linked_category === 'X-Ray' || r.reagent_name.toLowerCase().includes('film') || r.reagent_name.toLowerCase().includes('x-ray')).map(r => (
                                        <option key={r.reagent_id} value={r.reagent_id}>{r.reagent_name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setPendingFilmSelections(null)} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
                        <button onClick={() => {
                            setPendingFilmSelections(null);
                            setConfirmModal({
                                isOpen: true,
                                title: 'Confirm Save',
                                message: 'আপনি কি এই ল্যাব ইনভয়েসটি সেভ করতে চান?',
                                onConfirm: () => executeSave()
                            });
                        }} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/50">Continue to Save</button>
                    </div>
                </div>
            </div>
        )}

        {confirmModal.isOpen && (`;
        
code = code.replace(target, replacement);
fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log("Injected pendingFilmSelections modal");
