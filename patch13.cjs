const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

// Add handlePrintList
const printFunc = `
    const handlePrintList = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        
        let contentHtml = '';
        let totalDue = 0;
        
        if (activeTab === 'pending') {
            contentHtml = filteredInvoices.map((inv, index) => {
                totalDue += (inv.due_amount || 0);
                return \`
                    <tr>
                        <td style="text-align:center">\${index + 1}</td>
                        <td>\${inv.invoice_date}</td>
                        <td>\${inv.invoice_id}</td>
                        <td>\${inv.patient_name}</td>
                        <td style="text-align:right">৳\${(inv.total_amount || 0).toFixed(2)}</td>
                        <td style="text-align:right">৳\${(inv.paid_amount || 0).toFixed(2)}</td>
                        <td style="text-align:right; font-weight:bold; color:red;">৳\${(inv.due_amount || 0).toFixed(2)}</td>
                    </tr>
                \`;
            }).join('');
        }
        
        const html = \`<html><head>
            <style>
                @page{size:A4 portrait; margin:15mm} 
                body{font-family:sans-serif;} 
                .box{padding:15px;} 
                .h1{font-size:24px; font-weight:bold; margin:0; text-align:center;} 
                .text-center{text-align:center;}
                table{width:100%; border-collapse:collapse; margin-top: 20px;} 
                td, th{padding:8px; text-align:left; border: 1px solid #000;}
                th { background-color: #eee; }
            </style>
        </head><body><div class="box">
            <div class="h1">Niramoy Clinic & Diagnostic</div>
            <p class="text-center">Enayetpur, Sirajgonj | Mobile: 01730 923007</p>
            <hr>
            <h3 class="text-center">DUE LIST (PENDING)</h3>
            
            <table>
                <thead>
                    <tr>
                        <th style="text-align:center; width: 40px;">SL</th>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Patient Name</th>
                        <th style="text-align:right">Total</th>
                        <th style="text-align:right">Paid</th>
                        <th style="text-align:right">Due</th>
                    </tr>
                </thead>
                <tbody>
                    \${contentHtml}
                    <tr>
                        <td colspan="6" style="text-align:right; font-weight:bold;">Total Due Amount:</td>
                        <td style="text-align:right; font-weight:bold; font-size:16px;">৳\${totalDue.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top:40px; text-align:right">
                <b>Printed By:</b> ${'` + "${collectedBy || \'\'}` + `'} <br><br>
                ..........................
            </div>
        </div></body></html>\`;
        
        win.document.write(html); 
        win.document.close(); 
        win.setTimeout(() => { win.print(); }, 300);
    };
`;

code = code.replace(
/const filteredInvoices = useMemo/,
printFunc + '\n    const filteredInvoices = useMemo'
);

// Add the Print List Button
code = code.replace(
/<\/div>\s*<\/div>\s*<\/div>\s*\{activeTab === 'pending' && \(/,
`    <button onClick={handlePrintList} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-lg whitespace-nowrap">
                            Print List
                        </button>
                    </div>
                </div>
            </div>
            {activeTab === 'pending' && (`
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
