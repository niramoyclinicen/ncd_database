const fs = require('fs');
const file = 'components/diagnostic/DiagnosticAccountsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetFuncStr = `    const executeDeleteExpense = async (date: string, id: number) => {
        try {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            const safeDetailedExpenses = detailedExpenses || {};
            const existingItems = safeDetailedExpenses[date] || [];
            const updatedItems = existingItems.map((it: any) => {
                if (it.id === id) {
                    const history = it.editHistory || [];
                    const newLog = {
                        timestamp: new Date().toISOString(),
                        field: 'DELETED',
                        oldValue: 'Active',
                        newValue: 'Deleted'
                    };
                    return { ...it, isDeleted: true, editHistory: [...history, newLog] };
                }
                return it;
            });
            
            const newDetailedExpenses = { ...safeDetailedExpenses, [date]: updatedItems };
            
            console.log(\`[DiagnosticAccounts] Deleting item \${id} for \${date}\`);
            const success = await performBlockingSync({ detailedExpenses: newDetailedExpenses });
            
            if (success) {
                setDetailedExpenses(newDetailedExpenses);
                setSuccessMessage("খরচটি সফলভাবে ডিলিট করা হয়েছে।");
            } else {
                console.error("[DiagnosticAccounts] Sync failed during delete");
                alert("ডাটাসিঙ্ক করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
            }
        } catch (err) {
            console.error("[DiagnosticAccounts] Critical error deleting expense:", err);
            alert("সিস্টেম এরর হয়েছে। দয়া করে পেজটি রিফ্রেশ দিন।");
        }
    };`;

const newFuncStr = `    const executeDeleteExpense = async (date: string, id: number) => {
        try {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            const safeDetailedExpenses = detailedExpenses || {};
            const existingItems = safeDetailedExpenses[date] || [];
            
            let updatedReagents = [...reagents];
            let reagentsModified = false;

            const updatedItems = existingItems.map((it: any) => {
                if (it.id === id) {
                    const history = it.editHistory || [];
                    const newLog = {
                        timestamp: new Date().toISOString(),
                        field: 'DELETED',
                        oldValue: 'Active',
                        newValue: 'Deleted'
                    };
                    
                    // IF it's a batch purchase, revert stock
                    if (it.metadata?.isBatchPurchase && Array.isArray(it.metadata.items)) {
                        it.metadata.items.forEach((b: any) => {
                            const rIdx = updatedReagents.findIndex(rg => rg.reagent_id === b.reagentId);
                            if (rIdx !== -1) {
                                updatedReagents[rIdx] = {
                                    ...updatedReagents[rIdx],
                                    quantity: Math.max(0, (updatedReagents[rIdx].quantity || 0) - (b.qty || 0))
                                };
                                reagentsModified = true;
                            }
                        });
                    }

                    return { ...it, isDeleted: true, editHistory: [...history, newLog] };
                }
                return it;
            });
            
            const newDetailedExpenses = { ...safeDetailedExpenses, [date]: updatedItems };
            
            console.log(\`[DiagnosticAccounts] Deleting item \${id} for \${date}\`);
            
            const syncPayload: any = { detailedExpenses: newDetailedExpenses };
            if (reagentsModified) {
                syncPayload.reagents = updatedReagents;
            }
            
            const success = await performBlockingSync(syncPayload);
            
            if (success) {
                setDetailedExpenses(newDetailedExpenses);
                if (reagentsModified) setReagents(updatedReagents);
                setSuccessMessage("খরচটি সফলভাবে ডিলিট করা হয়েছে। (Reagent Stock Reverted)");
            } else {
                console.error("[DiagnosticAccounts] Sync failed during delete");
                alert("ডাটাসিঙ্ক করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
            }
        } catch (err) {
            console.error("[DiagnosticAccounts] Critical error deleting expense:", err);
            alert("সিস্টেম এরর হয়েছে। দয়া করে পেজটি রিফ্রেশ দিন।");
        }
    };`;

code = code.replace(targetFuncStr, newFuncStr);
fs.writeFileSync(file, code);
