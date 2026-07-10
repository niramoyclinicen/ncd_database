const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const newCode = `
    const statusReportData = useMemo(() => { try {
        return dailyCollectionData.map((collRow, idx) => {
            const expRow = dailyExpenseReportData[idx] || { diag: { today: 0 }, clinic: { today: 0 }, total: 0 };
            
            const diagColl = collRow.diag?.total || 0;
            const clinicColl = collRow.clinic?.total || 0;
            const totalColl = diagColl + clinicColl;
            
            const diagExp = expRow.diag?.today || 0;
            const clinicExp = expRow.clinic?.today || 0;
            const totalExp = expRow.total || 0;
            
            let balance = null;
            if (totalColl > 0 || totalExp > 0 || diagColl > 0 || clinicColl > 0 || diagExp > 0 || clinicExp > 0) {
                balance = totalColl - totalExp;
            }
            
            return {
                date: collRow.date,
                diagColl,
                clinicColl,
                totalColl,
                diagExp,
                clinicExp,
                totalExp,
                balance
            };
        });
    } catch (e) { console.error('statusReportData error:', e); return []; } }, [dailyCollectionData, dailyExpenseReportData]);
`;

code = code.replace("    const summary = useMemo(() => { try {", newCode + "\n    const summary = useMemo(() => { try {");
fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
