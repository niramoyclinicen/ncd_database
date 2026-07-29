const fs = require('fs');
const file = 'components/diagnostic/DiagnosticAccountsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetFunctionStart = "const handleSaveBatch = async (batchDate: string, batchItems: any[], discount: number, paid: number) => {";
const nextFunctionStart = "const handleSave = () => {";

const startIndex = code.indexOf(targetFunctionStart);
const endIndex = code.indexOf(nextFunctionStart, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find boundaries.");
    process.exit(1);
}

const newFunction = `const handleSaveBatch = async (batchDate: string, batchItems: any[], discount: number, paid: number) => {
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
        };

        if (performBlockingSync) {
            const success = await performBlockingSync({ 
                detailedExpenses: newDetailedExpenses,
                reagents: updatedReagents
            });
            setIsSaving(false);
            if(success) {
                if (setDetailedExpenses) setDetailedExpenses(newDetailedExpenses);
                if (setReagents) setReagents(updatedReagents);
                setShowBatchModal(false);
                setSuccessMessage('Batch purchase saved & stock updated!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                alert('Failed to save batch purchase.');
            }
        } else {
            setIsSaving(false);
            setShowBatchModal(false);
        }
    };

    `;

code = code.substring(0, startIndex) + newFunction + code.substring(endIndex);
fs.writeFileSync(file, code);
console.log("Replaced handleSaveBatch.");
