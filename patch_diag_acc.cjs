const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

code = code.replace(
    'patients, doctors, diagnosticSettings, setDiagnosticSettings, performBlockingSync, availableTests = []',
    'patients, doctors, diagnosticSettings, setDiagnosticSettings, performBlockingSync, availableTests = [], reagents = []'
);

// We need to inject reagents into getSubCategories
// 'Reagent buy' and 'X-ray Film buy'

code = code.replace(
    'const getSubCategories = (category: string) => {',
    `const getSubCategories = (category: string) => {
        let defaultSubs = subCategoryMap[category] || [];
        if (category === 'Reagent buy' || category === 'X-ray Film buy') {
            const reagentNames = reagents.map((r: any) => r.reagent_name).filter(Boolean);
            defaultSubs = [...defaultSubs, ...reagentNames];
        }`
);

code = code.replace(
    'const defaultSubs = subCategoryMap[category] || [];',
    '' // remove the old declaration
);

fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Patched DiagnosticAccountsPage.tsx");
