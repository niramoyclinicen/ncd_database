const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
/<div className="bg-slate-200 h-full flex flex-col font-sans overflow-hidden text-black">/,
`<div className="bg-slate-200 flex-1 flex flex-col font-sans overflow-hidden text-black min-h-0">`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
