const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const target1 = `    detailedExpenses?: any;
    labInvoices?: any;
}`;
const replace1 = `    detailedExpenses?: any;
    labInvoices?: any;
    tests?: any[];
}`;

const target2 = `const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents, detailedExpenses, labInvoices }) => {`;
const replace2 = `const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents, detailedExpenses, labInvoices, tests = [] }) => {`;

const target3 = `        // 3. Usage (from labInvoices)
        // This requires tests to be linked to lab invoices. We don't have tests here, but we can assume usage from somewhere?
        // Actually, without \`tests\` passed to ReagentInfoPage, we can't easily parse LabInvoices to see which tests use this reagent.
        // I need to patch DiagnosticPage to pass tests as well!
        
        return { items: ledgerItems.sort((a,b) => a.date.localeCompare(b.date)), currentStock: stock };
    };`;

const replace3 = `        // 3. Usage (from labInvoices)
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
        }
        
        return { items: ledgerItems.sort((a,b) => {
            if(a.date === 'Initial') return -1;
            if(b.date === 'Initial') return 1;
            return a.date.localeCompare(b.date);
        }), currentStock: stock };
    };`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
code = code.replace(target3, replace3);

fs.writeFileSync('components/ReagentInfoPage.tsx', code);
