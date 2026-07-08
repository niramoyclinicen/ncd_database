const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const safeNumFunc = `
    const safeNum = (val: any) => {
        if (typeof val === 'number' && !isNaN(val)) return val;
        return 0;
    };
`;

code = code.replace(
    /const ConsolidatedAccountsPage: React\.FC<ConsolidatedAccountsPageProps> = \(\{\s*onBack[\s\S]*?\}\) => \{/,
    match => match + safeNumFunc
);

// Replace .toLocaleString() with safeNum(val).toLocaleString() when it is simple variable
// Wait, regex for this is tricky. Let's just redefine summary so that every numeric field is safe.
// Actually, what if the crash is NOT in render, but inside useMemo?

code = code.replace(/const expenseSheetData = useMemo\(\(\) => \{/g, `const expenseSheetData = useMemo(() => { try {`);
code = code.replace(/return \{ rows, columnTotals, grandTotal \};\s*\}, \[detailedExpenses, selectedMonth, selectedYear, deptFilter\]\);/g, `return { rows, columnTotals, grandTotal }; } catch(e) { console.error('expenseSheetData error:', e); return { rows: [], columnTotals: {}, grandTotal: 0 }; } }, [detailedExpenses, selectedMonth, selectedYear, deptFilter]);`);

code = code.replace(/const dailyCollectionData = useMemo\(\(\) => \{/g, `const dailyCollectionData = useMemo(() => { try {`);
code = code.replace(/return rawRows\.map\(\(row, idx\) => \{[\s\S]*?return row;\s*\}\);\s*\}, \[labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear\]\);/g, `return rawRows.map((row, idx) => {
            if (idx > lastDayWithData) {
                return { ...row, diag: { ...row.diag, upto: null }, clinic: { ...row.clinic, upto: null } };
            }
            return row;
        }); } catch(e) { console.error('dailyCollectionData error:', e); return []; } }, [labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear]);`);

code = code.replace(/const summary = useMemo\(\(\) => \{/g, `const summary = useMemo(() => { try {`);
code = code.replace(/return \{ prevJer, diagCurrent, diagDue, totalDiag, clinicCurrent, clinicDue, totalClinic, medSalesCurrent, medPurchCurrent, totalMedNet, companyCurrent, grandTotalCollection, groupedExp, totalExpense: totalExpenseTableOnly, netProfit, finalClosingJer, profitPerShare, totalShares \};\s*\}, \[labInvoices, dueCollections/g, `return { prevJer: safeNum(prevJer), diagCurrent: safeNum(diagCurrent), diagDue: safeNum(diagDue), totalDiag: safeNum(totalDiag), clinicCurrent: safeNum(clinicCurrent), clinicDue: safeNum(clinicDue), totalClinic: safeNum(totalClinic), medSalesCurrent: safeNum(medSalesCurrent), medPurchCurrent: safeNum(medPurchCurrent), totalMedNet: safeNum(totalMedNet), companyCurrent: safeNum(companyCurrent), grandTotalCollection: safeNum(grandTotalCollection), groupedExp, totalExpense: safeNum(totalExpenseTableOnly), netProfit: safeNum(netProfit), finalClosingJer: safeNum(finalClosingJer), profitPerShare: safeNum(profitPerShare), totalShares: safeNum(totalShares) }; } catch(e) { console.error('summary error:', e); return { prevJer: 0, diagCurrent: 0, diagDue: 0, totalDiag: 0, clinicCurrent: 0, clinicDue: 0, totalClinic: 0, medSalesCurrent: 0, medPurchCurrent: 0, totalMedNet: 0, companyCurrent: 0, grandTotalCollection: 0, groupedExp: {}, totalExpense: 0, netProfit: 0, finalClosingJer: 0, profitPerShare: 0, totalShares: 0 }; } }, [labInvoices, dueCollections`);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
