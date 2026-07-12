const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

const targetStart = `        if (activeTab === 'pending') {`;
const targetEnd = `        } else if (activeTab === 'history') {`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd, startIndex);

if(startIndex === -1 || endIndex === -1) {
    console.error("Could not find the block");
    process.exit(1);
}

const newBlock = `        if (activeTab === 'pending') {
            reportTitle = 'DUE LIST (PENDING)';
            pageStyle = '@page{size:A4 landscape; margin:10mm}';
            
            let totalBillSum = 0;
            let totalDueSum = 0;
            let paymentsSum = new Array(detailedPendingData.maxPayments).fill(0);
            
            let paymentHeaders = '';
            for(let i=0; i<detailedPendingData.maxPayments; i++) {
                paymentHeaders += \`<th style="text-align:right">Paid_\${String(i+1).padStart(2, '0')}</th>\`;
            }
            
            theadHtml = \`
                <tr>
                    <th style="text-align:center; width: 40px;">SL</th>
                    <th>Invoice ID</th>
                    <th>Patient Name & Address</th>
                    <th style="text-align:right">Total (After Discount)</th>
                    \${paymentHeaders}
                    <th style="text-align:right">Due</th>
                </tr>
            \`;
            
            contentHtml = detailedPendingData.items.map((inv, index) => {
                const netPayable = (inv.total_amount || 0) - (inv.discount_amount || 0);
                totalBillSum += netPayable;
                totalDueSum += (inv.due_amount || 0);
                
                let paymentCols = '';
                for(let i=0; i<detailedPendingData.maxPayments; i++) {
                    const p = inv.payments[i];
                    if (p) {
                        paymentsSum[i] += p.amount;
                        paymentCols += \`<td style="text-align:right; white-space:nowrap;">\${p.date}<br/><b>৳\${p.amount.toFixed(2)}</b></td>\`;
                    } else {
                        paymentCols += \`<td></td>\`;
                    }
                }
                
                const discountText = inv.discount_amount > 0 ? \`<br/><span style="font-size:10px; color:#555;">(Disc: ৳\${inv.discount_amount.toFixed(2)})</span>\` : '';
                const patientInfo = inv.addressStr ? \`<b>\${inv.patient_name}</b><br/><span style="font-size:11px; color:#444;">\${inv.addressStr}</span>\` : \`<b>\${inv.patient_name}</b>\`;
                
                return \`
                    <tr>
                        <td style="text-align:center">\${index + 1}</td>
                        <td style="white-space:nowrap">\${inv.invoice_id}</td>
                        <td>\${patientInfo}</td>
                        <td style="text-align:right; font-weight:bold;">৳\${netPayable.toFixed(2)}\${discountText}</td>
                        \${paymentCols}
                        <td style="text-align:right; font-weight:bold; color:red;">৳\${(inv.due_amount || 0).toFixed(2)}</td>
                    </tr>
                \`;
            }).join('');
            
            let paymentFooters = '';
            for(let i=0; i<detailedPendingData.maxPayments; i++) {
                paymentFooters += \`<td style="text-align:right; font-weight:bold;">৳\${paymentsSum[i].toFixed(2)}</td>\`;
            }
            
            tfootHtml = \`
                <tr>
                    <td colspan="3" style="text-align:right; font-weight:bold;">Total:</td>
                    <td style="text-align:right; font-weight:bold;">৳\${totalBillSum.toFixed(2)}</td>
                    \${paymentFooters}
                    <td style="text-align:right; font-weight:bold; font-size:16px; color:red;">৳\${totalDueSum.toFixed(2)}</td>
                </tr>
            \`;
`;

code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
console.log("Patched print list");
