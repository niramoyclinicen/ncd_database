const fs = require('fs');
const file = 'components/diagnostic/DiagnosticAccountsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update BatchPurchaseModal signature and state init
const oldModalSig = `const BatchPurchaseModal: React.FC<{
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
    const [paid, setPaid] = useState(0);`;

const newModalSig = `const BatchPurchaseModal: React.FC<{
    onClose: () => void,
    onSave: (date: string, items: any[], discount: number, paid: number, existingItem?: any) => void,
    reagents: any[],
    availableTests: any[],
    initialData?: any
}> = ({ onClose, onSave, reagents, availableTests, initialData }) => {
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState(() => {
        if (initialData?.metadata?.items && Array.isArray(initialData.metadata.items)) {
            // Keep identical item structure so we can edit quantities
            return initialData.metadata.items;
        }
        return [{ 
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
        }];
    });
    const [discount, setDiscount] = useState(initialData?.metadata?.discount || 0);
    const [paid, setPaid] = useState(initialData?.paidAmount || 0);`;

code = code.replace(oldModalSig, newModalSig);

// 2. Update BatchPurchaseModal save button
code = code.replace(
    `<button onClick={() => onSave(date, rows, discount, paid)} className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">`,
    `<button onClick={() => onSave(date, rows, discount, paid, initialData)} className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">`
);

// 3. Update handleSaveBatch function signature and logic
const oldHandleSaveBatch = `const handleSaveBatch = async (batchDate: string, batchItems: any[], discount: number, paid: number) => {
        setIsSaving(true);
        const subTotal = batchItems.reduce((acc, r) => acc + (r.qty * r.unitPrice), 0);
        const netPayable = subTotal - discount;

        // Update Reagents Stock!
        let updatedReagents = [...reagents];
        
        batchItems.forEach(b => {
            if(b.isNew) {
                const newId = \`rg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
                b.reagentId = newId; // Update so metadata has the actual ID reference
                updatedReagents.push({
                    reagent_id: newId,
                    reagent_name: b.newReagentName,
                    quantity: b.qty,
                    unit: b.newUnit || 'Bottle',
                    availability: true,
                    company: b.newCompany || '',
                    capacity_per_unit: b.newCapacity || '',
                    linked_test: b.linkedTest || '',
                    linked_category: b.linkedCategory || ''
                });
            } else {
                const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === b.reagentId);
                if(rIdx !== -1) {
                    updatedReagents[rIdx] = {
                        ...updatedReagents[rIdx],
                        quantity: (updatedReagents[rIdx].quantity || 0) + b.qty,
                        linked_test: b.linkedTest || updatedReagents[rIdx].linked_test,
                        linked_category: b.linkedCategory || updatedReagents[rIdx].linked_category
                    };
                }
            }
        });

        const descriptionList = batchItems.map(b => {
            const r = updatedReagents.find((rg:any) => rg.reagent_id === b.reagentId);
            return \`\${r?.reagent_name || 'Unknown'} (\${b.qty})\`;
        }).join(', ');
        
        const newExpense: ExpenseItem = {
            id: Date.now(),
            category: 'Reagent buy', // Default category
            subCategory: 'Batch Purchase',
            description: descriptionList,
            billAmount: netPayable,
            paidAmount: paid,
            dept: 'Diagnostic',
            metadata: { isBatchPurchase: true, discount, items: batchItems }
        };

        const currentExpenses = allDetailedExpenses[batchDate] || [];
        const newDetailedExpenses = {
            ...allDetailedExpenses,
            [batchDate]: [...currentExpenses, newExpense]
        };`;

const newHandleSaveBatch = `const handleSaveBatch = async (batchDate: string, batchItems: any[], discount: number, paid: number, existingItem?: any) => {
        setIsSaving(true);
        const subTotal = batchItems.reduce((acc, r) => acc + (Number(r.qty) * Number(r.unitPrice)), 0);
        const netPayable = subTotal - discount;

        let updatedReagents = [...reagents];
        
        // Revert old stock if editing an existing batch purchase
        if (existingItem && existingItem.metadata?.isBatchPurchase && Array.isArray(existingItem.metadata.items)) {
            existingItem.metadata.items.forEach((oldB: any) => {
                const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === oldB.reagentId);
                if (rIdx !== -1) {
                    updatedReagents[rIdx] = {
                        ...updatedReagents[rIdx],
                        quantity: Math.max(0, (updatedReagents[rIdx].quantity || 0) - (Number(oldB.qty) || 0))
                    };
                }
            });
        }
        
        batchItems.forEach(b => {
            if(b.isNew) {
                const newId = \`rg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
                b.reagentId = newId; 
                updatedReagents.push({
                    reagent_id: newId,
                    reagent_name: b.newReagentName,
                    quantity: Number(b.qty) || 0,
                    unit: b.newUnit || 'Bottle',
                    availability: true,
                    company: b.newCompany || '',
                    capacity_per_unit: b.newCapacity || '',
                    linked_test: b.linkedTest || '',
                    linked_category: b.linkedCategory || ''
                });
            } else {
                const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === b.reagentId);
                if(rIdx !== -1) {
                    updatedReagents[rIdx] = {
                        ...updatedReagents[rIdx],
                        quantity: (updatedReagents[rIdx].quantity || 0) + (Number(b.qty) || 0),
                        linked_test: b.linkedTest || updatedReagents[rIdx].linked_test,
                        linked_category: b.linkedCategory || updatedReagents[rIdx].linked_category
                    };
                }
            }
        });

        const descriptionList = batchItems.map(b => {
            const r = updatedReagents.find((rg:any) => rg.reagent_id === b.reagentId);
            return \`\${r?.reagent_name || 'Unknown'} (\${b.qty})\`;
        }).join(', ');
        
        const newExpense: ExpenseItem = {
            id: existingItem ? existingItem.id : Date.now(),
            category: 'Reagent buy',
            subCategory: 'Batch Purchase',
            description: descriptionList,
            billAmount: netPayable,
            paidAmount: paid,
            dept: 'Diagnostic',
            metadata: { isBatchPurchase: true, discount, items: batchItems },
            editHistory: existingItem ? [...(existingItem.editHistory || []), { timestamp: new Date().toISOString(), field: 'UPDATED', oldValue: 'Batch Edited', newValue: 'Batch Edited' }] : []
        };

        const currentExpenses = allDetailedExpenses[batchDate] || [];
        let updatedDateExpenses = [...currentExpenses];
        
        if (existingItem && existingItem.date === batchDate) {
            const idx = updatedDateExpenses.findIndex(it => it.id === existingItem.id);
            if (idx !== -1) updatedDateExpenses[idx] = newExpense;
        } else if (existingItem && existingItem.date !== batchDate) {
            // Remove from old date, add to new date
            const oldDateExpenses = allDetailedExpenses[existingItem.date] || [];
            allDetailedExpenses[existingItem.date] = oldDateExpenses.filter(it => it.id !== existingItem.id);
            updatedDateExpenses.push(newExpense);
        } else {
            updatedDateExpenses.push(newExpense);
        }

        const newDetailedExpenses = {
            ...allDetailedExpenses,
            [batchDate]: updatedDateExpenses
        };`;

code = code.replace(oldHandleSaveBatch, newHandleSaveBatch);

// 4. Update DailyExpenseForm to handle editing batch purchases
const oldHandleEditSavedItem = `    const handleEditSavedItem = (savedItem: any) => {
        onDateChange(savedItem.date);
        onEdit(savedItem);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };`;

const newHandleEditSavedItem = `    const [editingBatchItem, setEditingBatchItem] = useState<any>(null);

    const handleEditSavedItem = (savedItem: any) => {
        onDateChange(savedItem.date);
        if (savedItem.metadata?.isBatchPurchase) {
            setEditingBatchItem(savedItem);
            setShowBatchModal(true);
        } else {
            onEdit(savedItem);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };`;

code = code.replace(oldHandleEditSavedItem, newHandleEditSavedItem);

// 5. Update BatchPurchaseModal rendering in DailyExpenseForm
const oldBatchRender = `{showBatchModal && (
                    <BatchPurchaseModal 
                        onClose={() => setShowBatchModal(false)}
                        onSave={handleSaveBatch}
                        reagents={reagents}
                        availableTests={availableTests}
                    />
                )}`;

const newBatchRender = `{showBatchModal && (
                    <BatchPurchaseModal 
                        onClose={() => {
                            setShowBatchModal(false);
                            setEditingBatchItem(null);
                        }}
                        onSave={(date, items, discount, paid, existingItem) => {
                            handleSaveBatch(date, items, discount, paid, existingItem);
                            setEditingBatchItem(null);
                        }}
                        reagents={reagents}
                        availableTests={availableTests}
                        initialData={editingBatchItem}
                    />
                )}`;

code = code.replace(oldBatchRender, newBatchRender);

// Also need to clear editingBatchItem on Plus Icon click
const oldPlusIcon = `<button onClick={() => setShowBatchModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2">
                            <PlusIcon size={16}/> Batch Reagent/Film Buy
                        </button>`;
const newPlusIcon = `<button onClick={() => { setEditingBatchItem(null); setShowBatchModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2">
                            <PlusIcon size={16}/> Batch Reagent/Film Buy
                        </button>`;

code = code.replace(oldPlusIcon, newPlusIcon);

fs.writeFileSync(file, code);
console.log("Successfully patched BatchPurchaseModal editing functionality!");
