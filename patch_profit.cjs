const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

const newStates = `    const updateAdjustment = (field: 'profitDist' | 'houseRent' | 'loanInstallment', val: number) => {
        setMonthlyAdjustments(prev => ({
            ...prev,
            [currentMonthKey]: {
                ...(prev[currentMonthKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 }),
                [field]: val
            }
        }));
    };

    const [profitShareReportType, setProfitShareReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
    const [profitShareYearStr, setProfitShareYearStr] = useState<string>(new Date().getFullYear().toString());
    const [profitShareStartDate, setProfitShareStartDate] = useState<string>('');
    const [profitShareEndDate, setProfitShareEndDate] = useState<string>('');

    let profitShareTitle = \`\${monthOptions[selectedMonth].name} \${selectedYear}\`;
    let profitShareKey = currentMonthKey;
    if (profitShareReportType === 'yearly') {
        profitShareTitle = \`Yearly Report - \${profitShareYearStr}\`;
        profitShareKey = \`yearly-\${profitShareYearStr}\`;
    } else if (profitShareReportType === 'custom') {
        profitShareTitle = \`Custom Report (\${profitShareStartDate} to \${profitShareEndDate})\`;
        profitShareKey = \`custom-\${profitShareStartDate}_\${profitShareEndDate}\`;
    }

    const profitShareAdj = monthlyAdjustments[profitShareKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 };
    const updateProfitShareAdjustment = (field: 'profitDist', val: number) => {
        setMonthlyAdjustments(prev => ({
            ...prev,
            [profitShareKey]: {
                ...(prev[profitShareKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 }),
                [field]: val
            }
        }));
    };

    const profitShareTotalShares = dynamicShareholders.reduce((sum, s) => sum + s.shares, 0);
    const profitSharePerShare = profitShareTotalShares > 0 ? profitShareAdj.profitDist / profitShareTotalShares : 0;`;

content = content.replace(
    /    const updateAdjustment = \(field: 'profitDist' \| 'houseRent' \| 'loanInstallment', val: number\) => \{\s+setMonthlyAdjustments\(prev => \(\{\s+\.\.\.prev,\s+\[currentMonthKey\]: \{\s+\.\.\.\(prev\[currentMonthKey\] \|\| \{ profitDist: 0, houseRent: 0, loanInstallment: 0 \}\),\s+\[field\]: val\s+\}\s+\}\)\);\s+\};/,
    newStates
);

fs.writeFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', content);
console.log("Done phase 1");
