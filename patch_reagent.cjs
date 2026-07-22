const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

code = code.replace(
    'tests?: any[];',
    'tests?: any[];\n    performBlockingSync?: (overrides?: any) => Promise<boolean>;'
);

code = code.replace(
    'labInvoices, tests = [] }) => {',
    'labInvoices, tests = [], performBlockingSync }) => {'
);

const oldStockBtn = `                                                newReagents[rIdx].quantity = q;
                                                setReagents(newReagents);
                                                (document.getElementById('reset-qty') as HTMLInputElement).value = '';
                                            }}`;

const newStockBtn = `                                                newReagents[rIdx].quantity = q;
                                                if (performBlockingSync) {
                                                    performBlockingSync({ reagents: newReagents }).then(success => {
                                                        if (success) {
                                                            setReagents(newReagents);
                                                            (document.getElementById('reset-qty') as HTMLInputElement).value = '';
                                                        }
                                                    });
                                                } else {
                                                    setReagents(newReagents);
                                                    (document.getElementById('reset-qty') as HTMLInputElement).value = '';
                                                }
                                            }}`;

code = code.replace(oldStockBtn, newStockBtn);
fs.writeFileSync('components/ReagentInfoPage.tsx', code);
console.log("Patched ReagentInfoPage.tsx");
