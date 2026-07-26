const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const targetLogic = `        batchItems.forEach(b => {
            const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === b.reagentId);
            if(rIdx !== -1) {
                updatedReagents[rIdx] = {
                    ...updatedReagents[rIdx],
                    quantity: (updatedReagents[rIdx].quantity || 0) + b.qty
                };
            }
        });`;
            
const replaceLogic = `        batchItems.forEach(b => {
            const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === b.reagentId);
            if(rIdx !== -1) {
                updatedReagents[rIdx] = {
                    ...updatedReagents[rIdx],
                    quantity: (updatedReagents[rIdx].quantity || 0) + b.qty,
                    linked_test: b.linkedTest || updatedReagents[rIdx].linked_test,
                    linked_category: b.linkedCategory || updatedReagents[rIdx].linked_category
                };
            }
        });`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated handleSaveBatch");
