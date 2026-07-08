const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// Replace all dc.invoice_id.startsWith with (dc.invoice_id || '').startsWith
code = code.replace(/dc\.invoice_id\.startsWith/g, "(dc.invoice_id || '').startsWith");

// Also replace all dc.invoice_id === with (dc.invoice_id || '') === just to be safe? No, === handles undefined safely.
// Let's also check inv.invoice_date handling

// In dailyCollectionData:
code = code.replace(/dc\.collection_date === dateStr/g, "isSameDay(dc.collection_date, dateStr)");
code = code.replace(/inv\.invoice_date === dateStr/g, "isSameDay(inv.invoice_date, dateStr)");

code = code.replace(/inv\.invoice_date !== dc\.collection_date/g, "!isSameDay(inv.invoice_date, dc.collection_date)");
code = code.replace(/\(inv\.invoice_date \|\| inv\.admission_date\) !== dc\.collection_date/g, "!isSameDay(inv.invoice_date || inv.admission_date, dc.collection_date)");

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
