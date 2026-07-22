const fs = require('fs');

// Reverse App.tsx
let app = fs.readFileSync('App.tsx', 'utf8');
app = app.replace(
    'tests={tests}\n            reagents={reagents}\n            setReagents={setReagents}',
    'tests={tests}\n            setReagents={setReagents}'
);
fs.writeFileSync('App.tsx', app);
console.log("Reverted App.tsx");

// Reverse AccountingPage.tsx
let accCode = fs.readFileSync('components/AccountingPage.tsx', 'utf8');
accCode = accCode.replace(
    'tests: Test[];\n  reagents: Reagent[];\n  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;',
    'tests: Test[];\n  setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;'
);
accCode = accCode.replace(
    'employees, setEmployees, reagents,',
    'employees, setEmployees,'
);
accCode = accCode.replace(
    'setDetailedExpenses, reagents, setReagents, attendanceLog,',
    'setDetailedExpenses, setReagents, attendanceLog,'
);
accCode = accCode.replace(
    'setReagents={setReagents} \n            reagents={reagents}\n            availableTests={tests}',
    'setReagents={setReagents} \n            availableTests={tests}'
);
fs.writeFileSync('components/AccountingPage.tsx', accCode);
console.log("Reverted AccountingPage.tsx");

// Reverse DiagnosticAccountsPage.tsx
let diagCode = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');
diagCode = diagCode.replace(
    'patients, doctors, diagnosticSettings, setDiagnosticSettings, performBlockingSync, availableTests = [], reagents = []',
    'patients, doctors, diagnosticSettings, setDiagnosticSettings, performBlockingSync, availableTests = []'
);
diagCode = diagCode.replace(
    `const getSubCategories = (category: string) => {
        let defaultSubs = subCategoryMap[category] || [];
        if (category === 'Reagent buy' || category === 'X-ray Film buy') {
            const reagentNames = reagents.map((r: any) => r.reagent_name).filter(Boolean);
            defaultSubs = [...defaultSubs, ...reagentNames];
        }`,
    `const getSubCategories = (category: string) => {
        const defaultSubs = subCategoryMap[category] || [];`
);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', diagCode);
console.log("Reverted DiagnosticAccountsPage.tsx");

