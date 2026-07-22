const fs = require('fs');
let code = fs.readFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', 'utf8');

code = code.replace(
    'employees, monthlyRoster, editingItem, diagnosticSettings, setDiagnosticSettings, performBlockingSync,',
    'employees, monthlyRoster, editingItem, diagnosticSettings, setDiagnosticSettings, performBlockingSync, reagents,'
);

code = code.replace(
    '<DailyExpenseForm \n                        selectedDate={selectedDate}',
    '<DailyExpenseForm \n                        reagents={reagents}\n                        selectedDate={selectedDate}'
);

fs.writeFileSync('components/diagnostic/DiagnosticAccountsPage.tsx', code);
console.log("Patched reagents.");
