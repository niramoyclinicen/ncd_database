const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');
const target = `<ReagentInfoPage reagents={reagents} setReagents={setReagents} />`;
const replacement = `<ReagentInfoPage reagents={reagents} setReagents={setReagents} detailedExpenses={detailedExpenses} labInvoices={labInvoices} />`;
if (code.includes(target)) {
    fs.writeFileSync('components/DiagnosticPage.tsx', code.replace(target, replacement));
    console.log("Patched successfully");
} else {
    console.log("Target not found!");
}
