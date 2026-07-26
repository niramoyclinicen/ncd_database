const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

code = code.replace(
    `setSuccessMessage\n}) => {`,
    `setSuccessMessage, availableTests\n}) => {`
);

code = code.replace(
    `reagents={reagents}\n                            setReagents={setReagents}\n                        />`,
    `reagents={reagents}\n                            setReagents={setReagents}\n                            availableTests={availableTests}\n                        />`
);

fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated props");
