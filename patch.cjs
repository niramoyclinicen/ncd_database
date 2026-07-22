const fs = require('fs');

let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

// 1. Remove currency symbol and change font-size for Summary Totals
const oldSummaryHead = `<th colSpan={6} className="px-6 py-2 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Summary Totals:</th>
                <th className="px-6 py-2 text-right text-lg font-black text-white">৳ {(tableTotals.total || 0).toFixed(2)}</th>
                <th className="px-6 py-2 text-right text-lg font-black text-emerald-400">৳ {(tableTotals.paid || 0).toFixed(2)}</th>
                <th className="px-6 py-2 text-right text-lg font-black text-rose-400">৳ {(tableTotals.due || 0).toFixed(2)}</th>
                <th colSpan={2} className="px-6 py-2 text-right text-lg font-black text-blue-400 border-l border-slate-700">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Diagnostic Income:</span>
                    ৳ {(tableTotals.income || 0).toFixed(2)}
                </th>`;
const newSummaryHead = `<th colSpan={6} className="px-6 py-2 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Summary Totals:</th>
                <th className="px-6 py-2 text-right text-base font-black text-white">{(tableTotals.total || 0).toFixed(2)}</th>
                <th className="px-6 py-2 text-right text-base font-black text-emerald-400">{(tableTotals.paid || 0).toFixed(2)}</th>
                <th className="px-6 py-2 text-right text-base font-black text-rose-400">{(tableTotals.due || 0).toFixed(2)}</th>
                <th colSpan={2} className="px-6 py-2 text-left text-base font-black text-blue-400 border-l border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Income:</span>
                    {(tableTotals.income || 0).toFixed(2)}
                </th>`;

code = code.replace(oldSummaryHead, newSummaryHead);

// Also need to add yearlyReport logic
const monthlyReportLogic = `const monthlyReport = useMemo(() => {`;
const yearlyReportLogic = `  const yearlyReport = useMemo(() => {
    const currentYear = today.getFullYear();

    const collections = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate.getFullYear() === currentYear && inv.status !== 'Cancelled';
    });

    const refunds = invoices.filter(inv => {
        if (!inv.return_date) return false;
        const retDate = new Date(inv.return_date);
        return retDate.getFullYear() === currentYear && inv.status === 'Returned';
    });

    const summary = collections.reduce((acc, inv) => {
      acc.totalBill += inv.total_amount;
      acc.totalDiscount += inv.discount_amount;
      acc.netPayable += inv.net_payable;
      acc.paidAmount += inv.paid_amount;
      acc.dueAmount += inv.due_amount;
      return acc;
    }, { totalBill: 0, totalDiscount: 0, netPayable: 0, paidAmount: 0, dueAmount: 0 });

    const totalRefunded = refunds.reduce((sum, inv) => sum + inv.paid_amount, 0);
    summary.paidAmount -= totalRefunded;

    return summary;
  }, [invoices, today]);\n\n  const monthlyReport = useMemo(() => {`;

if (!code.includes('const yearlyReport = useMemo(() => {')) {
    code = code.replace(monthlyReportLogic, yearlyReportLogic);
}

const oldGrid = `<h3 className="text-xl font-bold text-slate-100 mb-4 text-center">Daily & Monthly Hishab</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;
const newGrid = `<h3 className="text-xl font-bold text-slate-100 mb-4 text-center">Daily, Monthly & Yearly Hishab</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`;
        
code = code.replace(oldGrid, newGrid);

const yearlyBox = `
          <div className="bg-white text-gray-800 rounded-lg p-5 shadow-md border border-gray-200">
            <p className="text-base font-semibold text-gray-700 mb-3 text-center">For {new Date().getFullYear()}</p>
            <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Bill:</span> <span className="font-bold">{(yearlyReport.totalBill || 0).toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Total Discount:</span> <span className="font-bold">{(yearlyReport.totalDiscount || 0).toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-gray-600">Net Payable:</span> <span className="font-bold">{(yearlyReport.netPayable || 0).toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-green-600">Paid Amount:</span> <span className="font-bold text-green-600">{(yearlyReport.paidAmount || 0).toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium text-red-600">Due Amount:</span> <span className="font-bold text-red-600">{(yearlyReport.dueAmount || 0).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>`;
      
code = code.replace(`</div>\n        </div>\n      </div>`, yearlyBox);

fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log('patched');
