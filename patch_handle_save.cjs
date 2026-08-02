const fs = require('fs');
let content = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

content = content.replace(
    /const newReport: LabReport = \{\n\s*report_id: existing\?\.report_id \|\| \`REP-\$\{selectedInvoiceId\}-\$\{tName\.replace\(\/\\s\+\/g, ''\)\}\`,/,
    `const safeTName = tName || 'UnknownTest';\n             const newReport: LabReport = {\n                 report_id: existing?.report_id || \`REP-\${selectedInvoiceId}-\${safeTName.replace(/\\s+/g, '')}\`,`
);

fs.writeFileSync('components/LabReportingPage.tsx', content);
console.log("Patched tName replace in handleSaveReport");
