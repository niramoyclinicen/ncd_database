const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

if(code.includes('patients={patients}') && code.includes('<PrevDueCollectionPage')) {
    // maybe it already has it?
}

code = code.replace(
    '<PrevDueCollectionPage \n                invoices={labInvoices}',
    '<PrevDueCollectionPage \n                patients={patients}\n                invoices={labInvoices}'
);
code = code.replace(
    '<PrevDueCollectionPage \n                                invoices={labInvoices}',
    '<PrevDueCollectionPage \n                                patients={patients}\n                                invoices={labInvoices}'
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
console.log("Patched DiagnosticPage");
