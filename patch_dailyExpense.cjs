const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const injectCode = `
    const dailyExpenseReportData = useMemo(() => { try {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const rawRows = [];
        let diagUpto = 0;
        let clinicUpto = 0;
        let lastDayWithData = -1;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = \`\${selectedYear}-\${String(selectedMonth + 1).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
            const dailyExps = detailedExpenses[dateStr] || [];
            
            let diagToday = 0;
            let clinicToday = 0;

            dailyExps.forEach(ex => {
                if (ex.isDeleted) return;
                let cat = ex.category;
                if (cat === 'House rent') cat = 'House rent';
                
                const isClinic = ex.dept === 'Clinic' || (!ex.dept && clinicExpenseCategories.includes(cat) && !diagExpenseCategories.includes(cat));
                // default to diag if not clinic explicitly
                const isDiag = !isClinic;

                if (isClinic) {
                    clinicToday += (ex.paidAmount || 0);
                } else {
                    diagToday += (ex.paidAmount || 0);
                }
            });

            diagUpto += diagToday;
            clinicUpto += clinicToday;

            if (diagToday > 0 || clinicToday > 0) {
                lastDayWithData = d - 1;
            }

            const displayDate = \`\${String(d).padStart(2, '0')}-\${monthOptions[selectedMonth].name.substring(0, 3)}-\${String(selectedYear).substring(2)}\`;
            rawRows.push({
                date: displayDate,
                diag: { today: diagToday, upto: diagUpto },
                clinic: { today: clinicToday, upto: clinicUpto },
                total: diagToday + clinicToday
            });
        }
        
        return rawRows.map((row, idx) => {
            if (idx > lastDayWithData) {
                return { ...row, diag: { ...row.diag, upto: null }, clinic: { ...row.clinic, upto: null } };
            }
            return row;
        });
    } catch(e) { console.error('dailyExpenseReportData error:', e); return []; } }, [detailedExpenses, selectedMonth, selectedYear]);
`;

// Insert it right after the dailyCollectionData useMemo block
code = code.replace(
    /\} catch\(e\) \{ console\.error\('dailyCollectionData error:', e\); return \[\]; \} \}, \[labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear\]\);/,
    "} catch(e) { console.error('dailyCollectionData error:', e); return []; } }, [labInvoices, indoorInvoices, dueCollections, detailedExpenses, selectedMonth, selectedYear]);\n" + injectCode
);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
