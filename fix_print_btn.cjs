const fs = require('fs');
let file = 'components/LabInvoicingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldFunc = 'const handlePrintInvoice = () => {';
const newFunc = 'const handlePrintInvoice = (idToPrint?: string) => {\n    const targetId = typeof idToPrint === "string" ? idToPrint : selectedInvoiceId;\n    if (!targetId) return;';

code = code.replace(oldFunc, newFunc);
code = code.replace(/selectedInvoiceId/g, (match, offset) => {
    // We only want to replace it inside handlePrintInvoice
    // Find the end of handlePrintInvoice
    const funcStart = code.indexOf('const handlePrintInvoice');
    const funcEnd = code.indexOf('const dailyReport = useMemo(() => {');
    if (offset > funcStart && offset < funcEnd) {
        return 'targetId';
    }
    return match;
});

// Now add the print button to the rows
const oldRow = `<td className="p-2 whitespace-nowrap text-right font-mono font-black text-xs text-emerald-600">\${inv.paid_amount}</td>`;
const newRow = `<td className="p-2 whitespace-nowrap text-right font-mono font-black text-xs text-emerald-600">\${inv.paid_amount}</td>
                <td className="p-2 text-center border-l border-slate-200">
                    <button onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv.invoice_id); }} className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded shadow-sm hover:shadow active:scale-95 transition-all">Print</button>
                </td>`;
code = code.replace(oldRow, newRow);

// Also add an empty header column for it
const oldHeader = `<th className="font-black text-[9px] uppercase tracking-widest text-slate-500 text-right p-2 w-[10%]">Paid</th>`;
const newHeader = `<th className="font-black text-[9px] uppercase tracking-widest text-slate-500 text-right p-2 w-[10%]">Paid</th><th className="w-[5%]"></th>`;
code = code.replace(oldHeader, newHeader);


fs.writeFileSync(file, code);
console.log("Updated LabInvoicingPage print function and table.");
