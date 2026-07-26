const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

code = code.replace(
    `const [viewMode, setViewMode] = useState<'inventory' | 'requisition' | 'ledger' | 'summary'>('inventory');`,
    `const [viewMode, setViewMode] = useState<'inventory' | 'requisition' | 'ledger' | 'summary'>('summary');`
);

fs.writeFileSync('components/ReagentInfoPage.tsx', code);
console.log("Changed default view to summary");
