const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// We find all instances of .toLocaleString() and ensure the subject is a safe number
// It's tricky to do universally with regex because the subject could be a complex expression.
// Let's just create a safe print function and replace .toLocaleString() calls with it where possible, or just be careful.

// Let's replace `row.diag.total.toLocaleString()` with `safeNum(row.diag.total).toLocaleString()`
code = code.replace(/\b([a-zA-Z0-9_.[\]]+?)\.toLocaleString\(\)/g, "safeNum($1).toLocaleString()");

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
