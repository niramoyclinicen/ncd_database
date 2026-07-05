const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// Replace diagCurrent
code = code.replace(
/const diagCurrent = labInvoices\.filter\(inv => inv && isSelectedMonth\(inv\.invoice_date\) && inv\.status !== 'Cancelled' && inv\.status !== 'Returned' && inv\.status !== 'Deleted'\)\.reduce\(\(s, inv\) => s \+ getNetDiagCash\(inv\), 0\);/,
`const diagCurrent = labInvoices.filter(inv => inv && isSelectedMonth(inv.invoice_date) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted').reduce((s, inv) => s + getNetDiagCash(inv), 0) + 
            dueCollections.filter(dc => {
                if (!dc || !isSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return inv && isSelectedMonth(inv.invoice_date) && inv.invoice_date !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);`
);

// Replace diagDue
code = code.replace(
/const diagDue = dueCollections\.filter\(dc => \{\s*if \(!dc \|\| !isSelectedMonth\(dc\.collection_date\) \|\| !dc\.invoice_id\.startsWith\('INV'\)\) return false;\s*const inv = labInvoices\.find\(i => i\.invoice_id === dc\.invoice_id\);\s*return !inv \|\| inv\.invoice_date !== dc\.collection_date;\s*\}\)\.reduce\(\(s, dc\) => s \+ dc\.amount_collected, 0\);/,
`const diagDue = dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || !dc.invoice_id.startsWith('INV')) return false;
            const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || !isSelectedMonth(inv.invoice_date);
        }).reduce((s, dc) => s + dc.amount_collected, 0);`
);

// Replace clinicCurrent (wait, in code it's `const clinicCurrent = clinicRevenueCurrent;`)
code = code.replace(
/const clinicCurrent = clinicRevenueCurrent;/,
`const clinicCurrent = clinicRevenueCurrent + 
            dueCollections.filter(dc => {
                if (!dc || !isSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return inv && isSelectedMonth(inv.invoice_date || inv.admission_date) && (inv.invoice_date || inv.admission_date) !== dc.collection_date;
            }).reduce((s, dc) => s + dc.amount_collected, 0);`
);

// Replace clinicDue
code = code.replace(
/const clinicDue = dueCollections\.filter\(dc => \{\s*if \(!dc \|\| !isSelectedMonth\(dc\.collection_date\) \|\| dc\.invoice_id\.startsWith\('INV'\)\) return false;\s*const inv = indoorInvoices\.find\(i => i\.invoice_id === dc\.invoice_id\);\s*return !inv \|\| \(inv\.invoice_date \|\| inv\.admission_date\) !== dc\.collection_date;\s*\}\)\.reduce\(\(s, dc\) => s \+ dc\.amount_collected, 0\);/,
`const clinicDue = dueCollections.filter(dc => {
            if (!dc || !isSelectedMonth(dc.collection_date) || dc.invoice_id.startsWith('INV')) return false;
            const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
            return !inv || !isSelectedMonth(inv.invoice_date || inv.admission_date);
        }).reduce((s, dc) => s + dc.amount_collected, 0);`
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
