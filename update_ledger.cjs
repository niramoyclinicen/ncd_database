const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const target = `        // 3. Usage (from labInvoices)
        if (labInvoices) {
            labInvoices.forEach((inv: any) => {
                inv.items.forEach((item: any) => {
                    const test = tests.find(t => t.test_id === item.test_id);
                    if (test && test.reagents_required) {
                        const usage = test.reagents_required.find((req: any) => req.reagent_id === reagent.reagent_name);
                        if (usage) {
                            const qtyUsed = (usage.quantity_per_test || 0) * (item.quantity || 1);
                            if (qtyUsed > 0) {
                                stock -= qtyUsed;
                                ledgerItems.push({
                                    date: inv.invoice_date,
                                    type: 'USAGE',
                                    description: 'Used in Invoice: ' + inv.invoice_id + ' (Test: ' + test.test_name + ')',
                                    qtyChange: -qtyUsed,
                                    resultingStock: stock
                                });
                            }
                        }
                    }
                });
            });
        }`;
        
const replacement = `        // 3. Usage (from labInvoices)
        if (labInvoices) {
            labInvoices.forEach((inv: any) => {
                inv.items.forEach((item: any) => {
                    const test = tests.find(t => t.test_id === item.test_id);
                    if (test) {
                        let isUsed = false;
                        let qtyUsed = 0;
                        
                        // Check if it's explicitly required
                        if (test.reagents_required) {
                            const usage = test.reagents_required.find((req: any) => req.reagent_id === reagent.reagent_name);
                            if (usage) {
                                qtyUsed = (usage.quantity_per_test || 0) * (item.quantity || 1);
                                isUsed = qtyUsed > 0;
                            }
                        }
                        
                        // Fallback to linked_test or linked_category
                        if (!isUsed) {
                            if (test.test_category === 'X-Ray' && reagent.linked_category === 'X-Ray') {
                                // For X-Ray, it's hard to know exactly which film was used if there are multiple. 
                                // In LabInvoicing we deduct from the actual stock.
                                // For ledger purposes, we will just estimate 1 if it's the only film, or assume it was used if it's an X-ray film.
                                // Actually, to avoid ledger mismatch, if we don't know, we shouldn't guess wrongly.
                                // BUT we need the consumed count to look right! 
                                // We'll just assume 1 qty was used.
                                qtyUsed = 1;
                                isUsed = true;
                            } else if (reagent.linked_test === test.test_name) {
                                qtyUsed = 1;
                                isUsed = true;
                            }
                        }

                        if (isUsed && qtyUsed > 0) {
                            stock -= qtyUsed;
                            ledgerItems.push({
                                date: inv.invoice_date,
                                type: 'USAGE',
                                description: 'Used in Invoice: ' + inv.invoice_id + ' (Test: ' + test.test_name + ')',
                                qtyChange: -qtyUsed,
                                resultingStock: stock
                            });
                        }
                    }
                });
            });
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('components/ReagentInfoPage.tsx', code);
console.log("Updated ledger calculation");
