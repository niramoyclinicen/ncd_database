const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

const targetStart = `<thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black"><tr><th className="p-4 w-12 text-center">SL</th><th className="p-4">Date</th><th className="p-4">Invoice ID</th><th className="p-4">Patient</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right text-red-400">Due</th><th className="p-4 text-center">Action</th></tr></thead>`;
const targetEnd = `                        ))}
                    </tbody>`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd, startIndex) + targetEnd.length;

if(startIndex === -1 || endIndex < startIndex) {
    console.error("Could not find the block");
    process.exit(1);
}

const originalBlock = code.substring(startIndex, endIndex);

const newBlock = `{(() => {
                        let totalBillSum = 0;
                        let totalDueSum = 0;
                        let paymentsSum = new Array(detailedPendingData.maxPayments).fill(0);
                        
                        return (
                            <>
                                <thead className="bg-slate-800 text-slate-400 text-xs uppercase font-black">
                                    <tr>
                                        <th className="p-4 w-12 text-center">SL</th>
                                        <th className="p-4">Invoice ID</th>
                                        <th className="p-4">Patient Name & Address</th>
                                        <th className="p-4 text-right whitespace-nowrap">Total <br/><span className="text-[9px] font-normal opacity-70">(After Disc)</span></th>
                                        {Array.from({length: detailedPendingData.maxPayments}).map((_, i) => (
                                            <th key={i} className="p-4 text-right">Paid_{String(i+1).padStart(2, '0')}</th>
                                        ))}
                                        <th className="p-4 text-right text-red-400">Due</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {detailedPendingData.items.map((inv, index) => {
                                        const netPayable = (inv.total_amount || 0) - (inv.discount_amount || 0);
                                        totalBillSum += netPayable;
                                        totalDueSum += (inv.due_amount || 0);
                                        
                                        return (
                                            <tr 
                                                key={inv.invoice_id} 
                                                onDoubleClick={() => onViewInvoice && onViewInvoice(inv.invoice_id)}
                                                className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                                title="Double click to view invoice details"
                                            >
                                                <td className="p-4 text-center font-bold text-slate-500">{index + 1}</td>
                                                <td className="p-4 font-mono text-sky-400 whitespace-nowrap">{inv.invoice_id}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-200">{inv.patient_name}</div>
                                                    {inv.addressStr && <div className="text-xs text-slate-500 mt-0.5">{inv.addressStr}</div>}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="font-bold">৳{netPayable.toFixed(2)}</div>
                                                    {inv.discount_amount > 0 && <div className="text-[10px] text-slate-500">(Disc: ৳{inv.discount_amount.toFixed(2)})</div>}
                                                </td>
                                                {Array.from({length: detailedPendingData.maxPayments}).map((_, i) => {
                                                    const p = inv.payments[i];
                                                    if (p) {
                                                        paymentsSum[i] += p.amount;
                                                        return (
                                                            <td key={i} className="p-4 text-right">
                                                                <div className="text-xs text-slate-400 mb-0.5 whitespace-nowrap">{p.date}</div>
                                                                <div className="font-bold text-green-400">৳{p.amount.toFixed(2)}</div>
                                                            </td>
                                                        );
                                                    }
                                                    return <td key={i} className="p-4 text-right"></td>;
                                                })}
                                                <td className="p-4 text-right text-red-500 font-black">৳{(inv.due_amount || 0).toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); setShowModal(true); setCollectionAmount(0); setDiscountAmount(0); }} className="bg-green-600 px-4 py-1.5 rounded-md text-xs font-bold text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20">Collect</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {detailedPendingData.items.length > 0 && (
                                        <tr className="bg-slate-800/80 font-black uppercase text-xs">
                                            <td colSpan={3} className="p-4 text-right text-slate-300">Total:</td>
                                            <td className="p-4 text-right text-white">৳{totalBillSum.toFixed(2)}</td>
                                            {Array.from({length: detailedPendingData.maxPayments}).map((_, i) => (
                                                <td key={i} className="p-4 text-right text-green-400">৳{paymentsSum[i].toFixed(2)}</td>
                                            ))}
                                            <td className="p-4 text-right text-red-400 text-sm">৳{totalDueSum.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        );
                    })()}`;

code = code.replace(originalBlock, newBlock);
fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
console.log("Patched UI table");
