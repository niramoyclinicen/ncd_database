const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
/<div className="flex-1 overflow-y-auto bg-slate-200 custom-scrollbar relative">/,
`<div className="flex-1 overflow-y-auto bg-slate-200 custom-scrollbar relative min-h-0">`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
