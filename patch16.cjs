const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

// Calculate totalDueAmount
code = code.replace(
/    return \(\s*<div className="bg-slate-900 text-slate-200 rounded-xl p-6 space-y-6">/,
`    const totalDueAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.due_amount || 0), 0);

    return (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-6 space-y-6">`
);

// Display it in the header
code = code.replace(
/<div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-700 pb-4 gap-4">\s*<div className="flex gap-4">/,
`<div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-700 pb-4 gap-4">
                <div className="flex gap-4 items-center">`
);

code = code.replace(
/<h2 \s*className=\{\`text-2xl font-bold cursor-pointer transition-colors \$\{activeTab === 'history' \? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'\}\`\}\s*onClick=\{\(\) => setActiveTab\('history'\)\}\s*>\s*Collection History\s*<\/h2>\s*<\/div>/,
`<h2 
                        className={\`text-2xl font-bold cursor-pointer transition-colors \${activeTab === 'history' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}\`}
                        onClick={() => setActiveTab('history')}
                    >
                        Collection History
                    </h2>
                    {activeTab === 'pending' && (
                        <div className="ml-4 bg-red-900/30 border border-red-800 text-red-400 px-4 py-1.5 rounded-lg">
                            <span className="text-sm font-bold uppercase mr-2">Total Due:</span>
                            <span className="text-xl font-black">৳{totalDueAmount.toFixed(2)}</span>
                        </div>
                    )}
                </div>`
);


fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
