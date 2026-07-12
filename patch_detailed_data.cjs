const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

const hookTarget = 'const filteredHistory = (() => {';

const detailedDataCode = `    const detailedPendingData = React.useMemo(() => {
        let maxPayments = 0;
        const items = filteredInvoices.map(inv => {
            const dcs = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id).sort((a, b) => new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime());
            const sumDcs = dcs.reduce((sum, dc) => sum + (dc.amount_collected || 0), 0);
            
            let payments = [];
            const initialPaid = (inv.paid_amount || 0) - sumDcs;
            if (initialPaid > 0) {
                payments.push({ date: inv.invoice_date?.split(' ')[0] || '', amount: initialPaid });
            }
            dcs.forEach(dc => {
                if(dc.amount_collected > 0) {
                    payments.push({ date: dc.collection_date?.split(' ')[0] || '', amount: dc.amount_collected });
                }
            });
            
            if (payments.length > maxPayments) {
                maxPayments = payments.length;
            }

            const patientObj = patients?.find(p => p.pt_id === inv.patient_id);
            const addressParts = patientObj ? [patientObj.address, patientObj.thana, patientObj.district].filter(Boolean).join(', ') : '';

            return {
                ...inv,
                payments,
                addressStr: addressParts
            };
        });
        return { items, maxPayments };
    }, [filteredInvoices, dueCollections, patients]);

`;

code = code.replace(hookTarget, detailedDataCode + hookTarget);
fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
console.log("Added detailedPendingData");
