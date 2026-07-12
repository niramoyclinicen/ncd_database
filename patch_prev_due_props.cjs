const fs = require('fs');
let code = fs.readFileSync('components/PrevDueCollectionPage.tsx', 'utf8');

code = code.replace(
    'interface Props {',
    'interface Props {\n    patients?: Patient[];'
);

code = code.replace(
    'const PrevDueCollectionPage: React.FC<Props> = ({ invoices, setInvoices, dueCollections, setDueCollections, employees, onViewInvoice, performBlockingSync }) => {',
    'const PrevDueCollectionPage: React.FC<Props> = ({ patients = [], invoices, setInvoices, dueCollections, setDueCollections, employees, onViewInvoice, performBlockingSync }) => {'
);

fs.writeFileSync('components/PrevDueCollectionPage.tsx', code);
console.log("Patched props");
