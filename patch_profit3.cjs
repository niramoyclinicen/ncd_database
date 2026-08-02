const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

const target = `const profitShareAdj = monthlyAdjustments[profitShareKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 };`;
const replacement = `const profitShareAdj = useMemo(() => {
        if (profitShareReportType === 'monthly') {
            return monthlyAdjustments[currentMonthKey] || { profitDist: 0, houseRent: 0, loanInstallment: 0 };
        } else if (profitShareReportType === 'yearly') {
            let total = 0;
            for (let i = 0; i < 12; i++) {
                const k = \`\${profitShareYearStr}-\${i}\`;
                if (monthlyAdjustments[k]) total += (monthlyAdjustments[k].profitDist || 0);
            }
            return { profitDist: total, houseRent: 0, loanInstallment: 0 };
        } else if (profitShareReportType === 'custom') {
            let total = 0;
            if (profitShareStartDate && profitShareEndDate) {
                const s = new Date(profitShareStartDate);
                const e = new Date(profitShareEndDate);
                Object.keys(monthlyAdjustments).forEach(k => {
                    const match = k.match(/^(\\d{4})-(\\d{1,2})$/);
                    if (match) {
                        const y = parseInt(match[1]);
                        const m = parseInt(match[2]);
                        const mDate = new Date(y, m, 15);
                        if (mDate >= s && mDate <= e) {
                            total += (monthlyAdjustments[k].profitDist || 0);
                        }
                    }
                });
            }
            return { profitDist: total, houseRent: 0, loanInstallment: 0 };
        }
        return { profitDist: 0, houseRent: 0, loanInstallment: 0 };
    }, [profitShareReportType, currentMonthKey, profitShareYearStr, profitShareStartDate, profitShareEndDate, monthlyAdjustments]);`;

content = content.replace(target, replacement);
fs.writeFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', content);
console.log("Done profitShareAdj replace");
