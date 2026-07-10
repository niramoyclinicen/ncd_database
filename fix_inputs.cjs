const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

// replace w-16 with w-14 for the inputs in the table
code = code.replace(
    'className="w-16 text-right border border-gray-400 rounded text-xs font-normal"',
    'className="w-14 text-right border border-gray-400 rounded text-xs font-normal"'
);
code = code.replace(
    'className="w-16 text-right border border-amber-400 rounded font-bold text-xs"',
    'className="w-14 text-right border border-amber-400 rounded font-bold text-xs"'
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
