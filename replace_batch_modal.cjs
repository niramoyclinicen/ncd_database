const fs = require('fs');
const file = 'components/diagnostic/DiagnosticAccountsPage.tsx';
const code = fs.readFileSync(file, 'utf8');

const newModal = `const BatchPurchaseModal: React.FC<{
    onClose: () => void,
    onSave: (date: string, items: any[], discount: number, paid: number) => void,
    reagents: any[],
    availableTests: any[]
}> = ({ onClose, onSave, reagents, availableTests }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState(() => [{ 
        id: Date.now(), 
        reagentId: '', 
        isNew: false,
        newReagentName: '',
        newCompany: '',
        newUnit: 'Bottle',
        newCapacity: '',
        linkedTest: '',
        linkedCategory: '',
        qty: 1, 
        unitPrice: 0 
    }]);
    const [discount, setDiscount] = useState(0);
    const [paid, setPaid] = useState(0);

    const handleAddRow = () => setRows([...rows, { 
        id: Date.now(), 
        reagentId: '', 
        isNew: false,
        newReagentName: '',
        newCompany: '',
        newUnit: 'Bottle',
        newCapacity: '',
        linkedTest: '',
        linkedCategory: '',
        qty: 1, 
        unitPrice: 0 
    }]);
    const handleRemoveRow = (id: number) => setRows(rows.filter(r => r.id !== id));
    
    const updateRow = (id: number, field: string, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const subTotal = rows.reduce((acc, r) => acc + (r.qty * r.unitPrice), 0);
    const netPayable = subTotal - discount;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-black text-sky-400 uppercase tracking-tighter flex items-center gap-2">
                            <FileTextIcon size={24}/> Batch Purchase Entry (Reagent / Film)
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Add multiple items into a single invoice</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-rose-600 rounded-xl transition-all text-white"><XIcon size={20} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Invoice / Purchase Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-sky-500"/>
                        </div>
                    </div>

                    <div className="space-y-4 mb-4">
                        {rows.map((row, i) => {
                            const isFilm = row.isNew 
                                ? (row.newReagentName.toLowerCase().includes('film') || row.newReagentName.toLowerCase().includes('x-ray'))
                                : (() => {
                                    const rg = reagents.find((r:any) => r.reagent_id === row.reagentId);
                                    return rg ? (rg.reagent_name.toLowerCase().includes('film') || rg.reagent_name.toLowerCase().includes('x-ray')) : false;
                                })();
                                
                            return (
                                <div key={row.id} className="bg-slate-950 border border-slate-700 rounded-xl p-4 flex flex-col gap-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Item Selection</label>
                                                <label className="flex items-center gap-1 cursor-pointer text-sky-400 font-bold text-xs">
                                                    <input type="checkbox" checked={row.isNew} onChange={e => updateRow(row.id, 'isNew', e.target.checked)} className="rounded bg-slate-900 border-slate-700" />
                                                    Add New Reagent
                                                </label>
                                            </div>
                                            {!row.isNew ? (
                                                <select value={row.reagentId} onChange={e => updateRow(row.id, 'reagentId', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-sky-500 text-xs">
                                                    <option value="">-- Select Existing Item --</option>
                                                    {reagents.map(rg => <option key={rg.reagent_id} value={rg.reagent_id}>{rg.reagent_name} {rg.company ? \`(\${rg.company})\` : ''}</option>)}
                                                </select>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    <input type="text" placeholder="Reagent Generic Name" value={row.newReagentName} onChange={e => updateRow(row.id, 'newReagentName', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-sky-500" />
                                                    <input type="text" placeholder="Company Name" value={row.newCompany} onChange={e => updateRow(row.id, 'newCompany', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-sky-500" />
                                                    <select value={row.newUnit} onChange={e => updateRow(row.id, 'newUnit', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-sky-500">
                                                        <option value="Bottle">Bottle</option>
                                                        <option value="Box">Box</option>
                                                        <option value="Piece">Piece</option>
                                                        <option value="Vial">Vial</option>
                                                        <option value="Kit">Kit</option>
                                                        <option value="Pack">Pack</option>
                                                    </select>
                                                    <input type="number" placeholder="Tests Per Unit" value={row.newCapacity} onChange={e => updateRow(row.id, 'newCapacity', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-sky-500" title="How many tests per unit" />
                                                </div>
                                            )}
                                            
                                            {(row.reagentId || row.isNew) && (
                                                <div className="mt-3">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Link with Test or Category</label>
                                                    {isFilm ? (
                                                        <select value={row.linkedCategory || 'X-Ray'} onChange={e => updateRow(row.id, 'linkedCategory', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 font-bold outline-none">
                                                            <option value="">-- Link to Category --</option>
                                                            {testCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    ) : (
                                                        <select value={row.linkedTest || ''} onChange={e => updateRow(row.id, 'linkedTest', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 font-bold outline-none">
                                                            <option value="">-- Link to Test Name --</option>
                                                            {(availableTests || []).map((t: any) => <option key={t.test_id} value={t.test_name}>{t.test_name}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-24">
                                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block text-center">Qty</label>
                                            <input type="number" min="1" value={row.qty} onChange={e => updateRow(row.id, 'qty', parseFloat(e.target.value)||0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-center text-xs"/>
                                        </div>
                                        <div className="w-28">
                                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block text-right">Unit Price</label>
                                            <input type="number" min="0" value={row.unitPrice} onChange={e => updateRow(row.id, 'unitPrice', parseFloat(e.target.value)||0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-right text-xs"/>
                                        </div>
                                        <div className="w-28 text-right flex flex-col justify-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Total</label>
                                            <div className="font-black text-white text-sm py-2 mt-4">
                                                {(row.qty * row.unitPrice).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="w-10 flex flex-col justify-center items-center">
                                            <label className="text-[10px] font-black text-transparent uppercase mb-1 block">X</label>
                                            <button onClick={() => handleRemoveRow(row.id)} className="text-rose-500 hover:text-rose-400 p-2 bg-rose-500/10 rounded-lg mt-5"><XIcon size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <button onClick={handleAddRow} className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all mb-8">+ Add Row</button>

                    <div className="flex justify-end pt-6 border-t border-slate-700">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-slate-300"><span>Sub Total:</span><span className="font-bold">{subTotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm text-slate-300 items-center">
                                <span>Discount:</span>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value)||0)} className="w-24 bg-slate-950 border border-slate-700 rounded p-1 text-right text-white"/>
                            </div>
                            <div className="flex justify-between text-base text-white font-black py-2 border-t border-slate-700"><span>Net Payable:</span><span>{netPayable.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm text-slate-300 items-center">
                                <span>Paid Amount:</span>
                                <input type="number" value={paid} onChange={e => setPaid(parseFloat(e.target.value)||0)} className="w-24 bg-slate-950 border border-slate-700 rounded p-1 text-right text-white"/>
                            </div>
                            <div className="flex justify-between text-base font-black pt-2 border-t border-slate-700">
                                <span>Due:</span>
                                <span className={(netPayable - paid) > 0 ? "text-rose-400" : "text-emerald-400"}>{(netPayable - paid).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 border-t border-slate-700 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-black text-xs uppercase text-slate-300 hover:bg-slate-700 transition-all">Cancel</button>
                    <button onClick={() => {
                        const validRows = rows.filter(r => r.qty > 0 && r.unitPrice > 0 && (r.reagentId || (r.isNew && r.newReagentName)));
                        if(validRows.length === 0) return alert('Please enter valid items. Ensure Reagent name is specified.');
                        onSave(date, validRows, discount, paid);
                    }} className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-2">Save Invoice & Update Stock</button>
                </div>
            </div>
        </div>
    );
};`

const startIndex = code.indexOf('const BatchPurchaseModal: React.FC<{');
let endIndex = code.indexOf('};', code.indexOf('</div>', startIndex));
endIndex = code.indexOf('};', endIndex + 1) + 2;
// Check if it ends there
const nextLine = code.substring(endIndex).trim().substring(0, 20);
if(nextLine.startsWith('const SummaryBox')) {
    const finalCode = code.substring(0, startIndex) + newModal + "\n" + code.substring(endIndex);
    fs.writeFileSync(file, finalCode);
    console.log('Replaced correctly');
} else {
    // try to find where it ends
    let nextStart = code.indexOf('const SummaryBox', startIndex);
    if(nextStart > -1) {
        const finalCode = code.substring(0, startIndex) + newModal + "\n" + code.substring(nextStart);
        fs.writeFileSync(file, finalCode);
        console.log('Replaced correctly with SummaryBox');
    } else {
        console.log('Failed to find replace boundary');
    }
}
