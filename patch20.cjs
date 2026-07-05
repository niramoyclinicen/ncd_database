const fs = require('fs');
let code = fs.readFileSync('components/DiagnosticPage.tsx', 'utf8');

code = code.replace(
/<div className=\{\`flex-1 \$\{activeTab === 'lab_reporting' \? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'\} bg-slate-900\/50 relative\`\}>/,
`<div className={\`flex-1 flex flex-col min-h-0 \${activeTab === 'lab_reporting' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'} bg-slate-900/50 relative\`}>`
);

code = code.replace(
/<div className="w-full h-full flex flex-col min-h-0">/,
`<div className="w-full flex-1 flex flex-col min-h-0">`
);

fs.writeFileSync('components/DiagnosticPage.tsx', code);
