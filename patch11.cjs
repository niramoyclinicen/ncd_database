const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

// Add activeTab state
code = code.replace(
/const \[collectionDateInput, setCollectionDateInput\] = useState\(\(\) => \{/,
`const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [collectionDateInput, setCollectionDateInput] = useState(() => {`
);

// Add Tab switch UI
code = code.replace(
/<h2 className="text-2xl font-bold text-sky-100">Diagnostic Due Recovery<\/h2>/,
`<div className="flex gap-4">
                    <h2 
                        className={\`text-2xl font-bold cursor-pointer transition-colors \${activeTab === 'pending' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}\`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Due Recovery
                    </h2>
                    <h2 
                        className={\`text-2xl font-bold cursor-pointer transition-colors \${activeTab === 'history' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}\`}
                        onClick={() => setActiveTab('history')}
                    >
                        Collection History
                    </h2>
                </div>`
);

// Now for the history table, we need to conditionally render the table.
// Find the table container: `<div className="overflow-x-auto rounded-lg border border-slate-700">`
code = code.replace(
/<div className="overflow-x-auto rounded-lg border border-slate-700">\s*<table className="w-full text-left">/,
`{activeTab === 'pending' && (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left">`
);

// We need to close the `pending` table and render the `history` table
code = code.replace(
/<\/table>\s*<\/div>\s*\{showModal && selectedInvoice/,
`</table>
            </div>
            )}
            
            {activeTab === 'history' && (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black">
                        <tr>
                            <th className="p-4">Collection Date</th>
                            <th className="p-4">Invoice ID</th>
                            <th className="p-4">Patient Name</th>
                            <th className="p-4">Collected By</th>
                            <th className="p-4 text-right text-green-400">Amount Collected</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {dueCollections
                            .filter(dc => dc.invoice_id.startsWith('INV'))
                            .sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())
                            .filter(dc => {
                                const inv = invoices.find(i => i.invoice_id === dc.invoice_id);
                                const matchName = filterPatientName ? (inv?.patient_name || '').toLowerCase().includes(filterPatientName.toLowerCase()) : true;
                                const matchId = searchTerm ? dc.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                                const [y, m, d] = (dc.collection_date || '').split(' ')[0].split('-');
                                const matchY = filterYear ? y === filterYear : true;
                                const matchM = filterMonth ? parseInt(m) === parseInt(filterMonth) : true;
                                const matchD = filterDay ? parseInt(d) === parseInt(filterDay) : true;
                                return matchName && matchId && matchY && matchM && matchD;
                            })
                            .slice(0, 100) // limit to 100 recent for performance
                            .map((dc) => {
                                const inv = invoices.find(i => i.invoice_id === dc.invoice_id);
                                return (
                                <tr 
                                    key={dc.collection_id}
                                    className="hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="p-4 text-sm">{dc.collection_date}</td>
                                    <td className="p-4 font-mono text-sky-400">{dc.invoice_id}</td>
                                    <td className="p-4 font-bold">{inv ? inv.patient_name : 'Unknown'}</td>
                                    <td className="p-4 text-sm">{dc.collected_by}</td>
                                    <td className="p-4 text-right text-green-400 font-black">৳{(dc.amount_collected || 0).toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => inv && handlePrintReceipt(inv, dc.amount_collected, dc.collection_date)} 
                                            className="bg-indigo-600 px-4 py-1.5 rounded-md text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                                            disabled={!inv}
                                        >
                                            Print Receipt
                                        </button>
                                    </td>
                                </tr>
                            )})}
                    </tbody>
                </table>
            </div>
            )}

            {showModal && selectedInvoice`
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
