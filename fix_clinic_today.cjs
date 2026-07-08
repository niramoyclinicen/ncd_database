const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

code = code.replace(
    /return dateToUse === dateStr && inv\.status !== 'Cancelled' && inv\.status !== 'Returned' && inv\.status !== 'Deleted';/g,
    `return isSameDay(dateToUse, dateStr) && inv.status !== 'Cancelled' && inv.status !== 'Returned' && inv.status !== 'Deleted';`
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
