const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
/className="grid grid-cols-12 flex-1 overflow-hidden"/,
`className="grid grid-cols-12 flex-1 overflow-hidden min-h-0"`
);

code = code.replace(
/className="col-span-8 bg-slate-200 flex flex-col relative overflow-hidden"/,
`className="col-span-8 bg-slate-200 flex flex-col relative overflow-hidden min-h-0"`
);

code = code.replace(
/className="col-span-2 bg-white border-r flex flex-col shadow-sm no-print"/,
`className="col-span-2 bg-white border-r flex flex-col shadow-sm no-print min-h-0"`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
