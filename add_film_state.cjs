const fs = require('fs');
let code = fs.readFileSync('components/LabInvoicingPage.tsx', 'utf8');

const target = `  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;`;
    
const replacement = `  const [pendingFilmSelections, setPendingFilmSelections] = useState<{test_id: string, test_name: string, film_reagent_id: string}[] | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;`;

code = code.replace(target, replacement);
fs.writeFileSync('components/LabInvoicingPage.tsx', code);
console.log("Added pendingFilmSelections state");
