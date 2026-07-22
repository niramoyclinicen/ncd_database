const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

// The yearlyBox was mistakenly injected at the end, replacing the 3 closing divs.
// I will just replace the literal yearlyBox code back with the 3 closing divs.

const wrongYearlyBoxStr = `
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

// First find the last occurrence
const parts = code.split(wrongYearlyBoxStr);
if (parts.length > 1) {
    const lastPart = parts.pop();
    code = parts.join(wrongYearlyBoxStr) + `</div>\n      </div>\n    </div>` + lastPart;
}

fs.writeFileSync('components/LabInvoicingPage.tsx', code);
