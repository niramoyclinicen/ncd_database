const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

code = code.replace(
    "import { LabInvoice, Employee, DueCollection } from './DiagnosticData';",
    "import { LabInvoice, Employee, DueCollection, Patient } from './DiagnosticData';"
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
console.log("Patched import");
