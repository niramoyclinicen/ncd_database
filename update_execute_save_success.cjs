const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

const targetLogic = `            if (success) {
                setDetailedExpenses(newState);
                setEditingItem(null);
                setSuccessMessage("খরচের ডাটা সফলভাবে সেভ হয়েছে।");
            } else {`;
            
const replaceLogic = `            if (success) {
                setDetailedExpenses(newState);
                if (reagentsModified && setReagents) {
                    setReagents(updatedReagents);
                }
                setEditingItem(null);
                setSuccessMessage("খরচের ডাটা সফলভাবে সেভ হয়েছে।");
            } else {`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Updated executeSaveExpense success block");
