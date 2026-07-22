const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

code = code.replace(
    '<LabReportingPage \n                performBlockingSync={performBlockingSync}\n                invoices={labInvoices}',
    '<LabReportingPage \n                invoices={labInvoices}'
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
console.log("Fixed DiagnosticPage");
