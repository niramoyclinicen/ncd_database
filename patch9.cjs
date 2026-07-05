const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// Replace getNetDiagCash
code = code.replace(/const getNetDiagCash = \(inv: LabInvoice\) => \{[\s\S]*?return inv.paid_amount - usgFee - labFee - commPaid;\s*\};/g, `const getNetDiagCash = (inv: LabInvoice) => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const usgFee = items.reduce((s, it) => s + ((it.usg_exam_charge || 0) * (it.quantity || 0)), 0);
            const labFee = items.reduce((s, it) => s + ((it.extra_lab_fee || 0) * (it.quantity || 0)), 0);
            const commPaid = inv.commission_paid || 0;
            const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && dc.collection_date !== inv.invoice_date).reduce((s, dc) => s + dc.amount_collected, 0);
            const initialPaid = inv.paid_amount - subsequentDues;
            return initialPaid - usgFee - labFee - commPaid;
        };`);

// Replace clinic income logic which is similar
code = code.replace(/return inv\.paid_amount - pcAmount - specialDiscount - netIncomeForInv;/g, `const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && dc.collection_date !== (inv.invoice_date || inv.admission_date)).reduce((s, dc) => s + dc.amount_collected, 0);
                const initialPaid = inv.paid_amount - subsequentDues;
                return initialPaid - pcAmount - specialDiscount - netIncomeForInv;`);

// Replace diagDue logic
code = code.replace(/dueCollections\.filter\(dc => dc && dc\.collection_date === dateStr && dc\.invoice_id\.startsWith\('INV'\)\)/g, 
`dueCollections.filter(dc => {
                if (!dc || dc.collection_date !== dateStr || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || inv.invoice_date !== dc.collection_date;
            })`);

// Replace clinicDue logic
code = code.replace(/dueCollections\.filter\(dc => dc && dc\.collection_date === dateStr && !dc\.invoice_id\.startsWith\('INV'\)\)/g,
`dueCollections.filter(dc => {
                if (!dc || dc.collection_date !== dateStr || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || (inv.invoice_date || inv.admission_date) !== dc.collection_date;
            })`);

// Handle the monthly/yearly ones where dateStr is not used, but isSelectedMonth or isBeforeSelectedMonth is used.
code = code.replace(/dueCollections\.filter\(dc => dc && isBeforeSelectedMonth\(dc\.collection_date\) && dc\.invoice_id\.startsWith\('INV'\)\)/g,
`dueCollections.filter(dc => {
                if (!dc || !isBeforeSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || inv.invoice_date !== dc.collection_date;
            })`);

code = code.replace(/dueCollections\.filter\(dc => dc && isBeforeSelectedMonth\(dc\.collection_date\) && !dc\.invoice_id\.startsWith\('INV'\)\)/g,
`dueCollections.filter(dc => {
                if (!dc || !isBeforeSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || (inv.invoice_date || inv.admission_date) !== dc.collection_date;
            })`);
            
code = code.replace(/dueCollections\.filter\(dc => dc && isSelectedMonth\(dc\.collection_date\) && dc\.invoice_id\.startsWith\('INV'\)\)/g,
`dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
            const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || inv.invoice_date !== dc.collection_date;
        })`);

code = code.replace(/dueCollections\.filter\(dc => dc && isSelectedMonth\(dc\.collection_date\) && !dc\.invoice_id\.startsWith\('INV'\)\)/g,
`dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
            const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || (inv.invoice_date || inv.admission_date) !== dc.collection_date;
        })`);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
