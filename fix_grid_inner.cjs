const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

const target = `        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">`;
      
const yearlyBox = `          <div className="bg-white text-gray-800 rounded-lg p-5 shadow-md border border-gray-200">
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
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">`;

// Be careful, only replace the first occurrence after Monthly.
// We can just use split and join.
if (code.includes('grid-cols-1 md:grid-cols-3')) {
    // Already changed the grid to 3 columns
    if (!code.includes('For {new Date().getFullYear()}')) {
        const parts = code.split(target);
        if (parts.length > 1) {
            code = parts[0] + yearlyBox + parts.slice(1).join(target);
        }
    }
}

fs.writeFileSync('components/LabInvoicingPage.tsx', code);
