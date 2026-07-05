const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');
code = code.replace(
    `<ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} labInvoices={labInvoices} />`,
    `<ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} labInvoices={labInvoices} tests={tests} />`
);
fs.writeFileSync('components/DiagnosticPage.tsx', code);
