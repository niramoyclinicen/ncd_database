const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
    /className="w-\[240px\] shrink-0 bg-white border-r flex flex-col shadow-sm no-print min-h-0"/g,
    `className="w-[220px] shrink-0 bg-white border-r flex flex-col shadow-sm no-print min-h-0"`
);

code = code.replace(
    /className="w-\[240px\] shrink-0 bg-slate-100 border-r flex flex-col shadow-inner no-print"/g,
    `className="w-[220px] shrink-0 bg-slate-100 border-r flex flex-col shadow-inner no-print"`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
