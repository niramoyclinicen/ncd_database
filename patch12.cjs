const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

// Add discountAmount state
code = code.replace(
/const \[collectionAmount, setCollectionAmount\] = useState<number>\(0\);/,
`const [collectionAmount, setCollectionAmount] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);`
);

// Reset discountAmount when opening modal
code = code.replace(
/setCollectionAmount\(0\);/g,
`setCollectionAmount(0); setDiscountAmount(0);`
);

// Update condition in handleConfirmCollection
code = code.replace(
/if \(!selectedInvoice \|\| collectionAmount <= 0 \|\| collectionAmount > selectedInvoice\.due_amount \+ 0\.1\) \{/,
`if (!selectedInvoice || collectionAmount < 0 || discountAmount < 0 || (collectionAmount === 0 && discountAmount === 0) || (collectionAmount + discountAmount) > selectedInvoice.due_amount + 0.1) {`
);

// Update logic in handleConfirmCollection
code = code.replace(
/const newCol: DueCollection = \{ collection_id: \`DC-\$\{Date\.now\(\)\}\`, invoice_id: selectedInvoice\.invoice_id, collection_date: collectionDate, amount_collected: collectionAmount, collected_by: collectedBy, payment_method: 'Cash' \};\s*const updatedInvoice: LabInvoice = \{ \.\.\.selectedInvoice, paid_amount: selectedInvoice\.paid_amount \+ collectionAmount, due_amount: selectedInvoice\.due_amount - collectionAmount, status: \(selectedInvoice\.due_amount - collectionAmount\) <= 0\.5 \? 'Paid' : 'Due', last_modified: collectionDate \};\s*const newCols = \[\.\.\.dueCollections, newCol\];/,
`const newCols = [...dueCollections];
        if (collectionAmount > 0) {
            newCols.push({ collection_id: \`DC-\$\{Date.now()\}\`, invoice_id: selectedInvoice.invoice_id, collection_date: collectionDate, amount_collected: collectionAmount, collected_by: collectedBy, payment_method: 'Cash' });
        }
        
        const updatedInvoice: LabInvoice = { 
            ...selectedInvoice, 
            paid_amount: selectedInvoice.paid_amount + collectionAmount, 
            discount_amount: (selectedInvoice.discount_amount || 0) + discountAmount,
            due_amount: selectedInvoice.due_amount - (collectionAmount + discountAmount), 
            status: (selectedInvoice.due_amount - (collectionAmount + discountAmount)) <= 0.5 ? 'Paid' : 'Due', 
            last_modified: collectionDate 
        };`
);

// Add Discount input field in UI
code = code.replace(
/<div><label className="text-xs text-slate-500 uppercase font-black">Amount to Pay<\/label><input type="number" value=\{collectionAmount \|\| ''\} onChange=\{e => setCollectionAmount\(parseFloat\(e\.target\.value\)\)\} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-xl font-bold" autoFocus \/><\/div>/,
`<div><label className="text-xs text-slate-500 uppercase font-black">Amount to Pay (৳)</label><input type="number" value={collectionAmount === 0 ? '' : collectionAmount} onChange={e => setCollectionAmount(e.target.value ? parseFloat(e.target.value) : 0)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-xl font-bold" autoFocus /></div>
                            <div><label className="text-xs text-slate-500 uppercase font-black">Waive/Discount (মওকুফ) (৳)</label><input type="number" value={discountAmount === 0 ? '' : discountAmount} onChange={e => setDiscountAmount(e.target.value ? parseFloat(e.target.value) : 0)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-xl font-bold" /></div>`
);

// Add Serial Number column to Pending table
code = code.replace(
/<thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black"><tr><th className="p-4">Date<\/th>/,
`<thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black"><tr><th className="p-4 w-12 text-center">SL</th><th className="p-4">Date</th>`
);

code = code.replace(
/\{filteredInvoices\.map\(\(inv\) => \(/,
`{filteredInvoices.map((inv, index) => (`
);

code = code.replace(
/<tr\s*key=\{inv\.invoice_id\}/,
`<tr 
                                 key={inv.invoice_id}`
);

code = code.replace(
/<td className="p-4 text-sm">\{inv\.invoice_date\}<\/td>/,
`<td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                                <td className="p-4 text-sm">{inv.invoice_date}</td>`
);

// Add Serial Number column to History table
code = code.replace(
/<thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black">\s*<tr>\s*<th className="p-4">Collection Date<\/th>/,
`<thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black">
                        <tr>
                            <th className="p-4 w-12 text-center">SL</th>
                            <th className="p-4">Collection Date</th>`
);

code = code.replace(
/\.map\(\(dc\) => \{/,
`.map((dc, index) => {`
);

code = code.replace(
/<td className="p-4 text-sm">\{dc\.collection_date\}<\/td>/,
`<td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                                    <td className="p-4 text-sm">{dc.collection_date}</td>`
);


fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
