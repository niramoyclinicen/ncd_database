const fs = require('fs');
let file = 'components/LabInvoicingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const errorLine = 'const targetId = typeof idToPrint === "string" ? idToPrint : targetId;';
const correctLine = 'const targetId = typeof idToPrint === "string" ? idToPrint : selectedInvoiceId;';

code = code.replace(errorLine, correctLine);

fs.writeFileSync(file, code);
console.log("Fixed LabInvoicingPage reference error.");
