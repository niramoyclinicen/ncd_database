const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const targetLogic = `            const newState = { ...safePrev, [date]: [...otherDeptItems, ...finalDiagItems] };
            
            console.log(\`[DiagnosticAccounts] Saving/Appending \${incomingItems.length} items for \${date}\`);
            const success = await performBlockingSync({ detailedExpenses: newState });`;
            
const replaceLogic = `            const newState = { ...safePrev, [date]: [...otherDeptItems, ...finalDiagItems] };
            
            // If there are reagent buys or film buys, we might want to update the Reagent's linked_test or linked_category globally!
            let updatedReagents = [...reagents];
            let reagentsModified = false;
            incomingItems.forEach(it => {
                if (it.category === 'Reagent buy' || it.category === 'X-ray Film buy') {
                    const rIdx = updatedReagents.findIndex(rg => rg.reagent_name === it.subCategory);
                    if (rIdx !== -1) {
                        if (it.metadata?.linkedTest || it.metadata?.linkedCategory) {
                            updatedReagents[rIdx] = {
                                ...updatedReagents[rIdx],
                                linked_test: it.metadata?.linkedTest || updatedReagents[rIdx].linked_test,
                                linked_category: it.metadata?.linkedCategory || updatedReagents[rIdx].linked_category
                            };
                            reagentsModified = true;
                        }
                    }
                }
            });

            console.log(\`[DiagnosticAccounts] Saving/Appending \${incomingItems.length} items for \${date}\`);
            const syncPayload: any = { detailedExpenses: newState };
            if (reagentsModified) {
                syncPayload.reagents = updatedReagents;
            }
            const success = await performBlockingSync(syncPayload);`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated executeSaveExpense");
