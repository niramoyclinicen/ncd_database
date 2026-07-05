const fs = require('fs');
let code = fs.readFileSync('components/ReagentInfoPage.tsx', 'utf8');

const target1 = `interface ReagentInfoPageProps {
    reagents: Reagent[];
    setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;
}`;
const replace1 = `interface ReagentInfoPageProps {
    reagents: Reagent[];
    setReagents: React.Dispatch<React.SetStateAction<Reagent[]>>;
    detailedExpenses?: any;
    labInvoices?: any;
}`;

const target2 = `const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents }) => {
    const [viewMode, setViewMode] = useState<'inventory' | 'requisition'>('inventory');`;
const replace2 = `const ReagentInfoPage: React.FC<ReagentInfoPageProps> = ({ reagents, setReagents, detailedExpenses, labInvoices }) => {
    const [viewMode, setViewMode] = useState<'inventory' | 'requisition' | 'ledger'>('inventory');
    const [ledgerReagentId, setLedgerReagentId] = useState<string | null>(null);
    const [ledgerStartDate, setLedgerStartDate] = useState<string>('');
    const [ledgerEndDate, setLedgerEndDate] = useState<string>('');
    
    // Ledger Calculation
    const getReagentLedger = (reagentId: string) => {
        const reagent = reagents.find(r => r.reagent_id === reagentId);
        if (!reagent) return { items: [], currentStock: 0 };
        
        let stock = 0;
        const ledgerItems: any[] = [];
        
        // 1. Manual updates (Initial / Resets)
        if (reagent.manualStockUpdates) {
            reagent.manualStockUpdates.forEach(update => {
                ledgerItems.push({
                    date: update.date,
                    type: 'MANUAL_SET',
                    description: update.note || 'Manual Stock Update',
                    qtyChange: update.quantity - stock,
                    resultingStock: update.quantity
                });
                stock = update.quantity;
            });
        } else {
             // Fallback to initial quantity if no manual records but it has a stock
             ledgerItems.push({
                date: 'Initial',
                type: 'INITIAL',
                description: 'Initial System Stock',
                qtyChange: reagent.quantity,
                resultingStock: reagent.quantity
             });
             stock = reagent.quantity;
        }

        // 2. Purchases (from detailedExpenses)
        if (detailedExpenses) {
            Object.entries(detailedExpenses).forEach(([date, expenses]: [string, any]) => {
                expenses.forEach((exp: any) => {
                    if ((exp.category === 'Reagent buy' || exp.category === 'X-ray Film buy') && exp.subCategory === reagent.reagent_name) {
                        const qtyAdded = (exp.metadata?.numberOfBoxes || 0) * (exp.metadata?.quantityPerBox || 0);
                        if (qtyAdded > 0) {
                            stock += qtyAdded;
                            ledgerItems.push({
                                date,
                                type: 'PURCHASE',
                                description: 'Purchase (' + (exp.description || '') + ')',
                                qtyChange: qtyAdded,
                                resultingStock: stock
                            });
                        }
                    }
                });
            });
        }
        
        // 3. Usage (from labInvoices)
        // This requires tests to be linked to lab invoices. We don't have tests here, but we can assume usage from somewhere?
        // Actually, without \`tests\` passed to ReagentInfoPage, we can't easily parse LabInvoices to see which tests use this reagent.
        // I need to patch DiagnosticPage to pass tests as well!
        
        return { items: ledgerItems.sort((a,b) => a.date.localeCompare(b.date)), currentStock: stock };
    };`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
fs.writeFileSync('components/ReagentInfoPage.tsx', code);
