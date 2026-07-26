const fs = require('fs');

let diagPage = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');
diagPage = diagPage.replace(
    `const [rows, setRows] = useState([{ id: Date.now(), reagentId: '', qty: 1, unitPrice: 0 }]);`,
    `const [rows, setRows] = useState(() => [{ id: Date.now(), reagentId: '', qty: 1, unitPrice: 0 }]);`
);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', diagPage);
console.log("Fixed DiagnosticAccountsPage.tsx");

