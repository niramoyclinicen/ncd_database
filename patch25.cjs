const fs = require('fs');
let code = fs.readFileSync('components/LabReportingPage.tsx', 'utf8');

code = code.replace(
    /className="grid grid-cols-12 flex-1 overflow-hidden min-h-0"/,
    `className="flex flex-1 overflow-hidden min-h-0"`
);

code = code.replace(
    /className="col-span-2 bg-white border-r flex flex-col shadow-sm no-print min-h-0"/,
    `className="w-[240px] shrink-0 bg-white border-r flex flex-col shadow-sm no-print min-h-0"`
);

code = code.replace(
    /className="col-span-2 bg-slate-100 border-r flex flex-col shadow-inner no-print"/,
    `className="w-[240px] shrink-0 bg-slate-100 border-r flex flex-col shadow-inner no-print"`
);

code = code.replace(
    /className="col-span-8 bg-slate-200 flex flex-col relative overflow-hidden min-h-0"/,
    `className="flex-1 bg-slate-200 flex flex-col relative overflow-hidden min-h-0"`
);

code = code.replace(
    /\{invoices\.filter\(\(i: any\) => i\.patient_name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\| i\.invoice_id\.includes\(searchTerm\)\)\.map\(\(r: any\) => \{[\s\S]*?const isActive = selectedInvoiceId === r\.invoice_id;[\s\S]*?return \([\s\S]*?<div key=\{r\.invoice_id\} onClick=\{.*?\} className=\{\`p-3 border-2 rounded-2xl cursor-pointer transition-all \$\{isActive \? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-white hover:border-blue-200'\}\`\}>[\s\S]*?<div className=\{\`font-black text-\[11px\] uppercase tracking-tight \$\{isActive \? 'text-white' : 'text-slate-900'\}\`\}>\{r\.patient_name\}<\/div>[\s\S]*?<div className="flex justify-between items-center mt-2">[\s\S]*?<span className=\{\`text-\[9px\] font-mono \$\{isActive \? 'text-white\/70' : 'text-slate-500'\}\`\}>\{r\.invoice_id\}<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}\)\}/,
    `{invoices.filter((i: any) => i.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || i.invoice_id.includes(searchTerm)).map((r: any) => {
                            const isActive = selectedInvoiceId === r.invoice_id;
                            const pat = patients.find((p: any) => p.pt_id === r.patient_id);
                            return (
                                <div key={r.invoice_id} onClick={() => handleSelectInvoice(r.invoice_id)} className={\`p-3 border-2 rounded-2xl cursor-pointer transition-all \${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-white hover:border-blue-200'}\`}>
                                    <div className={\`font-black text-[11px] uppercase tracking-tight \${isActive ? 'text-white' : 'text-slate-900'}\`}>{r.patient_name}</div>
                                    <div className={\`text-[9px] mt-1 font-bold \${isActive ? 'text-blue-100' : 'text-slate-600'}\`}>
                                        {pat?.age ? \`Age: \${pat.age}\` : ''} {pat?.address ? \`| \${pat.address}\` : ''}
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={\`text-[9px] font-mono \${isActive ? 'text-white/70' : 'text-slate-500'}\`}>{r.invoice_id}</span>
                                    </div>
                                </div>
                            );
                        })}`
);

fs.writeFileSync('components/LabReportingPage.tsx', code);
