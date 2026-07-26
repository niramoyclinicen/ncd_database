const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

code = code.replace(
    `reagents={reagents}`,
    `reagents={reagents}\n                setReagents={setReagents}`
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
console.log("Updated DiagnosticPage");
