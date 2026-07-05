const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const isSameDayFunc = `
    const isSameDay = (d1: string, d2: string) => {
        if (!d1 || !d2) return false;
        const [y1, m1, day1] = d1.split('T')[0].split('-').map(Number);
        const [y2, m2, day2] = d2.split('T')[0].split('-').map(Number);
        return y1 === y2 && m1 === m2 && day1 === day2;
    };
`;

code = code.replace(
    /const dailyCollectionData = useMemo\(\(\) => \{/,
    `const dailyCollectionData = useMemo(() => {${isSameDayFunc}`
);

// fix getNetDiagCash
code = code.replace(
    /const subsequentDues = dueCollections\.filter\(dc => dc\.invoice_id === inv\.invoice_id && dc\.collection_date !== inv\.invoice_date\)\.reduce\(\(s, dc\) => s \+ dc\.amount_collected, 0\);/g,
    `const subsequentDues = dueCollections.filter(dc => dc.invoice_id === inv.invoice_id && !isSameDay(dc.collection_date, inv.invoice_date)).reduce((s, dc) => s + dc.amount_collected, 0);`
);

// fix diagDue
code = code.replace(
    /if \(\!dc \|\| dc\.collection_date !== dateStr \|\| \!dc\.invoice_id\.startsWith\('INV'\)\) return false;\s*const inv = labInvoices\.find\(i => i\.invoice_id === dc\.invoice_id\);\s*return \!inv \|\| inv\.invoice_date !== dc\.collection_date;/g,
    `if (!dc || !isSameDay(dc.collection_date, dateStr) || !dc.invoice_id.startsWith('INV')) return false;
                const inv = labInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || !isSameDay(inv.invoice_date, dc.collection_date);`
);

// fix clinicDue
code = code.replace(
    /if \(\!dc \|\| dc\.collection_date !== dateStr \|\| dc\.invoice_id\.startsWith\('INV'\)\) return false;\s*const inv = indoorInvoices\.find\(i => i\.invoice_id === dc\.invoice_id\);\s*return \!inv \|\| \(inv\.invoice_date \|\| inv\.admission_date\) !== dc\.collection_date;/g,
    `if (!dc || !isSameDay(dc.collection_date, dateStr) || dc.invoice_id.startsWith('INV')) return false;
                const inv = indoorInvoices.find(i => i.invoice_id === dc.invoice_id);
                return !inv || !isSameDay(inv.invoice_date || inv.admission_date || '', dc.collection_date);`
);


// And for summary:
code = code.replace(
    /const summary = useMemo\(\(\) => \{/,
    `const summary = useMemo(() => {${isSameDayFunc}`
);


// Replace Headers
code = code.replace(
    /<th className="border-2 border-black p-1">Due<\/th>/g,
    `<th className="border-2 border-black p-1">Due Coll.</th>`
);


fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
