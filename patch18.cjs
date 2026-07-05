const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

code = code.replace(
/<div className="w-full h-full">/,
`<div className="w-full h-full flex flex-col min-h-0">`
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
