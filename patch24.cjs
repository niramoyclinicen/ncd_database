const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
/const MasterPadHeader = \(\) => \(\s*<div className="header p-8 border-b-2 border-slate-950 flex justify-between items-start shrink-0 mb-6">\s*<div className="flex gap-4">\s*<div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">\s*<svg xmlns="http:\/\/www.w3.org\/2000\/svg" className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"\/><\/svg>\s*<\/div>\s*<div>\s*<h1 className="text-2xl font-black text-blue-900 leading-tight uppercase tracking-tighter">Niramoy Clinic & Diagnostic<\/h1>/,
`const MasterPadHeader = () => (
    <div className="header p-8 border-b-2 border-slate-950 flex justify-between items-start shrink-0 mb-6">
        <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
                <h1 className="text-2xl font-black text-blue-900 leading-tight uppercase tracking-tighter">Niramoy Clinic & Diagnostic</h1>`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
