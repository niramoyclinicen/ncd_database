const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

// I need to add the YearlyBox before "</div>\n      </div>\n\n      <div className=\"mt-8 pt-6 border-t border-slate-700\">"

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
          </div>`;

code = code.replace(
    '            </div>\n          </div>\n        </div>\n      </div>\n\n      <div className="mt-8 pt-6 border-t border-slate-700">',
    '            </div>\n          </div>\n' + yearlyBox + '\n        </div>\n      </div>\n\n      <div className="mt-8 pt-6 border-t border-slate-700">'
);

// We also need to restore the </div>\n        </div>\n      </div> at the end of the file.
// Wait, the end of the file is currently messed up.
