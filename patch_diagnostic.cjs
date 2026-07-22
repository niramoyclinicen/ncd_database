const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

// 1. LabReportingPage
code = code.replace(
    '<LabReportingPage \n                invoices={labInvoices}',
    '<LabReportingPage \n                performBlockingSync={performBlockingSync}\n                invoices={labInvoices}'
);

// 2. ReagentInfoPage
code = code.replace(
    '<ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} labInvoices={labInvoices} tests={tests} />',
    '<ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} labInvoices={labInvoices} tests={tests} performBlockingSync={performBlockingSync} />'
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
console.log("Patched DiagnosticPage.tsx");
